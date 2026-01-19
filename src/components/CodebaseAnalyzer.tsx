import { useState, useCallback, useRef } from 'react';
import {
  MagnifyingGlass,
  SpinnerGap,
  Check,
  Warning,
  CaretDown,
  Trash,
  ArrowRight,
  Eye,
  EyeSlash,
  Lightbulb,
  Package,
  Stack,
  Sparkle,
  ShieldCheck,
  Rocket,
  Target,
  TrendUp,
  Lightning,
} from '@phosphor-icons/react';
import {
  type AIProvider,
  PROVIDER_INFO,
  getStoredKeys,
  saveAPIKey,
  removeAPIKey,
  getGitHubToken,
  saveGitHubToken,
  removeGitHubToken,
  maskAPIKey,
  hasAnyAIKey,
} from '../services/api-keys';
import {
  parseGitHubUrl,
  checkRepoAccess,
  fetchForAnalysis,
  getRateLimit,
  type FetchProgressCallback,
} from '../services/github';
import {
  analyzeCodebase,
  quickAnalyzeFromPackageJson,
  type AnalysisResult,
} from '../services/ai-analyzer';
import { MODEL_DISPLAY_NAMES, PROVIDER_MODELS } from '../services/ai-client';
import { usePricing } from '../context/PricingContext';
import { useNavigation } from '../context/NavigationContext';
import { ProviderLogo, GitHubLogo, PROVIDER_COLORS } from './ProviderLogos';
import type { FeatureCategory } from '../data/features';

// Trust & transparency components
import {
  DataFlowDisclosure,
  RepoAccessInfo,
  AnalysisProgressCard,
  type FetchProgress,
} from './shared';

// Cost display components
import { CostSummary, CostEstimateCard } from './shared';
import {
  calculateTokenCost,
  estimateAnalysisCost,
  compareProviderCosts,
  type CostBreakdown,
  type CostEstimate,
  type ProviderComparison,
} from '../utils/aiCostCalculator';

// Business type data
import { BUSINESS_TYPES } from '../data/business-types';

type AnalysisStep = 'idle' | 'checking' | 'fetching' | 'analyzing' | 'done' | 'error';

// Map AI-detected category strings to valid FeatureCategory
function mapToFeatureCategory(category: string): FeatureCategory {
  const categoryMap: Record<string, FeatureCategory> = {
    'invoicing': 'invoicing',
    'billing': 'invoicing',
    'document': 'document_management',
    'document_management': 'document_management',
    'storage': 'document_management',
    'ai': 'ai_extraction',
    'ai_extraction': 'ai_extraction',
    'extraction': 'ai_extraction',
    'ocr': 'ai_extraction',
    'accounting': 'accounting_ai',
    'accounting_ai': 'accounting_ai',
    'automation': 'accounting_ai',
    'email': 'email',
    'notification': 'email',
    'payment': 'payments',
    'payments': 'payments',
    'team': 'team',
    'user': 'team',
    'access': 'team',
    'reporting': 'reporting',
    'analytics': 'reporting',
    'integration': 'integrations',
    'integrations': 'integrations',
    'api': 'integrations',
    'support': 'support',
  };

  const normalized = category.toLowerCase().replace(/[^a-z_]/g, '');
  return categoryMap[normalized] || 'integrations'; // Default to integrations for unknown
}

export function CodebaseAnalyzer() {
  // GitHub input
  const [repoUrl, setRepoUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // API keys state
  const [showKeySettings, setShowKeySettings] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('anthropic');
  const [selectedModel, setSelectedModel] = useState<string>(PROVIDER_MODELS.anthropic[0].id);
  const [newApiKey, setNewApiKey] = useState('');
  const [newGithubToken, setNewGithubToken] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Analysis state
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('idle');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [quickResult, setQuickResult] = useState<ReturnType<typeof quickAnalyzeFromPackageJson> | null>(null);

  // Progress tracking
  const [fetchProgress, setFetchProgress] = useState<FetchProgress | null>(null);

  // Cost tracking
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [providerComparisons, setProviderComparisons] = useState<ProviderComparison[]>([]);

  // Context
  const {
    setVariableCosts,
    setFixedCosts,
    importCodebaseFeatures,
    setBusinessType,
    applyBusinessTypeTemplate,
    setTiers,
    showToast,
  } = usePricing();
  const { navigateTo } = useNavigation();

  // Request tracking to prevent race conditions
  const currentRequestRef = useRef<number>(0);

  // Get stored keys status
  const storedKeys = getStoredKeys();
  const githubToken = getGitHubToken();
  const hasAIKey = hasAnyAIKey();

  // Find which provider has a key
  const activeProvider = (['openai', 'anthropic', 'openrouter', 'groq', 'minimax', 'glm'] as AIProvider[]).find(
    p => storedKeys.keys[p]
  );

  // Handle API key save
  const handleSaveAPIKey = useCallback(() => {
    setKeyError(null);
    const result = saveAPIKey(selectedProvider, newApiKey);
    if (result.success) {
      setNewApiKey('');
      setShowApiKey(false);
    } else {
      setKeyError(result.error ?? 'Failed to save key');
    }
  }, [selectedProvider, newApiKey]);

  // Handle GitHub token save
  const handleSaveGitHubToken = useCallback(() => {
    setKeyError(null);
    const result = saveGitHubToken(newGithubToken);
    if (result.success) {
      setNewGithubToken('');
      setShowGithubToken(false);
    } else {
      setKeyError(result.error ?? 'Failed to save token');
    }
  }, [newGithubToken]);

  // Handle analysis
  const handleAnalyze = useCallback(async () => {
    // Use incrementing counter to prevent race conditions (Date.now() can be identical for rapid requests)
    const requestId = ++currentRequestRef.current;

    setUrlError(null);
    setAnalysisError(null);
    setAnalysisResult(null);
    setQuickResult(null);
    setFetchProgress(null);
    setCostEstimate(null);
    setCostBreakdown(null);

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      setUrlError('Invalid GitHub URL. Try: https://github.com/owner/repo');
      return;
    }

    if (!hasAIKey) {
      setUrlError('Please add an AI API key first');
      setShowKeySettings(true);
      return;
    }

    try {
      setAnalysisStep('checking');
      const access = await checkRepoAccess(repoUrl);
      if (currentRequestRef.current !== requestId) return;

      if (!access.accessible) {
        if (access.needsToken) {
          setUrlError(access.error + ' Add a GitHub token for private repos.');
          setShowKeySettings(true);
        } else {
          setUrlError(access.error ?? 'Cannot access repository');
        }
        setAnalysisStep('error');
        return;
      }

      setAnalysisStep('fetching');

      // Progress callback for file fetching
      const onProgress: FetchProgressCallback = (progress) => {
        setFetchProgress({
          current: progress.current,
          total: progress.total,
          currentFile: progress.currentFile,
        });
      };

      const payload = await fetchForAnalysis(repoUrl, onProgress);
      if (currentRequestRef.current !== requestId) return;

      if (payload.packageJson) {
        const quick = quickAnalyzeFromPackageJson(payload.packageJson as Record<string, unknown>);
        setQuickResult(quick);
      }

      // Calculate total characters for cost estimation
      const totalChars = payload.srcFiles.reduce((sum, f) => sum + f.content.length, 0) +
        (payload.readme?.length ?? 0) +
        (payload.packageJson ? JSON.stringify(payload.packageJson).length : 0);

      // Generate cost estimate before AI analysis
      const estimate = estimateAnalysisCost(
        payload.srcFiles.length,
        totalChars,
        activeProvider ?? 'anthropic'
      );
      setCostEstimate(estimate);

      // Generate provider comparisons
      const comparisons = compareProviderCosts(
        estimate.estimatedTokens * 0.8, // Rough input tokens
        estimate.estimatedTokens * 0.2, // Rough output tokens
        activeProvider ?? 'anthropic'
      );
      setProviderComparisons(comparisons);

      setAnalysisStep('analyzing');
      const result = await analyzeCodebase(payload, {
        provider: activeProvider,
        apiKey: activeProvider ? storedKeys.keys[activeProvider]?.key : undefined,
        model: selectedModel,
      });
      if (currentRequestRef.current !== requestId) return;

      // Calculate actual cost from token usage
      if (result.tokenUsage) {
        const breakdown = calculateTokenCost(
          result.tokenUsage,
          activeProvider ?? 'anthropic'
        );
        setCostBreakdown(breakdown);
      }

      setAnalysisResult(result);
      setAnalysisStep('done');
    } catch (e) {
      if (currentRequestRef.current !== requestId) return;
      console.error('Analysis failed:', e);

      // Categorize and enhance error message
      // Sanitize error message to prevent potential XSS (strip HTML tags)
      const rawMessage = e instanceof Error ? e.message : 'Analysis failed';
      const errorMessage = rawMessage.replace(/<[^>]*>/g, '').slice(0, 500); // Strip HTML, limit length
      let enhancedError = errorMessage;

      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized') || errorMessage.toLowerCase().includes('invalid api key')) {
        enhancedError = 'API key is invalid or expired. Please check your API key in the settings above.';
      } else if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
        enhancedError = 'Rate limit exceeded. Please wait a few minutes before trying again, or try a different AI provider.';
      } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
        enhancedError = 'The AI service is temporarily unavailable. Please try again in a few moments.';
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        enhancedError = 'Network error - please check your internet connection and try again.';
      } else if (errorMessage.toLowerCase().includes('timeout')) {
        enhancedError = 'Request timed out. The repository might be too large. Try analyzing a smaller repo or specific branch.';
      } else if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('billing')) {
        enhancedError = 'API quota exceeded or billing issue. Please check your account with the AI provider.';
      }

      setAnalysisError(enhancedError);
      setAnalysisStep('error');
    }
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
  }, [repoUrl, hasAIKey, activeProvider, selectedModel, storedKeys]);

  // Apply analysis results to context
  const handleApplyResults = useCallback(() => {
    if (!analysisResult) return;

    const variableCosts = analysisResult.costSuggestions
      .filter(c => c.type === 'variable')
      .map((c, i) => ({
        id: `analysis-var-${i}-${Date.now()}`,
        name: c.name,
        unit: c.unit,
        costPerUnit: c.cost,
        usagePerCustomer: c.usagePerCustomer ?? 1,
        description: c.description,
      }));

    const fixedCosts = analysisResult.costSuggestions
      .filter(c => c.type === 'fixed')
      .map((c, i) => ({
        id: `analysis-fix-${i}-${Date.now()}`,
        name: c.name,
        monthlyCost: c.cost,
        description: c.description,
      }));

    // Map AI-detected features to Feature format
    const features = analysisResult.features.map((f, i) => ({
      id: `analysis-feat-${i}-${Date.now()}`,
      name: f.name,
      description: f.description,
      category: mapToFeatureCategory(f.category),
      complexity: 'medium' as const,
      hasLimit: !!f.costDriver,
      costDriver: f.costDriver,
      valueProposition: f.description,
      source: 'codebase' as const,
    }));

    setVariableCosts(variableCosts);
    setFixedCosts(fixedCosts);
    importCodebaseFeatures(features);

    // Set business type from analysis
    if (analysisResult.businessType) {
      setBusinessType(analysisResult.businessType.detected, analysisResult.businessType.confidence);
    }

    // Apply AI suggested tiers if available
    if (analysisResult.suggestedTiers && analysisResult.suggestedTiers.length > 0) {
      const USD_TO_MYR = 4.5;
      const convertedTiers = analysisResult.suggestedTiers.map((st, i) => ({
        id: `ai-tier-${i}-${Date.now()}`,
        name: st.name,
        tagline: st.description || `${st.name} tier`,
        targetAudience: st.description || `Users looking for ${st.name.toLowerCase()} features`,
        monthlyPriceMYR: Math.round(st.price * USD_TO_MYR),
        annualPriceMYR: Math.round(st.price * USD_TO_MYR * 10), // ~17% annual discount
        annualDiscount: 17,
        status: 'active' as const,
        limits: Object.entries(st.limits || {}).map(([key, value]) => ({
          featureId: key,
          limit: value,
          unit: key,
        })),
        includedFeatures: st.features || [],
        excludedFeatures: [],
        highlightFeatures: (st.features || []).slice(0, 4),
      }));
      setTiers(convertedTiers);
      // Tier display configs will be auto-initialized by PricingMockup's useEffect when tiers change
    }

    // Show success toast with summary
    const appliedCount = variableCosts.length + fixedCosts.length;
    const tierCount = analysisResult.suggestedTiers?.length || 0;
    showToast(
      'success',
      `Applied ${features.length} features, ${appliedCount} costs${tierCount > 0 ? `, and ${tierCount} pricing tiers` : ''}`
    );

    // Navigate to COGS calculator
    navigateTo('cogs');
  }, [
    analysisResult,
    setVariableCosts,
    setFixedCosts,
    importCodebaseFeatures,
    setBusinessType,
    setTiers,
    showToast,
    navigateTo,
  ]);

  // Apply business type template
  const handleApplyTemplate = useCallback(() => {
    if (!analysisResult?.businessType) return;
    applyBusinessTypeTemplate(analysisResult.businessType.detected);
  }, [analysisResult, applyBusinessTypeTemplate]);

  const rateLimit = getRateLimit();
  const isAnalyzing = analysisStep === 'checking' || analysisStep === 'fetching' || analysisStep === 'analyzing';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[13px] text-gray-400 mb-1">Analyze</p>
        <h1 className="text-[28px] font-light text-gray-900 tracking-tight">
          Codebase Analyzer
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Import your GitHub repository to automatically detect tech stack, features, and cost drivers.
        </p>
      </div>

      {/* Main Input Card */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* GitHub URL Input */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
              <GitHubLogo size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-900">GitHub Repository</h2>
              <p className="text-xs text-gray-500">Public repos work without authentication</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value);
                setUrlError(null);
              }}
              placeholder="https://github.com/owner/repo"
              className="flex-1 px-4 py-3 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#253ff6]/20 focus:bg-white transition-colors"
            />
            <button
              onClick={handleAnalyze}
              disabled={!repoUrl || isAnalyzing}
              className="px-6 py-3 bg-[#253ff6] text-white text-sm font-medium rounded-lg hover:bg-[#1e35d9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <SpinnerGap size={18} className="animate-spin" />
                  <span>
                    {analysisStep === 'checking' && 'Checking...'}
                    {analysisStep === 'fetching' && 'Fetching...'}
                    {analysisStep === 'analyzing' && 'Analyzing...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkle size={18} weight="fill" />
                  Analyze
                </>
              )}
            </button>
          </div>

          {urlError && (
            <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
              <Warning size={14} weight="fill" />
              {urlError}
            </p>
          )}

          {rateLimit && (
            <p className="mt-3 text-xs text-gray-400">
              GitHub API: {rateLimit.remaining}/{rateLimit.limit} requests remaining
            </p>
          )}
        </div>

        {/* AI Provider Status Bar */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasAIKey && activeProvider ? (
                <>
                  <div className={`w-8 h-8 rounded-lg ${PROVIDER_COLORS[activeProvider].bg} flex items-center justify-center`}>
                    <ProviderLogo provider={activeProvider} size={16} className={PROVIDER_COLORS[activeProvider].text} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {PROVIDER_INFO[activeProvider].name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Using {MODEL_DISPLAY_NAMES[activeProvider]}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Warning size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">No AI Provider</p>
                    <p className="text-xs text-gray-500">Add an API key to analyze</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Cost estimate badge */}
              {costEstimate && analysisStep === 'analyzing' && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  ~${costEstimate.estimatedCostUSD.toFixed(3)}
                </span>
              )}
              <button
                onClick={() => setShowKeySettings(!showKeySettings)}
                className="text-sm text-[#253ff6] hover:text-[#1e35d9] font-medium flex items-center gap-1"
              >
                {showKeySettings ? 'Hide' : 'Configure'}
                <CaretDown size={14} className={`transition-transform ${showKeySettings ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* API Keys Settings (Expandable) */}
        {showKeySettings && (
          <div className="border-t border-gray-200">
            {/* Enhanced Privacy Notice */}
            <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100/50 flex items-center gap-2">
              <ShieldCheck size={14} weight="duotone" className="text-blue-600" />
              <p className="text-xs text-blue-700">
                Keys are stored locally in your browser and sent directly to providers. We never see or log them.
              </p>
            </div>

            {keyError && (
              <div className="px-6 py-3 bg-red-50 border-b border-red-100">
                <p className="text-xs text-red-700">{keyError}</p>
              </div>
            )}

            {/* Provider Selection */}
            <div className="p-6">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                AI Provider
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(['openai', 'anthropic', 'openrouter', 'groq', 'minimax', 'glm'] as AIProvider[]).map((provider) => {
                  const isSelected = selectedProvider === provider;
                  const hasKey = !!storedKeys.keys[provider];
                  const colors = PROVIDER_COLORS[provider];

                  return (
                    <button
                      key={provider}
                      onClick={() => {
                        setSelectedProvider(provider);
                        setSelectedModel(PROVIDER_MODELS[provider][0].id);
                      }}
                      className={`relative flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-2 transition-colors ${
                        isSelected
                          ? `${colors.bg} ${colors.border}`
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <ProviderLogo
                        provider={provider}
                        size={provider === 'groq' ? 40 : 18}
                        className={isSelected ? colors.text : 'text-gray-500'}
                      />
                      {provider !== 'groq' && (
                        <span className={`text-sm font-medium whitespace-nowrap ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                          {PROVIDER_INFO[provider].name}
                        </span>
                      )}
                      {hasKey && (
                        <Check size={12} weight="bold" className="text-green-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Model Selector - minimal pill design */}
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Model</span>
                  <div className="flex gap-1.5">
                    {PROVIDER_MODELS[selectedProvider].map((model) => {
                      const isSelected = selectedModel === model.id;
                      const colors = PROVIDER_COLORS[selectedProvider];
                      return (
                        <button
                          key={model.id}
                          onClick={() => setSelectedModel(model.id)}
                          className={`group relative px-2.5 py-1 text-xs rounded-full transition-all ${
                            isSelected
                              ? `${colors.bg} ${colors.text} font-medium`
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {model.name}
                            {model.badge === 'best' && (
                              <span className={`px-1 py-0.5 text-[10px] font-semibold rounded ${
                                isSelected ? 'bg-white/50' : 'bg-amber-100 text-amber-700'
                              }`}>
                                BEST
                              </span>
                            )}
                            {model.badge === 'fast' && (
                              <Lightning size={10} weight="fill" className={isSelected ? '' : 'text-blue-500'} />
                            )}
                          </span>
                          {/* Tooltip on hover */}
                          {model.description && (
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              {model.description}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* API Key Input */}
              <div className="mt-4">
                {storedKeys.keys[selectedProvider] ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Check size={18} className="text-green-500" />
                    <span className="text-sm text-gray-600 flex-1 font-mono">
                      {maskAPIKey(storedKeys.keys[selectedProvider]!.key)}
                    </span>
                    <button
                      onClick={() => removeAPIKey(selectedProvider)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Remove key"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        placeholder={PROVIDER_INFO[selectedProvider].placeholder}
                        className="w-full px-4 py-3 pr-12 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#253ff6]/20 focus:bg-white font-mono"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded"
                      >
                        {showApiKey ? <EyeSlash size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <button
                      onClick={handleSaveAPIKey}
                      disabled={!newApiKey}
                      className="px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
                <a
                  href={PROVIDER_INFO[selectedProvider].docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-[#253ff6] hover:underline"
                >
                  Get your {PROVIDER_INFO[selectedProvider].name} API key
                  <ArrowRight size={10} />
                </a>
              </div>

              {/* GitHub Token */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <GitHubLogo size={14} className="text-gray-700" />
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GitHub Token
                  </label>
                  <span className="text-xs text-gray-400">(for private repos)</span>
                </div>

                {githubToken ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Check size={18} className="text-green-500" />
                    <span className="text-sm text-gray-600 flex-1 font-mono">
                      {maskAPIKey(githubToken)}
                    </span>
                    <button
                      onClick={() => removeGitHubToken()}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Remove token"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={showGithubToken ? 'text' : 'password'}
                        value={newGithubToken}
                        onChange={(e) => setNewGithubToken(e.target.value)}
                        placeholder="ghp_..."
                        className="w-full px-4 py-3 pr-12 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#253ff6]/20 focus:bg-white font-mono"
                      />
                      <button
                        onClick={() => setShowGithubToken(!showGithubToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded"
                      >
                        {showGithubToken ? <EyeSlash size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <button
                      onClick={handleSaveGitHubToken}
                      disabled={!newGithubToken}
                      className="px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=Pricing%20Tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-[#253ff6] hover:underline"
                >
                  Create a personal access token
                  <ArrowRight size={10} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trust & Transparency Section */}
      {analysisStep === 'idle' && (
        <div className="grid grid-cols-2 gap-4 items-start">
          <DataFlowDisclosure defaultExpanded />
          <RepoAccessInfo hasToken={!!githubToken} />
        </div>
      )}

      {/* Analysis Progress */}
      {isAnalyzing && (
        <AnalysisProgressCard
          step={analysisStep}
          fetchProgress={fetchProgress ?? undefined}
          activeProvider={activeProvider ?? undefined}
          modelName={activeProvider ? MODEL_DISPLAY_NAMES[activeProvider] : undefined}
        />
      )}

      {/* Cost Estimate (shown during fetching/analyzing) */}
      {costEstimate && (analysisStep === 'fetching' || analysisStep === 'analyzing') && (
        <CostEstimateCard
          estimate={costEstimate}
          comparisons={providerComparisons}
          fileCount={fetchProgress?.total}
        />
      )}

      {/* Quick Results (from package.json) */}
      {quickResult && analysisStep !== 'done' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={18} weight="duotone" className="text-amber-500" />
            <h3 className="text-sm font-medium text-gray-900">Quick Detection</h3>
            <span className="text-xs text-gray-400">(from package.json)</span>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Framework</p>
              <p className="text-sm font-medium text-gray-900">{quickResult.techStack.framework}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Language</p>
              <p className="text-sm font-medium text-gray-900">{quickResult.techStack.language}</p>
            </div>
            {quickResult.techStack.database && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Database</p>
                <p className="text-sm font-medium text-gray-900">{quickResult.techStack.database}</p>
              </div>
            )}
            {quickResult.techStack.auth && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Auth</p>
                <p className="text-sm font-medium text-gray-900">{quickResult.techStack.auth}</p>
              </div>
            )}
          </div>

          {quickResult.costSuggestions.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">
                Cost Drivers ({quickResult.costSuggestions.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {quickResult.costSuggestions.slice(0, 8).map((cost, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                      cost.type === 'fixed'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-purple-50 text-purple-700'
                    }`}
                  >
                    {cost.name}
                  </span>
                ))}
                {quickResult.costSuggestions.length > 8 && (
                  <span className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-500">
                    +{quickResult.costSuggestions.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          {analysisStep === 'analyzing' && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
              <SpinnerGap size={16} className="animate-spin text-[#253ff6]" />
              AI analyzing codebase for features and pricing suggestions...
            </div>
          )}
        </div>
      )}

      {/* Analysis Error */}
      {analysisStep === 'error' && analysisError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <Warning size={20} weight="fill" className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">Analysis Failed</h3>
              <p className="text-sm text-red-700 mt-1">{analysisError}</p>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={handleAnalyze}
                  className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    setAnalysisStep('idle');
                    setAnalysisError(null);
                    setShowKeySettings(true);
                  }}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Check API Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Analysis Results */}
      {analysisStep === 'done' && analysisResult && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-gradient-to-br from-[#253ff6]/5 to-white border border-[#253ff6]/20 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Check size={18} className="text-green-500" />
                  <h3 className="text-lg font-medium text-gray-900">Analysis Complete</h3>
                </div>
                <p className="text-sm text-gray-600">{analysisResult.summary}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-light text-[#253ff6]">
                  {analysisResult.confidence.overall}%
                </div>
                <p className="text-xs text-gray-500">confidence</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              {[
                { label: 'Framework', value: analysisResult.techStack.framework },
                { label: 'Language', value: analysisResult.techStack.language },
                { label: 'Database', value: analysisResult.techStack.database ?? 'Not detected' },
                { label: 'Auth', value: analysisResult.techStack.auth ?? 'Not detected' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Business Type Detection */}
          {analysisResult.businessType && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target size={18} weight="duotone" className="text-[#253ff6]" />
                  <h3 className="text-sm font-medium text-gray-900">Business Type Detected</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#253ff6]">
                    {Math.round(analysisResult.businessType.confidence * 100)}%
                  </span>
                  <span className="text-xs text-gray-400">confidence</span>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-[#253ff6]/5 to-white border border-[#253ff6]/20 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#253ff6]/10 flex items-center justify-center">
                    <Rocket size={20} weight="duotone" className="text-[#253ff6]" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {BUSINESS_TYPES[analysisResult.businessType.detected]?.name ?? analysisResult.businessType.detected}
                    </p>
                    <p className="text-xs text-gray-500">
                      {BUSINESS_TYPES[analysisResult.businessType.detected]?.pricingModel ?? 'Feature-tiered pricing'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detection Signals */}
              {analysisResult.businessType.signals && analysisResult.businessType.signals.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Detection Signals</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.businessType.signals.map((signal, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Types */}
              {analysisResult.businessType.secondaryTypes && analysisResult.businessType.secondaryTypes.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">Also considered:</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.businessType.secondaryTypes.slice(0, 3).map((alt, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs bg-gray-50 text-gray-500 rounded-full">
                        {BUSINESS_TYPES[alt.type]?.name ?? alt.type} ({Math.round(alt.confidence * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply Template Button */}
              <button
                onClick={handleApplyTemplate}
                className="mt-4 w-full py-2.5 bg-[#253ff6]/10 text-[#253ff6] text-sm font-medium rounded-lg hover:bg-[#253ff6]/20 transition-colors flex items-center justify-center gap-2"
              >
                <Lightning size={16} weight="fill" />
                Apply {BUSINESS_TYPES[analysisResult.businessType.detected]?.name ?? 'Template'} Tier Structure
              </button>
            </div>
          )}

          {/* Narrative Insights */}
          {analysisResult.narrative && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={18} weight="duotone" className="text-amber-500" />
                <h3 className="text-sm font-medium text-gray-900">AI Insights</h3>
              </div>

              {/* Summary */}
              <p className="text-sm text-gray-700 mb-4">{analysisResult.narrative.summary}</p>

              <div className="grid grid-cols-2 gap-4">
                {/* Key Risks */}
                {analysisResult.narrative.keyRisks && analysisResult.narrative.keyRisks.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Warning size={14} weight="fill" className="text-red-500" />
                      <p className="text-xs font-medium text-red-800">Key Risks</p>
                    </div>
                    <ul className="space-y-1.5">
                      {analysisResult.narrative.keyRisks.map((risk, i) => (
                        <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                          <span className="text-red-400 mt-1">•</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Opportunities */}
                {analysisResult.narrative.keyOpportunities && analysisResult.narrative.keyOpportunities.length > 0 && (
                  <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendUp size={14} weight="fill" className="text-green-500" />
                      <p className="text-xs font-medium text-green-800">Opportunities</p>
                    </div>
                    <ul className="space-y-1.5">
                      {analysisResult.narrative.keyOpportunities.map((opp, i) => (
                        <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                          <span className="text-green-400 mt-1">•</span>
                          {opp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Pricing Recommendation */}
              {analysisResult.narrative.pricingRecommendation && (
                <div className="mt-4 p-4 bg-[#253ff6]/5 border border-[#253ff6]/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkle size={14} weight="fill" className="text-[#253ff6]" />
                    <p className="text-xs font-medium text-[#253ff6]">Pricing Recommendation</p>
                  </div>
                  <p className="text-sm text-gray-700">{analysisResult.narrative.pricingRecommendation}</p>
                </div>
              )}

              {/* What Matters Most */}
              {analysisResult.narrative.whatMatters && analysisResult.narrative.whatMatters.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">What Matters Most</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.narrative.whatMatters.map((item, i) => (
                      <span key={i} className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 rounded-lg font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cost Summary */}
          {costBreakdown && (
            <CostSummary
              breakdown={costBreakdown}
              otherProvidersCost={providerComparisons.filter(p => !p.isSelected)}
            />
          )}

          {/* Features */}
          {analysisResult.features.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package size={18} weight="duotone" className="text-[#253ff6]" />
                <h3 className="text-sm font-medium text-gray-900">
                  Detected Features ({analysisResult.features.length})
                </h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {analysisResult.features.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{feature.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
                      {feature.costDriver && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 text-xs bg-amber-50 text-amber-700 rounded-full">
                          {feature.costDriver}
                        </span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className="text-xs text-gray-400">{feature.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Suggestions */}
          {analysisResult.costSuggestions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Stack size={18} weight="duotone" className="text-emerald-600" />
                <h3 className="text-sm font-medium text-gray-900">
                  Cost Drivers ({analysisResult.costSuggestions.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {analysisResult.costSuggestions.map((cost, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{cost.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        cost.type === 'fixed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {cost.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{cost.description}</p>
                    <p className="text-lg font-medium text-gray-900">
                      ${cost.cost}
                      <span className="text-xs text-gray-500 font-normal">
                        /{cost.type === 'fixed' ? 'month' : cost.unit}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Tiers */}
          {analysisResult.suggestedTiers.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Suggested Pricing Tiers</h3>
              <div className="grid grid-cols-3 gap-4">
                {analysisResult.suggestedTiers.map((tier, i) => (
                  <div key={i} className="p-5 border border-gray-200 rounded-lg hover:border-[#253ff6]/30 transition-colors">
                    <h4 className="font-medium text-gray-900">{tier.name}</h4>
                    <p className="text-2xl font-light text-gray-900 mt-1">
                      ${tier.price}<span className="text-sm text-gray-500">/mo</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">{tier.description}</p>
                    <p className="text-xs text-gray-400 mt-3">
                      {tier.features.length} features included
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleApplyResults}
              className="flex-1 py-3.5 bg-[#253ff6] text-white text-sm font-medium rounded-lg hover:bg-[#1e35d9] flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowRight size={18} weight="bold" />
              Apply to COGS Calculator
            </button>
            <button
              onClick={() => {
                setAnalysisStep('idle');
                setAnalysisResult(null);
                setQuickResult(null);
              }}
              className="px-6 py-3.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
          </div>

          {/* Token usage */}
          {analysisResult.tokenUsage && (
            <p className="text-xs text-gray-400 text-center">
              Tokens used: {analysisResult.tokenUsage.totalTokens.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {analysisStep === 'idle' && !quickResult && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <MagnifyingGlass size={28} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-600">Enter a GitHub repository URL to get started</p>
          <p className="text-xs text-gray-400 mt-1">
            We'll analyze your codebase and suggest pricing based on your tech stack
          </p>
        </div>
      )}
    </div>
  );
}
