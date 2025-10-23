import ora from 'ora';
import chalk from 'chalk';
import { N8nClient } from '../api-client.js';
import { configManager } from '../config.js';
import { saveWorkflowToFile, determineCategory } from '../workflow-manager.js';
import { PullOptions } from '../types.js';

export async function pullCommand(options: PullOptions): Promise<void> {
  const spinner = ora('Loading configuration...').start();
  
  try {
    const config = await configManager.loadConfig(options.environment);
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
        
        // Determine category
        const category = options.category || determineCategory(fullWorkflow);
        
        // Skip if category doesn't match filter
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
        console.error(chalk.red(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
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
