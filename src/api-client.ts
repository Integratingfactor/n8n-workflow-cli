import axios, { AxiosInstance, AxiosError } from 'axios';
import { Config, Workflow, WorkflowListResponse, ExecutionResponse } from './types.js';

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
    this.client = axios.create({
      baseURL: config.N8N_API_URL,
      headers: {
        'X-N8N-API-KEY': config.N8N_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    
    // Add response interceptor for better error handling
    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response) {
          const message = error.response.data 
            ? JSON.stringify(error.response.data) 
            : error.message;
          throw new N8nApiError(
            `n8n API error: ${message}`,
            error.response.status,
            error
          );
        } else if (error.request) {
          throw new N8nApiError(
            `No response from n8n API. Check your N8N_API_URL: ${this.config.N8N_API_URL}`,
            undefined,
            error
          );
        } else {
          throw new N8nApiError(
            `Request setup error: ${error.message}`,
            undefined,
            error
          );
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
      // Remove id field for creation
      const { id, ...workflowData } = workflow;
      const response = await this.client.post<Workflow>('/workflows', workflowData);
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
      // Based on the official API documentation and testing
      const allowedFields = [
        'name',
        'nodes', 
        'connections',
        'settings',
        'staticData',
        'shared'
        // Note: 'active' and 'tags' are read-only for updates
      ];
      
      const updateData = Object.fromEntries(
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
      const tagObjects = tagIds.map(id => ({ id }));
      await this.client.put(`/workflows/${workflowId}/tags`, tagObjects);
    } catch (error) {
      if (error instanceof N8nApiError) {
        throw error;
      }
      throw new N8nApiError(`Failed to update workflow tags: ${error}`);
    }
  }

  async listTags(): Promise<Array<{ id: string; name: string; createdAt: string; updatedAt: string }>> {
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

  async createTag(name: string): Promise<{ id: string; name: string; createdAt: string; updatedAt: string }> {
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
  
  async executeWorkflow(id: string): Promise<ExecutionResponse> {
    try {
      const response = await this.client.post<ExecutionResponse>(`/workflows/${id}/execute`);
      return response.data;
    } catch (error) {
      if (error instanceof N8nApiError) {
        throw error;
      }
      throw new N8nApiError(`Failed to execute workflow ${id}`, undefined, error);
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
