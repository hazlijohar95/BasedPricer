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

interface ReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

type StakeholderKey = 'accountant' | 'investor' | 'engineer' | 'marketer';
type UrlMode = 'short' | 'portable';

const stakeholders: { key: StakeholderKey; label: string; icon: typeof FileText; description: string }[] = [
  { key: 'accountant', label: 'Accountant', icon: FileText, description: 'COGS, margins, P&L projections' },
  { key: 'investor', label: 'Investor', icon: ChartLine, description: 'Valuations, milestones, metrics' },
  { key: 'engineer', label: 'Engineer', icon: Code, description: 'Features, limits, implementation' },
  { key: 'marketer', label: 'Marketer', icon: Megaphone, description: 'Positioning, highlights, CTAs' },
];

export function ReportGenerator({ isOpen, onClose }: ReportGeneratorProps) {
  const pricingState = usePricing();
  const [projectName, setProjectName] = useState('My SaaS Product');
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
  const [urlMode, setUrlMode] = useState<UrlMode>('short');

  // Create report data
  const reportData = useMemo((): ReportData => {
    const state = {
      variableCosts: pricingState.variableCosts,
      fixedCosts: pricingState.fixedCosts,
      customerCount: pricingState.customerCount,
      selectedPrice: pricingState.selectedPrice,
      tiers: pricingState.tiers,
      features: pricingState.features,
      utilizationRate: pricingState.utilizationRate,
      tierDistribution: pricingState.tierDistribution,
    };
    return createReportData(projectName, state, notes);
  }, [pricingState, projectName, notes]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Link size={20} weight="duotone" className="text-[#253ff6]" />
            <h2 className="text-lg font-semibold text-gray-900">Generate Shareable Reports</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Project Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#253ff6] focus:border-transparent"
              placeholder="Enter project name..."
            />
          </div>

          {/* URL Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setUrlMode('short')}
                className={`p-3 rounded-md border-2 text-left transition-all ${
                  urlMode === 'short'
                    ? 'border-[#253ff6] bg-[rgba(37,63,246,0.04)]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Desktop size={18} className={urlMode === 'short' ? 'text-[#253ff6]' : 'text-gray-500'} />
                  <span className="font-medium text-gray-900 text-sm">Short Link</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-gray-500">~{urlStats.shortUrlLength} chars • Works on this device</p>
              </button>
              <button
                onClick={() => setUrlMode('portable')}
                className={`p-3 rounded-md border-2 text-left transition-all ${
                  urlMode === 'portable'
                    ? 'border-[#253ff6] bg-[rgba(37,63,246,0.04)]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Globe size={18} className={urlMode === 'portable' ? 'text-[#253ff6]' : 'text-gray-500'} />
                  <span className="font-medium text-gray-900 text-sm">Portable Link</span>
                </div>
                <p className="text-xs text-gray-500">~{urlStats.portableUrlLength} chars • Works anywhere</p>
              </button>
            </div>
            <div className="mt-2 p-2 bg-gray-50 rounded-md flex items-start gap-2">
              <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500">
                {urlMode === 'short' ? (
                  <>Short links are stored locally in your browser. They're clean and easy to share, but only work when opened from this device.</>
                ) : (
                  <>Portable links embed all data in the URL. They work on any device but are longer ({urlStats.compressionRatio}% compressed).</>
                )}
              </p>
            </div>
            {urlMode === 'portable' && urlStats.portableUrlLength > 2000 && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
                <Warning size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  {urlStats.portableUrlLength > 8000 ? (
                    <>
                      <strong>URL very long ({urlStats.portableUrlLength.toLocaleString()} chars)</strong> — May not work in some browsers or when shared via messaging apps.
                      Consider using Short Links or reducing features/notes.
                    </>
                  ) : (
                    <>
                      <strong>URL is long ({urlStats.portableUrlLength.toLocaleString()} chars)</strong> — May be truncated when shared via some apps.
                      Short Links are recommended for easier sharing.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Stakeholder Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Reports to Generate
            </label>
            <div className="grid grid-cols-2 gap-3">
              {stakeholders.map(({ key, label, icon: Icon, description }) => (
                <button
                  key={key}
                  onClick={() => toggleStakeholder(key)}
                  className={`p-3 rounded-md border-2 text-left transition-all ${
                    selectedStakeholders.has(key)
                      ? 'border-[#253ff6] bg-[rgba(37,63,246,0.04)]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedStakeholders.has(key) ? 'bg-[#253ff6] text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon size={16} weight="bold" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{label}</p>
                      <p className="text-xs text-gray-500">{description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes (collapsed by default) */}
          <details className="mb-6">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span>Add Notes (Optional)</span>
              <span className="text-xs text-gray-400">Click to expand</span>
            </summary>
            <div className="space-y-3 mt-3">
              {stakeholders.filter(s => selectedStakeholders.has(s.key)).map(({ key, label, icon: Icon }) => (
                <div key={key} className="border border-gray-200 rounded-md overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <Icon size={14} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{label} Notes</span>
                  </div>
                  <textarea
                    value={notes[key]}
                    onChange={(e) => setNotes(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm resize-none focus:outline-none"
                    rows={2}
                    placeholder={`Add notes for ${label.toLowerCase()}...`}
                  />
                </div>
              ))}
            </div>
          </details>

          {/* Generated URLs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Generated Report Links
              </label>
              <button
                onClick={handleCopyAll}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  copiedUrl === 'all'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {copiedUrl === 'all' ? 'Copied all!' : 'Copy all links'}
              </button>
            </div>
            <div className="space-y-2">
              {stakeholders.filter(s => selectedStakeholders.has(s.key)).map(({ key, label, icon: Icon }) => {
                const url = urlMode === 'short' ? urls.short[key] : urls.portable[key];
                const isCopied = copiedUrl === key;

                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <Icon size={16} className="text-gray-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 w-24">{label}:</span>
                    <input
                      type="text"
                      value={url}
                      readOnly
                      className="flex-1 text-xs font-mono bg-white border border-gray-300 rounded px-2 py-1 text-gray-600 truncate"
                      title={url}
                    />
                    <div className="flex items-center gap-1">
                      {'share' in navigator && (
                        <button
                          onClick={() => handleShare(key)}
                          className="p-1.5 rounded text-gray-500 hover:bg-gray-200 transition-colors"
                          title="Share"
                        >
                          <ShareNetwork size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleCopyUrl(key)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          isCopied
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-[#253ff6] text-white hover:bg-[#1a2eb8]'
                        }`}
                      >
                        {isCopied ? (
                          <span className="flex items-center gap-1">
                            <Check size={14} /> Copied
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Copy size={14} /> Copy
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            {urlMode === 'short' ? (
              <span className="flex items-center gap-1">
                <Desktop size={12} /> Report ID: <code className="bg-gray-200 px-1 rounded">{urls.shortId}</code>
              </span>
            ) : (
              <span>Reports contain your current pricing data (read-only)</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
