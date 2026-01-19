/**
 * AI Cost Calculator Utilities
 * Functions for estimating and calculating AI analysis costs
 */

import type { AIProvider } from '../services/api-keys';
import {
  getPricingForModel,
  getDefaultModelsForComparison,
  DEFAULT_USD_TO_MYR_RATE,
} from '../data/ai-token-pricing';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostBreakdown {
  inputCost: number;       // USD
  outputCost: number;      // USD
  totalCostUSD: number;    // USD
  totalCostMYR: number;    // MYR
  inputTokens: number;
  outputTokens: number;
  provider: AIProvider;
  modelName: string;
}

export interface CostEstimate {
  estimatedCostUSD: number;
  estimatedCostMYR: number;
  estimatedTokens: number;
  confidence: 'low' | 'medium' | 'high';
  provider: AIProvider;
  modelName: string;
}

export interface ProviderComparison {
  provider: AIProvider;
  modelName: string;
  displayName: string;
  estimatedCostUSD: number;
  estimatedCostMYR: number;
  isSelected: boolean;
}

// Rough token estimation constants
const CHARS_PER_TOKEN_ESTIMATE = 4; // Rough estimate, varies by language
const TYPICAL_OUTPUT_TOKENS = 2500; // Typical analysis output size

/**
 * Calculate actual cost from token usage
 */
export function calculateTokenCost(
  usage: TokenUsage,
  provider: AIProvider,
  model?: string,
  exchangeRate: number = DEFAULT_USD_TO_MYR_RATE
): CostBreakdown {
  // Validate input - ensure non-negative token counts
  const promptTokens = Math.max(0, usage.promptTokens ?? 0);
  const completionTokens = Math.max(0, usage.completionTokens ?? 0);

  const pricing = getPricingForModel(provider, model);

  if (!pricing) {
    // Fallback to safe defaults if pricing not found
    return {
      inputCost: 0,
      outputCost: 0,
      totalCostUSD: 0,
      totalCostMYR: 0,
      inputTokens: promptTokens,
      outputTokens: completionTokens,
      provider,
      modelName: model ?? 'unknown',
    };
  }

  const inputCost = (promptTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost = (completionTokens / 1_000_000) * pricing.outputPricePerMillion;
  const totalCostUSD = inputCost + outputCost;
  const totalCostMYR = totalCostUSD * exchangeRate;

  return {
    inputCost,
    outputCost,
    totalCostUSD,
    totalCostMYR,
    inputTokens: promptTokens,
    outputTokens: completionTokens,
    provider,
    modelName: pricing.displayName,
  };
}

/**
 * Estimate analysis cost before running
 */
export function estimateAnalysisCost(
  fileCount: number,
  totalChars: number,
  provider: AIProvider,
  model?: string,
  exchangeRate: number = DEFAULT_USD_TO_MYR_RATE
): CostEstimate {
  const pricing = getPricingForModel(provider, model);

  if (!pricing) {
    return {
      estimatedCostUSD: 0,
      estimatedCostMYR: 0,
      estimatedTokens: 0,
      confidence: 'low',
      provider,
      modelName: model ?? 'unknown',
    };
  }

  // Estimate input tokens from character count
  // Add overhead for system prompt (~500 tokens) and message formatting
  const estimatedInputTokens = Math.ceil(totalChars / CHARS_PER_TOKEN_ESTIMATE) + 500;

  // Estimate output tokens based on analysis complexity
  const estimatedOutputTokens = Math.min(
    TYPICAL_OUTPUT_TOKENS + (fileCount * 50), // More files = more features to describe
    4000 // Cap at max output
  );

  const inputCost = (estimatedInputTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost = (estimatedOutputTokens / 1_000_000) * pricing.outputPricePerMillion;
  const totalCostUSD = inputCost + outputCost;
  const totalCostMYR = totalCostUSD * exchangeRate;

  // Confidence based on data quality
  let confidence: 'low' | 'medium' | 'high' = 'medium';
  if (fileCount > 30 || totalChars > 100000) {
    confidence = 'low'; // Large repos are harder to estimate
  } else if (fileCount > 5 && totalChars > 10000) {
    confidence = 'high'; // Good data for estimation
  }

  return {
    estimatedCostUSD: totalCostUSD,
    estimatedCostMYR: totalCostMYR,
    estimatedTokens: estimatedInputTokens + estimatedOutputTokens,
    confidence,
    provider,
    modelName: pricing.displayName,
  };
}

/**
 * Compare costs across providers
 */
export function compareProviderCosts(
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
  selectedProvider: AIProvider,
  exchangeRate: number = DEFAULT_USD_TO_MYR_RATE
): ProviderComparison[] {
  const models = getDefaultModelsForComparison();

  return models.map((model) => {
    const inputCost = (estimatedInputTokens / 1_000_000) * model.inputPricePerMillion;
    const outputCost = (estimatedOutputTokens / 1_000_000) * model.outputPricePerMillion;
    const totalCostUSD = inputCost + outputCost;
    const totalCostMYR = totalCostUSD * exchangeRate;

    return {
      provider: model.provider,
      modelName: model.name,
      displayName: model.displayName,
      estimatedCostUSD: totalCostUSD,
      estimatedCostMYR: totalCostMYR,
      isSelected: model.provider === selectedProvider,
    };
  });
}

/**
 * Format cost for display
 */
export function formatCost(
  usd: number,
  myr?: number,
  options: {
    showBoth?: boolean;
    precision?: number;
  } = {}
): string {
  const { showBoth = true, precision = 2 } = options;

  // Very small costs show more precision
  const actualPrecision = usd < 0.01 ? 4 : precision;

  const usdStr = `$${usd.toFixed(actualPrecision)}`;

  if (!showBoth || myr === undefined) {
    return usdStr;
  }

  const myrPrecision = myr < 0.1 ? 4 : 2;
  return `${usdStr} (MYR ${myr.toFixed(myrPrecision)})`;
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toLocaleString();
}

/**
 * Estimate tokens from text
 */
export function estimateTokensFromText(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN_ESTIMATE);
}

/**
 * Get a rough cost category for UI indicators
 */
export function getCostCategory(usd: number): 'cheap' | 'moderate' | 'expensive' {
  if (usd < 0.05) return 'cheap';
  if (usd < 0.20) return 'moderate';
  return 'expensive';
}
