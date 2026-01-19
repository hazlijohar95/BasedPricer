/**
 * Sample cost data for demonstration purposes
 */

import type { VariableCostItem, FixedCostItem } from '@basedpricer/core';

/**
 * Sample variable costs representing typical SaaS infrastructure
 */
export const SAMPLE_VARIABLE_COSTS: VariableCostItem[] = [
  {
    id: 'api-1',
    name: 'AI API Calls',
    unit: '1K tokens',
    costPerUnit: 0.03,
    usagePerCustomer: 100,
    description: 'OpenAI API usage',
  },
  {
    id: 'storage-1',
    name: 'Cloud Storage',
    unit: 'GB',
    costPerUnit: 0.10,
    usagePerCustomer: 2,
    description: 'User data storage',
  },
  {
    id: 'email-1',
    name: 'Email Service',
    unit: 'email',
    costPerUnit: 0.005,
    usagePerCustomer: 50,
    description: 'Transactional emails',
  },
];

/**
 * Sample fixed costs representing typical SaaS overhead
 */
export const SAMPLE_FIXED_COSTS: FixedCostItem[] = [
  {
    id: 'hosting-1',
    name: 'Hosting',
    monthlyCost: 50,
    description: 'Vercel Pro',
  },
  {
    id: 'db-1',
    name: 'Database',
    monthlyCost: 25,
    description: 'Supabase Pro',
  },
];
