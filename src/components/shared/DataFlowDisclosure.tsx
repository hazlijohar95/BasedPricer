import { useState } from 'react';
import { CaretDown, ShieldCheck, ArrowRight, Lock, Eye, Database } from '@phosphor-icons/react';

interface DataFlowDisclosureProps {
  defaultExpanded?: boolean;
}

export function DataFlowDisclosure({ defaultExpanded = false }: DataFlowDisclosureProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const providers = [
    {
      name: 'OpenAI',
      privacyUrl: 'https://openai.com/policies/privacy-policy',
      note: 'API data not used for training',
    },
    {
      name: 'Anthropic',
      privacyUrl: 'https://www.anthropic.com/privacy',
      note: 'API data not used for training',
    },
    {
      name: 'OpenRouter',
      privacyUrl: 'https://openrouter.ai/privacy',
      note: 'Routes to various providers',
    },
  ];

  return (
    <div className="border border-blue-100 bg-blue-50/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} weight="duotone" className="text-blue-600" />
          <span className="text-sm font-medium text-blue-900">How your code is handled</span>
        </div>
        <CaretDown
          size={16}
          className={`text-blue-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Data flow diagram */}
          <div className="flex items-center gap-2 py-3 px-4 bg-white rounded-lg border border-blue-100">
            <div className="flex items-center gap-1.5">
              <Database size={16} className="text-gray-500" />
              <span className="text-xs font-medium text-gray-700">GitHub API</span>
            </div>
            <ArrowRight size={14} className="text-gray-400" />
            <div className="flex items-center gap-1.5">
              <Eye size={16} className="text-blue-500" />
              <span className="text-xs font-medium text-gray-700">AI Provider</span>
            </div>
            <ArrowRight size={14} className="text-gray-400" />
            <div className="flex items-center gap-1.5">
              <Lock size={16} className="text-emerald-500" />
              <span className="text-xs font-medium text-gray-700">Your Browser Only</span>
            </div>
          </div>

          {/* Key points */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
              <p className="text-xs text-gray-600">
                <strong className="text-gray-800">Direct browser calls:</strong> Your code goes directly from GitHub to the AI provider. We never see, store, or log your code.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
              <p className="text-xs text-gray-600">
                <strong className="text-gray-800">Local storage only:</strong> Analysis results are stored in your browser's localStorage, never on our servers.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
              <p className="text-xs text-gray-600">
                <strong className="text-gray-800">Your API keys:</strong> Keys are stored locally and sent directly to providers. We have no access to them.
              </p>
            </div>
          </div>

          {/* Provider privacy links */}
          <div className="pt-2 border-t border-blue-100">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Provider privacy policies</p>
            <div className="flex flex-wrap gap-2">
              {providers.map((provider) => (
                <a
                  key={provider.name}
                  href={provider.privacyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white border border-gray-200 rounded-md text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-colors"
                >
                  {provider.name}
                  <ArrowRight size={10} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
