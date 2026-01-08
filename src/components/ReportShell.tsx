import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  ChartLine,
  Code,
  Megaphone,
  Copy,
  Check,
  Download,
  ArrowLeft,
} from '@phosphor-icons/react';
import { useState, useMemo } from 'react';
import type { ReportData } from '../utils/reportEncoder';

type StakeholderType = 'accountant' | 'investor' | 'engineer' | 'marketer';

interface ReportShellProps {
  reportData: ReportData;
  stakeholder: StakeholderType;
  encodedData: string;
  children: ReactNode;
}

const stakeholderConfig: Record<StakeholderType, {
  label: string;
  icon: typeof FileText;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  accountant: {
    label: 'Accountant Report',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  investor: {
    label: 'Investor Report',
    icon: ChartLine,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  engineer: {
    label: 'Engineer Report',
    icon: Code,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
  },
  marketer: {
    label: 'Marketer Report',
    icon: Megaphone,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
};

const stakeholderOrder: StakeholderType[] = ['accountant', 'investor', 'engineer', 'marketer'];

export function ReportShell({ reportData, stakeholder, encodedData, children }: ReportShellProps) {
  const [copied, setCopied] = useState(false);
  const config = stakeholderConfig[stakeholder];
  const Icon = config.icon;
  const location = useLocation();

  // Determine URL format based on current path
  const getStakeholderUrl = useMemo(() => {
    const pathname = location.pathname;
    const search = location.search;

    // Short link format: /r/{id}/{stakeholder}
    if (pathname.startsWith('/r/')) {
      return (type: StakeholderType) => `/r/${encodedData}/${type}`;
    }

    // Portable format: /report/{stakeholder}?d={compressed}
    if (search.includes('d=')) {
      return (type: StakeholderType) => `/report/${type}${search}`;
    }

    // Legacy format: /report/{data}/{stakeholder}
    return (type: StakeholderType) => `/report/${encodedData}/${type}`;
  }, [location, encodedData]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const createdDate = new Date(reportData.createdAt).toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={16} />
                <span className="text-sm">Back</span>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                  <Icon size={20} weight="duotone" className={config.color} />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{reportData.projectName}</h1>
                  <p className="text-xs text-gray-500">{config.label}</p>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  copied
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy Link
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded text-sm font-medium bg-[#253ff6] text-white hover:bg-[#1a2eb8] transition-colors flex items-center gap-1.5"
              >
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>

          {/* Report Navigation */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
            {stakeholderOrder.map((type) => {
              const typeConfig = stakeholderConfig[type];
              const TypeIcon = typeConfig.icon;
              const isActive = type === stakeholder;
              return (
                <Link
                  key={type}
                  to={getStakeholderUrl(type)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? `${typeConfig.bgColor} ${typeConfig.color}`
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <TypeIcon size={14} weight={isActive ? 'duotone' : 'regular'} />
                  {typeConfig.label.replace(' Report', '')}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Report Meta */}
        <div className={`mb-6 p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon size={24} weight="duotone" className={config.color} />
              <div>
                <h2 className="font-semibold text-gray-900">{config.label}</h2>
                <p className="text-sm text-gray-500">Generated {createdDate}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Project</p>
              <p className="font-medium text-gray-900">{reportData.projectName}</p>
            </div>
          </div>

          {/* Notes if present */}
          {reportData.notes?.[stakeholder] && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
              <p className="text-sm text-gray-600">{reportData.notes[stakeholder]}</p>
            </div>
          )}
        </div>

        {/* Report Content */}
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 print:hidden">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>Generated by Cynco Pricing Tools</p>
            <p>Read-only report - Data as of {createdDate}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
