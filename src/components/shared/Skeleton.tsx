/**
 * Skeleton Loading Components
 * Provides shimmer loading placeholders for better perceived performance
 */

import { type ReactNode } from 'react';

interface SkeletonProps {
  className?: string;
  children?: ReactNode;
}

/**
 * Base skeleton element with shimmer animation
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for text lines
 */
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for card components
 */
export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-5 ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

/**
 * Skeleton for stat cards (metrics display)
 */
export function SkeletonStat({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}
      aria-hidden="true"
    >
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-24 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

/**
 * Skeleton for table rows
 */
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-100" aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton className={`h-4 ${i === 0 ? 'w-32' : 'w-20'}`} />
        </td>
      ))}
    </tr>
  );
}

/**
 * Skeleton for feature list items
 */
export function SkeletonFeatureItem({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg ${className}`}
      aria-hidden="true"
    >
      <Skeleton className="w-5 h-5 rounded" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-1" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="w-16 h-6 rounded-full" />
    </div>
  );
}

/**
 * Skeleton for pricing cards
 */
export function SkeletonPricingCard({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-6 ${className}`}
      aria-hidden="true"
    >
      <Skeleton className="h-6 w-20 mb-2" />
      <Skeleton className="h-4 w-32 mb-6" />
      <div className="flex items-baseline gap-1 mb-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-10 w-full rounded-md mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full page loading skeleton
 */
export function SkeletonPage() {
  return (
    <div className="p-6 space-y-6" aria-label="Loading content" role="status">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonCard />
        </div>
        <div>
          <SkeletonCard />
        </div>
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">Loading, please wait...</span>
    </div>
  );
}
