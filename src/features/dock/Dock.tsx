import React from 'react';
import type { NavigationItem, Note } from '../../types';

interface DockProps {
  activeItem: NavigationItem;
  notes: Note[];
  activeNoteId: string;
  onSelectItem: (item: NavigationItem) => void;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  onOpenAddModal?: () => void;
  onDeleteNote: (noteId: string) => void;
  onCleanEmptyNotes?: () => Promise<number>;
  onOpenSearch?: () => void;
}

export const Dock: React.FC<DockProps> = ({
  activeItem,
  onSelectItem,
}) => {
  return (
    <aside className="w-16 h-full bg-app-sidebar border-r border-app-border-subtle flex flex-col items-center py-4 justify-between shrink-0 select-none relative z-30">
      {/* Spacer superior para balancear estéticamente con los ajustes inferiores y centrar los iconos */}
      <div className="w-10 h-10 shrink-0 pointer-events-none" />

      {/* Zona Central: Navegación limpia y minimalista */}
      <nav className="my-auto flex flex-col items-center gap-2.5">
        {/* 1. Botón de Editor / Inicio */}
        <button
          type="button"
          aria-label="Editor"
          onClick={() => onSelectItem('home')}
          className={`w-10 h-10 rounded-dock flex items-center justify-center transition-colors duration-150 ${
            activeItem === 'home'
              ? 'bg-app-active-pill text-app-text-primary shadow-2xs'
              : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
          }`}
          title="Editor de notas y carpetas"
        >
          <i className="fi fi-rr-home text-[17px] leading-none" />
        </button>

        {/* 2. Botón de Flujo (Planeadas, En Progreso, Completadas) */}
        <button
          type="button"
          aria-label="Flujo"
          onClick={() => onSelectItem('board')}
          className={`w-10 h-10 rounded-dock flex items-center justify-center transition-colors duration-150 ${
            activeItem === 'board'
              ? 'bg-app-active-pill text-app-text-primary shadow-2xs'
              : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
          }`}
          title="Flujo"
        >
          <i className="fi fi-rr-chart-kanban text-[17px] leading-none" />
        </button>

        {/* 3. Botón de Por hacer (Tareas) */}
        <button
          type="button"
          aria-label="Por hacer"
          onClick={() => onSelectItem('todo')}
          className={`w-10 h-10 rounded-dock flex items-center justify-center transition-colors duration-150 ${
            activeItem === 'todo'
              ? 'bg-app-active-pill text-app-text-primary shadow-2xs'
              : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
          }`}
          title="Por hacer"
        >
          <i className="fi fi-rr-clipboard-list-check text-[17px] leading-none" />
        </button>

        {/* 4. Botón de Grafo de Red Neuronal */}
        <button
          type="button"
          aria-label="Red Neuronal / Grafo"
          onClick={() => onSelectItem('canvas')}
          className={`w-10 h-10 rounded-dock flex items-center justify-center transition-colors duration-150 ${
            activeItem === 'canvas'
              ? 'bg-app-active-pill text-app-text-primary shadow-2xs'
              : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
          }`}
          title="Ver red de conocimiento (neuronas)"
        >
          <i className="fi fi-rr-chart-network text-[17px] leading-none" />
        </button>
      </nav>

      {/* Zona Inferior: Ajustes */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          aria-label="Configuración"
          onClick={() => onSelectItem('settings')}
          className={`w-10 h-10 rounded-dock flex items-center justify-center transition-colors duration-150 ${
            activeItem === 'settings'
              ? 'bg-app-active-pill text-app-text-primary shadow-2xs'
              : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
          }`}
          title="Configuración y respaldos"
        >
          <i className="fi fi-rr-settings text-[17px] leading-none" />
        </button>
      </div>
    </aside>
  );
};
