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
 * Get a specific provider by ID (includes custom providers)
 */
export async function getProviderConfig(providerId: string): Promise<ProviderConfig | null> {
  const config = await loadProvidersConfig();

  // Check built-in providers
  if (config.providers[providerId]) {
    return config.providers[providerId];
  }

  // Check custom providers
  const customProvider = config.customProviders.find(p => p.id === providerId);
  if (customProvider) {
    return customProvider;
  }

  return null;
}

/**
 * Get all available providers (built-in + custom)
 */
export async function getAllProviders(): Promise<ProviderConfig[]> {
  const config = await loadProvidersConfig();
  return [
    ...Object.values(config.providers),
    ...config.customProviders,
  ];
}

/**
 * Get pricing info for a specific model
 */
export async function getModelPricing(providerId: string, modelId?: string): Promise<ModelConfig | null> {
  const provider = await getProviderConfig(providerId);
  if (!provider) return null;

  const targetModelId = modelId ?? provider.defaultModel;
  return provider.models[targetModelId] ?? null;
}

/**
 * Check if pricing data is stale (older than 30 days)
 */
export function isPricingStale(lastUpdate: string): boolean {
  const updateDate = new Date(lastUpdate);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return updateDate < thirtyDaysAgo;
}

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

/**
 * Build the complete system prompt from config
 */
export async function buildSystemPrompt(): Promise<string> {
  const config = await loadAnalysisPromptsConfig();
  const { systemPrompt, businessTypes } = config;

  // Build business type definitions
  const businessTypeDefs = Object.entries(businessTypes)
    .map(([id, bt]) => `- ${id}: ${bt.description} (signals: ${bt.signals.join(', ')})`)
    .join('\n');

  return `${systemPrompt.role}

Key objectives:
${systemPrompt.objectives.map((o, i) => `${i + 1}. **${o}**`).join('\n')}

Business Type Definitions:
${businessTypeDefs}

Analysis guidelines:
${systemPrompt.guidelines.map(g => `- ${g}`).join('\n')}

${systemPrompt.outputInstruction}`;
}

/**
 * Build the user prompt with codebase data
 */
export async function buildUserPrompt(data: {
  repoName: string;
  repoDescription: string;
  language: string;
  dependencies: string;
  readme: string;
  sourceFiles: string;
}): Promise<string> {
  const config = await loadAnalysisPromptsConfig();

  let prompt = config.userPromptTemplate
    .replace('{repoName}', data.repoName)
    .replace('{repoDescription}', data.repoDescription)
    .replace('{language}', data.language)
    .replace('{dependencies}', data.dependencies)
    .replace('{readme}', data.readme)
    .replace('{sourceFiles}', data.sourceFiles);

  // Replace output schema placeholder with actual schema
  prompt = prompt.replace('{outputSchema}', JSON.stringify(config.outputSchema, null, 2));

  return prompt;
}

/**
 * Get analysis settings
 */
export async function getAnalysisSettings(): Promise<AnalysisSettings> {
  const config = await loadAnalysisPromptsConfig();
  return config.analysisSettings;
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

// =============================================================================
// EXPORTS FOR BACKWARD COMPATIBILITY
// =============================================================================

/**
 * Convert loaded config to the legacy AI_PRICING format
 * This allows gradual migration without breaking existing code
 */
export async function getLegacyPricingFormat(): Promise<Record<string, {
  provider: string;
  providerName: string;
  defaultModel: string;
  models: Record<string, {
    name: string;
    displayName: string;
    inputPricePerMillion: number;
    outputPricePerMillion: number;
    lastUpdated: string;
    contextWindow: number;
    notes?: string;
  }>;
}>> {
  const config = await loadProvidersConfig();
  const result: Record<string, unknown> = {};

  for (const [id, provider] of Object.entries(config.providers)) {
    const models: Record<string, unknown> = {};

    for (const [modelId, model] of Object.entries(provider.models)) {
      models[modelId] = {
        name: model.id,
        displayName: model.name,
        inputPricePerMillion: model.inputPricePerMillion,
        outputPricePerMillion: model.outputPricePerMillion,
        lastUpdated: model.lastPriceUpdate ?? config._meta.lastUpdated,
        contextWindow: model.contextWindow ?? 128000,
        notes: model.notes,
      };
    }

    result[id] = {
      provider: id,
      providerName: provider.name,
      defaultModel: provider.defaultModel,
      models,
    };
  }

  return result as ReturnType<typeof getLegacyPricingFormat> extends Promise<infer T> ? T : never;
}
