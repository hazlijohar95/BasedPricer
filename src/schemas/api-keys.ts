/**
 * Zod schemas for API key management
 * Provides runtime validation for API keys and storage structures
 */

import { z } from 'zod';

// ============================================================================
// AI Provider Schema
// ============================================================================

export const AIProviderSchema = z.enum([
  'openai',
  'anthropic',
  'openrouter',
  'groq',
  'minimax',
  'glm',
]);
export type AIProvider = z.infer<typeof AIProviderSchema>;

// ============================================================================
// Stored API Key Schema
// ============================================================================

export const StoredAPIKeySchema = z.object({
  provider: AIProviderSchema,
  key: z.string().min(1, 'API key is required'),
  addedAt: z.number().positive(),
  lastValidated: z.number().positive().optional(),
  isValid: z.boolean().optional(),
});

export type StoredAPIKey = z.infer<typeof StoredAPIKeySchema>;

// ============================================================================
// API Key Storage Schema
// ============================================================================

export const APIKeyStorageSchema = z.object({
  keys: z.record(AIProviderSchema, StoredAPIKeySchema.nullable()),
  githubToken: z.string().optional(),
  _obfuscated: z.boolean().optional(),
});

export type APIKeyStorage = z.infer<typeof APIKeyStorageSchema>;

// ============================================================================
// Provider Info Schema
// ============================================================================

export const ProviderInfoSchema = z.object({
  name: z.string(),
  placeholder: z.string(),
  docsUrl: z.string().url(),
});

export type ProviderInfo = z.infer<typeof ProviderInfoSchema>;

// ============================================================================
// Key Format Validation Schemas
// ============================================================================

// These schemas validate API key formats for each provider
export const OpenAIKeySchema = z.string().refine(
  (key) => key.startsWith('sk-') && key.length > 20,
  { message: 'OpenAI key must start with sk- and be at least 20 characters' }
);

export const AnthropicKeySchema = z.string().regex(
  /^sk-ant-[a-zA-Z0-9-_]{20,}$/,
  { message: 'Anthropic key must start with sk-ant- followed by at least 20 alphanumeric characters' }
);

export const OpenRouterKeySchema = z.string().regex(
  /^sk-or-[a-zA-Z0-9-_]{20,}$/,
  { message: 'OpenRouter key must start with sk-or- followed by at least 20 alphanumeric characters' }
);

export const GroqKeySchema = z.string().refine(
  (key) => key.startsWith('gsk_') && key.length >= 20,
  { message: 'Groq key must start with gsk_ and be at least 20 characters' }
);

export const MinimaxKeySchema = z.string().min(20, 'MiniMax key must be at least 20 characters');

export const GLMKeySchema = z.string().min(20, 'GLM key must be at least 20 characters');

// ============================================================================
// GitHub Token Schema
// ============================================================================

export const GitHubTokenSchema = z.string().regex(
  /^(ghp_|github_pat_|gho_)[a-zA-Z0-9_]+$/,
  { message: 'GitHub token must start with ghp_, github_pat_, or gho_' }
);

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Get the appropriate key schema for a provider
 */
export function getKeySchemaForProvider(provider: AIProvider): z.ZodType<string> {
  switch (provider) {
    case 'openai':
      return OpenAIKeySchema;
    case 'anthropic':
      return AnthropicKeySchema;
    case 'openrouter':
      return OpenRouterKeySchema;
    case 'groq':
      return GroqKeySchema;
    case 'minimax':
      return MinimaxKeySchema;
    case 'glm':
      return GLMKeySchema;
  }
}

/**
 * Validate an API key for a specific provider
 */
export function validateAPIKey(provider: AIProvider, key: string): {
  success: boolean;
  error?: string;
} {
  const trimmedKey = key.trim();

  if (!trimmedKey) {
    return { success: false, error: 'API key is required' };
  }

  const schema = getKeySchemaForProvider(provider);
  const result = schema.safeParse(trimmedKey);

  if (result.success) {
    return { success: true };
  }

  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid API key format' };
}

/**
 * Validate a GitHub token
 */
export function validateGitHubToken(token: string): {
  success: boolean;
  error?: string;
} {
  const trimmedToken = token.trim();

  if (!trimmedToken) {
    return { success: false, error: 'Token is required' };
  }

  const result = GitHubTokenSchema.safeParse(trimmedToken);

  if (result.success) {
    return { success: true };
  }

  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid GitHub token format' };
}

/**
 * Validate stored API key structure
 */
export function validateStoredAPIKey(data: unknown): {
  success: boolean;
  data?: StoredAPIKey;
  error?: string;
} {
  const result = StoredAPIKeySchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid stored key data' };
}

/**
 * Check if a provider string is valid
 */
export function isValidAIProvider(provider: string): provider is AIProvider {
  return AIProviderSchema.safeParse(provider).success;
}

/**
 * Get all valid AI providers
 */
export function getAllAIProviders(): AIProvider[] {
  return AIProviderSchema.options;
}
