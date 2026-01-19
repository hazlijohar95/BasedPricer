/**
 * useUndoRedo hook
 * Provides keyboard shortcuts for undo/redo functionality
 * - Cmd/Ctrl+Z for undo
 * - Cmd/Ctrl+Shift+Z for redo
 */

import { useEffect } from 'react';

interface UseUndoRedoOptions {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  enabled?: boolean;
}

export function useUndoRedo({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  enabled = true,
}: UseUndoRedoOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isMeta = event.metaKey || event.ctrlKey;

      if (!isMeta || event.key.toLowerCase() !== 'z') return;

      // Don't trigger if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (event.shiftKey) {
        // Redo: Cmd/Ctrl+Shift+Z
        if (canRedo) {
          event.preventDefault();
          onRedo();
        }
      } else {
        // Undo: Cmd/Ctrl+Z
        if (canUndo) {
          event.preventDefault();
          onUndo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, canUndo, canRedo, enabled]);
}
