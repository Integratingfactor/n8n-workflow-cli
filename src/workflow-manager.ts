import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { loadConfig } from './config.js';

/**
 * Clean workflow data for storage in source control
 * Removes read-only and frequently changing runtime fields
 * Based on n8n API spec and documentation examples
 */
export function cleanWorkflowForStorage(workflow: any): any {
  // Fields to remove (read-only fields per API spec with readOnly: true):
  // - createdAt, updatedAt: Timestamps managed by n8n (readOnly in API spec)
  // - versionId: Internal version tracking (not in API spec)
  // - isArchived: Archive status managed by n8n (not in API spec)
  // 
  // Fields to KEEP (even though they may change):
  // - id: Required for updates
  // - active: Part of workflow state (readOnly but indicates desired state)
  // - staticData: Part of workflow definition (per API docs example)
  // - settings: Complete workflow settings
  // - shared: Sharing/project metadata (per API docs example)
  // - nodes with all properties: webhookId, disabled, notesInFlow, executeOnce, 
  //   alwaysOutputData, retryOnFail, maxTries, waitBetweenTries, onError, etc.
  
  const fieldsToRemove = [
    'createdAt',    // readOnly timestamp
    'updatedAt',    // readOnly timestamp  
    'versionId',    // Internal version tracking
    'isArchived',   // Archive status
    'pinData',      // Test/debug data (not in API example)
    'triggerCount', // Runtime counter (not in API example)
  ];

  const cleaned = { ...workflow };
  fieldsToRemove.forEach((field) => delete cleaned[field]);

  // Clean up nodes: only remove execution results, keep all configuration
  if (cleaned.nodes && Array.isArray(cleaned.nodes)) {
    cleaned.nodes = cleaned.nodes.map((node: any) => {
      const cleanNode = { ...node };
      
      // Only remove execution results and runtime validation issues
      // Keep all node configuration fields (webhookId, disabled, retryOnFail, etc.)
      delete cleanNode.data;   // Execution output data
      delete cleanNode.issues; // Runtime validation issues  
      delete cleanNode.hints;  // Runtime hints/warnings
      
      return cleanNode;
    });
  }

  // Normalize shared field - clean up frequently changing user metadata
  // Keep the structure but remove user details with timestamps
  if (cleaned.shared && Array.isArray(cleaned.shared)) {
    cleaned.shared = cleaned.shared.map((share: any) => {
      const cleanShare: any = {
        role: share.role,
        workflowId: share.workflowId,
        projectId: share.projectId,
      };
      // Keep project name if present
      if (share.project && share.project.name) {
        cleanShare.project = { name: share.project.name };
      }
      // Remove user object with frequently changing timestamps
      return cleanShare;
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
