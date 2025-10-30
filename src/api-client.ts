import axios, { AxiosInstance, AxiosError } from 'axios';
import { Config, Workflow, WorkflowListResponse } from './types.js';

function isHtmlResponse(data: unknown, headers?: Record<string, unknown>): boolean {
  const ct = (headers?.['content-type'] || headers?.['Content-Type']) as string | undefined;
  if (ct && ct.includes('text/html')) return true;
  return typeof data === 'string' && data.includes('<!DOCTYPE html>');
}

function validateApiUrl(apiUrl: string): string | null {
  try {
    const u = new URL(apiUrl);

    // Must end with /api/v1 (no UI paths like /home/workflows)
    if (!u.pathname.endsWith('/api/v1')) return 'N8N_API_URL must end with "/api/v1".';

    // Disallow common UI path leak
    if (u.pathname.includes('/home/workflows')) {
      return 'N8N_API_URL should not contain UI paths like "/home/workflows".';
    }

    // Most common mistake: using the login host instead of your workspace
    if (u.hostname === 'app.n8n.cloud') {
      return 'N8N_API_URL must use your workspace subdomain (e.g., https://<workspace>.n8n.cloud/api/v1), not https://app.n8n.cloud/api/v1.';
    }
  } catch {
    return 'N8N_API_URL is not a valid URL.';
  }
  return null;
}


export class N8nApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'N8nApiError';
  }
}

export class N8nClient {
  private client: AxiosInstance;

  constructor(private config: Config) {
    const urlError = validateApiUrl(config.N8N_API_URL);
    if (urlError) {
      throw new N8nApiError(
        `${urlError} Example: https://<your-workspace>.n8n.cloud/api/v1`,
      );
    }

    this.client = axios.create({
      baseURL: config.N8N_API_URL,
      headers: {
        'X-N8N-API-KEY': config.N8N_API_KEY,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add response interceptor for better error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const { data, headers, status } = error.response;
        
          // If the server returned HTML, the user is almost certainly hitting the UI, not the API.
          if (isHtmlResponse(data, headers)) {
            throw new N8nApiError(
              [
                'It looks like N8N_API_URL points to the web UI (HTML) instead of the REST API.',
                'Make sure your URL ends with "/api/v1" and uses your workspace subdomain.',
                'Example: https://<your-workspace>.n8n.cloud/api/v1',
              ].join(' '),
              status,
              error,
            );
          }
        
          // Otherwise, surface the JSON/API error normally.
          const msg = typeof data === 'string' ? data : JSON.stringify(data);
          throw new N8nApiError(`n8n API error: ${msg}`, status, error);
        }
         else if (error.request) {
          throw new N8nApiError(
            `No response from n8n API. Check your N8N_API_URL: ${this.config.N8N_API_URL}`,
            undefined,
            error
          );
        } else {
          throw new N8nApiError(`Request setup error: ${error.message}`, undefined, error);
        }
      }
    );
  }

  async listWorkflows(): Promise<Workflow[]> {
    try {
      const response = await this.client.get<WorkflowListResponse>('/workflows');
      return response.data.data;
    } catch (error) {
      if (error instanceof N8nApiError) {
        throw error;
      }
      throw new N8nApiError('Failed to list workflows', undefined, error);
    }
  }

  async getWorkflow(id: string): Promise<Workflow> {
    try {
      const response = await this.client.get<Workflow>(`/workflows/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof N8nApiError) {
        throw error;
      }
      throw new N8nApiError(`Failed to get workflow ${id}`, undefined, error);
    }
  }

  async createWorkflow(workflow: Workflow): Promise<Workflow> {
    try {
      // Only include fields that are accepted by the n8n API for workflow creation
      // Based on API spec: https://docs.n8n.io/api/api-reference/#tag/workflow/post/workflows
      const allowedFields = ['name', 'nodes', 'connections', 'settings', 'staticData'];

      const cleanData: any = Object.fromEntries(
        Object.entries(workflow).filter(([key]) => allowedFields.includes(key))
      );

      const response = await this.client.post<Workflow>('/workflows', cleanData);
      return response.data;
    } catch (error) {
      if (error instanceof N8nApiError) {
        throw error;
      }
      throw new N8nApiError(`Failed to create workflow "${workflow.name}"`, undefined, error);
    }
  }

  async updateWorkflow(id: string, workflow: Workflow): Promise<Workflow> {
    try {
      // Only include fields that are explicitly supported by n8n API for updates
      // Based on the official API documentation:
      // - 'shared' is read-only and managed by n8n
      // - 'active' and 'tags' are also read-only for updates
      const allowedFields = ['name', 'nodes', 'connections', 'settings', 'staticData'];

      const updateData: any = Object.fromEntries(
        Object.entries(workflow).filter(([key]) => allowedFields.includes(key))
      );

      const response = await this.client.put<Workflow>(`/workflows/${id}`, updateData);
      return response.data;
    } catch (error) {
      if (error instanceof N8nApiError) {
        throw error;
      }
      throw new N8nApiError(`Failed to update workflow ${id}`, undefined, error);
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    try {
      await this.client.delete(`/workflows/${id}`);
    } catch (error) {
      if (error instanceof N8nApiError) {
        throw error;
      }
      throw new N8nApiError(`Failed to delete workflow ${id}`, undefined, error);
    }
  }

  async updateWorkflowTags(workflowId: string, tagIds: string[]): Promise<void> {
    try {
      // Convert string IDs to objects as expected by the API
      const tagObjects = tagIds.map((id) => ({ id }));
      await this.client.put(`/workflows/${workflowId}/tags`, tagObjects);
    } catch (error) {
      if (error instanceof N8nApiError) {
        throw error;
      }
      throw new N8nApiError(`Failed to update workflow tags: ${error}`);
    }
  }

  async listTags(): Promise<
    Array<{ id: string; name: string; createdAt: string; updatedAt: string }>
  > {
    let allTags: Array<{ id: string; name: string; createdAt: string; updatedAt: string }> = [];
    let cursor = '';
    const limit = 100; // Maximum allowed by the API

    try {
      do {
        const url = `/tags?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`;
        const response = await this.client.get(url);

        const data = response.data;
        allTags = allTags.concat(data.data || []);
        cursor = data.nextCursor || '';
      } while (cursor);

      return allTags;
    } catch (error) {
      if (error instanceof N8nApiError) {
        throw error;
      }
      throw new N8nApiError(`Failed to list tags: ${error}`);
    }
  }

  async createTag(
    name: string
  ): Promise<{ id: string; name: string; createdAt: string; updatedAt: string }> {
    try {
      const response = await this.client.post('/tags', { name });
      return response.data;
    } catch (error) {
      if (error instanceof N8nApiError) {
        throw error;
      }
      throw new N8nApiError(`Failed to create tag: ${error}`);
    }
  }

  async activateWorkflow(id: string): Promise<Workflow> {
    try {
      const response = await this.client.post<Workflow>(`/workflows/${id}/activate`);
      return response.data;
    } catch (error) {
      if (error instanceof N8nApiError) {
        throw error;
      }
      throw new N8nApiError(`Failed to activate workflow ${id}`, undefined, error);
    }
  }

  async deactivateWorkflow(id: string): Promise<Workflow> {
    try {
      const response = await this.client.post<Workflow>(`/workflows/${id}/deactivate`);
      return response.data;
    } catch (error) {
      if (error instanceof N8nApiError) {
        throw error;
      }
      throw new N8nApiError(`Failed to deactivate workflow ${id}`, undefined, error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.listWorkflows();
      return true;
    } catch (error) {
      return false;
    }
  }
}
