import React from 'react';

interface FolderEmptyStateProps {
  folderName?: string;
  onCreateNote?: () => void;
  onQuickNote?: () => void;
}

export const FolderEmptyState: React.FC<FolderEmptyStateProps> = ({ onCreateNote }) => {
  return (
    <div className="flex-1 h-full w-full flex flex-col items-center justify-center p-8 text-center select-none bg-app-canvas">
      <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center mb-3 text-app-text-secondary">
        <i className="fi fi-rr-document text-2xl leading-none opacity-70" />
      </div>

      <h3 className="text-sm font-semibold text-app-text-primary">
        Selecciona una nota para comenzar a editarla
      </h3>
      <p className="text-xs text-app-text-secondary mt-1 max-w-xs">
        Elige una nota de tus carpetas o crea una nueva
      </p>

      {onCreateNote && (
        <button
          type="button"
          onClick={onCreateNote}
          className="mt-4 px-4 py-2 rounded-xl bg-app-action-primary text-app-action-primary-text text-xs font-semibold hover:opacity-90 transition-opacity shadow-2xs"
        >
          Crear nota
        </button>
      )}
    </div>
  );
};
