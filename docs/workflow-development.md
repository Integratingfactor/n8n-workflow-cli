# Workflow Development Guide

This guide provides best practices and guidelines for developing n8n workflows using an SFDX-inspired development process.

## Development Philosophy: The SFDX Approach

If you're familiar with Salesforce DX (SFDX), this workflow will feel natural. Just like SFDX separates your org (runtime environment) from your source code (metadata), n8n-workflow-cli separates your n8n instance (runtime) from your workflow definitions (source).

**The familiar pattern:**
1. **Develop in instance** → Build/modify workflows in your n8n UI (like working in a scratch org)
2. **Pull to source** → Extract changes to local files (like `sfdx force:source:pull`)
3. **Version control** → Commit workflow definitions to Git
4. **Deploy to environments** → Push changes to dev/staging/prod (like `sfdx force:source:deploy`)
5. **Compare changes** → See what's different between local and remote (like `sfdx force:source:status`)

**Key concept:** Your n8n instance is the development environment where you visually build workflows. The CLI extracts the "source code" (workflow definitions) for version control and multi-environment deployment.

## Quick Start

> 📖 **New to this tool?** See the detailed [Quick Start Guide](README.md) for step-by-step instructions.

1. **Create configuration** - Create `n8n.config.json` in your workflow repository:
```json
{
  "workflowsDir": "./workflows",
  "categories": ["business", "management", "shared"]
}
```

2. **Set environment variables** - Configure your n8n credentials:

The CLI uses two simple environment variables:
- `N8N_API_URL` - Your n8n instance URL (must end with `/api/v1`)
- `N8N_API_KEY` - Your n8n API key

Switch environments by changing these variables as needed.

3. **Compare changes**:
```bash
# See what's different between local and remote (like sfdx force:source:status)
n8n-workflow-cli diff

# Compare specific category
n8n-workflow-cli diff business
```

4. **Pull workflows**:
```bash
# Pull all workflows with matching category tags
n8n-workflow-cli pull

# Pull only workflows tagged with "business"
n8n-workflow-cli pull --category business
```

5. **Validate workflows**:
```bash
n8n-workflow-cli validate
```

6. **Deploy workflows**:
```bash
# Deploy specific workflow
n8n-workflow-cli deploy workflows/business/my-workflow.json

# Deploy all workflows
n8n-workflow-cli deploy
```

## The SFDX-Inspired Development Workflow

### Development Cycle

```
┌─────────────────────────────────────────────────────────────┐
│  1. BUILD IN N8N INSTANCE (like working in scratch org)     │
│     - Visual workflow editor                                │
│     - Test with real data                                   │
│     - Iterate quickly                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. PULL TO SOURCE (like sfdx force:source:pull)            │
│     - n8n-workflow-cli pull                                 │
│     - Environment-specific IDs removed                      │
│     - Clean workflow definitions saved                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. VERSION CONTROL (standard Git workflow)                 │
│     - git add workflows/                                    │
│     - git commit -m "Add customer registration workflow"    │
│     - git push origin feature/customer-registration         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. COMPARE & VALIDATE (before deployment)                  │
│     - n8n-workflow-cli diff                                 │
│     - n8n-workflow-cli validate                             │
│     - Review changes in PR                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. DEPLOY TO ENVIRONMENTS (like sfdx force:source:deploy)  │
│     - Switch environment (change N8N_API_URL)               │
│     - n8n-workflow-cli deploy                               │
│     - Verify and activate in target environment             │
└─────────────────────────────────────────────────────────────┘
```

### Environment Management

**Similar to SFDX orgs, you manage multiple n8n instances:**

```bash
# Development environment
export N8N_API_URL="https://n8n.dev.company.com/api/v1"
export N8N_API_KEY="dev-api-key"
n8n-workflow-cli pull

# Staging environment
export N8N_API_URL="https://n8n.staging.company.com/api/v1"
export N8N_API_KEY="staging-api-key"
n8n-workflow-cli deploy

# Production environment
export N8N_API_URL="https://n8n.company.com/api/v1"
export N8N_API_KEY="prod-api-key"
n8n-workflow-cli deploy
```

**Pro tip:** Use shell aliases or scripts to switch environments quickly:
```bash
# .bashrc or .zshrc
alias n8n-dev='export N8N_API_URL="https://n8n.dev.company.com/api/v1" N8N_API_KEY="dev-key"'
alias n8n-staging='export N8N_API_URL="https://n8n.staging.company.com/api/v1" N8N_API_KEY="staging-key"'
alias n8n-prod='export N8N_API_URL="https://n8n.company.com/api/v1" N8N_API_KEY="prod-key"'
```

## Workflow Structure Best Practices

### Naming Conventions

**Workflow Names:**
- Use descriptive, kebab-case names: `user-registration`, `send-notification-email`
- Include the domain: `customer-order-processing`, `employee-onboarding`
- For management workflows, prefix with purpose: `db-create-tables`, `cron-daily-cleanup`

**Node Names:**
- Keep nodes clearly labeled for maintainability
- Use consistent naming across workflows
- Example: `HTTP Request - Get User Data`, `Function - Transform Response`

### Tagging Strategy

Always add appropriate tags to workflows in the n8n UI:

- **`business`**: Main application workflows
- **`management`**: Infrastructure/setup workflows
- **`shared`**: Reusable sub-workflows
- Add domain tags: `customer`, `order`, `notification`, etc.
- Add environment tags if workflow is environment-specific

### Workflow Organization

**Business Workflows** (`workflows/business/`)
```
workflows/business/
├── customer-registration.json
├── order-processing.json
├── payment-verification.json
└── notification-email-sender.json
```

**Management Workflows** (`workflows/management/`)
```
workflows/management/
├── db-create-tables.json
├── db-migrate-v2.json
├── cron-daily-cleanup.json
└── init-webhooks.json
```

**Shared Workflows** (`workflows/shared/`)
```
workflows/shared/
├── common-error-handler.json
├── send-email-template.json
└── validate-user-input.json
```

## Development Process

### Phase 1: Build in n8n Instance (Development Environment)

**Think of this as your "scratch org" for workflows:**

1. **Log into your development n8n instance**
2. **Create or modify workflows visually**
   - Use the workflow editor for rapid development
   - Test with real or mock data
   - Leverage n8n's built-in execution testing
3. **Tag workflows appropriately**
   - Add category tags (e.g., `business`, `management`, `shared`)
   - Category tags determine which folder they'll be pulled into
4. **Use placeholder credentials**
   - Name credentials descriptively (e.g., `PostgreSQL - Customer DB`, `Slack - Notifications`)
   - Same credential names will be used across environments
   - Actual credentials configured per environment

**Why develop in the UI?**
- Visual workflow building is faster than JSON editing
- Immediate testing and debugging
- See data flowing through nodes in real-time
- Use n8n's built-in node documentation

### Phase 2: Pull to Source Control

**Extract your "metadata" from the instance:**

```bash
# Pull all workflows with category tags
n8n-workflow-cli pull

# Pull specific category
n8n-workflow-cli pull --category business

# What gets pulled:
# ✅ Workflow definition (nodes, connections, settings)
# ✅ Credential names (without IDs or actual credentials)
# ✅ Node configuration and parameters
# ❌ Environment-specific IDs (removed automatically)
# ❌ Runtime state (execution history, staticData)
# ❌ Timestamps and version IDs
```

**What happens during pull:**
- Workflows are fetched from n8n API
- Environment-specific data is stripped out (IDs, timestamps, etc.)
- Clean workflow definitions saved to `workflows/<category>/`
- Files ready for Git commit

### Phase 3: Version Control (Standard Git Workflow)

**Treat workflow files like source code:**

```bash
# Check what changed
git status
git diff workflows/

# Review the changes
n8n-workflow-cli diff

# Commit your changes
git add workflows/business/customer-registration.json
git commit -m "feat: add customer registration workflow with email notification"

# Create PR for team review
git push origin feature/customer-registration
```

**Git best practices:**
- Create feature branches for new workflows
- Write descriptive commit messages
- Review workflow JSON changes in PRs
- Use `.gitignore` for environment-specific files (.env)

### Phase 4: Compare & Validate

**Before deploying, check what's different:**

```bash
# Compare all workflows
n8n-workflow-cli diff
# Output shows: Modified, Local Only, Remote Only, Identical

# Compare specific category
n8n-workflow-cli diff business

# Validate workflow structure
n8n-workflow-cli validate
```

**Understanding diff results:**
- **Modified**: Workflow changed locally or remotely
- **Local Only**: New workflow not yet deployed
- **Remote Only**: Workflow exists in n8n but not in source
- **Identical**: Perfect match (ready for deployment)

### Phase 5: Deploy to Target Environments

**Push your changes to staging or production:**

```bash
# Switch to target environment
export N8N_API_URL="https://n8n.staging.company.com/api/v1"
export N8N_API_KEY="staging-api-key"

# Preview what will be deployed
n8n-workflow-cli deploy --dry-run

# Deploy workflows
n8n-workflow-cli deploy

# Or deploy specific workflow
n8n-workflow-cli deploy workflows/business/customer-registration.json
```

**Important deployment notes:**
- **New workflows deploy as INACTIVE** (safety first)
- **IDs are intelligently merged** from existing workflows
- **Credentials must be configured** in target environment (names preserved, not values)
- **Sub-workflow references** may need verification
- **Webhooks automatically registered** when workflow activated

### Phase 6: Post-Deployment Verification

**Manual steps required in target environment:**

1. **Configure credentials** (if not already present)
   - Go to Credentials in n8n UI
   - Create credentials with same names as source
   - Use environment-appropriate values

2. **Verify sub-workflow references**
   - Check "Execute Workflow" nodes
   - Ensure referenced workflows exist in target environment

3. **Test the workflow**
   - Use n8n's "Execute Workflow" button
   - Test with staging/production data
   - Verify all nodes execute correctly

4. **Activate the workflow**
   - Only after successful testing
   - Monitor initial executions

## Development Best Practices

### Use Descriptive Names

**Workflow Names:**
- Use descriptive, kebab-case names: `user-registration`, `send-notification-email`
- Include the domain: `customer-order-processing`, `employee-onboarding`
- For management workflows, prefix with purpose: `db-create-tables`, `cron-daily-cleanup`

**Node Names:**
- Keep nodes clearly labeled for maintainability
- Use consistent naming across workflows
- Example: `HTTP Request - Get User Data`, `Function - Transform Response`

**Credential Names:**
- Be descriptive and include purpose: `PostgreSQL - Customer DB`, `Slack - Notifications Channel`
- Use same names across environments (values will differ per environment)
- Include environment in name if credential is environment-specific: `AWS S3 - Production Bucket`

### Credential Management Strategy

**Key principle:** Credential names are in source control, credential values are not.

1. **Development environment:**
   - Create credentials with descriptive names
   - Use dev/test values (mock APIs, test databases)
   - Names will be preserved during pull

2. **Source control:**
   - Workflow files contain credential names only
   - No credential IDs or values stored
   - Safe to commit to Git

3. **Target environments:**
   - Create credentials with exact same names
   - Use environment-appropriate values
   - CLI matches by name during deployment

**Example:**
```json
// In workflow file (safe for Git)
"credentials": {
  "PostgreSQL - Customer DB": {
    "name": "PostgreSQL - Customer DB"
  }
}
// No IDs, no passwords, no connection strings
```

### Planning Before Building

Before creating a workflow:
- Document the workflow purpose and trigger conditions
- Identify input/output requirements
- List required integrations and credentials
- Consider error handling requirements
- Plan for testing and validation
- Identify if it will reference other workflows (sub-workflows)

### Building in n8n UI

**Initial Setup:**
1. Log into your development n8n instance
2. Create a new workflow with descriptive name
3. Add category tag immediately (e.g., `business`, `management`)
4. Add domain-specific tags for organization

**Iterative Development:**
1. Start with the trigger node
2. Add nodes incrementally
3. Test each node using "Execute Node" feature
4. Verify data flowing through each node
5. Add error handling nodes
6. Use sticky notes to document complex logic

**Credential Best Practices:**
1. Create credentials with descriptive names
2. Use test/dev credentials during development
3. Document required credential types in workflow notes
4. Note any special credential configuration needed

**Testing in Development:**
1. Test with realistic data when possible
2. Test error conditions and edge cases
3. Verify all conditional branches
4. Check webhook endpoints (if applicable)
5. Test sub-workflow executions (if applicable)

### Team Collaboration

**Like SFDX, establish team conventions:**

1. **Workflow ownership:**
   - Assign developers to specific workflow categories
   - Use Git branches for workflow development
   - Review workflow changes in PRs

2. **Naming conventions:**
   - Agree on workflow naming patterns
   - Standardize node naming
   - Document credential naming convention

3. **Development instance strategy:**
   - Shared dev instance for testing integrations
   - Individual dev instances for isolated development
   - Staging instance for pre-production testing

4. **Code review process:**
   - Review workflow JSON changes in PRs
   - Test workflows in dev before merging
   - Require approval before production deployment

### CI/CD Integration

**Automate your workflow deployments:**

```yaml
# Example GitHub Actions workflow
name: Deploy n8n Workflows

on:
  push:
    branches: [main]
    paths:
      - 'workflows/**'

jobs:
  deploy-to-production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install n8n-workflow-cli
        run: npm install -g @integratingfactor/n8n-workflow-cli
      
      - name: Validate workflows
        run: n8n-workflow-cli validate
      
      - name: Deploy to production
        env:
          N8N_API_URL: ${{ secrets.N8N_PROD_API_URL }}
          N8N_API_KEY: ${{ secrets.N8N_PROD_API_KEY }}
        run: n8n-workflow-cli deploy
```

**Deployment strategies:**
- **Manual approval gates** for production
- **Automated deployment** to dev/staging on PR merge
- **Rollback plan** (Git revert + redeploy)
- **Monitoring** post-deployment workflow executions
4. Check webhook responses
5. Validate output format

### 3. Saving to Repository

After testing:
```bash
# Pull the workflow from n8n
n8n-workflow-cli pull

# Verify the changes
git status
git diff workflows/

# Commit with descriptive message
git add workflows/
git commit -m "feat: add customer registration workflow"
git push
```

## Common Scenarios

### Scenario 1: Creating a New Workflow

```bash
# 1. Build in dev n8n instance (use UI)
# 2. Add category tag in n8n
# 3. Pull to local
n8n-workflow-cli pull --category business

# 4. Verify what was pulled
git status
n8n-workflow-cli validate

# 5. Commit to Git
git add workflows/business/new-workflow.json
git commit -m "feat: add new customer workflow"
git push origin feature/new-workflow

# 6. Deploy to staging for testing
export N8N_API_URL="https://n8n.staging.company.com/api/v1"
n8n-workflow-cli deploy workflows/business/new-workflow.json

# 7. Configure credentials in staging UI
# 8. Test and verify in staging
# 9. Deploy to production after approval
export N8N_API_URL="https://n8n.company.com/api/v1"
n8n-workflow-cli deploy workflows/business/new-workflow.json
```

### Scenario 2: Modifying an Existing Workflow

```bash
# 1. Check current state
n8n-workflow-cli diff

# 2. Modify workflow in dev n8n instance (use UI)
# 3. Pull changes
n8n-workflow-cli pull

# 4. Review changes
git diff workflows/business/existing-workflow.json

# 5. Commit changes
git add workflows/business/existing-workflow.json
git commit -m "fix: update error handling in customer workflow"
git push

# 6. Deploy to environments
n8n-workflow-cli deploy workflows/business/existing-workflow.json
```

### Scenario 3: Syncing from Remote

```bash
# Someone else deployed a workflow, pull it down
n8n-workflow-cli diff
# Shows "Remote Only: new-workflow-by-teammate"

n8n-workflow-cli pull
# Pulls the new workflow

git add workflows/
git commit -m "chore: sync workflows from remote"
```

### Scenario 4: Multi-Environment Deployment

```bash
# Build in dev
export N8N_API_URL="https://n8n.dev.company.com/api/v1"
# (modify workflow in UI)
n8n-workflow-cli pull

# Commit to Git
git add workflows/ && git commit -m "feat: payment processing workflow"

# Deploy to staging
export N8N_API_URL="https://n8n.staging.company.com/api/v1"
n8n-workflow-cli diff  # Preview changes
n8n-workflow-cli deploy
# (verify in staging UI, configure credentials)

# Deploy to production
export N8N_API_URL="https://n8n.company.com/api/v1"
n8n-workflow-cli diff  # Preview changes
n8n-workflow-cli deploy
# (verify in production UI, configure credentials)
```

## Troubleshooting

### "Workflow exists but diff shows as modified"

**Cause:** Environment-specific data present before v1.2.0

**Solution:**
```bash
# Pull workflows to clean them
n8n-workflow-cli pull

# Commit the cleaned versions
git add workflows/
git commit -m "chore: clean workflow definitions"
```

### "Credential not found after deployment"

**Cause:** Credential doesn't exist in target environment or has different name

**Solution:**
1. Check credential name in workflow file
2. Create credential in target n8n instance with exact same name
3. Re-test the workflow

### "Sub-workflow not found"

**Cause:** Referenced workflow doesn't exist in target environment

**Solution:**
```bash
# Deploy the sub-workflow first
n8n-workflow-cli deploy workflows/shared/sub-workflow.json

# Then deploy the parent workflow
n8n-workflow-cli deploy workflows/business/parent-workflow.json
```

### "Webhook already registered"

**Cause:** Multiple workflows trying to use same webhook path

**Solution:**
1. Use unique webhook paths per workflow
2. Check existing webhooks in n8n instance
3. Update webhook path in workflow and redeploy

## Advanced Topics

### 4. Code Review

Before deploying to production:
- Have another developer review the workflow JSON
- Verify no hardcoded credentials or secrets
- Check for proper error handling
- Ensure documentation is complete

### 5. Deployment

Deploy to production after approval:
```bash
# Deploy to production (make sure N8N_API_URL & N8N_API_KEY are set to PROD)
n8n-workflow-cli deploy
```

## Error Handling

### Standard Error Handler Pattern

Every workflow should include error handling:

1. **Add Error Trigger Node**
   - Catches errors from any node in the workflow
   - Position at the end of the workflow

2. **Log the Error**
   - Send to logging service
   - Include workflow name, node name, error message
   - Add timestamp and context

3. **Notify on Critical Errors**
   - Send alert to appropriate channel (Slack, email, etc.)
   - Include sufficient debug information
   - Don't expose sensitive data in notifications

4. **Handle Gracefully**
   - Return appropriate error response for webhooks
   - Don't leave processes hanging
   - Clean up resources if needed

### Example Error Handling Structure

```
[Main Workflow Nodes]
    ↓ (on error)
[Error Trigger]
    ↓
[Function - Format Error]
    ↓
[If - Is Critical?]
    ├─ Yes → [Send Alert]
    └─ No  → [Log Only]
```

## Credentials Management

### Never Hardcode Credentials

❌ **Wrong:**
```json
{
  "parameters": {
    "authentication": "headerAuth",
    "headerAuth": {
      "name": "Authorization",
      "value": "Bearer abc123xyz"  // Never do this!
    }
  }
}
```

✅ **Correct:**
```json
{
  "parameters": {
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "apiKeyAuth"
  },
  "credentials": {
    "apiKeyAuth": {
      "id": "1",
      "name": "My API Credentials"
    }
  }
}
```

### Credential Best Practices

1. Create credentials in n8n UI (Settings > Credentials)
2. Use descriptive names: `Production Database`, `Test API Key`
3. Never commit credentials to repository
4. Use different credentials for test and production
5. Rotate credentials regularly
6. Limit credential access by user/role

## Performance Optimization

### Minimize API Calls
- Batch requests when possible
- Cache frequently accessed data
- Use webhook responses efficiently

### Optimize Node Configuration
- Limit data returned in HTTP requests
- Use filters early in the workflow
- Avoid unnecessary transformations

### Handle Large Datasets
- Use pagination for large datasets
- Process data in batches
- Consider workflow splitting for very large operations

## Testing Workflows

### Unit Testing Individual Nodes
1. Use "Execute Node" in n8n UI
2. Verify input/output for each node
3. Test edge cases and error conditions

### Integration Testing
1. Test full workflow end-to-end
2. Use test data that mirrors production
3. Verify external integrations work correctly

### Validation Checklist

Before committing:
- [ ] All nodes execute successfully
- [ ] Error handling is implemented
- [ ] No hardcoded credentials or secrets
- [ ] Workflow is properly tagged
- [ ] Complex logic is documented with notes
- [ ] Webhook responses are validated
- [ ] JSON is properly formatted

```bash
# Validate JSON structure
n8n-workflow-cli validate
```

## Documentation

### Inline Documentation

Use Note nodes in workflows to document:
- Workflow purpose and trigger
- Complex logic or business rules
- Expected input/output formats
- Integration requirements
- Known limitations or issues

### README Documentation

For complex workflows, add documentation:
```
docs/workflows/
├── customer-registration.md
├── order-processing.md
└── payment-verification.md
```

Include:
- Overview and purpose
- Trigger conditions
- Input/output specifications
- Required credentials
- Error handling approach
- Testing procedures
- Deployment notes

## Version Control Best Practices

### Commit Messages

Use conventional commit format:
```
feat: add customer registration workflow
fix: correct email validation in user-signup
refactor: optimize payment processing logic
docs: update workflow development guide
```

### Branch Strategy

- `main`: Production-ready workflows
- `develop`: Development branch for testing
- `feature/*`: New workflow development
- `fix/*`: Bug fixes

### Pull Request Process

1. Create feature branch from `develop`
2. Develop and test workflow
3. Pull workflow to repository
4. Create PR with description
5. Request review from team member
6. Deploy to test environment for validation
7. Merge to `develop`, then `main` when ready

## Troubleshooting

### Workflow Not Executing
- Check trigger conditions
- Verify credentials are valid
- Check workflow is activated
- Review execution logs in n8n

### Data Not Flowing Between Nodes
- Verify node connections
- Check output data structure
- Use "Execute Node" to debug
- Review expression syntax

### API Integration Issues
- Test API endpoints independently
- Verify authentication method
- Check request headers and body
- Review API rate limits

## Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community Forum](https://community.n8n.io/)
- [n8n API Reference](https://docs.n8n.io/api/)
- [n8n Node Reference](https://docs.n8n.io/nodes/)

## Support

For workflow development questions:
1. Check this guide and n8n documentation
2. Search n8n community forum
3. Ask in team chat/channel
4. Create an issue in this repository
