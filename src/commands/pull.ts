import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { N8nClient } from '../api-client.js';
import { configManager } from '../config.js';
import { saveWorkflowToFile, determineCategory } from '../workflow-manager.js';
import { PullOptions } from '../types.js';

export async function pullCommandHandler(options: PullOptions): Promise<void> {
  const spinner = ora('Loading configuration...').start();

  try {
    const config = await configManager.loadConfig(options.environment);
    const categories = configManager.getCategories();
    spinner.succeed(`Loaded configuration for ${chalk.cyan(options.environment)} environment`);

    spinner.start('Connecting to n8n API...');
    const client = new N8nClient(config);

    spinner.text = 'Fetching workflows...';
    const workflows = await client.listWorkflows();

    if (workflows.length === 0) {
      spinner.info('No workflows found on remote instance');
      return;
    }

    spinner.succeed(`Found ${chalk.bold(workflows.length)} workflow(s)`);

    const projectRoot = configManager.getProjectRoot();
    let pulledCount = 0;
    let skippedCount = 0;

    for (const workflow of workflows) {
      const workflowSpinner = ora(`Processing: ${workflow.name}`).start();

      try {
        // Fetch full workflow data
        const fullWorkflow = await client.getWorkflow(workflow.id!);

        // Determine category from workflow tags only (never use command option as default)
        const category = determineCategory(fullWorkflow, categories);

        // Log tags for debugging
        const tags = fullWorkflow.tags?.map((t: any) => t.name).join(', ') || 'none';

        // Skip workflows without a matching category tag
        if (!category) {
          workflowSpinner.info(
            `Skipped: ${workflow.name} [tags: ${tags}] (no matching category tag)`
          );
          skippedCount++;
          continue;
        }

        workflowSpinner.text = `${workflow.name} [tags: ${tags}] → ${category}`;

        // Skip if category doesn't match filter (when --category option is provided)
        if (options.category && category !== options.category) {
          workflowSpinner.info(`Skipped: ${workflow.name} (category: ${category})`);
          skippedCount++;
          continue;
        }

        // Save to file
        const filePath = await saveWorkflowToFile(fullWorkflow, category, projectRoot);
        const relativePath = filePath.replace(projectRoot + '/', '');

        workflowSpinner.succeed(`Saved: ${chalk.green(relativePath)}`);
        pulledCount++;
      } catch (error) {
        workflowSpinner.fail(`Failed: ${workflow.name}`);
        console.error(
          chalk.red(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
      }
    }

    console.log('');
    console.log(chalk.bold('Summary:'));
    console.log(`  ${chalk.green('✓')} Pulled: ${pulledCount}`);
    if (skippedCount > 0) {
      console.log(`  ${chalk.gray('○')} Skipped: ${skippedCount}`);
    }
    console.log('');
    console.log(chalk.dim('Review changes with: git status'));
  } catch (error) {
    spinner.fail('Pull failed');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

export const pullCommand = new Command('pull')
  .description('Pull workflows from n8n instance (uses N8N_API_URL and N8N_API_KEY)')
  .option('--category <category>', 'Only pull workflows from specific category')
  .action(async (options?: any) => {
    const pullOptions: PullOptions = {
      environment: 'default',
      category: options?.category,
    };
    await pullCommandHandler(pullOptions);
  });
