// Design System Colors
export const COLORS = {
  primary: '#253ff6',
  primaryHover: '#1e35d4',
  primaryLight: 'rgba(37,63,246,0.08)',
  primaryLighter: 'rgba(37,63,246,0.06)',
  primaryBorder: 'rgba(37,63,246,0.15)',
  border: '#e4e4e4',
} as const;

// Business Logic Thresholds
// Single source of truth for margin health classification across the app
export const MARGIN_THRESHOLDS = {
  HEALTHY: 70,      // >= 70% is healthy for SaaS
  ACCEPTABLE: 50,   // >= 50% is acceptable
  MINIMUM: 0,       // < 50% is concerning
} as const;

// Helper function to get margin status based on thresholds
export function getMarginStatusFromThreshold(margin: number): 'great' | 'ok' | 'low' {
  if (margin >= MARGIN_THRESHOLDS.HEALTHY) return 'great';
  if (margin >= MARGIN_THRESHOLDS.ACCEPTABLE) return 'ok';
  return 'low';
}

// Helper function to get margin styling based on thresholds
export function getMarginStyleFromThreshold(margin: number): {
  dot: string;
  text: string;
  bg: string;
  label: string;
} {
  if (margin >= MARGIN_THRESHOLDS.HEALTHY) {
    return {
      dot: 'bg-teal-500',
      text: 'text-teal-700',
      bg: 'bg-teal-50',
      label: 'Healthy',
    };
  }
  if (margin >= MARGIN_THRESHOLDS.ACCEPTABLE) {
    return {
      dot: 'bg-amber-400',
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      label: 'Acceptable',
    };
  }
  return {
    dot: 'bg-rose-400',
    text: 'text-rose-600',
    bg: 'bg-rose-50',
    label: 'Review Needed',
  };
}

// Currency Configuration
// Supports multiple currencies with exchange rates relative to MYR
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Exchange rate relative to MYR (MYR = 1)
  position: 'before' | 'after'; // Symbol position
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}

export const CURRENCIES: Record<string, Currency> = {
  MYR: {
    code: 'MYR',
    symbol: 'RM',
    name: 'Malaysian Ringgit',
    rate: 1,
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rate: 0.22, // Approximate: 1 MYR = 0.22 USD
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    rate: 0.29, // Approximate: 1 MYR = 0.29 SGD
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  EUR: {
    code: 'EUR',
    symbol: '\u20AC',
    name: 'Euro',
    rate: 0.20, // Approximate: 1 MYR = 0.20 EUR
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  GBP: {
    code: 'GBP',
    symbol: '\u00A3',
    name: 'British Pound',
    rate: 0.17, // Approximate: 1 MYR = 0.17 GBP
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    rate: 0.33, // Approximate: 1 MYR = 0.33 AUD
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
export const DEFAULT_CURRENCY: CurrencyCode = 'MYR';

// Default tier prices (MYR)
export const DEFAULT_PRICES = {
  FREEMIUM: 0,
  BASIC: 25,
  PRO: 78,
  ENTERPRISE: 500,
} as const;

// Annual discount preset options
export const DISCOUNT_PRESETS = [10, 15, 17, 20, 25] as const;

// Unit costs (MYR)
export const UNIT_COSTS = {
  EXTRACTION: 0.30,
  LINE_ITEM: 0.006,
  EMAIL: 0.005,
  STORAGE_GB: 0.07,
} as const;

// Exchange rate (legacy - use CURRENCIES instead)
export const USD_TO_MYR = 4.47;

// Feature display limits
export const DEFAULT_VISIBLE_FEATURES = 6;
export const VISIBLE_FEATURE_OPTIONS = [4, 5, 6, 8] as const;

// Cost drivers
export {
  COST_DRIVERS,
  getCostDriver,
  getAllCostDriverIds,
  costDriverExists,
  type CostDriverConfig,
} from './costDrivers';
