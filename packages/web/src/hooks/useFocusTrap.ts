/**
 * useFocusTrap hook
 * Traps focus within a container (useful for modals)
 */

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Hook that traps focus within a container element
 * @param enabled - Whether the focus trap is active
 * @returns Ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(enabled: boolean = true) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    const firstElement = focusableElements[0];

    // Focus the first focusable element when trap is enabled
    if (firstElement) {
      firstElement.focus();
    } else {
      // No focusable elements - make container focusable and focus it
      if (!container.hasAttribute('tabindex')) {
        container.setAttribute('tabindex', '-1');
      }
      container.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableList = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
      const first = focusableList[0];
      const last = focusableList[focusableList.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: go to last element if on first
        if (document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
      } else {
        // Tab: go to first element if on last
        if (document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);

  return containerRef;
}
