/**
 * Cost Driver Mapping
 * Maps feature costDriver strings to cost calculation types
 *
 * This allows features to declare what type of cost they incur,
 * and the tier cost calculator can look up the actual rates.
 */

export interface CostDriverConfig {
  id: string;
  name: string;
  variableCostId?: string; // Maps to a variable cost item ID for dynamic rates
  defaultCostPerUnit: number; // Fallback if no variable cost is configured
  unit: string;
}

/**
 * Map of costDriver values used in features to their cost configurations
 */
export const COST_DRIVERS: Record<string, CostDriverConfig> = {
  // AI/ML costs
  mistral_vision: {
    id: 'mistral_vision',
    name: 'Mistral Vision API',
    variableCostId: 'mistral_vision',
    defaultCostPerUnit: 0.30, // MYR per extraction
    unit: 'extraction',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek API',
    variableCostId: 'deepseek',
    defaultCostPerUnit: 0.006, // MYR per call
    unit: 'call',
  },

  // Infrastructure costs
  storage: {
    id: 'storage',
    name: 'Cloud Storage',
    variableCostId: 'storage',
    defaultCostPerUnit: 0.07, // MYR per GB
    unit: 'GB',
  },

  // Communication costs
  email: {
    id: 'email',
    name: 'Email Delivery',
    variableCostId: 'email',
    defaultCostPerUnit: 0.005, // MYR per email
    unit: 'email',
  },

  // Payment processing
  chip_payment: {
    id: 'chip_payment',
    name: 'Chip Payment Gateway',
    variableCostId: 'chip_payment',
    defaultCostPerUnit: 0, // Usually percentage-based, handled separately
    unit: 'transaction',
  },

  // External API costs
  currency_api: {
    id: 'currency_api',
    name: 'Currency Exchange API',
    variableCostId: 'currency_api',
    defaultCostPerUnit: 0.001, // MYR per lookup
    unit: 'lookup',
  },
};

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
