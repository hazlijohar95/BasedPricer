import { defaultTiers } from '../../data/tiers';

export type BillingCycle = 'monthly' | 'annual';
export type EditTab = 'pricing' | 'appearance' | 'features';
export type CtaStyle = 'primary' | 'secondary' | 'outline';

export interface TierConfig {
  id: string;
  highlighted: boolean;
  highlightedFeatures: string[];
  ctaText: string;
  ctaStyle: CtaStyle;
  monthlyPrice: number;
  annualPrice: number;
  tagline: string;
  badgeText: string;
  showLimits: boolean;
  maxVisibleFeatures: number;
}

export function initializeTierConfigs(): Record<string, TierConfig> {
  const configs: Record<string, TierConfig> = {};
  defaultTiers.forEach(tier => {
    configs[tier.id] = {
      id: tier.id,
      highlighted: tier.id === 'basic',
      highlightedFeatures: [...tier.highlightFeatures],
      ctaText: tier.id === 'freemium' ? 'Get Started Free'
        : tier.id === 'basic' ? 'Start Free Trial'
        : tier.id === 'pro' ? 'Contact Sales'
        : 'Talk to Us',
      ctaStyle: tier.id === 'basic' ? 'primary' : tier.id === 'freemium' ? 'outline' : 'secondary',
      monthlyPrice: tier.monthlyPriceMYR || (tier.id === 'basic' ? 25 : tier.id === 'pro' ? 78 : 0),
      annualPrice: tier.annualPriceMYR || (tier.id === 'basic' ? 250 : tier.id === 'pro' ? 780 : 0),
      tagline: tier.tagline,
      badgeText: 'Most Popular',
      showLimits: true,
      maxVisibleFeatures: 6,
    };
  });
  return configs;
}
