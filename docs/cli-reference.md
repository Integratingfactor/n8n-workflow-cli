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

Create a `n8n.config.json` file in your workflow repository root:

```json
{
  "workflowsDir": "./workflows",
  "categories": ["business", "management", "shared"]
}
```

The CLI uses two simple environment variables to connect to n8n:

- `N8N_API_URL` - Your n8n instance URL (must end with `/api/v1`)
- `N8N_API_KEY` - Your n8n API key

The environment name parameter (e.g., `dev`, `prod`, `staging`) is just a label for your reference - you control which environment you're connecting to by setting these variables appropriately.

**Option 1: Using .env file (recommended for local development)**
```bash
# Create .env file (gitignored)
cat > .env << 'EOF'
N8N_API_URL=https://n8n.dev.company.com/api/v1
N8N_API_KEY=your-dev-api-key
EOF
```

**Option 2: Using shell exports**
```bash
export N8N_API_URL="https://n8n.dev.company.com/api/v1"
export N8N_API_KEY="your-dev-api-key"
```

> **Important:** The `n8n.config.json` file should be **committed to your repository**. It contains only workflow organization (categories, directory). All credentials are in environment variables. The `.env` file is gitignored for security.

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

**Important:** Only workflows with tags matching categories defined in `n8n.config.json` will be pulled. Workflows without matching category tags are skipped.

**Usage:**
```bash
n8n-workflow-cli pull [options]
```

**Options:**
- `--category <category>`: Filter to only pull workflows with this specific category tag (must be defined in config)

**Category Behavior:**
1. Categories must be defined in `n8n.config.json` (e.g., `"categories": ["business", "management", "shared"]`)
2. Only workflows with a tag exactly matching a category name will be pulled
3. Workflows are saved to `workflows/<category>/` folders
4. Use `--category` to narrow the pull to a specific category

**Examples:**
```bash
# Pull all workflows with matching category tags
n8n-workflow-cli pull

# Pull only workflows tagged with "business"
n8n-workflow-cli pull --category business

# Pull only workflows tagged with "management"
n8n-workflow-cli pull --category management
```

### `diff`
Compare local workflows with remote n8n instance to identify differences.

**Usage:**
```bash
n8n-workflow-cli diff [workflow]
```

**Arguments:**
- `workflow`: (Optional) Specific workflow file path or category name to compare. Omit to compare all workflows.

**Output Categories:**
- **Modified**: Workflows that differ between local and remote versions
  - Shows specific differences: nodes, settings, tags, active status
- **Local Only**: Workflows present locally but not found in n8n
- **Remote Only**: Workflows present in n8n but not in local repository (with matching category tags)
- **Identical**: Workflows that match exactly between local and remote

**Examples:**
```bash
# Compare all workflows
n8n-workflow-cli diff

# Compare specific workflow file
n8n-workflow-cli diff workflows/business/my-workflow.json

# Compare all workflows in a category
n8n-workflow-cli diff business
```

**Use Cases:**
- Check what changes need to be deployed before running `deploy`
- Identify workflows that should be pulled from remote
- Verify that deployed workflows match local definitions
- Review differences before switching environments

### `deploy`
Deploy workflows from local files to n8n instance.

**Usage:**
```bash
n8n-workflow-cli deploy [workflow] [options]
```

**Arguments:**
- `workflow`: Optional specific workflow file path

**Options:**
- `--dry-run`: Show what would be deployed without making changes
- `--parallel`: Deploy workflows in parallel

**Examples:**
```bash
n8n-workflow-cli deploy
n8n-workflow-cli deploy workflows/business/my-workflow.json
n8n-workflow-cli deploy --dry-run
n8n-workflow-cli deploy --parallel
```

### `list`
List workflows locally or from n8n instance.

**Usage:**
```bash
n8n-workflow-cli list [options]
```

**Options:**
- `--remote`: List workflows from n8n instance instead of local files

**Examples:**
```bash
n8n-workflow-cli list
n8n-workflow-cli list --remote
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

## Development Mode

Run without building:
```bash
npm run dev -- <command> [options]
```

## Environment Setup

Set environment variables with your n8n details:
- `N8N_API_URL`: API endpoint
- `N8N_API_KEY`: API key from n8n Settings

## CI/CD Example

```yaml
- name: Deploy workflows
  run: |
    npm install -g @integratingfactor/n8n-workflow-cli
    n8n-workflow-cli validate
    n8n-workflow-cli deploy --parallel
```

## Docker Example

```bash
docker run --rm -v $(pwd)/config:/app/config n8n-workflow-cli deploy
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
