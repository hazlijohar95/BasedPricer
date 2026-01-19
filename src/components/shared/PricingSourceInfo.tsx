/**
 * Pricing Source Information Component
 *
 * Displays transparent information about where pricing data comes from,
 * when it was last updated, and links to official sources.
 *
 * This helps users:
 * - Verify pricing accuracy by checking official sources
 * - Understand when data might be outdated
 * - Contribute updates to the open-source project
 */

import { useState, useEffect } from 'react';
import {
  loadProvidersConfig,
  getPricingFreshness,
  type ProviderConfig,
  type ModelConfig,
} from '../../services/config-loader';

interface PricingSourceInfoProps {
  providerId: string;
  modelId?: string;
  variant?: 'inline' | 'card' | 'tooltip';
  showContributeLink?: boolean;
}

export function PricingSourceInfo({
  providerId,
  modelId,
  variant = 'inline',
  showContributeLink = true,
}: PricingSourceInfoProps) {
  const [provider, setProvider] = useState<ProviderConfig | null>(null);
  const [model, setModel] = useState<ModelConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const config = await loadProvidersConfig();
        const providerConfig = config.providers[providerId];
        setProvider(providerConfig ?? null);

        if (providerConfig) {
          const targetModel = modelId ?? providerConfig.defaultModel;
          setModel(providerConfig.models[targetModel] ?? null);
        }
      } catch (e) {
        console.error('Failed to load pricing source info:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [providerId, modelId]);

  if (loading || !provider || !model) {
    return null;
  }

  const freshness = model.lastPriceUpdate
    ? getPricingFreshness(model.lastPriceUpdate)
    : null;

  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
        {freshness && (
          <FreshnessIndicator status={freshness.status} />
        )}
        <span>
          ${model.inputPricePerMillion}/${model.outputPricePerMillion} per 1M tokens
        </span>
        {model.priceSource && (
          <a
            href={model.priceSource}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 hover:underline"
          >
            (source)
          </a>
        )}
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-gray-900">{model.name} Pricing</h4>
            <p className="mt-0.5 text-gray-500">{provider.name}</p>
          </div>
          {freshness && (
            <FreshnessBadge status={freshness.status} label={freshness.label} />
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-md bg-gray-50 p-2">
            <div className="text-xs text-gray-500">Input</div>
            <div className="font-mono text-gray-900">
              ${model.inputPricePerMillion.toFixed(2)}<span className="text-xs text-gray-500">/1M</span>
            </div>
          </div>
          <div className="rounded-md bg-gray-50 p-2">
            <div className="text-xs text-gray-500">Output</div>
            <div className="font-mono text-gray-900">
              ${model.outputPricePerMillion.toFixed(2)}<span className="text-xs text-gray-500">/1M</span>
            </div>
          </div>
        </div>

        {model.notes && (
          <p className="mt-3 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
            {model.notes}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {model.priceSource && (
            <a
              href={model.priceSource}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
            >
              <ExternalLinkIcon />
              Official pricing
            </a>
          )}
          {provider.apiDocsUrl && (
            <a
              href={provider.apiDocsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 hover:underline"
            >
              <BookIcon />
              API docs
            </a>
          )}
          {showContributeLink && (
            <a
              href="https://github.com/hazlijohar95/BasedPricer/blob/main/CONTRIBUTING.md#updating-pricing-data"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 hover:underline"
            >
              <GitHubIcon />
              Update pricing
            </a>
          )}
        </div>
      </div>
    );
  }

  // Tooltip variant
  return (
    <div className="max-w-xs text-xs">
      <div className="font-medium">{model.name}</div>
      <div className="mt-1 text-gray-600">
        Input: ${model.inputPricePerMillion}/1M tokens<br />
        Output: ${model.outputPricePerMillion}/1M tokens
      </div>
      {freshness && (
        <div className="mt-1.5">
          <FreshnessBadge status={freshness.status} label={freshness.label} />
        </div>
      )}
      {model.priceSource && (
        <a
          href={model.priceSource}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-blue-500 hover:underline"
        >
          Verify on official site
        </a>
      )}
    </div>
  );
}

/**
 * Compact freshness indicator (colored dot)
 */
function FreshnessIndicator({ status }: { status: 'fresh' | 'recent' | 'stale' }) {
  const colors = {
    fresh: 'bg-green-400',
    recent: 'bg-yellow-400',
    stale: 'bg-red-400',
  };

  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${colors[status]}`}
      title={status === 'fresh' ? 'Recently updated' : status === 'recent' ? 'Updated within 30 days' : 'May be outdated'}
    />
  );
}

/**
 * Freshness badge with label
 */
function FreshnessBadge({ status, label }: { status: 'fresh' | 'recent' | 'stale'; label: string }) {
  const styles = {
    fresh: 'bg-green-50 text-green-700 border-green-200',
    recent: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    stale: 'bg-red-50 text-red-700 border-red-200',
  };

  const icons = {
    fresh: <CheckCircleIcon />,
    recent: <ClockIcon />,
    stale: <AlertIcon />,
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${styles[status]}`}>
      {icons[status]}
      {label}
    </span>
  );
}

/**
 * All providers pricing overview
 */
export function AllProvidersPricingInfo() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [configMeta, setConfigMeta] = useState<{ version: string; lastUpdated: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const config = await loadProvidersConfig();
        setProviders(Object.values(config.providers));
        setConfigMeta({ version: config._meta.version, lastUpdated: config._meta.lastUpdated });
      } catch (e) {
        console.error('Failed to load providers:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      {/* Config metadata */}
      {configMeta && (
        <div className="flex items-center justify-between text-xs text-gray-500 border-b pb-2">
          <span>
            Pricing data v{configMeta.version} · Last updated {configMeta.lastUpdated}
          </span>
          <a
            href="https://github.com/hazlijohar95/BasedPricer/blob/main/public/config/ai-providers.json"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            View/Edit source
          </a>
        </div>
      )}

      {/* Provider cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {providers.map(provider => (
          <ProviderPricingCard key={provider.id} provider={provider} />
        ))}
      </div>

      {/* Contribute CTA */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <GitHubIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900">Help keep pricing accurate</h4>
            <p className="mt-1 text-blue-700">
              AI provider pricing changes frequently. If you notice outdated prices,{' '}
              <a
                href="https://github.com/hazlijohar95/BasedPricer/blob/main/CONTRIBUTING.md#updating-pricing-data"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:no-underline"
              >
                submit a PR
              </a>{' '}
              to update the config file.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Single provider pricing card
 */
function ProviderPricingCard({ provider }: { provider: ProviderConfig }) {
  const defaultModel = provider.models[provider.defaultModel];
  const modelCount = Object.keys(provider.models).length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">{provider.name}</h4>
        {provider.pricingPage && (
          <a
            href={provider.pricingPage}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline"
          >
            Official pricing
          </a>
        )}
      </div>

      {defaultModel && (
        <div className="mt-2">
          <div className="text-xs text-gray-500">Default: {defaultModel.name}</div>
          <div className="mt-1 flex gap-4 text-sm">
            <span>
              <span className="text-gray-500">In:</span>{' '}
              <span className="font-mono">${defaultModel.inputPricePerMillion}</span>
            </span>
            <span>
              <span className="text-gray-500">Out:</span>{' '}
              <span className="font-mono">${defaultModel.outputPricePerMillion}</span>
            </span>
          </div>
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        {modelCount} model{modelCount !== 1 ? 's' : ''} available
      </div>

      {provider.notes && (
        <p className="mt-2 text-xs text-gray-600 italic">{provider.notes}</p>
      )}
    </div>
  );
}

// =============================================================================
// ICONS
// =============================================================================

function ExternalLinkIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function BookIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function GitHubIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function CheckCircleIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AlertIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
