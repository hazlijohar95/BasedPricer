import { Check, CircleNotch, Circle, FileCode, CloudArrowDown, Brain } from '@phosphor-icons/react';
import { ProviderLogo } from '../ProviderLogos';
import type { AIProvider } from '../../services/api-keys';

export type AnalysisStepType = 'idle' | 'checking' | 'fetching' | 'analyzing' | 'done' | 'error';

export interface FetchProgress {
  current: number;
  total: number;
  currentFile?: string;
}

interface AnalysisProgressCardProps {
  step: AnalysisStepType;
  fetchProgress?: FetchProgress;
  activeProvider?: AIProvider;
  modelName?: string;
}

const STEP_CONFIG: Record<'checking' | 'fetching' | 'analyzing', { label: string; description: string; icon: typeof Circle }> = {
  checking: {
    label: 'Checking repository access',
    description: 'Verifying repository exists and is accessible',
    icon: Circle,
  },
  fetching: {
    label: 'Fetching files from GitHub',
    description: 'Downloading relevant source files',
    icon: CloudArrowDown,
  },
  analyzing: {
    label: 'Analyzing codebase with AI',
    description: 'Extracting features, costs, and pricing suggestions',
    icon: Brain,
  },
};

export function AnalysisProgressCard({
  step,
  fetchProgress,
  activeProvider,
  modelName,
}: AnalysisProgressCardProps) {
  if (step === 'idle' || step === 'done' || step === 'error') {
    return null;
  }

  const steps: AnalysisStepType[] = ['checking', 'fetching', 'analyzing'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <CircleNotch size={18} className="animate-spin text-[#253ff6]" />
        <h3 className="text-sm font-medium text-gray-900">Analysis in Progress</h3>
      </div>

      {/* Progress steps */}
      <div className="space-y-3">
        {steps.map((s, index) => {
          const config = STEP_CONFIG[s as keyof typeof STEP_CONFIG];
          const isActive = s === step;
          const isComplete = index < currentStepIndex;

          return (
            <div
              key={s}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                isActive ? 'bg-[#253ff6]/5 border border-[#253ff6]/20' :
                isComplete ? 'bg-emerald-50/50' : 'bg-gray-50'
              }`}
            >
              {/* Status icon */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                isComplete ? 'bg-emerald-500' :
                isActive ? 'bg-[#253ff6]' : 'bg-gray-200'
              }`}>
                {isComplete ? (
                  <Check size={14} weight="bold" className="text-white" />
                ) : isActive ? (
                  <CircleNotch size={14} className="animate-spin text-white" />
                ) : (
                  <span className="text-xs text-gray-500 font-medium">{index + 1}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  isActive ? 'text-[#253ff6]' :
                  isComplete ? 'text-emerald-700' : 'text-gray-500'
                }`}>
                  {config.label}
                </p>

                {isActive && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {config.description}
                  </p>
                )}

                {/* Fetching progress */}
                {s === 'fetching' && isActive && fetchProgress && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">
                        {fetchProgress.current}/{fetchProgress.total} files
                      </span>
                      <span className="text-[#253ff6] font-medium">
                        {fetchProgress.total > 0 ? Math.round((fetchProgress.current / fetchProgress.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#253ff6] rounded-full transition-all duration-300"
                        style={{ width: `${fetchProgress.total > 0 ? (fetchProgress.current / fetchProgress.total) * 100 : 0}%` }}
                      />
                    </div>
                    {fetchProgress.currentFile && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <FileCode size={12} className="text-gray-400" />
                        <p className="text-[10px] text-gray-500 truncate font-mono">
                          {fetchProgress.currentFile}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* AI provider badge */}
                {s === 'analyzing' && isActive && activeProvider && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-white rounded-md border border-gray-200">
                      <ProviderLogo provider={activeProvider} size={14} />
                      <span className="text-xs text-gray-700">
                        {modelName || activeProvider}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
