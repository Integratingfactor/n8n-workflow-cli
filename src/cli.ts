#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { deployCommand } from './commands/deploy.js';
import { executeCommand } from './commands/execute.js';
import { listCommand } from './commands/list.js';
import { pullCommand } from './commands/pull.js';
import { validateCommand } from './commands/validate.js';

const program = new Command();

program
  .name('n8n-workflow-cli')
  .description('CLI tool for managing n8n workflows across environments')
  .version('1.0.0');

// Add helpful information about configuration
program.hook('preAction', () => {
  // Check if config exists
  const configPath = path.join(process.cwd(), '.n8n-cli.config.json');
  if (!fs.existsSync(configPath)) {
    console.log('ℹ️  Configuration file .n8n-cli.config.json not found in current directory.');
    console.log('   Create one with your n8n environment settings to get started.');
    console.log(
      '   See documentation: https://github.com/integratingfactor/n8n-workflow-cli#configuration'
    );
    console.log('');
  }
});

program.addCommand(deployCommand);
program.addCommand(executeCommand);
program.addCommand(listCommand);
program.addCommand(pullCommand);
program.addCommand(validateCommand);

// Enhanced help with examples
program.addHelpText(
  'after',
  `
Examples:
  $ n8n-workflow-cli pull dev                    # Pull workflows from dev environment
  $ n8n-workflow-cli validate                    # Validate all workflow files
  $ n8n-workflow-cli deploy prod workflow.json   # Deploy specific workflow to prod
  $ n8n-workflow-cli deploy prod --dry-run       # Test deployment without changes
  $ n8n-workflow-cli list --remote prod          # List workflows in prod environment

Configuration:
  Create .n8n-cli.config.json in your project root:
  {
    "environments": {
      "dev": {
        "baseUrl": "https://n8n.dev.company.com",
        "apiKey": "\${N8N_DEV_API_KEY}"
      }
    },
    "workflowsDir": "./workflows",
    "categories": ["business", "management", "shared"]
  }

For more information, visit: https://github.com/integratingfactor/n8n-workflow-cli
`
);

program.parse();
