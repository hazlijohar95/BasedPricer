/**
 * Configuration management
 */

import Conf from 'conf';

export interface Config {
  'openai-key'?: string;
  'anthropic-key'?: string;
  'github-token'?: string;
  'default-provider'?: 'openai' | 'anthropic' | 'groq' | 'minimax';
  'default-currency'?: 'MYR' | 'USD' | 'SGD' | 'EUR' | 'GBP' | 'AUD';
}

export type ConfigKey = keyof Config;

/**
 * Valid configuration keys - used for runtime validation
 */
export const VALID_CONFIG_KEYS: ConfigKey[] = [
  'openai-key',
  'anthropic-key',
  'github-token',
  'default-provider',
  'default-currency',
];

/**
 * Type guard to check if a string is a valid config key
 */
export function isValidConfigKey(key: string): key is ConfigKey {
  return VALID_CONFIG_KEYS.includes(key as ConfigKey);
}

const config = new Conf<Config>({
  projectName: 'basedpricer',
  schema: {
    'openai-key': { type: 'string' },
    'anthropic-key': { type: 'string' },
    'github-token': { type: 'string' },
    'default-provider': {
      type: 'string',
      enum: ['openai', 'anthropic', 'groq', 'minimax'],
    },
    'default-currency': {
      type: 'string',
      enum: ['MYR', 'USD', 'SGD', 'EUR', 'GBP', 'AUD'],
      default: 'MYR',
    },
  },
});

export function getConfig<K extends keyof Config>(key: K): Config[K] {
  return config.get(key);
}

export function setConfig<K extends keyof Config>(key: K, value: Config[K]): void {
  config.set(key, value);
}

export function deleteConfig<K extends keyof Config>(key: K): void {
  config.delete(key);
}

export function getAllConfig(): Config {
  return config.store;
}

export function clearConfig(): void {
  config.clear();
}

export function getConfigPath(): string {
  return config.path;
}

/**
 * Get API key for a provider
 */
export function getApiKey(provider: 'openai' | 'anthropic'): string | undefined {
  return config.get(`${provider}-key` as keyof Config) as string | undefined;
}

/**
 * Get GitHub token
 */
export function getGitHubToken(): string | undefined {
  return config.get('github-token');
}

/**
 * Get default currency
 */
export function getDefaultCurrency(): string {
  return config.get('default-currency') || 'MYR';
}
