import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { loadConfig } from './config.js';

/**
 * Clean workflow data for storage in source control
 * Removes environment-specific IDs and runtime fields for true multi-environment deployment
 * 
 * Architecture:
 * - Source control contains workflow definitions WITHOUT environment-specific IDs
 * - On deploy, IDs are either generated (new workflow) or merged from existing workflow (update)
 * - This allows same workflow source to deploy to dev, staging, prod with different IDs
 */
export function cleanWorkflowForStorage(workflow: any): any {
  // Fields to remove:
  // Environment-specific IDs (prevent cross-environment conflicts):
  // - id: Workflow ID is environment-specific
  // - Node ids: Generated per environment
  // - webhookId: Generated per environment
  // - credential ids: Different per environment
  // 
  // Read-only/runtime fields:
  // - createdAt, updatedAt: Timestamps managed by n8n
  // - versionId, isArchived: Internal tracking
  // - active: Managed via activation API (new workflows created inactive)
  // - pinData, triggerCount: Test/debug data
  // - shared: Environment-specific sharing/project metadata
  // - staticData: Runtime state that varies per environment
  
  const fieldsToRemove = [
    'id',           // Environment-specific workflow ID
    'createdAt',    // readOnly timestamp
    'updatedAt',    // readOnly timestamp  
    'versionId',    // Internal version tracking
    'isArchived',   // Archive status
    'active',       // Activation state (controlled during deploy)
    'pinData',      // Test/debug data
    'triggerCount', // Runtime counter
    'shared',       // Environment-specific sharing metadata
    'staticData',   // Runtime state varies per environment
  ];

  const cleaned = { ...workflow };
  fieldsToRemove.forEach((field) => delete cleaned[field]);

  // Clean up nodes: remove environment-specific IDs and execution results
  if (cleaned.nodes && Array.isArray(cleaned.nodes)) {
    cleaned.nodes = cleaned.nodes.map((node: any) => {
      const cleanNode = { ...node };
      
      // Remove environment-specific IDs
      delete cleanNode.id;        // Node ID is environment-specific
      delete cleanNode.webhookId; // Webhook ID is environment-specific
      
      // Remove credential IDs (keep credential names for reference)
      if (cleanNode.credentials) {
        Object.keys(cleanNode.credentials).forEach(credKey => {
          const cred = cleanNode.credentials[credKey];
          if (cred && cred.id) {
            // Keep credential name, remove environment-specific ID
            cleanNode.credentials[credKey] = { name: cred.name };
          }
        });
      }
      
      // Remove execution results and runtime validation
      delete cleanNode.data;   // Execution output data
      delete cleanNode.issues; // Runtime validation issues  
      delete cleanNode.hints;  // Runtime hints/warnings
      
      return cleanNode;
    });
  }

  return cleaned;
}

// ...existing schema definitions...

export class WorkflowManager {
  private config = loadConfig();

  private getWorkflowsDirectory(): string {
    return path.resolve(process.cwd(), this.config.workflowsDir);
  }

  private getCategoryDirectory(category: string): string {
    return path.join(this.getWorkflowsDirectory(), category);
  }

  ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  saveWorkflowToFile(workflow: any, category: string): void {
    const categoryDir = this.getCategoryDirectory(category);
    this.ensureDirectoryExists(categoryDir);

    const cleanedWorkflow = cleanWorkflowForStorage(workflow);

    const filename = `${workflow.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    const filePath = path.join(categoryDir, filename);

    fs.writeFileSync(filePath, JSON.stringify(cleanedWorkflow, null, 2) + '\n');
    console.log(`✓ Saved workflow: ${workflow.name} -> ${path.relative(process.cwd(), filePath)}`);
  }

  loadWorkflowFromFile(filePath: string): any {
    const absolutePath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Workflow file not found: ${filePath}`);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    return JSON.parse(content);
  }

  getWorkflowFiles(): string[] {
    const workflowsDir = this.getWorkflowsDirectory();

    if (!fs.existsSync(workflowsDir)) {
      console.warn(`⚠ Workflows directory not found: ${workflowsDir}`);
      console.warn(`  Run 'n8n-workflow-cli pull <environment>' to create it and pull workflows.`);
      return [];
    }

    const files: string[] = [];

    for (const category of this.config.categories) {
      const categoryDir = this.getCategoryDirectory(category);

      if (fs.existsSync(categoryDir)) {
        const categoryFiles = fs
          .readdirSync(categoryDir)
          .filter((file) => file.endsWith('.json'))
          .map((file) => path.join('workflows', category, file));

        files.push(...categoryFiles);
      }
    }

    return files;
  }

  // ...rest of existing methods...
}

// Utility functions for CLI commands
export async function loadWorkflowFromFile(filePath: string): Promise<any> {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function findWorkflowFiles(projectRoot: string, category?: string): Promise<string[]> {
  const workflowsDir = path.join(projectRoot, 'workflows');

  if (!fs.existsSync(workflowsDir)) {
    return [];
  }

  if (category) {
    const categoryDir = path.join(workflowsDir, category);
    if (!fs.existsSync(categoryDir)) {
      return [];
    }

    return fs
      .readdirSync(categoryDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.join(categoryDir, file));
  }

  // Return all workflow files from all categories
  const files: string[] = [];
  const categories = ['business', 'management', 'shared'];

  for (const cat of categories) {
    const categoryDir = path.join(workflowsDir, cat);
    if (fs.existsSync(categoryDir)) {
      const categoryFiles = fs
        .readdirSync(categoryDir)
        .filter((file) => file.endsWith('.json'))
        .map((file) => path.join(categoryDir, file));
      files.push(...categoryFiles);
    }
  }

  return files;
}

export async function validateAllWorkflows(projectRoot: string): Promise<{
  valid: string[];
  invalid: { file: string; errors: string[] }[];
}> {
  const files = await findWorkflowFiles(projectRoot);
  const results = {
    valid: [] as string[],
    invalid: [] as { file: string; errors: string[] }[],
  };

  for (const file of files) {
    try {
      await loadWorkflowFromFile(file);
      results.valid.push(file);
    } catch (error) {
      results.invalid.push({
        file,
        errors: [error instanceof Error ? error.message : 'Invalid JSON'],
      });
    }
  }

  return results;
}

export function determineCategory(
  workflow: any,
  categories: string[] = ['business', 'management', 'shared']
): string | null {
  // Only check if workflow has tags that match category names
  if (workflow.tags && Array.isArray(workflow.tags)) {
    const tagNames = workflow.tags.map((tag: any) => tag.name.toLowerCase());

    // Check for exact category matches in tags
    for (const category of categories) {
      if (tagNames.includes(category.toLowerCase())) {
        return category;
      }
    }
  }

  // Return null if no matching category found
  return null;
}

export function saveWorkflowToFile(workflow: any, category: string, projectRoot?: string): string {
  const workflowManager = new WorkflowManager();
  workflowManager.saveWorkflowToFile(workflow, category);

  // Return the file path
  const config = loadConfig();
  const workflowsDir = projectRoot
    ? path.join(projectRoot, config.workflowsDir)
    : path.resolve(process.cwd(), config.workflowsDir);
  const categoryDir = path.join(workflowsDir, category);
  const fileName = `${workflow.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.json`;

  return path.join(categoryDir, fileName);
}
