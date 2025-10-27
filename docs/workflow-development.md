# Workflow Development Guide

This guide covers the SFDX-inspired development process for n8n workflows.

## Development Philosophy

If you're familiar with Salesforce DX (SFDX), this will feel natural:

1. **Build in n8n UI** → Visual workflow development (like scratch orgs)
2. **Pull to local** → `n8n-workflow-cli pull` (like `sfdx force:source:pull`)
3. **Version control** → Commit to Git
4. **Deploy** → `n8n-workflow-cli deploy` (like `sfdx force:source:deploy`)

**Key concept:** n8n instance = development environment. CLI = source control bridge.

## Quick Reference

```bash
# Compare local vs remote
n8n-workflow-cli diff

# Pull workflows from n8n
n8n-workflow-cli pull
n8n-workflow-cli pull --category business

# Validate workflow files
n8n-workflow-cli validate

# Deploy workflows
n8n-workflow-cli deploy
n8n-workflow-cli deploy workflows/business/my-workflow.json
```

## Development Workflow

### 1. Build in n8n Instance

**Develop visually:**
- Use n8n UI for workflow creation/modification
- Test with real data
- Add category tags (e.g., `business`, `management`, `shared`)
- Name credentials descriptively

**Why use the UI?**
- Visual building is faster
- Immediate testing and debugging
- Built-in node documentation

### 2. Pull to Source Control

```bash
# Pull changes from n8n
n8n-workflow-cli pull

# What gets saved:
# ✅ Workflow definition (nodes, connections, settings)
# ✅ Credential names (no IDs or values)
# ❌ Environment-specific IDs (auto-removed)
# ❌ Runtime state (execution history, timestamps)
```

### 3. Version Control with Git

```bash
# Review changes
git diff workflows/

# Commit
git add workflows/
git commit -m "feat: add customer registration workflow"
git push
```

### 4. Deploy to Environments

```bash
# Switch environment
export N8N_API_URL="https://n8n.staging.company.com/api/v1"
export N8N_API_KEY="staging-api-key"

# Preview deployment
n8n-workflow-cli diff

# Deploy
n8n-workflow-cli deploy
```

### 5. Post-Deployment Setup

**Required manual steps:**
1. Configure credentials in target n8n (same names, different values)
2. Verify sub-workflow references exist
3. Test workflow execution
4. Activate workflow (deploys inactive by default)

## Environment Management

**Switch environments like SFDX orgs:**

```bash
# Development
export N8N_API_URL="https://n8n.dev.company.com/api/v1"
export N8N_API_KEY="dev-key"

# Staging
export N8N_API_URL="https://n8n.staging.company.com/api/v1"
export N8N_API_KEY="staging-key"

# Production
export N8N_API_URL="https://n8n.company.com/api/v1"
export N8N_API_KEY="prod-key"
```

**Tip:** Create shell aliases:
```bash
alias n8n-dev='export N8N_API_URL="..." N8N_API_KEY="..."'
alias n8n-prod='export N8N_API_URL="..." N8N_API_KEY="..."'
```

## Best Practices

### Naming Conventions

**Workflows:**
- Descriptive kebab-case: `user-registration`, `order-processing`
- Include domain: `customer-order-processing`

**Nodes:**
- Clear labels: `HTTP Request - Get User Data`
- Consistent across workflows

**Credentials:**
- Descriptive with purpose: `PostgreSQL - Customer DB`
- Same names across environments
- Include environment if specific: `AWS S3 - Production Bucket`

### Credential Strategy

**Key principle:** Names in source control, values are not.

1. **Dev:** Create credentials with descriptive names
2. **Source:** Names stored, no IDs or values (safe for Git)
3. **Deploy:** Match by name, configure values manually in target environment

### Workflow Organization

```
workflows/
├── business/          # Main application workflows
│   ├── customer-registration.json
│   └── order-processing.json
├── management/        # Infrastructure workflows
│   ├── db-create-tables.json
│   └── cron-daily-cleanup.json
└── shared/           # Reusable sub-workflows
    └── send-email-template.json
```

### Tags

Add in n8n UI:
- **Category tags** (required for pull): `business`, `management`, `shared`
- **Domain tags**: `customer`, `order`, `notification`

## Common Scenarios

### Creating a New Workflow

```bash
# 1. Build in dev n8n (use UI), add category tag
# 2. Pull to local
n8n-workflow-cli pull --category business

# 3. Commit
git add workflows/business/new-workflow.json
git commit -m "feat: add new workflow"

# 4. Deploy to staging
export N8N_API_URL="https://n8n.staging.company.com/api/v1"
n8n-workflow-cli deploy workflows/business/new-workflow.json

# 5. Configure credentials in staging UI, test, activate
# 6. Deploy to production after approval
```

### Modifying Existing Workflow

```bash
# 1. Check current state
n8n-workflow-cli diff

# 2. Modify in dev n8n (use UI)
# 3. Pull changes
n8n-workflow-cli pull

# 4. Review and commit
git diff workflows/
git commit -am "fix: update error handling"

# 5. Deploy to environments
n8n-workflow-cli deploy workflows/business/existing-workflow.json
```

### Multi-Environment Deployment

```bash
# Build in dev
export N8N_API_URL="https://n8n.dev.company.com/api/v1"
# (modify in UI)
n8n-workflow-cli pull

# Commit
git commit -am "feat: payment workflow"

# Deploy to staging
export N8N_API_URL="https://n8n.staging.company.com/api/v1"
n8n-workflow-cli diff  # Preview
n8n-workflow-cli deploy
# (verify, configure credentials)

# Deploy to production
export N8N_API_URL="https://n8n.company.com/api/v1"
n8n-workflow-cli diff  # Preview
n8n-workflow-cli deploy
# (verify, configure credentials)
```

## Team Collaboration

### Workflow Ownership
- Assign developers to workflow categories
- Use Git branches for development
- Review changes in PRs

### Development Instance Strategy
- Shared dev instance for integration testing
- Individual dev instances for isolated work
- Staging for pre-production testing

### Code Review
- Review workflow JSON in PRs
- Verify no hardcoded credentials
- Test in dev before merging

## CI/CD Integration

```yaml
# GitHub Actions example
name: Deploy n8n Workflows

on:
  push:
    branches: [main]
    paths: ['workflows/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install CLI
        run: npm install -g @integratingfactor/n8n-workflow-cli
      
      - name: Validate
        run: n8n-workflow-cli validate
      
      - name: Deploy to production
        env:
          N8N_API_URL: ${{ secrets.N8N_PROD_API_URL }}
          N8N_API_KEY: ${{ secrets.N8N_PROD_API_KEY }}
        run: n8n-workflow-cli deploy
```

## Troubleshooting

### Credential not found after deployment
**Cause:** Credential doesn't exist in target environment

**Fix:** Create credential in target n8n with exact same name

### Sub-workflow not found
**Cause:** Referenced workflow doesn't exist in target

**Fix:** Deploy sub-workflow first, then parent workflow

### Webhook already registered
**Cause:** Multiple workflows using same webhook path

**Fix:** Use unique webhook paths per workflow

### Diff shows "modified" but no changes made
**Cause:** Environment-specific data in old workflow files

**Fix:** 
```bash
n8n-workflow-cli pull  # Re-pull to clean
git commit -am "chore: clean workflow definitions"
```

## Additional Resources

- [CLI Reference](cli-reference.md) - Complete command documentation
- [Architecture Decisions](architecture-decisions.md) - Design rationale
- [n8n Documentation](https://docs.n8n.io/) - n8n platform docs
- [n8n Community Forum](https://community.n8n.io/) - Community support
