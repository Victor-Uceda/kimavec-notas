import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface GraphGuideCardProps {
  onClose: () => void;
}

export const GraphGuideCard: React.FC<GraphGuideCardProps> = ({ onClose }) => {
  return (
    <div className="absolute left-6 bottom-6 z-30 w-[360px] max-w-[calc(100vw-3rem)] liquid-glass-card rounded-sheet p-5 sm:p-6 border border-white/90 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Cabecera sin líneas divisorias */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-indigo-50/90 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shadow-2xs">
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
          className="w-7 h-7 rounded-xl flex items-center justify-center text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 transition-colors"
          title="Cerrar guía"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de Sintaxis Sináptica */}
      <div className="space-y-3.5">
        <div className="flex items-start gap-3">
          <span className="shrink-0 font-mono text-badge font-semibold px-2.5 py-1 rounded-md bg-white/95 text-app-text-primary border border-black/10 shadow-2xs">
            [[Título]]
          </span>
          <p className="text-task text-app-text-secondary leading-snug">
            Escribe el título de otra nota entre corchetes dobles para crear un{' '}
            <strong className="text-app-text-primary font-medium">enlace directo</strong> (sinapsis).
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="shrink-0 font-sans text-badge font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70">
            #tema
          </span>
          <p className="text-task text-app-text-secondary leading-snug">
            Usa hashtags para agrupar múltiples notas alrededor de un{' '}
            <strong className="text-app-text-primary font-medium">núcleo temático</strong> común.
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="shrink-0 font-sans text-badge font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200/70">
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
