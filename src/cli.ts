#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { pullCommand } from './commands/pull.js';
import { deployCommand } from './commands/deploy.js';
import { executeCommand } from './commands/execute.js';
import { listCommand } from './commands/list.js';
import { validateCommand } from './commands/validate.js';

const program = new Command();

program
  .name('n8n-workflows')
  .description('CLI tool for managing n8n workflows with source control')
  .version('1.0.0');

program
  .command('pull')
  .description('Pull workflows from n8n instance to local repository')
  .argument('[environment]', 'Environment name (test, production, etc.)', 'test')
  .option('-c, --category <category>', 'Filter by category (business, management, shared)')
  .action(async (environment, options) => {
    await pullCommand({
      environment,
      category: options.category,
    });
  });

program
  .command('deploy')
  .description('Deploy workflows from repository to n8n instance')
  .argument('[environment]', 'Environment name (test, production, etc.)', 'test')
  .argument('[target]', 'What to deploy: all, category name, or specific workflow file path')
  .option('--dry-run', 'Preview changes without deploying')
  .option('--parallel', 'Deploy workflows in parallel (faster but less control)')
  .action(async (environment, target, options) => {
    await deployCommand({
      environment,
      target,
      dryRun: options.dryRun,
      parallel: options.parallel,
    });
  });

program
  .command('execute')
  .description('Execute a workflow immediately (useful for management workflows)')
  .argument('<workflow>', 'Workflow name or ID')
  .argument('[environment]', 'Environment name (test, production, etc.)', 'test')
  .option('-w, --wait', 'Wait for execution to complete')
  .action(async (workflow, environment, options) => {
    await executeCommand({
      workflow,
      environment,
      wait: options.wait,
    });
  });

program
  .command('list')
  .description('List workflows in repository and optionally on remote')
  .argument('[environment]', 'Environment name for remote listing', 'test')
  .option('-r, --remote', 'Also list workflows on remote n8n instance')
  .action(async (environment, options) => {
    await listCommand({
      environment,
      remote: options.remote,
    });
  });

program
  .command('validate')
  .description('Validate all workflow JSON files')
  .action(async () => {
    await validateCommand();
  });

// Error handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error instanceof Error && error.message.includes('outputHelp')) {
    // Commander help was shown, exit normally
    process.exit(0);
  }
  
  console.error(chalk.red('\nAn unexpected error occurred:'));
  console.error(error);
  process.exit(1);
}
