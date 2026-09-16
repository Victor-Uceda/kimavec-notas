import React from 'react';
import { Network, FileText } from 'lucide-react';
import type { Note } from '../../types';

interface WikilinkAutocompleteProps {
  query: string;
  notes: Note[];
  selectedIndex: number;
  coords: { top: number; left: number };
  onSelect: (note: Note) => void;
  onHoverIndex: (index: number) => void;
}

export const WikilinkAutocomplete: React.FC<WikilinkAutocompleteProps> = ({
  query,
  notes,
  selectedIndex,
  coords,
  onSelect,
  onHoverIndex,
}) => {
  const topPos = Math.min(coords.top, window.innerHeight - 280);
  const leftPos = Math.min(Math.max(16, coords.left), window.innerWidth - 300);

  return (
    <div
      style={{ top: topPos, left: leftPos }}
      className="fixed z-50 w-72 liquid-glass-card rounded-2xl border border-white/90 shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-2xl"
    >
      <div className="px-2.5 py-1 text-badge text-app-text-secondary font-medium flex items-center justify-between border-b border-black/[0.04] mb-1">
        <span className="flex items-center gap-1.5">
          <Network className="w-3 h-3 text-indigo-500" />
          <span>Conectar nota (sinapsis)</span>
        </span>
        <span className="text-[10px] text-app-text-secondary/70">↵ Enter</span>
      </div>

      <div className="max-h-56 overflow-y-auto space-y-0.5">
        {notes.map((n, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={n.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(n);
              }}
              onMouseEnter={() => onHoverIndex(idx)}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-colors ${
                isSelected
                  ? 'bg-black/8 text-app-text-primary font-medium'
                  : 'text-app-text-secondary hover:bg-black/5 hover:text-app-text-primary'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="text-task truncate">{n.title.trim() || 'Nota sin título'}</span>
              </div>
              {isSelected && (
                <span className="text-[10px] text-app-text-secondary/80 shrink-0 font-mono">
                  [[...]]
                </span>
              )}
            </button>
          );
        })}

        {notes.length === 0 && (
          <div className="px-3 py-2 text-task text-app-text-secondary italic text-center">
            No hay notas con "{query}"
          </div>
        )}
      </div>
    </div>
  );
};
