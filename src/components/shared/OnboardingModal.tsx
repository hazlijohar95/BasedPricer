/**
 * OnboardingModal component
 * Shown to first-time visitors to help them get started
 */

import { useState } from 'react';
import { Sparkle, Rocket, Code, X, Lightning } from '@phosphor-icons/react';
import { usePricing } from '../../context/PricingContext';
import { useNavigation } from '../../context/NavigationContext';
import { CURRENCIES, type CurrencyCode } from '../../constants';
import { useEscapeKey, useFocusTrap } from '../../hooks';

interface OnboardingOption {
  id: 'template' | 'fresh' | 'analyze';
  icon: React.ReactNode;
  title: string;
  description: string;
  action: () => void;
}

export function OnboardingModal() {
  const {
    isFirstVisit,
    completeOnboarding,
    resetToEmpty,
    setCurrency,
    currency,
  } = usePricing();
  const { navigateTo } = useNavigation();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(currency);
  const [step, setStep] = useState<'welcome' | 'currency' | 'start'>('welcome');

  // Keyboard navigation - escape skips to template
  const handleSkip = () => {
    setCurrency(selectedCurrency);
    completeOnboarding();
  };
  useEscapeKey(handleSkip, isFirstVisit);
  const modalRef = useFocusTrap<HTMLDivElement>(isFirstVisit);

  // Don't render if not first visit
  if (!isFirstVisit) return null;

  const handleStartWithTemplate = () => {
    setCurrency(selectedCurrency);
    completeOnboarding();
    // Default state already has the AI SaaS template
  };

  const handleStartFresh = () => {
    setCurrency(selectedCurrency);
    resetToEmpty();
    completeOnboarding();
  };

  const handleAnalyzeCodebase = () => {
    setCurrency(selectedCurrency);
    completeOnboarding();
    navigateTo('analyze');
  };

  const options: OnboardingOption[] = [
    {
      id: 'template',
      icon: <Sparkle size={24} weight="duotone" className="text-[#253ff6]" />,
      title: 'Start with AI SaaS Template',
      description: 'Pre-configured costs and tiers for an AI-powered SaaS product. Perfect for getting started quickly.',
      action: handleStartWithTemplate,
    },
    {
      id: 'fresh',
      icon: <Rocket size={24} weight="duotone" className="text-emerald-600" />,
      title: 'Start Fresh',
      description: 'Begin with a blank slate. Add your own costs, features, and pricing tiers from scratch.',
      action: handleStartFresh,
    },
    {
      id: 'analyze',
      icon: <Code size={24} weight="duotone" className="text-violet-600" />,
      title: 'Analyze My Codebase',
      description: 'Let AI analyze your codebase to detect features and suggest pricing. Requires API key.',
      action: handleAnalyzeCodebase,
    },
  ];

  const currencyOptions = Object.entries(CURRENCIES).map(([code, curr]) => ({
    code: code as CurrencyCode,
    label: `${curr.symbol} ${curr.name}`,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#e4e4e4] bg-gradient-to-br from-[rgba(37,63,246,0.04)] to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#253ff6] flex items-center justify-center">
                <Lightning size={20} weight="fill" className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Welcome to BasedPricer</h2>
                <p className="text-sm text-gray-500">Let's get you set up</p>
              </div>
            </div>
            <button
              onClick={handleStartWithTemplate}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Skip to template"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'welcome' && (
            <>
              <p className="text-gray-600 mb-6">
                BasedPricer helps you calculate costs, set optimal prices, and preview your pricing page.
                Choose how you'd like to start:
              </p>

              <div className="space-y-3">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setStep('currency')}
                    className="w-full p-4 text-left border border-[#e4e4e4] rounded-lg hover:border-[#253ff6] hover:bg-[rgba(37,63,246,0.02)] transition-all duration-200 group"
                    data-option={option.id}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[rgba(37,63,246,0.08)] transition-colors">
                        {option.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{option.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'currency' && (
            <>
              <p className="text-gray-600 mb-6">
                Select your preferred currency. All prices are stored in MYR and converted for display.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {currencyOptions.map((curr) => (
                  <button
                    key={curr.code}
                    onClick={() => setSelectedCurrency(curr.code)}
                    className={`p-3 text-left border rounded-lg transition-all duration-200 ${
                      selectedCurrency === curr.code
                        ? 'border-[#253ff6] bg-[rgba(37,63,246,0.04)]'
                        : 'border-[#e4e4e4] hover:border-gray-300'
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      selectedCurrency === curr.code ? 'text-[#253ff6]' : 'text-gray-700'
                    }`}>
                      {curr.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('welcome')}
                  className="flex-1 px-4 py-2.5 border border-[#e4e4e4] text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('start')}
                  className="flex-1 px-4 py-2.5 bg-[#253ff6] text-white rounded-lg hover:bg-[#1e35d4] transition-colors font-medium"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 'start' && (
            <>
              <p className="text-gray-600 mb-6">
                Perfect! Now choose how you'd like to start:
              </p>

              <div className="space-y-3 mb-6">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={option.action}
                    className="w-full p-4 text-left border border-[#e4e4e4] rounded-lg hover:border-[#253ff6] hover:bg-[rgba(37,63,246,0.02)] transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[rgba(37,63,246,0.08)] transition-colors">
                        {option.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{option.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep('currency')}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Change currency
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-[#e4e4e4]">
          <p className="text-xs text-gray-400 text-center">
            Your data is stored locally in your browser. Nothing is sent to our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
