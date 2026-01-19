/**
 * Tests for tier-related Zod schemas
 */

import { describe, it, expect } from 'vitest';
import {
  TierLimitSchema,
  TierSchema,
  TierDisplayConfigSchema,
  validateTier,
  validateTiers,
  validateTierDisplayConfig,
} from './tiers';

describe('TierLimitSchema', () => {
  it('validates numeric limit', () => {
    const limit = { featureId: 'feature-1', limit: 100, unit: 'items/month' };
    expect(() => TierLimitSchema.parse(limit)).not.toThrow();
  });

  it('validates unlimited string', () => {
    const limit = { featureId: 'feature-1', limit: 'unlimited' };
    expect(() => TierLimitSchema.parse(limit)).not.toThrow();
  });

  it('validates boolean limit', () => {
    const limit = { featureId: 'feature-1', limit: true };
    expect(() => TierLimitSchema.parse(limit)).not.toThrow();
  });

  it('requires non-empty featureId', () => {
    const invalid = { featureId: '', limit: 100 };
    expect(() => TierLimitSchema.parse(invalid)).toThrow();
  });

  it('unit is optional', () => {
    const limit = { featureId: 'feature-1', limit: 100 };
    expect(() => TierLimitSchema.parse(limit)).not.toThrow();
  });
});

describe('TierSchema', () => {
  const validTier = {
    id: 'basic',
    name: 'Basic',
    tagline: 'Perfect for small teams',
    monthlyPriceMYR: 25,
    annualPriceMYR: 250,
    annualDiscount: 17,
    status: 'active' as const,
    targetAudience: 'Small businesses',
    limits: [],
    includedFeatures: ['feature-1', 'feature-2'],
    excludedFeatures: ['feature-3'],
    highlightFeatures: ['feature-1'],
  };

  it('validates correct structure', () => {
    expect(() => TierSchema.parse(validTier)).not.toThrow();
  });

  it('requires non-empty id', () => {
    const invalid = { ...validTier, id: '' };
    expect(() => TierSchema.parse(invalid)).toThrow();
  });

  it('requires non-empty name', () => {
    const invalid = { ...validTier, name: '' };
    expect(() => TierSchema.parse(invalid)).toThrow();
  });

  it('rejects negative monthly price', () => {
    const invalid = { ...validTier, monthlyPriceMYR: -10 };
    expect(() => TierSchema.parse(invalid)).toThrow();
  });

  it('rejects negative annual price', () => {
    const invalid = { ...validTier, annualPriceMYR: -10 };
    expect(() => TierSchema.parse(invalid)).toThrow();
  });

  it('rejects discount below 0', () => {
    const invalid = { ...validTier, annualDiscount: -5 };
    expect(() => TierSchema.parse(invalid)).toThrow();
  });

  it('rejects discount above 100', () => {
    const invalid = { ...validTier, annualDiscount: 150 };
    expect(() => TierSchema.parse(invalid)).toThrow();
  });

  it('accepts all valid statuses', () => {
    const statuses = ['active', 'coming_soon', 'internal'] as const;
    statuses.forEach((status) => {
      const tier = { ...validTier, status };
      expect(() => TierSchema.parse(tier)).not.toThrow();
    });
  });

  it('rejects invalid status', () => {
    const invalid = { ...validTier, status: 'deprecated' };
    expect(() => TierSchema.parse(invalid)).toThrow();
  });

  it('allows zero monthly price (free tier)', () => {
    const freeTier = { ...validTier, monthlyPriceMYR: 0 };
    expect(() => TierSchema.parse(freeTier)).not.toThrow();
  });

  it('validates limits array', () => {
    const tierWithLimits = {
      ...validTier,
      limits: [
        { featureId: 'feature-1', limit: 100, unit: 'items' },
        { featureId: 'feature-2', limit: 'unlimited' },
      ],
    };
    expect(() => TierSchema.parse(tierWithLimits)).not.toThrow();
  });
});

describe('TierDisplayConfigSchema', () => {
  const validConfig = {
    highlighted: true,
    highlightedFeatures: ['feature-1', 'feature-2'],
    ctaText: 'Get Started',
    ctaStyle: 'primary' as const,
    badgeText: 'Most Popular',
    showLimits: true,
    maxVisibleFeatures: 6,
    monthlyPrice: 25,
    annualPrice: 250,
    tagline: 'For small teams',
  };

  it('validates correct structure', () => {
    expect(() => TierDisplayConfigSchema.parse(validConfig)).not.toThrow();
  });

  it('accepts all valid CTA styles', () => {
    const styles = ['primary', 'secondary', 'outline'] as const;
    styles.forEach((ctaStyle) => {
      const config = { ...validConfig, ctaStyle };
      expect(() => TierDisplayConfigSchema.parse(config)).not.toThrow();
    });
  });

  it('rejects invalid CTA style', () => {
    const invalid = { ...validConfig, ctaStyle: 'warning' };
    expect(() => TierDisplayConfigSchema.parse(invalid)).toThrow();
  });

  it('requires positive maxVisibleFeatures', () => {
    const invalid = { ...validConfig, maxVisibleFeatures: 0 };
    expect(() => TierDisplayConfigSchema.parse(invalid)).toThrow();
  });

  it('rejects negative price', () => {
    const invalid = { ...validConfig, monthlyPrice: -10 };
    expect(() => TierDisplayConfigSchema.parse(invalid)).toThrow();
  });
});

describe('validateTier', () => {
  it('returns success for valid tier', () => {
    const tier = {
      id: 'basic',
      name: 'Basic',
      tagline: 'For teams',
      monthlyPriceMYR: 25,
      annualPriceMYR: 250,
      annualDiscount: 17,
      status: 'active' as const,
      targetAudience: 'Small businesses',
      limits: [],
      includedFeatures: [],
      excludedFeatures: [],
      highlightFeatures: [],
    };
    const result = validateTier(tier);
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('basic');
  });

  it('returns error for invalid tier', () => {
    const result = validateTier({ id: '', name: 'Test' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('validateTiers', () => {
  it('validates array of tiers', () => {
    const tiers = [
      {
        id: 'free',
        name: 'Free',
        tagline: 'Get started',
        monthlyPriceMYR: 0,
        annualPriceMYR: 0,
        annualDiscount: 0,
        status: 'active' as const,
        targetAudience: 'Everyone',
        limits: [],
        includedFeatures: [],
        excludedFeatures: [],
        highlightFeatures: [],
      },
      {
        id: 'pro',
        name: 'Pro',
        tagline: 'For power users',
        monthlyPriceMYR: 79,
        annualPriceMYR: 790,
        annualDiscount: 17,
        status: 'active' as const,
        targetAudience: 'Power users',
        limits: [],
        includedFeatures: [],
        excludedFeatures: [],
        highlightFeatures: [],
      },
    ];
    const result = validateTiers(tiers);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('validates empty array', () => {
    const result = validateTiers([]);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
  });
});

describe('validateTierDisplayConfig', () => {
  it('returns success for valid config', () => {
    const config = {
      highlighted: true,
      highlightedFeatures: [],
      ctaText: 'Get Started',
      ctaStyle: 'primary' as const,
      badgeText: '',
      showLimits: true,
      maxVisibleFeatures: 6,
      monthlyPrice: 0,
      annualPrice: 0,
      tagline: 'Test',
    };
    const result = validateTierDisplayConfig(config);
    expect(result.success).toBe(true);
  });

  it('returns error for invalid config', () => {
    const result = validateTierDisplayConfig({ highlighted: 'yes' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
