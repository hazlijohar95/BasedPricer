/**
 * Config command - manage CLI configuration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  getConfig,
  setConfig,
  deleteConfig,
  getAllConfig,
  getConfigPath,
  isValidConfigKey,
  VALID_CONFIG_KEYS,
  type ConfigKey,
} from '../utils/config.js';

/** Number of characters to show when masking sensitive values */
const MASKED_PREFIX_LENGTH = 8;

/**
 * Check if a config key contains sensitive data (API keys, tokens)
 */
function isSensitiveKey(key: string): boolean {
  return key.includes('key') || key.includes('token');
}

/**
 * Mask a sensitive value for display
 */
function maskValue(value: string | undefined, key: string): string {
  if (value === undefined || value === null) {
    return chalk.gray('(not set)');
  }
  if (isSensitiveKey(key)) {
    return value.length > MASKED_PREFIX_LENGTH
      ? value.slice(0, MASKED_PREFIX_LENGTH) + '...'
      : '***';
  }
  return String(value);
}

export const configCommand = new Command('config')
  .description('Manage CLI configuration')
  .addCommand(
    new Command('set')
      .description('Set a configuration value')
      .argument('<key>', `Configuration key (${VALID_CONFIG_KEYS.join(', ')})`)
      .argument('<value>', 'Configuration value')
      .action((key: string, value: string) => {
        if (!isValidConfigKey(key)) {
          console.error(chalk.red(`Invalid key: ${key}`));
          console.log(chalk.gray(`Valid keys: ${VALID_CONFIG_KEYS.join(', ')}`));
          process.exit(1);
        }

        // Now TypeScript knows key is ConfigKey
        setConfig(key, value);
        console.log(chalk.green(`✓ Set ${key} = ${maskValue(value, key)}`));
      })
  )
  .addCommand(
    new Command('get')
      .description('Get a configuration value')
      .argument('<key>', 'Configuration key')
      .action((key: string) => {
        if (!isValidConfigKey(key)) {
          console.error(chalk.red(`Invalid key: ${key}`));
          console.log(chalk.gray(`Valid keys: ${VALID_CONFIG_KEYS.join(', ')}`));
          process.exit(1);
        }

        const value = getConfig(key);
        if (value === undefined) {
          console.log(chalk.gray(`${key} is not set`));
        } else {
          console.log(`${key} = ${maskValue(String(value), key)}`);
        }
      })
  )
  .addCommand(
    new Command('list')
      .description('List all configuration values')
      .action(() => {
        const all = getAllConfig();
        const keys = Object.keys(all) as ConfigKey[];

        if (keys.length === 0) {
          console.log(chalk.gray('No configuration set'));
          return;
        }

        console.log(chalk.bold('\nConfiguration:\n'));
        keys.forEach((key) => {
          const value = all[key];
          console.log(`  ${chalk.cyan(key)}: ${maskValue(String(value), key)}`);
        });
        console.log(chalk.gray(`\nConfig file: ${getConfigPath()}`));
      })
  )
  .addCommand(
    new Command('delete')
      .description('Delete a configuration value')
      .argument('<key>', 'Configuration key')
      .action((key: string) => {
        if (!isValidConfigKey(key)) {
          console.error(chalk.red(`Invalid key: ${key}`));
          console.log(chalk.gray(`Valid keys: ${VALID_CONFIG_KEYS.join(', ')}`));
          process.exit(1);
        }

        deleteConfig(key);
        console.log(chalk.green(`✓ Deleted ${key}`));
      })
  )
  .addCommand(
    new Command('path')
      .description('Show configuration file path')
      .action(() => {
        console.log(getConfigPath());
      })
  );
