import { useState } from 'react';
import { CaretDown, FileCode, FolderOpen, Warning, Check, X } from '@phosphor-icons/react';

interface AnalysisScopeInfoProps {
  defaultExpanded?: boolean;
  fileCount?: number;
  totalFiles?: number;
}

export function AnalysisScopeInfo({
  defaultExpanded = false,
  fileCount,
  totalFiles
}: AnalysisScopeInfoProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const includedItems = [
    { label: 'package.json', description: 'Dependencies and scripts' },
    { label: 'README.md', description: 'Project documentation' },
    { label: 'Config files', description: 'tsconfig, vite.config, next.config, etc.' },
    { label: 'Source files', description: 'Up to 50 files, <100KB each' },
    { label: 'API routes', description: 'Prioritized for feature detection' },
    { label: 'Entry points', description: 'index.ts, main.ts, App.tsx, etc.' },
  ];

  const excludedItems = [
    { label: 'Tests', description: '*.test.*, *.spec.*, __tests__' },
    { label: 'node_modules', description: 'Dependencies are analyzed via package.json' },
    { label: 'Type definitions', description: '*.d.ts files' },
    { label: 'Mocks', description: '__mocks__ directories' },
    { label: 'Binary files', description: 'Images, fonts, etc.' },
    { label: 'Build output', description: 'dist, build, .next directories' },
  ];

  const isLargeRepo = totalFiles && totalFiles > 500;

  return (
    <div className="border border-gray-200 bg-gray-50/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileCode size={18} weight="duotone" className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">What gets analyzed?</span>
          {fileCount && (
            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-medium rounded">
              {fileCount} files selected
            </span>
          )}
        </div>
        <CaretDown
          size={16}
          className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Large repo warning */}
          {isLargeRepo && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <Warning size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                <strong>Large repository detected ({totalFiles?.toLocaleString()} files).</strong>{' '}
                We prioritize API routes, entry points, and key feature directories to keep analysis fast and focused.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Included */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen size={14} className="text-emerald-500" />
                <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">Included</p>
              </div>
              <div className="space-y-1.5">
                {includedItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-2">
                    <Check size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">{item.label}</p>
                      <p className="text-[10px] text-gray-500">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Excluded */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen size={14} className="text-gray-400" />
                <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">Excluded</p>
              </div>
              <div className="space-y-1.5">
                {excludedItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-2">
                    <X size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-500">{item.label}</p>
                      <p className="text-[10px] text-gray-400">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Size limits note */}
          <div className="pt-3 border-t border-gray-200">
            <p className="text-[10px] text-gray-500">
              <strong>Size limits:</strong> Individual files larger than 100KB are skipped.
              Source file content is truncated at 4,000 characters for AI context efficiency.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
