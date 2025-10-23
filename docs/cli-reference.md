# TypeScript CLI - Quick Reference

## Installation

```bash
npm install
```

## Common Commands

### Pull workflows from n8n
```bash
npm run pull -- test
npm run pull -- production --category management
```

### Deploy workflows to n8n
```bash
npm run deploy -- test
npm run deploy -- production management
npm run deploy -- test --dry-run
npm run deploy -- production --parallel
```

### Execute a workflow
```bash
npm run execute -- create-tables test
npm run execute -- migration production
```

### List workflows
```bash
npm run list
npm run list -- test --remote
```

### Validate workflows
```bash
npm run validate
```

## Build for Production

```bash
npm run build
```

After building, you can use:
```bash
npx n8n-workflows <command>
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
    npm ci
    npm run validate
    npm run deploy -- production --parallel
```

## Docker Example

```bash
docker run --rm -v $(pwd)/config:/app/config n8n-workflows deploy production
```

## Help

Get help for any command:
```bash
npm run <command> -- --help
```

Examples:
```bash
npm run pull -- --help
npm run deploy -- --help
npm run execute -- --help
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
