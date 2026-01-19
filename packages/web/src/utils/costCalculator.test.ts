/**
 * Cost Calculator Tests
 * Tests for COGS, margin, and profit calculations
 */

import { describe, it, expect } from 'vitest';
import {
  calculateVariableCosts,
  calculateTotalFixedCosts,
  calculateCOGSBreakdown,
  calculateMargin,
  calculateProfit,
  getMarginStatus,
  calculateMRR,
  roundCurrency,
  type VariableCostItem,
  type FixedCostItem,
} from './costCalculator';

describe('costCalculator', () => {
  describe('calculateVariableCosts', () => {
    it('should calculate variable costs per customer', () => {
      const variableCosts: VariableCostItem[] = [
        { id: '1', name: 'AI Processing', unit: 'items', costPerUnit: 0.01, usagePerCustomer: 100, description: '' },
        { id: '2', name: 'Storage', unit: 'GB', costPerUnit: 0.10, usagePerCustomer: 5, description: '' },
      ];
      const result = calculateVariableCosts(variableCosts);
      expect(result).toBe(1.5); // (0.01 * 100) + (0.10 * 5)
    });

    it('should return 0 for empty costs array', () => {
      const result = calculateVariableCosts([]);
      expect(result).toBe(0);
    });

    it('should apply utilization rate', () => {
      const variableCosts: VariableCostItem[] = [
        { id: '1', name: 'API', unit: 'calls', costPerUnit: 0.01, usagePerCustomer: 100, description: '' },
      ];
      const result = calculateVariableCosts(variableCosts, 0.5);
      expect(result).toBe(0.5); // 0.01 * 100 * 0.5
    });
  });

  describe('calculateTotalFixedCosts', () => {
    it('should sum fixed costs', () => {
      const fixedCosts: FixedCostItem[] = [
        { id: '1', name: 'Server', monthlyCost: 100, description: '' },
        { id: '2', name: 'Domain', monthlyCost: 15, description: '' },
      ];
      const result = calculateTotalFixedCosts(fixedCosts);
      expect(result).toBe(115);
    });

    it('should return 0 for empty costs array', () => {
      const result = calculateTotalFixedCosts([]);
      expect(result).toBe(0);
    });
  });

  describe('calculateMargin', () => {
    it('should calculate gross margin percentage', () => {
      const margin = calculateMargin(100, 30);
      expect(margin).toBe(70); // (100 - 30) / 100 * 100
    });

    it('should return 0 for zero price', () => {
      const margin = calculateMargin(0, 30);
      expect(margin).toBe(0);
    });

    it('should handle negative margins', () => {
      const margin = calculateMargin(10, 20);
      expect(margin).toBe(-100); // Loss scenario
    });
  });

  describe('calculateProfit', () => {
    it('should calculate profit per customer', () => {
      const profit = calculateProfit(100, 30);
      expect(profit).toBe(70);
    });

    it('should handle zero price', () => {
      const profit = calculateProfit(0, 30);
      expect(profit).toBe(-30);
    });
  });

  describe('getMarginStatus', () => {
    it('should return "great" for margins >= 70%', () => {
      expect(getMarginStatus(75)).toBe('great');
      expect(getMarginStatus(70)).toBe('great');
    });

    it('should return "ok" for margins >= 50%', () => {
      expect(getMarginStatus(60)).toBe('ok');
      expect(getMarginStatus(50)).toBe('ok');
    });

    it('should return "low" for margins < 50%', () => {
      expect(getMarginStatus(40)).toBe('low');
      expect(getMarginStatus(0)).toBe('low');
    });
  });

  describe('calculateMRR', () => {
    it('should calculate monthly recurring revenue', () => {
      const tierPrices = { basic: 10, pro: 25 };
      const tierDistribution = { basic: 10, pro: 5 };
      const mrr = calculateMRR(tierPrices, tierDistribution);
      expect(mrr).toBe(225); // (10 * 10) + (5 * 25)
    });

    it('should return 0 for empty distributions', () => {
      const mrr = calculateMRR({}, {});
      expect(mrr).toBe(0);
    });

    it('should handle missing tier prices', () => {
      const tierPrices = { basic: 10 };
      const tierDistribution = { basic: 5, pro: 3 };
      const mrr = calculateMRR(tierPrices, tierDistribution);
      expect(mrr).toBe(50); // (5 * 10) + (3 * 0)
    });
  });

  describe('roundCurrency', () => {
    it('should round to 2 decimal places by default', () => {
      expect(roundCurrency(10.456)).toBe(10.46);
      expect(roundCurrency(10.454)).toBe(10.45);
    });

    it('should round to specified decimal places', () => {
      expect(roundCurrency(10.4567, 3)).toBe(10.457);
      expect(roundCurrency(10.4, 0)).toBe(10);
    });
  });

  describe('calculateCOGSBreakdown', () => {
    it('should calculate complete COGS breakdown', () => {
      const variableCosts: VariableCostItem[] = [
        { id: '1', name: 'AI', unit: 'calls', costPerUnit: 0.01, usagePerCustomer: 100, description: '' },
      ];
      const fixedCosts: FixedCostItem[] = [
        { id: '1', name: 'Server', monthlyCost: 50, description: '' },
      ];
      const breakdown = calculateCOGSBreakdown(variableCosts, fixedCosts, 10);

      expect(breakdown.variableTotal).toBe(1); // 0.01 * 100
      expect(breakdown.fixedTotal).toBe(50);
      expect(breakdown.fixedPerCustomer).toBe(5); // 50 / 10
      expect(breakdown.totalCOGS).toBe(6); // 1 + 5
    });

    it('should handle zero customers', () => {
      const variableCosts: VariableCostItem[] = [
        { id: '1', name: 'AI', unit: 'calls', costPerUnit: 0.01, usagePerCustomer: 100, description: '' },
      ];
      const fixedCosts: FixedCostItem[] = [
        { id: '1', name: 'Server', monthlyCost: 50, description: '' },
      ];
      const breakdown = calculateCOGSBreakdown(variableCosts, fixedCosts, 0);

      expect(breakdown.fixedPerCustomer).toBe(0);
      expect(breakdown.totalCOGS).toBe(1); // Only variable costs
    });
  });
});
