import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react';
import { generateId } from '@basedpricer/core';
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
import { COST_PRESETS } from '../data/cost-presets';
import type { ToastData } from '../components/shared/Toast';
import {
  DEFAULT_CURRENCY,
  type CurrencyCode,
  STORAGE_KEY,
  PROJECTS_INDEX_KEY,
  PROJECT_PREFIX,
  CURRENT_PROJECT_KEY,
  DEFAULT_PROJECT_NAME,
} from '../constants';

// Re-export COST_PRESETS for backwards compatibility
export { COST_PRESETS } from '../data/cost-presets';
export type { CostPreset, CostPresetKey } from '../data/cost-presets';

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

  // Currency settings
  currency: CurrencyCode;

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

  // First visit flag for onboarding
  isFirstVisit: boolean;
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

  // Actions - Currency
  setCurrency: (currency: CurrencyCode) => void;

  // Actions - Onboarding
  setIsFirstVisit: (isFirst: boolean) => void;
  completeOnboarding: () => void;

  // Actions - Utility
  resetToDefaults: () => void;
  resetToEmpty: () => void;
  loadPreset: (preset: { variableCosts: VariableCostItem[]; fixedCosts: FixedCostItem[] }) => void;

  // Actions - Project Management
  currentProjectName: string;
  listProjects: () => string[];
  saveProject: (name: string) => void;
  loadProject: (name: string) => boolean;
  deleteProject: (name: string) => void;
  renameProject: (newName: string) => void;

  // Toast system
  toasts: ToastData[];
  showToast: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
  dismissToast: (id: string) => void;

  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
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
// Default State
// ============================================================================

const DEFAULT_STATE: PricingState = {
  variableCosts: COST_PRESETS['ai-saas'].variableCosts,
  fixedCosts: COST_PRESETS['ai-saas'].fixedCosts,
  customerCount: 200,
  selectedPrice: 25,
  currency: DEFAULT_CURRENCY,
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
  isFirstVisit: true, // Will be checked against localStorage
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
  currency: DEFAULT_CURRENCY,
  isFirstVisit: false, // Empty state means user chose to start fresh
};

// ============================================================================
// Storage
// ============================================================================

/**
 * Validates that loaded state has the expected structure
 * Returns sanitized partial state or null if invalid
 */
function validateLoadedState(data: unknown): Partial<PricingState> | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const state = data as Record<string, unknown>;

  // Validate core arrays exist and are arrays
  if (state.variableCosts && !Array.isArray(state.variableCosts)) {
    console.warn('Invalid variableCosts in loaded state');
    return null;
  }
  if (state.fixedCosts && !Array.isArray(state.fixedCosts)) {
    console.warn('Invalid fixedCosts in loaded state');
    return null;
  }
  if (state.tiers && !Array.isArray(state.tiers)) {
    console.warn('Invalid tiers in loaded state');
    return null;
  }
  if (state.features && !Array.isArray(state.features)) {
    console.warn('Invalid features in loaded state');
    return null;
  }

  // Validate numeric fields
  if (state.customerCount !== undefined && typeof state.customerCount !== 'number') {
    console.warn('Invalid customerCount in loaded state');
    return null;
  }
  if (state.selectedPrice !== undefined && typeof state.selectedPrice !== 'number') {
    console.warn('Invalid selectedPrice in loaded state');
    return null;
  }

  return state as Partial<PricingState>;
}

function loadFromStorage(): Partial<PricingState> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return validateLoadedState(parsed);
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

// Project management helpers
function getProjectsList(): string[] {
  try {
    const stored = localStorage.getItem(PROJECTS_INDEX_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveProjectsList(projects: string[]): void {
  try {
    localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(projects));
  } catch (e) {
    console.warn('Failed to save projects list:', e);
  }
}

function saveProjectData(name: string, state: PricingState): void {
  try {
    localStorage.setItem(PROJECT_PREFIX + name, JSON.stringify(state));
    // Update projects list if not already included
    const projects = getProjectsList();
    if (!projects.includes(name)) {
      saveProjectsList([...projects, name]);
    }
  } catch (e) {
    console.warn('Failed to save project:', e);
  }
}

function loadProjectData(name: string): Partial<PricingState> | null {
  try {
    const stored = localStorage.getItem(PROJECT_PREFIX + name);
    if (stored) {
      const parsed = JSON.parse(stored);
      return validateLoadedState(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

function deleteProjectData(name: string): void {
  try {
    localStorage.removeItem(PROJECT_PREFIX + name);
    const projects = getProjectsList().filter(p => p !== name);
    saveProjectsList(projects);
  } catch (e) {
    console.warn('Failed to delete project:', e);
  }
}

function getCurrentProjectName(): string {
  try {
    return localStorage.getItem(CURRENT_PROJECT_KEY) || DEFAULT_PROJECT_NAME;
  } catch {
    return DEFAULT_PROJECT_NAME;
  }
}

function setCurrentProjectNameStorage(name: string): void {
  try {
    localStorage.setItem(CURRENT_PROJECT_KEY, name);
  } catch (e) {
    console.warn('Failed to save current project name:', e);
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
    const onboardingComplete = localStorage.getItem('cynco-onboarding-complete') === 'true';

    // If we have stored data, user has used the app before
    // Also check if onboarding was explicitly completed
    const isFirstVisit = !stored && !onboardingComplete;

    if (stored) {
      return {
        ...DEFAULT_STATE,
        ...stored,
        isFirstVisit,
        currency: stored.currency || DEFAULT_CURRENCY,
      };
    }

    return {
      ...DEFAULT_STATE,
      isFirstVisit,
    };
  });

  // Toast state (not persisted)
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Project name state
  const [currentProjectName, setCurrentProjectName] = useState<string>(() => getCurrentProjectName());

  // Undo/Redo history (not persisted)
  // Using a version counter instead of boolean flag to handle rapid state changes
  const HISTORY_LIMIT = 50;
  const [history, setHistory] = useState<PricingState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const undoRedoVersion = useRef(0);
  const lastProcessedVersion = useRef(0);

  // Track state changes for undo/redo (skip if this is an undo/redo action itself)
  useEffect(() => {
    // If version changed, this state change came from undo/redo - skip it
    if (undoRedoVersion.current !== lastProcessedVersion.current) {
      lastProcessedVersion.current = undoRedoVersion.current;
      return;
    }

    // Add current state to history
    setHistory(prev => {
      // If we're not at the end of history, truncate future states
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add new state
      newHistory.push(state);
      // Limit history size
      if (newHistory.length > HISTORY_LIMIT) {
        return newHistory.slice(-HISTORY_LIMIT);
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, HISTORY_LIMIT - 1));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      // Increment version to signal this is an undo action
      undoRedoVersion.current += 1;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      // Increment version to signal this is a redo action
      undoRedoVersion.current += 1;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [history, historyIndex]);

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
    // Validate input is a finite positive number
    if (!Number.isFinite(count) || count < 1) {
      console.warn(`setCustomerCount: Invalid count ${count}, using minimum of 1`);
      count = 1;
    }
    setState(prev => ({ ...prev, customerCount: Math.floor(Math.max(1, count)) }));
  }, []);

  const setSelectedPrice = useCallback((price: number) => {
    // Validate input is a finite non-negative number
    if (!Number.isFinite(price) || price < 0) {
      console.warn(`setSelectedPrice: Invalid price ${price}, using 0`);
      price = 0;
    }
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
    setState(prev => {
      // Remove the feature from the features array
      const updatedFeatures = prev.features.filter(feature => feature.id !== featureId);

      // Cascade cleanup: remove the feature from all tier references
      const updatedTiers = prev.tiers.map(tier => ({
        ...tier,
        includedFeatures: tier.includedFeatures.filter(id => id !== featureId),
        excludedFeatures: tier.excludedFeatures.filter(id => id !== featureId),
        highlightFeatures: tier.highlightFeatures.filter(id => id !== featureId),
        limits: tier.limits.filter(limit => limit.featureId !== featureId),
      }));

      return {
        ...prev,
        features: updatedFeatures,
        tiers: updatedTiers,
      };
    });
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
    // Validate count is a positive integer
    if (!Number.isInteger(count) || count < 0) {
      console.warn(`setTierCount: Invalid count ${count}, must be a non-negative integer`);
      return;
    }

    setState(prev => {
      const currentCount = prev.tiers.length;
      if (count === currentCount) return prev;

      if (count > currentCount) {
        // Add tiers
        const newTiers = [...prev.tiers];
        for (let i = currentCount; i < count; i++) {
          newTiers.push({
            id: generateId('tier'),
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
          id: generateId('tier'),
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
  // Actions - Currency
  // -------------------------------------------------------------------------

  const setCurrency = useCallback((currency: CurrencyCode) => {
    setState(prev => ({ ...prev, currency }));
  }, []);

  // -------------------------------------------------------------------------
  // Actions - Onboarding
  // -------------------------------------------------------------------------

  const setIsFirstVisit = useCallback((isFirst: boolean) => {
    setState(prev => ({ ...prev, isFirstVisit: isFirst }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState(prev => ({ ...prev, isFirstVisit: false }));
    localStorage.setItem('cynco-onboarding-complete', 'true');
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
    const id = generateId('toast');
    setToasts(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // -------------------------------------------------------------------------
  // Actions - Project Management
  // -------------------------------------------------------------------------

  const listProjects = useCallback((): string[] => {
    return getProjectsList();
  }, []);

  const saveProject = useCallback((name: string) => {
    saveProjectData(name, state);
    setCurrentProjectName(name);
    setCurrentProjectNameStorage(name);
    showToast('success', `Project "${name}" saved`);
  }, [state, showToast]);

  const loadProject = useCallback((name: string): boolean => {
    const projectData = loadProjectData(name);
    if (projectData) {
      setState({
        ...DEFAULT_STATE,
        ...projectData,
        isFirstVisit: false,
      });
      setCurrentProjectName(name);
      setCurrentProjectNameStorage(name);
      showToast('success', `Project "${name}" loaded`);
      return true;
    }
    showToast('error', `Project "${name}" not found`);
    return false;
  }, [showToast]);

  const deleteProject = useCallback((name: string) => {
    deleteProjectData(name);
    // If deleting current project, reset to default name
    if (currentProjectName === name) {
      setCurrentProjectName(DEFAULT_PROJECT_NAME);
      setCurrentProjectNameStorage(DEFAULT_PROJECT_NAME);
    }
    showToast('info', `Project "${name}" deleted`);
  }, [currentProjectName, showToast]);

  const renameProject = useCallback((newName: string) => {
    if (newName && newName.trim()) {
      setCurrentProjectName(newName.trim());
      setCurrentProjectNameStorage(newName.trim());
    }
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
    setCurrency,
    setIsFirstVisit,
    completeOnboarding,
    resetToDefaults,
    resetToEmpty,
    loadPreset,
    // Project Management
    currentProjectName,
    listProjects,
    saveProject,
    loadProject,
    deleteProject,
    renameProject,
    // Toast
    toasts,
    showToast,
    dismissToast,
    // Undo/Redo
    canUndo,
    canRedo,
    undo,
    redo,
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
    setCurrency,
    setIsFirstVisit,
    completeOnboarding,
    resetToDefaults,
    resetToEmpty,
    loadPreset,
    currentProjectName,
    listProjects,
    saveProject,
    loadProject,
    deleteProject,
    renameProject,
    showToast,
    dismissToast,
    canUndo,
    canRedo,
    undo,
    redo,
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
