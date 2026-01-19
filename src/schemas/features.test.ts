/**
 * Tests for feature-related Zod schemas
 */

import { describe, it, expect } from 'vitest';
import {
  FeatureSchema,
  FeatureCategorySchema,
  FeatureSourceSchema,
  FeatureComplexitySchema,
  validateFeature,
  validateFeatures,
  isValidFeatureCategory,
  isValidFeatureSource,
  isValidFeatureComplexity,
} from './features';

describe('FeatureSchema', () => {
  const validFeature = {
    id: 'feature-1',
    name: 'Invoice Creation',
    description: 'Create professional invoices',
    category: 'invoicing' as const,
    complexity: 'medium' as const,
    hasLimit: true,
    limitUnit: 'invoices/month',
    costDriver: 'email',
    valueProposition: 'Professional invoicing without expensive software',
    source: 'codebase' as const,
    sourceFile: 'src/invoicing/create.ts',
  };

  it('validates correct structure', () => {
    expect(() => FeatureSchema.parse(validFeature)).not.toThrow();
  });

  it('requires non-empty id', () => {
    const invalid = { ...validFeature, id: '' };
    expect(() => FeatureSchema.parse(invalid)).toThrow();
  });

  it('requires non-empty name', () => {
    const invalid = { ...validFeature, name: '' };
    expect(() => FeatureSchema.parse(invalid)).toThrow();
  });

  it('validates all categories', () => {
    const categories = [
      'invoicing',
      'document_management',
      'ai_extraction',
      'accounting_ai',
      'email',
      'payments',
      'team',
      'reporting',
      'integrations',
      'support',
    ] as const;

    categories.forEach((category) => {
      const feature = { ...validFeature, category };
      expect(() => FeatureSchema.parse(feature)).not.toThrow();
    });
  });

  it('rejects invalid category', () => {
    const invalid = { ...validFeature, category: 'invalid_category' };
    expect(() => FeatureSchema.parse(invalid)).toThrow();
  });

  it('validates all complexity levels', () => {
    const complexities = ['low', 'medium', 'high'] as const;
    complexities.forEach((complexity) => {
      const feature = { ...validFeature, complexity };
      expect(() => FeatureSchema.parse(feature)).not.toThrow();
    });
  });

  it('rejects invalid complexity', () => {
    const invalid = { ...validFeature, complexity: 'very_high' };
    expect(() => FeatureSchema.parse(invalid)).toThrow();
  });

  it('validates both source types', () => {
    const sources = ['codebase', 'manual'] as const;
    sources.forEach((source) => {
      const feature = { ...validFeature, source };
      expect(() => FeatureSchema.parse(feature)).not.toThrow();
    });
  });

  it('optional fields can be omitted', () => {
    const minimal = {
      id: 'feature-1',
      name: 'Test Feature',
      description: 'A test feature',
      category: 'invoicing' as const,
      complexity: 'low' as const,
      hasLimit: false,
      valueProposition: 'Test value',
      source: 'manual' as const,
    };
    expect(() => FeatureSchema.parse(minimal)).not.toThrow();
  });

  it('validates manual feature with createdAt', () => {
    const manual = {
      ...validFeature,
      source: 'manual' as const,
      createdAt: '2024-01-15T10:00:00Z',
      sourceFile: undefined,
    };
    expect(() => FeatureSchema.parse(manual)).not.toThrow();
  });
});

describe('FeatureCategorySchema', () => {
  it('accepts all valid categories', () => {
    const valid = [
      'invoicing',
      'document_management',
      'ai_extraction',
      'accounting_ai',
      'email',
      'payments',
      'team',
      'reporting',
      'integrations',
      'support',
    ];
    valid.forEach((category) => {
      expect(() => FeatureCategorySchema.parse(category)).not.toThrow();
    });
  });

  it('rejects invalid category', () => {
    expect(() => FeatureCategorySchema.parse('billing')).toThrow();
    expect(() => FeatureCategorySchema.parse('')).toThrow();
    expect(() => FeatureCategorySchema.parse(123)).toThrow();
  });
});

describe('FeatureSourceSchema', () => {
  it('accepts codebase and manual', () => {
    expect(() => FeatureSourceSchema.parse('codebase')).not.toThrow();
    expect(() => FeatureSourceSchema.parse('manual')).not.toThrow();
  });

  it('rejects invalid source', () => {
    expect(() => FeatureSourceSchema.parse('imported')).toThrow();
    expect(() => FeatureSourceSchema.parse('auto')).toThrow();
  });
});

describe('FeatureComplexitySchema', () => {
  it('accepts all valid complexities', () => {
    expect(() => FeatureComplexitySchema.parse('low')).not.toThrow();
    expect(() => FeatureComplexitySchema.parse('medium')).not.toThrow();
    expect(() => FeatureComplexitySchema.parse('high')).not.toThrow();
  });

  it('rejects invalid complexity', () => {
    expect(() => FeatureComplexitySchema.parse('very_high')).toThrow();
    expect(() => FeatureComplexitySchema.parse('critical')).toThrow();
  });
});

describe('validateFeature', () => {
  it('returns success for valid feature', () => {
    const feature = {
      id: 'test',
      name: 'Test Feature',
      description: 'Description',
      category: 'invoicing' as const,
      complexity: 'low' as const,
      hasLimit: false,
      valueProposition: 'Test value',
      source: 'manual' as const,
    };
    const result = validateFeature(feature);
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('test');
  });

  it('returns error for invalid feature', () => {
    const result = validateFeature({ id: '', name: '' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('validateFeatures', () => {
  it('validates array of features', () => {
    const features = [
      {
        id: 'feature-1',
        name: 'Feature 1',
        description: 'First feature',
        category: 'invoicing' as const,
        complexity: 'low' as const,
        hasLimit: false,
        valueProposition: 'Value 1',
        source: 'codebase' as const,
      },
      {
        id: 'feature-2',
        name: 'Feature 2',
        description: 'Second feature',
        category: 'payments' as const,
        complexity: 'high' as const,
        hasLimit: true,
        limitUnit: 'transactions/month',
        valueProposition: 'Value 2',
        source: 'manual' as const,
      },
    ];
    const result = validateFeatures(features);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('validates empty array', () => {
    const result = validateFeatures([]);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
  });

  it('fails on invalid feature in array', () => {
    const features = [
      {
        id: 'valid',
        name: 'Valid Feature',
        description: 'Valid',
        category: 'invoicing' as const,
        complexity: 'low' as const,
        hasLimit: false,
        valueProposition: 'Value',
        source: 'manual' as const,
      },
      { id: '', name: '' }, // Invalid
    ];
    const result = validateFeatures(features);
    expect(result.success).toBe(false);
  });
});

describe('isValidFeatureCategory', () => {
  it('returns true for valid categories', () => {
    expect(isValidFeatureCategory('invoicing')).toBe(true);
    expect(isValidFeatureCategory('payments')).toBe(true);
    expect(isValidFeatureCategory('support')).toBe(true);
  });

  it('returns false for invalid categories', () => {
    expect(isValidFeatureCategory('billing')).toBe(false);
    expect(isValidFeatureCategory('')).toBe(false);
    expect(isValidFeatureCategory('INVOICING')).toBe(false);
  });
});

describe('isValidFeatureSource', () => {
  it('returns true for valid sources', () => {
    expect(isValidFeatureSource('codebase')).toBe(true);
    expect(isValidFeatureSource('manual')).toBe(true);
  });

  it('returns false for invalid sources', () => {
    expect(isValidFeatureSource('imported')).toBe(false);
    expect(isValidFeatureSource('')).toBe(false);
  });
});

describe('isValidFeatureComplexity', () => {
  it('returns true for valid complexities', () => {
    expect(isValidFeatureComplexity('low')).toBe(true);
    expect(isValidFeatureComplexity('medium')).toBe(true);
    expect(isValidFeatureComplexity('high')).toBe(true);
  });

  it('returns false for invalid complexities', () => {
    expect(isValidFeatureComplexity('very_high')).toBe(false);
    expect(isValidFeatureComplexity('')).toBe(false);
  });
});
