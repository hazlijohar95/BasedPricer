/**
 * Tests for sample cost data
 */

import { describe, it, expect } from 'vitest';
import { SAMPLE_VARIABLE_COSTS, SAMPLE_FIXED_COSTS } from './sample-costs.js';

describe('SAMPLE_VARIABLE_COSTS', () => {
  it('should be a non-empty array', () => {
    expect(Array.isArray(SAMPLE_VARIABLE_COSTS)).toBe(true);
    expect(SAMPLE_VARIABLE_COSTS.length).toBeGreaterThan(0);
  });

  it('should have valid structure for each item', () => {
    SAMPLE_VARIABLE_COSTS.forEach((cost, index) => {
      expect(cost).toHaveProperty('id');
      expect(cost).toHaveProperty('name');
      expect(cost).toHaveProperty('unit');
      expect(cost).toHaveProperty('costPerUnit');
      expect(cost).toHaveProperty('usagePerCustomer');

      expect(typeof cost.id).toBe('string');
      expect(typeof cost.name).toBe('string');
      expect(typeof cost.unit).toBe('string');
      expect(typeof cost.costPerUnit).toBe('number');
      expect(typeof cost.usagePerCustomer).toBe('number');

      expect(cost.costPerUnit).toBeGreaterThan(0);
      expect(cost.usagePerCustomer).toBeGreaterThan(0);
    });
  });

  it('should have unique IDs', () => {
    const ids = SAMPLE_VARIABLE_COSTS.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('SAMPLE_FIXED_COSTS', () => {
  it('should be a non-empty array', () => {
    expect(Array.isArray(SAMPLE_FIXED_COSTS)).toBe(true);
    expect(SAMPLE_FIXED_COSTS.length).toBeGreaterThan(0);
  });

  it('should have valid structure for each item', () => {
    SAMPLE_FIXED_COSTS.forEach((cost, index) => {
      expect(cost).toHaveProperty('id');
      expect(cost).toHaveProperty('name');
      expect(cost).toHaveProperty('monthlyCost');

      expect(typeof cost.id).toBe('string');
      expect(typeof cost.name).toBe('string');
      expect(typeof cost.monthlyCost).toBe('number');

      expect(cost.monthlyCost).toBeGreaterThanOrEqual(0);
    });
  });

  it('should have unique IDs', () => {
    const ids = SAMPLE_FIXED_COSTS.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('Sample data integration', () => {
  it('should be usable with core calculation functions', async () => {
    // Dynamic import to ensure @basedpricer/core is available
    const { calculateCOGSBreakdown } = await import('@basedpricer/core');

    const breakdown = calculateCOGSBreakdown(
      SAMPLE_VARIABLE_COSTS,
      SAMPLE_FIXED_COSTS,
      100
    );

    expect(breakdown).toHaveProperty('variableTotal');
    expect(breakdown).toHaveProperty('fixedTotal');
    expect(breakdown).toHaveProperty('fixedPerCustomer');
    expect(breakdown).toHaveProperty('totalCOGS');

    expect(breakdown.variableTotal).toBeGreaterThan(0);
    expect(breakdown.fixedTotal).toBeGreaterThan(0);
    expect(breakdown.totalCOGS).toBeGreaterThan(0);
  });
});
