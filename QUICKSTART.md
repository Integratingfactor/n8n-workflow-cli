# Quick Start Guide

## For Users (Installing from npm)

### 1. Install the CLI
```bash
npm install -g @company/n8n-workflow-cli
```

### 2. Set up your project
```bash
# Create a workflows directory
mkdir -p my-n8n-workflows/workflows/{business,management,shared}
cd my-n8n-workflows

# Create config file
cat > .n8n-cli.config.json << 'EOF'
{
  "environments": {
    "dev": {
      "baseUrl": "https://your-n8n-dev.com",
      "apiKey": "${N8N_DEV_API_KEY}"
    },
    "prod": {
      "baseUrl": "https://your-n8n-prod.com",
      "apiKey": "${N8N_PROD_API_KEY}"
    }
  },
  "workflowsDir": "./workflows",
  "categories": ["business", "management", "shared"]
}
EOF

# Set environment variables
export N8N_DEV_API_KEY="your-dev-api-key"
export N8N_PROD_API_KEY="your-prod-api-key"
```

### 3. Pull workflows from n8n
```bash
n8n-workflow-cli pull dev
```

### 4. Common commands
```bash
# List all workflows
n8n-workflow-cli list

# List workflows in remote environment
n8n-workflow-cli list --remote prod

# Validate all workflows
n8n-workflow-cli validate

# Deploy to production
n8n-workflow-cli deploy prod

# Deploy specific workflow
n8n-workflow-cli deploy prod workflows/business/my-workflow.json

# Dry run (test without changes)
n8n-workflow-cli deploy prod --dry-run

# Execute a workflow
n8n-workflow-cli execute prod "My Workflow Name"
```

## For Contributors (Cloning the repo)

### 1. Clone and install
```bash
git clone https://github.com/integratingfactor/n8n-workflow-cli.git
cd n8n-workflow-cli
npm install
```

### 2. Build the project
```bash
npm run build
```

### 3. Run in development mode
```bash
# See all commands
npm run dev -- --help

# Test commands without building
npm run dev -- list
npm run dev -- validate
```

### 4. Test with your n8n instance
```bash
# Create config (don't commit this!)
cp .n8n-cli.config.example.json .n8n-cli.config.json

# Edit the config with your URLs
# Set environment variables for API keys
export N8N_DEV_API_KEY="your-key-here"

# Test pulling workflows
npm run dev -- pull dev
```

### 5. Link globally for testing
```bash
npm link
n8n-workflow-cli --help
```

### 6. Make changes and rebuild
```bash
# After editing TypeScript files
npm run build

# Or use dev mode (no build needed)
npm run dev -- list
```

## Getting n8n API Keys

1. Log into your n8n instance
2. Go to **Settings** → **API**
3. Click **Create API Key**
4. Copy the key and store it securely
5. Set it as an environment variable (recommended) or in your config file

## Project Structure

```
your-workflow-project/
├── .n8n-cli.config.json    # Your config (gitignored)
├── workflows/              # Your workflows
│   ├── business/
│   ├── management/
│   └── shared/
└── package.json
```

## Tips

- **Security**: Never commit `.n8n-cli.config.json` with real API keys
- **Environment Variables**: Use `${VAR_NAME}` in config to reference env vars
- **Categories**: Organize workflows into categories for better management
- **Dry Run**: Always test with `--dry-run` before deploying to production
- **Validation**: Run `validate` before deploying to catch errors early

## Troubleshooting

### "Configuration file not found"
Create `.n8n-cli.config.json` in your project directory or current working directory.

### "Failed to connect to n8n API"
- Check your `baseUrl` is correct (include https://)
- Verify your API key is valid
- Ensure n8n instance is accessible from your network

### "No workflows found"
- Run `pull <environment>` first to download workflows
- Check that `workflowsDir` in config points to the right directory
- Ensure workflows are in the correct category subdirectories

### Module errors after cloning
Run `npm install` to install all dependencies.

## Next Steps

- Read the [CLI Reference](docs/cli-reference.md) for all commands
- See [Architecture Decisions](docs/architecture-decisions.md) for design details
- Check out [Workflow Development](docs/workflow-development.md) best practices
