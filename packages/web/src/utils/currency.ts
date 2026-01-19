/**
 * Currency formatting and conversion utilities
 * Single source of truth for all currency operations in the app
 */

import { CURRENCIES, DEFAULT_CURRENCY, type Currency, type CurrencyCode } from '../constants';

/**
 * Get currency configuration by code
 */
export function getCurrency(code: CurrencyCode): Currency {
  return CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY];
}

/**
 * Convert amount from MYR to target currency
 * @param amountMYR - Amount in Malaysian Ringgit
 * @param targetCurrency - Target currency code
 * @returns Converted amount in target currency
 */
export function convertFromMYR(amountMYR: number, targetCurrency: CurrencyCode): number {
  const currency = getCurrency(targetCurrency);
  return amountMYR * currency.rate;
}

/**
 * Convert amount from any currency to MYR
 * @param amount - Amount in source currency
 * @param sourceCurrency - Source currency code
 * @returns Amount in MYR
 */
export function convertToMYR(amount: number, sourceCurrency: CurrencyCode): number {
  const currency = getCurrency(sourceCurrency);
  return currency.rate > 0 ? amount / currency.rate : 0;
}

/**
 * Format a number with proper thousand separators and decimal places
 */
function formatNumber(
  value: number,
  decimalPlaces: number,
  thousandsSeparator: string,
  decimalSeparator: string
): string {
  // Round to specified decimal places
  const rounded = Math.round(value * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);

  // Split into integer and decimal parts
  const parts = rounded.toFixed(decimalPlaces).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add thousand separators to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

  // Combine with decimal part if needed
  if (decimalPlaces > 0 && decimalPart) {
    return `${formattedInteger}${decimalSeparator}${decimalPart}`;
  }
  return formattedInteger;
}

export interface FormatPriceOptions {
  /** Show currency code instead of symbol */
  showCode?: boolean;
  /** Number of decimal places (overrides currency default) */
  decimals?: number;
  /** Compact format for large numbers (e.g., 1.5K, 2.3M) */
  compact?: boolean;
  /** Include space between symbol and number */
  space?: boolean;
}

/**
 * Format a price in the specified currency
 * @param amountMYR - Amount in MYR (base currency)
 * @param currencyCode - Target currency code
 * @param options - Formatting options
 * @returns Formatted price string
 */
export function formatPrice(
  amountMYR: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY,
  options: FormatPriceOptions = {}
): string {
  const currency = getCurrency(currencyCode);
  const { showCode = false, decimals, compact = false, space = false } = options;

  // Convert from MYR to target currency
  const convertedAmount = convertFromMYR(amountMYR, currencyCode);

  // Determine decimal places
  const decimalPlaces = decimals ?? currency.decimalPlaces;

  // Format the number
  let formattedNumber: string;
  if (compact && Math.abs(convertedAmount) >= 1000) {
    if (Math.abs(convertedAmount) >= 1000000) {
      formattedNumber = `${(convertedAmount / 1000000).toFixed(1)}M`;
    } else {
      formattedNumber = `${(convertedAmount / 1000).toFixed(1)}K`;
    }
  } else {
    formattedNumber = formatNumber(
      convertedAmount,
      decimalPlaces,
      currency.thousandsSeparator,
      currency.decimalSeparator
    );
  }

  // Build the final string
  const spacer = space ? ' ' : '';
  const prefix = showCode ? currency.code : currency.symbol;

  if (currency.position === 'before') {
    return `${prefix}${spacer}${formattedNumber}`;
  }
  return `${formattedNumber}${spacer}${prefix}`;
}

/**
 * Format price with currency code (e.g., "MYR 100.00")
 */
export function formatPriceWithCode(
  amountMYR: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY
): string {
  return formatPrice(amountMYR, currencyCode, { showCode: true, space: true });
}

/**
 * Format price compactly (e.g., "RM1.5K")
 */
export function formatPriceCompact(
  amountMYR: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY
): string {
  return formatPrice(amountMYR, currencyCode, { compact: true });
}

/**
 * Get all available currency options for dropdown
 */
export function getCurrencyOptions(): { code: CurrencyCode; label: string; symbol: string }[] {
  return Object.entries(CURRENCIES).map(([code, currency]) => ({
    code: code as CurrencyCode,
    label: `${currency.name} (${currency.symbol})`,
    symbol: currency.symbol,
  }));
}

/**
 * Parse a price string back to MYR amount
 * Useful for input handling
 */
export function parsePriceToMYR(priceString: string, currencyCode: CurrencyCode = DEFAULT_CURRENCY): number {
  // Remove currency symbols and whitespace (keep digits, dots, commas, minus)
  const cleaned = priceString.replace(/[^\d.,-]/g, '');

  // Handle both comma and period as decimal separators based on currency
  const currency = getCurrency(currencyCode);
  let normalized = cleaned;
  if (currency.decimalSeparator === ',') {
    // European format: 1.234,56 -> 1234.56
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // US format: 1,234.56 -> 1234.56
    normalized = cleaned.replace(/,/g, '');
  }

  const amount = parseFloat(normalized);
  if (isNaN(amount)) return 0;

  // Convert back to MYR
  return convertToMYR(amount, currencyCode);
}
