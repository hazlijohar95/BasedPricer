/**
 * Tests for report-related Zod schemas
 */

import { describe, it, expect } from 'vitest';
import {
  BusinessTypeSchema,
  PricingModelTypeSchema,
  ReportDataSchema,
  ReportNotesSchema,
  StakeholderTypeSchema,
  validateReportData,
  validatePricingState,
  isValidReportData,
  parseReportDataSafe,
} from './reports';

describe('BusinessTypeSchema', () => {
  it('accepts all valid business types', () => {
    const types = [
      'api_service',
      'marketplace',
      'fintech',
      'ai_ml_saas',
      'developer_tools',
      'b2b_saas',
      'consumer_saas',
      'generic',
    ];
    types.forEach((type) => {
      expect(() => BusinessTypeSchema.parse(type)).not.toThrow();
    });
  });

  it('rejects invalid business type', () => {
    expect(() => BusinessTypeSchema.parse('ecommerce')).toThrow();
    expect(() => BusinessTypeSchema.parse('')).toThrow();
  });
});

describe('PricingModelTypeSchema', () => {
  it('accepts all valid pricing models', () => {
    const models = [
      'usage_based',
      'seat_based',
      'feature_tiered',
      'take_rate',
      'hybrid',
      'freemium',
    ];
    models.forEach((model) => {
      expect(() => PricingModelTypeSchema.parse(model)).not.toThrow();
    });
  });

  it('rejects invalid pricing model', () => {
    expect(() => PricingModelTypeSchema.parse('pay_per_use')).toThrow();
  });
});

describe('ReportNotesSchema', () => {
  it('validates all stakeholder notes', () => {
    const notes = {
      accountant: 'COGS analysis notes',
      investor: 'Valuation notes',
      engineer: 'Technical notes',
      marketer: 'Marketing notes',
    };
    expect(() => ReportNotesSchema.parse(notes)).not.toThrow();
  });

  it('allows empty notes object', () => {
    expect(() => ReportNotesSchema.parse({})).not.toThrow();
  });

  it('allows partial notes', () => {
    const partial = { accountant: 'Some notes' };
    expect(() => ReportNotesSchema.parse(partial)).not.toThrow();
  });
});

describe('StakeholderTypeSchema', () => {
  it('accepts all valid stakeholder types', () => {
    const types = ['accountant', 'investor', 'engineer', 'marketer'];
    types.forEach((type) => {
      expect(() => StakeholderTypeSchema.parse(type)).not.toThrow();
    });
  });

  it('rejects invalid stakeholder type', () => {
    expect(() => StakeholderTypeSchema.parse('designer')).toThrow();
    expect(() => StakeholderTypeSchema.parse('manager')).toThrow();
  });
});

describe('validateReportData', () => {
  const createValidState = () => ({
    variableCosts: [
      { id: '1', name: 'Cost', unit: 'items', costPerUnit: 0.01, usagePerCustomer: 100, description: '' },
    ],
    fixedCosts: [
      { id: '1', name: 'Fixed', monthlyCost: 100, description: '' },
    ],
    customerCount: 100,
    selectedPrice: 25,
    tiers: [
      {
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
      },
    ],
    features: [
      {
        id: 'f1',
        name: 'Feature',
        description: 'Test',
        category: 'invoicing' as const,
        complexity: 'low' as const,
        hasLimit: false,
        valueProposition: 'Value',
        source: 'manual' as const,
      },
    ],
    tierDisplayConfigs: {
      basic: {
        highlighted: true,
        highlightedFeatures: [],
        ctaText: 'Start',
        ctaStyle: 'primary' as const,
        badgeText: '',
        showLimits: true,
        maxVisibleFeatures: 6,
        monthlyPrice: 25,
        annualPrice: 250,
        tagline: 'Test',
      },
    },
    utilizationRate: 0.7,
    tierDistribution: { basic: 100 },
    businessType: 'b2b_saas' as const,
    businessTypeConfidence: 0.85,
    pricingModelType: 'feature_tiered' as const,
  });

  it('validates correct report data', () => {
    const reportData = {
      projectName: 'Test Project',
      createdAt: '2024-01-15T10:00:00Z',
      state: createValidState(),
      notes: { accountant: 'Notes' },
      selectedMockup: 'mockup-1',
    };
    const result = validateReportData(reportData);
    expect(result.success).toBe(true);
    expect(result.data?.projectName).toBe('Test Project');
  });

  it('requires project name', () => {
    const reportData = {
      projectName: '',
      createdAt: '2024-01-15T10:00:00Z',
      state: createValidState(),
      notes: {},
    };
    const result = validateReportData(reportData);
    expect(result.success).toBe(false);
  });

  it('returns error details for invalid data', () => {
    const result = validateReportData({ projectName: 'Test' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.errors).toBeDefined();
  });
});

describe('validatePricingState', () => {
  it('validates correct pricing state', () => {
    const state = {
      variableCosts: [],
      fixedCosts: [],
      customerCount: 100,
      selectedPrice: 25,
      tiers: [],
      features: [],
      tierDisplayConfigs: {},
      utilizationRate: 0.7,
      tierDistribution: {},
      businessType: null,
      businessTypeConfidence: 0,
      pricingModelType: 'feature_tiered' as const,
    };
    const result = validatePricingState(state);
    expect(result.success).toBe(true);
  });

  it('rejects invalid utilization rate', () => {
    const state = {
      variableCosts: [],
      fixedCosts: [],
      customerCount: 100,
      selectedPrice: 25,
      tiers: [],
      features: [],
      tierDisplayConfigs: {},
      utilizationRate: 1.5, // Invalid: > 1
      tierDistribution: {},
      businessType: null,
      businessTypeConfidence: 0,
      pricingModelType: 'feature_tiered' as const,
    };
    const result = validatePricingState(state);
    expect(result.success).toBe(false);
  });

  it('rejects negative customer count', () => {
    const state = {
      variableCosts: [],
      fixedCosts: [],
      customerCount: -10, // Invalid
      selectedPrice: 25,
      tiers: [],
      features: [],
      tierDisplayConfigs: {},
      utilizationRate: 0.7,
      tierDistribution: {},
      businessType: null,
      businessTypeConfidence: 0,
      pricingModelType: 'feature_tiered' as const,
    };
    const result = validatePricingState(state);
    expect(result.success).toBe(false);
  });
});

describe('isValidReportData', () => {
  it('returns true for valid report data', () => {
    const valid = {
      projectName: 'Test',
      createdAt: '2024-01-15T10:00:00Z',
      state: {
        variableCosts: [],
        fixedCosts: [],
        customerCount: 100,
        selectedPrice: 25,
        tiers: [],
        features: [],
        tierDisplayConfigs: {},
        utilizationRate: 0.7,
        tierDistribution: {},
        businessType: null,
        businessTypeConfidence: 0,
        pricingModelType: 'feature_tiered' as const,
      },
      notes: {},
    };
    expect(isValidReportData(valid)).toBe(true);
  });

  it('returns false for invalid data', () => {
    expect(isValidReportData(null)).toBe(false);
    expect(isValidReportData({})).toBe(false);
    expect(isValidReportData({ projectName: '' })).toBe(false);
  });
});

describe('parseReportDataSafe', () => {
  it('returns null for null input', () => {
    expect(parseReportDataSafe(null)).toBeNull();
  });

  it('returns null for invalid input', () => {
    expect(parseReportDataSafe({})).toBeNull();
    expect(parseReportDataSafe({ projectName: 'Test' })).toBeNull();
  });

  it('handles legacy data with partial defaults', () => {
    const partialData = {
      projectName: 'Test',
      state: {
        variableCosts: [],
        fixedCosts: [],
        customerCount: 100,
        selectedPrice: 25,
        tiers: [],
        features: [],
        tierDisplayConfigs: {},
        utilizationRate: 0.7,
        tierDistribution: {},
        businessType: null,
        businessTypeConfidence: 0,
        pricingModelType: 'feature_tiered',
      },
      // Missing createdAt and notes
    };
    const result = parseReportDataSafe(partialData);
    // The function should handle partial data
    expect(result).not.toBeNull();
    if (result) {
      expect(result.projectName).toBe('Test');
      expect(result.createdAt).toBeDefined();
      expect(result.notes).toEqual({});
    }
  });
});
