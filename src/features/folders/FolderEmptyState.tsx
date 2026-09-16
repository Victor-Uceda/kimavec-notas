import React from 'react';

interface FolderEmptyStateProps {
  folderName?: string;
  onCreateNote?: () => void;
  onQuickNote?: () => void;
}

export const FolderEmptyState: React.FC<FolderEmptyStateProps> = () => {
  return (
    <div className="flex-1 h-full w-full flex flex-col items-center justify-center p-8 text-center select-none bg-app-canvas/50">
      {/* Círculo suave con icono de carpeta en armonía con el Design System */}
      <div className="w-20 h-20 rounded-full bg-blue-50/90 border border-blue-200/60 flex items-center justify-center mb-4 shadow-2xs ring-8 ring-blue-50/40">
        <i className="fi fi-sr-folder text-3xl text-blue-600 leading-none" />
      </div>

      {/* Texto acorde al Design System */}
      <h3 className="text-lg sm:text-xl font-medium text-app-text-primary tracking-tight max-w-md">
        Selecciona una nota para comenzar a editarla
      </h3>
      <p className="text-xs text-app-text-secondary mt-1.5 max-w-xs">
        Elige una nota de tus carpetas o crea una nueva para empezar
      </p>
    </div>
  );
};
