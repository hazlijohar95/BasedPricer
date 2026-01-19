/**
 * Focused hook for toast notifications
 * Provides a subset of PricingContext for components that only need toast functionality
 */

import { usePricing } from '../context/PricingContext';
import type { ToastData } from '../components/shared/Toast';

export interface UseToastReturn {
  // State
  toasts: ToastData[];

  // Actions
  showToast: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
  dismissToast: (id: string) => void;

  // Convenience methods
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

/**
 * Hook for toast notifications
 * Provides a focused API for showing notifications
 */
export function useToast(): UseToastReturn {
  const { toasts, showToast, dismissToast } = usePricing();

  return {
    toasts,
    showToast,
    dismissToast,
    // Convenience methods
    success: (message: string, duration?: number) => showToast('success', message, duration),
    error: (message: string, duration?: number) => showToast('error', message, duration),
    info: (message: string, duration?: number) => showToast('info', message, duration),
  };
}
