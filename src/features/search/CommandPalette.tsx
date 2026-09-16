import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, FileText, CheckSquare, X, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { extractTasksFromMarkdown, flattenTasks } from '../../utils/taskParser';
import { PriorityBadge, TagBadge } from '../../components/ui/Badge';
import type { Note, Task } from '../../types';

type SearchResult =
  | { type: 'note'; item: Note }
  | { type: 'task'; item: Task };

export const CommandPalette: React.FC = () => {
  const { isSearchOpen, setSearchOpen, notes, selectNote } = useAppStore();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'notes' | 'tasks'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    setSearchOpen(false);
  }, [setSearchOpen]);

  // Atajo global Ctrl+K o Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isSearchOpen) {
          handleClose();
        } else {
          setSearchOpen(true);
        }
      } else if (e.key === 'Escape' && isSearchOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setSearchOpen, handleClose]);

  // Enfocar input al abrir
  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  // Extraer todas las tareas de todas las notas (incluyendo subtareas jerárquicas)
  const allTasks = useMemo(() => {
    const tasks: Task[] = [];
    notes.filter((n) => !n.deletedAt).forEach((note) => {
      const noteTasks = extractTasksFromMarkdown(note.content, note.id);
      tasks.push(...flattenTasks(noteTasks));
    });
    return tasks;
  }, [notes]);

  // Filtrar notas
  const matchingNotes = useMemo(() => {
    if (activeTab === 'tasks') return [];
    const activeNotes = notes.filter((n) => !n.deletedAt);
    if (!query.trim()) return activeNotes.slice(0, 5);
    const q = query.toLowerCase();
    return activeNotes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().replace(/<[^>]+>/g, '').includes(q)
    );
  }, [notes, query, activeTab]);

  // Filtrar tareas
  const matchingTasks = useMemo(() => {
    if (activeTab === 'notes') return [];
    if (!query.trim()) return allTasks.slice(0, 5);
    const q = query.toLowerCase();
    return allTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.assignee && t.assignee.toLowerCase().includes(q))
    );
  }, [allTasks, query, activeTab]);

  // Unificar resultados para navegación por teclado
  const totalResults = useMemo<SearchResult[]>(() => {
    return [
      ...matchingNotes.map((n): SearchResult => ({ type: 'note', item: n })),
      ...matchingTasks.map((t): SearchResult => ({ type: 'task', item: t })),
    ];
  }, [matchingNotes, matchingTasks]);

  const handleSelect = (index: number) => {
    const target = totalResults[index];
    if (!target) return;

    if (target.type === 'note') {
      selectNote(target.item.id);
    } else {
      if (target.item.noteId) selectNote(target.item.noteId);
    }
    handleClose();
  };

  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(totalResults.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalResults.length) % Math.max(totalResults.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/25 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-xl liquid-glass-card rounded-3xl shadow-2xl border border-white/90 flex flex-col overflow-hidden backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownList}
      >
        {/* Barra de Entrada de Búsqueda */}
        <div className="flex items-center px-4 py-3 border-b border-app-border-subtle gap-3">
          <Search className="w-5 h-5 text-app-text-secondary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar notas, tareas o @menciones... (Ctrl+K)"
            className="flex-1 bg-transparent text-body text-app-text-primary outline-none border-none placeholder:text-app-text-secondary/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-app-text-secondary hover:text-app-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Pestañas de Filtro Rápido */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-app-border-subtle/50 bg-app-sidebar text-badge font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-2 py-1 rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-app-action-primary text-white'
                : 'text-app-text-secondary hover:text-app-text-primary'
            }`}
          >
            Todo ({totalResults.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-2 py-1 rounded-md transition-colors ${
              activeTab === 'notes'
                ? 'bg-app-action-primary text-white'
                : 'text-app-text-secondary hover:text-app-text-primary'
            }`}
          >
            Notas ({matchingNotes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`px-2 py-1 rounded-md transition-colors ${
              activeTab === 'tasks'
                ? 'bg-app-action-primary text-white'
                : 'text-app-text-secondary hover:text-app-text-primary'
            }`}
          >
            Tareas ({matchingTasks.length})
          </button>
        </div>

        {/* Lista de Resultados */}
        <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
          {totalResults.length === 0 ? (
            <div className="py-8 text-center text-task text-app-text-secondary">
              No se encontraron notas ni tareas con &quot;{query}&quot;
            </div>
          ) : (
            totalResults.map((res, index) => {
              const isSelected = index === selectedIndex;
              if (res.type === 'note') {
                const note = res.item;
                return (
                  <div
                    key={`note-${note.id}`}
                    onClick={() => handleSelect(index)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-app-active-pill text-app-text-primary'
                        : 'hover:bg-black/5 text-app-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-app-text-secondary shrink-0" />
                      <span className="text-body font-medium truncate">
                        {note.title || 'Nota sin título'}
                      </span>
                    </div>
                    {isSelected && <ArrowRight className="w-4 h-4 opacity-50 shrink-0" />}
                  </div>
                );
              } else {
                const task = res.item;
                return (
                  <div
                    key={`task-${task.id}`}
                    onClick={() => handleSelect(index)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-app-active-pill text-app-text-primary'
                        : 'hover:bg-black/5 text-app-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckSquare
                        className={`w-4 h-4 shrink-0 ${
                          task.completed ? 'text-app-text-disabled' : 'text-app-text-secondary'
                        }`}
                      />
                      <span
                        className={`text-task truncate ${
                          task.completed ? 'line-through text-app-text-disabled' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {task.priority === 'high' && <PriorityBadge>Prioridad Alta</PriorityBadge>}
                      {task.assignee && <TagBadge label={task.assignee} />}
                      {isSelected && <ArrowRight className="w-4 h-4 opacity-50 ml-1" />}
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>

        {/* Pie con Ayuda de Atajos */}
        <div className="px-4 py-2 bg-app-canvas border-t border-app-border-subtle flex items-center justify-between text-badge text-app-text-secondary">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 bg-white rounded border border-app-border-subtle font-mono text-[10px]">↑↓</kbd> Navegar</span>
            <span><kbd className="px-1 py-0.5 bg-white rounded border border-app-border-subtle font-mono text-[10px]">↵</kbd> Seleccionar</span>
            <span><kbd className="px-1 py-0.5 bg-white rounded border border-app-border-subtle font-mono text-[10px]">ESC</kbd> Cerrar</span>
          </div>
          <span className="text-[11px] font-medium">Búsqueda Rápida</span>
        </div>
      </div>
    </div>
  );
};
