/**
 * TabToggle component
 * A reusable toggle/tab selector for switching between views or modes
 */

import { type ReactNode } from 'react';

export interface TabOption<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
}

interface TabToggleProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'pills' | 'buttons';
  fullWidth?: boolean;
}

export function TabToggle<T extends string>({
  options,
  value,
  onChange,
  variant = 'pills',
  fullWidth = false,
}: TabToggleProps<T>) {
  if (variant === 'buttons') {
    return (
      <div className="flex border border-[#e4e4e4] rounded-[0.2rem] overflow-hidden">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`px-3 py-2 transition-all duration-200 ${
              value === option.id
                ? 'bg-[rgba(37,63,246,0.08)] text-[#253ff6]'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {option.icon || option.label}
          </button>
        ))}
      </div>
    );
  }

  // Default: pills variant
  return (
    <div className={`card p-1.5 flex gap-1 ${fullWidth ? 'w-full' : ''}`}>
      {options.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`tab-pill ${fullWidth ? 'flex-1' : ''} ${value === tab.id ? 'active' : ''}`}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
