/**
 * Tests for MCP validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateNumber,
  validateCurrencyCode,
  validateAIProvider,
  validateVariableCosts,
  validateFixedCosts,
  getNumberOrDefault,
  VALID_CURRENCY_CODES,
  VALID_AI_PROVIDERS,
} from './validation.js';

describe('validatePositiveNumber', () => {
  it('should accept valid positive numbers', () => {
    expect(validatePositiveNumber(1, 'test')).toBe(1);
    expect(validatePositiveNumber(0.001, 'test')).toBe(0.001);
    expect(validatePositiveNumber(999999, 'test')).toBe(999999);
    expect(validatePositiveNumber(1.5, 'test')).toBe(1.5);
  });

  it('should throw for non-number types', () => {
    expect(() => validatePositiveNumber('1', 'price')).toThrow(
      'price must be a number, got string'
    );
    expect(() => validatePositiveNumber(null, 'price')).toThrow(
      'price must be a number, got object'
    );
    expect(() => validatePositiveNumber(undefined, 'price')).toThrow(
      'price must be a number, got undefined'
    );
    expect(() => validatePositiveNumber({}, 'price')).toThrow(
      'price must be a number, got object'
    );
  });

  it('should throw for NaN', () => {
    expect(() => validatePositiveNumber(NaN, 'price')).toThrow(
      'price must be a valid number, got NaN'
    );
  });

  it('should throw for zero', () => {
    expect(() => validatePositiveNumber(0, 'price')).toThrow(
      'price must be positive, got 0'
    );
  });

  it('should throw for negative numbers', () => {
    expect(() => validatePositiveNumber(-1, 'price')).toThrow(
      'price must be positive, got -1'
    );
    expect(() => validatePositiveNumber(-0.001, 'price')).toThrow(
      'price must be positive, got -0.001'
    );
  });
});

describe('validateNonNegativeNumber', () => {
  it('should accept zero and positive numbers', () => {
    expect(validateNonNegativeNumber(0, 'test')).toBe(0);
    expect(validateNonNegativeNumber(1, 'test')).toBe(1);
    expect(validateNonNegativeNumber(0.001, 'test')).toBe(0.001);
  });

  it('should throw for non-number types', () => {
    expect(() => validateNonNegativeNumber('0', 'cogs')).toThrow(
      'cogs must be a number, got string'
    );
  });

  it('should throw for NaN', () => {
    expect(() => validateNonNegativeNumber(NaN, 'cogs')).toThrow(
      'cogs must be a valid number, got NaN'
    );
  });

  it('should throw for negative numbers', () => {
    expect(() => validateNonNegativeNumber(-1, 'cogs')).toThrow(
      'cogs must be non-negative, got -1'
    );
    expect(() => validateNonNegativeNumber(-0.001, 'cogs')).toThrow(
      'cogs must be non-negative, got -0.001'
    );
  });
});

describe('validateNumber', () => {
  it('should accept any valid number', () => {
    expect(validateNumber(0, 'test')).toBe(0);
    expect(validateNumber(1, 'test')).toBe(1);
    expect(validateNumber(-1, 'test')).toBe(-1);
    expect(validateNumber(0.5, 'test')).toBe(0.5);
  });

  it('should throw for non-number types', () => {
    expect(() => validateNumber('1', 'margin')).toThrow(
      'margin must be a number, got string'
    );
  });

  it('should throw for NaN', () => {
    expect(() => validateNumber(NaN, 'margin')).toThrow(
      'margin must be a valid number, got NaN'
    );
  });
});

describe('validateCurrencyCode', () => {
  it('should accept valid currency codes', () => {
    expect(validateCurrencyCode('MYR')).toBe('MYR');
    expect(validateCurrencyCode('USD')).toBe('USD');
    expect(validateCurrencyCode('SGD')).toBe('SGD');
    expect(validateCurrencyCode('EUR')).toBe('EUR');
    expect(validateCurrencyCode('GBP')).toBe('GBP');
    expect(validateCurrencyCode('AUD')).toBe('AUD');
  });

  it('should return default MYR for non-string values', () => {
    expect(validateCurrencyCode(undefined)).toBe('MYR');
    expect(validateCurrencyCode(null)).toBe('MYR');
    expect(validateCurrencyCode(123)).toBe('MYR');
    expect(validateCurrencyCode({})).toBe('MYR');
  });

  it('should throw for invalid currency codes', () => {
    expect(() => validateCurrencyCode('INVALID')).toThrow(
      'Invalid currency code: INVALID'
    );
    expect(() => validateCurrencyCode('usd')).toThrow(
      'Invalid currency code: usd'
    );
    expect(() => validateCurrencyCode('')).toThrow('Invalid currency code:');
  });

  it('should include valid codes in error message', () => {
    try {
      validateCurrencyCode('INVALID');
    } catch (e) {
      const error = e as Error;
      VALID_CURRENCY_CODES.forEach((code) => {
        expect(error.message).toContain(code);
      });
    }
  });
});

describe('validateAIProvider', () => {
  it('should accept valid providers', () => {
    expect(validateAIProvider('openai')).toBe('openai');
    expect(validateAIProvider('anthropic')).toBe('anthropic');
    expect(validateAIProvider('groq')).toBe('groq');
    expect(validateAIProvider('minimax')).toBe('minimax');
    expect(validateAIProvider('glm')).toBe('glm');
    expect(validateAIProvider('openrouter')).toBe('openrouter');
  });

  it('should throw for non-string types', () => {
    expect(() => validateAIProvider(123)).toThrow(
      'AI provider must be a string, got number'
    );
    expect(() => validateAIProvider(null)).toThrow(
      'AI provider must be a string, got object'
    );
    expect(() => validateAIProvider(undefined)).toThrow(
      'AI provider must be a string, got undefined'
    );
  });

  it('should throw for invalid providers', () => {
    expect(() => validateAIProvider('invalid')).toThrow(
      'Invalid AI provider: invalid'
    );
    expect(() => validateAIProvider('OpenAI')).toThrow(
      'Invalid AI provider: OpenAI'
    );
    expect(() => validateAIProvider('')).toThrow('Invalid AI provider:');
  });

  it('should include valid providers in error message', () => {
    try {
      validateAIProvider('invalid');
    } catch (e) {
      const error = e as Error;
      VALID_AI_PROVIDERS.forEach((provider) => {
        expect(error.message).toContain(provider);
      });
    }
  });
});

describe('validateVariableCosts', () => {
  it('should accept valid variable costs array', () => {
    const costs = [
      { id: 'api-1', name: 'API', unit: 'call', costPerUnit: 0.01, usagePerCustomer: 100, description: 'API calls' },
      { id: 'storage-1', name: 'Storage', unit: 'GB', costPerUnit: 0.1, usagePerCustomer: 5, description: 'Storage' },
    ];
    const result = validateVariableCosts(costs);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('API');
  });

  it('should throw for non-array input', () => {
    expect(() => validateVariableCosts('not an array')).toThrow(
      'variableCosts must be an array'
    );
    expect(() => validateVariableCosts({})).toThrow(
      'variableCosts must be an array'
    );
    expect(() => validateVariableCosts(null)).toThrow(
      'variableCosts must be an array'
    );
  });

  it('should filter out invalid items but keep valid ones', () => {
    const costs = [
      { id: 'valid-1', name: 'Valid', unit: 'call', costPerUnit: 0.01, usagePerCustomer: 100, description: 'Valid cost' },
      { invalid: 'item' }, // Missing required fields
    ];
    const result = validateVariableCosts(costs);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Valid');
  });

  it('should throw when all items are invalid', () => {
    const costs = [{ invalid: 'item1' }, { also: 'invalid' }];
    expect(() => validateVariableCosts(costs)).toThrow('No valid variable costs');
  });

  it('should accept empty array', () => {
    const result = validateVariableCosts([]);
    expect(result).toEqual([]);
  });
});

describe('validateFixedCosts', () => {
  it('should accept valid fixed costs array', () => {
    const costs = [
      { id: 'hosting-1', name: 'Hosting', monthlyCost: 50, description: 'Hosting costs' },
      { id: 'db-1', name: 'Database', monthlyCost: 25, description: 'Database costs' },
    ];
    const result = validateFixedCosts(costs);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Hosting');
  });

  it('should throw for non-array input', () => {
    expect(() => validateFixedCosts('not an array')).toThrow(
      'fixedCosts must be an array'
    );
    expect(() => validateFixedCosts(123)).toThrow('fixedCosts must be an array');
  });

  it('should filter out invalid items but keep valid ones', () => {
    const costs = [{ id: 'valid-1', name: 'Valid', monthlyCost: 50, description: 'Valid cost' }, { invalid: 'item' }];
    const result = validateFixedCosts(costs);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Valid');
  });

  it('should throw when all items are invalid', () => {
    const costs = [{ invalid: 'item1' }, { also: 'invalid' }];
    expect(() => validateFixedCosts(costs)).toThrow('No valid fixed costs');
  });

  it('should accept empty array', () => {
    const result = validateFixedCosts([]);
    expect(result).toEqual([]);
  });
});

describe('getNumberOrDefault', () => {
  it('should return the value when present and valid', () => {
    expect(getNumberOrDefault({ count: 50 }, 'count', 100)).toBe(50);
    expect(getNumberOrDefault({ count: 1 }, 'count', 100)).toBe(1);
  });

  it('should return default for undefined args', () => {
    expect(getNumberOrDefault(undefined, 'count', 100)).toBe(100);
  });

  it('should return default for missing key', () => {
    expect(getNumberOrDefault({}, 'count', 100)).toBe(100);
    expect(getNumberOrDefault({ other: 50 }, 'count', 100)).toBe(100);
  });

  it('should return default for null or undefined values', () => {
    expect(getNumberOrDefault({ count: null }, 'count', 100)).toBe(100);
    expect(getNumberOrDefault({ count: undefined }, 'count', 100)).toBe(100);
  });

  it('should return default for non-number values', () => {
    expect(getNumberOrDefault({ count: 'string' }, 'count', 100)).toBe(100);
    expect(getNumberOrDefault({ count: {} }, 'count', 100)).toBe(100);
    expect(getNumberOrDefault({ count: [] }, 'count', 100)).toBe(100);
  });

  it('should return default for NaN', () => {
    expect(getNumberOrDefault({ count: NaN }, 'count', 100)).toBe(100);
  });

  it('should return default for zero or negative values', () => {
    expect(getNumberOrDefault({ count: 0 }, 'count', 100)).toBe(100);
    expect(getNumberOrDefault({ count: -1 }, 'count', 100)).toBe(100);
  });
});

describe('VALID_CURRENCY_CODES', () => {
  it('should contain all expected currencies', () => {
    expect(VALID_CURRENCY_CODES).toContain('MYR');
    expect(VALID_CURRENCY_CODES).toContain('USD');
    expect(VALID_CURRENCY_CODES).toContain('SGD');
    expect(VALID_CURRENCY_CODES).toContain('EUR');
    expect(VALID_CURRENCY_CODES).toContain('GBP');
    expect(VALID_CURRENCY_CODES).toContain('AUD');
  });

  it('should have exactly 6 currencies', () => {
    expect(VALID_CURRENCY_CODES).toHaveLength(6);
  });
});

describe('VALID_AI_PROVIDERS', () => {
  it('should contain all expected providers', () => {
    expect(VALID_AI_PROVIDERS).toContain('openai');
    expect(VALID_AI_PROVIDERS).toContain('anthropic');
    expect(VALID_AI_PROVIDERS).toContain('groq');
    expect(VALID_AI_PROVIDERS).toContain('minimax');
    expect(VALID_AI_PROVIDERS).toContain('glm');
    expect(VALID_AI_PROVIDERS).toContain('openrouter');
  });

  it('should have exactly 6 providers', () => {
    expect(VALID_AI_PROVIDERS).toHaveLength(6);
  });
});
