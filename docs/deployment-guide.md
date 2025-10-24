# Deployment Guide

This guide covers deployment procedures for n8n workflows across different environments.

## Environment Overview

### Test Environment
- **Purpose**: Development and testing
- **URL**: Configure in `config/test.env`
- **Usage**: All new workflows and changes are tested here first
- **Stability**: May be unstable, frequent changes expected

### Production Environment
- **Purpose**: Live business operations
- **URL**: Configure in `config/production.env`
- **Usage**: Only tested, approved workflows
- **Stability**: Highly stable, changes follow strict process

## Pre-Deployment Checklist

Before deploying any workflow to production:

### Code Quality
- [ ] Workflow tested thoroughly in test environment
- [ ] All nodes execute successfully
- [ ] Error handling implemented
- [ ] No hardcoded credentials or secrets
- [ ] Code reviewed by another team member
- [ ] JSON validated: `./scripts/validate-workflows.sh`

### Documentation
- [ ] Workflow purpose documented
- [ ] Complex logic explained with notes
- [ ] Dependencies identified
- [ ] Rollback procedure documented

### Security
- [ ] No sensitive data in workflow
- [ ] Proper credentials configured
- [ ] API rate limits considered
- [ ] Data privacy requirements met

### Testing
- [ ] Unit tests passed (individual nodes)
- [ ] Integration tests passed (full workflow)
- [ ] Edge cases tested
- [ ] Error conditions tested
- [ ] Performance validated

## Deployment Procedures

### Standard Workflow Deployment

#### Step 1: Prepare the Workflow

Ensure workflow is in repository:
```bash
# If created in test n8n UI, pull it first
./scripts/pull-workflows.sh test

# Validate the workflow
./scripts/validate-workflows.sh

# Review changes
git status
git diff workflows/
```

#### Step 2: Commit and Push

```bash
git add workflows/
git commit -m "feat: add <workflow-name>"
git push origin main
```

#### Step 3: Deploy to Production

```bash
# Deploy all workflows
./scripts/deploy-workflows.sh production

# Or deploy specific category
./scripts/deploy-workflows.sh production business

# Or deploy single workflow
./scripts/deploy-workflows.sh production workflows/business/customer-registration.json
```

#### Step 4: Activate and Verify

1. Log into production n8n instance
2. Locate the deployed workflow
3. Click "Activate" to enable the workflow
4. Test the workflow (if it has a manual trigger or test webhook)
5. Monitor initial executions in the execution log

### Management Workflow Deployment

Management workflows often need immediate execution after deployment.

#### Example: Database Migration

```bash
# Deploy the migration workflow
./scripts/deploy-workflows.sh production workflows/management/db-migrate-v2.json

# Execute the workflow immediately
./scripts/execute-workflow.sh production db-migrate-v2

# Verify execution completed successfully
# (Check the output or log into n8n to view execution history)
```

#### Example: Initial Setup

When setting up a new n8n instance:

```bash
# 1. Deploy all management workflows
./scripts/deploy-workflows.sh production management

# 2. Execute setup workflows in order
./scripts/execute-workflow.sh production db-create-tables
./scripts/execute-workflow.sh production init-webhooks
./scripts/execute-workflow.sh production setup-cron-jobs

# 3. Deploy business workflows
./scripts/deploy-workflows.sh production business

# 4. Deploy shared workflows
./scripts/deploy-workflows.sh production shared
```

## Rollback Procedures

If a deployment causes issues, follow this rollback process:

### Method 1: Git Revert and Redeploy

```bash
# Revert the commit
git revert <commit-hash>
git push origin main

# Redeploy from previous version
./scripts/deploy-workflows.sh production
```

### Method 2: Manual Deactivation

1. Log into production n8n instance
2. Locate the problematic workflow
3. Click "Deactivate" to stop it immediately
4. Investigate the issue
5. Fix and redeploy when ready

### Method 3: Restore from Backup

If workflow was deleted or corrupted:

```bash
# Get the previous version from git
git checkout <previous-commit> -- workflows/business/<workflow-name>.json

# Redeploy
./scripts/deploy-workflows.sh production workflows/business/<workflow-name>.json

# Commit the restoration
git add workflows/business/<workflow-name>.json
git commit -m "fix: restore <workflow-name> to working version"
git push origin main
```

## Continuous Deployment Setup

### Option 1: GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    paths:
      - 'workflows/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Validate workflows
        run: |
          sudo apt-get install -y jq
          ./scripts/validate-workflows.sh
      
      - name: Deploy to production
        env:
          N8N_PROD_URL: ${{ secrets.N8N_PROD_URL }}
          N8N_PROD_API_KEY: ${{ secrets.N8N_PROD_API_KEY }}
        run: |
          # Install CLI
          npm install -g @integratingfactor/n8n-workflow-cli
          
          # Deploy (n8n.config.json is in repo, uses environment variables)
          n8n-workflow-cli deploy prod
```

Add secrets in GitHub repository settings:
- `N8N_PROD_URL` - Your n8n production URL
- `N8N_PROD_API_KEY` - Your n8n production API key

The `n8n.config.json` in your repository references these environment variables.

### Option 2: Manual Approval Process

For organizations requiring manual approval:

1. Create pull request with workflow changes
2. Team reviews the changes
3. After approval, merge to main
4. Manually run deployment:
   ```bash
   git pull origin main
   ./scripts/deploy-workflows.sh production
   ```

## Monitoring and Validation

### Post-Deployment Checks

After deploying:

1. **Verify Deployment**
   ```bash
   # List workflows on production
   ./scripts/list-workflows.sh production
   ```

2. **Check Workflow Status**
   - Log into production n8n
   - Navigate to Workflows
   - Verify new/updated workflows are present
   - Check activation status

3. **Monitor Executions**
   - Watch execution log for first few runs
   - Verify no errors
   - Check execution times are acceptable
   - Validate output data is correct

4. **Test Triggers**
   - For webhook workflows: Send test request
   - For scheduled workflows: Wait for next execution
   - For manual workflows: Execute manually

### Monitoring Tools

Set up monitoring for production workflows:

1. **Execution Alerts**
   - Configure n8n error notifications
   - Set up alerts for failed executions
   - Monitor execution frequency

2. **Performance Monitoring**
   - Track execution times
   - Monitor resource usage
   - Set up alerts for slow executions

3. **Business Metrics**
   - Track workflow success rates
   - Monitor throughput
   - Measure business impact

## Environment-Specific Configurations

### Handling Environment Differences

Some workflows may need different configurations per environment:

#### Approach 1: Environment Variables

Use n8n environment variables in workflows:
```json
{
  "parameters": {
    "url": "={{$env.API_BASE_URL}}/endpoint"
  }
}
```

Set in n8n instance:
- Test: `API_BASE_URL=https://test-api.example.com`
- Prod: `API_BASE_URL=https://api.example.com`

#### Approach 2: Separate Credentials

Create environment-specific credentials in n8n:
- `Test Database` (points to test DB)
- `Production Database` (points to prod DB)

#### Approach 3: Workflow Branches

Use conditional logic in workflows:
```json
{
  "parameters": {
    "conditions": {
      "boolean": [
        {
          "value1": "={{$env.ENVIRONMENT}}",
          "value2": "production"
        }
      ]
    }
  }
}
```

## Troubleshooting Deployments

### Deployment Script Fails

**Error: "Configuration file not found"**
```bash
# Ensure config file exists
ls -la config/
cat config/production.env
```

**Error: "Failed to update workflow"**
- Check API key has write permissions
- Verify n8n instance is accessible
- Check workflow ID matches server

### Workflow Not Appearing After Deploy

1. Check deployment script output for errors
2. Verify API credentials
3. Check n8n logs for errors
4. Try listing workflows: `./scripts/list-workflows.sh production`

### Workflow Deployed but Not Working

1. Check workflow is activated
2. Verify credentials are configured in production
3. Check trigger conditions are met
4. Review execution history for errors
5. Compare with working test environment

## Best Practices

### Deployment Timing

- Deploy during low-traffic periods when possible
- Avoid deploying on Fridays or before holidays
- Have team available to monitor after deployment
- Plan rollback time in deployment window

### Communication

- Notify team before production deployments
- Document what was deployed
- Share deployment results
- Report any issues immediately

### Change Management

- Keep detailed changelog
- Document breaking changes
- Version complex workflows
- Maintain deployment history

### Testing in Production

- Use feature flags when possible
- Deploy to subset of users first
- Have monitoring in place
- Keep rollback plan ready

## Deployment Checklist Template

Copy this checklist for each production deployment:

```markdown
## Deployment: [Workflow Name] - [Date]

### Pre-Deployment
- [ ] Tested in test environment
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Rollback plan documented
- [ ] Team notified

### Deployment
- [ ] Pulled latest from test: `./scripts/pull-workflows.sh test`
- [ ] Validated: `./scripts/validate-workflows.sh`
- [ ] Committed and pushed to main
- [ ] Deployed: `./scripts/deploy-workflows.sh production`
- [ ] Activated workflow in n8n UI

### Post-Deployment
- [ ] Verified deployment: `./scripts/list-workflows.sh production`
- [ ] Tested workflow execution
- [ ] Monitored first executions
- [ ] No errors in execution log
- [ ] Business metrics validated
- [ ] Team notified of completion

### Issues (if any)
- Issue 1: [Description and resolution]
- Issue 2: [Description and resolution]

### Rollback (if needed)
- [ ] Deactivated workflow
- [ ] Reverted code: `git revert <hash>`
- [ ] Redeployed previous version
- [ ] Verified rollback successful
- [ ] Root cause documented
```

## Support

For deployment issues:
1. Check this guide and troubleshooting section
2. Review deployment script output
3. Check n8n execution logs
4. Contact DevOps team
5. Create incident ticket if critical
