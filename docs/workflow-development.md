# Workflow Development Guide

This guide provides best practices and guidelines for developing n8n workflows.

## Quick Start

> 📖 **New to this tool?** See the detailed [Quick Start Guide](QUICKSTART.md) for step-by-step instructions.

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

**Option 1: Using .env file (recommended for local development)**
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your values
N8N_API_URL=https://n8n.dev.company.com/api/v1
N8N_API_KEY=your-dev-api-key
```

**Option 2: Using shell exports**
```bash
export N8N_API_URL="https://n8n.dev.company.com/api/v1"
export N8N_API_KEY="your-dev-api-key"
```

### Categories Configuration

Categories help organize workflows into folders in your repository:

- **Define categories** in the `categories` array - customize for your project needs (e.g., `["api", "automation", "monitoring"]`)
- **Commit the config** - The `n8n.config.json` file with your categories should be committed so the team shares the same organization
- **Tag workflows in n8n** - Only workflows with tags matching a category name will be pulled
- **Filter by category** - Use `--category` option to pull only specific category workflows

Example: A workflow tagged with `business` in n8n will be saved to `workflows/business/` when pulled.

3. **Pull workflows**:
```bash
# Pull all workflows with matching category tags
n8n-workflow-cli pull

# Pull only workflows tagged with "business"
n8n-workflow-cli pull --category business
```

4. **Validate workflows**:
```bash
n8n-workflow-cli validate
```

5. **Deploy workflows**:
```bash
n8n-workflow-cli deploy workflows/business/my-workflow.json
```

## Workflow Project Template

Use this template for workflow repositories:

```json
{
  "name": "my-workflows",
  "scripts": {
    "validate": "n8n-workflow-cli validate",
    "pull": "n8n-workflow-cli pull",
    "deploy": "n8n-workflow-cli deploy",
    "list": "n8n-workflow-cli list"
  },
  "devDependencies": {
    "@integratingfactor/n8n-workflow-cli": "^1.1.2"
  }
}
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

### 1. Planning Phase

Before creating a workflow:
- Document the workflow purpose and trigger conditions
- Identify input/output requirements
- List required integrations and credentials
- Consider error handling requirements
- Plan for testing and validation

### 2. Development in n8n UI

**Setup:**
1. Use the test n8n instance for development
2. Create a new workflow or open existing one
3. Add appropriate tags immediately

**Building:**
1. Start with the trigger node
2. Add nodes incrementally
3. Test each node as you go
4. Use the "Execute Node" feature frequently
5. Add error handling nodes
6. Document complex logic with notes

**Testing:**
1. Test with real data when possible
2. Test error conditions
3. Verify all branches and conditions
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
