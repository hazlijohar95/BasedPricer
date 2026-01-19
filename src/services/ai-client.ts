/**
 * AI Client Abstraction
 * Unified interface for multiple AI providers
 */

import { type AIProvider, getAPIKey, updateKeyValidation } from './api-keys';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIClientConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// Default models for each provider - optimized for structured analysis tasks
const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o',           // Best for structured JSON output and code analysis
  anthropic: 'claude-sonnet-4-20250514', // Best balance of speed and intelligence
  openrouter: 'anthropic/claude-3.5-sonnet', // Claude 3.5 Sonnet via OpenRouter
  groq: 'llama-3.3-70b-versatile', // Fast inference, good for analysis (280 tps)
  minimax: 'MiniMax-M2.1',    // Open-source, excellent for coding tasks
  glm: 'glm-4.7',             // Latest GLM model from Zhipu AI
};

// Model display names for UI
export const MODEL_DISPLAY_NAMES: Record<AIProvider, string> = {
  openai: 'GPT-4o',
  anthropic: 'Claude Sonnet 4',
  openrouter: 'Claude 3.5 Sonnet',
  groq: 'Llama 3.3 70B',
  minimax: 'MiniMax M2.1',
  glm: 'GLM-4.7',
};

// Top 3 models for each provider with quality labels
export interface ModelOption {
  id: string;
  name: string;
  badge?: 'best' | 'fast' | 'balanced';
  description?: string;
}

export const PROVIDER_MODELS: Record<AIProvider, ModelOption[]> = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', badge: 'best', description: 'Best quality' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', badge: 'fast', description: 'Fast & cheap' },
    { id: 'o1-mini', name: 'o1 Mini', badge: 'balanced', description: 'Reasoning' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', badge: 'best', description: 'Best quality' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', badge: 'balanced', description: 'Great value' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', badge: 'fast', description: 'Fast & cheap' },
  ],
  openrouter: [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', badge: 'best', description: 'Best quality' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', badge: 'balanced', description: 'Great all-round' },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash', badge: 'fast', description: 'Free tier' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', badge: 'best', description: 'Best quality' },
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', badge: 'balanced', description: 'Reliable' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', badge: 'fast', description: 'Ultra fast' },
  ],
  minimax: [
    { id: 'MiniMax-M1', name: 'MiniMax M1', badge: 'best', description: '1M context' },
    { id: 'MiniMax-M2.1', name: 'MiniMax M2.1', badge: 'balanced', description: 'Good value' },
  ],
  glm: [
    { id: 'glm-4-plus', name: 'GLM-4 Plus', badge: 'best', description: 'Flagship' },
    { id: 'glm-4-flash', name: 'GLM-4 Flash', badge: 'fast', description: 'Very cheap' },
    { id: 'glm-4v-plus', name: 'GLM-4V Plus', badge: 'balanced', description: 'Vision' },
  ],
};

/**
 * Call OpenAI API
 */
async function callOpenAI(
  messages: AIMessage[],
  config: AIClientConfig
): Promise<AIResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model ?? DEFAULT_MODELS.openai,
      messages,
      max_tokens: config.maxTokens ?? 4096,
      temperature: config.temperature ?? 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // Only mark key as invalid on auth errors, not rate limits or other errors
    if (response.status === 401 || response.status === 403) {
      updateKeyValidation('openai', false);
    }
    throw new Error(error.error?.message ?? `OpenAI API error: ${response.status}`);
  }

  updateKeyValidation('openai', true);
  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content ?? '',
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
  };
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  messages: AIMessage[],
  config: AIClientConfig
): Promise<AIResponse> {
  // Extract system message if present
  const systemMessage = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model ?? DEFAULT_MODELS.anthropic,
      max_tokens: config.maxTokens ?? 4096,
      system: systemMessage?.content,
      messages: chatMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // Only mark key as invalid on auth errors, not rate limits or other errors
    if (response.status === 401 || response.status === 403) {
      updateKeyValidation('anthropic', false);
    }
    throw new Error(error.error?.message ?? `Anthropic API error: ${response.status}`);
  }

  updateKeyValidation('anthropic', true);
  const data = await response.json();

  return {
    content: data.content?.[0]?.text ?? '',
    usage: {
      promptTokens: data.usage?.input_tokens ?? 0,
      completionTokens: data.usage?.output_tokens ?? 0,
      totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    },
  };
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter(
  messages: AIMessage[],
  config: AIClientConfig
): Promise<AIResponse> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'BasedPricer',
    },
    body: JSON.stringify({
      model: config.model ?? DEFAULT_MODELS.openrouter,
      messages,
      max_tokens: config.maxTokens ?? 4096,
      temperature: config.temperature ?? 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // Only mark key as invalid on auth errors, not rate limits or other errors
    if (response.status === 401 || response.status === 403) {
      updateKeyValidation('openrouter', false);
    }
    throw new Error(error.error?.message ?? `OpenRouter API error: ${response.status}`);
  }

  updateKeyValidation('openrouter', true);
  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content ?? '',
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
  };
}

/**
 * Call Groq API (OpenAI-compatible, ultra-fast inference)
 * Groq provides extremely fast inference with their custom LPU hardware
 * Supports Llama 3.x models with speeds up to 1000+ tokens/second
 */
async function callGroq(
  messages: AIMessage[],
  config: AIClientConfig
): Promise<AIResponse> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model ?? DEFAULT_MODELS.groq,
      messages,
      max_tokens: config.maxTokens ?? 4096,
      temperature: config.temperature ?? 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // Only mark key as invalid on auth errors, not rate limits or other errors
    if (response.status === 401 || response.status === 403) {
      updateKeyValidation('groq', false);
    }
    throw new Error(error.error?.message ?? `Groq API error: ${response.status}`);
  }

  updateKeyValidation('groq', true);
  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content ?? '',
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
  };
}

/**
 * Call MiniMax API (OpenAI-compatible)
 */
async function callMiniMax(
  messages: AIMessage[],
  config: AIClientConfig
): Promise<AIResponse> {
  const response = await fetch('https://api.minimax.io/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model ?? DEFAULT_MODELS.minimax,
      messages,
      max_tokens: config.maxTokens ?? 4096,
      temperature: config.temperature ?? 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      updateKeyValidation('minimax', false);
    }
    throw new Error(error.error?.message ?? `MiniMax API error: ${response.status}`);
  }

  updateKeyValidation('minimax', true);
  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content ?? '',
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
  };
}

/**
 * Call GLM (Zhipu AI) API
 */
async function callGLM(
  messages: AIMessage[],
  config: AIClientConfig
): Promise<AIResponse> {
  const response = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model ?? DEFAULT_MODELS.glm,
      messages,
      max_tokens: config.maxTokens ?? 4096,
      temperature: config.temperature ?? 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      updateKeyValidation('glm', false);
    }
    throw new Error(error.error?.message ?? `GLM API error: ${response.status}`);
  }

  updateKeyValidation('glm', true);
  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content ?? '',
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
  };
}

/**
 * Create AI client for a specific provider
 */
export function createAIClient(provider: AIProvider, apiKey?: string) {
  const key = apiKey ?? getAPIKey(provider);
  if (!key) {
    throw new Error(`No API key found for ${provider}`);
  }

  const config: AIClientConfig = {
    provider,
    apiKey: key,
  };

  return {
    /**
     * Send a chat completion request
     */
    async chat(
      messages: AIMessage[],
      options?: Partial<Pick<AIClientConfig, 'model' | 'maxTokens' | 'temperature'>>
    ): Promise<AIResponse> {
      const fullConfig = { ...config, ...options };

      switch (provider) {
        case 'openai':
          return callOpenAI(messages, fullConfig);
        case 'anthropic':
          return callAnthropic(messages, fullConfig);
        case 'openrouter':
          return callOpenRouter(messages, fullConfig);
        case 'groq':
          return callGroq(messages, fullConfig);
        case 'minimax':
          return callMiniMax(messages, fullConfig);
        case 'glm':
          return callGLM(messages, fullConfig);
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    },

    /**
     * Simple prompt helper
     */
    async prompt(
      systemPrompt: string,
      userPrompt: string,
      options?: Partial<Pick<AIClientConfig, 'model' | 'maxTokens' | 'temperature'>>
    ): Promise<string> {
      const response = await this.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        options
      );
      return response.content;
    },
  };
}

/**
 * Get an AI client using the first available API key
 */
export function getAutoClient(): ReturnType<typeof createAIClient> | null {
  const providers: AIProvider[] = ['openai', 'anthropic', 'openrouter', 'groq', 'minimax', 'glm'];

  for (const provider of providers) {
    const key = getAPIKey(provider);
    if (key) {
      return createAIClient(provider, key);
    }
  }

  return null;
}
