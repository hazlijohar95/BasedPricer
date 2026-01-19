/**
 * Tests for CLI configuration utilities
 */

import { describe, it, expect } from 'vitest';
import { isValidConfigKey, VALID_CONFIG_KEYS } from './config.js';

describe('isValidConfigKey', () => {
  it('should return true for valid config keys', () => {
    expect(isValidConfigKey('openai-key')).toBe(true);
    expect(isValidConfigKey('anthropic-key')).toBe(true);
    expect(isValidConfigKey('github-token')).toBe(true);
    expect(isValidConfigKey('default-provider')).toBe(true);
    expect(isValidConfigKey('default-currency')).toBe(true);
  });

  it('should return false for invalid config keys', () => {
    expect(isValidConfigKey('invalid-key')).toBe(false);
    expect(isValidConfigKey('')).toBe(false);
    expect(isValidConfigKey('OPENAI-KEY')).toBe(false);
    expect(isValidConfigKey('openaikey')).toBe(false);
    expect(isValidConfigKey('openai_key')).toBe(false);
  });

  it('should work correctly as a type guard', () => {
    const key = 'openai-key';
    if (isValidConfigKey(key)) {
      // TypeScript should recognize this as ConfigKey
      expect(VALID_CONFIG_KEYS).toContain(key);
    }
  });
});

describe('VALID_CONFIG_KEYS', () => {
  it('should contain all expected keys', () => {
    expect(VALID_CONFIG_KEYS).toContain('openai-key');
    expect(VALID_CONFIG_KEYS).toContain('anthropic-key');
    expect(VALID_CONFIG_KEYS).toContain('github-token');
    expect(VALID_CONFIG_KEYS).toContain('default-provider');
    expect(VALID_CONFIG_KEYS).toContain('default-currency');
  });

  it('should have exactly 5 keys', () => {
    expect(VALID_CONFIG_KEYS).toHaveLength(5);
  });

  it('should be an array', () => {
    expect(Array.isArray(VALID_CONFIG_KEYS)).toBe(true);
  });
});
