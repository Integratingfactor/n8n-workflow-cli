#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deployCommand } from './commands/deploy.js';
import { listCommand } from './commands/list.js';
import { pullCommand } from './commands/pull.js';
import { validateCommand } from './commands/validate.js';

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
  Create n8n.config.json in your project root:
  {
    "workflowsDir": "./workflows",
    "categories": ["business", "management", "shared"]
  }
  
  Set environment variables (use .env file or export):
  N8N_API_URL=https://n8n.example.com/api/v1
  N8N_API_KEY=your-api-key
  
  For multiple environments, switch variables as needed:
  export N8N_API_URL="https://n8n.dev.example.com/api/v1"   # dev
  export N8N_API_URL="https://n8n.prod.example.com/api/v1"  # prod

For more information, visit: https://github.com/integratingfactor/n8n-workflow-cli
`
);

program.parse();
