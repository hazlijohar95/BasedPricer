/**
 * useEscapeKey hook
 * Handles escape key press to close modals, panels, etc.
 */

import { useEffect, useCallback } from 'react';

/**
 * Hook that calls a callback when the Escape key is pressed
 * @param onEscape - Callback function to call when Escape is pressed
 * @param enabled - Whether the hook is active (default: true)
 */
export function useEscapeKey(onEscape: () => void, enabled: boolean = true): void {
  // Don't include `enabled` in deps - we check it in useEffect instead
  // This prevents unnecessary event listener churn when enabled toggles
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape();
    }
  }, [onEscape]);

  useEffect(() => {
    // Only register listener when enabled
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}
