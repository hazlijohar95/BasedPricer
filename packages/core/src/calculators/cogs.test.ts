/**
 * COGS Calculator Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  roundCurrency,
  roundCustomers,
  roundPercentage,
  calculateVariableCosts,
  calculateTotalFixedCosts,
  calculateFixedCostPerCustomer,
  calculateCOGSBreakdown,
  calculateTotalCOGS,
  calculateMRR,
  calculateBreakEvenCustomers,
  calculateMonthlyProfit,
} from './cogs';
import type { VariableCostItem, FixedCostItem } from '../types';

// ============================================================================
// Test Data
// ============================================================================

const sampleVariableCosts: VariableCostItem[] = [
  {
    id: 'api-1',
    name: 'OpenAI API',
    unit: '1K tokens',
    costPerUnit: 0.03,
    usagePerCustomer: 100,
    description: 'GPT-4 API calls',
  },
  {
    id: 'storage-1',
    name: 'Cloud Storage',
    unit: 'GB',
    costPerUnit: 0.10,
    usagePerCustomer: 5,
    description: 'User data storage',
  },
];

const sampleFixedCosts: FixedCostItem[] = [
  {
    id: 'hosting-1',
    name: 'Vercel Hosting',
    monthlyCost: 20,
    description: 'Pro plan',
  },
  {
    id: 'domain-1',
    name: 'Domain',
    monthlyCost: 5,
    description: 'Annual domain fee / 12',
  },
];

// ============================================================================
// Rounding Utilities Tests
// ============================================================================

describe('roundCurrency', () => {
  it('rounds to 2 decimal places by default', () => {
    expect(roundCurrency(10.456)).toBe(10.46);
    expect(roundCurrency(10.454)).toBe(10.45);
    expect(roundCurrency(10.455)).toBe(10.46); // Round half up
  });

  it('rounds to specified decimal places', () => {
    expect(roundCurrency(10.4567, 3)).toBe(10.457);
    expect(roundCurrency(10.4, 0)).toBe(10);
  });

  it('handles negative numbers', () => {
    expect(roundCurrency(-10.456)).toBe(-10.46);
  });

  it('handles zero', () => {
    expect(roundCurrency(0)).toBe(0);
  });
});

describe('roundCustomers', () => {
  it('always rounds up', () => {
    expect(roundCustomers(10.1)).toBe(11);
    expect(roundCustomers(10.9)).toBe(11);
    expect(roundCustomers(10.0)).toBe(10);
  });

  it('handles negative numbers', () => {
    expect(roundCustomers(-10.1)).toBe(-10);
  });
});

describe('roundPercentage', () => {
  it('rounds to 1 decimal place by default', () => {
    expect(roundPercentage(72.456)).toBe(72.5);
    expect(roundPercentage(72.444)).toBe(72.4);
  });

  it('rounds to specified decimal places', () => {
    expect(roundPercentage(72.456, 2)).toBe(72.46);
    expect(roundPercentage(72.456, 0)).toBe(72);
  });
});

// ============================================================================
// Variable Cost Tests
// ============================================================================

describe('calculateVariableCosts', () => {
  it('calculates total variable cost per customer correctly', () => {
    // OpenAI: 0.03 * 100 = 3.00
    // Storage: 0.10 * 5 = 0.50
    // Total: 3.50
    const result = calculateVariableCosts(sampleVariableCosts);
    expect(result).toBe(3.5);
  });

  it('applies utilization rate', () => {
    const result = calculateVariableCosts(sampleVariableCosts, 0.5);
    expect(result).toBe(1.75); // 3.5 * 0.5
  });

  it('handles empty costs array', () => {
    expect(calculateVariableCosts([])).toBe(0);
  });

  it('handles zero utilization', () => {
    expect(calculateVariableCosts(sampleVariableCosts, 0)).toBe(0);
  });

  it('handles single cost item', () => {
    const singleCost: VariableCostItem[] = [
      {
        id: 'test',
        name: 'Test',
        unit: 'unit',
        costPerUnit: 10,
        usagePerCustomer: 2,
        description: 'Test cost',
      },
    ];
    expect(calculateVariableCosts(singleCost)).toBe(20);
  });
});

// ============================================================================
// Fixed Cost Tests
// ============================================================================

describe('calculateTotalFixedCosts', () => {
  it('calculates total fixed costs correctly', () => {
    // 20 + 5 = 25
    const result = calculateTotalFixedCosts(sampleFixedCosts);
    expect(result).toBe(25);
  });

  it('handles empty costs array', () => {
    expect(calculateTotalFixedCosts([])).toBe(0);
  });

  it('handles single cost item', () => {
    const singleCost: FixedCostItem[] = [
      { id: 'test', name: 'Test', monthlyCost: 100, description: 'Test' },
    ];
    expect(calculateTotalFixedCosts(singleCost)).toBe(100);
  });
});

describe('calculateFixedCostPerCustomer', () => {
  it('calculates fixed cost per customer correctly', () => {
    // 25 / 100 = 0.25
    const result = calculateFixedCostPerCustomer(sampleFixedCosts, 100);
    expect(result).toBe(0.25);
  });

  it('returns 0 for zero customers', () => {
    expect(calculateFixedCostPerCustomer(sampleFixedCosts, 0)).toBe(0);
  });

  it('returns 0 for negative customers', () => {
    expect(calculateFixedCostPerCustomer(sampleFixedCosts, -10)).toBe(0);
  });

  it('handles single customer', () => {
    // All fixed costs allocated to 1 customer
    const result = calculateFixedCostPerCustomer(sampleFixedCosts, 1);
    expect(result).toBe(25);
  });
});

// ============================================================================
// COGS Breakdown Tests
// ============================================================================

describe('calculateCOGSBreakdown', () => {
  it('calculates complete breakdown correctly', () => {
    const result = calculateCOGSBreakdown(
      sampleVariableCosts,
      sampleFixedCosts,
      100
    );

    expect(result.variableTotal).toBe(3.5);
    expect(result.fixedTotal).toBe(25);
    expect(result.fixedPerCustomer).toBe(0.25);
    expect(result.totalCOGS).toBe(3.75); // 3.5 + 0.25
  });

  it('handles zero customers', () => {
    const result = calculateCOGSBreakdown(
      sampleVariableCosts,
      sampleFixedCosts,
      0
    );

    expect(result.variableTotal).toBe(3.5);
    expect(result.fixedTotal).toBe(25);
    expect(result.fixedPerCustomer).toBe(0);
    expect(result.totalCOGS).toBe(3.5);
  });

  it('applies utilization rate', () => {
    const result = calculateCOGSBreakdown(
      sampleVariableCosts,
      sampleFixedCosts,
      100,
      0.5
    );

    expect(result.variableTotal).toBe(1.75);
    expect(result.totalCOGS).toBe(2); // 1.75 + 0.25
  });

  it('handles empty costs', () => {
    const result = calculateCOGSBreakdown([], [], 100);

    expect(result.variableTotal).toBe(0);
    expect(result.fixedTotal).toBe(0);
    expect(result.fixedPerCustomer).toBe(0);
    expect(result.totalCOGS).toBe(0);
  });
});

describe('calculateTotalCOGS', () => {
  it('returns correct total COGS', () => {
    const result = calculateTotalCOGS(
      sampleVariableCosts,
      sampleFixedCosts,
      100
    );
    expect(result).toBe(3.75);
  });
});

// ============================================================================
// MRR Tests
// ============================================================================

describe('calculateMRR', () => {
  it('calculates MRR correctly', () => {
    const tierPrices = {
      free: 0,
      basic: 25,
      pro: 78,
    };
    const tierDistribution = {
      free: 500,
      basic: 100,
      pro: 50,
    };

    // (0 * 500) + (25 * 100) + (78 * 50) = 0 + 2500 + 3900 = 6400
    const result = calculateMRR(tierPrices, tierDistribution);
    expect(result).toBe(6400);
  });

  it('handles missing tier prices', () => {
    const tierPrices = { basic: 25 };
    const tierDistribution = { basic: 100, pro: 50 };

    // (25 * 100) + (0 * 50) = 2500
    const result = calculateMRR(tierPrices, tierDistribution);
    expect(result).toBe(2500);
  });

  it('handles empty distribution', () => {
    expect(calculateMRR({ basic: 25 }, {})).toBe(0);
  });
});

// ============================================================================
// Break-even Tests
// ============================================================================

describe('calculateBreakEvenCustomers', () => {
  it('calculates break-even customers correctly', () => {
    // Fixed costs: 1000
    // Price: 50
    // Variable cost: 10
    // Contribution: 50 - 10 = 40
    // Break-even: 1000 / 40 = 25
    const result = calculateBreakEvenCustomers(1000, 50, 10);
    expect(result).toBe(25);
  });

  it('rounds up to whole customers', () => {
    // Break-even: 1000 / 30 = 33.33... -> 34
    const result = calculateBreakEvenCustomers(1000, 50, 20);
    expect(result).toBe(34);
  });

  it('returns Infinity when price equals variable cost', () => {
    const result = calculateBreakEvenCustomers(1000, 50, 50);
    expect(result).toBe(Infinity);
  });

  it('returns Infinity when price is below variable cost', () => {
    const result = calculateBreakEvenCustomers(1000, 30, 50);
    expect(result).toBe(Infinity);
  });

  it('returns 0 when fixed costs are 0', () => {
    const result = calculateBreakEvenCustomers(0, 50, 10);
    expect(result).toBe(0);
  });
});

// ============================================================================
// Monthly Profit Tests
// ============================================================================

describe('calculateMonthlyProfit', () => {
  it('calculates profit correctly', () => {
    // MRR: 10000
    // Variable costs: 3000
    // Fixed costs: 2000
    // Profit: 10000 - 3000 - 2000 = 5000
    const result = calculateMonthlyProfit(10000, 3000, 2000);
    expect(result).toBe(5000);
  });

  it('returns negative for loss', () => {
    const result = calculateMonthlyProfit(1000, 3000, 2000);
    expect(result).toBe(-4000);
  });

  it('handles zero revenue', () => {
    const result = calculateMonthlyProfit(0, 1000, 500);
    expect(result).toBe(-1500);
  });
});
