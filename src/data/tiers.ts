import { features } from './features';

export interface TierLimit {
  featureId: string;
  limit: number | 'unlimited' | boolean;
  unit?: string;
}

export interface Tier {
  id: string;
  name: string;
  tagline: string;
  monthlyPriceMYR: number;
  annualPriceMYR: number;
  annualDiscount: number;
  status: 'active' | 'coming_soon' | 'internal';
  targetAudience: string;
  limits: TierLimit[];
  includedFeatures: string[]; // feature IDs
  excludedFeatures: string[]; // feature IDs explicitly not included
  highlightFeatures: string[]; // features to highlight in marketing
}

// Default tier configuration based on codebase analysis
export const defaultTiers: Tier[] = [
  {
    id: 'freemium',
    name: 'Freemium',
    tagline: 'Get started for free',
    monthlyPriceMYR: 0,
    annualPriceMYR: 0,
    annualDiscount: 0,
    status: 'active',
    targetAudience: 'Solo freelancers, students, and early-stage startups testing the platform',
    limits: [
      { featureId: 'invoice_create', limit: 10, unit: 'invoices/month' },
      { featureId: 'invoice_templates', limit: 1, unit: 'templates' },
      { featureId: 'customer_management', limit: 20, unit: 'customers' },
      { featureId: 'dataroom_storage', limit: 0.5, unit: 'GB' },
      { featureId: 'ocr_extraction', limit: 5, unit: 'extractions/month' },
      { featureId: 'line_item_extraction', limit: 50, unit: 'line items/month' },
      { featureId: 'coa_mapping', limit: 20, unit: 'mappings/month' },
      { featureId: 'journal_entries', limit: 10, unit: 'entries/month' },
      { featureId: 'invoice_emails', limit: 20, unit: 'emails/month' },
      { featureId: 'team_members', limit: 1, unit: 'user' },
    ],
    includedFeatures: [
      'invoice_create',
      'invoice_templates',
      'invoice_pdf',
      'customer_management',
      'partial_payments',
      'dataroom_storage',
      'folder_hierarchy',
      'ocr_extraction',
      'line_item_extraction',
      'confidence_scoring',
      'coa_mapping',
      'journal_entries',
      'invoice_emails',
      'email_support'
    ],
    excludedFeatures: [
      'invoice_bulk_import',
      'invoice_reminders',
      'multi_currency',
      'file_versioning',
      'audit_trail',
      'file_sharing',
      'multi_page_pdf',
      'bank_statement_extraction',
      'custom_coa',
      'business_context',
      'email_inbox',
      'email_classification',
      'payment_collection',
      'payment_page',
      'payment_receipts',
      'team_members',
      'role_permissions',
      'client_hierarchy',
      'usage_analytics',
      'advanced_reporting',
      'api_access',
      'webhooks',
      'white_label',
      'priority_support',
      'dedicated_manager',
      'onboarding'
    ],
    highlightFeatures: [
      'invoice_create',
      'dataroom_storage',
      'ocr_extraction',
      'coa_mapping'
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Perfect for small businesses',
    monthlyPriceMYR: 25,
    annualPriceMYR: 250, // ~17% discount
    annualDiscount: 17,
    status: 'active',
    targetAudience: 'Small businesses, freelancers with regular invoicing needs',
    limits: [
      { featureId: 'invoice_create', limit: 100, unit: 'invoices/month' },
      { featureId: 'invoice_templates', limit: 3, unit: 'templates' },
      { featureId: 'customer_management', limit: 100, unit: 'customers' },
      { featureId: 'dataroom_storage', limit: 5, unit: 'GB' },
      { featureId: 'ocr_extraction', limit: 30, unit: 'extractions/month' },
      { featureId: 'line_item_extraction', limit: 300, unit: 'line items/month' },
      { featureId: 'coa_mapping', limit: 100, unit: 'mappings/month' },
      { featureId: 'journal_entries', limit: 50, unit: 'entries/month' },
      { featureId: 'invoice_emails', limit: 200, unit: 'emails/month' },
      { featureId: 'invoice_reminders', limit: 50, unit: 'reminders/month' },
      { featureId: 'team_members', limit: 2, unit: 'users' },
    ],
    includedFeatures: [
      'invoice_create',
      'invoice_templates',
      'invoice_pdf',
      'invoice_reminders',
      'customer_management',
      'partial_payments',
      'dataroom_storage',
      'folder_hierarchy',
      'file_versioning',
      'audit_trail',
      'ocr_extraction',
      'line_item_extraction',
      'multi_page_pdf',
      'confidence_scoring',
      'coa_mapping',
      'journal_entries',
      'custom_coa',
      'invoice_emails',
      'payment_collection',
      'payment_page',
      'payment_receipts',
      'team_members',
      'usage_analytics',
      'email_support'
    ],
    excludedFeatures: [
      'invoice_bulk_import',
      'multi_currency',
      'file_sharing',
      'bank_statement_extraction',
      'business_context',
      'email_inbox',
      'email_classification',
      'role_permissions',
      'client_hierarchy',
      'advanced_reporting',
      'api_access',
      'webhooks',
      'white_label',
      'priority_support',
      'dedicated_manager',
      'onboarding'
    ],
    highlightFeatures: [
      'invoice_create',
      'ocr_extraction',
      'coa_mapping',
      'payment_collection',
      'team_members'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For growing businesses',
    monthlyPriceMYR: 0, // To be decided
    annualPriceMYR: 0,
    annualDiscount: 17,
    status: 'coming_soon',
    targetAudience: 'Growing SMEs, small accounting practices',
    limits: [
      { featureId: 'invoice_create', limit: 500, unit: 'invoices/month' },
      { featureId: 'invoice_templates', limit: 10, unit: 'templates' },
      { featureId: 'customer_management', limit: 500, unit: 'customers' },
      { featureId: 'dataroom_storage', limit: 25, unit: 'GB' },
      { featureId: 'ocr_extraction', limit: 150, unit: 'extractions/month' },
      { featureId: 'line_item_extraction', limit: 1500, unit: 'line items/month' },
      { featureId: 'coa_mapping', limit: 500, unit: 'mappings/month' },
      { featureId: 'journal_entries', limit: 250, unit: 'entries/month' },
      { featureId: 'invoice_emails', limit: 1000, unit: 'emails/month' },
      { featureId: 'invoice_reminders', limit: 250, unit: 'reminders/month' },
      { featureId: 'team_members', limit: 5, unit: 'users' },
      { featureId: 'client_hierarchy', limit: 5, unit: 'client accounts' },
    ],
    includedFeatures: [
      // All Basic features plus:
      'invoice_create',
      'invoice_templates',
      'invoice_pdf',
      'invoice_bulk_import',
      'invoice_reminders',
      'multi_currency',
      'customer_management',
      'partial_payments',
      'dataroom_storage',
      'folder_hierarchy',
      'file_versioning',
      'audit_trail',
      'file_sharing',
      'ocr_extraction',
      'line_item_extraction',
      'multi_page_pdf',
      'bank_statement_extraction',
      'confidence_scoring',
      'coa_mapping',
      'journal_entries',
      'custom_coa',
      'business_context',
      'invoice_emails',
      'email_inbox',
      'email_classification',
      'payment_collection',
      'payment_page',
      'payment_receipts',
      'team_members',
      'role_permissions',
      'client_hierarchy',
      'usage_analytics',
      'advanced_reporting',
      'email_support',
      'priority_support'
    ],
    excludedFeatures: [
      'api_access',
      'webhooks',
      'white_label',
      'dedicated_manager',
      'onboarding'
    ],
    highlightFeatures: [
      'bank_statement_extraction',
      'email_inbox',
      'client_hierarchy',
      'advanced_reporting',
      'priority_support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For large organizations',
    monthlyPriceMYR: 0, // Custom pricing
    annualPriceMYR: 0,
    annualDiscount: 0,
    status: 'coming_soon',
    targetAudience: 'Large accounting firms, enterprises with complex needs',
    limits: [
      { featureId: 'invoice_create', limit: 'unlimited' },
      { featureId: 'invoice_templates', limit: 'unlimited' },
      { featureId: 'customer_management', limit: 'unlimited' },
      { featureId: 'dataroom_storage', limit: 100, unit: 'GB (expandable)' },
      { featureId: 'ocr_extraction', limit: 'unlimited' },
      { featureId: 'line_item_extraction', limit: 'unlimited' },
      { featureId: 'coa_mapping', limit: 'unlimited' },
      { featureId: 'journal_entries', limit: 'unlimited' },
      { featureId: 'invoice_emails', limit: 'unlimited' },
      { featureId: 'invoice_reminders', limit: 'unlimited' },
      { featureId: 'team_members', limit: 'unlimited' },
      { featureId: 'client_hierarchy', limit: 'unlimited' },
      { featureId: 'api_access', limit: 'unlimited' },
    ],
    includedFeatures: features.map(f => f.id), // All features
    excludedFeatures: [],
    highlightFeatures: [
      'api_access',
      'webhooks',
      'white_label',
      'dedicated_manager',
      'onboarding'
    ]
  }
];

// Default assumptions for unlimited tiers (Enterprise)
// These represent realistic usage estimates for enterprise customers
export const unlimitedTierDefaults = {
  ocr_extraction: 500, // extractions/month
  invoice_emails: 5000, // emails/month
  dataroom_storage: 100, // GB
};

// Default cost rates (should match PricingContext presets)
// These are the single source of truth for cost rates
export interface CostRates {
  extractionCostPerUnit: number; // MYR per extraction/document
  emailCostPerUnit: number;      // MYR per email
  storageCostPerGB: number;      // MYR per GB/month
}

export const DEFAULT_COST_RATES: CostRates = {
  extractionCostPerUnit: 0.15,  // MYR 0.15 per extraction (matches OCR preset)
  emailCostPerUnit: 0.005,      // MYR 0.005 per email
  storageCostPerGB: 0.07,       // MYR 0.07 per GB/month
};

// Helper function to calculate estimated variable costs per tier
// Now accepts cost rates as parameter to stay in sync with COGS calculator
export function calculateTierVariableCosts(
  tier: Tier,
  utilizationRate: number = 0.7, // Default 70% utilization
  costRates: CostRates = DEFAULT_COST_RATES
): {
  extraction: number;
  email: number;
  storage: number;
  total: number;
} {
  const extractionLimit = tier.limits.find(l => l.featureId === 'ocr_extraction')?.limit;
  const emailLimit = tier.limits.find(l => l.featureId === 'invoice_emails')?.limit;
  const storageLimit = tier.limits.find(l => l.featureId === 'dataroom_storage')?.limit;

  // For 'unlimited', use enterprise defaults; for boolean/other, use 0
  const effectiveExtraction = typeof extractionLimit === 'number'
    ? extractionLimit
    : extractionLimit === 'unlimited'
      ? unlimitedTierDefaults.ocr_extraction
      : 0;

  const effectiveEmail = typeof emailLimit === 'number'
    ? emailLimit
    : emailLimit === 'unlimited'
      ? unlimitedTierDefaults.invoice_emails
      : 0;

  const effectiveStorage = typeof storageLimit === 'number'
    ? storageLimit
    : storageLimit === 'unlimited'
      ? unlimitedTierDefaults.dataroom_storage
      : 0;

  const extractionCost = effectiveExtraction * costRates.extractionCostPerUnit * utilizationRate;
  const emailCost = effectiveEmail * costRates.emailCostPerUnit * utilizationRate;
  const storageCost = effectiveStorage * costRates.storageCostPerGB; // Storage doesn't have utilization

  return {
    extraction: extractionCost,
    email: emailCost,
    storage: storageCost,
    total: extractionCost + emailCost + storageCost
  };
}
