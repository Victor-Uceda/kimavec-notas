import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface GraphGuideCardProps {
  onClose: () => void;
}

export const GraphGuideCard: React.FC<GraphGuideCardProps> = ({ onClose }) => {
  return (
    <div className="absolute left-6 bottom-6 z-30 w-[360px] max-w-[calc(100vw-3rem)] liquid-glass-card rounded-sheet p-5 sm:p-6 border border-app-border-subtle shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
      {/* Cabecera sin líneas divisorias */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-body font-bold text-app-text-primary leading-tight">
              Cómo Formar Neuronas
            </h4>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-xl flex items-center justify-center text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title="Cerrar guía"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de Sintaxis Sináptica */}
      <div className="space-y-3.5">
        <div className="flex items-start gap-3">
          <span className="shrink-0 font-mono text-badge font-semibold px-2.5 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 shadow-2xs">
            [[Título]]
          </span>
          <p className="text-task text-app-text-secondary leading-snug">
            Escribe el título de otra nota entre corchetes dobles para crear un{' '}
            <strong className="text-app-text-primary font-medium">enlace directo</strong> (sinapsis).
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="shrink-0 font-sans text-badge font-semibold px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/70">
            #tema
          </span>
          <p className="text-task text-app-text-secondary leading-snug">
            Usa hashtags para agrupar múltiples notas alrededor de un{' '}
            <strong className="text-app-text-primary font-medium">núcleo temático</strong> común.
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="shrink-0 font-sans text-badge font-semibold px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800/70">
            @persona
          </span>
          <p className="text-task text-app-text-secondary leading-snug">
            Menciona colaboradores para vincularlos con notas de proyectos y tareas.
          </p>
        </div>
      </div>
    </div>
  );
};
