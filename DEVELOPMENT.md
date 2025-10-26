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

## Workflow Data Cleaning

The CLI automatically cleans workflow JSON files to minimize unnecessary diffs in source control. This is implemented in `cleanWorkflowForStorage()` in `src/workflow-manager.ts`.

### Fields Removed from Storage

Based on the [n8n API specification](https://github.com/n8n-io/n8n/blob/master/packages/cli/src/public-api/v1/handlers/workflows/spec/schemas/workflow.yml) and [API documentation examples](https://github.com/n8n-io/n8n/tree/master/packages/cli/src/public-api/v1/handlers/workflows):

**Top-level fields removed:**
- `createdAt` - Timestamp managed by n8n (readOnly in API spec)
- `updatedAt` - Timestamp managed by n8n (readOnly in API spec)
- `versionId` - Internal version tracking (not in API spec)
- `isArchived` - Archive status (not in API spec)
- `pinData` - Test/debug pinned data (not in API spec)
- `triggerCount` - Runtime execution counter (not in API spec)

**Shared field cleaning:**
- Removes `user` object with frequently changing timestamps (`updatedAt`, `lastActiveAt`)
- Keeps `role`, `workflowId`, `projectId`, and `project.name`

**Node-level fields removed:**
- `data` - Execution output data (changes on every run)
- `issues` - Runtime validation issues
- `hints` - Runtime hints/warnings

**Fields Preserved (critical for workflow functionality):**
- `id` - Required for update operations
- `active` - Workflow activation state
- `staticData` - Part of workflow definition (per API docs)
- `settings` - Complete workflow settings
- `shared` - Sharing/project metadata (cleaned of user timestamps)
- `name`, `nodes`, `connections` - Core workflow definition
- **All node configuration**: `webhookId`, `disabled`, `notesInFlow`, `executeOnce`, `alwaysOutputData`, `retryOnFail`, `maxTries`, `waitBetweenTries`, `onError`, etc.

### Why This Matters

Without cleaning, workflow files show diffs for:
- Every execution (timestamps in `updatedAt`, `lastActiveAt`)
- Runtime state changes (issues, hints, execution data)
- User activity timestamps in `shared` object

With cleaning, only meaningful workflow changes appear in Git diffs:
- Node additions/removals/modifications
- Connection changes
- Settings updates
- Configuration changes (webhooks, retry settings, etc.)
- Name changes

**Important**: The cleaning is conservative - we only remove fields that are:
1. Explicitly marked as `readOnly` in the API spec
2. Not present in n8n's API documentation examples
3. Execution results that change on every run

### Extending the Cleaning Logic

If you find additional fields causing unnecessary diffs, verify they're not needed for workflow functionality:

1. Check the [n8n API spec](https://github.com/n8n-io/n8n/tree/master/packages/cli/src/public-api/v1/handlers/workflows/spec)
2. Test deploy/execution after removing
3. Add to `cleanWorkflowForStorage()` if safe:

```typescript
// In src/workflow-manager.ts
export function cleanWorkflowForStorage(workflow: any): any {
  const fieldsToRemove = [
    'createdAt',
    'updatedAt',
    'versionId',
    'isArchived',
    'pinData',
    'triggerCount',
    'yourNewField', // Add here after verification
  ];
  // ...
}
```

**Warning**: Removing too many fields can break workflow functionality (e.g., removing `webhookId` breaks webhook triggers, removing `staticData` loses workflow state).

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
