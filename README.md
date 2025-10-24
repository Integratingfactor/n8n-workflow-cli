# n8n Workflow CLI# n8n Workflow CLI



A command-line tool for managing n8n workflows as code. Keep your workflows in version control, collaborate with your team, and deploy across environments with confidence.A powerful CLI tool for managing n8n workflows across multiple environments with support for tags, validation, and automated deployment.



## Why Use This Tool?## Features



- 📁 **Workflows as Code** - Store workflows in Git alongside your project code- 🚀 **Multi-environment support** - Deploy to dev, test, prod environments

- 🏷️ **Organized by Categories** - Tag and filter workflows by project/team using n8n tags- 🏷️ **Advanced tags management** - Automatic tag creation and assignment

- 🔄 **Bi-directional Sync** - Pull workflows from n8n, edit locally, and deploy back- ✅ **Workflow validation** - Comprehensive JSON schema validation

- ✅ **Validation** - Catch errors before deployment with built-in validation- 🔄 **Pull/Push workflows** - Sync workflows between environments

- 🛡️ **Safe Deployments** - New workflows are created inactive; no duplicate workflows- ⚡ **Parallel deployment** - Deploy multiple workflows simultaneously

- 🚀 **Multi-Environment** - Switch between dev/staging/prod by changing environment variables- 🔍 **Dry-run mode** - Test deployments without making changes



## Installation## Installation



Install globally to use across all your projects:### Global Installation

## Installation

```bash

npm install -g @integratingfactor/n8n-workflow-cli```bash

```npm install -g @integratingfactor/n8n-workflow-cli

```

Or install as a dev dependency in your project:

## Quick Start

```bash

npm install --save-dev @integratingfactor/n8n-workflow-cli### Project Installation

``````bash

npm install --save-dev @integratingfactor/n8n-workflow-cli

## Quick Start```



### 1. Setup Your Workflow Project## Quick Start



Create a new directory for your n8n workflows:> 📖 **New to this tool?** See the detailed [Quick Start Guide](QUICKSTART.md) for step-by-step instructions.



```bash1. **Create configuration** - Create `n8n.config.json` in your workflow repository:

mkdir my-n8n-workflows```json

cd my-n8n-workflows{

git init  "workflowsDir": "./workflows",

```  "categories": ["business", "management", "shared"]

}

### 2. Create Configuration File```



Create `n8n.config.json` in your project root:2. **Set environment variables** - Configure your n8n credentials:



```jsonThe CLI uses two simple environment variables:

{- `N8N_API_URL` - Your n8n instance URL (must end with `/api/v1`)

  "workflowsDir": "./workflows",- `N8N_API_KEY` - Your n8n API key

  "categories": ["business", "management", "shared"]

}Switch environments by changing these variables as needed.

```

**Option 1: Using .env file (recommended for local development)**

**Configuration Options:**```bash

- `workflowsDir`: Directory where workflow JSON files are stored (relative to config file)# Copy the example file

- `categories`: List of workflow categories (used as n8n tags for organization)cp .env.example .env



### 3. Configure n8n Connection# Edit .env with your values

N8N_API_URL=https://n8n.dev.company.com/api/v1

The CLI needs two environment variables to connect to your n8n instance:N8N_API_KEY=your-dev-api-key

```

- `N8N_API_URL` - Your n8n instance API URL (must end with `/api/v1`)

- `N8N_API_KEY` - Your n8n API key (from Settings → API in n8n)**Option 2: Using shell exports**

```bash

**Option A: Using .env file** (recommended for local development)# For dev environment

export N8N_API_URL="https://n8n.dev.company.com/api/v1"

Create a `.env` file in your project root:export N8N_API_KEY="your-dev-api-key"



```env# For prod environment

N8N_API_URL=https://your-n8n-instance.com/api/v1export N8N_API_URL="https://n8n.prod.company.com/api/v1"

N8N_API_KEY=your-api-key-hereexport N8N_API_KEY="your-prod-api-key"

``````



Add `.env` to your `.gitignore`:> **💡 Important:** The `n8n.config.json` file should be **committed to your repository**. It contains only workflow organization settings (categories, directory). All credentials are in environment variables. The `.env` file is gitignored for security.



```bash### Categories Configuration

echo ".env" >> .gitignore

```Categories help organize workflows into folders in your repository:



**Option B: Export environment variables**- **Define categories** in the `categories` array - customize for your project needs (e.g., `["api", "automation", "monitoring"]`)

- **Commit the config** - The `n8n.config.json` file with your categories should be committed so the team shares the same organization

```bash- **Tag workflows in n8n** - Only workflows with tags matching a category name will be pulled

export N8N_API_URL=https://your-n8n-instance.com/api/v1- **Filter by category** - Use `--category` option to pull only specific category workflows

export N8N_API_KEY=your-api-key-here

```Example: A workflow tagged with `business` in n8n will be saved to `workflows/business/` when pulled.



**Option C: CI/CD Environments**3. **Pull workflows**:

```bash

Set these as secrets/environment variables in your CI/CD platform (GitHub Actions, GitLab CI, etc.)# Pull all workflows with matching category tags

n8n-workflow-cli pull

### 4. Pull Existing Workflows

# Pull only workflows tagged with "business"

Pull workflows from your n8n instance:n8n-workflow-cli pull --category business

```

```bash

n8n-workflow-cli pull4. **Validate workflows**:

``````bash

n8n-workflow-cli validate

This creates workflow JSON files in your `workflowsDir`, organized by category.```



### 5. Make Changes and Deploy5. **Deploy workflows**:

```bash

Edit workflow files locally, then deploy:n8n-workflow-cli deploy workflows/business/my-workflow.json

```

```bash

n8n-workflow-cli deploy## Documentation

```

- [CLI Reference](docs/cli-reference.md) - Complete command documentation

**Important:** New workflows are created as **inactive** for safety. You must:- [Architecture Decisions](docs/architecture-decisions.md) - Design rationale

1. Verify the workflow in n8n UI- [Workflow Development Guide](docs/workflow-development.md) - Best practices for workflow development

2. Configure credentials and connections

3. Test the workflow## Workflow Project Template

4. Manually activate it when ready

Use this template for workflow repositories:

## Common Workflows

```json

### Working with Categories{

  "name": "my-workflows",

Categories are implemented as n8n tags. Only workflows tagged with your configured categories are managed by this tool.  "scripts": {

    "validate": "n8n-workflow-cli validate",

**Pull workflows from specific category:**    "pull": "n8n-workflow-cli pull",

    "deploy": "n8n-workflow-cli deploy",

```bash    "list": "n8n-workflow-cli list"

n8n-workflow-cli pull --category business  },

```  "devDependencies": {

    "@integratingfactor/n8n-workflow-cli": "^1.0.6"

**List workflows by category:**  }

}

```bash```

n8n-workflow-cli list

```## Development



### Validating Workflows### Setting Up After Cloning



Check for errors before deploying:If you've cloned this repository to contribute or modify the tool:



```bash1. **Install dependencies:**

n8n-workflow-cli validate```bash

```npm install

```

### Viewing Remote Workflows

2. **Build the project:**

See what's in your n8n instance:```bash

npm run build

```bash```

n8n-workflow-cli list --remote

```3. **Run in development mode:**



### Multi-Environment Setup> **Note:** Use `npm run dev -- <command>` (with `--`) for all CLI commands during development.



To manage multiple environments (dev, staging, prod), use different `.env` files or environment variable sets:```bash

# Run commands directly without building

**Development:**npm run dev -- list

```bashnpm run dev -- --help

export N8N_API_URL=https://dev.n8n.example.com/api/v1npm run dev -- deploy --dry-run

export N8N_API_KEY=dev-api-key

n8n-workflow-cli deploy# Or use the built version

```node dist/cli.js --help

```

**Production:**

```bash4. **Test with a real n8n instance:**

export N8N_API_URL=https://prod.n8n.example.com/api/v1```bash

export N8N_API_KEY=prod-api-key# The repo already has n8n.config.json

n8n-workflow-cli deploy# Set your environment variables

```export N8N_DEV_URL="https://your-n8n-dev.com/api/v1"

export N8N_DEV_API_KEY="your-api-key-here"

Or use multiple `.env` files:

```bash# Try pulling workflows

cp .env.dev .env  # Switch to devnpm run dev -- pull

n8n-workflow-cli deploy```



cp .env.prod .env  # Switch to prod5. **Link globally for testing:**

n8n-workflow-cli deploy```bash

```npm link

n8n-workflow-cli --help

## CLI Commands```



### `pull`### Project Structure



Pull workflows from n8n to local files:```

n8n-workflow-cli/

```bash├── src/

n8n-workflow-cli pull [options]│   ├── cli.ts              # CLI entry point

```│   ├── api-client.ts       # n8n API client

│   ├── config.ts           # Configuration management

**Options:**│   ├── workflow-manager.ts # Workflow file operations

- `--category <category>` - Only pull workflows with this category tag│   ├── types.ts            # TypeScript types

│   └── commands/           # Command implementations

**Examples:**│       ├── deploy.ts

```bash│       ├── list.ts

# Pull all workflows│       ├── pull.ts

n8n-workflow-cli pull│       └── validate.ts

├── dist/                   # Compiled JavaScript (gitignored)

# Pull only business workflows├── docs/                   # Documentation

n8n-workflow-cli pull --category business└── workflows/              # Example workflows (gitignored locally)

``````



### `deploy`### Available Scripts



Deploy local workflows to n8n:- `npm run build` - Compile TypeScript to JavaScript

- `npm run dev -- <command>` - Run CLI in development mode

```bash- `npm run dev -- --help` - See all available commands

n8n-workflow-cli deploy [options]

```## Contributing



**Options:**Contributions are welcome! Please:

- `--dry-run` - Show what would be deployed without making changes

1. Fork the repository

**Examples:**2. Create a feature branch

```bash3. Make your changes with clear commit messages

# Deploy all workflows4. Test your changes thoroughly

n8n-workflow-cli deploy5. Submit a pull request



# Preview deployment without making changes## License

n8n-workflow-cli deploy --dry-run

```MIT


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
- `--remote` - List workflows from n8n instead of local files

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
├── .env                    # Environment variables (gitignored)
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
