/**
 * Core type definitions for BasedPricer
 * These types are framework-agnostic and can be used in any environment
 */

// ============================================================================
// Cost Types
// ============================================================================

export interface VariableCostItem {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
  usagePerCustomer: number;
  description: string;
}

export interface FixedCostItem {
  id: string;
  name: string;
  monthlyCost: number;
  description: string;
}

export interface CostBreakdown {
  variableTotal: number;
  fixedTotal: number;
  fixedPerCustomer: number;
  totalCOGS: number;
}

// ============================================================================
// Margin Types
// ============================================================================

export type MarginStatus = 'great' | 'ok' | 'low';
export type MarginHealth = 'healthy' | 'acceptable' | 'low';

export interface MarginInfo {
  margin: number;
  profit: number;
  status: MarginStatus;
}

export interface MarginThresholds {
  HEALTHY: number;
  ACCEPTABLE: number;
  MINIMUM: number;
}

// ============================================================================
// Currency Types
// ============================================================================

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;
  position: 'before' | 'after';
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}

export type CurrencyCode = 'MYR' | 'USD' | 'SGD' | 'EUR' | 'GBP' | 'AUD';

// ============================================================================
// Tier Types
// ============================================================================

export type TierStatus = 'active' | 'coming_soon' | 'internal';

export interface TierLimit {
  featureId: string;
  limit: number | 'unlimited';
  unit?: string;
}

export interface Tier {
  id: string;
  name: string;
  monthlyPriceMYR: number;
  annualPriceMYR?: number;
  description?: string;
  features: string[];
  limits: TierLimit[];
  status: TierStatus;
  isHighlighted?: boolean;
  ctaText?: string;
}

export interface TierDisplayConfig {
  visibleFeatureCount: number;
  showAnnualPricing: boolean;
  annualDiscountPercent: number;
}

// ============================================================================
// Feature Types
// ============================================================================

export type FeatureComplexity = 'low' | 'medium' | 'high';

export interface Feature {
  id: string;
  name: string;
  category: string;
  description?: string;
  complexity: FeatureComplexity;
  hasLimit: boolean;
  costDriver?: string;
  valueProposition?: string;
  source?: 'detected' | 'manual';
}

// ============================================================================
// Business Type & Pricing Model Types
// ============================================================================

export type BusinessType =
  | 'api_service'
  | 'marketplace'
  | 'fintech'
  | 'ai_ml_saas'
  | 'developer_tools'
  | 'b2b_saas'
  | 'consumer_saas'
  | 'generic';

export type PricingModelType =
  | 'usage_based'
  | 'seat_based'
  | 'feature_tiered'
  | 'take_rate'
  | 'hybrid'
  | 'freemium';

// ============================================================================
// AI Provider Types
// ============================================================================

export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'openrouter'
  | 'minimax'
  | 'glm'
  | 'groq';

export interface AIModelPricing {
  name: string;
  displayName: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  lastUpdated: string;
  contextWindow: number;
  notes?: string;
}

export interface ProviderPricing {
  provider: AIProvider;
  providerName: string;
  models: Record<string, AIModelPricing>;
  defaultModel: string;
}

// ============================================================================
// Analysis Types
// ============================================================================

export interface TechStack {
  framework?: string;
  language?: string;
  database?: string;
  auth?: string;
  hosting?: string;
  styling?: string;
  testing?: string;
}

export interface CodebaseAnalysis {
  businessType: BusinessType;
  businessTypeConfidence: number;
  pricingModel: PricingModelType;
  techStack: TechStack;
  features: Feature[];
  dependencies: string[];
  estimatedCosts: {
    variable: VariableCostItem[];
    fixed: FixedCostItem[];
  };
}

// ============================================================================
// Investor Metrics Types
// ============================================================================

export interface ValuationProjection {
  currentARR: number;
  valuationLow: number;
  valuationMid: number;
  valuationHigh: number;
}

export interface MilestoneTarget {
  label: string;
  targetARR: number;
  customersNeeded: number;
  monthsToReach: number | null;
}

export interface InvestorMetrics {
  mrr: number;
  arr: number;
  paidCustomers: number;
  arpu: number;
  valuation: ValuationProjection;
  milestones: MilestoneTarget[];
  breakEvenCustomers: number;
  currentPaidCustomers: number;
  customersToBreakEven: number;
  monthsToBreakEven: number | null;
  grossMarginHealth: 'healthy' | 'acceptable' | 'concerning';
  ltvCacRatio: number | null;
  paybackPeriodMonths: number | null;
}

// ============================================================================
// Report Types
// ============================================================================

export type StakeholderType = 'investor' | 'accountant' | 'engineer' | 'marketer';

export interface ReportData {
  projectName: string;
  createdAt: string;
  businessType?: BusinessType;
  pricingModel?: PricingModelType;
  costs: {
    variable: VariableCostItem[];
    fixed: FixedCostItem[];
  };
  tiers: Tier[];
  features: Feature[];
  metrics?: Partial<InvestorMetrics>;
  notes?: Partial<Record<StakeholderType, string>>;
}

// ============================================================================
// Cost Driver Types
// ============================================================================

export interface CostDriverConfig {
  id: string;
  name: string;
  variableCostId?: string;
  defaultCostPerUnit: number;
  unit: string;
}
