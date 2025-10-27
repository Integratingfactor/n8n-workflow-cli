#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deployCommand } from './commands/deploy.js';
import { listCommand } from './commands/list.js';
import { pullCommand } from './commands/pull.js';
import { validateCommand } from './commands/validate.js';
import { diffCommand } from './commands/diff.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version from package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

const program = new Command();

program
  .name('n8n-workflow-cli')
  .description('CLI tool for managing n8n workflows across environments')
  .version(version);

// Add helpful information about configuration
program.hook('preAction', () => {
  // Check if config exists
  const configPath = path.join(process.cwd(), 'n8n.config.json');
  if (!fs.existsSync(configPath)) {
    console.log('ℹ️  Configuration file n8n.config.json not found in current directory.');
    console.log('   Create one with your n8n environment settings to get started.');
    console.log(
      '   See documentation: https://github.com/integratingfactor/n8n-workflow-cli#configuration'
    );
    console.log('');
  }
});

program.addCommand(deployCommand);
program.addCommand(listCommand);
program.addCommand(pullCommand);
program.addCommand(validateCommand);
program.addCommand(diffCommand);

// Enhanced help with examples
program.addHelpText(
  'after',
  `
Examples:
  $ n8n-workflow-cli pull                        # Pull workflows from n8n
  $ n8n-workflow-cli diff                        # Compare all local and remote workflows
  $ n8n-workflow-cli diff workflow.json          # Compare specific workflow
  $ n8n-workflow-cli diff business               # Compare workflows in business category
  $ n8n-workflow-cli validate                    # Validate all workflow files
  $ n8n-workflow-cli deploy workflow.json        # Deploy specific workflow
  $ n8n-workflow-cli deploy --dry-run            # Test deployment without changes
  $ n8n-workflow-cli list --remote               # List workflows in n8n instance

Configuration:
  Create n8n.config.json in your project root:
  {
    "workflowsDir": "./workflows",
    "categories": ["business", "management", "shared"]
  }
  
  Set environment variables (use .env file or export):
  N8N_API_URL=https://n8n.example.com/api/v1
  N8N_API_KEY=your-api-key
  
  Switch environments by changing these variables:
  export N8N_API_URL="https://n8n.dev.example.com/api/v1"    # for dev
  export N8N_API_URL="https://n8n.prod.example.com/api/v1"   # for prod

For more information, visit: https://github.com/integratingfactor/n8n-workflow-cli
`
);

program.parse();
