# Changelog

All notable changes to this project will be documented in this file.

## [1.1.4] - 2025-10-26 - Enhanced workflow cleaning for cleaner diffs

### Changed
- **Improved workflow data cleaning** to reduce unnecessary diffs while preserving all workflow configuration
  - Centralized cleaning logic in `cleanWorkflowForStorage()` function based on n8n API documentation
  - Now removes only read-only/runtime fields:
    - `createdAt`, `updatedAt`: Read-only timestamps (per API spec)
    - `versionId`, `isArchived`: Internal tracking fields
    - `pinData`, `triggerCount`: Test/debug data not in API spec
  - **Preserves all workflow configuration** including:
    - `staticData`: Part of workflow definition (per API docs)
    - `settings`: Complete workflow settings
    - `shared`: Sharing/project metadata (cleaned to remove user timestamps)
    - Node configuration: `webhookId`, `disabled`, `retryOnFail`, `executeOnce`, etc.
  - Cleans `shared` field to remove frequently changing user metadata while keeping role/project structure
  - Only removes execution results from nodes (`data`, `issues`, `hints`)
  - Both `pull` and `deploy` commands now use the same cleaning function

### Fixed
- Fixed webhook triggers not registering after deploy by preserving `webhookId` and other node configuration

### Added
- Documentation section in DEVELOPMENT.md explaining workflow data cleaning
- References to n8n API spec for field requirements

## [1.1.3] - 2025-10-24 - Critical fixes for personal spaces and deploy

### Fixed
- **CRITICAL**: Fixed deploy to work with n8n personal spaces
  - Changed workflow lookup to always use name instead of ID
  - Prevents 403 Forbidden errors when workflow IDs exist in other users' personal spaces
  - Automatically corrects local workflow IDs if they differ from remote
  - Simplified deploy logic by removing complex ID-based error handling
- Fixed deploy command ignoring workflow argument
  - Deploy now correctly deploys only the specified workflow file when provided
  - Previously deployed all workflows regardless of the argument

## [1.1.2] - 2025-10-24 - Documentation and validation improvements

### Changed
- **Documentation**: Split README into user-focused (README.md) and developer-focused (DEVELOPMENT.md) documentation
  - README.md now provides clear usage documentation for npm package users
  - Includes step-by-step quick start guide for setting up workflow projects
  - Added best practices, troubleshooting, and common workflows sections
  - DEVELOPMENT.md contains technical details for contributors

### Fixed
- Added validation for `--category` option in pull command
  - Now exits with error if provided category is not in configured categories list
  - Shows helpful error message with list of valid categories from n8n.config.json

## [1.1.1] - 2025-10-24 - Safety during workflow creation

### Changed
- **BREAKING (Safety Feature)**: New workflows are now created as inactive by default
  - When deploying a workflow that doesn't exist in n8n yet, it will be created as inactive
  - This applies to both new workflows and workflows being recreated after 404 errors
  - Users must manually verify, configure credentials, test, and activate workflows in the n8n UI
  - This prevents untested workflows from running automatically

### Fixed
- Fixed corner case bug in 404 handling: when a workflow is deleted and recreated by someone else with a different ID, deploy now correctly detects the existing workflow by name and updates it instead of creating a duplicate

## [1.1.0] - Simplify configurations

### Changed
- **BREAKING**: Simplified configuration structure
  - Renamed `.n8n-cli.config.json` to `n8n.config.json` (no leading dot)
  - Removed nested `environments` object from config file
  - Config now only contains workflow organization settings (workflowsDir, categories)
  - Simplified to use only 2 environment variables: `N8N_API_URL` and `N8N_API_KEY`
  - Removed environment parameter from all CLI commands (pull, deploy, list)
- Added `.env` file support for convenient local environment variable management
- Added URL validation to ensure `N8N_API_URL` ends with `/api/v1`
- Removed migration and deployment guides (no longer needed with simplified config)

### Added
- dotenv package for .env file support
- .env.example template file

## [1.0.3] - Remove invalid `execute` command

### Removed
- Removed `execute` command (n8n API doesn't support direct workflow execution)

## [1.0.2] - Fix bug in version detection

### Changed
- Fixed version display in CLI to read from package.json instead of hardcoded value
- Updated package scope from @company to @integratingfactor

### Added
- Duplicate workflow prevention: checks for existing workflows by name before creating
- Clean workflow files: removed read-only timestamp fields (createdAt, updatedAt, versionId, isArchived)
- Configurable categories: categories are now loaded from n8n.config.json
- Tag-based filtering: pull command only pulls workflows with tags matching configured categories
- Category option as filter: --category option now filters workflows instead of setting default

## [1.0.0] - Initial Release

### Added
- Initial release with core functionality
- Deploy command for pushing workflows to n8n
- Pull command for fetching workflows from n8n
- List command for viewing local and remote workflows
- Validate command for checking workflow configuration
- MIT License
