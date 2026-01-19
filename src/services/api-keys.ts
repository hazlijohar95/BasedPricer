/**
 * API Key Management Service
 * Stores and manages API keys for AI providers in localStorage
 * Keys are obfuscated to prevent casual inspection
 *
 * Uses Zod schemas for runtime validation
 */

import {
  validateAPIKey as zodValidateAPIKey,
  validateGitHubToken as zodValidateGitHubToken,
  type AIProvider,
  type StoredAPIKey,
} from '../schemas/api-keys';

// Re-export types from schemas for backwards compatibility
export type { AIProvider, StoredAPIKey };

interface APIKeyStorage {
  keys: Record<AIProvider, StoredAPIKey | null>;
  githubToken?: string;
  _obfuscated?: boolean; // Marker for obfuscated storage
}

const STORAGE_KEY = 'pricing-tools-api-keys';
const OBFUSCATION_KEY = 'pT$k3y'; // Simple obfuscation seed

/**
 * Simple XOR-based obfuscation (not encryption, but deters casual inspection)
 */
function obfuscate(text: string): string {
  const result: number[] = [];
  for (let i = 0; i < text.length; i++) {
    result.push(text.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length));
  }
  return btoa(String.fromCharCode(...result));
}

/**
 * Deobfuscate a string
 */
function deobfuscate(encoded: string): string {
  try {
    const decoded = atob(encoded);
    const result: number[] = [];
    for (let i = 0; i < decoded.length; i++) {
      result.push(decoded.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length));
    }
    return String.fromCharCode(...result);
  } catch {
    return encoded; // Return as-is if deobfuscation fails
  }
}

/**
 * Obfuscate sensitive fields in storage
 */
function obfuscateStorage(storage: APIKeyStorage): APIKeyStorage {
  const obfuscated: APIKeyStorage = {
    keys: { openai: null, anthropic: null, openrouter: null, groq: null, minimax: null, glm: null },
    _obfuscated: true
  };

  for (const [provider, keyData] of Object.entries(storage.keys)) {
    if (keyData) {
      obfuscated.keys[provider as AIProvider] = {
        ...keyData,
        key: obfuscate(keyData.key),
      };
    }
  }

  if (storage.githubToken) {
    obfuscated.githubToken = obfuscate(storage.githubToken);
  }

  return obfuscated;
}

/**
 * Deobfuscate sensitive fields in storage
 */
function deobfuscateStorage(storage: APIKeyStorage): APIKeyStorage {
  if (!storage._obfuscated) {
    return storage; // Already plaintext (legacy)
  }

  const deobfuscated: APIKeyStorage = {
    keys: { openai: null, anthropic: null, openrouter: null, groq: null, minimax: null, glm: null }
  };

  for (const [provider, keyData] of Object.entries(storage.keys)) {
    if (keyData) {
      deobfuscated.keys[provider as AIProvider] = {
        ...keyData,
        key: deobfuscate(keyData.key),
      };
    }
  }

  if (storage.githubToken) {
    deobfuscated.githubToken = deobfuscate(storage.githubToken);
  }

  return deobfuscated;
}

// NOTE: Key format validation is now handled by Zod schemas in ../schemas/api-keys.ts
// The regex patterns have been moved there for consistency

// Provider display names
export const PROVIDER_INFO: Record<AIProvider, { name: string; placeholder: string; docsUrl: string }> = {
  openai: {
    name: 'OpenAI',
    placeholder: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    name: 'Anthropic',
    placeholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  openrouter: {
    name: 'OpenRouter',
    placeholder: 'sk-or-...',
    docsUrl: 'https://openrouter.ai/keys',
  },
  groq: {
    name: 'Groq',
    placeholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
  },
  minimax: {
    name: 'MiniMax',
    placeholder: 'Your API key...',
    docsUrl: 'https://platform.minimax.io/user-center/basic-information',
  },
  glm: {
    name: 'GLM (Zhipu)',
    placeholder: 'Your API key...',
    docsUrl: 'https://z.ai/manage-apikey/apikey-list',
  },
};

/**
 * Get all stored API keys (handles both obfuscated and legacy plaintext)
 */
export function getStoredKeys(): APIKeyStorage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as APIKeyStorage;
      return deobfuscateStorage(parsed);
    }
  } catch (e) {
    console.error('Failed to load API keys:', e);
  }
  return { keys: { openai: null, anthropic: null, openrouter: null, groq: null, minimax: null, glm: null } };
}

/**
 * Get API key for a specific provider
 */
export function getAPIKey(provider: AIProvider): string | null {
  const storage = getStoredKeys();
  return storage.keys[provider]?.key ?? null;
}

/**
 * Get the first available API key (for fallback)
 */
export function getFirstAvailableKey(): { provider: AIProvider; key: string } | null {
  const storage = getStoredKeys();
  const providers: AIProvider[] = ['openai', 'anthropic', 'openrouter', 'groq', 'minimax', 'glm'];

  for (const provider of providers) {
    const stored = storage.keys[provider];
    if (stored?.key && stored.isValid !== false) {
      return { provider, key: stored.key };
    }
  }
  return null;
}

/**
 * Validate API key format (not actual API validation)
 * Uses Zod schemas for consistent validation across the app
 */
export function validateKeyFormat(provider: AIProvider, key: string): { valid: boolean; error?: string } {
  const result = zodValidateAPIKey(provider, key);
  return { valid: result.success, error: result.error };
}

/**
 * Save API key for a provider (stored obfuscated)
 */
export function saveAPIKey(provider: AIProvider, key: string): { success: boolean; error?: string } {
  const validation = validateKeyFormat(provider, key);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const storage = getStoredKeys();
    storage.keys[provider] = {
      provider,
      key: key.trim(),
      addedAt: Date.now(),
      isValid: undefined, // Will be validated on first use
    };
    // Store obfuscated to prevent casual inspection
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obfuscateStorage(storage)));
    return { success: true };
  } catch (e) {
    console.error('Failed to save API key:', e);
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      return { success: false, error: 'Storage quota exceeded. Clear browser data or use a different browser.' };
    }
    return { success: false, error: 'Failed to save key to storage' };
  }
}

/**
 * Remove API key for a provider
 */
export function removeAPIKey(provider: AIProvider): void {
  try {
    const storage = getStoredKeys();
    storage.keys[provider] = null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obfuscateStorage(storage)));
  } catch (e) {
    console.error('Failed to remove API key:', e);
  }
}

/**
 * Update key validation status after API call
 */
export function updateKeyValidation(provider: AIProvider, isValid: boolean): void {
  try {
    const storage = getStoredKeys();
    if (storage.keys[provider]) {
      storage.keys[provider]!.isValid = isValid;
      storage.keys[provider]!.lastValidated = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obfuscateStorage(storage)));
    }
  } catch (e) {
    console.error('Failed to update key validation:', e);
  }
}

/**
 * Get GitHub token
 */
export function getGitHubToken(): string | null {
  const storage = getStoredKeys();
  return storage.githubToken ?? null;
}

/**
 * Save GitHub token (stored obfuscated)
 * Uses Zod validation for consistent format checking
 */
export function saveGitHubToken(token: string): { success: boolean; error?: string } {
  // Use Zod schema validation
  const validation = zodValidateGitHubToken(token);
  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  try {
    const storage = getStoredKeys();
    storage.githubToken = token.trim();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obfuscateStorage(storage)));
    return { success: true };
  } catch (e) {
    console.error('Failed to save GitHub token:', e);
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      return { success: false, error: 'Storage quota exceeded. Clear browser data or use a different browser.' };
    }
    return { success: false, error: 'Failed to save token to storage' };
  }
}

/**
 * Remove GitHub token
 */
export function removeGitHubToken(): void {
  try {
    const storage = getStoredKeys();
    delete storage.githubToken;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obfuscateStorage(storage)));
  } catch (e) {
    console.error('Failed to remove GitHub token:', e);
  }
}

/**
 * Check if any AI key is configured
 */
export function hasAnyAIKey(): boolean {
  return getFirstAvailableKey() !== null;
}

/**
 * Mask API key for display (show first 7 and last 4 chars)
 */
export function maskAPIKey(key: string): string {
  if (key.length <= 15) {
    return key.slice(0, 4) + '...' + key.slice(-4);
  }
  return key.slice(0, 7) + '...' + key.slice(-4);
}
