import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

export const ConfirmDialog: React.FC = () => {
  const { confirmModal, closeConfirm } = useAppStore();

  useEffect(() => {
    if (!confirmModal?.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (confirmModal.onCancel) confirmModal.onCancel();
        closeConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmModal, closeConfirm]);

  if (!confirmModal || !confirmModal.isOpen) return null;

  const {
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDestructive = true,
    onConfirm,
    onCancel,
  } = confirmModal;

  const handleConfirm = () => {
    onConfirm();
    closeConfirm();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeConfirm();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm bg-app-editor border border-app-border-subtle rounded-2xl shadow-2xl p-5 space-y-3.5 animate-in zoom-in-95 duration-150 text-app-text-primary">
        <h3 id="confirm-dialog-title" className="text-sm font-bold text-app-text-primary tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-app-text-secondary leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-border-subtle/40">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            autoFocus
            onClick={handleConfirm}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shadow-sm ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                : 'bg-app-action-primary text-app-action-primary-text hover:opacity-90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
