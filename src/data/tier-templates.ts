/**
 * Tier Templates
 * Pre-configured tier structures for different business types
 */

import { type BusinessType } from './business-types';
import type { Tier, TierLimit } from './tiers';

export interface TierTemplate {
  name: string;
  suggestedPriceUSD: number;
  suggestedPriceMYR: number;
  tagline: string;
  targetAudience: string;
  keyFeatures: string[];
  keyLimits: Record<string, number | 'unlimited'>;
  status: 'active' | 'coming_soon' | 'internal';
  isPopular?: boolean;
}

export interface TierTemplateSet {
  businessType: BusinessType;
  tiers: TierTemplate[];
  notes: string;
}

/**
 * Tier templates for each business type
 */
export const TIER_TEMPLATES: Record<BusinessType, TierTemplateSet> = {
  api_service: {
    businessType: 'api_service',
    notes: 'API services use usage-based pricing with tiered rate limits',
    tiers: [
      {
        name: 'Free',
        suggestedPriceUSD: 0,
        suggestedPriceMYR: 0,
        tagline: 'Get started for free',
        targetAudience: 'Developers testing and prototyping',
        keyFeatures: ['Basic API access', 'Community support', 'Public documentation'],
        keyLimits: { 'API calls/month': 1000, 'Rate limit (req/s)': 10 },
        status: 'active',
      },
      {
        name: 'Developer',
        suggestedPriceUSD: 29,
        suggestedPriceMYR: 129,
        tagline: 'For production apps',
        targetAudience: 'Individual developers and small projects',
        keyFeatures: ['Higher rate limits', 'Email support', 'Basic analytics'],
        keyLimits: { 'API calls/month': 50000, 'Rate limit (req/s)': 50 },
        status: 'active',
        isPopular: true,
      },
      {
        name: 'Business',
        suggestedPriceUSD: 99,
        suggestedPriceMYR: 449,
        tagline: 'For growing businesses',
        targetAudience: 'Growing businesses and teams',
        keyFeatures: ['Premium endpoints', 'Priority support', 'Advanced analytics', 'SLA 99.9%'],
        keyLimits: { 'API calls/month': 500000, 'Rate limit (req/s)': 100 },
        status: 'active',
      },
    ],
  },

  marketplace: {
    businessType: 'marketplace',
    notes: 'Marketplaces use take-rate pricing based on transaction value',
    tiers: [
      {
        name: 'Starter',
        suggestedPriceUSD: 0,
        suggestedPriceMYR: 0,
        tagline: 'Start selling today',
        targetAudience: 'New sellers testing the platform',
        keyFeatures: ['Basic listings', 'Standard support', 'Basic analytics'],
        keyLimits: { 'Active listings': 10, 'Commission rate': 15 },
        status: 'active',
      },
      {
        name: 'Professional',
        suggestedPriceUSD: 29,
        suggestedPriceMYR: 129,
        tagline: 'Grow your business',
        targetAudience: 'Active sellers looking to scale',
        keyFeatures: ['Unlimited listings', 'Lower commission', 'Promoted listings', 'Priority support'],
        keyLimits: { 'Active listings': 'unlimited', 'Commission rate': 10 },
        status: 'active',
        isPopular: true,
      },
      {
        name: 'Enterprise',
        suggestedPriceUSD: 199,
        suggestedPriceMYR: 889,
        tagline: 'For high-volume sellers',
        targetAudience: 'Large sellers and established businesses',
        keyFeatures: ['Custom commission', 'API access', 'Dedicated support', 'Custom analytics'],
        keyLimits: { 'Active listings': 'unlimited', 'Commission rate': 5 },
        status: 'active',
      },
    ],
  },

  fintech: {
    businessType: 'fintech',
    notes: 'Fintech products rarely offer free tiers due to compliance costs',
    tiers: [
      {
        name: 'Starter',
        suggestedPriceUSD: 49,
        suggestedPriceMYR: 219,
        tagline: 'Essential financial tools',
        targetAudience: 'Small businesses and individuals',
        keyFeatures: ['Basic account management', 'Standard transfers', 'Email support'],
        keyLimits: { 'Accounts': 1, 'Transactions/month': 100 },
        status: 'active',
      },
      {
        name: 'Business',
        suggestedPriceUSD: 149,
        suggestedPriceMYR: 669,
        tagline: 'For growing businesses',
        targetAudience: 'Growing businesses with multiple accounts',
        keyFeatures: ['Multi-account', 'Advanced reporting', 'Priority support', 'API access'],
        keyLimits: { 'Accounts': 10, 'Transactions/month': 1000 },
        status: 'active',
        isPopular: true,
      },
      {
        name: 'Enterprise',
        suggestedPriceUSD: 499,
        suggestedPriceMYR: 2249,
        tagline: 'Enterprise-grade financial platform',
        targetAudience: 'Large organizations with compliance needs',
        keyFeatures: ['Unlimited accounts', 'Custom compliance', 'Dedicated support', 'Custom integrations'],
        keyLimits: { 'Accounts': 'unlimited', 'Transactions/month': 'unlimited' },
        status: 'active',
      },
    ],
  },

  ai_ml_saas: {
    businessType: 'ai_ml_saas',
    notes: 'AI products use credit/token-based pricing with model access tiers',
    tiers: [
      {
        name: 'Free',
        suggestedPriceUSD: 0,
        suggestedPriceMYR: 0,
        tagline: 'Try AI for free',
        targetAudience: 'Individuals exploring AI capabilities',
        keyFeatures: ['Basic models', 'Limited credits', 'Community support'],
        keyLimits: { 'Credits/month': 100, 'Models': 1 },
        status: 'active',
      },
      {
        name: 'Pro',
        suggestedPriceUSD: 29,
        suggestedPriceMYR: 129,
        tagline: 'For power users',
        targetAudience: 'Professionals using AI regularly',
        keyFeatures: ['All standard models', 'More credits', 'Priority processing', 'Email support'],
        keyLimits: { 'Credits/month': 1000, 'Models': 3 },
        status: 'active',
        isPopular: true,
      },
      {
        name: 'Team',
        suggestedPriceUSD: 99,
        suggestedPriceMYR: 449,
        tagline: 'AI for your team',
        targetAudience: 'Teams building with AI',
        keyFeatures: ['All models including premium', 'Team collaboration', 'API access', 'Priority support'],
        keyLimits: { 'Credits/month': 5000, 'Models': 'unlimited', 'Team members': 5 },
        status: 'active',
      },
      {
        name: 'Enterprise',
        suggestedPriceUSD: 499,
        suggestedPriceMYR: 2249,
        tagline: 'Custom AI solutions',
        targetAudience: 'Organizations with high-volume AI needs',
        keyFeatures: ['Custom models', 'Fine-tuning', 'Dedicated infrastructure', 'SLA'],
        keyLimits: { 'Credits/month': 'unlimited', 'Models': 'unlimited', 'Team members': 'unlimited' },
        status: 'active',
      },
    ],
  },

  developer_tools: {
    businessType: 'developer_tools',
    notes: 'Developer tools use seat-based pricing with project/build limits',
    tiers: [
      {
        name: 'Free',
        suggestedPriceUSD: 0,
        suggestedPriceMYR: 0,
        tagline: 'For individual developers',
        targetAudience: 'Solo developers and open source',
        keyFeatures: ['Unlimited public projects', 'Basic features', 'Community support'],
        keyLimits: { 'Users': 1, 'Private projects': 1, 'Builds/month': 100 },
        status: 'active',
      },
      {
        name: 'Pro',
        suggestedPriceUSD: 19,
        suggestedPriceMYR: 85,
        tagline: 'For professional developers',
        targetAudience: 'Professional developers and freelancers',
        keyFeatures: ['Unlimited private projects', 'Advanced features', 'Email support'],
        keyLimits: { 'Users': 1, 'Private projects': 'unlimited', 'Builds/month': 1000 },
        status: 'active',
      },
      {
        name: 'Team',
        suggestedPriceUSD: 49,
        suggestedPriceMYR: 219,
        tagline: 'For small teams',
        targetAudience: 'Small development teams',
        keyFeatures: ['Team collaboration', 'Shared projects', 'Priority support'],
        keyLimits: { 'Users': 5, 'Private projects': 'unlimited', 'Builds/month': 5000 },
        status: 'active',
        isPopular: true,
      },
      {
        name: 'Enterprise',
        suggestedPriceUSD: 199,
        suggestedPriceMYR: 889,
        tagline: 'For large organizations',
        targetAudience: 'Large teams and organizations',
        keyFeatures: ['SSO/SAML', 'Advanced security', 'Dedicated support', 'Custom integrations'],
        keyLimits: { 'Users': 'unlimited', 'Private projects': 'unlimited', 'Builds/month': 'unlimited' },
        status: 'active',
      },
    ],
  },

  b2b_saas: {
    businessType: 'b2b_saas',
    notes: 'B2B SaaS uses feature-tiered pricing with enterprise options',
    tiers: [
      {
        name: 'Starter',
        suggestedPriceUSD: 0,
        suggestedPriceMYR: 0,
        tagline: 'Get started for free',
        targetAudience: 'Small teams trying the product',
        keyFeatures: ['Core features', 'Basic support', 'Limited users'],
        keyLimits: { 'Users': 3, 'Storage (GB)': 5 },
        status: 'active',
      },
      {
        name: 'Professional',
        suggestedPriceUSD: 49,
        suggestedPriceMYR: 219,
        tagline: 'For growing teams',
        targetAudience: 'Growing teams needing more features',
        keyFeatures: ['All core features', 'Integrations', 'Priority support'],
        keyLimits: { 'Users': 10, 'Storage (GB)': 50 },
        status: 'active',
        isPopular: true,
      },
      {
        name: 'Business',
        suggestedPriceUSD: 149,
        suggestedPriceMYR: 669,
        tagline: 'For established businesses',
        targetAudience: 'Larger teams with advanced needs',
        keyFeatures: ['Advanced features', 'Admin controls', 'Analytics', 'API access'],
        keyLimits: { 'Users': 50, 'Storage (GB)': 250 },
        status: 'active',
      },
      {
        name: 'Enterprise',
        suggestedPriceUSD: 499,
        suggestedPriceMYR: 2249,
        tagline: 'Custom enterprise solution',
        targetAudience: 'Large organizations',
        keyFeatures: ['SSO/SAML', 'Dedicated support', 'Custom features', 'SLA'],
        keyLimits: { 'Users': 'unlimited', 'Storage (GB)': 'unlimited' },
        status: 'active',
      },
    ],
  },

  consumer_saas: {
    businessType: 'consumer_saas',
    notes: 'Consumer apps use freemium with premium upgrades',
    tiers: [
      {
        name: 'Free',
        suggestedPriceUSD: 0,
        suggestedPriceMYR: 0,
        tagline: 'Free forever',
        targetAudience: 'Casual users',
        keyFeatures: ['Core features', 'Ads supported', 'Basic support'],
        keyLimits: { 'Usage/month': 100 },
        status: 'active',
      },
      {
        name: 'Premium',
        suggestedPriceUSD: 9,
        suggestedPriceMYR: 39,
        tagline: 'Unlock full potential',
        targetAudience: 'Regular users wanting more',
        keyFeatures: ['All features', 'No ads', 'Priority support', 'Exclusive content'],
        keyLimits: { 'Usage/month': 'unlimited' },
        status: 'active',
        isPopular: true,
      },
      {
        name: 'Family',
        suggestedPriceUSD: 19,
        suggestedPriceMYR: 85,
        tagline: 'Share with family',
        targetAudience: 'Families and households',
        keyFeatures: ['All Premium features', 'Up to 6 accounts', 'Family sharing'],
        keyLimits: { 'Usage/month': 'unlimited', 'Accounts': 6 },
        status: 'active',
      },
    ],
  },

  generic: {
    businessType: 'generic',
    notes: 'Standard feature-tiered pricing template',
    tiers: [
      {
        name: 'Free',
        suggestedPriceUSD: 0,
        suggestedPriceMYR: 0,
        tagline: 'Get started',
        targetAudience: 'Individuals and small projects',
        keyFeatures: ['Basic features', 'Community support'],
        keyLimits: { 'Users': 1 },
        status: 'active',
      },
      {
        name: 'Pro',
        suggestedPriceUSD: 29,
        suggestedPriceMYR: 129,
        tagline: 'For professionals',
        targetAudience: 'Professionals and power users',
        keyFeatures: ['All features', 'Email support', 'Advanced options'],
        keyLimits: { 'Users': 5 },
        status: 'active',
        isPopular: true,
      },
      {
        name: 'Team',
        suggestedPriceUSD: 99,
        suggestedPriceMYR: 449,
        tagline: 'For teams',
        targetAudience: 'Teams and organizations',
        keyFeatures: ['Team features', 'Priority support', 'Admin controls'],
        keyLimits: { 'Users': 25 },
        status: 'active',
      },
      {
        name: 'Enterprise',
        suggestedPriceUSD: 299,
        suggestedPriceMYR: 1339,
        tagline: 'For enterprises',
        targetAudience: 'Large organizations',
        keyFeatures: ['Custom solutions', 'Dedicated support', 'SSO'],
        keyLimits: { 'Users': 'unlimited' },
        status: 'active',
      },
    ],
  },
};

/**
 * Get tier templates for a business type
 */
export function getTierTemplatesForBusinessType(businessType: BusinessType): TierTemplateSet {
  return TIER_TEMPLATES[businessType] ?? TIER_TEMPLATES.generic;
}

/**
 * Convert tier templates to Tier format for use in the app
 */
export function convertTemplatesToTiers(
  templates: TierTemplate[],
  businessType: BusinessType
): Tier[] {
  return templates.map((template, index) => ({
    id: `${businessType}-${template.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: template.name,
    tagline: template.tagline,
    targetAudience: template.targetAudience,
    monthlyPriceMYR: template.suggestedPriceMYR,
    annualPriceMYR: Math.round(template.suggestedPriceMYR * 10), // ~17% annual discount
    status: template.status,
    limits: Object.entries(template.keyLimits).map(([featureId, limit]) => ({
      featureId: featureId.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      limit: limit === 'unlimited' ? 'unlimited' : limit,
      unit: featureId,
    })),
    includedFeatures: template.keyFeatures,
    excludedFeatures: [],
    highlightFeatures: template.keyFeatures.slice(0, 3), // First 3 features as highlights
  }));
}

/**
 * Get recommended tier count for a business type
 */
export function getRecommendedTierCount(businessType: BusinessType): number {
  return TIER_TEMPLATES[businessType]?.tiers.length ?? 4;
}

/**
 * Get tier with isPopular flag
 */
export function getPopularTierIndex(businessType: BusinessType): number {
  const templates = TIER_TEMPLATES[businessType]?.tiers ?? [];
  const index = templates.findIndex(t => t.isPopular);
  // findIndex returns -1 when not found, so use proper check
  return index >= 0 ? index : 1;
}
