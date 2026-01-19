/**
 * Cost ID Constants
 * Centralizes all cost identifiers to avoid hardcoded strings throughout the codebase
 */

export const COST_IDS = {
  // Variable cost IDs (matching PricingContext presets)
  OCR: 'ocr',
  AI_PROCESSING: 'ai-processing',
  EMAIL: 'email',
  STORAGE: 'storage',
  API_CALLS: 'api-calls',
  COMPUTE_TIME: 'compute-time',
  BANDWIDTH: 'bandwidth',
  PAYMENT_PROCESSING: 'payment-processing',
  SMS: 'sms',

  // Fixed cost IDs
  DATABASE: 'database',
  COMPUTE: 'compute',
  APIS: 'apis',
  MONITORING: 'monitoring',
  EMAIL_BASE: 'email-base',
  MISC: 'misc',
  INFRASTRUCTURE: 'infrastructure',
  CDN: 'cdn',
  SEARCH: 'search',
  SUPPORT_TOOLS: 'support-tools',
} as const;

export type CostId = (typeof COST_IDS)[keyof typeof COST_IDS];

// Feature IDs that map to cost drivers
export const FEATURE_COST_MAPPING = {
  ocr_extraction: COST_IDS.OCR,
  line_item_extraction: COST_IDS.AI_PROCESSING,
  coa_mapping: COST_IDS.AI_PROCESSING,
  journal_entries: COST_IDS.AI_PROCESSING,
  invoice_emails: COST_IDS.EMAIL,
  invoice_reminders: COST_IDS.EMAIL,
  dataroom_storage: COST_IDS.STORAGE,
} as const;
