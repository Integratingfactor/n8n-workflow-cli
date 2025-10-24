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

## Configuration

Create a `.n8n-cli.config.json` file in your project root:

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

### Categories

Categories organize workflows into folders and control which workflows are pulled:

- **Define categories** in the `categories` array - customize for your project (e.g., `["api", "automation", "monitoring", "integration"]`)
- **Tag workflows in n8n** - Workflows must have a tag matching a category name to be pulled
- **Folder structure** - Workflows are saved to `workflows/<category>/` based on their tag
- **Different per project** - Each repository can define its own categories to organize workflows differently

**Example:** If your config has `"categories": ["api", "backend"]` and a workflow in n8n is tagged with `api`, it will be pulled to `workflows/api/workflow-name.json`.

## Command Details

### `pull`
Pull workflows from n8n instance to local files.

**Important:** Only workflows with tags matching categories defined in `.n8n-cli.config.json` will be pulled. Workflows without matching category tags are skipped.

**Usage:**
```bash
n8n-workflow-cli pull <environment> [options]
```

**Arguments:**
- `environment`: Target environment (dev, prod, staging, etc.)

**Options:**
- `--category <category>`: Filter to only pull workflows with this specific category tag (must be defined in config)

**Category Behavior:**
1. Categories must be defined in `.n8n-cli.config.json` (e.g., `"categories": ["business", "management", "shared"]`)
2. Only workflows with a tag exactly matching a category name will be pulled
3. Workflows are saved to `workflows/<category>/` folders
4. Use `--category` to narrow the pull to a specific category

**Examples:**
```bash
# Pull all workflows with matching category tags
n8n-workflow-cli pull dev

# Pull only workflows tagged with "business"
n8n-workflow-cli pull dev --category business

# Pull only workflows tagged with "management"
n8n-workflow-cli pull prod --category management
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
