import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const EnvironmentConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string(),
});

const ConfigSchema = z.object({
  environments: z.record(EnvironmentConfigSchema),
  workflowsDir: z.string().optional().default('./workflows'),
  categories: z.array(z.string()).optional().default(['business', 'management', 'shared']),
});

export type Config = z.infer<typeof ConfigSchema>;
export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;

export function loadConfig(): Config {
  // Look for config in current working directory first, then parent directories
  const configPaths = [
    '.n8n-cli.config.json',
    path.join(process.cwd(), '.n8n-cli.config.json'),
    path.join(process.cwd(), '..', '.n8n-cli.config.json'),
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
        throw new Error(`Invalid configuration in ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  throw new Error('Configuration file .n8n-cli.config.json not found. Please create one in your project directory.');
}

function resolveEnvironmentVariables(obj: any): any {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([^}]+)\}/g, (match, envVar) => {
      const value = process.env[envVar];
      if (!value) {
        throw new Error(`Environment variable ${envVar} is not set`);
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

export function getEnvironmentConfig(environment: string): EnvironmentConfig {
  const config = loadConfig();
  const envConfig = config.environments[environment];
  
  if (!envConfig) {
    const availableEnvs = Object.keys(config.environments).join(', ');
    throw new Error(`Environment '${environment}' not found. Available environments: ${availableEnvs}`);
  }
  
  return envConfig;
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
  }
};