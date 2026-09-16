import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, FolderOpen, Search, X, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const OpenOrCreateModal: React.FC = () => {
  const {
    isAddModalOpen,
    setAddModalOpen,
    notes,
    openNoteIds,
    createNote,
    openExistingNoteInTab,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddModalOpen) {
      const timer = setTimeout(() => {
        setSearchQuery('');
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isAddModalOpen]);

  // Manejador tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAddModalOpen) {
        setAddModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen, setAddModalOpen]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  if (!isAddModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-xl liquid-glass-card border border-white/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del diálogo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.08] bg-white/50">
          <div>
            <h2 className="text-base font-bold text-app-text-primary tracking-tight">
              Añadir pestaña
            </h2>
            <p className="text-xs text-app-text-secondary mt-0.5">
              ¿Deseas crear una nota en blanco o abrir un texto existente?
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={() => setAddModalOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido interactivo */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          {/* Opción 1: Crear nota nueva en blanco */}
          <div>
            <span className="text-[11px] font-semibold text-app-text-secondary uppercase tracking-wider block mb-2">
              Opción 1: Crear nueva
            </span>
            <button
              type="button"
              onClick={() => createNote()}
              className="w-full group p-4 rounded-xl border border-black/[0.08] bg-white/80 hover:bg-white hover:border-black/20 hover:shadow-md transition-all flex items-center gap-4 text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-app-text-primary flex items-center gap-2">
                  <span>Crear nueva nota en blanco</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                    Nueva
                  </span>
                </div>
                <p className="text-xs text-app-text-secondary mt-0.5">
                  Comienza a escribir una nota limpia desde cero en una nueva pestaña.
                </p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-black/[0.06]" />
            <span className="text-xs font-medium text-app-text-secondary/70">O</span>
            <div className="flex-1 h-[1px] bg-black/[0.06]" />
          </div>

          {/* Opción 2: Abrir un texto existente */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-app-text-secondary uppercase tracking-wider">
                Opción 2: Abrir texto existente
              </span>
              <span className="text-xs text-app-text-secondary">
                {notes.length} {notes.length === 1 ? 'nota guardada' : 'notas guardadas'}
              </span>
            </div>

            {/* Buscador de notas existentes */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-app-text-secondary/70" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar nota existente por título o contenido..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white/70 border border-black/[0.08] focus:border-black/30 focus:bg-white outline-none transition-all placeholder:text-app-text-secondary/50"
              />
            </div>

            {/* Lista con scroll de notas existentes */}
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {filteredNotes.length === 0 ? (
                <div className="py-6 text-center text-xs text-app-text-secondary">
                  No se encontraron notas con "{searchQuery}".
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isOpen = openNoteIds.includes(note.id);
                  const cleanPreview = note.content.replace(/<[^>]+>/g, '').trim();

                  return (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => openExistingNoteInTab(note.id)}
                      className="w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 hover:bg-black/5 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                          <FolderOpen className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-app-text-primary truncate">
                            {note.title.trim() || 'Nota sin título'}
                          </div>
                          {cleanPreview && (
                            <div className="text-[11px] text-app-text-secondary truncate max-w-sm">
                              {cleanPreview}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isOpen ? (
                          <span className="text-[10px] flex items-center gap-1 font-medium text-app-text-secondary px-2 py-0.5 rounded-full bg-black/5">
                            <Check className="w-2.5 h-2.5" />
                            Abierta
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-app-accent group-hover:underline">
                            Abrir
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
