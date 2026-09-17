import React from 'react';

interface AppShellProps {
  dock: React.ReactNode;
  editor: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ dock, editor }) => {
  return (
    <div className="h-screen w-screen bg-app-canvas flex flex-col md:flex-row overflow-hidden text-app-text-primary transition-colors duration-200">
      {/* Columna 1: Dock (Desktop: izquierda 64px, Móvil: barra inferior fija) */}
      {dock}

      {/* Columna 2: Lienzo Central (Editor flotante con margen perimetral adaptativo) */}
      <main className="flex-1 p-1 sm:p-2 md:p-3 flex flex-col min-w-0 min-h-0 overflow-hidden pb-16 md:pb-3">
        {editor}
      </main>
    </div>
  );
};

