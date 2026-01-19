import { type BusinessType } from './business-types';

export type FeatureSource = 'codebase' | 'manual';
export type FeaturePriority = 'critical' | 'important' | 'nice_to_have';

export interface Feature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  complexity: 'low' | 'medium' | 'high';
  hasLimit: boolean;
  limitUnit?: string;
  costDriver?: string;
  valueProposition: string;
  source: FeatureSource;
  // For codebase features: where it was found
  sourceFile?: string;
  // For manual features: when it was added
  createdAt?: string;
}

export type FeatureCategory =
  | 'invoicing'
  | 'document_management'
  | 'ai_extraction'
  | 'accounting_ai'
  | 'email'
  | 'payments'
  | 'team'
  | 'reporting'
  | 'integrations'
  | 'support';

export const featureCategories: Record<FeatureCategory, { name: string; description: string }> = {
  invoicing: {
    name: 'Invoicing & Billing',
    description: 'Create, manage, and track invoices with payment collection'
  },
  document_management: {
    name: 'Data Room (Document Management)',
    description: 'Secure document storage with hierarchical organization'
  },
  ai_extraction: {
    name: 'AI Document Extraction',
    description: 'OCR and intelligent data extraction from financial documents'
  },
  accounting_ai: {
    name: 'AI Accounting Automation',
    description: 'Automated chart of accounts mapping and journal entries'
  },
  email: {
    name: 'Email System',
    description: 'Transactional emails and intelligent inbox'
  },
  payments: {
    name: 'Payment Processing',
    description: 'Accept payments via FPX, cards, and e-wallets'
  },
  team: {
    name: 'Team & Access Control',
    description: 'Multi-user access with role-based permissions'
  },
  reporting: {
    name: 'Reporting & Analytics',
    description: 'Usage tracking and business insights'
  },
  integrations: {
    name: 'Integrations & API',
    description: 'Connect with external services and programmatic access'
  },
  support: {
    name: 'Support & Services',
    description: 'Customer support and account management'
  }
};

export const features: Feature[] = [
  // Invoicing & Billing
  {
    id: 'invoice_create',
    name: 'Invoice Creation',
    description: 'Create professional invoices with line items, taxes, and discounts',
    category: 'invoicing',
    complexity: 'medium',
    hasLimit: true,
    limitUnit: 'invoices/month',
    source: 'codebase', valueProposition: 'Professional invoicing without expensive accounting software'
  },
  {
    id: 'invoice_templates',
    name: 'Invoice Templates',
    description: 'Customizable invoice templates with branding',
    category: 'invoicing',
    complexity: 'low',
    hasLimit: true,
    limitUnit: 'templates',
    source: 'codebase', valueProposition: 'Consistent brand identity across all invoices'
  },
  {
    id: 'invoice_pdf',
    name: 'PDF Generation',
    description: 'Automatic PDF generation for invoices and quotations',
    category: 'invoicing',
    complexity: 'medium',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Instant professional PDF documents'
  },
  {
    id: 'invoice_bulk_import',
    name: 'Bulk Invoice Import',
    description: 'Import multiple invoices via CSV/XLSX files',
    category: 'invoicing',
    complexity: 'high',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Migrate existing data easily'
  },
  {
    id: 'invoice_reminders',
    name: 'Payment Reminders',
    description: 'Automated payment reminder emails for overdue invoices',
    category: 'invoicing',
    complexity: 'medium',
    hasLimit: true,
    limitUnit: 'reminders/month',
    costDriver: 'email',
    source: 'codebase', valueProposition: 'Reduce late payments automatically'
  },
  {
    id: 'multi_currency',
    name: 'Multi-Currency Support',
    description: 'Handle invoices in multiple currencies with conversion',
    category: 'invoicing',
    complexity: 'medium',
    hasLimit: false,
    costDriver: 'currency_api',
    source: 'codebase', valueProposition: 'Serve international clients seamlessly'
  },
  {
    id: 'customer_management',
    name: 'Customer Management',
    description: 'Manage customer database with contact details and history',
    category: 'invoicing',
    complexity: 'low',
    hasLimit: true,
    limitUnit: 'customers',
    source: 'codebase', valueProposition: 'Organized customer relationships'
  },
  {
    id: 'partial_payments',
    name: 'Partial & Deposit Payments',
    description: 'Accept partial payments and deposits on invoices',
    category: 'invoicing',
    complexity: 'medium',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Flexible payment terms for customers'
  },

  // Document Management
  {
    id: 'dataroom_storage',
    name: 'Secure Document Storage',
    description: 'Cloud storage for financial documents with encryption',
    category: 'document_management',
    complexity: 'high',
    hasLimit: true,
    limitUnit: 'GB',
    costDriver: 'storage',
    source: 'codebase', valueProposition: 'All documents in one secure place'
  },
  {
    id: 'folder_hierarchy',
    name: 'Folder Organization',
    description: 'Unlimited nested folder structure for document organization',
    category: 'document_management',
    complexity: 'medium',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Organize documents your way'
  },
  {
    id: 'file_versioning',
    name: 'File Versioning',
    description: 'Track document versions and changes over time',
    category: 'document_management',
    complexity: 'medium',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Never lose previous versions'
  },
  {
    id: 'audit_trail',
    name: 'Activity Audit Trail',
    description: 'Complete log of all document activities',
    category: 'document_management',
    complexity: 'medium',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Full transparency and compliance'
  },
  {
    id: 'file_sharing',
    name: 'Secure File Sharing',
    description: 'Share files with external parties securely',
    category: 'document_management',
    complexity: 'medium',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Collaborate safely with clients'
  },

  // AI Document Extraction
  {
    id: 'ocr_extraction',
    name: 'AI Document OCR',
    description: 'Extract text and data from scanned documents using AI vision',
    category: 'ai_extraction',
    complexity: 'high',
    hasLimit: true,
    limitUnit: 'extractions/month',
    costDriver: 'mistral_vision',
    source: 'codebase', valueProposition: 'Eliminate manual data entry'
  },
  {
    id: 'line_item_extraction',
    name: 'Line Item Extraction',
    description: 'Automatically extract line items from invoices and receipts',
    category: 'ai_extraction',
    complexity: 'high',
    hasLimit: true,
    limitUnit: 'line items/month',
    costDriver: 'mistral_vision',
    source: 'codebase', valueProposition: 'Accurate line-by-line data capture'
  },
  {
    id: 'multi_page_pdf',
    name: 'Multi-Page PDF Processing',
    description: 'Process multi-page documents with smart chunking',
    category: 'ai_extraction',
    complexity: 'high',
    hasLimit: false,
    costDriver: 'mistral_vision',
    source: 'codebase', valueProposition: 'Handle complex documents'
  },
  {
    id: 'bank_statement_extraction',
    name: 'Bank Statement Extraction',
    description: 'Extract transactions from bank statements',
    category: 'ai_extraction',
    complexity: 'high',
    hasLimit: true,
    limitUnit: 'statements/month',
    costDriver: 'mistral_vision',
    source: 'codebase', valueProposition: 'Automate bank reconciliation'
  },
  {
    id: 'confidence_scoring',
    name: 'Extraction Confidence Scoring',
    description: 'AI confidence scores for extracted data accuracy',
    category: 'ai_extraction',
    complexity: 'medium',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Know when to review extracted data'
  },

  // AI Accounting Automation
  {
    id: 'coa_mapping',
    name: 'AI Chart of Accounts Mapping',
    description: 'Automatically map transactions to correct accounts using AI',
    category: 'accounting_ai',
    complexity: 'high',
    hasLimit: true,
    limitUnit: 'mappings/month',
    costDriver: 'deepseek',
    source: 'codebase', valueProposition: 'Intelligent categorization that learns'
  },
  {
    id: 'journal_entries',
    name: 'Automated Journal Entries',
    description: 'Generate double-entry bookkeeping entries automatically',
    category: 'accounting_ai',
    complexity: 'high',
    hasLimit: true,
    limitUnit: 'entries/month',
    costDriver: 'deepseek',
    source: 'codebase', valueProposition: 'Error-free bookkeeping automation'
  },
  {
    id: 'custom_coa',
    name: 'Custom Chart of Accounts',
    description: 'Define your own chart of accounts structure',
    category: 'accounting_ai',
    complexity: 'medium',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Accounting that fits your business'
  },
  {
    id: 'business_context',
    name: 'Business Context Learning',
    description: 'AI learns your business patterns for better accuracy',
    category: 'accounting_ai',
    complexity: 'high',
    hasLimit: false,
    costDriver: 'deepseek',
    source: 'codebase', valueProposition: 'AI that understands your business'
  },

  // Email System
  {
    id: 'invoice_emails',
    name: 'Invoice Email Sending',
    description: 'Send invoices directly to customers via email',
    category: 'email',
    complexity: 'medium',
    hasLimit: true,
    limitUnit: 'emails/month',
    costDriver: 'email',
    source: 'codebase', valueProposition: 'One-click invoice delivery'
  },
  {
    id: 'email_inbox',
    name: 'Intelligent Email Inbox',
    description: 'Receive documents via email with AI auto-categorization',
    category: 'email',
    complexity: 'high',
    hasLimit: true,
    limitUnit: 'inbound emails/month',
    costDriver: 'email',
    source: 'codebase', valueProposition: 'Documents auto-sorted on receipt'
  },
  {
    id: 'email_classification',
    name: 'AI Email Classification',
    description: 'Automatically classify and prioritize incoming emails',
    category: 'email',
    complexity: 'high',
    hasLimit: false,
    costDriver: 'deepseek',
    source: 'codebase', valueProposition: 'Never miss important documents'
  },

  // Payment Processing
  {
    id: 'payment_collection',
    name: 'Online Payment Collection',
    description: 'Accept payments via FPX, cards, and e-wallets',
    category: 'payments',
    complexity: 'high',
    hasLimit: false,
    costDriver: 'chip_payment',
    source: 'codebase', valueProposition: 'Get paid faster with online payments'
  },
  {
    id: 'payment_page',
    name: 'Custom Payment Pages',
    description: 'Branded payment pages for invoice payments',
    category: 'payments',
    complexity: 'medium',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Professional payment experience'
  },
  {
    id: 'payment_receipts',
    name: 'Automatic Payment Receipts',
    description: 'Generate and send payment receipts automatically',
    category: 'payments',
    complexity: 'low',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Instant payment confirmation'
  },

  // Team & Access Control
  {
    id: 'team_members',
    name: 'Team Member Access',
    description: 'Invite team members with role-based access',
    category: 'team',
    complexity: 'medium',
    hasLimit: true,
    limitUnit: 'users',
    source: 'codebase', valueProposition: 'Collaborate with your team'
  },
  {
    id: 'role_permissions',
    name: 'Role-Based Permissions',
    description: 'Fine-grained access control for team members',
    category: 'team',
    complexity: 'medium',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Control who can do what'
  },
  {
    id: 'client_hierarchy',
    name: 'Client Management (Firms)',
    description: 'Manage multiple client organizations (for accounting firms)',
    category: 'team',
    complexity: 'high',
    hasLimit: true,
    limitUnit: 'client accounts',
    source: 'codebase', valueProposition: 'Serve multiple clients efficiently'
  },

  // Reporting & Analytics
  {
    id: 'usage_analytics',
    name: 'Usage Analytics',
    description: 'Track extraction, email, and storage usage',
    category: 'reporting',
    complexity: 'medium',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Understand your usage patterns'
  },
  {
    id: 'advanced_reporting',
    name: 'Advanced Reporting',
    description: 'Detailed reports and data exports',
    category: 'reporting',
    complexity: 'high',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Deep business insights'
  },

  // Integrations & API
  {
    id: 'api_access',
    name: 'API Access',
    description: 'Programmatic access to Cynco via REST API',
    category: 'integrations',
    complexity: 'high',
    hasLimit: true,
    limitUnit: 'API calls/month',
    source: 'codebase', valueProposition: 'Build custom integrations'
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Receive real-time notifications of events',
    category: 'integrations',
    complexity: 'medium',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Automate with external systems'
  },
  {
    id: 'white_label',
    name: 'White Label',
    description: 'Remove Cynco branding for your own brand',
    category: 'integrations',
    complexity: 'low',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Your brand, our platform'
  },

  // Support
  {
    id: 'email_support',
    name: 'Email Support',
    description: 'Support via email with response time SLA',
    category: 'support',
    complexity: 'low',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Help when you need it'
  },
  {
    id: 'priority_support',
    name: 'Priority Support',
    description: 'Faster response times and priority queue',
    category: 'support',
    complexity: 'low',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Get answers faster'
  },
  {
    id: 'dedicated_manager',
    name: 'Dedicated Account Manager',
    description: 'Personal account manager for your organization',
    category: 'support',
    complexity: 'low',
    hasLimit: false,
    source: 'codebase', valueProposition: 'White-glove service'
  },
  {
    id: 'onboarding',
    name: 'Guided Onboarding',
    description: 'Personalized setup and training session',
    category: 'support',
    complexity: 'low',
    hasLimit: false,
    source: 'codebase', valueProposition: 'Get started right'
  }
];

/**
 * Business-type-aware feature configuration
 * Defines which feature categories are relevant to each business type
 * and their priority level
 */
export interface BusinessTypeFeatureConfig {
  relevantCategories: FeatureCategory[];
  criticalCategories: FeatureCategory[];
  suggestedFeatures: string[]; // Feature IDs that are particularly relevant
}

/**
 * Feature configuration for each business type
 */
export const BUSINESS_TYPE_FEATURES: Record<BusinessType, BusinessTypeFeatureConfig> = {
  api_service: {
    relevantCategories: ['integrations', 'reporting', 'team', 'support'],
    criticalCategories: ['integrations'],
    suggestedFeatures: ['api_access', 'webhooks', 'usage_analytics', 'team_members', 'role_permissions'],
  },
  marketplace: {
    relevantCategories: ['payments', 'invoicing', 'team', 'reporting', 'support'],
    criticalCategories: ['payments', 'invoicing'],
    suggestedFeatures: ['payment_collection', 'invoice_create', 'customer_management', 'usage_analytics', 'team_members'],
  },
  fintech: {
    relevantCategories: ['payments', 'accounting_ai', 'reporting', 'team', 'integrations', 'support'],
    criticalCategories: ['payments', 'accounting_ai', 'reporting'],
    suggestedFeatures: ['payment_collection', 'coa_mapping', 'journal_entries', 'audit_trail', 'advanced_reporting', 'api_access'],
  },
  ai_ml_saas: {
    relevantCategories: ['ai_extraction', 'accounting_ai', 'integrations', 'reporting', 'team', 'support'],
    criticalCategories: ['ai_extraction', 'integrations'],
    suggestedFeatures: ['ocr_extraction', 'line_item_extraction', 'api_access', 'usage_analytics', 'team_members'],
  },
  developer_tools: {
    relevantCategories: ['integrations', 'team', 'reporting', 'support'],
    criticalCategories: ['integrations', 'team'],
    suggestedFeatures: ['api_access', 'webhooks', 'team_members', 'role_permissions', 'usage_analytics'],
  },
  b2b_saas: {
    relevantCategories: ['team', 'integrations', 'reporting', 'support', 'document_management'],
    criticalCategories: ['team', 'integrations'],
    suggestedFeatures: ['team_members', 'role_permissions', 'api_access', 'webhooks', 'advanced_reporting', 'dataroom_storage'],
  },
  consumer_saas: {
    relevantCategories: ['payments', 'email', 'reporting', 'support'],
    criticalCategories: ['payments'],
    suggestedFeatures: ['payment_collection', 'invoice_emails', 'email_support', 'usage_analytics'],
  },
  generic: {
    relevantCategories: ['invoicing', 'document_management', 'team', 'reporting', 'integrations', 'support'],
    criticalCategories: ['invoicing', 'team'],
    suggestedFeatures: ['invoice_create', 'customer_management', 'team_members', 'role_permissions', 'email_support'],
  },
};

/**
 * Get feature categories relevant to a business type, ordered by importance
 */
export function getFeatureCategoriesForBusinessType(businessType: BusinessType): FeatureCategory[] {
  const config = BUSINESS_TYPE_FEATURES[businessType] ?? BUSINESS_TYPE_FEATURES.generic;

  // Return critical categories first, then other relevant categories
  const orderedCategories: FeatureCategory[] = [];

  // Add critical categories first
  config.criticalCategories.forEach(cat => {
    if (!orderedCategories.includes(cat)) {
      orderedCategories.push(cat);
    }
  });

  // Add remaining relevant categories
  config.relevantCategories.forEach(cat => {
    if (!orderedCategories.includes(cat)) {
      orderedCategories.push(cat);
    }
  });

  // Add any remaining categories at the end
  const allCategories = Object.keys(featureCategories) as FeatureCategory[];
  allCategories.forEach(cat => {
    if (!orderedCategories.includes(cat)) {
      orderedCategories.push(cat);
    }
  });

  return orderedCategories;
}

/**
 * Get the priority of a feature for a specific business type
 */
export function getFeaturePriority(featureId: string, businessType: BusinessType): FeaturePriority {
  const config = BUSINESS_TYPE_FEATURES[businessType] ?? BUSINESS_TYPE_FEATURES.generic;
  const feature = features.find(f => f.id === featureId);

  if (!feature) return 'nice_to_have';

  // Check if it's a suggested feature (critical)
  if (config.suggestedFeatures.includes(featureId)) {
    return 'critical';
  }

  // Check if the category is critical
  if (config.criticalCategories.includes(feature.category)) {
    return 'important';
  }

  // Check if the category is relevant
  if (config.relevantCategories.includes(feature.category)) {
    return 'nice_to_have';
  }

  return 'nice_to_have';
}

/**
 * Get features filtered and sorted by relevance to a business type
 */
export function getFeaturesForBusinessType(businessType: BusinessType): Feature[] {
  const config = BUSINESS_TYPE_FEATURES[businessType] ?? BUSINESS_TYPE_FEATURES.generic;

  // Sort features by priority
  return [...features].sort((a, b) => {
    const priorityOrder: Record<FeaturePriority, number> = {
      critical: 0,
      important: 1,
      nice_to_have: 2,
    };

    const aPriority = getFeaturePriority(a.id, businessType);
    const bPriority = getFeaturePriority(b.id, businessType);

    // First sort by priority
    if (priorityOrder[aPriority] !== priorityOrder[bPriority]) {
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    }

    // Then by whether category is relevant
    const aRelevant = config.relevantCategories.includes(a.category) ? 0 : 1;
    const bRelevant = config.relevantCategories.includes(b.category) ? 0 : 1;

    return aRelevant - bRelevant;
  });
}

/**
 * Get suggested features for a business type (features that are particularly important)
 */
export function getSuggestedFeaturesForBusinessType(businessType: BusinessType): Feature[] {
  const config = BUSINESS_TYPE_FEATURES[businessType] ?? BUSINESS_TYPE_FEATURES.generic;

  return config.suggestedFeatures
    .map(id => features.find(f => f.id === id))
    .filter((f): f is Feature => f !== undefined);
}

/**
 * Check if a feature category is critical for a business type
 */
export function isCriticalCategory(category: FeatureCategory, businessType: BusinessType): boolean {
  const config = BUSINESS_TYPE_FEATURES[businessType] ?? BUSINESS_TYPE_FEATURES.generic;
  return config.criticalCategories.includes(category);
}

/**
 * Get feature category info with business-type-specific relevance
 */
export function getFeatureCategoryInfo(
  category: FeatureCategory,
  businessType?: BusinessType
): {
  name: string;
  description: string;
  isCritical: boolean;
  isRelevant: boolean;
} {
  const info = featureCategories[category];

  if (!businessType) {
    return {
      ...info,
      isCritical: false,
      isRelevant: true,
    };
  }

  const config = BUSINESS_TYPE_FEATURES[businessType] ?? BUSINESS_TYPE_FEATURES.generic;

  return {
    ...info,
    isCritical: config.criticalCategories.includes(category),
    isRelevant: config.relevantCategories.includes(category),
  };
}
