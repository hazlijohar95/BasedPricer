import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link as RouterLink } from 'react-router-dom';
import {
  House,
  Package,
  CurrencyDollar,
  Stack,
  Calculator,
  Browser,
  ArrowRight,
  GithubLogo,
  TrendUp,
  Percent,
  ChartLine,
  Lightning,
  Eye,
  Link,
  BookOpen,
} from '@phosphor-icons/react';
import { PricingProvider, usePricing } from './context/PricingContext';
import { NavigationProvider, useNavigation, type Tab } from './context/NavigationContext';
import { ToastContainer, WelcomePanel, ProjectManager } from './components/shared';
import { Logo } from './components/brand';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SkeletonPage } from './components/shared/Skeleton';
import { MARGIN_THRESHOLDS, getMarginStyleFromThreshold } from './constants';
import { useEscapeKey, useFocusTrap, useUndoRedo } from './hooks';
import { ArrowCounterClockwise, ArrowClockwise } from '@phosphor-icons/react';

// Lazy-loaded components for code splitting (reduces initial bundle size)
const FeatureInventory = lazy(() => import('./components/FeatureInventory').then(m => ({ default: m.FeatureInventory })));
const COGSCalculator = lazy(() => import('./components/COGSCalculator').then(m => ({ default: m.COGSCalculator })));
const TierConfigurator = lazy(() => import('./components/TierConfigurator').then(m => ({ default: m.TierConfigurator })));
const PricingCalculator = lazy(() => import('./components/PricingCalculator').then(m => ({ default: m.PricingCalculator })));
const PricingMockup = lazy(() => import('./components/PricingMockup').then(m => ({ default: m.PricingMockup })));
const CodebaseAnalyzer = lazy(() => import('./components/CodebaseAnalyzer').then(m => ({ default: m.CodebaseAnalyzer })));
const ReportGenerator = lazy(() => import('./components/ReportGenerator').then(m => ({ default: m.ReportGenerator })));
const ReportPage = lazy(() => import('./components/ReportPage').then(m => ({ default: m.ReportPage })));
const DocsPage = lazy(() => import('./components/DocsPage').then(m => ({ default: m.DocsPage })));

// Loading fallback with skeleton
function LoadingFallback() {
  return (
    <div className="p-6" role="status" aria-label="Loading content">
      <SkeletonPage />
    </div>
  );
}

const tabs: { id: Tab; label: string; icon: typeof House }[] = [
  { id: 'overview', label: 'Overview', icon: House },
  { id: 'analyze', label: 'Analyze', icon: GithubLogo },
  { id: 'features', label: 'Features', icon: Package },
  { id: 'cogs', label: 'COGS', icon: CurrencyDollar },
  { id: 'tiers', label: 'Tiers', icon: Stack },
  { id: 'pricing', label: 'Calculator', icon: Calculator },
  { id: 'mockup', label: 'Mockup', icon: Browser },
];

function MainApp() {
  const { activeTab, navigateTo } = useNavigation();
  const { toasts, dismissToast, canUndo, canRedo, undo, redo } = usePricing();

  // Enable keyboard shortcuts for undo/redo
  useUndoRedo({ onUndo: undo, onRedo: redo, canUndo, canRedo });
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportGeneratorOpen, setReportGeneratorOpen] = useState(false);

  // Close mobile menu on Escape key
  useEscapeKey(() => setMobileMenuOpen(false), mobileMenuOpen);

  // Close mobile menu when tab changes
  const handleNavigate = (tab: Tab) => {
    navigateTo(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 z-50 flex items-center justify-between px-4 safe-area-top">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2.5 -ml-1 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-all duration-150 touch-manipulation focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-sidebar"
        >
          <svg
            className={`w-5 h-5 text-gray-700 transition-transform duration-300 ${mobileMenuOpen ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <Logo size="sm" variant="full" />
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar - Desktop: hover expand, Mobile: slide overlay */}
      <aside
        id="mobile-sidebar"
        role="navigation"
        aria-label="Main navigation"
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200/80 z-50 flex flex-col transition-transform duration-300 ease-out
          ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          md:translate-x-0 md:shadow-none md:transition-[width] md:duration-300
          ${sidebarHovered ? 'md:w-56' : 'md:w-16'}
          w-72 max-w-[85vw]
        `}
      >
        {/* Logo */}
        <div className={`border-b border-gray-200/80 transition-all duration-300 ${sidebarHovered ? 'p-4' : 'p-3'} safe-area-top`}>
          <Logo
            size={sidebarHovered ? 'md' : 'sm'}
            variant={sidebarHovered ? 'full' : 'icon'}
            animated={sidebarHovered}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto overscroll-contain">
          <ul className="space-y-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => handleNavigate(tab.id)}
                    className={`w-full flex items-center gap-3 rounded-lg transition-all duration-200 touch-manipulation focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 outline-none
                      px-3 py-3 md:py-2.5
                      ${!sidebarHovered ? 'md:px-0 md:justify-center' : ''}
                      ${activeTab === tab.id
                        ? 'bg-brand-subtle text-brand-primary font-medium'
                        : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 hover:text-gray-900'
                      }`}
                  >
                    <Icon size={20} weight={activeTab === tab.id ? 'fill' : 'duotone'} className="flex-shrink-0" />
                    <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300
                      ${sidebarHovered ? 'md:opacity-100 md:w-auto' : 'md:opacity-0 md:w-0'}
                    `}>
                      {tab.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className={`border-t border-gray-200/80 transition-all duration-300 p-3 space-y-2 safe-area-bottom ${!sidebarHovered ? 'md:p-2 md:space-y-1' : ''}`}>
          {/* Docs Link */}
          <RouterLink
            to="/docs"
            onClick={() => setMobileMenuOpen(false)}
            className={`w-full flex items-center gap-3 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 active:bg-gray-200 hover:text-gray-900 touch-manipulation focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 outline-none
              px-3 py-3 md:py-2.5
              ${!sidebarHovered ? 'md:px-0 md:justify-center' : ''}
            `}
          >
            <BookOpen size={20} weight="duotone" className="flex-shrink-0" />
            <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300
              ${sidebarHovered ? 'md:opacity-100 md:w-auto' : 'md:opacity-0 md:w-0'}
            `}>
              Documentation
            </span>
          </RouterLink>

          {/* Generate Reports Button */}
          <button
            onClick={() => {
              setReportGeneratorOpen(true);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 rounded-lg transition-all duration-200 bg-brand-primary text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm touch-manipulation focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 outline-none
              px-3 py-3 md:py-2.5
              ${!sidebarHovered ? 'md:px-0 md:justify-center' : ''}
            `}
          >
            <Link size={20} weight="bold" className="flex-shrink-0" />
            <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300
              ${sidebarHovered ? 'md:opacity-100 md:w-auto' : 'md:opacity-0 md:w-0'}
            `}>
              Generate Reports
            </span>
          </button>
        </div>

      </aside>

      {/* Main Content */}
      <main className={`min-h-screen transition-all duration-300 ease-out pt-14 md:pt-0 ml-0 ${sidebarHovered ? 'md:ml-56' : 'md:ml-16'}`}>
        {/* Project Header Bar */}
        <div className="hidden md:flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl sticky top-0 z-30">
          <ProjectManager />
          <div className="flex items-center gap-3">
            {/* Undo/Redo buttons */}
            <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <ArrowCounterClockwise size={16} />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                title="Redo (Ctrl+Shift+Z)"
              >
                <ArrowClockwise size={16} />
              </button>
            </div>
            <div className="text-xs text-gray-500">
              <span>Auto-saved to browser</span>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 safe-area-bottom">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              {activeTab === 'overview' && <OverviewDashboard onNavigate={navigateTo} />}
              {activeTab === 'analyze' && <CodebaseAnalyzer />}
              {activeTab === 'features' && <FeatureInventory />}
              {activeTab === 'cogs' && <COGSCalculator />}
              {activeTab === 'tiers' && <TierConfigurator />}
              {activeTab === 'pricing' && <PricingCalculator />}
              {activeTab === 'mockup' && <PricingMockup />}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      {/* Report Generator Dialog */}
      <Suspense fallback={null}>
        <ReportGenerator
          isOpen={reportGeneratorOpen}
          onClose={() => setReportGeneratorOpen(false)}
        />
      </Suspense>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Welcome panel for first-time visitors */}
      <WelcomePanel />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <PricingProvider>
        <NavigationProvider>
          <Routes>
            <Route path="/" element={<MainApp />} />
            {/* Documentation page */}
            <Route path="/docs" element={
              <Suspense fallback={<LoadingFallback />}>
                <DocsPage />
              </Suspense>
            } />
            {/* Short link format: /r/{id}/{stakeholder} */}
            <Route path="/r/:id/:stakeholder" element={
              <Suspense fallback={<LoadingFallback />}>
                <ReportPage />
              </Suspense>
            } />
            {/* Portable link format: /report/{stakeholder}?d={compressed} */}
            <Route path="/report/:stakeholder" element={
              <Suspense fallback={<LoadingFallback />}>
                <ReportPage />
              </Suspense>
            } />
            {/* Legacy format (backwards compatibility) */}
            <Route path="/report/:data/:stakeholder" element={
              <Suspense fallback={<LoadingFallback />}>
                <ReportPage />
              </Suspense>
            } />
          </Routes>
        </NavigationProvider>
      </PricingProvider>
    </BrowserRouter>
  );
}

function OverviewDashboard({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { tiers, costs, variableCosts, fixedCosts, features, resetToEmpty } = usePricing();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Keyboard navigation for reset modal
  useEscapeKey(() => setShowResetConfirm(false), showResetConfirm);
  const modalRef = useFocusTrap<HTMLDivElement>(showResetConfirm);

  // Calculate key metrics from context
  const avgVariableCost = costs.variableTotal;
  // Find the first paid tier (non-zero price) or first active tier
  const paidTier = tiers.find(t => t.monthlyPriceMYR > 0 && t.status === 'active');
  const targetPrice = paidTier?.monthlyPriceMYR ?? 0;
  const grossMargin = targetPrice > 0 ? ((targetPrice - avgVariableCost) / targetPrice) * 100 : 0;

  // Cost items count (variable + fixed)
  const costItemsCount = variableCosts.length + fixedCosts.length;

  // Get active tiers
  const activeTiers = tiers.filter(t => t.status === 'active');

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Pricing Overview</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-2">Dashboard for your pricing strategy and key metrics</p>
        </div>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-sm text-gray-400 hover:text-gray-600 active:text-gray-800 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all touch-manipulation flex-shrink-0"
        >
          <svg
            className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span className="font-medium hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="presentation">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
            aria-hidden="true"
          />
          {/* Modal - use alertdialog for destructive actions */}
          <div
            ref={modalRef}
            role="alertdialog"
            aria-labelledby="reset-modal-title"
            aria-describedby="reset-modal-description"
            className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center" aria-hidden="true">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 id="reset-modal-title" className="font-semibold text-gray-900">Start Fresh?</h3>
                <p id="reset-modal-description" className="text-sm text-gray-500">Clear all data and begin with empty state</p>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-6 space-y-2">
              <p>This will permanently delete:</p>
              <ul className="list-disc list-inside text-gray-500 text-xs space-y-1">
                <li>{variableCosts.length} variable cost{variableCosts.length !== 1 ? 's' : ''}</li>
                <li>{fixedCosts.length} fixed cost{fixedCosts.length !== 1 ? 's' : ''}</li>
                <li>{tiers.length} pricing tier{tiers.length !== 1 ? 's' : ''}</li>
                <li>{features.length} feature{features.length !== 1 ? 's' : ''}</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToEmpty();
                  setShowResetConfirm(false);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-4 sm:p-5 border-l-[3px] border-l-blue-500">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-500">Target Price</p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-subtle flex items-center justify-center">
              <TrendUp size={14} className="sm:hidden text-brand-primary" weight="duotone" />
              <TrendUp size={16} className="hidden sm:block text-brand-primary" weight="duotone" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1.5 sm:mt-2 font-mono tracking-tight">
            MYR {targetPrice}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">{paidTier?.name ?? 'No paid tier'} / month</p>
        </div>

        <div className="card p-4 sm:p-5 border-l-[3px] border-l-emerald-500">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-500">Gross Margin</p>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
              grossMargin >= MARGIN_THRESHOLDS.HEALTHY ? 'bg-emerald-50' :
              grossMargin >= MARGIN_THRESHOLDS.ACCEPTABLE ? 'bg-amber-50' :
              'bg-red-50'
            }`}>
              <Percent size={14} className="sm:hidden" weight="duotone" />
              <Percent size={16} className={`hidden sm:block ${
                grossMargin >= MARGIN_THRESHOLDS.HEALTHY ? 'text-emerald-600' :
                grossMargin >= MARGIN_THRESHOLDS.ACCEPTABLE ? 'text-amber-600' :
                'text-red-600'
              }`} weight="duotone" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-semibold mt-1.5 sm:mt-2 ${
            grossMargin >= MARGIN_THRESHOLDS.HEALTHY ? 'text-emerald-600' :
            grossMargin >= MARGIN_THRESHOLDS.ACCEPTABLE ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {grossMargin.toFixed(0)}%
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">At target price</p>
        </div>

        <div className="card p-4 sm:p-5 border-l-[3px] border-l-violet-500">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-500">Est. COGS</p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-violet-50 flex items-center justify-center">
              <ChartLine size={14} className="sm:hidden text-violet-600" weight="duotone" />
              <ChartLine size={16} className="hidden sm:block text-violet-600" weight="duotone" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1.5 sm:mt-2 font-mono tracking-tight">
            MYR {avgVariableCost.toFixed(2)}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">Variable cost / customer</p>
        </div>

        <div className="card p-4 sm:p-5 border-l-[3px] border-l-amber-500">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-500">Cost Items</p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Lightning size={14} className="sm:hidden text-amber-600" weight="duotone" />
              <Lightning size={16} className="hidden sm:block text-amber-600" weight="duotone" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1.5 sm:mt-2">
            {costItemsCount}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">
            {variableCosts.length} var, {fixedCosts.length} fixed
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Tools Navigation */}
        <div className="lg:col-span-2 card p-4 sm:p-6">
          <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Tools</h3>
          <div className="space-y-1.5 sm:space-y-1">
            {[
              { id: 'analyze' as Tab, label: 'Codebase Analyzer', sub: 'Import features from GitHub', icon: GithubLogo, borderColor: 'border-l-gray-400' },
              { id: 'features' as Tab, label: 'Feature Inventory', sub: 'Browse and categorize features', icon: Package, borderColor: 'border-l-blue-500' },
              { id: 'cogs' as Tab, label: 'COGS Calculator', sub: 'Analyze variable and fixed costs', icon: CurrencyDollar, borderColor: 'border-l-emerald-500' },
              { id: 'tiers' as Tab, label: 'Tier Configurator', sub: 'Set limits and feature access', icon: Stack, borderColor: 'border-l-violet-500' },
              { id: 'pricing' as Tab, label: 'Pricing Calculator', sub: 'Model revenue and unit economics', icon: Calculator, borderColor: 'border-l-amber-500' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`group w-full flex items-center justify-between p-3 sm:p-4 rounded-lg border-l-[3px] ${item.borderColor} bg-gray-50/50 hover:bg-gray-100/80 active:bg-gray-200/80 transition-all text-left touch-manipulation`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="sm:hidden text-gray-600" weight="duotone" />
                      <Icon size={18} className="hidden sm:block text-gray-600" weight="duotone" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-brand-primary transition-colors truncate">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500 truncate hidden sm:block">{item.sub}</p>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all flex-shrink-0 ml-2"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Tiers Panel */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">Tiers</h3>
            <button
              onClick={() => onNavigate('tiers')}
              className="text-xs text-brand-primary hover:underline active:text-blue-800 touch-manipulation py-1"
            >
              Configure
            </button>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`p-2.5 sm:p-3 rounded-lg border transition-colors ${
                  tier.status === 'active'
                    ? 'bg-white border-gray-200'
                    : 'bg-gray-50 border-gray-100 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tier.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className="text-sm font-medium text-gray-900 truncate">{tier.name}</span>
                    {tier.id === 'basic' && (
                      <span className="text-[10px] bg-brand-subtle text-brand-primary px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                        Target
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-mono text-gray-600 flex-shrink-0">
                    {tier.monthlyPriceMYR === 0 ? 'Free' : `MYR ${tier.monthlyPriceMYR}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
            <button
              onClick={() => onNavigate('mockup')}
              className="group w-full flex items-center gap-3 p-3 rounded-lg bg-gray-900 hover:bg-brand-primary active:bg-blue-800 transition-colors touch-manipulation"
            >
              <Eye size={18} weight="bold" className="text-white flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-white truncate">Preview Pricing Page</p>
                <p className="text-xs text-gray-300 truncate hidden sm:block">See customer view</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Cost Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs sm:text-sm text-gray-500">Variable Costs</p>
            <p className="text-lg sm:text-xl font-semibold text-gray-900 font-mono mt-1">
              MYR {costs.variableTotal.toFixed(2)}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">Per customer / month</p>
          </div>
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs sm:text-sm text-gray-500">Fixed Costs</p>
            <p className="text-lg sm:text-xl font-semibold text-gray-900 font-mono mt-1">
              MYR {costs.fixedTotal.toFixed(2)}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Total monthly</p>
          </div>
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs sm:text-sm text-gray-500">Active Tiers</p>
            <p className="text-lg sm:text-xl font-semibold text-gray-900 mt-1">{activeTiers.length}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">of {tiers.length} configured</p>
          </div>
          <div className={`p-3 sm:p-4 rounded-lg border ${
            grossMargin >= MARGIN_THRESHOLDS.HEALTHY
              ? 'bg-emerald-50 border-emerald-200'
              : grossMargin >= MARGIN_THRESHOLDS.ACCEPTABLE
              ? 'bg-amber-50 border-amber-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-xs sm:text-sm ${
              grossMargin >= MARGIN_THRESHOLDS.HEALTHY ? 'text-emerald-600' :
              grossMargin >= MARGIN_THRESHOLDS.ACCEPTABLE ? 'text-amber-600' :
              'text-red-600'
            }`}>Health Status</p>
            <p className={`text-lg sm:text-xl font-semibold mt-1 ${
              grossMargin >= MARGIN_THRESHOLDS.HEALTHY ? 'text-emerald-700' :
              grossMargin >= MARGIN_THRESHOLDS.ACCEPTABLE ? 'text-amber-700' :
              'text-red-700'
            }`}>
              {getMarginStyleFromThreshold(grossMargin).label}
            </p>
            <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${
              grossMargin >= MARGIN_THRESHOLDS.HEALTHY ? 'text-emerald-500' :
              grossMargin >= MARGIN_THRESHOLDS.ACCEPTABLE ? 'text-amber-500' :
              'text-red-500'
            }`}>
              {grossMargin >= MARGIN_THRESHOLDS.HEALTHY ? `≥${MARGIN_THRESHOLDS.HEALTHY}%` :
               grossMargin >= MARGIN_THRESHOLDS.ACCEPTABLE ? `${MARGIN_THRESHOLDS.ACCEPTABLE}-${MARGIN_THRESHOLDS.HEALTHY}%` :
               `<${MARGIN_THRESHOLDS.ACCEPTABLE}%`} margin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
