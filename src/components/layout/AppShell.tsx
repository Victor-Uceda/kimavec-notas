import React from 'react';

interface AppShellProps {
  dock: React.ReactNode;
  editor: React.ReactNode;
  tasks?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ dock, editor, tasks }) => {
  return (
    <div className="h-screen w-screen bg-app-canvas flex overflow-hidden text-app-text-primary">
      {/* Columna 1: Dock Izquierdo (64px) */}
      {dock}

      {/* Columna 2: Lienzo Central (Editor flotante con margen perimetral de 12px) */}
      <main className="flex-1 p-3 flex flex-col min-w-0">
        {editor}
      </main>

      {/* Columna 3: Panel de Tareas Derecho bajo demanda (360px) */}
      {tasks}
    </div>
  );
};
