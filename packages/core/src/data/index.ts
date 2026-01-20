/**
 * Core data and constants for BasedPricer
 * Single source of truth for thresholds, currencies, and pricing data
 */

import type {
  Currency,
  CurrencyCode,
  MarginThresholds,
  AIProvider,
  ProviderPricing,
  CostDriverConfig,
} from '../types';

// ============================================================================
// Margin Thresholds
// ============================================================================

/**
 * Industry-standard SaaS margin thresholds
 * Used consistently across all margin calculations
 */
export const MARGIN_THRESHOLDS: MarginThresholds = {
  HEALTHY: 70,      // >= 70% is healthy for SaaS
  ACCEPTABLE: 50,   // >= 50% is acceptable
  MINIMUM: 0,       // < 50% is concerning
} as const;

/**
 * Operating margin thresholds (different from gross margin)
 * Operating margin = (Revenue - COGS - Operating Expenses) / Revenue
 */
export const OPERATING_MARGIN_THRESHOLDS = {
  HEALTHY: 20,      // >= 20% is healthy
  ACCEPTABLE: 0,    // >= 0% is acceptable (not losing money)
} as const;

// ============================================================================
// Investor Metrics Thresholds
// ============================================================================

/**
 * SaaS valuation multiples based on ARR
 * Industry standard ranges for early-stage to growth SaaS
 */
export const VALUATION_MULTIPLES = {
  CONSERVATIVE: 5,  // 5x ARR - conservative/early stage
  TYPICAL: 10,      // 10x ARR - typical SaaS multiple
  HIGH_GROWTH: 15,  // 15x ARR - high growth premium
} as const;

/**
 * LTV:CAC ratio thresholds
 * Measures customer acquisition efficiency
 */
export const LTV_CAC_THRESHOLDS = {
  HEALTHY: 3,       // >= 3:1 is healthy (industry target: 3:1 to 5:1)
  ACCEPTABLE: 1,    // >= 1:1 is acceptable (breaking even on acquisition)
} as const;

/**
 * Payback period thresholds in months
 * How long to recover CAC from a customer
 */
export const PAYBACK_PERIOD_THRESHOLDS = {
  HEALTHY: 12,      // <= 12 months is healthy
  ACCEPTABLE: 24,   // <= 24 months is acceptable
} as const;

/**
 * Months per year constant for ARR calculations
 */
export const MONTHS_PER_YEAR = 12;

// ============================================================================
// AI Cost Estimation Constants
// ============================================================================

/**
 * Constants for AI token and cost estimation
 */
export const AI_ESTIMATION = {
  CHARS_PER_TOKEN: 4,           // Average characters per token
  TYPICAL_OUTPUT_TOKENS: 2500,  // Typical analysis output size
  MAX_OUTPUT_TOKENS: 4000,      // Maximum output token cap
  SYSTEM_PROMPT_OVERHEAD: 500,  // System prompt token overhead
  TOKENS_PER_FILE: 50,          // Additional tokens per file analyzed
} as const;

/**
 * Thresholds for determining analysis complexity
 */
export const ANALYSIS_COMPLEXITY_THRESHOLDS = {
  COMPLEX_FILE_COUNT: 30,       // File count for "complex" analysis
  COMPLEX_CHAR_COUNT: 100000,   // Character count for "complex" analysis
  MEDIUM_FILE_COUNT: 5,         // File count for "medium" analysis
  MEDIUM_CHAR_COUNT: 10000,     // Character count for "medium" analysis
} as const;

/**
 * Cost categorization thresholds in USD
 */
export const COST_CATEGORY_THRESHOLDS = {
  CHEAP: 0.05,      // < $0.05 is cheap
  MODERATE: 0.20,   // < $0.20 is moderate, >= is expensive
} as const;

/**
 * Formatting precision thresholds
 * Below these values, show 4 decimal places instead of 2
 */
export const FORMAT_PRECISION_THRESHOLDS = {
  USD: 0.01,        // Show 4 decimals below $0.01
  MYR: 0.1,         // Show 4 decimals below RM 0.1
} as const;

/**
 * Token display formatting thresholds
 */
export const TOKEN_FORMAT_THRESHOLDS = {
  MILLION: 1_000_000,
  THOUSAND: 1_000,
} as const;

// ============================================================================
// Currency Configuration
// ============================================================================

/**
 * Supported currencies with exchange rates relative to MYR
 */
export const CURRENCIES: Record<CurrencyCode, Currency> = {
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
    rate: 0.22,
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    rate: 0.29,
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  EUR: {
    code: 'EUR',
    symbol: '\u20AC',
    name: 'Euro',
    rate: 0.20,
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  GBP: {
    code: 'GBP',
    symbol: '\u00A3',
    name: 'British Pound',
    rate: 0.17,
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    rate: 0.33,
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
} as const;

export const DEFAULT_CURRENCY: CurrencyCode = 'MYR';

// ============================================================================
// Default Pricing
// ============================================================================

/**
 * Default tier prices in MYR
 */
export const DEFAULT_PRICES = {
  FREEMIUM: 0,
  BASIC: 25,
  PRO: 78,
  ENTERPRISE: 500,
} as const;

/**
 * Annual discount preset options (percentages)
 */
export const DISCOUNT_PRESETS = [10, 15, 17, 20, 25] as const;

/**
 * Default unit costs in MYR
 */
export const UNIT_COSTS = {
  EXTRACTION: 0.30,
  LINE_ITEM: 0.006,
  EMAIL: 0.005,
  STORAGE_GB: 0.07,
} as const;

/**
 * Default USD to MYR exchange rate
 */
export const DEFAULT_USD_TO_MYR_RATE = 4.47;

// ============================================================================
// AI Provider Pricing
// ============================================================================

/**
 * Current AI provider pricing data
 * Prices are in USD per million tokens
 */
export const AI_PRICING: Record<AIProvider, ProviderPricing> = {
  openai: {
    provider: 'openai',
    providerName: 'OpenAI',
    defaultModel: 'gpt-4o',
    models: {
      'gpt-4o': {
        name: 'gpt-4o',
        displayName: 'GPT-4o',
        inputPricePerMillion: 2.50,
        outputPricePerMillion: 10.00,
        lastUpdated: '2026-01-01',
        contextWindow: 128000,
      },
      'gpt-4o-mini': {
        name: 'gpt-4o-mini',
        displayName: 'GPT-4o Mini',
        inputPricePerMillion: 0.15,
        outputPricePerMillion: 0.60,
        lastUpdated: '2026-01-01',
        contextWindow: 128000,
      },
      'gpt-4-turbo': {
        name: 'gpt-4-turbo',
        displayName: 'GPT-4 Turbo',
        inputPricePerMillion: 10.00,
        outputPricePerMillion: 30.00,
        lastUpdated: '2026-01-01',
        contextWindow: 128000,
      },
    },
  },
  anthropic: {
    provider: 'anthropic',
    providerName: 'Anthropic',
    defaultModel: 'claude-sonnet-4-20250514',
    models: {
      'claude-sonnet-4-20250514': {
        name: 'claude-sonnet-4-20250514',
        displayName: 'Claude Sonnet 4',
        inputPricePerMillion: 3.00,
        outputPricePerMillion: 15.00,
        lastUpdated: '2026-01-01',
        contextWindow: 200000,
      },
      'claude-3-5-sonnet-20241022': {
        name: 'claude-3-5-sonnet-20241022',
        displayName: 'Claude 3.5 Sonnet',
        inputPricePerMillion: 3.00,
        outputPricePerMillion: 15.00,
        lastUpdated: '2026-01-01',
        contextWindow: 200000,
      },
      'claude-3-haiku-20240307': {
        name: 'claude-3-haiku-20240307',
        displayName: 'Claude 3 Haiku',
        inputPricePerMillion: 0.25,
        outputPricePerMillion: 1.25,
        lastUpdated: '2026-01-01',
        contextWindow: 200000,
      },
    },
  },
  openrouter: {
    provider: 'openrouter',
    providerName: 'OpenRouter',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    models: {
      'anthropic/claude-3.5-sonnet': {
        name: 'anthropic/claude-3.5-sonnet',
        displayName: 'Claude 3.5 Sonnet (via OpenRouter)',
        inputPricePerMillion: 3.00,
        outputPricePerMillion: 15.00,
        lastUpdated: '2026-01-01',
        contextWindow: 200000,
        notes: 'OpenRouter adds small markup',
      },
      'openai/gpt-4o': {
        name: 'openai/gpt-4o',
        displayName: 'GPT-4o (via OpenRouter)',
        inputPricePerMillion: 2.50,
        outputPricePerMillion: 10.00,
        lastUpdated: '2026-01-01',
        contextWindow: 128000,
        notes: 'OpenRouter adds small markup',
      },
    },
  },
  minimax: {
    provider: 'minimax',
    providerName: 'MiniMax',
    defaultModel: 'MiniMax-M2.1',
    models: {
      'MiniMax-M2.1': {
        name: 'MiniMax-M2.1',
        displayName: 'MiniMax M2.1',
        inputPricePerMillion: 0.12,
        outputPricePerMillion: 0.60,
        lastUpdated: '2026-01-01',
        contextWindow: 200000,
        notes: 'Excellent for coding tasks',
      },
      'MiniMax-M1': {
        name: 'MiniMax-M1',
        displayName: 'MiniMax M1',
        inputPricePerMillion: 0.40,
        outputPricePerMillion: 2.20,
        lastUpdated: '2026-01-01',
        contextWindow: 1000000,
        notes: 'Reasoning model with 1M context',
      },
    },
  },
  glm: {
    provider: 'glm',
    providerName: 'GLM (Zhipu)',
    defaultModel: 'glm-4.7',
    models: {
      'glm-4.7': {
        name: 'glm-4.7',
        displayName: 'GLM-4.7',
        inputPricePerMillion: 0.60,
        outputPricePerMillion: 2.20,
        lastUpdated: '2026-01-01',
        contextWindow: 200000,
        notes: 'Competitive with frontier models',
      },
      'glm-4.5-flash': {
        name: 'glm-4.5-flash',
        displayName: 'GLM-4.5 Flash',
        inputPricePerMillion: 0.00,
        outputPricePerMillion: 0.00,
        lastUpdated: '2026-01-01',
        contextWindow: 131000,
        notes: 'Free tier available',
      },
    },
  },
  groq: {
    provider: 'groq',
    providerName: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    models: {
      'llama-3.3-70b-versatile': {
        name: 'llama-3.3-70b-versatile',
        displayName: 'Llama 3.3 70B',
        inputPricePerMillion: 0.59,
        outputPricePerMillion: 0.79,
        lastUpdated: '2026-01-01',
        contextWindow: 128000,
        notes: 'Fast inference with Groq LPU',
      },
      'mixtral-8x7b-32768': {
        name: 'mixtral-8x7b-32768',
        displayName: 'Mixtral 8x7B',
        inputPricePerMillion: 0.24,
        outputPricePerMillion: 0.24,
        lastUpdated: '2026-01-01',
        contextWindow: 32768,
      },
    },
  },
};

// ============================================================================
// Cost Drivers
// ============================================================================

/**
 * Map of cost driver IDs to their configurations
 */
export const COST_DRIVERS: Record<string, CostDriverConfig> = {
  mistral_vision: {
    id: 'mistral_vision',
    name: 'Mistral Vision API',
    variableCostId: 'mistral_vision',
    defaultCostPerUnit: 0.30,
    unit: 'extraction',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek API',
    variableCostId: 'deepseek',
    defaultCostPerUnit: 0.006,
    unit: 'call',
  },
  storage: {
    id: 'storage',
    name: 'Cloud Storage',
    variableCostId: 'storage',
    defaultCostPerUnit: 0.07,
    unit: 'GB',
  },
  email: {
    id: 'email',
    name: 'Email Delivery',
    variableCostId: 'email',
    defaultCostPerUnit: 0.005,
    unit: 'email',
  },
  chip_payment: {
    id: 'chip_payment',
    name: 'Chip Payment Gateway',
    variableCostId: 'chip_payment',
    defaultCostPerUnit: 0,
    unit: 'transaction',
  },
  currency_api: {
    id: 'currency_api',
    name: 'Currency Exchange API',
    variableCostId: 'currency_api',
    defaultCostPerUnit: 0.001,
    unit: 'lookup',
  },
  openai_api: {
    id: 'openai_api',
    name: 'OpenAI API',
    variableCostId: 'openai_api',
    defaultCostPerUnit: 0.03,
    unit: '1K tokens',
  },
  anthropic_api: {
    id: 'anthropic_api',
    name: 'Anthropic API',
    variableCostId: 'anthropic_api',
    defaultCostPerUnit: 0.03,
    unit: '1K tokens',
  },
  database: {
    id: 'database',
    name: 'Database Operations',
    variableCostId: 'database',
    defaultCostPerUnit: 0.001,
    unit: 'query',
  },
  compute: {
    id: 'compute',
    name: 'Compute Resources',
    variableCostId: 'compute',
    defaultCostPerUnit: 0.01,
    unit: 'minute',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get cost driver configuration by ID
 */
export function getCostDriver(costDriverId: string): CostDriverConfig | undefined {
  return COST_DRIVERS[costDriverId];
}

/**
 * Get all cost driver IDs
 */
export function getAllCostDriverIds(): string[] {
  return Object.keys(COST_DRIVERS);
}

/**
 * Check if a cost driver exists
 */
export function costDriverExists(costDriverId: string): boolean {
  return costDriverId in COST_DRIVERS;
}

/**
 * Get currency by code
 */
export function getCurrency(code: CurrencyCode): Currency {
  return CURRENCIES[code];
}

/**
 * Get AI pricing for a provider
 */
export function getAIPricing(provider: AIProvider): ProviderPricing {
  return AI_PRICING[provider];
}

/**
 * Get pricing for a specific model
 */
export function getPricingForModel(provider: AIProvider, modelId?: string) {
  const providerPricing = AI_PRICING[provider];
  if (!providerPricing) return null;

  const model = modelId ?? providerPricing.defaultModel;
  return providerPricing.models[model] ?? null;
}

/**
 * Get all available AI models
 */
export function getAllAIModels() {
  const models: Array<{ provider: AIProvider } & import('../types').AIModelPricing> = [];

  for (const [provider, pricing] of Object.entries(AI_PRICING)) {
    for (const model of Object.values(pricing.models)) {
      models.push({ ...model, provider: provider as AIProvider });
    }
  }

  return models;
}
