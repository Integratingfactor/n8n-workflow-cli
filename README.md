# n8n Workflow CLI

A powerful CLI tool for managing n8n workflows across multiple environments with support for tags, validation, and automated deployment.

## Features

- 🚀 **Multi-environment support** - Deploy to dev, test, prod environments
- 🏷️ **Advanced tags management** - Automatic tag creation and assignment
- ✅ **Workflow validation** - Comprehensive JSON schema validation
- 🔄 **Pull/Push workflows** - Sync workflows between environments
- ⚡ **Parallel deployment** - Deploy multiple workflows simultaneously
- 🔍 **Dry-run mode** - Test deployments without making changes

## Installation

### Global Installation
## Installation

```bash
npm install -g @integratingfactor/n8n-workflow-cli
```

## Quick Start

### Project Installation
```bash
npm install --save-dev @integratingfactor/n8n-workflow-cli
```

## Quick Start

> 📖 **New to this tool?** See the detailed [Quick Start Guide](QUICKSTART.md) for step-by-step instructions.

1. **Create configuration** - Create `n8n.config.json` in your workflow repository:
```json
{
  "environments": {
    "dev": {
      "baseUrl": "${N8N_DEV_URL}",
      "apiKey": "${N8N_DEV_API_KEY}"
    },
    "prod": {
      "baseUrl": "${N8N_PROD_URL}",
      "apiKey": "${N8N_PROD_API_KEY}"
    }
  },
  "workflowsDir": "./workflows",
  "categories": ["business", "management", "shared"]
}
```

> **Note:** The `baseUrl` must include the `/api/v1` path (e.g., `https://n8n.example.com/api/v1`). This is validated automatically.

2. **Set environment variables** - Configure your n8n credentials:

**Option 1: Using .env file (recommended for local development)**
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your values
N8N_DEV_URL=https://n8n.dev.company.com/api/v1
N8N_DEV_API_KEY=your-dev-api-key
N8N_PROD_URL=https://n8n.prod.company.com/api/v1
N8N_PROD_API_KEY=your-prod-api-key
```

**Option 2: Using shell exports (for CI/CD)**
```bash
export N8N_DEV_URL="https://n8n.dev.company.com/api/v1"
export N8N_DEV_API_KEY="your-dev-api-key"
export N8N_PROD_URL="https://n8n.prod.company.com/api/v1"
export N8N_PROD_API_KEY="your-prod-api-key"
```

> **💡 Important:** The `n8n.config.json` file should be **committed to your repository**. It contains your project's categories and environment structure, but uses environment variables for secrets. The `.env` file is gitignored for security.

### Categories Configuration

Categories help organize workflows into folders in your repository:

- **Define categories** in the `categories` array - customize for your project needs (e.g., `["api", "automation", "monitoring"]`)
- **Commit the config** - The `n8n.config.json` file with your categories should be committed so the team shares the same organization
- **Tag workflows in n8n** - Only workflows with tags matching a category name will be pulled
- **Filter by category** - Use `--category` option to pull only specific category workflows

Example: A workflow tagged with `business` in n8n will be saved to `workflows/business/` when pulled.

3. **Pull workflows** from an environment:
```bash
# Pull all workflows with matching category tags
n8n-workflow-cli pull dev

# Pull only workflows tagged with "business"
n8n-workflow-cli pull dev --category business
```

4. **Validate workflows**:
```bash
n8n-workflow-cli validate
```

5. **Deploy workflows**:
```bash
n8n-workflow-cli deploy prod workflows/business/my-workflow.json
```

## Documentation

- [CLI Reference](docs/cli-reference.md) - Complete command documentation
- [Architecture Decisions](docs/architecture-decisions.md) - Design rationale
- [Workflow Development Guide](docs/workflow-development.md) - Best practices for workflow development

## Workflow Project Template

Use this template for workflow repositories:

```json
{
  "name": "my-workflows",
  "scripts": {
    "validate": "n8n-workflow-cli validate",
    "pull": "n8n-workflow-cli pull",
    "deploy": "n8n-workflow-cli deploy",
    "list": "n8n-workflow-cli list"
  },
  "devDependencies": {
    "@integratingfactor/n8n-workflow-cli": "^1.0.6"
  }
}
```

## Development

### Setting Up After Cloning

If you've cloned this repository to contribute or modify the tool:

1. **Install dependencies:**
```bash
npm install
```

2. **Build the project:**
```bash
npm run build
```

3. **Run in development mode:**

> **Note:** Use `npm run dev -- <command>` (with `--`) for all CLI commands during development.

```bash
# Run commands directly without building
npm run dev -- list
npm run dev -- --help
npm run dev -- deploy dev --dry-run

# Or use the built version
node dist/cli.js --help
```

4. **Test with a real n8n instance:**
```bash
# The repo already has n8n.config.json
# Set your environment variables
export N8N_DEV_URL="https://your-n8n-dev.com/api/v1"
export N8N_DEV_API_KEY="your-api-key-here"

# Try pulling workflows
npm run dev -- pull dev
```

5. **Link globally for testing:**
```bash
npm link
n8n-workflow-cli --help
```

### Project Structure

```
n8n-workflow-cli/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── api-client.ts       # n8n API client
│   ├── config.ts           # Configuration management
│   ├── workflow-manager.ts # Workflow file operations
│   ├── types.ts            # TypeScript types
│   └── commands/           # Command implementations
│       ├── deploy.ts
│       ├── list.ts
│       ├── pull.ts
│       └── validate.ts
├── dist/                   # Compiled JavaScript (gitignored)
├── docs/                   # Documentation
└── workflows/              # Example workflows (gitignored locally)
```

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev -- <command>` - Run CLI in development mode
- `npm run dev -- --help` - See all available commands

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Test your changes thoroughly
5. Submit a pull request

## License

MIT
