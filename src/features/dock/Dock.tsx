import React from 'react';
import { Sun, Moon } from 'lucide-react';
import type { NavigationItem } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface DockProps {
  activeItem: NavigationItem;
  onSelectItem: (item: NavigationItem) => void;
  onOpenSettings?: () => void;
}

export const Dock: React.FC<DockProps> = ({
  activeItem,
  onSelectItem,
  onOpenSettings,
}) => {
  const { theme, toggleTheme, isSettingsOpen, setSettingsOpen } = useAppStore();

  const navButtons = (
    <>
      {/* 1. Botón de Inicio (Nota rápida) */}
      <button
        type="button"
        aria-label="Inicio"
        onClick={() => onSelectItem('home')}
        className={`w-10 h-10 rounded-dock flex items-center justify-center transition-all duration-150 ${
          activeItem === 'home'
            ? 'bg-app-active-pill text-app-text-primary shadow-2xs font-semibold'
            : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        title="Inicio - Nota rápida"
      >
        <i className="fi fi-rr-home text-[17px] leading-none" />
      </button>

      {/* 2. Botón de Notas (Explorador de carpetas y notas) */}
      <button
        type="button"
        aria-label="Notas"
        onClick={() => onSelectItem('notes')}
        className={`w-10 h-10 rounded-dock flex items-center justify-center transition-all duration-150 ${
          activeItem === 'notes'
            ? 'bg-app-active-pill text-app-text-primary shadow-2xs font-semibold'
            : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        title="Notas y carpetas"
      >
        <i className="fi fi-rr-folder text-[17px] leading-none" />
      </button>

      {/* 3. Botón de To do (Planeadas, En Progreso, Completadas) */}
      <button
        type="button"
        aria-label="To do"
        onClick={() => onSelectItem('board')}
        className={`w-10 h-10 rounded-dock flex items-center justify-center transition-all duration-150 ${
          activeItem === 'board' || activeItem === 'todo'
            ? 'bg-app-active-pill text-app-text-primary shadow-2xs font-semibold'
            : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        title="To do (Planeadas, En Progreso, Completadas)"
      >
        <i className="fi fi-rr-clipboard-list-check text-[17px] leading-none" />
      </button>

      {/* 4. Botón de Grafo de Red Neuronal */}
      <button
        type="button"
        aria-label="Red Neuronal / Grafo"
        onClick={() => onSelectItem('canvas')}
        className={`w-10 h-10 rounded-dock flex items-center justify-center transition-all duration-150 ${
          activeItem === 'canvas'
            ? 'bg-app-active-pill text-app-text-primary shadow-2xs font-semibold'
            : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        title="Ver red de conocimiento (neuronas)"
      >
        <i className="fi fi-rr-chart-network text-[17px] leading-none" />
      </button>
    </>
  );

  return (
    <>
      {/* VERSIÓN DESKTOP: Barra lateral izquierda (md:flex) */}
      <aside className="hidden md:flex w-16 h-full bg-app-sidebar border-r border-app-border-subtle flex-col items-center py-4 justify-between shrink-0 select-none relative z-30">
        {/* Spacer superior para balancear estéticamente con los ajustes inferiores */}
        <div className="w-10 h-10 shrink-0 pointer-events-none" />

        {/* Zona Central: Navegación limpia y minimalista */}
        <nav className="my-auto flex flex-col items-center gap-2.5">
          {navButtons}
        </nav>

        {/* Zona Inferior: Alternador de Modo Oscuro/Claro + Ajustes */}
        <div className="flex flex-col items-center gap-2">
          {/* Botón rápido de modo oscuro OLED / claro */}
          <button
            type="button"
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro OLED'}
            onClick={toggleTheme}
            className="w-10 h-10 rounded-dock flex items-center justify-center text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-150"
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro OLED'}
          >
            {theme === 'dark' ? (
              <Sun className="w-[18px] h-[18px] text-amber-400 stroke-[2] animate-in spin-in-180 duration-200" />
            ) : (
              <Moon className="w-[18px] h-[18px] stroke-[2] animate-in spin-in-180 duration-200" />
            )}
          </button>

          {/* Botón de configuración */}
          <button
            type="button"
            aria-label="Configuración"
            onClick={() => {
              if (onOpenSettings) {
                onOpenSettings();
              } else {
                setSettingsOpen(true);
              }
            }}
            className={`w-10 h-10 rounded-dock flex items-center justify-center transition-colors duration-150 ${
              isSettingsOpen || activeItem === 'settings'
                ? 'bg-app-active-pill text-app-text-primary shadow-2xs font-semibold'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Configuración"
          >
            <i className="fi fi-rr-settings text-[17px] leading-none" />
          </button>
        </div>
      </aside>

      {/* VERSIÓN MÓVIL: Barra de navegación inferior fija (md:hidden) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-app-sidebar/95 backdrop-blur-xl border-t border-app-border-subtle flex items-center justify-around px-2 z-40 select-none shadow-lg">
        {navButtons}

        {/* Alternador de tema en móvil */}
        <button
          type="button"
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          onClick={toggleTheme}
          className="w-10 h-10 rounded-dock flex items-center justify-center text-app-text-secondary active:scale-95 transition-all"
        >
          {theme === 'dark' ? (
            <Sun className="w-[18px] h-[18px] text-amber-400 stroke-[2]" />
          ) : (
            <Moon className="w-[18px] h-[18px] stroke-[2]" />
          )}
        </button>

        {/* Ajustes en móvil */}
        <button
          type="button"
          aria-label="Configuración"
          onClick={() => {
            if (onOpenSettings) {
              onOpenSettings();
            } else {
              setSettingsOpen(true);
            }
          }}
          className={`w-10 h-10 rounded-dock flex items-center justify-center transition-colors ${
            isSettingsOpen || activeItem === 'settings'
              ? 'bg-app-active-pill text-app-text-primary font-semibold'
              : 'text-app-text-secondary'
          }`}
        >
          <i className="fi fi-rr-settings text-[17px] leading-none" />
        </button>
      </nav>
    </>
  );
};

