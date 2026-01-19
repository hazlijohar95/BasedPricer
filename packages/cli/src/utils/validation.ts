/**
 * Input validation utilities for CLI commands
 */

import { z } from 'zod';
import { CURRENCIES, type CurrencyCode } from '@basedpricer/core';

/**
 * Valid currency codes
 */
export const VALID_CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

/**
 * Zod schema for currency code validation
 */
export const CurrencyCodeSchema = z.enum(VALID_CURRENCY_CODES as [CurrencyCode, ...CurrencyCode[]]);

/**
 * Zod schema for output format validation
 */
export const OutputFormatSchema = z.enum(['table', 'json', 'markdown']);
export type OutputFormat = z.infer<typeof OutputFormatSchema>;

/**
 * Zod schema for positive integer (e.g., customer count)
 */
export const PositiveIntegerSchema = z.number().int().positive();

/**
 * Zod schema for positive number (e.g., price)
 */
export const PositiveNumberSchema = z.number().positive();

/**
 * Zod schema for non-negative number
 */
export const NonNegativeNumberSchema = z.number().nonnegative();

/**
 * Parse a string to a positive integer with validation
 * @param value - String value to parse
 * @param fieldName - Name of the field for error messages
 * @returns Parsed integer
 * @throws Error if validation fails
 */
export function parsePositiveInteger(value: string, fieldName: string): number {
  const num = parseInt(value, 10);

  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a valid number, got: "${value}"`);
  }

  const result = PositiveIntegerSchema.safeParse(num);
  if (!result.success) {
    throw new Error(`${fieldName} must be a positive integer, got: ${num}`);
  }

  return result.data;
}

/**
 * Parse a string to a positive number with validation
 * @param value - String value to parse
 * @param fieldName - Name of the field for error messages
 * @returns Parsed number
 * @throws Error if validation fails
 */
export function parsePositiveNumber(value: string, fieldName: string): number {
  const num = parseFloat(value);

  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a valid number, got: "${value}"`);
  }

  const result = PositiveNumberSchema.safeParse(num);
  if (!result.success) {
    throw new Error(`${fieldName} must be a positive number, got: ${num}`);
  }

  return result.data;
}

/**
 * Validate and return a currency code
 * @param code - Currency code to validate
 * @returns Valid currency code
 * @throws Error if invalid
 */
export function validateCurrencyCode(code: string): CurrencyCode {
  const result = CurrencyCodeSchema.safeParse(code);
  if (!result.success) {
    throw new Error(
      `Invalid currency code: "${code}". Valid codes: ${VALID_CURRENCY_CODES.join(', ')}`
    );
  }
  return result.data;
}

/**
 * Validate and return an output format
 * @param format - Output format to validate
 * @returns Valid output format
 * @throws Error if invalid
 */
export function validateOutputFormat(format: string): OutputFormat {
  const result = OutputFormatSchema.safeParse(format);
  if (!result.success) {
    throw new Error(
      `Invalid output format: "${format}". Valid formats: table, json, markdown`
    );
  }
  return result.data;
}

/**
 * Result of parsing a costs JSON file
 */
export interface ParsedCostsFile {
  variableCosts: unknown[];
  fixedCosts: unknown[];
}

/**
 * Parse a JSON string as a costs file
 * @param content - JSON string content
 * @param filename - Filename for error messages
 * @returns Parsed costs data
 * @throws Error with specific message for JSON parse failures
 */
export function parseCostsJson(content: string, filename: string): ParsedCostsFile {
  let data: unknown;

  try {
    data = JSON.parse(content);
  } catch (err) {
    const message = err instanceof SyntaxError ? err.message : 'Unknown parse error';
    throw new Error(`Invalid JSON in ${filename}: ${message}`);
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`${filename} must contain a JSON object`);
  }

  const obj = data as Record<string, unknown>;

  return {
    variableCosts: Array.isArray(obj.variableCosts) ? obj.variableCosts : [],
    fixedCosts: Array.isArray(obj.fixedCosts) ? obj.fixedCosts : [],
  };
}
