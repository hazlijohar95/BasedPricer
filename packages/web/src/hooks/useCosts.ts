/**
 * Focused hook for cost management
 * Provides a subset of PricingContext for components that only need cost data
 */

import { usePricing } from '../context/PricingContext';
import type { VariableCostItem, FixedCostItem } from '../utils/costCalculator';

export interface UseCostsReturn {
  // State
  variableCosts: VariableCostItem[];
  fixedCosts: FixedCostItem[];
  customerCount: number;
  selectedPrice: number;
  utilizationRate: number;

  // Computed
  costs: {
    variableTotal: number;
    fixedTotal: number;
    fixedPerCustomer: number;
    totalCOGS: number;
  };
  margin: number;
  profit: number;
  marginStatus: 'great' | 'ok' | 'low';

  // Actions
  setVariableCosts: (costs: VariableCostItem[]) => void;
  setFixedCosts: (costs: FixedCostItem[]) => void;
  updateVariableCost: (id: string, field: keyof VariableCostItem, value: string | number) => void;
  updateFixedCost: (id: string, field: keyof FixedCostItem, value: string | number) => void;
  addVariableCost: (cost: VariableCostItem) => void;
  addFixedCost: (cost: FixedCostItem) => void;
  removeVariableCost: (id: string) => void;
  removeFixedCost: (id: string) => void;
  setCustomerCount: (count: number) => void;
  setSelectedPrice: (price: number) => void;
  setUtilizationRate: (rate: number) => void;
}

/**
 * Hook for cost-related state and actions
 * Use this instead of usePricing when you only need cost functionality
 */
export function useCosts(): UseCostsReturn {
  const {
    variableCosts,
    fixedCosts,
    customerCount,
    selectedPrice,
    utilizationRate,
    costs,
    margin,
    profit,
    marginStatus,
    setVariableCosts,
    setFixedCosts,
    updateVariableCost,
    updateFixedCost,
    addVariableCost,
    addFixedCost,
    removeVariableCost,
    removeFixedCost,
    setCustomerCount,
    setSelectedPrice,
    setUtilizationRate,
  } = usePricing();

  return {
    variableCosts,
    fixedCosts,
    customerCount,
    selectedPrice,
    utilizationRate,
    costs,
    margin,
    profit,
    marginStatus,
    setVariableCosts,
    setFixedCosts,
    updateVariableCost,
    updateFixedCost,
    addVariableCost,
    addFixedCost,
    removeVariableCost,
    removeFixedCost,
    setCustomerCount,
    setSelectedPrice,
    setUtilizationRate,
  };
}
