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
```bash
npm install -g @company/n8n-workflow-cli
```

### Project Installation
```bash
npm install --save-dev @company/n8n-workflow-cli
```

## Quick Start

1. **Configure environments** in `.n8n-cli.config.json`:
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
  }
}
```

2. **Pull workflows** from an environment:
```bash
n8n-workflows pull dev
```

3. **Validate workflows**:
```bash
n8n-workflows validate
```

4. **Deploy workflows**:
```bash
n8n-workflows deploy prod workflows/business/my-workflow.json
```

## Documentation

- [CLI Reference](docs/cli-reference.md) - Complete command documentation
- [Configuration Guide](docs/configuration.md) - Environment setup and options
- [Architecture Decisions](docs/architecture-decisions.md) - Design rationale

## Workflow Project Template

Use this template for workflow repositories:

```json
{
  "name": "my-workflows",
  "scripts": {
    "validate": "n8n-workflows validate",
    "pull": "n8n-workflows pull",
    "deploy": "n8n-workflows deploy",
    "list": "n8n-workflows list"
  },
  "devDependencies": {
    "@company/n8n-workflow-cli": "^1.0.0"
  }
}
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT
