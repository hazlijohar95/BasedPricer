/**
 * ConfirmationModal component
 * Reusable modal for confirmation dialogs (replacing native confirm())
 */

import { Trash, Warning, X } from '@phosphor-icons/react';
import { useEscapeKey, useFocusTrap } from '../../hooks';

type ConfirmationType = 'danger' | 'warning' | 'info';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: ConfirmationType;
}

const typeConfig: Record<ConfirmationType, {
  icon: typeof Trash;
  iconBg: string;
  iconColor: string;
  confirmBg: string;
  confirmHover: string;
}> = {
  danger: {
    icon: Trash,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    confirmBg: 'bg-red-500',
    confirmHover: 'hover:bg-red-600',
  },
  warning: {
    icon: Warning,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    confirmBg: 'bg-amber-500',
    confirmHover: 'hover:bg-amber-600',
  },
  info: {
    icon: Warning,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    confirmBg: 'bg-blue-500',
    confirmHover: 'hover:bg-blue-600',
  },
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'danger',
}: ConfirmationModalProps) {
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
  useEscapeKey(onClose, isOpen);

  const config = typeConfig[type];
  const Icon = config.icon;

  // Handle confirm and close
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal */}
      <div
        ref={modalRef}
        role="alertdialog"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="relative bg-white rounded-xl shadow-2xl p-5 sm:p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>

        {/* Icon and content */}
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} weight="duotone" className={config.iconColor} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 id="confirm-modal-title" className="font-semibold text-gray-900 text-sm sm:text-base">
              {title}
            </h3>
            <p id="confirm-modal-description" className="text-sm text-gray-500 mt-1">
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5 sm:mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors touch-manipulation"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            autoFocus
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white ${config.confirmBg} ${config.confirmHover} active:opacity-90 rounded-lg transition-colors touch-manipulation`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
