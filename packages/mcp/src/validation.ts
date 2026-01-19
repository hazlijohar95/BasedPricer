/**
 * Validation utilities for MCP server
 */

import {
  validateVariableCostItem,
  validateFixedCostItem,
  type VariableCostItem,
  type FixedCostItem,
  type CurrencyCode,
} from '@basedpricer/core';

/**
 * List of valid currency codes
 */
export const VALID_CURRENCY_CODES: CurrencyCode[] = ['MYR', 'USD', 'SGD', 'EUR', 'GBP', 'AUD'];

/**
 * List of valid AI providers
 */
export const VALID_AI_PROVIDERS = ['openai', 'anthropic', 'groq', 'minimax', 'glm', 'openrouter'] as const;
export type AIProvider = (typeof VALID_AI_PROVIDERS)[number];

/**
 * Validate that a value is a positive number
 */
export function validatePositiveNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number') {
    throw new Error(`${fieldName} must be a number, got ${typeof value}`);
  }
  if (isNaN(value)) {
    throw new Error(`${fieldName} must be a valid number, got NaN`);
  }
  if (value <= 0) {
    throw new Error(`${fieldName} must be positive, got ${value}`);
  }
  return value;
}

/**
 * Validate that a value is a non-negative number
 */
export function validateNonNegativeNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number') {
    throw new Error(`${fieldName} must be a number, got ${typeof value}`);
  }
  if (isNaN(value)) {
    throw new Error(`${fieldName} must be a valid number, got NaN`);
  }
  if (value < 0) {
    throw new Error(`${fieldName} must be non-negative, got ${value}`);
  }
  return value;
}

/**
 * Validate that a value is a number (can be zero or positive)
 */
export function validateNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number') {
    throw new Error(`${fieldName} must be a number, got ${typeof value}`);
  }
  if (isNaN(value)) {
    throw new Error(`${fieldName} must be a valid number, got NaN`);
  }
  return value;
}

/**
 * Validate a currency code
 */
export function validateCurrencyCode(value: unknown): CurrencyCode {
  if (typeof value !== 'string') {
    return 'MYR'; // Default
  }
  if (!VALID_CURRENCY_CODES.includes(value as CurrencyCode)) {
    throw new Error(`Invalid currency code: ${value}. Valid codes: ${VALID_CURRENCY_CODES.join(', ')}`);
  }
  return value as CurrencyCode;
}

/**
 * Validate an AI provider
 */
export function validateAIProvider(value: unknown): AIProvider {
  if (typeof value !== 'string') {
    throw new Error(`AI provider must be a string, got ${typeof value}`);
  }
  if (!VALID_AI_PROVIDERS.includes(value as AIProvider)) {
    throw new Error(`Invalid AI provider: ${value}. Valid providers: ${VALID_AI_PROVIDERS.join(', ')}`);
  }
  return value as AIProvider;
}

/**
 * Validate and parse variable costs array
 */
export function validateVariableCosts(rawCosts: unknown): VariableCostItem[] {
  if (!Array.isArray(rawCosts)) {
    throw new Error('variableCosts must be an array');
  }

  const validCosts: VariableCostItem[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rawCosts.length; i++) {
    const result = validateVariableCostItem(rawCosts[i]);
    if (result.success) {
      validCosts.push(result.data);
    } else {
      errors.push(`variableCosts[${i}]: ${result.error}`);
    }
  }

  if (errors.length > 0 && validCosts.length === 0) {
    throw new Error(`No valid variable costs: ${errors.join('; ')}`);
  }

  return validCosts;
}

/**
 * Validate and parse fixed costs array
 */
export function validateFixedCosts(rawCosts: unknown): FixedCostItem[] {
  if (!Array.isArray(rawCosts)) {
    throw new Error('fixedCosts must be an array');
  }

  const validCosts: FixedCostItem[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rawCosts.length; i++) {
    const result = validateFixedCostItem(rawCosts[i]);
    if (result.success) {
      validCosts.push(result.data);
    } else {
      errors.push(`fixedCosts[${i}]: ${result.error}`);
    }
  }

  if (errors.length > 0 && validCosts.length === 0) {
    throw new Error(`No valid fixed costs: ${errors.join('; ')}`);
  }

  return validCosts;
}

/**
 * Safely get a number from args with a default value
 */
export function getNumberOrDefault(
  args: Record<string, unknown> | undefined,
  key: string,
  defaultValue: number
): number {
  if (!args || args[key] === undefined || args[key] === null) {
    return defaultValue;
  }
  const value = args[key];
  if (typeof value !== 'number' || isNaN(value)) {
    return defaultValue;
  }
  return value > 0 ? value : defaultValue;
}
