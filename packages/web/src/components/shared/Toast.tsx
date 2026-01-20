import { useEffect, useState, useCallback, useRef } from 'react';
import { Check, Warning, Info, X } from '@phosphor-icons/react';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const icons = {
  success: Check,
  error: Warning,
  info: Info,
};

const styles = {
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    icon: 'text-emerald-500 bg-emerald-100',
    text: 'text-emerald-800',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-500 bg-red-100',
    text: 'text-red-800',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500 bg-blue-100',
    text: 'text-blue-800',
  },
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const Icon = icons[toast.type];
  const style = styles[toast.type];
  const duration = toast.duration ?? 4000;

  const handleDismiss = useCallback(() => {
    if (isLeaving) return; // Prevent double-dismiss
    setIsLeaving(true);
    dismissTimeoutRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, 200);
  }, [onDismiss, toast.id, isLeaving]);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto-dismiss
    const autoDismissTimer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      clearTimeout(autoDismissTimer);
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [duration, handleDismiss]);

  return (
    <div
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
        transform transition-all duration-200 ease-out
        ${style.bg}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
        ${isLeaving ? 'pointer-events-none' : ''}
      `}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${style.icon}`}
        aria-hidden="true"
      >
        <Icon size={16} weight="bold" />
      </div>
      <p className={`text-sm font-medium flex-1 ${style.text}`}>
        {toast.message}
      </p>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className={`p-1 rounded hover:bg-white/50 transition-colors ${style.text}`}
      >
        <X size={14} weight="bold" aria-hidden="true" />
      </button>
    </div>
  );
}
