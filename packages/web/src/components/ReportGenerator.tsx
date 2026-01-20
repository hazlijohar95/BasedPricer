import { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  FileText,
  ChartLine,
  Code,
  Megaphone,
  Link,
  Info,
  Globe,
  Desktop,
  ShareNetwork,
  Warning,
} from '@phosphor-icons/react';
import { usePricing } from '../context/PricingContext';
import {
  createReportData,
  generateAllReportUrls,
  getUrlStats,
  type ReportData
} from '../utils/reportEncoder';
import { useEscapeKey, useFocusTrap } from '../hooks';

interface ReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

type StakeholderKey = 'accountant' | 'investor' | 'engineer' | 'marketer';
type UrlMode = 'short' | 'portable';

const stakeholders: { key: StakeholderKey; label: string; icon: typeof FileText; description: string }[] = [
  { key: 'accountant', label: 'Accountant', icon: FileText, description: 'Costs, margins, P&L projections' },
  { key: 'investor', label: 'Investor', icon: ChartLine, description: 'Valuations, milestones, metrics' },
  { key: 'engineer', label: 'Engineer', icon: Code, description: 'Features, limits, implementation' },
  { key: 'marketer', label: 'Marketer', icon: Megaphone, description: 'Positioning, highlights, CTAs' },
];

export function ReportGenerator({ isOpen, onClose }: ReportGeneratorProps) {
  const pricingState = usePricing();
  const [projectName, setProjectName] = useState('My SaaS Product');

  // Keyboard navigation
  useEscapeKey(onClose, isOpen);
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
  const [notes, setNotes] = useState<Record<StakeholderKey, string>>({
    accountant: '',
    investor: '',
    engineer: '',
    marketer: '',
  });
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedStakeholders, setSelectedStakeholders] = useState<Set<StakeholderKey>>(
    new Set(['accountant', 'investor', 'engineer', 'marketer'])
  );
  const [urlMode, setUrlMode] = useState<UrlMode>('portable');
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState(5); // Percentage (0-100)

  // Create report data
  const reportData = useMemo((): ReportData => {
    const state = {
      variableCosts: pricingState.variableCosts,
      fixedCosts: pricingState.fixedCosts,
      customerCount: pricingState.customerCount,
      selectedPrice: pricingState.selectedPrice,
      currency: pricingState.currency,
      tiers: pricingState.tiers,
      features: pricingState.features,
      tierDisplayConfigs: pricingState.tierDisplayConfigs,
      utilizationRate: pricingState.utilizationRate,
      tierDistribution: pricingState.tierDistribution,
      businessType: pricingState.businessType,
      businessTypeConfidence: pricingState.businessTypeConfidence,
      pricingModelType: pricingState.pricingModelType,
      isFirstVisit: pricingState.isFirstVisit,
    };
    const data = createReportData(projectName, state, notes);
    // Add settings with growth rate
    return {
      ...data,
      settings: {
        monthlyGrowthRate: monthlyGrowthRate / 100, // Convert percentage to decimal
      },
    };
  }, [pricingState, projectName, notes, monthlyGrowthRate]);

  // Generate URLs
  const urls = useMemo(() => {
    const baseUrl = window.location.origin;
    return generateAllReportUrls(baseUrl, reportData);
  }, [reportData]);

  // Get URL stats
  const urlStats = useMemo(() => getUrlStats(reportData), [reportData]);

  const handleCopyUrl = async (key: StakeholderKey) => {
    try {
      const url = urlMode === 'short' ? urls.short[key] : urls.portable[key];
      await navigator.clipboard.writeText(url);
      setCopiedUrl(key);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleCopyAll = async () => {
    try {
      const selectedUrls = stakeholders
        .filter(s => selectedStakeholders.has(s.key))
        .map(s => {
          const url = urlMode === 'short' ? urls.short[s.key] : urls.portable[s.key];
          return `${s.label}: ${url}`;
        })
        .join('\n');

      await navigator.clipboard.writeText(selectedUrls);
      setCopiedUrl('all');
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleShare = async (key: StakeholderKey) => {
    const url = urlMode === 'short' ? urls.short[key] : urls.portable[key];
    const stakeholder = stakeholders.find(s => s.key === key);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${projectName} - ${stakeholder?.label} Report`,
          text: `Check out the ${stakeholder?.label.toLowerCase()} report for ${projectName}`,
          url,
        });
      } catch {
        // User cancelled or share failed - this is expected behavior
      }
    } else {
      // Fallback to copy
      handleCopyUrl(key);
    }
  };

  const toggleStakeholder = (key: StakeholderKey) => {
    const newSet = new Set(selectedStakeholders);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedStakeholders(newSet);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div ref={modalRef} className="relative bg-white rounded-t-xl sm:rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Link size={18} weight="duotone" className="text-[#253ff6] sm:w-5 sm:h-5" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Generate Reports</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-1 hover:bg-gray-100 active:bg-gray-100 rounded transition-colors touch-manipulation"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-140px)]">
          {/* Project Name */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#253ff6] focus:border-transparent touch-manipulation"
              placeholder="Enter project name..."
            />
          </div>

          {/* Growth Rate Setting */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Monthly Growth Rate
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={monthlyGrowthRate}
                onChange={(e) => setMonthlyGrowthRate(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#253ff6]"
              />
              <div className="flex items-center gap-1 min-w-[60px]">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={monthlyGrowthRate}
                  onChange={(e) => setMonthlyGrowthRate(Math.max(0, Math.min(50, Number(e.target.value))))}
                  className="w-12 px-2 py-1 text-sm text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#253ff6] focus:border-transparent"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Used in P&L projections and investor metrics (0-50%)
            </p>
          </div>

          {/* URL Mode Selection */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Link Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={() => setUrlMode('portable')}
                className={`p-3 rounded-md border-2 text-left transition-all touch-manipulation ${
                  urlMode === 'portable'
                    ? 'border-[#253ff6] bg-[rgba(37,63,246,0.04)]'
                    : 'border-gray-200 hover:border-gray-300 active:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Globe size={18} className={urlMode === 'portable' ? 'text-[#253ff6]' : 'text-gray-500'} />
                  <span className="font-medium text-gray-900 text-xs sm:text-sm">Portable Link</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-gray-500">~{urlStats.portableUrlLength} chars • Works anywhere</p>
              </button>
              <button
                onClick={() => setUrlMode('short')}
                className={`p-3 rounded-md border-2 text-left transition-all touch-manipulation ${
                  urlMode === 'short'
                    ? 'border-[#253ff6] bg-[rgba(37,63,246,0.04)]'
                    : 'border-gray-200 hover:border-gray-300 active:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Desktop size={18} className={urlMode === 'short' ? 'text-[#253ff6]' : 'text-gray-500'} />
                  <span className="font-medium text-gray-900 text-xs sm:text-sm">Short Link</span>
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                    This device only
                  </span>
                </div>
                <p className="text-xs text-gray-500">~{urlStats.shortUrlLength} chars • Stored locally</p>
              </button>
            </div>
            <div className="mt-2 p-2 bg-gray-50 rounded-md flex items-start gap-2">
              <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500">
                {urlMode === 'short' ? (
                  <>Short links are stored locally. Easy to share but only work on this device.</>
                ) : (
                  <>Portable links embed all data. Work anywhere but longer ({urlStats.compressionRatio}% compressed).</>
                )}
              </p>
            </div>
            {urlMode === 'portable' && urlStats.portableUrlLength > 2000 && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
                <Warning size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  {urlStats.portableUrlLength > 8000 ? (
                    <>
                      <strong>URL very long ({urlStats.portableUrlLength.toLocaleString()} chars)</strong> — May not work in some browsers.
                    </>
                  ) : (
                    <>
                      <strong>URL is long ({urlStats.portableUrlLength.toLocaleString()} chars)</strong> — May be truncated when shared.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Stakeholder Selection */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              Select Reports to Generate
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {stakeholders.map(({ key, label, icon: Icon, description }) => (
                <button
                  key={key}
                  onClick={() => toggleStakeholder(key)}
                  className={`p-2.5 sm:p-3 rounded-md border-2 text-left transition-all touch-manipulation ${
                    selectedStakeholders.has(key)
                      ? 'border-[#253ff6] bg-[rgba(37,63,246,0.04)]'
                      : 'border-gray-200 hover:border-gray-300 active:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      selectedStakeholders.has(key) ? 'bg-[#253ff6] text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon size={14} weight="bold" className="sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-xs sm:text-sm">{label}</p>
                      <p className="text-xs text-gray-500 truncate">{description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes (collapsed by default) */}
          <details className="mb-4 sm:mb-6">
            <summary className="cursor-pointer text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3 flex items-center gap-2 touch-manipulation">
              <span>Add Notes (Optional)</span>
              <span className="text-xs text-gray-400">Tap to expand</span>
            </summary>
            <div className="space-y-2 sm:space-y-3 mt-2 sm:mt-3">
              {stakeholders.filter(s => selectedStakeholders.has(s.key)).map(({ key, label, icon: Icon }) => (
                <div key={key} className="border border-gray-200 rounded-md overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <Icon size={14} className="text-gray-500" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{label} Notes</span>
                  </div>
                  <textarea
                    value={notes[key]}
                    onChange={(e) => setNotes(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm resize-none focus:outline-none touch-manipulation"
                    rows={2}
                    placeholder={`Add notes for ${label.toLowerCase()}...`}
                  />
                </div>
              ))}
            </div>
          </details>

          {/* Generated URLs */}
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Generated Links
              </label>
              <button
                onClick={handleCopyAll}
                className={`text-xs px-2 py-1.5 rounded transition-colors touch-manipulation ${
                  copiedUrl === 'all'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-200'
                }`}
              >
                {copiedUrl === 'all' ? 'Copied!' : 'Copy all'}
              </button>
            </div>
            <div className="space-y-2">
              {stakeholders.filter(s => selectedStakeholders.has(s.key)).map(({ key, label, icon: Icon }) => {
                const url = urlMode === 'short' ? urls.short[key] : urls.portable[key];
                const isCopied = copiedUrl === key;

                return (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 sm:p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div className="flex items-center gap-2 sm:w-auto">
                      <Icon size={16} className="text-gray-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">{label}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="text"
                        value={url}
                        readOnly
                        className="flex-1 text-xs font-mono bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-600 truncate min-w-0"
                        title={url}
                      />
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {'share' in navigator && (
                          <button
                            onClick={() => handleShare(key)}
                            className="p-2 sm:p-1.5 rounded text-gray-500 hover:bg-gray-200 active:bg-gray-200 transition-colors touch-manipulation"
                            title="Share"
                          >
                            <ShareNetwork size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyUrl(key)}
                          className={`px-3 py-1.5 sm:py-1 rounded text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                            isCopied
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-[#253ff6] text-white hover:bg-[#1a2eb8] active:bg-[#1a2eb8]'
                          }`}
                        >
                          {isCopied ? (
                            <span className="flex items-center gap-1">
                              <Check size={14} /> <span className="hidden sm:inline">Copied</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Copy size={14} /> <span className="hidden sm:inline">Copy</span>
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            {urlMode === 'short' ? (
              <span className="flex items-center gap-1">
                <Desktop size={12} /> ID: <code className="bg-gray-200 px-1 rounded">{urls.shortId}</code>
              </span>
            ) : (
              <span>Reports contain your pricing data (read-only)</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 active:bg-gray-300 transition-colors text-sm font-medium touch-manipulation"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
