import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { N8nClient } from '../api-client.js';
import { configManager } from '../config.js';
import { loadWorkflowFromFile, findWorkflowFiles } from '../workflow-manager.js';
import { DeployOptions } from '../types.js';

/**
 * Merge IDs from existing workflow into source workflow
 * This allows deploying same source to different environments with environment-specific IDs
 */
function mergeIdsFromExisting(sourceWorkflow: any, existingWorkflow: any): any {
  const merged = { ...sourceWorkflow };
  
  // Merge workflow ID
  merged.id = existingWorkflow.id;
  
  // Merge node IDs by matching node names
  if (merged.nodes && existingWorkflow.nodes) {
    const existingNodeMap = new Map(existingWorkflow.nodes.map((n: any) => [n.name, n]));
    
    merged.nodes = merged.nodes.map((sourceNode: any) => {
      const existingNode: any = existingNodeMap.get(sourceNode.name);
      if (existingNode) {
        return {
          ...sourceNode,
          id: existingNode.id,
          // Merge webhookId if exists
          ...(existingNode.webhookId && { webhookId: existingNode.webhookId }),
          // Merge credential IDs by name
          credentials: sourceNode.credentials ? mergeCredentialIds(sourceNode.credentials, existingNode.credentials) : sourceNode.credentials,
        };
      }
      return sourceNode; // New node, no ID to merge
    });
  }
  
  return merged;
}

/**
 * Merge credential IDs from existing node into source node credentials
 */
function mergeCredentialIds(sourceCredentials: any, existingCredentials: any): any {
  if (!sourceCredentials || !existingCredentials) {
    return sourceCredentials;
  }
  
  const merged: any = {};
  Object.keys(sourceCredentials).forEach(credKey => {
    const sourceCred = sourceCredentials[credKey];
    const existingCred = existingCredentials[credKey];
    
    if (sourceCred && existingCred && sourceCred.name === existingCred.name) {
      // Same credential name - use existing ID
      merged[credKey] = {
        id: existingCred.id,
        name: existingCred.name,
      };
    } else {
      // Different credential or new - keep source (will need manual setup)
      merged[credKey] = sourceCred;
    }
  });
  
  return merged;
}

async function deployWorkflow(
  client: N8nClient,
  filePath: string,
  projectRoot: string,
  dryRun: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const sourceWorkflow = await loadWorkflowFromFile(filePath);
    const relativePath = filePath.replace(projectRoot + '/', '');

    if (dryRun) {
      return {
        success: true,
        message: `Would deploy: ${relativePath}`,
      };
    }

    // Check if workflow exists by name (IDs are NOT in source control)
    const existingWorkflows = await client.listWorkflows();
    const existingWorkflow = existingWorkflows.find((w) => w.name === sourceWorkflow.name);

    if (existingWorkflow && existingWorkflow.id) {
      // Workflow exists - fetch full details and merge IDs
      const existingFull = await client.getWorkflow(existingWorkflow.id);
      
      // Merge environment-specific IDs from existing into source
      const workflowToUpdate = mergeIdsFromExisting(sourceWorkflow, existingFull);
      
      // Update workflow
      await client.updateWorkflow(existingFull.id!, workflowToUpdate);

      // Update workflow tags if they exist
      if (sourceWorkflow.tags && sourceWorkflow.tags.length > 0) {
        const existingTags = await client.listTags();
        const tagNameToId = new Map(existingTags.map((tag) => [tag.name, tag.id]));

        const tagIds: string[] = [];
        for (const tag of sourceWorkflow.tags) {
          const tagName = tag.name;
          if (tagNameToId.has(tagName)) {
            tagIds.push(tagNameToId.get(tagName)!);
          } else {
            const newTag = await client.createTag(tagName);
            tagIds.push(newTag.id);
          }
        }

        await client.updateWorkflowTags(existingFull.id!, tagIds);
      }

      return {
        success: true,
        message: `Updated: ${relativePath} (ID: ${existingFull.id})`,
      };
    }

    // Workflow doesn't exist - create it as inactive for safety
    // n8n will generate all IDs (workflow, nodes, webhooks, etc.)
    const workflowToCreate = {
      ...sourceWorkflow,
      active: false, // Always create inactive
    };
    
    const created = await client.createWorkflow(workflowToCreate);

    // Update workflow tags if they exist
    if (sourceWorkflow.tags && sourceWorkflow.tags.length > 0 && created.id) {
      const existingTags = await client.listTags();
      const tagNameToId = new Map(existingTags.map((tag) => [tag.name, tag.id]));

      const tagIds: string[] = [];
      for (const tag of sourceWorkflow.tags) {
        const tagName = tag.name;
        if (tagNameToId.has(tagName)) {
          tagIds.push(tagNameToId.get(tagName)!);
        } else {
          const newTag = await client.createTag(tagName);
          tagIds.push(newTag.id);
        }
      }

      await client.updateWorkflowTags(created.id, tagIds);
    }

    return {
      success: true,
      message: `Created: ${relativePath} (ID: ${created.id}) [inactive - manually verify credentials and activate]`,
    };
  } catch (error) {
    const relativePath = filePath.replace(projectRoot + '/', '');
    return {
      success: false,
      message: `Failed: ${relativePath} - ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function deployCommandHandler(options: DeployOptions): Promise<void> {
  const spinner = ora('Loading configuration...').start();

  try {
    const config = await configManager.loadConfig(options.environment);
    spinner.succeed(`Loaded configuration for ${chalk.cyan(options.environment)} environment`);

    if (options.dryRun) {
      console.log(chalk.yellow('DRY RUN MODE - No changes will be made'));
    }

    spinner.start('Connecting to n8n API...');
    const client = new N8nClient(config);
    const isConnected = await client.testConnection();

    if (!isConnected) {
      spinner.fail('Failed to connect to n8n API');
      console.error(chalk.red('Check your API URL and API key configuration'));
      process.exit(1);
    }

    spinner.succeed('Connected to n8n API');

    // Determine what to deploy
    const projectRoot = configManager.getProjectRoot();
    let filesToDeploy: string[] = [];

    if (options.workflow) {
      // Check if workflow is a specific file
      if (options.workflow.endsWith('.json')) {
        const targetPath = path.isAbsolute(options.workflow)
          ? options.workflow
          : path.join(projectRoot, options.workflow);
        filesToDeploy = [targetPath];
      } else {
        // Workflow is a category
        filesToDeploy = await findWorkflowFiles(projectRoot, options.workflow);
      }
    } else {
      // Deploy all workflows
      filesToDeploy = await findWorkflowFiles(projectRoot);
    }

    if (filesToDeploy.length === 0) {
      spinner.info('No workflow files found to deploy');
      return;
    }

    console.log(chalk.bold(`\nDeploying ${filesToDeploy.length} workflow(s)...\n`));

    const results = {
      success: 0,
      failed: 0,
      messages: [] as string[],
    };

    if (options.parallel && filesToDeploy.length > 1) {
      // Parallel deployment
      spinner.start('Deploying workflows in parallel...');
      const promises = filesToDeploy.map((file) =>
        deployWorkflow(client, file, projectRoot, options.dryRun || false)
      );
      const outcomes = await Promise.all(promises);

      outcomes.forEach((outcome) => {
        if (outcome.success) {
          results.success++;
          console.log(chalk.green(`✓ ${outcome.message}`));
        } else {
          results.failed++;
          console.log(chalk.red(`✗ ${outcome.message}`));
        }
      });

      spinner.stop();
    } else {
      // Sequential deployment
      for (const file of filesToDeploy) {
        const outcome = await deployWorkflow(client, file, projectRoot, options.dryRun || false);

        if (outcome.success) {
          results.success++;
          console.log(chalk.green(`✓ ${outcome.message}`));
        } else {
          results.failed++;
          console.log(chalk.red(`✗ ${outcome.message}`));
        }
      }
    }

    console.log('');
    console.log(chalk.bold('Summary:'));
    console.log(`  ${chalk.green('✓')} Success: ${results.success}`);
    if (results.failed > 0) {
      console.log(`  ${chalk.red('✗')} Failed: ${results.failed}`);
    }

    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Deploy failed');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

export const deployCommand = new Command('deploy')
  .description('Deploy workflows to n8n instance (uses N8N_API_URL and N8N_API_KEY)')
  .argument('[workflow]', 'Specific workflow file to deploy (optional)')
  .option('--dry-run', 'Preview changes without applying them')
  .option('--parallel', 'Deploy workflows in parallel for faster execution')
  .action(async (workflow?: string, options?: any) => {
    const deployOptions: DeployOptions = {
      environment: 'default',
      workflow,
      dryRun: options?.dryRun || false,
      parallel: options?.parallel || false,
    };
    await deployCommandHandler(deployOptions);
  });
