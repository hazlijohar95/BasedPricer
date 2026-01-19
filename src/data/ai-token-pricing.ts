/**
 * AI Token Pricing Data
 * Current pricing as of January 2026 - should be periodically updated
 */

import type { AIProvider } from '../services/api-keys';

export interface AIModelPricing {
  name: string;
  displayName: string;
  inputPricePerMillion: number;  // USD per 1M input tokens
  outputPricePerMillion: number; // USD per 1M output tokens
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

// Current exchange rate - should be fetched dynamically in production
export const DEFAULT_USD_TO_MYR_RATE = 4.47;

/**
 * AI Provider pricing data
 */
export const AI_PRICING: Record<AIProvider, ProviderPricing> = {
  openai: {
    provider: 'openai',
    providerName: 'OpenAI',
    defaultModel: 'gpt-4o',
    models: {
      'gpt-4o': {
        name: 'gpt-4o',
        displayName: 'GPT-4o',
        inputPricePerMillion: 2.50,
        outputPricePerMillion: 10.00,
        lastUpdated: '2026-01-01',
        contextWindow: 128000,
      },
      'gpt-4o-mini': {
        name: 'gpt-4o-mini',
        displayName: 'GPT-4o Mini',
        inputPricePerMillion: 0.15,
        outputPricePerMillion: 0.60,
        lastUpdated: '2026-01-01',
        contextWindow: 128000,
      },
      'gpt-4-turbo': {
        name: 'gpt-4-turbo',
        displayName: 'GPT-4 Turbo',
        inputPricePerMillion: 10.00,
        outputPricePerMillion: 30.00,
        lastUpdated: '2026-01-01',
        contextWindow: 128000,
      },
    },
  },
  anthropic: {
    provider: 'anthropic',
    providerName: 'Anthropic',
    defaultModel: 'claude-sonnet-4-20250514',
    models: {
      'claude-sonnet-4-20250514': {
        name: 'claude-sonnet-4-20250514',
        displayName: 'Claude Sonnet 4',
        inputPricePerMillion: 3.00,
        outputPricePerMillion: 15.00,
        lastUpdated: '2026-01-01',
        contextWindow: 200000,
      },
      'claude-3-5-sonnet-20241022': {
        name: 'claude-3-5-sonnet-20241022',
        displayName: 'Claude 3.5 Sonnet',
        inputPricePerMillion: 3.00,
        outputPricePerMillion: 15.00,
        lastUpdated: '2026-01-01',
        contextWindow: 200000,
      },
      'claude-3-opus-20240229': {
        name: 'claude-3-opus-20240229',
        displayName: 'Claude 3 Opus',
        inputPricePerMillion: 15.00,
        outputPricePerMillion: 75.00,
        lastUpdated: '2026-01-01',
        contextWindow: 200000,
      },
      'claude-3-haiku-20240307': {
        name: 'claude-3-haiku-20240307',
        displayName: 'Claude 3 Haiku',
        inputPricePerMillion: 0.25,
        outputPricePerMillion: 1.25,
        lastUpdated: '2026-01-01',
        contextWindow: 200000,
      },
    },
  },
  openrouter: {
    provider: 'openrouter',
    providerName: 'OpenRouter',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    models: {
      'anthropic/claude-3.5-sonnet': {
        name: 'anthropic/claude-3.5-sonnet',
        displayName: 'Claude 3.5 Sonnet (via OpenRouter)',
        inputPricePerMillion: 3.00,
        outputPricePerMillion: 15.00,
        lastUpdated: '2026-01-01',
        contextWindow: 200000,
        notes: 'OpenRouter adds small markup',
      },
      'openai/gpt-4o': {
        name: 'openai/gpt-4o',
        displayName: 'GPT-4o (via OpenRouter)',
        inputPricePerMillion: 2.50,
        outputPricePerMillion: 10.00,
        lastUpdated: '2026-01-01',
        contextWindow: 128000,
        notes: 'OpenRouter adds small markup',
      },
    },
  },
  minimax: {
    provider: 'minimax',
    providerName: 'MiniMax',
    defaultModel: 'MiniMax-M2.1',
    models: {
      'MiniMax-M2.1': {
        name: 'MiniMax-M2.1',
        displayName: 'MiniMax M2.1',
        inputPricePerMillion: 0.12,
        outputPricePerMillion: 0.60,
        lastUpdated: '2026-01-01',
        contextWindow: 200000,
        notes: 'Open-source, excellent for coding tasks',
      },
      'MiniMax-M1': {
        name: 'MiniMax-M1',
        displayName: 'MiniMax M1',
        inputPricePerMillion: 0.40,
        outputPricePerMillion: 2.20,
        lastUpdated: '2026-01-01',
        contextWindow: 1000000,
        notes: 'Reasoning model with 1M context',
      },
    },
  },
  glm: {
    provider: 'glm',
    providerName: 'GLM (Zhipu)',
    defaultModel: 'glm-4.7',
    models: {
      'glm-4.7': {
        name: 'glm-4.7',
        displayName: 'GLM-4.7',
        inputPricePerMillion: 0.60,
        outputPricePerMillion: 2.20,
        lastUpdated: '2026-01-01',
        contextWindow: 200000,
        notes: 'Latest GLM model, competitive with frontier models',
      },
      'glm-4.5': {
        name: 'glm-4.5',
        displayName: 'GLM-4.5',
        inputPricePerMillion: 0.35,
        outputPricePerMillion: 1.55,
        lastUpdated: '2026-01-01',
        contextWindow: 131000,
      },
      'glm-4.5-flash': {
        name: 'glm-4.5-flash',
        displayName: 'GLM-4.5 Flash',
        inputPricePerMillion: 0.00,
        outputPricePerMillion: 0.00,
        lastUpdated: '2026-01-01',
        contextWindow: 131000,
        notes: 'Free tier available',
      },
    },
  },
};

/**
 * Get pricing for a specific provider's default model
 */
export function getPricingForProvider(provider: AIProvider): AIModelPricing | null {
  const providerPricing = AI_PRICING[provider];
  if (!providerPricing) return null;

  return providerPricing.models[providerPricing.defaultModel] ?? null;
}

/**
 * Get pricing for a specific model
 */
export function getPricingForModel(
  provider: AIProvider,
  modelId?: string
): AIModelPricing | null {
  const providerPricing = AI_PRICING[provider];
  if (!providerPricing) return null;

  const model = modelId ?? providerPricing.defaultModel;
  return providerPricing.models[model] ?? null;
}

/**
 * Get all available models for comparison
 */
export function getAllModels(): Array<AIModelPricing & { provider: AIProvider }> {
  const models: Array<AIModelPricing & { provider: AIProvider }> = [];

  for (const [provider, pricing] of Object.entries(AI_PRICING)) {
    for (const model of Object.values(pricing.models)) {
      models.push({ ...model, provider: provider as AIProvider });
    }
  }

  return models;
}

/**
 * Get the default models for comparison
 */
export function getDefaultModelsForComparison(): Array<AIModelPricing & { provider: AIProvider }> {
  return [
    { ...AI_PRICING.anthropic.models['claude-sonnet-4-20250514'], provider: 'anthropic' },
    { ...AI_PRICING.openai.models['gpt-4o'], provider: 'openai' },
    { ...AI_PRICING.openrouter.models['anthropic/claude-3.5-sonnet'], provider: 'openrouter' },
    { ...AI_PRICING.minimax.models['MiniMax-M2.1'], provider: 'minimax' },
    { ...AI_PRICING.glm.models['glm-4.7'], provider: 'glm' },
  ];
}
