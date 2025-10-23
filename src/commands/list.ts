import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { N8nClient } from '../api-client.js';
import { configManager } from '../config.js';
import { findWorkflowFiles, loadWorkflowFromFile } from '../workflow-manager.js';
import { ListOptions } from '../types.js';

export async function listCommandHandler(options: ListOptions): Promise<void> {
  const projectRoot = configManager.getProjectRoot();
  
  // List local workflows
  console.log(chalk.bold.cyan('LOCAL WORKFLOWS'));
  console.log('');
  
  const categories = ['management', 'business', 'shared'];
  let totalLocal = 0;
  
  for (const category of categories) {
    const files = await findWorkflowFiles(projectRoot, category);
    
    if (files.length > 0) {
      console.log(chalk.bold(`📁 ${category}/`));
      
      for (const file of files) {
        try {
          const workflow = await loadWorkflowFromFile(file);
          const fileName = file.split('/').pop()?.replace('.json', '');
          const id = workflow.id || 'no-id';
          const nodeCount = workflow.nodes.length;
          
          console.log(`  ${chalk.green('✓')} ${fileName}`);
          console.log(`    Name: ${workflow.name}`);
          console.log(`    ID: ${id} | Nodes: ${nodeCount}`);
        } catch (error) {
          const fileName = file.split('/').pop();
          console.log(`  ${chalk.red('✗')} ${fileName}`);
          console.log(`    ${chalk.red('Error:')} ${error instanceof Error ? error.message : 'Invalid workflow'}`);
        }
      }
      
      console.log('');
      totalLocal += files.length;
    }
  }
  
  if (totalLocal === 0) {
    console.log(chalk.gray('  No local workflows found'));
    console.log('');
  }
  
  // List remote workflows if requested
  if (options.remote && options.environment) {
    const spinner = ora('Loading remote workflows...').start();
    
    try {
      const config = await configManager.loadConfig(options.environment);
      const client = new N8nClient(config);
      
      const workflows = await client.listWorkflows();
      spinner.stop();
      
      console.log(chalk.bold.cyan(`REMOTE WORKFLOWS (${options.environment})`));
      console.log('');
      
      if (workflows.length === 0) {
        console.log(chalk.gray('  No remote workflows found'));
      } else {
        workflows.forEach(workflow => {
          const active = workflow.active ? chalk.green('●') : chalk.gray('○');
          const tags = workflow.tags?.map(t => t.name).join(', ') || 'none';
          
          console.log(`${active} ${chalk.bold(workflow.name)}`);
          console.log(`  ID: ${workflow.id} | Nodes: ${workflow.nodes.length} | Tags: ${tags}`);
        });
      }
      
      console.log('');
      console.log(chalk.bold('Summary:'));
      console.log(`  Local workflows: ${totalLocal}`);
      console.log(`  Remote workflows: ${workflows.length}`);
      
    } catch (error) {
      spinner.fail('Failed to fetch remote workflows');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  } else {
    console.log(chalk.bold('Summary:'));
    console.log(`  Local workflows: ${totalLocal}`);
    console.log('');
    console.log(chalk.dim('Use --remote flag to also list remote workflows'));
  }
}

export const listCommand = new Command('list')
  .description('List local and remote workflows')
  .option('--remote <environment>', 'Also list workflows from remote environment')
  .action(async (options?: any) => {
    const listOptions: ListOptions = {
      environment: options?.remote,
      remote: !!options?.remote,
    };
    await listCommandHandler(listOptions);
  });
