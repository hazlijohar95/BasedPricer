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
import { type BusinessType, type PricingModelType, BUSINESS_TYPES } from '../data/business-types';
import { getTierTemplatesForBusinessType, convertTemplatesToTiers } from '../data/tier-templates';
import type { ToastData } from '../components/shared/Toast';

// ============================================================================
// Types
// ============================================================================

export type CtaStyle = 'primary' | 'secondary' | 'outline';

export interface TierDisplayConfig {
  highlighted: boolean;
  highlightedFeatures: string[];
  ctaText: string;
  ctaStyle: CtaStyle;
  badgeText: string;
  showLimits: boolean;
  maxVisibleFeatures: number;
  monthlyPrice: number;
  annualPrice: number;
  tagline: string;
}

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

  // Tier display configs (for mockup persistence)
  tierDisplayConfigs: Record<string, TierDisplayConfig>;

  // Pricing scenario (from Calculator)
  utilizationRate: number;
  tierDistribution: Record<string, number>;

  // Business type (from analysis)
  businessType: BusinessType | null;
  businessTypeConfidence: number;
  pricingModelType: PricingModelType;
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

  // Actions - Tier Display Configs (for mockup)
  setTierDisplayConfig: (tierId: string, config: Partial<TierDisplayConfig>) => void;
  setTierDisplayConfigs: (configs: Record<string, TierDisplayConfig>) => void;
  initializeTierDisplayConfigs: () => void;

  // Actions - Features
  setFeatures: (features: Feature[]) => void;
  addFeature: (feature: Feature) => void;
  updateFeature: (featureId: string, updates: Partial<Feature>) => void;
  removeFeature: (featureId: string) => void;
  importCodebaseFeatures: (features: Feature[]) => void;

  // Actions - Scenario
  setUtilizationRate: (rate: number) => void;
  setTierDistribution: (distribution: Record<string, number>) => void;

  // Actions - Business Type
  setBusinessType: (type: BusinessType, confidence: number) => void;
  setPricingModelType: (model: PricingModelType) => void;
  applyBusinessTypeTemplate: (businessType: BusinessType) => void;

  // Actions - Tier Management
  setTierCount: (count: number) => void;
  addTier: () => void;
  removeTier: (tierId: string) => void;

  // Actions - Utility
  resetToDefaults: () => void;
  resetToEmpty: () => void;
  loadPreset: (preset: { variableCosts: VariableCostItem[]; fixedCosts: FixedCostItem[] }) => void;

  // Toast system
  toasts: ToastData[];
  showToast: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

// ============================================================================
// Tier Display Config Helpers
// ============================================================================

function createDefaultTierDisplayConfig(tier: Tier, index: number): TierDisplayConfig {
  const isFirstPaidTier = tier.monthlyPriceMYR > 0 && index <= 1;
  return {
    highlighted: isFirstPaidTier,
    highlightedFeatures: [...tier.highlightFeatures],
    ctaText: tier.monthlyPriceMYR === 0 ? 'Get Started Free'
      : isFirstPaidTier ? 'Start Free Trial'
      : 'Contact Sales',
    ctaStyle: isFirstPaidTier ? 'primary' : tier.monthlyPriceMYR === 0 ? 'outline' : 'secondary',
    monthlyPrice: tier.monthlyPriceMYR,
    annualPrice: tier.annualPriceMYR,
    tagline: tier.tagline,
    badgeText: 'Most Popular',
    showLimits: true,
    maxVisibleFeatures: 6,
  };
}

function createTierDisplayConfigsFromTiers(tiers: Tier[]): Record<string, TierDisplayConfig> {
  const configs: Record<string, TierDisplayConfig> = {};
  tiers.forEach((tier, index) => {
    configs[tier.id] = createDefaultTierDisplayConfig(tier, index);
  });
  return configs;
}

// ============================================================================
// Default Presets
// ============================================================================

// eslint-disable-next-line react-refresh/only-export-components
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
  tierDisplayConfigs: createTierDisplayConfigsFromTiers(defaultTiers),
  utilizationRate: 0.7,
  tierDistribution: {
    freemium: 50,
    basic: 30,
    pro: 15,
    enterprise: 5,
  },
  businessType: null,
  businessTypeConfidence: 0,
  pricingModelType: 'feature_tiered',
};

// Empty state for fresh start
const EMPTY_STATE: PricingState = {
  variableCosts: [],
  fixedCosts: [],
  customerCount: 100,
  selectedPrice: 0,
  tiers: [
    {
      id: 'free',
      name: 'Free',
      tagline: 'Get started',
      targetAudience: 'Individual users',
      monthlyPriceMYR: 0,
      annualPriceMYR: 0,
      annualDiscount: 0,
      status: 'active',
      limits: [],
      includedFeatures: [],
      excludedFeatures: [],
      highlightFeatures: [],
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'For professionals',
      targetAudience: 'Power users',
      monthlyPriceMYR: 0,
      annualPriceMYR: 0,
      annualDiscount: 20,
      status: 'active',
      limits: [],
      includedFeatures: [],
      excludedFeatures: [],
      highlightFeatures: [],
    },
  ],
  features: [],
  tierDisplayConfigs: {
    free: {
      highlighted: false,
      highlightedFeatures: [],
      ctaText: 'Get Started Free',
      ctaStyle: 'outline',
      badgeText: '',
      showLimits: true,
      maxVisibleFeatures: 6,
      monthlyPrice: 0,
      annualPrice: 0,
      tagline: 'Get started',
    },
    pro: {
      highlighted: true,
      highlightedFeatures: [],
      ctaText: 'Start Free Trial',
      ctaStyle: 'primary',
      badgeText: 'Most Popular',
      showLimits: true,
      maxVisibleFeatures: 6,
      monthlyPrice: 0,
      annualPrice: 0,
      tagline: 'For professionals',
    },
  },
  utilizationRate: 0.7,
  tierDistribution: {
    free: 70,
    pro: 30,
  },
  businessType: null,
  businessTypeConfidence: 0,
  pricingModelType: 'feature_tiered',
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

  // Toast state (not persisted)
  const [toasts, setToasts] = useState<ToastData[]>([]);

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
  // Actions - Tier Display Configs
  // -------------------------------------------------------------------------

  const setTierDisplayConfig = useCallback((tierId: string, config: Partial<TierDisplayConfig>) => {
    setState(prev => {
      // Validate that the tier exists
      const tier = prev.tiers.find(t => t.id === tierId);
      if (!tier) {
        console.warn(`setTierDisplayConfig: Tier '${tierId}' not found, skipping update`);
        return prev;
      }

      const tierIndex = prev.tiers.findIndex(t => t.id === tierId);
      const existingConfig = prev.tierDisplayConfigs[tierId];
      const baseConfig = existingConfig || createDefaultTierDisplayConfig(tier, tierIndex);

      return {
        ...prev,
        tierDisplayConfigs: {
          ...prev.tierDisplayConfigs,
          [tierId]: {
            ...baseConfig,
            ...config,
          },
        },
      };
    });
  }, []);

  const setTierDisplayConfigs = useCallback((configs: Record<string, TierDisplayConfig>) => {
    setState(prev => ({ ...prev, tierDisplayConfigs: configs }));
  }, []);

  const initializeTierDisplayConfigs = useCallback(() => {
    setState(prev => ({
      ...prev,
      tierDisplayConfigs: createTierDisplayConfigsFromTiers(prev.tiers),
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
  // Actions - Business Type
  // -------------------------------------------------------------------------

  const setBusinessType = useCallback((type: BusinessType, confidence: number) => {
    setState(prev => ({
      ...prev,
      businessType: type,
      businessTypeConfidence: confidence,
      pricingModelType: BUSINESS_TYPES[type]?.pricingModel ?? 'feature_tiered',
    }));
  }, []);

  const setPricingModelType = useCallback((model: PricingModelType) => {
    setState(prev => ({ ...prev, pricingModelType: model }));
  }, []);

  const applyBusinessTypeTemplate = useCallback((businessType: BusinessType) => {
    const templateSet = getTierTemplatesForBusinessType(businessType);
    const newTiers = convertTemplatesToTiers(templateSet.tiers, businessType);
    setState(prev => ({
      ...prev,
      businessType,
      pricingModelType: BUSINESS_TYPES[businessType]?.pricingModel ?? 'feature_tiered',
      tiers: newTiers,
    }));
  }, []);

  // -------------------------------------------------------------------------
  // Actions - Tier Management
  // -------------------------------------------------------------------------

  const setTierCount = useCallback((count: number) => {
    setState(prev => {
      const currentCount = prev.tiers.length;
      if (count === currentCount) return prev;

      if (count > currentCount) {
        // Add tiers - use single timestamp base to avoid ID collision in fast loops
        const baseTimestamp = Date.now();
        const newTiers = [...prev.tiers];
        for (let i = currentCount; i < count; i++) {
          newTiers.push({
            id: `tier-${baseTimestamp}-${i}`,
            name: `Tier ${i + 1}`,
            tagline: 'New tier',
            targetAudience: 'Describe target audience',
            monthlyPriceMYR: 0,
            annualPriceMYR: 0,
            annualDiscount: 17,
            status: 'coming_soon',
            limits: [],
            includedFeatures: [],
            excludedFeatures: [],
            highlightFeatures: [],
          });
        }
        return { ...prev, tiers: newTiers };
      } else {
        // Remove tiers from the end
        return { ...prev, tiers: prev.tiers.slice(0, count) };
      }
    });
  }, []);

  const addTier = useCallback(() => {
    setState(prev => ({
      ...prev,
      tiers: [
        ...prev.tiers,
        {
          id: `tier-${Date.now()}`,
          name: `Tier ${prev.tiers.length + 1}`,
          tagline: 'New tier',
          targetAudience: 'Describe target audience',
          monthlyPriceMYR: 0,
          annualPriceMYR: 0,
          annualDiscount: 17,
          status: 'coming_soon',
          limits: [],
          includedFeatures: [],
          excludedFeatures: [],
          highlightFeatures: [],
        },
      ],
    }));
  }, []);

  const removeTier = useCallback((tierId: string) => {
    setState(prev => ({
      ...prev,
      tiers: prev.tiers.filter(t => t.id !== tierId),
    }));
  }, []);

  // -------------------------------------------------------------------------
  // Actions - Utility
  // -------------------------------------------------------------------------

  const resetToDefaults = useCallback(() => {
    setState(DEFAULT_STATE);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const resetToEmpty = useCallback(() => {
    setState(EMPTY_STATE);
    // Clear all related storage keys
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('cynco-pricing-costs');
  }, []);

  const loadPreset = useCallback((preset: { variableCosts: VariableCostItem[]; fixedCosts: FixedCostItem[] }) => {
    setState(prev => ({
      ...prev,
      variableCosts: [...preset.variableCosts],
      fixedCosts: [...preset.fixedCosts],
    }));
  }, []);

  // -------------------------------------------------------------------------
  // Actions - Toast
  // -------------------------------------------------------------------------

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // -------------------------------------------------------------------------
  // Context value (memoized to prevent unnecessary re-renders)
  // -------------------------------------------------------------------------

  const value = useMemo<PricingContextValue>(() => ({
    // State
    ...state,
    // Computed
    costs,
    margin,
    profit,
    marginStatus,
    // Actions (all wrapped in useCallback, stable references)
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
    setTierDisplayConfig,
    setTierDisplayConfigs,
    initializeTierDisplayConfigs,
    setFeatures,
    addFeature,
    updateFeature,
    removeFeature,
    importCodebaseFeatures,
    setUtilizationRate,
    setTierDistribution,
    setBusinessType,
    setPricingModelType,
    applyBusinessTypeTemplate,
    setTierCount,
    addTier,
    removeTier,
    resetToDefaults,
    resetToEmpty,
    loadPreset,
    // Toast
    toasts,
    showToast,
    dismissToast,
  }), [
    state,
    costs,
    margin,
    profit,
    marginStatus,
    toasts,
    // Actions are stable (useCallback with empty or stable deps)
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
    setTierDisplayConfig,
    setTierDisplayConfigs,
    initializeTierDisplayConfigs,
    setFeatures,
    addFeature,
    updateFeature,
    removeFeature,
    importCodebaseFeatures,
    setUtilizationRate,
    setTierDistribution,
    setBusinessType,
    setPricingModelType,
    applyBusinessTypeTemplate,
    setTierCount,
    addTier,
    removeTier,
    resetToDefaults,
    resetToEmpty,
    loadPreset,
    showToast,
    dismissToast,
  ]);

  return (
    <PricingContext.Provider value={value}>
      {children}
    </PricingContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

// eslint-disable-next-line react-refresh/only-export-components
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
export type { BusinessType, PricingModelType } from '../data/business-types';
