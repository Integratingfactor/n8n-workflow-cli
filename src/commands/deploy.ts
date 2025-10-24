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
 * Remove read-only fields from workflow before saving to file
 * These fields are managed by n8n and cause unnecessary diffs in source control
 */
function cleanWorkflowForSaving(workflow: any): any {
  const fieldsToRemove = ['createdAt', 'updatedAt', 'versionId', 'isArchived'];
  const cleaned = { ...workflow };
  fieldsToRemove.forEach((field) => delete cleaned[field]);
  return cleaned;
}

async function deployWorkflow(
  client: N8nClient,
  filePath: string,
  projectRoot: string,
  dryRun: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const workflow = await loadWorkflowFromFile(filePath);
    const relativePath = filePath.replace(projectRoot + '/', '');

    if (dryRun) {
      return {
        success: true,
        message: `Would deploy: ${relativePath}`,
      };
    }

    if (workflow.id) {
      // Try to update existing workflow
      try {
        const updated = await client.updateWorkflow(workflow.id, workflow);

        // Update workflow tags if they exist
        if (workflow.tags && workflow.tags.length > 0) {
          // Get all existing tags
          const existingTags = await client.listTags();

          // Create a map of tag names to IDs
          const tagNameToId = new Map(existingTags.map((tag) => [tag.name, tag.id]));

          // Process each tag - create if it doesn't exist
          const tagIds: string[] = [];
          for (const tag of workflow.tags) {
            const tagName = tag.name;
            if (tagNameToId.has(tagName)) {
              tagIds.push(tagNameToId.get(tagName)!);
            } else {
              const newTag = await client.createTag(tagName);
              tagIds.push(newTag.id);
            }
          }

          // Assign all tags to the workflow
          await client.updateWorkflowTags(workflow.id, tagIds);
        }

        return {
          success: true,
          message: `Updated: ${relativePath} (ID: ${updated.id})`,
        };
      } catch (error: any) {
        // If workflow was deleted from n8n (404), create it as new
        if (error.statusCode === 404 || error.message?.includes('Not Found')) {
          const oldId = workflow.id;
          const wasActive = workflow.active === true;
          const created = await client.createWorkflow(workflow);

          // Update local file with new ID
          workflow.id = created.id;
          const fs = await import('fs/promises');
          const cleanedWorkflow = cleanWorkflowForSaving(workflow);
          await fs.writeFile(filePath, JSON.stringify(cleanedWorkflow, null, 2) + '\n', 'utf-8');

          // Update workflow tags if they exist
          if (workflow.tags && workflow.tags.length > 0 && created.id) {
            const existingTags = await client.listTags();
            const tagNameToId = new Map(existingTags.map((tag) => [tag.name, tag.id]));

            const tagIds: string[] = [];
            for (const tag of workflow.tags) {
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

          // Activate workflow if it was active before
          if (wasActive && created.id) {
            await client.activateWorkflow(created.id);
          }

          return {
            success: true,
            message: `Recreated: ${relativePath} (old ID: ${oldId}, new ID: ${created.id})${wasActive ? ' [activated]' : ''}`,
          };
        }
        // Re-throw other errors
        throw error;
      }
    } else {
      // No ID in local file - check if workflow exists by name
      const existingWorkflows = await client.listWorkflows();
      const existingWorkflow = existingWorkflows.find((w) => w.name === workflow.name);

      if (existingWorkflow && existingWorkflow.id) {
        // Found existing workflow with same name - update it
        const updated = await client.updateWorkflow(existingWorkflow.id, workflow);

        // Read the original workflow file and add the ID field
        const fs = await import('fs/promises');
        const originalContent = await fs.readFile(filePath, 'utf-8');
        const workflowData = JSON.parse(originalContent);
        workflowData.id = existingWorkflow.id;

        // Update local file with the ID (cleaned of read-only fields)
        const cleanedWorkflow = cleanWorkflowForSaving(workflowData);
        await fs.writeFile(filePath, JSON.stringify(cleanedWorkflow, null, 2) + '\n', 'utf-8');

        // Update workflow tags if they exist
        if (workflow.tags && workflow.tags.length > 0) {
          const existingTags = await client.listTags();
          const tagNameToId = new Map(existingTags.map((tag) => [tag.name, tag.id]));

          const tagIds: string[] = [];
          for (const tag of workflow.tags) {
            const tagName = tag.name;
            if (tagNameToId.has(tagName)) {
              tagIds.push(tagNameToId.get(tagName)!);
            } else {
              const newTag = await client.createTag(tagName);
              tagIds.push(newTag.id);
            }
          }

          await client.updateWorkflowTags(existingWorkflow.id, tagIds);
        }

        return {
          success: true,
          message: `Updated: ${relativePath} (found by name, ID: ${updated.id})`,
        };
      }

      // Create new workflow
      const wasActive = workflow.active === true;
      const created = await client.createWorkflow(workflow);

      // Update local file with new ID
      workflow.id = created.id;
      const fs = await import('fs/promises');
      const cleanedWorkflow = cleanWorkflowForSaving(workflow);
      await fs.writeFile(filePath, JSON.stringify(cleanedWorkflow, null, 2) + '\n', 'utf-8');

      // Update workflow tags if they exist
      if (workflow.tags && workflow.tags.length > 0 && created.id) {
        // Get all existing tags
        const existingTags = await client.listTags();

        // Create a map of tag names to IDs
        const tagNameToId = new Map(existingTags.map((tag) => [tag.name, tag.id]));

        // Process each tag - create if it doesn't exist
        const tagIds: string[] = [];
        for (const tag of workflow.tags) {
          const tagName = tag.name;
          if (tagNameToId.has(tagName)) {
            tagIds.push(tagNameToId.get(tagName)!);
          } else {
            const newTag = await client.createTag(tagName);
            tagIds.push(newTag.id);
          }
        }

        // Assign all tags to the workflow
        await client.updateWorkflowTags(created.id, tagIds);
      }

      // Activate workflow if it was active before
      if (wasActive && created.id) {
        await client.activateWorkflow(created.id);
      }

      return {
        success: true,
        message: `Created: ${relativePath} (ID: ${created.id})${wasActive ? ' [activated]' : ''}`,
      };
    }
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

    if (options.target) {
      // Check if target is a specific file
      if (options.target.endsWith('.json')) {
        const targetPath = path.isAbsolute(options.target)
          ? options.target
          : path.join(projectRoot, options.target);
        filesToDeploy = [targetPath];
      } else {
        // Target is a category
        filesToDeploy = await findWorkflowFiles(projectRoot, options.target);
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
