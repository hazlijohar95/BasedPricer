/**
 * WelcomePanel component
 * Minimalist side panel for first-time visitors
 * Replaces the old multi-step OnboardingModal
 */

import { useState, useEffect } from 'react';
import { Code, Sparkle, Plus, X, HardDrives, Lightning } from '@phosphor-icons/react';
import { usePricing } from '../../context/PricingContext';
import { useNavigation } from '../../context/NavigationContext';
import { CURRENCIES, type CurrencyCode } from '../../constants';
import { useEscapeKey, useFocusTrap } from '../../hooks';

export function WelcomePanel() {
  const {
    isFirstVisit,
    completeOnboarding,
    resetToEmpty,
    setCurrency,
    currency,
  } = usePricing();
  const { navigateTo } = useNavigation();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(currency);

  // Animate in on mount
  useEffect(() => {
    if (isFirstVisit) {
      // Small delay to ensure the initial render is off-screen
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isFirstVisit]);

  // Handle dismiss (defaults to template)
  const handleDismiss = () => {
    setIsVisible(false);
    // Wait for animation to complete before completing onboarding
    setTimeout(() => {
      setCurrency(selectedCurrency);
      completeOnboarding();
    }, 300);
  };

  // Keyboard navigation - escape dismisses
  useEscapeKey(handleDismiss, isFirstVisit);
  const panelRef = useFocusTrap<HTMLElement>(isFirstVisit);

  // Don't render if not first visit
  if (!isFirstVisit) return null;

  const handleStartWithTemplate = () => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrency(selectedCurrency);
      completeOnboarding();
    }, 300);
  };

  const handleAnalyzeCodebase = () => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrency(selectedCurrency);
      completeOnboarding();
      navigateTo('analyze');
    }, 300);
  };

  const handleStartFresh = () => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrency(selectedCurrency);
      resetToEmpty();
      completeOnboarding();
    }, 300);
  };

  const currencyOptions = Object.entries(CURRENCIES).map(([code, curr]) => ({
    code: code as CurrencyCode,
    label: `${curr.symbol} ${curr.code}`,
    name: curr.name,
  }));

  return (
    <>
      {/* Subtle backdrop - no blur, clickable to dismiss */}
      <div
        className={`fixed inset-0 z-40 bg-black/10 transition-opacity duration-300
          ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleStartWithTemplate}
        aria-hidden="true"
      />

      {/* Side panel */}
      <aside
        ref={panelRef}
        className={`fixed right-0 top-0 h-full w-full md:w-[400px] z-50
          bg-white border-l border-[#e4e4e4] shadow-xl
          transform transition-transform duration-300 ease-out
          flex flex-col
          ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-panel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#e4e4e4]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#253ff6] flex items-center justify-center flex-shrink-0">
              <Lightning size={18} weight="fill" className="text-white sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 id="welcome-panel-title" className="text-base sm:text-lg font-semibold text-gray-900">
                Welcome to BasedPricer
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">Let's get you started</p>
            </div>
          </div>
          <button
            onClick={handleStartWithTemplate}
            className="p-2 hover:bg-gray-100 active:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            aria-label="Close panel"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            How would you like to start?
          </p>

          <div className="space-y-2 sm:space-y-3">
            {/* Primary option - Analyze Codebase */}
            <button
              onClick={handleAnalyzeCodebase}
              className="w-full p-3 sm:p-4 text-left border-2 border-[#253ff6] bg-[rgba(37,63,246,0.02)] rounded-lg hover:bg-[rgba(37,63,246,0.06)] active:bg-[rgba(37,63,246,0.06)] transition-all duration-200 group touch-manipulation"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[rgba(37,63,246,0.08)] flex items-center justify-center flex-shrink-0">
                  <Code size={20} weight="duotone" className="text-[#253ff6] sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Analyze My Codebase</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                    Connect GitHub and let AI detect features
                  </p>
                </div>
              </div>
            </button>

            {/* Secondary option - Template */}
            <button
              onClick={handleStartWithTemplate}
              className="w-full p-3 sm:p-4 text-left border border-[#e4e4e4] rounded-lg hover:border-gray-300 hover:bg-gray-50 active:bg-gray-50 transition-all duration-200 group touch-manipulation"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-100 transition-colors">
                  <Sparkle size={20} weight="duotone" className="text-[#253ff6] sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">Use AI SaaS Template</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                    Pre-configured costs and tiers
                  </p>
                </div>
              </div>
            </button>

            {/* Tertiary option - Fresh Start */}
            <button
              onClick={handleStartFresh}
              className="w-full p-3 text-left rounded-lg hover:bg-gray-50 active:bg-gray-50 transition-all duration-200 group touch-manipulation"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-100 transition-colors">
                  <Plus size={18} weight="bold" className="text-gray-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Start Fresh</h3>
                  <p className="text-xs text-gray-400">Begin with a blank slate</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-[#e4e4e4] bg-gray-50/50">
          {/* Currency selector */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <label htmlFor="currency-select" className="text-xs sm:text-sm text-gray-600">
              Currency
            </label>
            <select
              id="currency-select"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
              className="text-sm border border-[#e4e4e4] rounded-lg px-3 py-2 sm:py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253ff6] focus:border-transparent touch-manipulation"
            >
              {currencyOptions.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.label}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy note */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <HardDrives size={14} weight="duotone" />
            <span>Your data stays local in your browser</span>
          </div>
        </div>
      </aside>
    </>
  );
}
