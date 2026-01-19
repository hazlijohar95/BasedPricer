/**
 * Tests for API key-related Zod schemas
 */

import { describe, it, expect } from 'vitest';
import {
  AIProviderSchema,
  StoredAPIKeySchema,
  OpenAIKeySchema,
  AnthropicKeySchema,
  OpenRouterKeySchema,
  GroqKeySchema,
  GitHubTokenSchema,
  validateAPIKey,
  validateGitHubToken,
  validateStoredAPIKey,
  isValidAIProvider,
  getAllAIProviders,
} from './api-keys';

describe('AIProviderSchema', () => {
  it('accepts all valid providers', () => {
    const providers = ['openai', 'anthropic', 'openrouter', 'groq', 'minimax', 'glm'];
    providers.forEach((provider) => {
      expect(() => AIProviderSchema.parse(provider)).not.toThrow();
    });
  });

  it('rejects invalid provider', () => {
    expect(() => AIProviderSchema.parse('cohere')).toThrow();
    expect(() => AIProviderSchema.parse('google')).toThrow();
    expect(() => AIProviderSchema.parse('')).toThrow();
  });
});

describe('StoredAPIKeySchema', () => {
  it('validates correct structure', () => {
    const key = {
      provider: 'openai' as const,
      key: 'sk-test-key-12345678901234567890',
      addedAt: Date.now(),
      lastValidated: Date.now(),
      isValid: true,
    };
    expect(() => StoredAPIKeySchema.parse(key)).not.toThrow();
  });

  it('requires non-empty key', () => {
    const invalid = {
      provider: 'openai' as const,
      key: '',
      addedAt: Date.now(),
    };
    expect(() => StoredAPIKeySchema.parse(invalid)).toThrow();
  });

  it('requires positive addedAt', () => {
    const invalid = {
      provider: 'openai' as const,
      key: 'test-key',
      addedAt: -1,
    };
    expect(() => StoredAPIKeySchema.parse(invalid)).toThrow();
  });

  it('optional fields can be omitted', () => {
    const minimal = {
      provider: 'anthropic' as const,
      key: 'sk-ant-test-key-12345678901234567890',
      addedAt: Date.now(),
    };
    expect(() => StoredAPIKeySchema.parse(minimal)).not.toThrow();
  });
});

describe('OpenAIKeySchema', () => {
  it('accepts valid OpenAI key format', () => {
    expect(() => OpenAIKeySchema.parse('sk-proj-abcdefghij1234567890')).not.toThrow();
    expect(() => OpenAIKeySchema.parse('sk-1234567890123456789012345')).not.toThrow();
  });

  it('rejects invalid OpenAI key', () => {
    expect(() => OpenAIKeySchema.parse('invalid-key')).toThrow();
    expect(() => OpenAIKeySchema.parse('sk-short')).toThrow();
    expect(() => OpenAIKeySchema.parse('')).toThrow();
  });
});

describe('AnthropicKeySchema', () => {
  it('accepts valid Anthropic key format', () => {
    expect(() => AnthropicKeySchema.parse('sk-ant-api03-abcdefghij1234567890')).not.toThrow();
  });

  it('rejects invalid Anthropic key', () => {
    expect(() => AnthropicKeySchema.parse('sk-ant-short')).toThrow();
    expect(() => AnthropicKeySchema.parse('sk-1234567890')).toThrow();
  });
});

describe('OpenRouterKeySchema', () => {
  it('accepts valid OpenRouter key format', () => {
    expect(() => OpenRouterKeySchema.parse('sk-or-v1-abcdefghij1234567890')).not.toThrow();
  });

  it('rejects invalid OpenRouter key', () => {
    expect(() => OpenRouterKeySchema.parse('sk-or-short')).toThrow();
    expect(() => OpenRouterKeySchema.parse('sk-1234567890')).toThrow();
  });
});

describe('GroqKeySchema', () => {
  it('accepts valid Groq key format', () => {
    expect(() => GroqKeySchema.parse('gsk_abcdefghij1234567890')).not.toThrow();
  });

  it('rejects invalid Groq key', () => {
    expect(() => GroqKeySchema.parse('gsk_short')).toThrow();
    expect(() => GroqKeySchema.parse('sk-groq-1234567890')).toThrow();
  });
});

describe('GitHubTokenSchema', () => {
  it('accepts valid GitHub token formats', () => {
    expect(() => GitHubTokenSchema.parse('ghp_1234567890abcdefghij')).not.toThrow();
    expect(() => GitHubTokenSchema.parse('github_pat_1234567890abcdefghij')).not.toThrow();
    expect(() => GitHubTokenSchema.parse('gho_1234567890abcdefghij')).not.toThrow();
  });

  it('rejects invalid GitHub token', () => {
    expect(() => GitHubTokenSchema.parse('invalid-token')).toThrow();
    expect(() => GitHubTokenSchema.parse('ghp_')).toThrow();
    expect(() => GitHubTokenSchema.parse('')).toThrow();
  });
});

describe('validateAPIKey', () => {
  it('validates OpenAI key', () => {
    const result = validateAPIKey('openai', 'sk-proj-abcdefghij1234567890');
    expect(result.success).toBe(true);
  });

  it('validates Anthropic key', () => {
    const result = validateAPIKey('anthropic', 'sk-ant-api03-abcdefghij1234567890');
    expect(result.success).toBe(true);
  });

  it('validates Groq key', () => {
    const result = validateAPIKey('groq', 'gsk_abcdefghij1234567890');
    expect(result.success).toBe(true);
  });

  it('returns error for empty key', () => {
    const result = validateAPIKey('openai', '');
    expect(result.success).toBe(false);
    expect(result.error).toBe('API key is required');
  });

  it('returns error for whitespace-only key', () => {
    const result = validateAPIKey('openai', '   ');
    expect(result.success).toBe(false);
  });

  it('trims whitespace before validation', () => {
    const result = validateAPIKey('openai', '  sk-proj-abcdefghij1234567890  ');
    expect(result.success).toBe(true);
  });

  it('returns error message for invalid format', () => {
    const result = validateAPIKey('openai', 'invalid');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('validateGitHubToken', () => {
  it('validates valid token', () => {
    const result = validateGitHubToken('ghp_1234567890abcdefghij');
    expect(result.success).toBe(true);
  });

  it('returns error for empty token', () => {
    const result = validateGitHubToken('');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Token is required');
  });

  it('returns error for invalid format', () => {
    const result = validateGitHubToken('invalid-token');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('trims whitespace before validation', () => {
    const result = validateGitHubToken('  ghp_1234567890abcdefghij  ');
    expect(result.success).toBe(true);
  });
});

describe('validateStoredAPIKey', () => {
  it('returns success for valid key', () => {
    const key = {
      provider: 'openai' as const,
      key: 'sk-test-key-12345678901234567890',
      addedAt: Date.now(),
    };
    const result = validateStoredAPIKey(key);
    expect(result.success).toBe(true);
    expect(result.data?.provider).toBe('openai');
  });

  it('returns error for invalid key', () => {
    const result = validateStoredAPIKey({ provider: 'invalid' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('isValidAIProvider', () => {
  it('returns true for valid providers', () => {
    expect(isValidAIProvider('openai')).toBe(true);
    expect(isValidAIProvider('anthropic')).toBe(true);
    expect(isValidAIProvider('groq')).toBe(true);
  });

  it('returns false for invalid providers', () => {
    expect(isValidAIProvider('cohere')).toBe(false);
    expect(isValidAIProvider('')).toBe(false);
    expect(isValidAIProvider('OPENAI')).toBe(false);
  });
});

describe('getAllAIProviders', () => {
  it('returns all providers', () => {
    const providers = getAllAIProviders();
    expect(providers).toContain('openai');
    expect(providers).toContain('anthropic');
    expect(providers).toContain('openrouter');
    expect(providers).toContain('groq');
    expect(providers).toContain('minimax');
    expect(providers).toContain('glm');
    expect(providers).toHaveLength(6);
  });
});
