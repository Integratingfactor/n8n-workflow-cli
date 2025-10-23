import { z } from 'zod';

// n8n Workflow Schema
export const WorkflowNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  typeVersion: z.number().optional(),
  position: z.tuple([z.number(), z.number()]),
  parameters: z.record(z.any()),
  credentials: z.record(z.any()).optional(),
  webhookId: z.string().optional(),
  disabled: z.boolean().optional(),
  notes: z.string().optional(),
  notesInFlow: z.boolean().optional(),
});

export const WorkflowConnectionSchema = z.object({
  main: z.array(
    z.array(
      z.object({
        node: z.string(),
        type: z.string(),
        index: z.number(),
      })
    )
  ).optional(),
});

export const WorkflowSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  active: z.boolean().optional(),
  nodes: z.array(WorkflowNodeSchema),
  connections: z.record(WorkflowConnectionSchema),
  settings: z.record(z.any()).optional(),
  staticData: z.record(z.any()).optional(),
  tags: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  pinData: z.record(z.any()).optional(),
  versionId: z.string().optional(),
  meta: z.record(z.any()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const WorkflowListResponseSchema = z.object({
  data: z.array(WorkflowSchema),
  nextCursor: z.string().nullable().optional(),
});

export const WorkflowExecutionSchema = z.object({
  id: z.string(),
  finished: z.boolean(),
  mode: z.string(),
  retryOf: z.string().nullable().optional(),
  retrySuccessId: z.string().nullable().optional(),
  startedAt: z.string(),
  stoppedAt: z.string().optional(),
  workflowId: z.string(),
  waitTill: z.string().nullable().optional(),
});

export const ExecutionResponseSchema = z.object({
  data: WorkflowExecutionSchema,
});

// Config Schema
export const ConfigSchema = z.object({
  N8N_API_URL: z.string().url(),
  N8N_API_KEY: z.string().min(1),
  ENVIRONMENT: z.string().optional(),
});

// Types
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;
export type WorkflowConnection = z.infer<typeof WorkflowConnectionSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type WorkflowListResponse = z.infer<typeof WorkflowListResponseSchema>;
export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;
export type ExecutionResponse = z.infer<typeof ExecutionResponseSchema>;
export type Config = z.infer<typeof ConfigSchema>;

// Workflow categories
export type WorkflowCategory = 'business' | 'management' | 'shared';

export const WORKFLOW_CATEGORIES: WorkflowCategory[] = ['business', 'management', 'shared'];

// CLI Options
export interface DeployOptions {
  environment: string;
  target?: string;
  dryRun?: boolean;
  parallel?: boolean;
}

export interface PullOptions {
  environment: string;
  category?: WorkflowCategory;
}

export interface ExecuteOptions {
  environment: string;
  workflow: string;
  wait?: boolean;
}

export interface ListOptions {
  environment: string;
  remote?: boolean;
}
