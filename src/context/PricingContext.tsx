import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import {
  type VariableCostItem,
  type FixedCostItem,
  calculateCOGSBreakdown,
  calculateMargin,
  calculateProfit,
  getMarginStatus,
} from '../utils/costCalculator';
import { defaultTiers, type Tier } from '../data/tiers';
import { features as defaultFeatures, type Feature } from '../data/features';

// ============================================================================
// Types
// ============================================================================

export interface PricingState {
  // Cost data (from COGS)
  variableCosts: VariableCostItem[];
  fixedCosts: FixedCostItem[];

  // Pricing settings
  customerCount: number;
  selectedPrice: number;

  // Tier data
  tiers: Tier[];

  // Feature data
  features: Feature[];

  // Pricing scenario (from Calculator)
  utilizationRate: number;
  tierDistribution: Record<string, number>;
}

export interface PricingContextValue extends PricingState {
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

  // Actions - COGS
  setVariableCosts: (costs: VariableCostItem[]) => void;
  setFixedCosts: (costs: FixedCostItem[]) => void;
  updateVariableCost: (id: string, field: keyof VariableCostItem, value: string | number) => void;
  updateFixedCost: (id: string, field: keyof FixedCostItem, value: string | number) => void;
  addVariableCost: (cost: VariableCostItem) => void;
  addFixedCost: (cost: FixedCostItem) => void;
  removeVariableCost: (id: string) => void;
  removeFixedCost: (id: string) => void;

  // Actions - Pricing
  setCustomerCount: (count: number) => void;
  setSelectedPrice: (price: number) => void;

  // Actions - Tiers
  setTiers: (tiers: Tier[]) => void;
  updateTier: (tierId: string, updates: Partial<Tier>) => void;

  // Actions - Features
  setFeatures: (features: Feature[]) => void;
  addFeature: (feature: Feature) => void;
  updateFeature: (featureId: string, updates: Partial<Feature>) => void;
  removeFeature: (featureId: string) => void;
  importCodebaseFeatures: (features: Feature[]) => void;

  // Actions - Scenario
  setUtilizationRate: (rate: number) => void;
  setTierDistribution: (distribution: Record<string, number>) => void;

  // Actions - Utility
  resetToDefaults: () => void;
  loadPreset: (preset: { variableCosts: VariableCostItem[]; fixedCosts: FixedCostItem[] }) => void;
}

// ============================================================================
// Default Presets
// ============================================================================

export const COST_PRESETS = {
  'ai-saas': {
    name: 'AI/Document SaaS',
    description: 'AI-powered document processing, extraction, automation',
    variableCosts: [
      { id: 'ocr', name: 'Document scan (OCR)', unit: 'documents', costPerUnit: 0.15, usagePerCustomer: 20, description: 'Vision AI to extract text from images' },
      { id: 'ai-processing', name: 'AI processing', unit: 'items', costPerUnit: 0.008, usagePerCustomer: 150, description: 'LLM reasoning, classification, mapping' },
      { id: 'email', name: 'Transactional email', unit: 'emails', costPerUnit: 0.005, usagePerCustomer: 50, description: 'Notifications, alerts, reminders' },
      { id: 'storage', name: 'Cloud storage', unit: 'GB', costPerUnit: 0.07, usagePerCustomer: 2, description: 'File storage per month' },
    ],
    fixedCosts: [
      { id: 'database', name: 'Database', monthlyCost: 112, description: 'PostgreSQL, Supabase, etc.' },
      { id: 'compute', name: 'Compute', monthlyCost: 224, description: 'Servers, containers' },
      { id: 'apis', name: 'Third-party APIs', monthlyCost: 54, description: 'Currency, maps, etc.' },
      { id: 'monitoring', name: 'Monitoring', monthlyCost: 45, description: 'Logging, analytics' },
      { id: 'email-base', name: 'Email service', monthlyCost: 89, description: 'Base subscription' },
      { id: 'misc', name: 'Other', monthlyCost: 89, description: 'Domain, SSL, misc' },
    ],
  },
  'api-platform': {
    name: 'API Platform',
    description: 'API-as-a-service, developer tools',
    variableCosts: [
      { id: 'api-calls', name: 'API calls', unit: 'requests', costPerUnit: 0.0001, usagePerCustomer: 10000, description: 'Per API request processed' },
      { id: 'compute-time', name: 'Compute time', unit: 'seconds', costPerUnit: 0.00001, usagePerCustomer: 5000, description: 'CPU/GPU processing time' },
      { id: 'bandwidth', name: 'Bandwidth', unit: 'GB', costPerUnit: 0.05, usagePerCustomer: 5, description: 'Data transfer out' },
      { id: 'storage', name: 'Storage', unit: 'GB', costPerUnit: 0.02, usagePerCustomer: 1, description: 'Data storage' },
    ],
    fixedCosts: [
      { id: 'infrastructure', name: 'Infrastructure', monthlyCost: 500, description: 'Servers, load balancers' },
      { id: 'database', name: 'Database', monthlyCost: 200, description: 'Primary database' },
      { id: 'cdn', name: 'CDN', monthlyCost: 50, description: 'Content delivery' },
      { id: 'monitoring', name: 'Monitoring', monthlyCost: 100, description: 'APM, logging' },
    ],
  },
  'marketplace': {
    name: 'Marketplace/Platform',
    description: 'Two-sided marketplace, e-commerce platform',
    variableCosts: [
      { id: 'payment-processing', name: 'Payment processing', unit: 'transactions', costPerUnit: 0.50, usagePerCustomer: 10, description: '~2-3% + fixed per transaction' },
      { id: 'email', name: 'Emails', unit: 'emails', costPerUnit: 0.003, usagePerCustomer: 100, description: 'Order confirmations, notifications' },
      { id: 'sms', name: 'SMS notifications', unit: 'messages', costPerUnit: 0.05, usagePerCustomer: 10, description: 'Order updates, OTP' },
      { id: 'storage', name: 'Media storage', unit: 'GB', costPerUnit: 0.03, usagePerCustomer: 0.5, description: 'Product images, files' },
    ],
    fixedCosts: [
      { id: 'infrastructure', name: 'Infrastructure', monthlyCost: 300, description: 'Servers, CDN' },
      { id: 'database', name: 'Database', monthlyCost: 150, description: 'Primary + cache' },
      { id: 'search', name: 'Search service', monthlyCost: 100, description: 'Algolia, Elasticsearch' },
      { id: 'support-tools', name: 'Support tools', monthlyCost: 50, description: 'Helpdesk, chat' },
    ],
  },
  'empty': {
    name: 'Start from scratch',
    description: 'Build your own cost model',
    variableCosts: [
      { id: 'item-1', name: 'Cost item 1', unit: 'units', costPerUnit: 0.01, usagePerCustomer: 100, description: 'Description here' },
    ],
    fixedCosts: [
      { id: 'fixed-1', name: 'Fixed cost 1', monthlyCost: 100, description: 'Description here' },
    ],
  },
};

// ============================================================================
// Default State
// ============================================================================

const DEFAULT_STATE: PricingState = {
  variableCosts: COST_PRESETS['ai-saas'].variableCosts,
  fixedCosts: COST_PRESETS['ai-saas'].fixedCosts,
  customerCount: 200,
  selectedPrice: 25,
  tiers: defaultTiers,
  features: defaultFeatures,
  utilizationRate: 0.7,
  tierDistribution: {
    freemium: 50,
    basic: 30,
    pro: 15,
    enterprise: 5,
  },
};

// ============================================================================
// Storage
// ============================================================================

const STORAGE_KEY = 'cynco-pricing-state';

function loadFromStorage(): Partial<PricingState> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load pricing state from localStorage:', e);
  }
  return null;
}

function saveToStorage(state: PricingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save pricing state to localStorage:', e);
  }
}

// ============================================================================
// Context
// ============================================================================

const PricingContext = createContext<PricingContextValue | null>(null);

export function PricingProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage or defaults
  const [state, setState] = useState<PricingState>(() => {
    const stored = loadFromStorage();
    return stored ? { ...DEFAULT_STATE, ...stored } : DEFAULT_STATE;
  });

  // Save to localStorage on state change
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // -------------------------------------------------------------------------
  // Computed values
  // -------------------------------------------------------------------------

  const costs = useMemo(() => {
    return calculateCOGSBreakdown(
      state.variableCosts,
      state.fixedCosts,
      state.customerCount,
      1 // Don't apply utilization to COGS calculator view
    );
  }, [state.variableCosts, state.fixedCosts, state.customerCount]);

  const margin = useMemo(() => {
    return calculateMargin(state.selectedPrice, costs.totalCOGS);
  }, [state.selectedPrice, costs.totalCOGS]);

  const profit = useMemo(() => {
    return calculateProfit(state.selectedPrice, costs.totalCOGS);
  }, [state.selectedPrice, costs.totalCOGS]);

  const marginStatus = useMemo(() => {
    return getMarginStatus(margin);
  }, [margin]);

  // -------------------------------------------------------------------------
  // Actions - COGS
  // -------------------------------------------------------------------------

  const setVariableCosts = useCallback((costs: VariableCostItem[]) => {
    setState(prev => ({ ...prev, variableCosts: costs }));
  }, []);

  const setFixedCosts = useCallback((costs: FixedCostItem[]) => {
    setState(prev => ({ ...prev, fixedCosts: costs }));
  }, []);

  const updateVariableCost = useCallback((id: string, field: keyof VariableCostItem, value: string | number) => {
    setState(prev => ({
      ...prev,
      variableCosts: prev.variableCosts.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }, []);

  const updateFixedCost = useCallback((id: string, field: keyof FixedCostItem, value: string | number) => {
    setState(prev => ({
      ...prev,
      fixedCosts: prev.fixedCosts.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }, []);

  const addVariableCost = useCallback((cost: VariableCostItem) => {
    setState(prev => ({
      ...prev,
      variableCosts: [...prev.variableCosts, cost],
    }));
  }, []);

  const addFixedCost = useCallback((cost: FixedCostItem) => {
    setState(prev => ({
      ...prev,
      fixedCosts: [...prev.fixedCosts, cost],
    }));
  }, []);

  const removeVariableCost = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      variableCosts: prev.variableCosts.filter(item => item.id !== id),
    }));
  }, []);

  const removeFixedCost = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      fixedCosts: prev.fixedCosts.filter(item => item.id !== id),
    }));
  }, []);

  // -------------------------------------------------------------------------
  // Actions - Pricing
  // -------------------------------------------------------------------------

  const setCustomerCount = useCallback((count: number) => {
    setState(prev => ({ ...prev, customerCount: Math.max(1, count) }));
  }, []);

  const setSelectedPrice = useCallback((price: number) => {
    setState(prev => ({ ...prev, selectedPrice: Math.max(0, price) }));
  }, []);

  // -------------------------------------------------------------------------
  // Actions - Tiers
  // -------------------------------------------------------------------------

  const setTiers = useCallback((tiers: Tier[]) => {
    setState(prev => ({ ...prev, tiers }));
  }, []);

  const updateTier = useCallback((tierId: string, updates: Partial<Tier>) => {
    setState(prev => ({
      ...prev,
      tiers: prev.tiers.map(tier =>
        tier.id === tierId ? { ...tier, ...updates } : tier
      ),
    }));
  }, []);

  // -------------------------------------------------------------------------
  // Actions - Features
  // -------------------------------------------------------------------------

  const setFeatures = useCallback((features: Feature[]) => {
    setState(prev => ({ ...prev, features }));
  }, []);

  const addFeature = useCallback((feature: Feature) => {
    setState(prev => ({
      ...prev,
      features: [...prev.features, feature],
    }));
  }, []);

  const updateFeature = useCallback((featureId: string, updates: Partial<Feature>) => {
    setState(prev => ({
      ...prev,
      features: prev.features.map(feature =>
        feature.id === featureId ? { ...feature, ...updates } : feature
      ),
    }));
  }, []);

  const removeFeature = useCallback((featureId: string) => {
    setState(prev => ({
      ...prev,
      features: prev.features.filter(feature => feature.id !== featureId),
    }));
  }, []);

  const importCodebaseFeatures = useCallback((newFeatures: Feature[]) => {
    setState(prev => {
      // Replace existing codebase features, keep manual features
      const manualFeatures = prev.features.filter(f => f.source === 'manual');
      return {
        ...prev,
        features: [...newFeatures, ...manualFeatures],
      };
    });
  }, []);

  // -------------------------------------------------------------------------
  // Actions - Scenario
  // -------------------------------------------------------------------------

  const setUtilizationRate = useCallback((rate: number) => {
    setState(prev => ({ ...prev, utilizationRate: Math.min(1, Math.max(0, rate)) }));
  }, []);

  const setTierDistribution = useCallback((distribution: Record<string, number>) => {
    setState(prev => ({ ...prev, tierDistribution: distribution }));
  }, []);

  // -------------------------------------------------------------------------
  // Actions - Utility
  // -------------------------------------------------------------------------

  const resetToDefaults = useCallback(() => {
    setState(DEFAULT_STATE);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const loadPreset = useCallback((preset: { variableCosts: VariableCostItem[]; fixedCosts: FixedCostItem[] }) => {
    setState(prev => ({
      ...prev,
      variableCosts: [...preset.variableCosts],
      fixedCosts: [...preset.fixedCosts],
    }));
  }, []);

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------

  const value: PricingContextValue = {
    // State
    ...state,
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
    setTiers,
    updateTier,
    setFeatures,
    addFeature,
    updateFeature,
    removeFeature,
    importCodebaseFeatures,
    setUtilizationRate,
    setTierDistribution,
    resetToDefaults,
    loadPreset,
  };

  return (
    <PricingContext.Provider value={value}>
      {children}
    </PricingContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function usePricing(): PricingContextValue {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error('usePricing must be used within a PricingProvider');
  }
  return context;
}

// Re-export types for convenience
export type { VariableCostItem, FixedCostItem } from '../utils/costCalculator';
export type { Feature, FeatureSource } from '../data/features';
