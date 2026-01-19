/**
 * SourceBadge component
 * Displays a badge indicating whether a feature is from codebase analysis or manually added
 */

import { Code, User } from '@phosphor-icons/react';

export type FeatureSource = 'codebase' | 'manual';

interface SourceBadgeProps {
  source: FeatureSource;
  /** Optional size variant */
  size?: 'sm' | 'md';
}

/**
 * Displays a badge showing the source of a feature
 * - Codebase: Green badge with code icon - features detected from AI analysis
 * - Manual: Violet badge with user icon - features added by the user
 */
export function SourceBadge({ source, size = 'sm' }: SourceBadgeProps) {
  const iconSize = size === 'sm' ? 12 : 14;
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  if (source === 'codebase') {
    return (
      <span className={`inline-flex items-center gap-1 ${textSize} ${padding} rounded-[0.2rem] bg-emerald-50 text-emerald-700`}>
        <Code size={iconSize} weight="bold" />
        Codebase
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${textSize} ${padding} rounded-[0.2rem] bg-violet-50 text-violet-700`}>
      <User size={iconSize} weight="bold" />
      My Feature
    </span>
  );
}
