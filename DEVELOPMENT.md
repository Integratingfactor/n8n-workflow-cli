# n8n Workflow CLI - Development Guide

> 📘 **Note**: This guide is for developers working on the CLI tool itself. If you're looking to **use** this tool for managing your n8n workflows, see the [README.md](README.md) instead.

A powerful CLI tool for managing n8n workflows across multiple environments with support for tags, validation, and automated deployment.

## Features

- 🚀 **Multi-environment support** - Deploy to dev, test, prod environments
- 🏷️ **Advanced tags management** - Automatic tag creation and assignment
- ✅ **Workflow validation** - Comprehensive JSON schema validation
- 🔄 **Pull/Push workflows** - Sync workflows between environments
- ⚡ **Parallel deployment** - Deploy multiple workflows simultaneously
- 🔍 **Dry-run mode** - Test deployments without making changes

## Documentation

- [CLI Reference](docs/cli-reference.md) - Complete command documentation
- [Architecture Decisions](docs/architecture-decisions.md) - Design rationale
- [Workflow Development Guide](docs/workflow-development.md) - Best practices for workflow development

## Development

### Setting Up After Cloning

If you've cloned this repository to contribute or modify the tool:

1. **Create a local n8n.config.json file for testing:**
```bash
cat > n8n.config.json << 'EOF'
{
  "workflowsDir": "./workflows",
  "categories": ["business", "management", "shared"]
}
EOF
```

2. **Setup n8n environment variables for testing:**
```bash
cat > .env << 'EOF'
N8N_API_URL=https://n8n.dev.company.com/api/v1
N8N_API_KEY=your-dev-api-key
EOF
```

3. **Install dependencies:**
```bash
npm install
```

4. **Build the project:**
```bash
npm run build
```

5. **Run in development mode:**

> **Note:** Use `npm run dev -- <command>` (with `--`) for all CLI commands during development.

```bash
# Run commands directly without building
npm run dev -- list
npm run dev -- --help
npm run dev -- deploy --dry-run

# Or use the built version
node dist/cli.js --help
```

6. **Test with a real n8n instance:**
```bash
# The repo already has n8n.config.json
# Set your environment variables
export N8N_DEV_URL="https://your-n8n-dev.com/api/v1"
export N8N_DEV_API_KEY="your-api-key-here"

# Try pulling workflows
npm run dev -- pull
```

7. **Link globally for testing:**
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
├── workflows/              # Test workflows (gitignored locally)
├── .env                    # Test environment variables (gitignored locally)
└── n8n.config.json         # Test config file (gitignored locally)
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
