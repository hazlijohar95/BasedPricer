/**
 * Cost Presets
 * Pre-configured cost templates for different SaaS business types
 */

import type { VariableCostItem, FixedCostItem } from '../utils/costCalculator';

export interface CostPreset {
  name: string;
  description: string;
  variableCosts: VariableCostItem[];
  fixedCosts: FixedCostItem[];
}

export const COST_PRESETS: Record<string, CostPreset> = {
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

// Type helper for preset keys
export type CostPresetKey = keyof typeof COST_PRESETS;
