import React from 'react';

interface FolderEmptyStateProps {
  folderName?: string;
  onCreateNote?: () => void;
  onQuickNote?: () => void;
}

export const FolderEmptyState: React.FC<FolderEmptyStateProps> = ({ onCreateNote }) => {
  return (
    <div className="flex-1 h-full w-full flex flex-col items-center justify-center p-8 text-center select-none bg-app-canvas/50">
      <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mb-3 text-app-text-secondary">
        <i className="fi fi-rr-document text-2xl leading-none opacity-60" />
      </div>

      <h3 className="text-sm font-medium text-app-text-primary">
        Selecciona una nota para comenzar a editarla
      </h3>
      <p className="text-xs text-app-text-secondary mt-1 max-w-xs">
        Elige una nota de tus carpetas o crea una nueva
      </p>

      {onCreateNote && (
        <button
          type="button"
          onClick={onCreateNote}
          className="mt-4 px-3.5 py-1.5 rounded-xl bg-app-action-primary text-white text-xs font-medium hover:opacity-90 transition-opacity shadow-2xs"
        >
          Crear nota
        </button>
      )}
    </div>
  );
};
