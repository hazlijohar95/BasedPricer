/**
 * QuickStartChecklist component
 * Guides new users through the pricing workflow
 */

import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Rocket, X, CaretRight } from '@phosphor-icons/react';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  action: () => void;
}

interface QuickStartChecklistProps {
  items: ChecklistItem[];
  onDismiss: () => void;
  dismissedKey?: string;
}

export function QuickStartChecklist({ items, onDismiss, dismissedKey = 'quickstart-dismissed' }: QuickStartChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(dismissedKey);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, [dismissedKey]);

  const completedCount = items.filter(item => item.isComplete).length;
  const allComplete = completedCount === items.length;
  const progress = (completedCount / items.length) * 100;

  const handleDismiss = () => {
    localStorage.setItem(dismissedKey, 'true');
    setIsDismissed(true);
    onDismiss();
  };

  // Don't show if dismissed or all complete
  if (isDismissed) return null;

  // Show completion state briefly before auto-dismissing
  if (allComplete) {
    return (
      <div className="card p-4 sm:p-5 bg-gradient-to-r from-emerald-50 to-emerald-50/50 border-emerald-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={24} weight="fill" className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-emerald-900">All set!</p>
            <p className="text-sm text-emerald-700">You've completed the setup. Your pricing strategy is ready.</p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 sm:p-5 bg-gradient-to-r from-blue-50/80 to-violet-50/50 border-blue-200/60">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#253ff6] flex items-center justify-center flex-shrink-0">
            <Rocket size={18} weight="fill" className="text-white sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Getting Started</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {completedCount} of {items.length} steps complete
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-white/50 rounded-lg transition-colors text-gray-400 hover:text-gray-600 sm:hidden"
          >
            <CaretRight size={16} className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-white/50 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden mb-3 sm:mb-4">
        <div
          className="h-full bg-[#253ff6] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist */}
      {!isCollapsed && (
        <div className="space-y-1.5 sm:space-y-2">
          {items.map((item, index) => {
            const isNext = !item.isComplete && items.slice(0, index).every(i => i.isComplete);
            return (
              <button
                key={item.id}
                onClick={item.action}
                disabled={item.isComplete}
                className={`w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-lg text-left transition-all touch-manipulation ${
                  item.isComplete
                    ? 'bg-white/40 cursor-default'
                    : isNext
                    ? 'bg-white hover:bg-white/90 active:bg-white/80 shadow-sm border border-[#253ff6]/20'
                    : 'bg-white/30 hover:bg-white/50 active:bg-white/40'
                }`}
              >
                <div className="flex-shrink-0">
                  {item.isComplete ? (
                    <CheckCircle size={20} weight="fill" className="text-emerald-500 sm:w-6 sm:h-6" />
                  ) : isNext ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-[#253ff6] flex items-center justify-center">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#253ff6]" />
                    </div>
                  ) : (
                    <Circle size={20} weight="regular" className="text-gray-300 sm:w-6 sm:h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.isComplete ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {item.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${item.isComplete ? 'text-gray-300' : 'text-gray-500'} hidden sm:block`}>
                    {item.description}
                  </p>
                </div>
                {!item.isComplete && (
                  <CaretRight size={16} className={`flex-shrink-0 ${isNext ? 'text-[#253ff6]' : 'text-gray-300'}`} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
