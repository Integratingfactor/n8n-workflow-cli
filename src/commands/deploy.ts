import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import { N8nClient } from '../api-client.js';
import { configManager } from '../config.js';
import { loadWorkflowFromFile, findWorkflowFiles } from '../workflow-manager.js';
import { DeployOptions } from '../types.js';

async function deployWorkflow(
  client: N8nClient,
  filePath: string,
  projectRoot: string,
  dryRun: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const workflow = await loadWorkflowFromFile(filePath);
    const relativePath = filePath.replace(projectRoot + '/', '');
    
    if (dryRun) {
      return {
        success: true,
        message: `Would deploy: ${relativePath}`
      };
    }
    
    if (workflow.id) {
      // Update existing workflow
      const updated = await client.updateWorkflow(workflow.id, workflow);
      
      // Update workflow tags if they exist
      if (workflow.tags && workflow.tags.length > 0) {
        // Get all existing tags
        const existingTags = await client.listTags();
        
        // Create a map of tag names to IDs
        const tagNameToId = new Map(existingTags.map(tag => [tag.name, tag.id]));
        
        // Process each tag - create if it doesn't exist
        const tagIds: string[] = [];
        for (const tag of workflow.tags) {
          const tagName = tag.name;
          if (tagNameToId.has(tagName)) {
            tagIds.push(tagNameToId.get(tagName)!);
          } else {
            const newTag = await client.createTag(tagName);
            tagIds.push(newTag.id);
          }
        }
        
        // Assign all tags to the workflow
        await client.updateWorkflowTags(workflow.id, tagIds);
      }
      
      return {
        success: true,
        message: `Updated: ${relativePath} (ID: ${updated.id})`
      };
    } else {
      // Create new workflow
      const created = await client.createWorkflow(workflow);
      
      // Update local file with new ID
      workflow.id = created.id;
      const fs = await import('fs/promises');
      await fs.writeFile(filePath, JSON.stringify(workflow, null, 2) + '\n', 'utf-8');
      
      // Update workflow tags if they exist
      if (workflow.tags && workflow.tags.length > 0 && created.id) {
        // Get all existing tags
        const existingTags = await client.listTags();
        
        // Create a map of tag names to IDs
        const tagNameToId = new Map(existingTags.map(tag => [tag.name, tag.id]));
        
        // Process each tag - create if it doesn't exist
        const tagIds: string[] = [];
        for (const tag of workflow.tags) {
          const tagName = tag.name;
          if (tagNameToId.has(tagName)) {
            tagIds.push(tagNameToId.get(tagName)!);
          } else {
            const newTag = await client.createTag(tagName);
            tagIds.push(newTag.id);
          }
        }
        
        // Assign all tags to the workflow
        await client.updateWorkflowTags(created.id, tagIds);
      }
      
      return {
        success: true,
        message: `Created: ${relativePath} (ID: ${created.id})`
      };
    }
  } catch (error) {
    const relativePath = filePath.replace(projectRoot + '/', '');
    return {
      success: false,
      message: `Failed: ${relativePath} - ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function deployCommand(options: DeployOptions): Promise<void> {
  const spinner = ora('Loading configuration...').start();
  
  try {
    const config = await configManager.loadConfig(options.environment);
    spinner.succeed(`Loaded configuration for ${chalk.cyan(options.environment)} environment`);
    
    if (options.dryRun) {
      console.log(chalk.yellow('DRY RUN MODE - No changes will be made'));
    }
    
    spinner.start('Connecting to n8n API...');
    const client = new N8nClient(config);
    const isConnected = await client.testConnection();
    
    if (!isConnected) {
      spinner.fail('Failed to connect to n8n API');
      console.error(chalk.red('Check your API URL and API key configuration'));
      process.exit(1);
    }
    
    spinner.succeed('Connected to n8n API');
    
    // Determine what to deploy
    const projectRoot = configManager.getProjectRoot();
    let filesToDeploy: string[] = [];
    
    if (options.target) {
      // Check if target is a specific file
      if (options.target.endsWith('.json')) {
        const targetPath = path.isAbsolute(options.target)
          ? options.target
          : path.join(projectRoot, options.target);
        filesToDeploy = [targetPath];
      } else {
        // Target is a category
        filesToDeploy = await findWorkflowFiles(projectRoot, options.target);
      }
    } else {
      // Deploy all workflows
      filesToDeploy = await findWorkflowFiles(projectRoot);
    }
    
    if (filesToDeploy.length === 0) {
      spinner.info('No workflow files found to deploy');
      return;
    }
    
    console.log(chalk.bold(`\nDeploying ${filesToDeploy.length} workflow(s)...\n`));
    
    const results = {
      success: 0,
      failed: 0,
      messages: [] as string[]
    };
    
    if (options.parallel && filesToDeploy.length > 1) {
      // Parallel deployment
      spinner.start('Deploying workflows in parallel...');
      const promises = filesToDeploy.map(file => 
        deployWorkflow(client, file, projectRoot, options.dryRun || false)
      );
      const outcomes = await Promise.all(promises);
      
      outcomes.forEach(outcome => {
        if (outcome.success) {
          results.success++;
          console.log(chalk.green(`✓ ${outcome.message}`));
        } else {
          results.failed++;
          console.log(chalk.red(`✗ ${outcome.message}`));
        }
      });
      
      spinner.stop();
    } else {
      // Sequential deployment
      for (const file of filesToDeploy) {
        const outcome = await deployWorkflow(client, file, projectRoot, options.dryRun || false);
        
        if (outcome.success) {
          results.success++;
          console.log(chalk.green(`✓ ${outcome.message}`));
        } else {
          results.failed++;
          console.log(chalk.red(`✗ ${outcome.message}`));
        }
      }
    }
    
    console.log('');
    console.log(chalk.bold('Summary:'));
    console.log(`  ${chalk.green('✓')} Success: ${results.success}`);
    if (results.failed > 0) {
      console.log(`  ${chalk.red('✗')} Failed: ${results.failed}`);
    }
    
    if (results.failed > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    spinner.fail('Deploy failed');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}
