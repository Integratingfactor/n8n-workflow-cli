# Quick Start Guide

> **Important:** There are two ways to use this tool:
> - **For Users:** Install globally with `npm install -g` and use `n8n-workflow-cli <command>`
> - **For Contributors:** Clone the repo and use `npm run dev -- <command>` (note the `--`)

## For Users (Installing from npm)

### 1. Install the CLI
## Installation

```bash
npm install -g @integratingfactor/n8n-workflow-cli
```

## Prerequisites

### 2. Set up your project
```bash
# Create a workflows directory
mkdir -p my-n8n-workflows/workflows
cd my-n8n-workflows

# Initialize your repository
git init
npm init -y

# Create n8n.config.json
cat > n8n.config.json << 'EOF'
{
  "workflowsDir": "./workflows",
  "categories": ["business", "management", "shared"]
}
EOF

# Set environment variables - choose one method:

# Method 1: Create .env file (recommended for local development)
cat > .env << 'EOF'
N8N_API_URL=https://n8n.dev.company.com/api/v1
N8N_API_KEY=your-dev-api-key
EOF

# Method 2: Export environment variables (for CI/CD)
export N8N_API_URL="https://n8n.dev.company.com/api/v1"
export N8N_API_KEY="your-dev-api-key"

# Commit the config (it's safe - no secrets inside)
git add n8n.config.json
git commit -m "Add n8n configuration"
```

> **Important:** The `n8n.config.json` file should be **committed to your repository**. It contains only your workflow organization (categories, directory). All secrets (URLs and API keys) are in environment variables. The `.env` file (if used) is gitignored for security.

> **Categories:** Categories define which workflows are pulled and how they're organized:
> - Only workflows with tags matching a category (e.g., `business`, `management`, `shared`) will be pulled
> - Workflows are saved to `workflows/<category>/` folders based on their tag
> - Customize categories for your project (e.g., `["api", "automation", "monitoring"]`)

### 3. Tag your workflows in n8n

Before pulling, ensure your workflows in n8n are tagged with category names (e.g., `business`, `management`, `shared`).

### 4. Pull workflows from n8n
```bash
# Pull all workflows with matching category tags
n8n-workflow-cli pull

# Pull only workflows tagged with "business"
n8n-workflow-cli pull --category business
```

### 5. Common commands
```bash
# List all workflows
n8n-workflow-cli list

# List workflows in remote n8n instance
n8n-workflow-cli list --remote

# Validate all workflows
n8n-workflow-cli validate

# Deploy all workflows
n8n-workflow-cli deploy

# Deploy specific workflow
n8n-workflow-cli deploy workflows/business/my-workflow.json

# Dry run (test without changes)
n8n-workflow-cli deploy --dry-run
```

## For Contributors (Cloning the repo)

### 1. Clone and install
```bash
git clone https://github.com/integratingfactor/n8n-workflow-cli.git
cd n8n-workflow-cli
npm install
```

### 2. Build the project
```bash
npm run build
```

### 3. Run in development mode

**Important:** When developing, use `npm run dev -- <command>` (note the `--` before the command).

```bash
# See all commands
npm run dev -- --help

# Test commands without building
npm run dev -- list
npm run dev -- validate
npm run dev -- deploy --dry-run
```

### 4. Test with your n8n instance
```bash
# The repo already has n8n.config.json
# Set environment variables for your n8n instance
export N8N_API_URL="https://your-n8n.com/api/v1"
export N8N_API_KEY="your-key-here"

# Test pulling workflows (use npm run dev -- for all commands)
npm run dev -- pull

# Test deploying
npm run dev -- deploy --dry-run

# Test listing with remote
npm run dev -- list --remote
```

### 5. Link globally for testing
```bash
npm link
n8n-workflow-cli --help
```

### 6. Make changes and rebuild
```bash
# After editing TypeScript files
npm run build

# Or use dev mode (no build needed)
npm run dev -- list
```

## Getting n8n API Keys

1. Log into your n8n instance
2. Go to **Settings** → **API**
3. Click **Create API Key**
4. Copy the key and store it securely
5. Set it as an environment variable (recommended) or in your config file

## Project Structure

```
your-workflow-project/
├── n8n.config.json         # Config with categories (committed to repo)
├── .env                    # Environment variables (gitignored)
├── workflows/              # Your workflows
│   ├── business/
│   ├── management/
│   └── shared/
└── package.json
```

## Tips

- **Security**: Keep API keys in environment variables or `.env` file, never in the config file
- **Commit Config**: The `n8n.config.json` should be committed with your project
- **Use .env**: Create a `.env` file for local development, commit `.env.example` for team reference
- **Environment Variables**: Use `${VAR_NAME}` syntax in config to reference env vars
- **Categories**: Organize workflows into categories for better management
- **Dry Run**: Always test with `--dry-run` before deploying to production
- **Validation**: Run `validate` before deploying to catch errors early

## Troubleshooting

### "npm ERR! Missing script: deploy" (or other commands)
You're trying to run `npm run deploy` which doesn't exist. Use one of these instead:

**If you're developing (cloned the repo):**
```bash
npm run dev -- deploy          # Correct
npm run deploy                 # ❌ Wrong
```

**If you installed globally:**
```bash
n8n-workflow-cli deploy        # Correct
npm run deploy                 # ❌ Wrong
```

### "Configuration file not found"
Create `n8n.config.json` in your project directory or current working directory.

### "Failed to connect to n8n API"
- Check your `baseUrl` is correct _(include `/api/v1` resource path)_
- Verify your API key is valid
- Ensure n8n instance is accessible from your network

### "No workflows found"
- Run `pull <environment>` first to download workflows
- Check that `workflowsDir` in config points to the right directory
- Ensure workflows are in the correct category subdirectories

### Module errors after cloning
Run `npm install` to install all dependencies.

## Next Steps

- Read the [CLI Reference](docs/cli-reference.md) for all commands
- See [Architecture Decisions](docs/architecture-decisions.md) for design details
- Check out [Workflow Development](docs/workflow-development.md) best practices
