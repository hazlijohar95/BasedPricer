/**
 * Custom hooks for pricing state management
 * Focused hooks provide ergonomic subsets of PricingContext
 */

// Debounce utilities
export { useDebouncedValue, useDebouncedCallback } from './useDebounce';

// Legacy editable costs hook
export {
  useEditableCosts,
  DEFAULT_UNIT_COSTS,
  DEFAULT_FIXED_COSTS,
  DEFAULT_EXCHANGE_RATE,
  type UnitCosts,
  type FixedCosts,
  type EditableCostsState,
} from './useEditableCosts';

// Focused context hooks - use these for components that only need specific functionality
export { useCosts, type UseCostsReturn } from './useCosts';
export { useTiers, type UseTiersReturn } from './useTiers';
export { useFeatures, type UseFeaturesReturn } from './useFeatures';
export { useToast, type UseToastReturn } from './useToast';

// Internal state management hooks - used by PricingContext
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

// Re-export the main context hook for components that need everything
export { usePricing } from '../context/PricingContext';
