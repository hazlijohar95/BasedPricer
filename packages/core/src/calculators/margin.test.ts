/**
 * Margin Calculator Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateGrossMargin,
  calculateProfit,
  calculateOperatingMargin,
  calculateTierMargin,
  getMarginStatus,
  getMarginHealth,
  getGrossMarginHealth,
  getOperatingMarginHealth,
  getMarginInfo,
  calculateMarginBreakdown,
  comparePricePoints,
  findMinimumPriceForMargin,
  isMarginHealthy,
  isMarginAcceptable,
} from './margin';

// ============================================================================
// Gross Margin Tests
// ============================================================================

describe('calculateGrossMargin', () => {
  it('calculates gross margin correctly', () => {
    // Margin = (100 - 30) / 100 * 100 = 70%
    expect(calculateGrossMargin(100, 30)).toBe(70);
  });

  it('handles 0 COGS (100% margin)', () => {
    expect(calculateGrossMargin(100, 0)).toBe(100);
  });

  it('handles COGS equal to price (0% margin)', () => {
    expect(calculateGrossMargin(100, 100)).toBe(0);
  });

  it('handles negative margin (COGS > price)', () => {
    expect(calculateGrossMargin(100, 150)).toBe(-50);
  });

  it('returns 0 for zero price', () => {
    expect(calculateGrossMargin(0, 50)).toBe(0);
  });

  it('returns 0 for negative price', () => {
    expect(calculateGrossMargin(-100, 50)).toBe(0);
  });

  it('handles decimal values', () => {
    // Margin = (49.99 - 15.50) / 49.99 * 100 = 68.99%
    const result = calculateGrossMargin(49.99, 15.50);
    expect(result).toBeCloseTo(68.99, 1);
  });
});

// ============================================================================
// Profit Tests
// ============================================================================

describe('calculateProfit', () => {
  it('calculates profit correctly', () => {
    expect(calculateProfit(100, 30)).toBe(70);
  });

  it('handles loss (negative profit)', () => {
    expect(calculateProfit(100, 150)).toBe(-50);
  });

  it('handles zero price', () => {
    expect(calculateProfit(0, 50)).toBe(-50);
  });

  it('handles zero COGS', () => {
    expect(calculateProfit(100, 0)).toBe(100);
  });
});

// ============================================================================
// Operating Margin Tests
// ============================================================================

describe('calculateOperatingMargin', () => {
  it('calculates operating margin correctly', () => {
    // Operating Margin = (1000 - 300 - 200) / 1000 * 100 = 50%
    expect(calculateOperatingMargin(1000, 300, 200)).toBe(50);
  });

  it('returns 0 for zero revenue', () => {
    expect(calculateOperatingMargin(0, 300, 200)).toBe(0);
  });

  it('handles negative margin', () => {
    expect(calculateOperatingMargin(1000, 700, 500)).toBe(-20);
  });
});

// ============================================================================
// Tier Margin Tests
// ============================================================================

describe('calculateTierMargin', () => {
  it('calculates tier margin (same as gross margin)', () => {
    expect(calculateTierMargin(78, 20)).toBe(calculateGrossMargin(78, 20));
  });
});

// ============================================================================
// Margin Status Tests
// ============================================================================

describe('getMarginStatus', () => {
  it('returns "great" for margin >= 70%', () => {
    expect(getMarginStatus(70)).toBe('great');
    expect(getMarginStatus(80)).toBe('great');
    expect(getMarginStatus(100)).toBe('great');
  });

  it('returns "ok" for margin >= 50% and < 70%', () => {
    expect(getMarginStatus(50)).toBe('ok');
    expect(getMarginStatus(60)).toBe('ok');
    expect(getMarginStatus(69.99)).toBe('ok');
  });

  it('returns "low" for margin < 50%', () => {
    expect(getMarginStatus(49.99)).toBe('low');
    expect(getMarginStatus(30)).toBe('low');
    expect(getMarginStatus(0)).toBe('low');
    expect(getMarginStatus(-10)).toBe('low');
  });
});

describe('getMarginHealth', () => {
  it('returns "healthy" for margin >= 70%', () => {
    expect(getMarginHealth(70)).toBe('healthy');
    expect(getMarginHealth(85)).toBe('healthy');
  });

  it('returns "acceptable" for margin >= 50% and < 70%', () => {
    expect(getMarginHealth(50)).toBe('acceptable');
    expect(getMarginHealth(65)).toBe('acceptable');
  });

  it('returns "low" for margin < 50%', () => {
    expect(getMarginHealth(40)).toBe('low');
    expect(getMarginHealth(-5)).toBe('low');
  });
});

describe('getGrossMarginHealth', () => {
  it('is an alias for getMarginHealth', () => {
    expect(getGrossMarginHealth(75)).toBe(getMarginHealth(75));
    expect(getGrossMarginHealth(55)).toBe(getMarginHealth(55));
    expect(getGrossMarginHealth(30)).toBe(getMarginHealth(30));
  });
});

describe('getOperatingMarginHealth', () => {
  it('returns "healthy" for margin >= 20%', () => {
    expect(getOperatingMarginHealth(20)).toBe('healthy');
    expect(getOperatingMarginHealth(30)).toBe('healthy');
  });

  it('returns "acceptable" for margin >= 0% and < 20%', () => {
    expect(getOperatingMarginHealth(0)).toBe('acceptable');
    expect(getOperatingMarginHealth(10)).toBe('acceptable');
    expect(getOperatingMarginHealth(19.99)).toBe('acceptable');
  });

  it('returns "low" for margin < 0%', () => {
    expect(getOperatingMarginHealth(-1)).toBe('low');
    expect(getOperatingMarginHealth(-20)).toBe('low');
  });
});

// ============================================================================
// Margin Info Tests
// ============================================================================

describe('getMarginInfo', () => {
  it('returns complete margin info', () => {
    const result = getMarginInfo(100, 30);

    expect(result.margin).toBe(70);
    expect(result.profit).toBe(70);
    expect(result.status).toBe('great');
  });

  it('handles low margin scenario', () => {
    const result = getMarginInfo(100, 80);

    expect(result.margin).toBe(20);
    expect(result.profit).toBe(20);
    expect(result.status).toBe('low');
  });
});

describe('calculateMarginBreakdown', () => {
  it('returns complete breakdown', () => {
    const result = calculateMarginBreakdown({
      price: 100,
      variableCostPerCustomer: 20,
      fixedCostPerCustomer: 10,
    });

    expect(result.cogs).toBe(30);
    expect(result.grossMargin).toBe(70);
    expect(result.grossMarginHealth).toBe('healthy');
    expect(result.profit).toBe(70);
  });
});

// ============================================================================
// Comparison Tests
// ============================================================================

describe('comparePricePoints', () => {
  it('compares multiple price points', () => {
    const result = comparePricePoints([50, 75, 100], 30);

    expect(result).toHaveLength(3);

    expect(result[0].price).toBe(50);
    expect(result[0].margin).toBe(40);
    expect(result[0].profit).toBe(20);
    expect(result[0].status).toBe('low');

    expect(result[1].price).toBe(75);
    expect(result[1].margin).toBe(60);
    expect(result[1].status).toBe('ok');

    expect(result[2].price).toBe(100);
    expect(result[2].margin).toBe(70);
    expect(result[2].status).toBe('great');
  });
});

// ============================================================================
// Minimum Price Tests
// ============================================================================

describe('findMinimumPriceForMargin', () => {
  it('finds minimum price for target margin', () => {
    // For 70% margin with COGS of 30:
    // price = 30 / (1 - 0.7) = 30 / 0.3 = 100
    const result = findMinimumPriceForMargin(30, 70);
    expect(result).toBeCloseTo(100, 5);
  });

  it('returns Infinity for 100% margin', () => {
    expect(findMinimumPriceForMargin(30, 100)).toBe(Infinity);
  });

  it('handles low margin target', () => {
    // For 50% margin with COGS of 30:
    // price = 30 / (1 - 0.5) = 30 / 0.5 = 60
    const result = findMinimumPriceForMargin(30, 50);
    expect(result).toBe(60);
  });

  it('handles 0% margin (price equals COGS)', () => {
    const result = findMinimumPriceForMargin(30, 0);
    expect(result).toBe(30);
  });
});

// ============================================================================
// Boolean Helpers Tests
// ============================================================================

describe('isMarginHealthy', () => {
  it('returns true for margin >= 70%', () => {
    expect(isMarginHealthy(70)).toBe(true);
    expect(isMarginHealthy(85)).toBe(true);
  });

  it('returns false for margin < 70%', () => {
    expect(isMarginHealthy(69.99)).toBe(false);
    expect(isMarginHealthy(50)).toBe(false);
  });
});

describe('isMarginAcceptable', () => {
  it('returns true for margin >= 50%', () => {
    expect(isMarginAcceptable(50)).toBe(true);
    expect(isMarginAcceptable(70)).toBe(true);
  });

  it('returns false for margin < 50%', () => {
    expect(isMarginAcceptable(49.99)).toBe(false);
    expect(isMarginAcceptable(30)).toBe(false);
  });
});
