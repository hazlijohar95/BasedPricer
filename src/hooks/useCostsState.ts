/**
 * Internal state management hook for costs
 * Used by PricingContext to manage cost-related state
 *
 * This hook contains the actual state logic, while useCosts remains a facade
 * that selects from the context for consumer components.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  type VariableCostItem,
  type FixedCostItem,
  calculateCOGSBreakdown,
  calculateMargin,
  calculateProfit,
  getMarginStatus,
} from '../utils/costCalculator';

// ============================================================================
// Types
// ============================================================================

export interface CostsStateValue {
  // State
  variableCosts: VariableCostItem[];
  fixedCosts: FixedCostItem[];
  customerCount: number;
  selectedPrice: number;

  // Computed values
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
}

export interface CostsStateInitialValues {
  variableCosts: VariableCostItem[];
  fixedCosts: FixedCostItem[];
  customerCount: number;
  selectedPrice: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Internal hook for managing cost state
 * Contains all the COGS-related state management logic
 */
export function useCostsState(initialValues: CostsStateInitialValues): CostsStateValue {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [variableCosts, setVariableCostsState] = useState<VariableCostItem[]>(
    initialValues.variableCosts
  );
  const [fixedCosts, setFixedCostsState] = useState<FixedCostItem[]>(
    initialValues.fixedCosts
  );
  const [customerCount, setCustomerCountState] = useState<number>(
    initialValues.customerCount
  );
  const [selectedPrice, setSelectedPriceState] = useState<number>(
    initialValues.selectedPrice
  );

  // -------------------------------------------------------------------------
  // Computed values
  // -------------------------------------------------------------------------

  const costs = useMemo(() => {
    return calculateCOGSBreakdown(
      variableCosts,
      fixedCosts,
      customerCount,
      1 // Don't apply utilization to COGS calculator view
    );
  }, [variableCosts, fixedCosts, customerCount]);

  const margin = useMemo(() => {
    return calculateMargin(selectedPrice, costs.totalCOGS);
  }, [selectedPrice, costs.totalCOGS]);

  const profit = useMemo(() => {
    return calculateProfit(selectedPrice, costs.totalCOGS);
  }, [selectedPrice, costs.totalCOGS]);

  const marginStatus = useMemo(() => {
    return getMarginStatus(margin);
  }, [margin]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const setVariableCosts = useCallback((costs: VariableCostItem[]) => {
    setVariableCostsState(costs);
  }, []);

  const setFixedCosts = useCallback((costs: FixedCostItem[]) => {
    setFixedCostsState(costs);
  }, []);

  const updateVariableCost = useCallback((id: string, field: keyof VariableCostItem, value: string | number) => {
    setVariableCostsState(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  }, []);

  const updateFixedCost = useCallback((id: string, field: keyof FixedCostItem, value: string | number) => {
    setFixedCostsState(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  }, []);

  const addVariableCost = useCallback((cost: VariableCostItem) => {
    setVariableCostsState(prev => [...prev, cost]);
  }, []);

  const addFixedCost = useCallback((cost: FixedCostItem) => {
    setFixedCostsState(prev => [...prev, cost]);
  }, []);

  const removeVariableCost = useCallback((id: string) => {
    setVariableCostsState(prev => prev.filter(item => item.id !== id));
  }, []);

  const removeFixedCost = useCallback((id: string) => {
    setFixedCostsState(prev => prev.filter(item => item.id !== id));
  }, []);

  const setCustomerCount = useCallback((count: number) => {
    setCustomerCountState(Math.max(1, count));
  }, []);

  const setSelectedPrice = useCallback((price: number) => {
    setSelectedPriceState(Math.max(0, price));
  }, []);

  // -------------------------------------------------------------------------
  // Return value
  // -------------------------------------------------------------------------

  return {
    // State
    variableCosts,
    fixedCosts,
    customerCount,
    selectedPrice,

    // Computed
    costs,
    margin,
    profit,
    marginStatus,

    // Actions
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
  };
}
