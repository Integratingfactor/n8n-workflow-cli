import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Config, ConfigSchema } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ConfigManager {
  private static instance: ConfigManager;
  private configs: Map<string, Config> = new Map();
  
  private constructor() {}
  
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  async loadConfig(environment: string): Promise<Config> {
    // Check cache
    if (this.configs.has(environment)) {
      return this.configs.get(environment)!;
    }
    
    // Determine project root (parent of src/)
    const projectRoot = path.resolve(__dirname, '..');
    const configPath = path.join(projectRoot, 'config', `${environment}.env`);
    
    try {
      await fs.access(configPath);
    } catch {
      throw new Error(
        `Configuration file not found: config/${environment}.env\n` +
        `Available environments: ${await this.listEnvironments()}`
      );
    }
    
    // Load and parse config
    const configContent = await fs.readFile(configPath, 'utf-8');
    const parsed = dotenv.parse(configContent);
    
    // Validate config
    const result = ConfigSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Invalid configuration in config/${environment}.env:\n` +
        result.error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n')
      );
    }
    
    this.configs.set(environment, result.data);
    return result.data;
  }
  
  async listEnvironments(): Promise<string> {
    const projectRoot = path.resolve(__dirname, '..');
    const configDir = path.join(projectRoot, 'config');
    
    try {
      const files = await fs.readdir(configDir);
      const envFiles = files
        .filter(f => f.endsWith('.env') && f !== 'template.env')
        .map(f => f.replace('.env', ''));
      
      return envFiles.join(', ') || 'No environments configured';
    } catch {
      return 'No environments configured';
    }
  }
  
  getProjectRoot(): string {
    return path.resolve(__dirname, '..');
  }
}

export const configManager = ConfigManager.getInstance();
