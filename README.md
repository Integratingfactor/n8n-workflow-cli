# n8n Workflow CLI

A powerful CLI tool for managing n8n workflows across multiple environments with support for tags, validation, and automated deployment.

## Why Use This Tool?

- 📁 **Workflows as Code** - Store workflows in Git alongside your project code

- 🏷️ **Organized by Categories** - Tag and filter workflows by project/team using n8n tags

- 🔄 **Bi-directional Sync** - Pull workflows from n8n, edit locally, and deploy back

- ✅ **Workflow validation** - Comprehensive JSON schema validation

- 🔄 **Pull/Push workflows** - Sync workflows between environments

- 🛡️ **Safe Deployments** - New workflows are created inactive; no duplicate workflows

- ⚡ **Parallel deployment** - Deploy multiple workflows simultaneously

- 🔍 **Dry-run mode** - Test deployments without making changes


## Installation

Install globally to use across all your workflow projects:

```bash
npm install -g @integratingfactor/n8n-workflow-cli
```

## CLI Commands

### `pull`

Pull workflows from n8n to local files:
```bash
n8n-workflow-cli pull [options]

```

**Options:**

- `--category <category>` - Only pull workflows with this category tag

**Examples:**

```bash
# Pull all workflows
n8n-workflow-cli pull

# Pull only business workflows
n8n-workflow-cli pull --category business
```


### `deploy`

Deploy local workflows to n8n:

```bash
n8n-workflow-cli deploy [options]

```

**Options:**

- `--dry-run` - Show what would be deployed without making changes

**Examples:**

```bash

# Deploy all workflows
n8n-workflow-cli deploy


# Preview deployment without making changes
n8n-workflow-cli deploy --dry-run

```

**Behavior:**
- **New workflows**: Created as inactive (must be manually activated in n8n)
- **Existing workflows**: Updated with local changes
- **Duplicate prevention**: Checks for existing workflows by name before creating
- **Tags**: Automatically creates and assigns category tags

### `list`

List workflows:

```bash
n8n-workflow-cli list [options]
```

**Options:**
- `--remote` - List workflows from n8n instance (also) along with local files

**Examples:**
```bash
# List local workflows
n8n-workflow-cli list

# List remote workflows
n8n-workflow-cli list --remote
```

### `validate`

Validate local workflow JSON files:

```bash
n8n-workflow-cli validate
```

Checks for:
- Valid JSON structure
- Required workflow fields
- Proper node configuration
- Connection validity

## Project Structure

A typical workflow project looks like this:

```
my-n8n-workflows/
├── .env                   # Environment variables (gitignored)
├── .gitignore             # Ignore .env and other files
├── n8n.config.json        # Tool configuration
├── README.md              # Project documentation
└── workflows/             # Workflow JSON files
    ├── business/
    │   ├── customer-onboarding.json
    │   └── invoice-processing.json
    ├── management/
    │   └── team-reports.json
    └── shared/
        └── send-notification.json
```

## Quick Start

### Workflow repo setup

Create a new directory for your n8n workflows:

```bash
mkdir my-n8n-workflows
cd my-n8n-workflows
git init
```

Create `n8n.config.json` in your project root:

```json
{
  "workflowsDir": "./workflows",
  "categories": ["business", "management", "shared"]
}
```
Configuration Options:

- `workflowsDir`: Directory where workflow JSON files are stored (relative to config file)
- `categories`: List of workflow categories (used as n8n tags for organization)


> **💡 Important:** The `n8n.config.json` file should be **committed to your repository**.


### Configure n8n Connection

The CLI uses two simple environment variables:

- `N8N_API_URL` - Your n8n instance API URL (must end with `/api/v1`)
- `N8N_API_KEY` - Your n8n API key (from Settings → API in n8n)

**Option 1: Using .env file (recommended for local development)**

```bash
# Edit .env with your values
N8N_API_URL=https://n8n.dev.company.com/api/v1
N8N_API_KEY=your-dev-api-key

# Add `.env` to your `.gitignore`:
echo ".env" >> .gitignore
```

**Option 2: Using shell exports**

```bash
export N8N_API_URL="https://n8n.dev.company.com/api/v1"
export N8N_API_KEY="your-dev-api-key"
```

### Categories Configuration

Categories help organize workflows into folders in your repository:

- **Define categories** in the `categories` array - customize for your project needs (e.g., `["business", "management", "shared"]`)

- **Commit the config** - The `n8n.config.json` file with your categories should be committed so the team shares the same organization

- **Tag workflows in n8n** - Only workflows with tags matching a category name will be pulled

### Pull workflows from your n8n instance

This creates workflow JSON files in your `workflowsDir`, organized by category.

```bash
# Pull all workflows with matching category tags
n8n-workflow-cli pull

# Pull only workflows tagged with "business"
n8n-workflow-cli pull --category business
```

### Validate workflows

```bash
n8n-workflow-cli validate
```

### Make Changes and Deploy

Edit workflow files locally, then deploy:

```bash
# deploy a specific workflow
n8n-workflow-cli deploy workflows/business/my-workflow.json

# deploy all workflows
n8n-workflow-cli deploy
```
**Important:** New workflows are created as **inactive** for safety. You must:
1. Verify the workflow in n8n UI

2. Configure credentials and connections

3. Test the workflow

4. Manually activate it when ready

## Best Practices

### 1. Version Control
- Commit workflow JSON files to Git
- Use meaningful commit messages describing workflow changes
- Review diffs before committing to catch unintended changes
- Keep `.env` in `.gitignore` (never commit credentials)

### 2. Team Collaboration
- Use pull requests for workflow changes
- Document complex workflows in comments
- Use consistent category naming across team
- Set up CI/CD to validate workflows automatically

### 3. Multi-Environment Management
- Keep separate n8n instances for dev/staging/prod
- Test workflows in dev before deploying to prod
- Use environment-specific credentials in n8n
- Document environment differences in your project README

### 4. Workflow Organization
- Use meaningful workflow names
- Group related workflows in categories
- Keep workflows focused on single responsibilities
- Document dependencies between workflows

### 5. Deployment Safety
- Always run `validate` before deploying
- Use `--dry-run` to preview changes
- Test new workflows in n8n before activating
- Review credential mappings after deployment

## Troubleshooting

### "URL must end with /api/v1"

Make sure your `N8N_API_URL` includes the full API path:
```bash
# ✅ Correct
N8N_API_URL=https://n8n.example.com/api/v1

# ❌ Wrong
N8N_API_URL=https://n8n.example.com
```

### "Authentication failed"

- Verify your API key is correct
- Check that API access is enabled in n8n (Settings → API)
- Ensure your n8n instance is accessible from your machine

### "Workflow not found (404)"

If a workflow was deleted in n8n but exists locally:
- The tool will check if a workflow with the same name exists
- If found, it updates the existing workflow
- If not found, it creates a new workflow (inactive)
- Local file is updated with the correct workflow ID

### Duplicate Workflows

The tool prevents duplicates by checking workflow names before creating. If you see duplicates:
- They were likely created outside this tool
- Manually delete duplicates in n8n UI
- Run `pull` to sync local files with n8n state

## Support & Contributing

- **Issues**: Report bugs and request features on [GitHub Issues](https://github.com/integratingfactor/n8n-workflow-cli/issues)
- **Development**: See [DEVELOPMENT.md](https://github.com/integratingfactor/n8n-workflow-cli/blob/dev/DEVELOPMENT.md) for contributing guidelines
- **License**: MIT

## What's New

See [CHANGELOG.md](https://github.com/integratingfactor/n8n-workflow-cli/blob/dev/CHANGELOG.md) for version history and release notes.

---

**Made with ❤️ for the n8n community**
