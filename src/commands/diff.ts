import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import { N8nClient } from '../api-client.js';
import { configManager } from '../config.js';
import { loadWorkflowFromFile, findWorkflowFiles, determineCategory, cleanWorkflowForStorage } from '../workflow-manager.js';

interface DiffOptions {
  environment: string;
  workflow?: string;
}

interface DiffResult {
  name: string;
  status: 'modified' | 'local-only' | 'remote-only' | 'identical';
  details?: string[];
}

/**
 * Compare two workflow objects and return differences
 * Note: Both workflows should be cleaned before comparison to ignore environment-specific fields
 */
function compareWorkflows(local: any, remote: any): string[] {
  const differences: string[] = [];

  // Compare basic properties
  if (local.name !== remote.name) {
    differences.push(`Name: "${local.name}" vs "${remote.name}"`);
  }

  // Compare nodes count
  const localNodeCount = local.nodes?.length || 0;
  const remoteNodeCount = remote.nodes?.length || 0;
  if (localNodeCount !== remoteNodeCount) {
    differences.push(`Nodes: ${localNodeCount} vs ${remoteNodeCount}`);
  }

  // Compare node details
  if (local.nodes && remote.nodes) {
    const localNodeMap = new Map(local.nodes.map((n: any) => [n.name, n]));
    const remoteNodeMap = new Map(remote.nodes.map((n: any) => [n.name, n]));

    // Check for added/removed nodes
    const localNodeNames = new Set(local.nodes.map((n: any) => n.name));
    const remoteNodeNames = new Set(remote.nodes.map((n: any) => n.name));

    localNodeNames.forEach((name) => {
      if (!remoteNodeNames.has(name)) {
        differences.push(`Node added locally: "${name}"`);
      }
    });

    remoteNodeNames.forEach((name) => {
      if (!localNodeNames.has(name)) {
        differences.push(`Node added remotely: "${name}"`);
      }
    });

    // Check for modified nodes (same name, different config)
    localNodeNames.forEach((name) => {
      if (remoteNodeNames.has(name)) {
        const localNode: any = localNodeMap.get(name);
        const remoteNode: any = remoteNodeMap.get(name);
        
        if (localNode.type !== remoteNode.type) {
          differences.push(`Node "${name}" type: ${localNode.type} vs ${remoteNode.type}`);
        }
        if (localNode.disabled !== remoteNode.disabled) {
          differences.push(`Node "${name}" disabled: ${localNode.disabled} vs ${remoteNode.disabled}`);
        }
        // Could add more detailed parameter comparison here
      }
    });
  }

  // Compare settings
  if (JSON.stringify(local.settings) !== JSON.stringify(remote.settings)) {
    differences.push('Settings differ');
  }

  // Compare tags
  const localTags = local.tags?.map((t: any) => t.name).sort() || [];
  const remoteTags = remote.tags?.map((t: any) => t.name).sort() || [];
  if (JSON.stringify(localTags) !== JSON.stringify(remoteTags)) {
    differences.push(`Tags: [${localTags.join(', ')}] vs [${remoteTags.join(', ')}]`);
  }

  return differences;
}

async function diffWorkflow(
  client: N8nClient,
  localFilePath: string,
  projectRoot: string
): Promise<DiffResult> {
  try {
    const localWorkflow = await loadWorkflowFromFile(localFilePath);
    const relativePath = localFilePath.replace(projectRoot + '/', '');

    // Find remote workflow by name
    const remoteWorkflows = await client.listWorkflows();
    const remoteWorkflow = remoteWorkflows.find((w) => w.name === localWorkflow.name);

    if (!remoteWorkflow) {
      return {
        name: localWorkflow.name,
        status: 'local-only',
        details: [`File: ${relativePath}`],
      };
    }

    // Fetch full remote workflow
    const remoteWorkflowFull = await client.getWorkflow(remoteWorkflow.id!);

    // Clean both workflows to ignore environment-specific fields before comparison
    // This ensures we only compare the actual workflow definition, not runtime state
    const localCleaned = cleanWorkflowForStorage(localWorkflow);
    const remoteCleaned = cleanWorkflowForStorage(remoteWorkflowFull);

    // Compare workflows
    const differences = compareWorkflows(localCleaned, remoteCleaned);

    if (differences.length === 0) {
      return {
        name: localWorkflow.name,
        status: 'identical',
      };
    }

    return {
      name: localWorkflow.name,
      status: 'modified',
      details: differences,
    };
  } catch (error) {
    throw error;
  }
}

async function diffCommandHandler(options: DiffOptions): Promise<void> {
  const spinner = ora('Loading configuration...').start();

  try {
    const config = await configManager.loadConfig(options.environment);
    spinner.succeed(`Loaded configuration for ${chalk.cyan(options.environment)} environment`);

    spinner.start('Connecting to n8n API...');
    const client = new N8nClient(config);
    const isConnected = await client.testConnection();

    if (!isConnected) {
      spinner.fail('Failed to connect to n8n API');
      console.error(chalk.red('Check your API URL and API key configuration'));
      process.exit(1);
    }

    spinner.succeed('Connected to n8n API');

    const projectRoot = configManager.getProjectRoot();
    const categories = configManager.getCategories();

    // Determine which workflows to compare
    let filesToCompare: string[] = [];
    let filterCategory: string | undefined;
    let specificWorkflowName: string | undefined;

    if (options.workflow) {
      // Compare specific workflow
      if (options.workflow.endsWith('.json')) {
        const workflowPath = path.isAbsolute(options.workflow)
          ? options.workflow
          : path.join(projectRoot, options.workflow);
        filesToCompare = [workflowPath];
        // Extract workflow name to filter remote workflows
        const workflow = await loadWorkflowFromFile(workflowPath);
        specificWorkflowName = workflow.name;
      } else {
        // Treat as category
        filesToCompare = await findWorkflowFiles(projectRoot, options.workflow);
        filterCategory = options.workflow;
      }
    } else {
      // Compare all workflows
      filesToCompare = await findWorkflowFiles(projectRoot);
    }

    if (filesToCompare.length === 0) {
      spinner.info('No workflow files found to compare');
      return;
    }

    spinner.start(`Comparing ${filesToCompare.length} workflow(s)...`);

    const results: DiffResult[] = [];

    for (const file of filesToCompare) {
      try {
        const result = await diffWorkflow(client, file, projectRoot);
        results.push(result);
      } catch (error) {
        const relativePath = file.replace(projectRoot + '/', '');
        results.push({
          name: path.basename(file, '.json'),
          status: 'local-only',
          details: [`File: ${relativePath}`, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        });
      }
    }

    // Check for remote-only workflows
    spinner.text = 'Checking for remote-only workflows...';
    const remoteWorkflows = await client.listWorkflows();
    const localWorkflowNames = new Set(
      results.map((r) => r.name)
    );

    for (const remoteWf of remoteWorkflows) {
      // Skip if we already have this workflow in results
      if (localWorkflowNames.has(remoteWf.name)) {
        continue;
      }

      // If filtering by specific workflow name, skip others
      if (specificWorkflowName && remoteWf.name !== specificWorkflowName) {
        continue;
      }

      // Check if workflow has matching category tag
      const remoteWfFull = await client.getWorkflow(remoteWf.id!);
      const category = determineCategory(remoteWfFull, categories);
      
      // Skip if no category match
      if (!category) {
        continue;
      }

      // If filtering by category, only include workflows in that category
      if (filterCategory && category !== filterCategory) {
        continue;
      }

      // Add to results as remote-only
      results.push({
        name: remoteWf.name,
        status: 'remote-only',
        details: [`Category: ${category}`, `ID: ${remoteWf.id}`],
      });
    }

    spinner.succeed('Comparison complete');

    // Display results
    console.log('');
    console.log(chalk.bold('Workflow Comparison Results:'));
    console.log('');

    const modified = results.filter((r) => r.status === 'modified');
    const localOnly = results.filter((r) => r.status === 'local-only');
    const remoteOnly = results.filter((r) => r.status === 'remote-only');
    const identical = results.filter((r) => r.status === 'identical');

    if (modified.length > 0) {
      console.log(chalk.yellow.bold(`Modified (${modified.length}):`));
      modified.forEach((r) => {
        console.log(chalk.yellow(`  ⚠ ${r.name}`));
        r.details?.forEach((detail) => {
          console.log(chalk.gray(`      ${detail}`));
        });
      });
      console.log('');
    }

    if (localOnly.length > 0) {
      console.log(chalk.blue.bold(`Local Only (${localOnly.length}):`));
      localOnly.forEach((r) => {
        console.log(chalk.blue(`  ↑ ${r.name}`));
        r.details?.forEach((detail) => {
          console.log(chalk.gray(`      ${detail}`));
        });
      });
      console.log('');
    }

    if (remoteOnly.length > 0) {
      console.log(chalk.magenta.bold(`Remote Only (${remoteOnly.length}):`));
      remoteOnly.forEach((r) => {
        console.log(chalk.magenta(`  ↓ ${r.name}`));
        r.details?.forEach((detail) => {
          console.log(chalk.gray(`      ${detail}`));
        });
      });
      console.log('');
    }

    if (identical.length > 0) {
      console.log(chalk.green.bold(`Identical (${identical.length}):`));
      identical.forEach((r) => {
        console.log(chalk.green(`  ✓ ${r.name}`));
      });
      console.log('');
    }

    // Summary
    console.log(chalk.bold('Summary:'));
    console.log(`  Total workflows compared: ${results.length}`);
    console.log(chalk.yellow(`  Modified: ${modified.length}`));
    console.log(chalk.blue(`  Local only: ${localOnly.length}`));
    console.log(chalk.magenta(`  Remote only: ${remoteOnly.length}`));
    console.log(chalk.green(`  Identical: ${identical.length}`));
  } catch (error) {
    spinner.fail('Comparison failed');
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

export const diffCommand = new Command('diff')
  .description('Compare local workflows with remote n8n instance (uses N8N_API_URL and N8N_API_KEY)')
  .argument('[workflow]', 'Specific workflow file or category to compare (optional)')
  .action(async (workflow?: string) => {
    const diffOptions: DiffOptions = {
      environment: 'default',
      workflow,
    };
    await diffCommandHandler(diffOptions);
  });
