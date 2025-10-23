import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { N8nClient } from '../api-client.js';
import { configManager } from '../config.js';
import { ExecuteOptions } from '../types.js';

export async function executeCommandHandler(options: ExecuteOptions): Promise<void> {
  const spinner = ora('Loading configuration...').start();
  
  try {
    const config = await configManager.loadConfig(options.environment);
    spinner.succeed(`Loaded configuration for ${chalk.cyan(options.environment)} environment`);
    
    spinner.start('Connecting to n8n API...');
    const client = new N8nClient(config);
    
    // Find workflow by name or ID
    let workflowId: string;
    
    if (/^\d+$/.test(options.workflow)) {
      // It's a numeric ID
      workflowId = options.workflow;
      spinner.text = `Executing workflow ID: ${workflowId}`;
    } else {
      // Search by name
      spinner.text = 'Searching for workflow...';
      const workflows = await client.listWorkflows();
      const found = workflows.find(w => 
        w.name.toLowerCase().includes(options.workflow.toLowerCase())
      );
      
      if (!found || !found.id) {
        spinner.fail(`Workflow not found: "${options.workflow}"`);
        console.log('\nAvailable workflows:');
        workflows.forEach(w => {
          console.log(`  ${w.id}: ${w.name}`);
        });
        process.exit(1);
      }
      
      workflowId = found.id;
      spinner.text = `Executing workflow: ${found.name} (ID: ${workflowId})`;
    }
    
    const result = await client.executeWorkflow(workflowId);
    
    spinner.succeed('Workflow execution started');
    
    console.log('');
    console.log(chalk.bold('Execution Details:'));
    console.log(`  Execution ID: ${result.data.id}`);
    console.log(`  Workflow ID: ${result.data.workflowId}`);
    console.log(`  Mode: ${result.data.mode}`);
    console.log(`  Started: ${result.data.startedAt}`);
    console.log(`  Status: ${result.data.finished ? chalk.green('Finished') : chalk.yellow('Running')}`);
    
    if (result.data.stoppedAt) {
      console.log(`  Stopped: ${result.data.stoppedAt}`);
    }
    
    console.log('');
    console.log(chalk.dim('View execution details in n8n UI: Executions tab'));
    
  } catch (error) {
    spinner.fail('Execution failed');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

export const executeCommand = new Command('execute')
  .description('Execute a workflow on n8n')
  .argument('<environment>', 'Target environment')
  .argument('<workflow>', 'Workflow name or ID to execute')
  .option('--wait', 'Wait for execution to complete')
  .action(async (environment: string, workflow: string, options?: any) => {
    const executeOptions: ExecuteOptions = {
      environment,
      workflow,
      wait: options?.wait || false,
    };
    await executeCommandHandler(executeOptions);
  });
