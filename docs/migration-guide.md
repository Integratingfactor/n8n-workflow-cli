# Migration Guide: Shell Scripts → TypeScript CLI

This guide helps you migrate from the legacy bash scripts to the new TypeScript CLI.

## Why Migrate?

The new TypeScript CLI offers:

✅ **Type Safety** - Catch errors at development time  
✅ **Better Error Handling** - Clear error messages and retry logic  
✅ **Rich CLI Features** - Spinners, colors, progress indicators  
✅ **Parallel Deployments** - Deploy multiple workflows simultaneously  
✅ **Dry Run Mode** - Preview changes before applying  
✅ **Easier Testing** - Unit testable code  
✅ **CI/CD Ready** - Works perfectly in containers  

## Installation

```bash
npm install
```

## Command Migration

### Pull Workflows

**Old (Bash):**
```bash
./scripts/legacy/pull-workflows.sh test
./scripts/legacy/pull-workflows.sh production
```

**New (TypeScript):**
```bash
npm run pull -- test
npm run pull -- production
# Or with category filter
npm run pull -- test --category management
```

### Deploy Workflows

**Old (Bash):**
```bash
./scripts/legacy/deploy-workflows.sh test all
./scripts/legacy/deploy-workflows.sh production management
./scripts/legacy/deploy-workflows.sh test workflows/business/user-registration.json
```

**New (TypeScript):**
```bash
npm run deploy -- test
npm run deploy -- production management
npm run deploy -- test workflows/business/user-registration.json

# New features:
npm run deploy -- test --dry-run         # Preview changes
npm run deploy -- production --parallel   # Faster deployment
```

### Execute Workflow

**Old (Bash):**
```bash
./scripts/legacy/execute-workflow.sh test create-tables
./scripts/legacy/execute-workflow.sh production 123
```

**New (TypeScript):**
```bash
npm run execute -- create-tables test
npm run execute -- 123 production
```

### List Workflows

**Old (Bash):**
```bash
./scripts/legacy/list-workflows.sh test
```

**New (TypeScript):**
```bash
npm run list
npm run list -- test --remote  # Also show remote workflows
```

### Validate Workflows

**Old (Bash):**
```bash
./scripts/legacy/validate-workflows.sh
```

**New (TypeScript):**
```bash
npm run validate
```

## Using npx (Alternative)

Instead of `npm run <command>`, you can use `npx` after building:

```bash
npm run build  # Build once

# Then use npx
npx n8n-workflows pull test
npx n8n-workflows deploy production --parallel
npx n8n-workflows execute create-tables test
npx n8n-workflows list --remote
npx n8n-workflows validate
```

## New Features Not Available in Bash

### Dry Run
Preview deployment without making changes:
```bash
npm run deploy -- production --dry-run
```

### Parallel Deployment
Deploy multiple workflows simultaneously:
```bash
npm run deploy -- production --parallel
```

### Category Filtering
Pull only specific workflow categories:
```bash
npm run pull -- test --category management
```

### Remote Listing
Compare local and remote workflows:
```bash
npm run list -- test --remote
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Validate workflows
        run: npm run validate
      
      - name: Deploy to production
        env:
          N8N_API_URL: ${{ secrets.N8N_PROD_API_URL }}
          N8N_API_KEY: ${{ secrets.N8N_PROD_API_KEY }}
        run: |
          echo "N8N_API_URL=$N8N_API_URL" > config/prod.env
          echo "N8N_API_KEY=$N8N_API_KEY" >> config/prod.env
          npm run deploy -- prod --parallel
```

### Google Cloud Build

```yaml
steps:
  # Install dependencies
  - name: 'node:18'
    entrypoint: npm
    args: ['ci']
  
  # Validate workflows
  - name: 'node:18'
    entrypoint: npm
    args: ['run', 'validate']
  
  # Deploy to production
  - name: 'node:18'
    entrypoint: npm
    args: ['run', 'deploy', '--', 'production', '--parallel']
    env:
      - 'N8N_API_URL=${_N8N_API_URL}'
      - 'N8N_API_KEY=${_N8N_API_KEY}'
```

## Docker Usage

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Copy source and build
COPY . .
RUN npm run build

# Run command
ENTRYPOINT ["npx", "n8n-workflows"]
CMD ["--help"]
```

Build and use:
```bash
docker build -t n8n-workflows .
docker run --rm -v $(pwd)/config:/app/config n8n-workflows deploy production
```

## Troubleshooting

### "Cannot find module" errors
Install dependencies:
```bash
npm install
```

### TypeScript compilation errors
Rebuild the project:
```bash
npm run clean
npm run build
```

### Permission denied
Make sure you have Node.js 18+ installed:
```bash
node --version  # Should be >= 18.0.0
```

## Keeping Bash Scripts

The legacy bash scripts are still available in `scripts/legacy/` if you need them:

```bash
./scripts/legacy/pull-workflows.sh test
./scripts/legacy/deploy-workflows.sh production
./scripts/legacy/execute-workflow.sh test workflow-name
./scripts/legacy/list-workflows.sh test
./scripts/legacy/validate-workflows.sh
```

However, they are **deprecated** and won't receive new features.

## Questions?

- Check the main [README.md](../README.md)
- Review [workflow-development.md](workflow-development.md)
- Review [deployment-guide.md](deployment-guide.md)
- Ask in your team chat

## Summary

| Feature | Bash Scripts | TypeScript CLI |
|---------|-------------|----------------|
| Type Safety | ❌ | ✅ |
| Error Handling | Basic | Advanced |
| Parallel Deploy | ❌ | ✅ |
| Dry Run | ❌ | ✅ |
| Category Filter | ❌ | ✅ |
| Remote Listing | Basic | Enhanced |
| CI/CD Ready | ✅ | ✅✅ |
| Testable | ❌ | ✅ |
| Maintainable | 🟡 | ✅ |

**Recommendation:** Migrate to TypeScript CLI for all new workflows and automation.
