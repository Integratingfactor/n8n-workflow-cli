# n8n Workflow CLI

A powerful CLI tool for managing n8n workflows across multiple environments with support for tags, validation, and automated deployment.

## Features

- 🚀 **Multi-environment support** - Deploy to dev, test, prod environments
- 🏷️ **Advanced tags management** - Automatic tag creation and assignment
- ✅ **Workflow validation** - Comprehensive JSON schema validation
- 🔄 **Pull/Push workflows** - Sync workflows between environments
- ⚡ **Parallel deployment** - Deploy multiple workflows simultaneously
- 🔍 **Dry-run mode** - Test deployments without making changes
- 📊 **Workflow execution** - Execute and monitor workflow runs

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

1. **Configure environments** - Copy the example config and customize it:
```bash
cp .n8n-cli.config.example.json .n8n-cli.config.json
# Edit .n8n-cli.config.json with your n8n instance URLs and API keys
```

Example `.n8n-cli.config.json`:
```json
{
  "environments": {
    "dev": {
      "baseUrl": "https://n8n.dev.company.com",
      "apiKey": "${N8N_DEV_API_KEY}"
    },
    "prod": {
      "baseUrl": "https://n8n.prod.company.com",
      "apiKey": "${N8N_PROD_API_KEY}"
    }
  },
  "workflowsDir": "./workflows",
  "categories": ["business", "management", "shared"]
}
```

> **Note:** The config file is gitignored to protect your API keys. Use environment variables like `${N8N_DEV_API_KEY}` for sensitive data.

2. **Pull workflows** from an environment:
```bash
n8n-workflow-cli pull dev
```

3. **Validate workflows**:
```bash
n8n-workflow-cli validate
```

4. **Deploy workflows**:
```bash
n8n-workflow-cli deploy prod workflows/business/my-workflow.json
```

## Documentation

- [CLI Reference](docs/cli-reference.md) - Complete command documentation
- [Architecture Decisions](docs/architecture-decisions.md) - Design rationale
- [Workflow Development Guide](docs/workflow-development.md) - Best practices for workflow development
- [Deployment Guide](docs/deployment-guide.md) - CI/CD and production deployment
- [Migration Guide](docs/migration-guide.md) - Migrating workflows between environments

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
    "@integratingfactor/n8n-workflow-cli": "^1.0.0"
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
# Copy the example config
cp .n8n-cli.config.example.json .n8n-cli.config.json

# Set your environment variables
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
│       ├── execute.ts
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
