/**
 * Custom hooks for pricing state management
 * Focused hooks provide ergonomic subsets of PricingContext
 *
 * PUBLIC API:
 * - usePricing: Main context hook for components that need everything
 * - useCosts, useTiers, useFeatures, useToast: Focused hooks for specific needs
 * - useCostCalculations: Cost calculations hook
 * - useEscapeKey, useFocusTrap: Accessibility hooks
 * - useDebouncedValue, useDebouncedCallback: Debounce utilities
 *
 * INTERNAL (exported for testing only):
 * - useCostsState, useTiersState, useFeaturesState, useBusinessTypeState
 *
 * LEGACY (deprecated but kept for compatibility):
 * - useEditableCosts
 */

// ============================================================================
// Public Hooks
// ============================================================================

// Re-export the main context hook for components that need everything
export { usePricing } from '../context/PricingContext';

// Focused context hooks - use these for components that only need specific functionality
export { useCosts, type UseCostsReturn } from './useCosts';
export { useTiers, type UseTiersReturn } from './useTiers';
export { useFeatures, type UseFeaturesReturn } from './useFeatures';
export { useToast, type UseToastReturn } from './useToast';

// Consolidated cost calculations - single source of truth for cost data
export {
  useCostCalculations,
  type CostCalculationsResult,
  type TierCostData,
} from './useCostCalculations';

// Debounce utilities
export { useDebouncedValue, useDebouncedCallback } from './useDebounce';

// Keyboard and accessibility hooks
export { useEscapeKey } from './useEscapeKey';
export { useFocusTrap } from './useFocusTrap';
export { useUndoRedo } from './useUndoRedo';

// ============================================================================
// Internal Hooks (exported for testing)
// ============================================================================

export {
  useCostsState,
  type CostsStateValue,
  type CostsStateInitialValues,
} from './useCostsState';
export {
  useTiersState,
  createDefaultTierDisplayConfig,
  createTierDisplayConfigsFromTiers,
  type TiersStateValue,
  type TiersStateInitialValues,
  type TierDisplayConfig,
  type CtaStyle,
} from './useTiersState';
export {
  useFeaturesState,
  type FeaturesStateValue,
  type FeaturesStateInitialValues,
} from './useFeaturesState';
export {
  useBusinessTypeState,
  type BusinessTypeStateValue,
  type BusinessTypeStateInitialValues,
} from './useBusinessTypeState';

// ============================================================================
// Legacy Hooks (deprecated, kept for compatibility)
// ============================================================================

/**
 * @deprecated Use useCosts from PricingContext instead
 */
export {
  useEditableCosts,
  DEFAULT_UNIT_COSTS,
  DEFAULT_FIXED_COSTS,
  DEFAULT_EXCHANGE_RATE,
  type UnitCosts,
  type FixedCosts,
  type EditableCostsState,
} from './useEditableCosts';
