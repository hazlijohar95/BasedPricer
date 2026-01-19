/**
 * API Key Management Service
 * Stores and manages API keys for AI providers in localStorage
 */

export type AIProvider = 'openai' | 'anthropic' | 'openrouter' | 'minimax' | 'glm';

export interface StoredAPIKey {
  provider: AIProvider;
  key: string;
  addedAt: number;
  lastValidated?: number;
  isValid?: boolean;
}

interface APIKeyStorage {
  keys: Record<AIProvider, StoredAPIKey | null>;
  githubToken?: string;
}

const STORAGE_KEY = 'pricing-tools-api-keys';

// Key format patterns for validation
const KEY_PATTERNS: Record<AIProvider, RegExp> = {
  openai: /^sk-[a-zA-Z0-9-_]{20,}$/,
  anthropic: /^sk-ant-[a-zA-Z0-9-_]{20,}$/,
  openrouter: /^sk-or-[a-zA-Z0-9-_]{20,}$/,
  minimax: /^[a-zA-Z0-9]{20,}$/, // MiniMax uses alphanumeric keys
  glm: /^[a-zA-Z0-9._-]{20,}$/, // Zhipu GLM keys are alphanumeric with dots
};

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
 * Get all stored API keys
 */
export function getStoredKeys(): APIKeyStorage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load API keys:', e);
  }
  return { keys: { openai: null, anthropic: null, openrouter: null, minimax: null, glm: null } };
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
  const providers: AIProvider[] = ['openai', 'anthropic', 'openrouter', 'minimax', 'glm'];

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
 */
export function validateKeyFormat(provider: AIProvider, key: string): { valid: boolean; error?: string } {
  if (!key || key.trim() === '') {
    return { valid: false, error: 'API key is required' };
  }

  const trimmedKey = key.trim();
  const pattern = KEY_PATTERNS[provider];

  // For OpenAI, also accept project keys and session keys
  if (provider === 'openai') {
    if (trimmedKey.startsWith('sk-') && trimmedKey.length > 20) {
      return { valid: true };
    }
  }

  // For MiniMax and GLM, be more lenient - just check minimum length
  if (provider === 'minimax' || provider === 'glm') {
    if (trimmedKey.length >= 20) {
      return { valid: true };
    }
    return { valid: false, error: 'API key must be at least 20 characters' };
  }

  if (!pattern.test(trimmedKey)) {
    return {
      valid: false,
      error: `Invalid ${PROVIDER_INFO[provider].name} key format. Expected format: ${PROVIDER_INFO[provider].placeholder}`
    };
  }

  return { valid: true };
}

/**
 * Save API key for a provider
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
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
 * Save GitHub token
 */
export function saveGitHubToken(token: string): { success: boolean; error?: string } {
  if (!token || token.trim() === '') {
    return { success: false, error: 'Token is required' };
  }

  // GitHub tokens start with ghp_, github_pat_, or gho_
  const trimmedToken = token.trim();
  if (!trimmedToken.match(/^(ghp_|github_pat_|gho_)[a-zA-Z0-9_]+$/)) {
    return { success: false, error: 'Invalid GitHub token format' };
  }

  try {
    const storage = getStoredKeys();
    storage.githubToken = trimmedToken;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
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
