# CLI Reference

Complete command reference for n8n-workflow-cli.

## Installation

**Global Installation (recommended for users):**
```bash
npm install -g @integratingfactor/n8n-workflow-cli
```

**Development Setup (for contributors):**
```bash
git clone https://github.com/integratingfactor/n8n-workflow-cli.git
cd n8n-workflow-cli
npm install
```

## Command Details

### `pull`
Pull workflows from n8n instance to local files.

**Usage:**
```bash
n8n-workflow-cli pull <environment> [options]
```

**Arguments:**
- `environment`: Target environment (dev, prod, staging, etc.)

**Options:**
- `--category <category>`: Filter by workflow category

**Examples:**
```bash
n8n-workflow-cli pull dev
n8n-workflow-cli pull prod --category migration
```

### `deploy`
Deploy workflows from local files to n8n instance.

**Usage:**
```bash
n8n-workflow-cli deploy <environment> [workflow] [options]
```

**Arguments:**
- `environment`: Target environment (dev, prod, staging, etc.)
- `workflow`: Optional specific workflow file path

**Options:**
- `--dry-run`: Show what would be deployed without making changes
- `--parallel`: Deploy workflows in parallel

**Examples:**
```bash
n8n-workflow-cli deploy dev
n8n-workflow-cli deploy prod workflows/business/my-workflow.json
n8n-workflow-cli deploy dev --dry-run
n8n-workflow-cli deploy prod --parallel
```

### Execute a workflow
```bash
n8n-workflow-cli execute <environment> <workflow>
n8n-workflow-cli execute dev "My Workflow"
n8n-workflow-cli execute prod "Data Sync" --wait
```

### List workflows
```bash
n8n-workflow-cli list
n8n-workflow-cli list --remote dev
n8n-workflow-cli list --remote prod
```

### Validate workflows
```bash
n8n-workflow-cli validate
```

## Command Details (continued)

### `execute`
Execute a workflow on n8n instance.

**Usage:**
```bash
n8n-workflow-cli execute <environment> <workflowName> [options]
```

**Arguments:**
- `environment`: Target environment (dev, prod, staging, etc.)
- `workflowName`: Name of the workflow to execute (use quotes if it contains spaces)

**Options:**
- `--wait`: Wait for execution to complete

**Examples:**
```bash
n8n-workflow-cli execute dev "Create Tables"
n8n-workflow-cli execute prod "Data Migration" --wait
```

### `list`
List workflows locally or from n8n instance.

**Usage:**
```bash
n8n-workflow-cli list [options]
```

**Options:**
- `--remote <environment>`: List workflows from n8n instance instead of local files

**Examples:**
```bash
n8n-workflow-cli list
n8n-workflow-cli list --remote dev
n8n-workflow-cli list --remote prod
```

### `validate`
Validate all local workflow files.

**Usage:**
```bash
n8n-workflow-cli validate
```

**Examples:**
```bash
n8n-workflow-cli validate
```

## Build for Production

```bash
npm run build
```

## Development Mode

Run without building:
```bash
npm run dev -- <command> [options]
```

## Environment Setup

1. Copy template:
   ```bash
   cp config/template.env config/test.env
   ```

2. Edit config with your n8n details:
   - `N8N_API_URL`: API endpoint
   - `N8N_API_KEY`: API key from n8n Settings

## Features

✅ Type-safe API client  
✅ Automatic workflow categorization  
✅ Parallel deployments  
✅ Dry-run mode  
✅ Category filtering  
✅ Comprehensive error handling  
✅ Progress spinners and colors  
✅ CI/CD ready  

## CI/CD Example

```yaml
- name: Deploy workflows
  run: |
    npm install -g @integratingfactor/n8n-workflow-cli
    n8n-workflow-cli validate
    n8n-workflow-cli deploy prod --parallel
```

## Docker Example

```bash
docker run --rm -v $(pwd)/config:/app/config n8n-workflow-cli deploy prod
```

## Help

Get help for any command:
```bash
n8n-workflow-cli <command> --help
```

Examples:
```bash
n8n-workflow-cli pull --help
n8n-workflow-cli deploy --help
n8n-workflow-cli execute --help
n8n-workflow-cli list --help
n8n-workflow-cli validate --help
```

## Troubleshooting

**Build errors:**
```bash
npm run clean
npm install
npm run build
```

**Type checking only:**
```bash
npm run typecheck
```

**Missing dependencies:**
```bash
npm install
```
