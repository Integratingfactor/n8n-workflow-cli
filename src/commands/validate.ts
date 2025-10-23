import chalk from 'chalk';
import { configManager } from '../config.js';
import { validateAllWorkflows } from '../workflow-manager.js';

export async function validateCommand(): Promise<void> {
  console.log(chalk.bold('Validating workflow files...\n'));
  
  const projectRoot = configManager.getProjectRoot();
  const results = await validateAllWorkflows(projectRoot);
  
  if (results.invalid.length > 0) {
    console.log(chalk.red.bold(`✗ ${results.invalid.length} workflow(s) failed validation:\n`));
    
    results.invalid.forEach(({ file, errors }) => {
      const fileName = file.replace(projectRoot + '/', '');
      console.log(chalk.red(`✗ ${fileName}`));
      errors.forEach(error => {
        console.log(chalk.gray(`  ${error}`));
      });
      console.log('');
    });
  }
  
  if (results.valid > 0) {
    console.log(chalk.green(`✓ ${results.valid} workflow(s) validated successfully`));
  }
  
  console.log('');
  console.log(chalk.bold('Summary:'));
  console.log(`  ${chalk.green('Valid:')} ${results.valid}`);
  console.log(`  ${chalk.red('Invalid:')} ${results.invalid.length}`);
  
  if (results.invalid.length > 0) {
    process.exit(1);
  }
}
