/**
 * Consolidated cost calculation hook
 * Single source of truth for all cost calculations across the app
 *
 * This hook provides:
 * - costRates: Derived cost rates from variable costs
 * - cogsBreakdown: Complete COGS breakdown (variable, fixed, total)
 * - tierCosts: Map of tier ID to variable costs and margins
 * - realisticCosts: Costs with utilization rate applied
 */

import { useMemo, useCallback } from 'react';
import { usePricing } from '../context/PricingContext';
import { deriveCostRatesFromVariableCosts, type CostRates } from '../utils/costRates';
import {
  calculateCOGSBreakdown,
  calculateMargin,
  calculateProfit,
  getMarginStatus,
  type CostBreakdown,
} from '../utils/costCalculator';
import { calculateTierVariableCosts, type Tier } from '../data/tiers';

export interface TierCostData {
  variableCosts: {
    extraction: number;
    email: number;
    storage: number;
    total: number;
  };
  margin: number;
  profit: number;
  marginStatus: 'great' | 'ok' | 'low';
}

export interface CostCalculationsResult {
  // Cost rates derived from variable costs (for use in tier calculations)
  costRates: CostRates;

  // Full COGS breakdown at 100% utilization
  cogsBreakdown: CostBreakdown;

  // COGS breakdown with utilization rate applied
  realisticCogsBreakdown: CostBreakdown;

  // Margin calculations at selected price point
  margin: number;
  realisticMargin: number;
  profit: number;
  realisticProfit: number;
  marginStatus: 'great' | 'ok' | 'low';
  realisticMarginStatus: 'great' | 'ok' | 'low';

  // Per-tier cost data
  tierCosts: Map<string, TierCostData>;

  // Helper functions
  getTierCost: (tierId: string) => TierCostData | undefined;
  calculateTierMargin: (tier: Tier) => { margin: number; profit: number; status: 'great' | 'ok' | 'low' };
}

/**
 * Consolidated cost calculation hook
 * Use this hook in components that need cost data to ensure consistency
 */
export function useCostCalculations(): CostCalculationsResult {
  const {
    variableCosts,
    fixedCosts,
    customerCount,
    selectedPrice,
    utilizationRate,
    tiers,
  } = usePricing();

  // Derive cost rates from variable costs
  const costRates = useMemo(() => {
    return deriveCostRatesFromVariableCosts(variableCosts);
  }, [variableCosts]);

  // Calculate COGS breakdown at 100% utilization (max usage)
  const cogsBreakdown = useMemo(() => {
    return calculateCOGSBreakdown(variableCosts, fixedCosts, customerCount, 1);
  }, [variableCosts, fixedCosts, customerCount]);

  // Calculate COGS breakdown with utilization rate applied
  const realisticCogsBreakdown = useMemo(() => {
    return calculateCOGSBreakdown(variableCosts, fixedCosts, customerCount, utilizationRate);
  }, [variableCosts, fixedCosts, customerCount, utilizationRate]);

  // Margin calculations at 100% utilization
  const margin = useMemo(() => {
    return calculateMargin(selectedPrice, cogsBreakdown.totalCOGS);
  }, [selectedPrice, cogsBreakdown.totalCOGS]);

  const profit = useMemo(() => {
    return calculateProfit(selectedPrice, cogsBreakdown.totalCOGS);
  }, [selectedPrice, cogsBreakdown.totalCOGS]);

  const marginStatus = useMemo(() => {
    return getMarginStatus(margin);
  }, [margin]);

  // Realistic margin calculations with utilization rate
  const realisticMargin = useMemo(() => {
    return calculateMargin(selectedPrice, realisticCogsBreakdown.totalCOGS);
  }, [selectedPrice, realisticCogsBreakdown.totalCOGS]);

  const realisticProfit = useMemo(() => {
    return calculateProfit(selectedPrice, realisticCogsBreakdown.totalCOGS);
  }, [selectedPrice, realisticCogsBreakdown.totalCOGS]);

  const realisticMarginStatus = useMemo(() => {
    return getMarginStatus(realisticMargin);
  }, [realisticMargin]);

  // Calculate costs for all tiers
  const tierCosts = useMemo(() => {
    const costsMap = new Map<string, TierCostData>();

    tiers.forEach((tier) => {
      const tierVariableCosts = calculateTierVariableCosts(tier, utilizationRate, costRates);
      const tierMargin = tier.monthlyPriceMYR > 0
        ? ((tier.monthlyPriceMYR - tierVariableCosts.total) / tier.monthlyPriceMYR) * 100
        : 0;
      const tierProfit = tier.monthlyPriceMYR - tierVariableCosts.total;
      const tierMarginStatus = getMarginStatus(tierMargin);

      costsMap.set(tier.id, {
        variableCosts: tierVariableCosts,
        margin: tierMargin,
        profit: tierProfit,
        marginStatus: tierMarginStatus,
      });
    });

    return costsMap;
  }, [tiers, utilizationRate, costRates]);

  // Helper to get tier cost data - use useCallback for stable function reference
  const getTierCost = useCallback((tierId: string) => {
    return tierCosts.get(tierId);
  }, [tierCosts]);

  // Helper to calculate margin for a specific tier - use useCallback for stable function reference
  const calculateTierMargin = useCallback((tier: Tier) => {
    const tierVariableCosts = calculateTierVariableCosts(tier, utilizationRate, costRates);
    const tierMargin = tier.monthlyPriceMYR > 0
      ? ((tier.monthlyPriceMYR - tierVariableCosts.total) / tier.monthlyPriceMYR) * 100
      : 0;
    const tierProfit = tier.monthlyPriceMYR - tierVariableCosts.total;

    return {
      margin: tierMargin,
      profit: tierProfit,
      status: getMarginStatus(tierMargin),
    };
  }, [utilizationRate, costRates]);

  return {
    costRates,
    cogsBreakdown,
    realisticCogsBreakdown,
    margin,
    realisticMargin,
    profit,
    realisticProfit,
    marginStatus,
    realisticMarginStatus,
    tierCosts,
    getTierCost,
    calculateTierMargin,
  };
}
