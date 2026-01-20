import { Package, Stack, CurrencyDollar, GithubLogo, Plus } from '@phosphor-icons/react';

type EmptyStateType = 'tiers' | 'features' | 'costs';

interface EmptyStateProps {
  type: EmptyStateType;
  onAnalyze?: () => void;
  onAddManually?: () => void;
}

const config: Record<EmptyStateType, {
  icon: typeof Package;
  title: string;
  description: string;
  analyzeLabel: string;
  manualLabel: string;
}> = {
  tiers: {
    icon: Stack,
    title: 'No pricing tiers yet',
    description: 'Time to decide how you\'ll package your product. Free tier? Pro tier? Enterprise? Let\'s figure it out.',
    analyzeLabel: 'Import from GitHub',
    manualLabel: 'Create a Tier',
  },
  features: {
    icon: Package,
    title: 'No features yet',
    description: 'What can your product do? List your features here, then decide which ones go in which pricing tier.',
    analyzeLabel: 'Import from GitHub',
    manualLabel: 'Add a Feature',
  },
  costs: {
    icon: CurrencyDollar,
    title: 'No costs added yet',
    description: 'How much does it cost you to serve each customer? Add your costs here so you can price profitably.',
    analyzeLabel: 'Import from GitHub',
    manualLabel: 'Add a Cost',
  },
};

export function EmptyState({ type, onAnalyze, onAddManually }: EmptyStateProps) {
  const { icon: Icon, title, description, analyzeLabel, manualLabel } = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4 sm:px-6 text-center">
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gray-100 flex items-center justify-center mb-4 sm:mb-6">
        <Icon size={24} className="text-gray-400 sm:w-8 sm:h-8" weight="duotone" />
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-500 max-w-md mb-6 sm:mb-8">{description}</p>

      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
        {onAnalyze && (
          <button
            onClick={onAnalyze}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-[#253ff6] text-white rounded-lg font-medium text-sm hover:bg-[#1e35d4] active:bg-[#1e35d4] transition-colors shadow-md shadow-[#253ff6]/20 w-full sm:w-auto touch-manipulation"
          >
            <GithubLogo size={18} weight="bold" />
            {analyzeLabel}
          </button>
        )}

        {onAddManually && (
          <button
            onClick={onAddManually}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 hover:border-gray-300 active:bg-gray-50 transition-colors w-full sm:w-auto touch-manipulation"
          >
            <Plus size={18} weight="bold" />
            {manualLabel}
          </button>
        )}
      </div>
    </div>
  );
}
