// Re-export TierDisplayConfig from context for backwards compatibility
export { type TierDisplayConfig as TierConfig, type CtaStyle } from '../../context/PricingContext';

export type BillingCycle = 'monthly' | 'annual';
export type EditTab = 'pricing' | 'appearance' | 'features';
