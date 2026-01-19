// COGS (Cost of Goods Sold) Configuration
// All costs are in MYR unless specified

import { getExchangeRateSync, getFallbackRate } from '../services/exchangeRate';

// Exchange rate for USD to MYR
// Uses cached rate from API service, falls back to static rate if unavailable
// The rate is fetched asynchronously and cached for 24 hours
export const USD_TO_MYR = getExchangeRateSync();

// Fallback rate for reference (used when API is unavailable)
export const USD_TO_MYR_FALLBACK = getFallbackRate();

export interface CostItem {
  id: string;
  name: string;
  provider: string;
  category: CostCategory;
  pricingModel: 'per_unit' | 'per_1m_tokens' | 'percentage' | 'fixed_monthly' | 'tiered';
  unitCostUSD?: number;         // For per_1m_tokens: input token cost
  unitCostMYR?: number;
  outputCostUSD?: number;       // For AI models: output token cost per 1M tokens
  percentageFee?: number;
  fixedFeeUSD?: number;
  fixedFeeMYR?: number;
  unit: string;
  description: string;
  notes?: string;
}

export type CostCategory =
  | 'ai_models'
  | 'storage'
  | 'email'
  | 'payments'
  | 'database'
  | 'infrastructure'
  | 'third_party_apis';

export const costCategories: Record<CostCategory, { name: string; icon: string }> = {
  ai_models: { name: 'AI/Language Models', icon: '🤖' },
  storage: { name: 'Cloud Storage', icon: '💾' },
  email: { name: 'Email Services', icon: '📧' },
  payments: { name: 'Payment Processing', icon: '💳' },
  database: { name: 'Database & Infrastructure', icon: '🗄️' },
  infrastructure: { name: 'Infrastructure', icon: '🖥️' },
  third_party_apis: { name: 'Third-Party APIs', icon: '🔌' }
};

export const costItems: CostItem[] = [
  // AI Models
  // Pricing includes both input and output token costs
  // Total cost = (inputTokens × inputRate) + (outputTokens × outputRate)
  {
    id: 'mistral_large_text',
    name: 'Mistral Large (Text)',
    provider: 'Mistral AI',
    category: 'ai_models',
    pricingModel: 'per_1m_tokens',
    unitCostUSD: 2.00,    // Input: $2/1M tokens
    outputCostUSD: 6.00,  // Output: $6/1M tokens
    unit: '1M tokens',
    description: 'Text processing and reasoning',
    notes: 'Input: $2/1M, Output: $6/1M tokens'
  },
  {
    id: 'mistral_vision',
    name: 'Mistral Vision (OCR)',
    provider: 'Mistral AI',
    category: 'ai_models',
    pricingModel: 'per_1m_tokens',
    unitCostUSD: 3.00,    // Input: $3/1M tokens
    outputCostUSD: 8.00,  // Output: $8/1M tokens
    unit: '1M tokens',
    description: 'Document OCR and vision-based extraction',
    notes: 'Input: $3/1M, Output: $8/1M tokens. Primary cost driver for extractions.'
  },
  {
    id: 'deepseek_reasoner',
    name: 'DeepSeek Reasoner',
    provider: 'DeepSeek',
    category: 'ai_models',
    pricingModel: 'per_1m_tokens',
    unitCostUSD: 0.55,    // Input: $0.55/1M tokens
    outputCostUSD: 2.19,  // Output: $2.19/1M tokens
    unit: '1M tokens',
    description: 'COA mapping and business reasoning',
    notes: 'Input: $0.55/1M, Output: $2.19/1M tokens'
  },
  {
    id: 'deepseek_v3',
    name: 'DeepSeek V3.1',
    provider: 'DeepSeek',
    category: 'ai_models',
    pricingModel: 'per_1m_tokens',
    unitCostUSD: 0.27,    // Input: $0.27/1M tokens
    outputCostUSD: 1.10,  // Output: $1.10/1M tokens
    unit: '1M tokens',
    description: 'General AI tasks, classification',
    notes: 'Input: $0.27/1M, Output: $1.10/1M tokens. Very cost-effective.'
  },

  // Storage
  {
    id: 'r2_storage',
    name: 'Cloudflare R2 Storage',
    provider: 'Cloudflare',
    category: 'storage',
    pricingModel: 'per_unit',
    unitCostUSD: 0.015,
    unit: 'GB/month',
    description: 'Document storage',
    notes: 'First 10GB free. Egress free within Cloudflare.'
  },
  {
    id: 'r2_class_a',
    name: 'R2 Class A Operations (Writes)',
    provider: 'Cloudflare',
    category: 'storage',
    pricingModel: 'per_unit',
    unitCostUSD: 4.50,
    unit: '1M operations',
    description: 'Upload operations',
    notes: 'First 1M free/month'
  },
  {
    id: 'r2_class_b',
    name: 'R2 Class B Operations (Reads)',
    provider: 'Cloudflare',
    category: 'storage',
    pricingModel: 'per_unit',
    unitCostUSD: 0.36,
    unit: '1M operations',
    description: 'Download/read operations',
    notes: 'First 10M free/month'
  },

  // Email
  {
    id: 'resend_emails',
    name: 'Resend Transactional Emails',
    provider: 'Resend',
    category: 'email',
    pricingModel: 'tiered',
    unitCostUSD: 0.001, // ~$1/1000 emails at scale
    unit: 'email',
    description: 'Invoice and notification emails',
    notes: 'Free: 100/day, $20/mo for 50,000 emails'
  },

  // Payments
  {
    id: 'chip_fpx',
    name: 'CHIP FPX (Local Bank)',
    provider: 'CHIP',
    category: 'payments',
    pricingModel: 'percentage',
    percentageFee: 1.0,
    fixedFeeMYR: 0.30,
    unit: 'transaction',
    description: 'Malaysian FPX bank transfers',
    notes: 'Most common payment method in Malaysia'
  },
  {
    id: 'chip_local_card',
    name: 'CHIP Local Cards',
    provider: 'CHIP',
    category: 'payments',
    pricingModel: 'percentage',
    percentageFee: 1.5,
    fixedFeeMYR: 0.30,
    unit: 'transaction',
    description: 'Malaysian debit/credit cards'
  },
  {
    id: 'chip_intl_card',
    name: 'CHIP International Cards',
    provider: 'CHIP',
    category: 'payments',
    pricingModel: 'percentage',
    percentageFee: 3.0,
    fixedFeeMYR: 0.50,
    unit: 'transaction',
    description: 'International credit cards'
  },

  // Database
  {
    id: 'postgres_managed',
    name: 'Managed PostgreSQL',
    provider: 'Neon/Supabase',
    category: 'database',
    pricingModel: 'fixed_monthly',
    fixedFeeUSD: 25,
    unit: 'month',
    description: 'Primary database',
    notes: 'Scales with usage. Pro tier ~$25-69/mo'
  },

  // Infrastructure
  {
    id: 'compute',
    name: 'Compute (Docker/VPS)',
    provider: 'Various',
    category: 'infrastructure',
    pricingModel: 'fixed_monthly',
    fixedFeeUSD: 50,
    unit: 'month',
    description: 'Application servers',
    notes: 'Estimated for React Router + FastAPI + Go services'
  },
  {
    id: 'hatchet',
    name: 'Hatchet (Task Queue)',
    provider: 'Hatchet',
    category: 'infrastructure',
    pricingModel: 'fixed_monthly',
    fixedFeeUSD: 0, // Self-hosted or included
    unit: 'month',
    description: 'Async job processing',
    notes: 'Self-hosted or usage-based pricing'
  },

  // Third-party APIs
  {
    id: 'open_exchange_rates',
    name: 'Open Exchange Rates',
    provider: 'Open Exchange Rates',
    category: 'third_party_apis',
    pricingModel: 'fixed_monthly',
    fixedFeeUSD: 12,
    unit: 'month',
    description: 'Currency conversion rates',
    notes: 'Developer plan: 1,000 requests/mo'
  }
];

// Estimated cost per action (for quick calculations)
// USD costs are defined here and converted to MYR dynamically
export interface ActionCost {
  actionId: string;
  actionName: string;
  estimatedCostUSD: number;  // Base cost in USD
  estimatedCostMYR: number;  // Calculated from USD * exchange rate
  breakdown: string;
}

// Define base costs in USD for maintainability
const actionCostsUSD = [
  {
    actionId: 'extraction_session',
    actionName: 'Document Extraction (1 doc, ~10 pages, ~50 items)',
    estimatedCostUSD: 0.065, // Average of $0.025-0.033 per doc + DeepSeek processing ~$0.03
    breakdown: 'Mistral Vision: ~$0.025-0.033 per document, plus DeepSeek for processing'
  },
  {
    actionId: 'line_item_extraction',
    actionName: 'Single Line Item Extraction',
    estimatedCostUSD: 0.001, // Average of $0.0007-0.0012
    breakdown: 'Part of vision processing, ~$0.0007-0.0012 per item'
  },
  {
    actionId: 'coa_mapping',
    actionName: 'COA Mapping (per transaction)',
    estimatedCostUSD: 0.0022, // DeepSeek Reasoner at ~$0.55/1M tokens input, ~500 tokens
    breakdown: 'DeepSeek Reasoner call with caching at 85% confidence'
  },
  {
    actionId: 'journal_entry',
    actionName: 'Journal Entry Generation',
    estimatedCostUSD: 0.0045, // DeepSeek reasoning, ~1000 tokens
    breakdown: 'DeepSeek reasoning for double-entry bookkeeping'
  },
  {
    actionId: 'email_send',
    actionName: 'Send Email (invoice/reminder)',
    estimatedCostUSD: 0.001, // Resend pricing at scale
    breakdown: 'Resend: ~$0.001/email at scale'
  },
  {
    actionId: 'storage_gb_month',
    actionName: 'Storage (1 GB/month)',
    estimatedCostUSD: 0.015, // R2 storage pricing
    breakdown: 'R2: $0.015/GB/month'
  }
] as const;

// Convert to MYR using current exchange rate
export const actionCosts: ActionCost[] = actionCostsUSD.map(cost => ({
  ...cost,
  estimatedCostMYR: cost.estimatedCostUSD * USD_TO_MYR,
}));

// Monthly fixed costs (infrastructure baseline)
export const monthlyFixedCosts = {
  database: 25 * USD_TO_MYR, // ~MYR 112
  compute: 50 * USD_TO_MYR, // ~MYR 223
  currencyApi: 12 * USD_TO_MYR, // ~MYR 54
  monitoring: 10 * USD_TO_MYR, // ~MYR 45 (Grafana, etc)
  emailBase: 20 * USD_TO_MYR, // ~MYR 89 (Resend Pro)
  misc: 20 * USD_TO_MYR, // ~MYR 89
  get total() {
    return this.database + this.compute + this.currencyApi + this.monitoring + this.emailBase + this.misc;
  }
};
