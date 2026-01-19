/**
 * Input Validation Utilities
 * Reusable validation functions for form inputs
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export type ValidatorFn = (value: unknown) => ValidationResult;

// ============================================================================
// Number Validators
// ============================================================================

/**
 * Validate that a number is non-negative
 */
export function validateNonNegative(value: number): ValidationResult {
  if (value < 0) {
    return { isValid: false, error: 'Value cannot be negative' };
  }
  return { isValid: true };
}

/**
 * Validate that a number is positive (greater than 0)
 */
export function validatePositive(value: number): ValidationResult {
  if (value <= 0) {
    return { isValid: false, error: 'Value must be greater than 0' };
  }
  return { isValid: true };
}

/**
 * Validate that a number is within a range
 */
export function validateRange(value: number, min: number, max: number): ValidationResult {
  if (value < min || value > max) {
    return { isValid: false, error: `Value must be between ${min} and ${max}` };
  }
  return { isValid: true };
}

/**
 * Validate that a number is a valid percentage (0-100)
 */
export function validatePercentage(value: number): ValidationResult {
  return validateRange(value, 0, 100);
}

/**
 * Validate that a number is a valid price
 */
export function validatePrice(value: number): ValidationResult {
  if (value < 0) {
    return { isValid: false, error: 'Price cannot be negative' };
  }
  if (value > 1000000) {
    return { isValid: false, error: 'Price seems unrealistically high' };
  }
  return { isValid: true };
}

// ============================================================================
// String Validators
// ============================================================================

/**
 * Validate that a string is not empty
 */
export function validateRequired(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: false, error: 'This field is required' };
  }
  return { isValid: true };
}

/**
 * Validate string length
 */
export function validateLength(value: string, min: number, max: number): ValidationResult {
  const length = value.length;
  if (length < min) {
    return { isValid: false, error: `Must be at least ${min} characters` };
  }
  if (length > max) {
    return { isValid: false, error: `Must be at most ${max} characters` };
  }
  return { isValid: true };
}

/**
 * Validate that a string is a valid identifier (alphanumeric + underscore)
 */
export function validateIdentifier(value: string): ValidationResult {
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
    return { isValid: false, error: 'Must start with a letter and contain only letters, numbers, and underscores' };
  }
  return { isValid: true };
}

// ============================================================================
// Business Logic Validators
// ============================================================================

/**
 * Validate customer count (reasonable range)
 */
export function validateCustomerCount(value: number): ValidationResult {
  if (value < 0) {
    return { isValid: false, error: 'Customer count cannot be negative' };
  }
  if (value < 10) {
    return { isValid: false, error: 'Customer count is very low - consider a larger sample' };
  }
  if (value > 100000) {
    return { isValid: false, error: 'Customer count seems unrealistically high' };
  }
  return { isValid: true };
}

/**
 * Validate tier price (warning for unrealistic values)
 */
export function validateTierPrice(value: number, tierName?: string): ValidationResult {
  if (value < 0) {
    return { isValid: false, error: 'Price cannot be negative' };
  }
  if (value > 10000) {
    return {
      isValid: true, // Valid but with warning
      error: `${tierName || 'This tier'} price is very high - ensure this is intentional`,
    };
  }
  return { isValid: true };
}

/**
 * Validate cost per unit (reasonable range)
 */
export function validateCostPerUnit(value: number): ValidationResult {
  if (value < 0) {
    return { isValid: false, error: 'Cost cannot be negative' };
  }
  if (value > 1000) {
    return {
      isValid: true,
      error: 'Cost per unit is very high - ensure this is correct',
    };
  }
  return { isValid: true };
}

/**
 * Validate utilization rate (0-1 or 0-100%)
 */
export function validateUtilizationRate(value: number): ValidationResult {
  // Handle both 0-1 and 0-100 formats
  const normalizedValue = value > 1 ? value / 100 : value;

  if (normalizedValue < 0) {
    return { isValid: false, error: 'Utilization rate cannot be negative' };
  }
  if (normalizedValue > 1) {
    return { isValid: false, error: 'Utilization rate cannot exceed 100%' };
  }
  return { isValid: true };
}

// ============================================================================
// Composite Validators
// ============================================================================

/**
 * Create a validator that chains multiple validators
 */
export function chainValidators(...validators: ValidatorFn[]): ValidatorFn {
  return (value: unknown) => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  };
}

/**
 * Create a validator with a custom error message
 */
export function withCustomMessage(validator: ValidatorFn, message: string): ValidatorFn {
  return (value: unknown) => {
    const result = validator(value);
    if (!result.isValid) {
      return { isValid: false, error: message };
    }
    return result;
  };
}

// ============================================================================
// Tier Validation
// ============================================================================

export interface TierPriceInfo {
  id: string;
  name: string;
  price: number;
}

/**
 * Validate that tier prices are in ascending order
 * Returns a list of tiers that violate the ascending order rule
 */
export function validateTierPriceOrder(tiers: TierPriceInfo[]): {
  isValid: boolean;
  violations: Array<{ tier: TierPriceInfo; previousTier: TierPriceInfo }>;
} {
  // Filter out freemium/free tiers and sort by expected order
  const paidTiers = tiers.filter(t => t.price > 0);

  if (paidTiers.length <= 1) {
    return { isValid: true, violations: [] };
  }

  // Sort by index position (assuming tiers array is in intended order)
  const violations: Array<{ tier: TierPriceInfo; previousTier: TierPriceInfo }> = [];

  for (let i = 1; i < paidTiers.length; i++) {
    const currentTier = paidTiers[i];
    const previousTier = paidTiers[i - 1];

    // Price should be higher than previous tier
    if (currentTier.price < previousTier.price) {
      violations.push({ tier: currentTier, previousTier });
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Get a human-readable message for tier price violations
 */
export function getTierPriceViolationMessage(
  violations: Array<{ tier: TierPriceInfo; previousTier: TierPriceInfo }>
): string {
  if (violations.length === 0) return '';

  const messages = violations.map(({ tier, previousTier }) =>
    `${tier.name} (${tier.price}) is cheaper than ${previousTier.name} (${previousTier.price})`
  );

  return messages.join('; ');
}
