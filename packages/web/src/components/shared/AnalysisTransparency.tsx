/**
 * Analysis Transparency Component
 *
 * Provides full transparency into how AI analysis works:
 * - Shows the actual prompts sent to AI
 * - Displays the raw AI response
 * - Explains how the response is parsed
 * - Links to prompt customization documentation
 *
 * This builds trust with users by showing exactly what happens under the hood.
 */

import { useState, useEffect } from 'react';
import {
  loadAnalysisPromptsConfig,
  type AnalysisPromptsConfig,
} from '../../services/config-loader';

interface AnalysisTransparencyProps {
  // The actual prompt that was sent (after variable substitution)
  actualSystemPrompt?: string;
  actualUserPrompt?: string;
  // The raw AI response before parsing
  rawResponse?: string;
  // The parsed result
  parsedResult?: Record<string, unknown>;
  // Token usage
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  // Provider info
  providerName?: string;
  modelName?: string;
}

export function AnalysisTransparency({
  actualSystemPrompt,
  actualUserPrompt,
  rawResponse,
  parsedResult,
  tokenUsage,
  providerName,
  modelName,
}: AnalysisTransparencyProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'prompts' | 'response' | 'parsed'>('overview');
  const [config, setConfig] = useState<AnalysisPromptsConfig | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadAnalysisPromptsConfig().then(setConfig);
  }, []);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <TransparencyIcon className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-900">Analysis Transparency</span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
            See how it works
          </span>
        </div>
        <ChevronIcon className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(['overview', 'prompts', 'response', 'parsed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4">
            {activeTab === 'overview' && (
              <OverviewTab
                config={config}
                providerName={providerName}
                modelName={modelName}
                tokenUsage={tokenUsage}
              />
            )}

            {activeTab === 'prompts' && (
              <PromptsTab
                config={config}
                actualSystemPrompt={actualSystemPrompt}
                actualUserPrompt={actualUserPrompt}
              />
            )}

            {activeTab === 'response' && (
              <ResponseTab rawResponse={rawResponse} />
            )}

            {activeTab === 'parsed' && (
              <ParsedTab parsedResult={parsedResult} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Overview tab - explains how analysis works
 */
function OverviewTab({
  config,
  providerName,
  modelName,
  tokenUsage,
}: {
  config: AnalysisPromptsConfig | null;
  providerName?: string;
  modelName?: string;
  tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}) {
  return (
    <div className="space-y-4">
      {/* How it works */}
      <div>
        <h4 className="font-medium text-gray-900">How Analysis Works</h4>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <StepCard
            number={1}
            title="Fetch Code"
            description="We fetch source files, package.json, README, and config files from GitHub"
          />
          <StepCard
            number={2}
            title="Send to AI"
            description="Code is sent to the AI model with prompts that guide the analysis"
          />
          <StepCard
            number={3}
            title="Parse Response"
            description="The AI's JSON response is parsed into structured pricing recommendations"
          />
        </div>
      </div>

      {/* This analysis */}
      {(providerName || tokenUsage) && (
        <div className="rounded-lg bg-gray-50 p-3">
          <h4 className="text-sm font-medium text-gray-700">This Analysis</h4>
          <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
            {providerName && (
              <div>
                <span className="text-gray-500">Provider:</span>{' '}
                <span className="font-medium">{providerName}</span>
              </div>
            )}
            {modelName && (
              <div>
                <span className="text-gray-500">Model:</span>{' '}
                <span className="font-medium">{modelName}</span>
              </div>
            )}
            {tokenUsage && (
              <>
                <div>
                  <span className="text-gray-500">Input tokens:</span>{' '}
                  <span className="font-mono">{tokenUsage.promptTokens.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Output tokens:</span>{' '}
                  <span className="font-mono">{tokenUsage.completionTokens.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Prompt engineering explained */}
      {config?._documentation && (
        <div>
          <h4 className="font-medium text-gray-900">Prompt Engineering</h4>
          <div className="mt-2 space-y-2 text-sm text-gray-600">
            {config._documentation.promptEngineering ? (
              <>
                {Object.entries(config._documentation.promptEngineering as Record<string, string>).map(
                  ([key, value]) => (
                    <div key={key} className="rounded bg-gray-50 p-2">
                      <span className="font-medium text-gray-700">
                        {key.replace(/^why/, 'Why ')}:
                      </span>{' '}
                      {String(value)}
                    </div>
                  )
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Customize link */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
        <div className="flex items-start gap-3">
          <CodeIcon className="h-5 w-5 text-blue-600" />
          <div>
            <h4 className="font-medium text-blue-900">Customize Analysis</h4>
            <p className="mt-1 text-sm text-blue-700">
              Edit{' '}
              <code className="rounded bg-blue-100 px-1">/public/config/analysis-prompts.json</code>{' '}
              to customize how codebases are analyzed. Add business types, modify detection signals,
              or change the output format.
            </p>
            <a
              href="https://github.com/hazlijohar95/BasedPricer/blob/main/public/config/analysis-prompts.json"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              View config file
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Prompts tab - shows actual prompts
 */
function PromptsTab({
  config,
  actualSystemPrompt,
  actualUserPrompt,
}: {
  config: AnalysisPromptsConfig | null;
  actualSystemPrompt?: string;
  actualUserPrompt?: string;
}) {
  const [showSystem, setShowSystem] = useState(true);

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowSystem(true)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            showSystem ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          System Prompt
        </button>
        <button
          onClick={() => setShowSystem(false)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            !showSystem ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          User Prompt
        </button>
      </div>

      {/* System prompt */}
      {showSystem && (
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">System Prompt</h4>
            <span className="text-xs text-gray-500">
              Establishes the AI's role and analysis guidelines
            </span>
          </div>
          <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
            {actualSystemPrompt || (config ? buildSystemPromptPreview(config) : 'Loading...')}
          </pre>
        </div>
      )}

      {/* User prompt */}
      {!showSystem && (
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">User Prompt</h4>
            <span className="text-xs text-gray-500">
              Contains the actual codebase data for analysis
            </span>
          </div>
          {actualUserPrompt ? (
            <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
              {actualUserPrompt}
            </pre>
          ) : (
            <div className="mt-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              <p>User prompt is generated from the analyzed codebase and includes:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Repository name and description</li>
                <li>Primary programming language</li>
                <li>package.json dependencies</li>
                <li>README excerpt (up to {config?.analysisSettings.maxReadmeChars ?? 5000} chars)</li>
                <li>
                  Source files (up to {config?.analysisSettings.maxSourceFiles ?? 20} files,{' '}
                  {config?.analysisSettings.maxCharsPerFile ?? 4000} chars each)
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Template variables */}
      {config?._documentation?.variables ? (
        <div className="rounded-lg border border-gray-200 p-3">
          <h4 className="text-sm font-medium text-gray-700">Template Variables</h4>
          <div className="mt-2 grid gap-1 text-xs">
            {Object.entries(config._documentation.variables as Record<string, string>).map(
              ([variable, description]) => (
                <div key={variable} className="flex gap-2">
                  <code className="rounded bg-gray-100 px-1 font-mono text-blue-600">
                    {variable}
                  </code>
                  <span className="text-gray-600">{String(description)}</span>
                </div>
              )
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Response tab - shows raw AI response
 */
function ResponseTab({ rawResponse }: { rawResponse?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (rawResponse) {
      navigator.clipboard.writeText(rawResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!rawResponse) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No response data available.</p>
        <p className="text-sm mt-1">Run an analysis to see the raw AI response.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Raw AI Response</h4>
        <button
          onClick={handleCopy}
          className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="max-h-96 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
        {rawResponse}
      </pre>
      <p className="text-xs text-gray-500">
        This is the exact response returned by the AI model before any parsing or transformation.
      </p>
    </div>
  );
}

/**
 * Parsed tab - shows structured result
 */
function ParsedTab({ parsedResult }: { parsedResult?: Record<string, unknown> }) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['businessType', 'narrative']));

  if (!parsedResult) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No parsed data available.</p>
        <p className="text-sm mt-1">Run an analysis to see the parsed result.</p>
      </div>
    );
  }

  const toggleKey = (key: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Parsed Analysis Result</h4>

      <div className="space-y-2">
        {Object.entries(parsedResult).map(([key, value]) => (
          <div key={key} className="rounded-lg border border-gray-200">
            <button
              onClick={() => toggleKey(key)}
              className="flex w-full items-center justify-between px-3 py-2 text-left"
            >
              <span className="font-medium text-gray-900">{key}</span>
              <ChevronIcon
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  expandedKeys.has(key) ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedKeys.has(key) && (
              <pre className="border-t border-gray-100 bg-gray-50 p-3 text-xs overflow-auto max-h-48">
                {JSON.stringify(value, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        This shows how the raw AI response was parsed into structured data used by the app.
      </p>
    </div>
  );
}

/**
 * Helper to build system prompt preview from config
 */
function buildSystemPromptPreview(config: AnalysisPromptsConfig): string {
  const { systemPrompt, businessTypes } = config;

  const businessTypeDefs = Object.entries(businessTypes)
    .map(([id, bt]) => `- ${id}: ${bt.description} (signals: ${bt.signals.slice(0, 3).join(', ')}${bt.signals.length > 3 ? '...' : ''})`)
    .join('\n');

  return `${systemPrompt.role}

Key objectives:
${systemPrompt.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Business Type Definitions:
${businessTypeDefs}

Analysis guidelines:
${systemPrompt.guidelines.map(g => `- ${g}`).join('\n')}

${systemPrompt.outputInstruction}`;
}

/**
 * Step card for overview
 */
function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
          {number}
        </span>
        <span className="font-medium text-gray-900">{title}</span>
      </div>
      <p className="mt-1.5 text-sm text-gray-600">{description}</p>
    </div>
  );
}

// =============================================================================
// ICONS
// =============================================================================

function TransparencyIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function ChevronIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CodeIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}
