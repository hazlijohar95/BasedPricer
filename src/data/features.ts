export type FeatureSource = 'codebase' | 'manual';

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
