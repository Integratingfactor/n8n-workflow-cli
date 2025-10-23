import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { Workflow, WorkflowSchema } from './types.js';

export class WorkflowValidationError extends Error {
  constructor(
    public filePath: string,
    public errors: string[]
  ) {
    super(`Validation failed for ${filePath}`);
    this.name = 'WorkflowValidationError';
  }
}

export async function validateWorkflowFile(filePath: string): Promise<Workflow> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    const result = WorkflowSchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.errors.map(
        e => `  - ${e.path.join('.')}: ${e.message}`
      );
      throw new WorkflowValidationError(filePath, errors);
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof WorkflowValidationError) {
      throw error;
    }
    if (error instanceof SyntaxError) {
      throw new WorkflowValidationError(filePath, ['Invalid JSON syntax']);
    }
    throw error;
  }
}

export async function saveWorkflowToFile(
  workflow: Workflow,
  category: string,
  projectRoot: string
): Promise<string> {
  const safeFileName = workflow.name
    .replace(/\//g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  
  const workflowDir = path.join(projectRoot, 'workflows', category);
  const filePath = path.join(workflowDir, `${safeFileName}.json`);
  
  // Normalize null values to empty objects for staticData and meta
  const normalizedWorkflow = {
    ...workflow,
    staticData: workflow.staticData === null ? {} : workflow.staticData,
    meta: workflow.meta === null ? {} : workflow.meta
  };
  
  await fs.mkdir(workflowDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(normalizedWorkflow, null, 2) + '\n', 'utf-8');
  
  return filePath;
}

export async function loadWorkflowFromFile(filePath: string): Promise<Workflow> {
  return validateWorkflowFile(filePath);
}

export async function findWorkflowFiles(
  projectRoot: string,
  category?: string
): Promise<string[]> {
  const workflowsDir = path.join(projectRoot, 'workflows');
  const categories = category ? [category] : ['business', 'management', 'shared'];
  
  const files: string[] = [];
  
  for (const cat of categories) {
    const catDir = path.join(workflowsDir, cat);
    try {
      const dirFiles = await fs.readdir(catDir);
      const jsonFiles = dirFiles
        .filter(f => f.endsWith('.json'))
        .map(f => path.join(catDir, f));
      files.push(...jsonFiles);
    } catch (error) {
      // Directory doesn't exist or is empty, skip
      continue;
    }
  }
  
  return files;
}

export function determineCategory(workflow: Workflow): string {
  const tags = workflow.tags?.map(t => t.name.toLowerCase()) || [];
  
  if (tags.includes('management')) {
    return 'management';
  }
  if (tags.includes('shared')) {
    return 'shared';
  }
  return 'business';
}

export function formatWorkflowInfo(workflow: Workflow): string {
  const id = workflow.id || 'no-id';
  const active = workflow.active ? chalk.green('active') : chalk.gray('inactive');
  const nodeCount = workflow.nodes.length;
  const tags = workflow.tags?.map(t => t.name).join(', ') || 'none';
  
  return [
    chalk.bold(workflow.name),
    `  ID: ${id}`,
    `  Status: ${active}`,
    `  Nodes: ${nodeCount}`,
    `  Tags: ${tags}`,
  ].join('\n');
}

export async function validateAllWorkflows(projectRoot: string): Promise<{
  valid: number;
  invalid: { file: string; errors: string[] }[];
}> {
  const files = await findWorkflowFiles(projectRoot);
  const results = { valid: 0, invalid: [] as { file: string; errors: string[] }[] };
  
  for (const file of files) {
    try {
      await validateWorkflowFile(file);
      results.valid++;
    } catch (error) {
      if (error instanceof WorkflowValidationError) {
        results.invalid.push({ file: error.filePath, errors: error.errors });
      } else {
        results.invalid.push({ 
          file, 
          errors: [error instanceof Error ? error.message : 'Unknown error'] 
        });
      }
    }
  }
  
  return results;
}
