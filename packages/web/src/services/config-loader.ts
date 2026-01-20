/**
 * Configuration Loader Service
 *
 * Loads external configuration files that can be customized without code changes.
 * This enables the open-source community to:
 * - Update AI provider pricing data
 * - Add custom OpenAI-compatible providers
 * - Customize analysis prompts and business type detection
 *
 * Configuration files are located in /public/config/ and can be edited directly.
 */

// =============================================================================
// TYPES - Matching the JSON schema definitions
// =============================================================================

export interface ConfigMeta {
  version: string;
  lastUpdated: string;
  maintainers?: string[];
  updateInstructions?: string;
  description?: string;
}

// Provider Configuration Types
export interface ModelConfig {
  id: string;
  name: string;
  description?: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  contextWindow?: number;
  maxOutputTokens?: number;
  supportsVision?: boolean;
  supportsTools?: boolean;
  lastPriceUpdate?: string;
  priceSource?: string;
  notes?: string;
  deprecated?: boolean;
  deprecationDate?: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  website?: string;
  pricingPage?: string;
  apiDocsUrl?: string;
  keyDocsUrl?: string;
  keyPlaceholder?: string;
  keyPattern?: string;
  baseUrl: string;
  isOpenAICompatible?: boolean;
  supportsStreaming?: boolean;
  defaultModel: string;
  notes?: string;
  models: Record<string, ModelConfig>;
  headers?: Record<string, string>; // For custom providers
}

export interface ProvidersConfig {
  _meta: ConfigMeta;
  providers: Record<string, ProviderConfig>;
  customProviders: ProviderConfig[];
}

// Analysis Prompts Configuration Types
export interface BusinessTypeConfig {
  name: string;
  description: string;
  signals: string[];
  recommendedPricingModel: string;
  typicalTiers?: number;
  keyMetrics?: string[];
}

export interface PricingModelConfig {
  name: string;
  description: string;
  bestFor?: string[];
  considerations?: string[];
}

export interface AnalysisSettings {
  temperature: number;
  maxTokens: number;
  maxReadmeChars: number;
  maxSourceFiles: number;
  maxCharsPerFile: number;
  maxConfigFiles: number;
  maxCharsPerConfigFile: number;
}

export interface AnalysisPromptsConfig {
  _meta: ConfigMeta;
  _documentation?: Record<string, unknown>;
  systemPrompt: {
    role: string;
    objectives: string[];
    guidelines: string[];
    outputInstruction: string;
  };
  businessTypes: Record<string, BusinessTypeConfig>;
  pricingModels: Record<string, PricingModelConfig>;
  userPromptTemplate: string;
  outputSchema: Record<string, unknown>;
  analysisSettings: AnalysisSettings;
}

// =============================================================================
// CONFIG CACHE - In-memory cache with TTL
// =============================================================================

interface CacheEntry<T> {
  data: T;
  loadedAt: number;
  expiresAt: number;
}

const CONFIG_CACHE: {
  providers?: CacheEntry<ProvidersConfig>;
  analysisPrompts?: CacheEntry<AnalysisPromptsConfig>;
} = {};

// Cache TTL: 5 minutes (configs rarely change during a session)
const CACHE_TTL_MS = 5 * 60 * 1000;

// =============================================================================
// LOADER FUNCTIONS
// =============================================================================

/**
 * Load AI providers configuration
 * Includes built-in providers and any user-added custom providers
 */
export async function loadProvidersConfig(): Promise<ProvidersConfig> {
  // Check cache
  if (CONFIG_CACHE.providers && Date.now() < CONFIG_CACHE.providers.expiresAt) {
    return CONFIG_CACHE.providers.data;
  }

  try {
    const response = await fetch('/config/ai-providers.json');
    if (!response.ok) {
      throw new Error(`Failed to load providers config: ${response.status}`);
    }

    const config: ProvidersConfig = await response.json();

    // Merge any locally stored custom providers
    const localCustomProviders = loadLocalCustomProviders();
    if (localCustomProviders.length > 0) {
      config.customProviders = [...config.customProviders, ...localCustomProviders];
    }

    // Cache the result
    CONFIG_CACHE.providers = {
      data: config,
      loadedAt: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return config;
  } catch (error) {
    console.error('Failed to load providers config:', error);
    // Return fallback minimal config
    return getFallbackProvidersConfig();
  }
}

/**
 * Load analysis prompts configuration
 */
export async function loadAnalysisPromptsConfig(): Promise<AnalysisPromptsConfig> {
  // Check cache
  if (CONFIG_CACHE.analysisPrompts && Date.now() < CONFIG_CACHE.analysisPrompts.expiresAt) {
    return CONFIG_CACHE.analysisPrompts.data;
  }

  try {
    const response = await fetch('/config/analysis-prompts.json');
    if (!response.ok) {
      throw new Error(`Failed to load analysis prompts config: ${response.status}`);
    }

    const config: AnalysisPromptsConfig = await response.json();

    // Cache the result
    CONFIG_CACHE.analysisPrompts = {
      data: config,
      loadedAt: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return config;
  } catch (error) {
    console.error('Failed to load analysis prompts config:', error);
    return getFallbackAnalysisPromptsConfig();
  }
}

/**
 * Clear config cache (useful after config updates)
 */
export function clearConfigCache(): void {
  delete CONFIG_CACHE.providers;
  delete CONFIG_CACHE.analysisPrompts;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get freshness indicator for display
 */
export function getPricingFreshness(lastUpdate: string): {
  status: 'fresh' | 'recent' | 'stale';
  label: string;
  daysOld: number;
} {
  const updateDate = new Date(lastUpdate);
  const now = new Date();
  const daysOld = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysOld <= 7) {
    return { status: 'fresh', label: 'Updated this week', daysOld };
  } else if (daysOld <= 30) {
    return { status: 'recent', label: `Updated ${daysOld} days ago`, daysOld };
  } else {
    return { status: 'stale', label: `${daysOld} days old - may be outdated`, daysOld };
  }
}

// =============================================================================
// CUSTOM PROVIDER MANAGEMENT
// =============================================================================

const LOCAL_CUSTOM_PROVIDERS_KEY = 'pricing-tools-custom-providers';

/**
 * Load custom providers from localStorage
 */
function loadLocalCustomProviders(): ProviderConfig[] {
  try {
    const stored = localStorage.getItem(LOCAL_CUSTOM_PROVIDERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load custom providers:', e);
  }
  return [];
}

/**
 * Save a custom provider to localStorage
 */
export function saveCustomProvider(provider: ProviderConfig): { success: boolean; error?: string } {
  // Validate provider ID format
  if (!provider.id.startsWith('custom_')) {
    return { success: false, error: 'Custom provider ID must start with "custom_"' };
  }

  // Validate required fields
  if (!provider.name || !provider.baseUrl || !provider.defaultModel) {
    return { success: false, error: 'Name, baseUrl, and defaultModel are required' };
  }

  // Validate at least one model exists
  if (!provider.models || Object.keys(provider.models).length === 0) {
    return { success: false, error: 'At least one model must be defined' };
  }

  try {
    const existing = loadLocalCustomProviders();
    const index = existing.findIndex(p => p.id === provider.id);

    if (index >= 0) {
      existing[index] = provider;
    } else {
      existing.push(provider);
    }

    localStorage.setItem(LOCAL_CUSTOM_PROVIDERS_KEY, JSON.stringify(existing));

    // Clear cache to reload with new provider
    clearConfigCache();

    return { success: true };
  } catch (e) {
    console.error('Failed to save custom provider:', e);
    return { success: false, error: 'Failed to save to localStorage' };
  }
}

/**
 * Remove a custom provider
 */
export function removeCustomProvider(providerId: string): void {
  try {
    const existing = loadLocalCustomProviders();
    const filtered = existing.filter(p => p.id !== providerId);
    localStorage.setItem(LOCAL_CUSTOM_PROVIDERS_KEY, JSON.stringify(filtered));
    clearConfigCache();
  } catch (e) {
    console.error('Failed to remove custom provider:', e);
  }
}

/**
 * Get all custom providers
 */
export function getCustomProviders(): ProviderConfig[] {
  return loadLocalCustomProviders();
}

// =============================================================================
// FALLBACK CONFIGS - Used when fetch fails
// =============================================================================

function getFallbackProvidersConfig(): ProvidersConfig {
  return {
    _meta: {
      version: '1.0.0',
      lastUpdated: new Date().toISOString().split('T')[0],
      description: 'Fallback configuration - external config failed to load',
    },
    providers: {
      openai: {
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        isOpenAICompatible: true,
        defaultModel: 'gpt-4o',
        keyDocsUrl: 'https://platform.openai.com/api-keys',
        keyPlaceholder: 'sk-proj-...',
        models: {
          'gpt-4o': {
            id: 'gpt-4o',
            name: 'GPT-4o',
            inputPricePerMillion: 2.50,
            outputPricePerMillion: 10.00,
            contextWindow: 128000,
          },
        },
      },
      anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com',
        isOpenAICompatible: false,
        defaultModel: 'claude-sonnet-4-20250514',
        keyDocsUrl: 'https://console.anthropic.com/settings/keys',
        keyPlaceholder: 'sk-ant-...',
        models: {
          'claude-sonnet-4-20250514': {
            id: 'claude-sonnet-4-20250514',
            name: 'Claude Sonnet 4',
            inputPricePerMillion: 3.00,
            outputPricePerMillion: 15.00,
            contextWindow: 200000,
          },
        },
      },
    },
    customProviders: [],
  };
}

function getFallbackAnalysisPromptsConfig(): AnalysisPromptsConfig {
  return {
    _meta: {
      version: '1.0.0',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    systemPrompt: {
      role: 'You are an expert SaaS pricing analyst.',
      objectives: ['Analyze codebases for pricing-relevant features'],
      guidelines: ['Look for monetizable features', 'Identify cost drivers'],
      outputInstruction: 'Respond with valid JSON only.',
    },
    businessTypes: {
      generic: {
        name: 'Generic SaaS',
        description: 'Standard SaaS application',
        signals: [],
        recommendedPricingModel: 'feature_tiered',
      },
    },
    pricingModels: {
      feature_tiered: {
        name: 'Feature-Tiered',
        description: 'Different features at different price points',
      },
    },
    userPromptTemplate: 'Analyze this codebase:\n{sourceFiles}',
    outputSchema: {},
    analysisSettings: {
      temperature: 0.2,
      maxTokens: 4096,
      maxReadmeChars: 5000,
      maxSourceFiles: 20,
      maxCharsPerFile: 4000,
      maxConfigFiles: 5,
      maxCharsPerConfigFile: 2000,
    },
  };
}
