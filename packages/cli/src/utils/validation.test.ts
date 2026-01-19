/**
 * Tests for CLI validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  parsePositiveInteger,
  parsePositiveNumber,
  validateCurrencyCode,
  validateOutputFormat,
  parseCostsJson,
  VALID_CURRENCY_CODES,
} from './validation.js';

describe('parsePositiveInteger', () => {
  it('should parse valid positive integers', () => {
    expect(parsePositiveInteger('1', 'test')).toBe(1);
    expect(parsePositiveInteger('100', 'test')).toBe(100);
    expect(parsePositiveInteger('999999', 'test')).toBe(999999);
  });

  it('should throw for non-numeric strings', () => {
    expect(() => parsePositiveInteger('abc', 'count')).toThrow(
      'count must be a valid number, got: "abc"'
    );
    expect(() => parsePositiveInteger('', 'count')).toThrow(
      'count must be a valid number'
    );
  });

  it('should throw for zero', () => {
    expect(() => parsePositiveInteger('0', 'count')).toThrow(
      'count must be a positive integer, got: 0'
    );
  });

  it('should throw for negative numbers', () => {
    expect(() => parsePositiveInteger('-1', 'count')).toThrow(
      'count must be a positive integer, got: -1'
    );
    expect(() => parsePositiveInteger('-100', 'count')).toThrow(
      'count must be a positive integer, got: -100'
    );
  });

  it('should truncate decimal strings to integers (parseInt behavior)', () => {
    // parseInt truncates decimals, so '1.5' becomes 1
    expect(parsePositiveInteger('1.5', 'count')).toBe(1);
    expect(parsePositiveInteger('99.9', 'count')).toBe(99);
  });

  it('should handle whitespace in strings', () => {
    expect(() => parsePositiveInteger('  ', 'count')).toThrow(
      'count must be a valid number'
    );
  });
});

describe('parsePositiveNumber', () => {
  it('should parse valid positive numbers', () => {
    expect(parsePositiveNumber('1', 'price')).toBe(1);
    expect(parsePositiveNumber('1.5', 'price')).toBe(1.5);
    expect(parsePositiveNumber('99.99', 'price')).toBe(99.99);
    expect(parsePositiveNumber('0.01', 'price')).toBe(0.01);
  });

  it('should throw for non-numeric strings', () => {
    expect(() => parsePositiveNumber('abc', 'price')).toThrow(
      'price must be a valid number, got: "abc"'
    );
  });

  it('should throw for zero', () => {
    expect(() => parsePositiveNumber('0', 'price')).toThrow(
      'price must be a positive number, got: 0'
    );
  });

  it('should throw for negative numbers', () => {
    expect(() => parsePositiveNumber('-1', 'price')).toThrow(
      'price must be a positive number, got: -1'
    );
    expect(() => parsePositiveNumber('-0.01', 'price')).toThrow(
      'price must be a positive number, got: -0.01'
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

  it('should throw for invalid currency codes', () => {
    expect(() => validateCurrencyCode('INVALID')).toThrow(
      'Invalid currency code: "INVALID"'
    );
    expect(() => validateCurrencyCode('usd')).toThrow(
      'Invalid currency code: "usd"'
    );
    expect(() => validateCurrencyCode('')).toThrow(
      'Invalid currency code: ""'
    );
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

describe('validateOutputFormat', () => {
  it('should accept valid output formats', () => {
    expect(validateOutputFormat('table')).toBe('table');
    expect(validateOutputFormat('json')).toBe('json');
    expect(validateOutputFormat('markdown')).toBe('markdown');
  });

  it('should throw for invalid output formats', () => {
    expect(() => validateOutputFormat('csv')).toThrow(
      'Invalid output format: "csv"'
    );
    expect(() => validateOutputFormat('TABLE')).toThrow(
      'Invalid output format: "TABLE"'
    );
    expect(() => validateOutputFormat('')).toThrow(
      'Invalid output format: ""'
    );
  });

  it('should include valid formats in error message', () => {
    try {
      validateOutputFormat('invalid');
    } catch (e) {
      const error = e as Error;
      expect(error.message).toContain('table');
      expect(error.message).toContain('json');
      expect(error.message).toContain('markdown');
    }
  });
});

describe('parseCostsJson', () => {
  it('should parse valid costs JSON', () => {
    const json = JSON.stringify({
      variableCosts: [
        { name: 'Test', unit: 'item', costPerUnit: 1, usagePerCustomer: 10 },
      ],
      fixedCosts: [{ name: 'Hosting', monthlyCost: 50 }],
    });

    const result = parseCostsJson(json, 'test.json');
    expect(result.variableCosts).toHaveLength(1);
    expect(result.fixedCosts).toHaveLength(1);
  });

  it('should throw for invalid JSON syntax', () => {
    expect(() => parseCostsJson('{invalid}', 'test.json')).toThrow(
      'Invalid JSON in test.json'
    );
  });

  it('should throw for non-object JSON', () => {
    expect(() => parseCostsJson('[]', 'test.json')).toThrow(
      'test.json must contain a JSON object'
    );
    expect(() => parseCostsJson('"string"', 'test.json')).toThrow(
      'test.json must contain a JSON object'
    );
    expect(() => parseCostsJson('null', 'test.json')).toThrow(
      'test.json must contain a JSON object'
    );
  });

  it('should return empty arrays for missing keys', () => {
    const result = parseCostsJson('{}', 'test.json');
    expect(result.variableCosts).toEqual([]);
    expect(result.fixedCosts).toEqual([]);
  });

  it('should return empty arrays for non-array values', () => {
    const json = JSON.stringify({
      variableCosts: 'not an array',
      fixedCosts: 123,
    });

    const result = parseCostsJson(json, 'test.json');
    expect(result.variableCosts).toEqual([]);
    expect(result.fixedCosts).toEqual([]);
  });
});
