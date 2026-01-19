/**
 * Tests for cost-related Zod schemas
 */

import { describe, it, expect } from 'vitest';
import {
  VariableCostItemSchema,
  FixedCostItemSchema,
  CostBreakdownSchema,
  MarginInfoSchema,
  validateVariableCostItem,
  validateFixedCostItem,
  validateVariableCostItems,
  validateFixedCostItems,
} from './costs';

describe('VariableCostItemSchema', () => {
  const validItem = {
    id: 'test-1',
    name: 'Test Cost',
    unit: 'items',
    costPerUnit: 0.01,
    usagePerCustomer: 100,
    description: 'A test variable cost',
  };

  it('validates correct structure', () => {
    expect(() => VariableCostItemSchema.parse(validItem)).not.toThrow();
  });

  it('requires non-empty id', () => {
    const invalid = { ...validItem, id: '' };
    expect(() => VariableCostItemSchema.parse(invalid)).toThrow();
  });

  it('requires non-empty name', () => {
    const invalid = { ...validItem, name: '' };
    expect(() => VariableCostItemSchema.parse(invalid)).toThrow();
  });

  it('requires non-empty unit', () => {
    const invalid = { ...validItem, unit: '' };
    expect(() => VariableCostItemSchema.parse(invalid)).toThrow();
  });

  it('rejects negative costPerUnit', () => {
    const invalid = { ...validItem, costPerUnit: -1 };
    expect(() => VariableCostItemSchema.parse(invalid)).toThrow();
  });

  it('rejects negative usagePerCustomer', () => {
    const invalid = { ...validItem, usagePerCustomer: -1 };
    expect(() => VariableCostItemSchema.parse(invalid)).toThrow();
  });

  it('allows zero values for costPerUnit', () => {
    const zeroItem = { ...validItem, costPerUnit: 0 };
    expect(() => VariableCostItemSchema.parse(zeroItem)).not.toThrow();
  });

  it('allows zero values for usagePerCustomer', () => {
    const zeroItem = { ...validItem, usagePerCustomer: 0 };
    expect(() => VariableCostItemSchema.parse(zeroItem)).not.toThrow();
  });

  it('allows empty description', () => {
    const emptyDesc = { ...validItem, description: '' };
    expect(() => VariableCostItemSchema.parse(emptyDesc)).not.toThrow();
  });
});

describe('FixedCostItemSchema', () => {
  const validItem = {
    id: 'fixed-1',
    name: 'Database',
    monthlyCost: 100,
    description: 'Monthly database hosting',
  };

  it('validates correct structure', () => {
    expect(() => FixedCostItemSchema.parse(validItem)).not.toThrow();
  });

  it('requires non-empty id', () => {
    const invalid = { ...validItem, id: '' };
    expect(() => FixedCostItemSchema.parse(invalid)).toThrow();
  });

  it('requires non-empty name', () => {
    const invalid = { ...validItem, name: '' };
    expect(() => FixedCostItemSchema.parse(invalid)).toThrow();
  });

  it('rejects negative monthlyCost', () => {
    const invalid = { ...validItem, monthlyCost: -50 };
    expect(() => FixedCostItemSchema.parse(invalid)).toThrow();
  });

  it('allows zero monthlyCost', () => {
    const zeroItem = { ...validItem, monthlyCost: 0 };
    expect(() => FixedCostItemSchema.parse(zeroItem)).not.toThrow();
  });
});

describe('CostBreakdownSchema', () => {
  it('validates correct structure', () => {
    const breakdown = {
      variableTotal: 100,
      fixedTotal: 500,
      fixedPerCustomer: 5,
      totalCOGS: 105,
    };
    expect(() => CostBreakdownSchema.parse(breakdown)).not.toThrow();
  });

  it('rejects negative values', () => {
    const invalid = {
      variableTotal: -100,
      fixedTotal: 500,
      fixedPerCustomer: 5,
      totalCOGS: 105,
    };
    expect(() => CostBreakdownSchema.parse(invalid)).toThrow();
  });
});

describe('MarginInfoSchema', () => {
  it('validates correct structure', () => {
    const margin = {
      margin: 75,
      profit: 50,
      status: 'great' as const,
    };
    expect(() => MarginInfoSchema.parse(margin)).not.toThrow();
  });

  it('accepts all valid statuses', () => {
    const statuses = ['great', 'ok', 'low'] as const;
    statuses.forEach((status) => {
      const margin = { margin: 50, profit: 25, status };
      expect(() => MarginInfoSchema.parse(margin)).not.toThrow();
    });
  });

  it('rejects invalid status', () => {
    const invalid = { margin: 50, profit: 25, status: 'excellent' };
    expect(() => MarginInfoSchema.parse(invalid)).toThrow();
  });

  it('allows negative margin and profit', () => {
    const negative = { margin: -10, profit: -5, status: 'low' as const };
    expect(() => MarginInfoSchema.parse(negative)).not.toThrow();
  });
});

describe('validateVariableCostItem', () => {
  it('returns success for valid item', () => {
    const item = {
      id: '1',
      name: 'Test',
      unit: 'items',
      costPerUnit: 0.01,
      usagePerCustomer: 100,
      description: '',
    };
    const result = validateVariableCostItem(item);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(item);
  });

  it('returns error for invalid item', () => {
    const result = validateVariableCostItem({ id: '', name: 'Test' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('validateFixedCostItem', () => {
  it('returns success for valid item', () => {
    const item = {
      id: '1',
      name: 'Database',
      monthlyCost: 100,
      description: '',
    };
    const result = validateFixedCostItem(item);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(item);
  });

  it('returns error for invalid item', () => {
    const result = validateFixedCostItem({ name: 'Test', monthlyCost: -1 });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('validateVariableCostItems', () => {
  it('validates array of items', () => {
    const items = [
      { id: '1', name: 'Cost 1', unit: 'items', costPerUnit: 0.01, usagePerCustomer: 100, description: '' },
      { id: '2', name: 'Cost 2', unit: 'GB', costPerUnit: 0.05, usagePerCustomer: 10, description: '' },
    ];
    const result = validateVariableCostItems(items);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('fails on invalid item in array', () => {
    const items = [
      { id: '1', name: 'Cost 1', unit: 'items', costPerUnit: 0.01, usagePerCustomer: 100, description: '' },
      { id: '', name: 'Invalid', unit: 'items', costPerUnit: 0.01, usagePerCustomer: 100, description: '' },
    ];
    const result = validateVariableCostItems(items);
    expect(result.success).toBe(false);
  });
});

describe('validateFixedCostItems', () => {
  it('validates array of items', () => {
    const items = [
      { id: '1', name: 'Fixed 1', monthlyCost: 100, description: '' },
      { id: '2', name: 'Fixed 2', monthlyCost: 200, description: '' },
    ];
    const result = validateFixedCostItems(items);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('validates empty array', () => {
    const result = validateFixedCostItems([]);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
  });
});
