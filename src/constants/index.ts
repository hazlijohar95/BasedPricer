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
export const MARGIN_THRESHOLDS = {
  HEALTHY: 65,
  ACCEPTABLE: 50,
  MINIMUM: 0,
} as const;

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

// Exchange rate
export const USD_TO_MYR = 4.47;

// Feature display limits
export const DEFAULT_VISIBLE_FEATURES = 6;
export const VISIBLE_FEATURE_OPTIONS = [4, 5, 6, 8] as const;
