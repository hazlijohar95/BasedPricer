/**
 * Utility functions
 * Currency formatting, conversion, and general utilities
 */

import type { Currency, CurrencyCode } from '../types';
import { CURRENCIES, DEFAULT_CURRENCY } from '../data';

// ============================================================================
// Currency Formatting
// ============================================================================

/**
 * Format a value as currency
 */
export function formatCurrency(
  value: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY,
  options: {
    showSymbol?: boolean;
    decimals?: number;
    compact?: boolean;
  } = {}
): string {
  const { showSymbol = true, decimals, compact = false } = options;
  const currency = CURRENCIES[currencyCode];

  if (compact) {
    return formatCurrencyCompact(value, currency);
  }

  const actualDecimals = decimals ?? currency.decimalPlaces;
  const formattedValue = formatNumber(value, actualDecimals, currency);

  if (showSymbol) {
    return currency.position === 'before'
      ? `${currency.symbol}${formattedValue}`
      : `${formattedValue}${currency.symbol}`;
  }

  return formattedValue;
}

/**
 * Format a number with thousands separators
 */
function formatNumber(value: number, decimals: number, currency: Currency): string {
  const parts = value.toFixed(decimals).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);

  if (decimals > 0 && parts[1]) {
    return `${integerPart}${currency.decimalSeparator}${parts[1]}`;
  }

  return integerPart;
}

/**
 * Format currency in compact notation (K, M)
 */
function formatCurrencyCompact(value: number, currency: Currency): string {
  let formatted: string;

  if (Math.abs(value) >= 1_000_000) {
    formatted = `${(value / 1_000_000).toFixed(1)}M`;
  } else if (Math.abs(value) >= 1_000) {
    formatted = `${(value / 1_000).toFixed(1)}K`;
  } else {
    formatted = value.toFixed(currency.decimalPlaces);
  }

  return currency.position === 'before'
    ? `${currency.symbol}${formatted}`
    : `${formatted}${currency.symbol}`;
}

// ============================================================================
// Currency Conversion
// ============================================================================

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;

  const fromCurrency = CURRENCIES[from];
  const toCurrency = CURRENCIES[to];

  // Convert to MYR first (base currency), then to target
  const amountInMYR = amount / fromCurrency.rate;
  return amountInMYR * toCurrency.rate;
}

/**
 * Convert MYR to another currency
 */
export function convertFromMYR(amountMYR: number, to: CurrencyCode): number {
  return convertCurrency(amountMYR, 'MYR', to);
}

/**
 * Convert to MYR from another currency
 */
export function convertToMYR(amount: number, from: CurrencyCode): number {
  return convertCurrency(amount, from, 'MYR');
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Check if a value is a valid positive number
 */
export function isValidPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Check if a value is a valid non-negative number
 */
export function isValidNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round to nearest step
 */
export function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Generate a short ID (8 characters)
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ============================================================================
// Percentage Utilities
// ============================================================================

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Apply percentage discount
 */
export function applyDiscount(price: number, discountPercent: number): number {
  return price * (1 - discountPercent / 100);
}

/**
 * Calculate annual price with discount
 */
export function calculateAnnualPrice(
  monthlyPrice: number,
  annualDiscountPercent: number
): number {
  const annualBeforeDiscount = monthlyPrice * 12;
  return applyDiscount(annualBeforeDiscount, annualDiscountPercent);
}
