import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { config as loadDotenv } from 'dotenv';

// Load .env file if it exists
loadDotenv();

const ConfigSchema = z.object({
  workflowsDir: z.string().optional().default('./workflows'),
  categories: z.array(z.string()).optional().default(['business', 'management', 'shared']),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  // Look for config in current working directory first, then parent directories
  const configPaths = [
    'n8n.config.json',
    path.join(process.cwd(), 'n8n.config.json'),
    path.join(process.cwd(), '..', 'n8n.config.json'),
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const configFile = fs.readFileSync(configPath, 'utf-8');
        const configData = JSON.parse(configFile);

        // Resolve environment variables
        const resolvedConfig = resolveEnvironmentVariables(configData);

        return ConfigSchema.parse(resolvedConfig);
      } catch (error) {
        throw new Error(
          `Invalid configuration in ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }

  throw new Error(
    'Configuration file n8n.config.json not found. Please create one in your project directory.'
  );
}

function resolveEnvironmentVariables(obj: any): any {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([^}]+)\}/g, (match, envVar) => {
      const value = process.env[envVar];
      if (!value) {
        throw new Error(
          `Environment variable ${envVar} is not set. Please set it before running the CLI:\n  export ${envVar}="your-value"`
        );
      }
      return value;
    });
  }

  if (Array.isArray(obj)) {
    return obj.map(resolveEnvironmentVariables);
  }

  if (obj && typeof obj === 'object') {
    const resolved: any = {};
    for (const [key, value] of Object.entries(obj)) {
      resolved[key] = resolveEnvironmentVariables(value);
    }
    return resolved;
  }

  return obj;
}

export function getEnvironmentConfig(_environmentName: string) {
  // Get URL and API key from simple environment variables
  const baseUrl = process.env.N8N_API_URL;
  const apiKey = process.env.N8N_API_KEY;

  if (!baseUrl) {
    throw new Error(
      `Environment variable N8N_API_URL is not set. Please set it before running the CLI:\n  export N8N_API_URL="https://n8n.example.com/api/v1"`
    );
  }

  if (!apiKey) {
    throw new Error(
      `Environment variable N8N_API_KEY is not set. Please set it before running the CLI:\n  export N8N_API_KEY="your-api-key"`
    );
  }

  // Validate URL ends with /api/v1
  if (!baseUrl.endsWith('/api/v1')) {
    throw new Error(
      `Invalid N8N_API_URL: must end with /api/v1 (e.g., https://n8n.example.com/api/v1). Current value: ${baseUrl}`
    );
  }

  return { baseUrl, apiKey };
}

// Configuration manager for CLI commands
export const configManager = {
  loadConfig: async (environment: string) => {
    const envConfig = getEnvironmentConfig(environment);
    return {
      N8N_API_URL: envConfig.baseUrl,
      N8N_API_KEY: envConfig.apiKey,
    };
  },

  getProjectRoot: () => {
    return process.cwd();
  },

  getCategories: () => {
    const config = loadConfig();
    return config.categories;
  },
};
