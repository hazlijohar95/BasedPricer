/**
 * AI Cost Calculator
 * Utilities for estimating and calculating AI/LLM API costs
 */

import type { AIProvider } from '../types';
import {
  getPricingForModel,
  DEFAULT_USD_TO_MYR_RATE,
  AI_ESTIMATION,
  ANALYSIS_COMPLEXITY_THRESHOLDS,
  COST_CATEGORY_THRESHOLDS,
  FORMAT_PRECISION_THRESHOLDS,
  TOKEN_FORMAT_THRESHOLDS,
} from '../data';

// ============================================================================
// Types
// ============================================================================

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AICostBreakdown {
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

// ============================================================================
// Token Cost Calculations
// ============================================================================

/**
 * Calculate actual cost from token usage
 */
export function calculateTokenCost(
  usage: TokenUsage,
  provider: AIProvider,
  model?: string,
  exchangeRate: number = DEFAULT_USD_TO_MYR_RATE
): AICostBreakdown {
  const promptTokens = Math.max(0, usage.promptTokens ?? 0);
  const completionTokens = Math.max(0, usage.completionTokens ?? 0);

  const pricing = getPricingForModel(provider, model);

  if (!pricing) {
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
 * Calculate cost for a given number of tokens
 */
export function calculateCostForTokens(
  inputTokens: number,
  outputTokens: number,
  provider: AIProvider,
  model?: string,
  exchangeRate: number = DEFAULT_USD_TO_MYR_RATE
): { costUSD: number; costMYR: number } {
  const pricing = getPricingForModel(provider, model);

  if (!pricing) {
    return { costUSD: 0, costMYR: 0 };
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePerMillion;
  const costUSD = inputCost + outputCost;

  return {
    costUSD,
    costMYR: costUSD * exchangeRate,
  };
}

// ============================================================================
// Cost Estimation
// ============================================================================

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
  // Add overhead for system prompt and message formatting
  const estimatedInputTokens = Math.ceil(totalChars / AI_ESTIMATION.CHARS_PER_TOKEN) + AI_ESTIMATION.SYSTEM_PROMPT_OVERHEAD;

  // Estimate output tokens based on analysis complexity
  const estimatedOutputTokens = Math.min(
    AI_ESTIMATION.TYPICAL_OUTPUT_TOKENS + (fileCount * AI_ESTIMATION.TOKENS_PER_FILE),
    AI_ESTIMATION.MAX_OUTPUT_TOKENS
  );

  const inputCost = (estimatedInputTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost = (estimatedOutputTokens / 1_000_000) * pricing.outputPricePerMillion;
  const totalCostUSD = inputCost + outputCost;
  const totalCostMYR = totalCostUSD * exchangeRate;

  // Confidence based on data quality
  let confidence: 'low' | 'medium' | 'high' = 'medium';
  if (fileCount > ANALYSIS_COMPLEXITY_THRESHOLDS.COMPLEX_FILE_COUNT || totalChars > ANALYSIS_COMPLEXITY_THRESHOLDS.COMPLEX_CHAR_COUNT) {
    confidence = 'low';
  } else if (fileCount > ANALYSIS_COMPLEXITY_THRESHOLDS.MEDIUM_FILE_COUNT && totalChars > ANALYSIS_COMPLEXITY_THRESHOLDS.MEDIUM_CHAR_COUNT) {
    confidence = 'high';
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
 * Estimate tokens from text
 */
export function estimateTokensFromText(text: string): number {
  return Math.ceil(text.length / AI_ESTIMATION.CHARS_PER_TOKEN);
}

/**
 * Estimate tokens from character count
 */
export function estimateTokensFromChars(charCount: number): number {
  return Math.ceil(charCount / AI_ESTIMATION.CHARS_PER_TOKEN);
}

// ============================================================================
// Provider Comparison
// ============================================================================

/**
 * Compare costs across multiple providers
 */
export function compareProviderCosts(
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
  selectedProvider: AIProvider,
  providers: AIProvider[] = ['openai', 'anthropic', 'groq', 'minimax'],
  exchangeRate: number = DEFAULT_USD_TO_MYR_RATE
): ProviderComparison[] {
  return providers.map((provider) => {
    const pricing = getPricingForModel(provider);

    if (!pricing) {
      return {
        provider,
        modelName: 'unknown',
        displayName: 'Unknown',
        estimatedCostUSD: 0,
        estimatedCostMYR: 0,
        isSelected: provider === selectedProvider,
      };
    }

    const inputCost = (estimatedInputTokens / 1_000_000) * pricing.inputPricePerMillion;
    const outputCost = (estimatedOutputTokens / 1_000_000) * pricing.outputPricePerMillion;
    const totalCostUSD = inputCost + outputCost;

    return {
      provider,
      modelName: pricing.name,
      displayName: pricing.displayName,
      estimatedCostUSD: totalCostUSD,
      estimatedCostMYR: totalCostUSD * exchangeRate,
      isSelected: provider === selectedProvider,
    };
  });
}

// ============================================================================
// Formatting
// ============================================================================

/**
 * Format cost for display
 */
export function formatCost(
  usd: number,
  myr?: number,
  options: { showBoth?: boolean; precision?: number } = {}
): string {
  const { showBoth = true, precision = 2 } = options;

  const actualPrecision = usd < FORMAT_PRECISION_THRESHOLDS.USD ? 4 : precision;
  const usdStr = `$${usd.toFixed(actualPrecision)}`;

  if (!showBoth || myr === undefined) {
    return usdStr;
  }

  const myrPrecision = myr < FORMAT_PRECISION_THRESHOLDS.MYR ? 4 : 2;
  return `${usdStr} (MYR ${myr.toFixed(myrPrecision)})`;
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens >= TOKEN_FORMAT_THRESHOLDS.MILLION) {
    return `${(tokens / TOKEN_FORMAT_THRESHOLDS.MILLION).toFixed(1)}M`;
  }
  if (tokens >= TOKEN_FORMAT_THRESHOLDS.THOUSAND) {
    return `${(tokens / TOKEN_FORMAT_THRESHOLDS.THOUSAND).toFixed(1)}k`;
  }
  return tokens.toLocaleString();
}

/**
 * Get a rough cost category for UI indicators
 */
export function getCostCategory(usd: number): 'cheap' | 'moderate' | 'expensive' {
  if (usd < COST_CATEGORY_THRESHOLDS.CHEAP) return 'cheap';
  if (usd < COST_CATEGORY_THRESHOLDS.MODERATE) return 'moderate';
  return 'expensive';
}

// ============================================================================
// Monthly Cost Projections
// ============================================================================

/**
 * Calculate monthly AI costs per customer
 */
export function calculateMonthlyAICostPerCustomer(
  avgInputTokensPerRequest: number,
  avgOutputTokensPerRequest: number,
  requestsPerCustomerPerMonth: number,
  provider: AIProvider,
  model?: string,
  exchangeRate: number = DEFAULT_USD_TO_MYR_RATE
): { costUSD: number; costMYR: number } {
  const totalInputTokens = avgInputTokensPerRequest * requestsPerCustomerPerMonth;
  const totalOutputTokens = avgOutputTokensPerRequest * requestsPerCustomerPerMonth;

  return calculateCostForTokens(
    totalInputTokens,
    totalOutputTokens,
    provider,
    model,
    exchangeRate
  );
}
