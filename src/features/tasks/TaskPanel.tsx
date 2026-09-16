import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, Plus, Check, Trash2, X } from 'lucide-react';
import { TaskList } from './TaskList';
import type { Task } from '../../types';
import type { TaskFilter } from '../../store/useAppStore';
import { flattenTasks } from '../../utils/taskParser';

interface TaskPanelProps {
  noteTitle: string;
  tasks: Task[];
  filter: TaskFilter;
  onChangeFilter: (filter: TaskFilter) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onClearCompleted: () => void;
  onAddTask: (title: string) => void;
  onClose?: () => void;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({
  noteTitle,
  tasks,
  filter,
  onChangeFilter,
  onToggleTask,
  onDeleteTask,
  onClearCompleted,
  onAddTask,
  onClose,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const allFlattenedTasks = useMemo(() => {
    return flattenTasks(tasks);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;

    const matchesFilter = (t: Task): boolean => {
      if (filter === 'pending') return !t.completed;
      if (filter === 'completed') return t.completed;
      if (filter === 'high-priority') return t.priority === 'high';
      return true;
    };

    const filterTree = (list: Task[]): Task[] => {
      return list
        .map((t) => {
          const filteredSubtasks = t.subtasks ? filterTree(t.subtasks) : undefined;
          const selfMatches = matchesFilter(t);
          const hasMatchingSubtasks = Boolean(filteredSubtasks && filteredSubtasks.length > 0);

          if (selfMatches || hasMatchingSubtasks) {
            return {
              ...t,
              ...(filteredSubtasks && filteredSubtasks.length > 0 ? { subtasks: filteredSubtasks } : {}),
            };
          }
          return null;
        })
        .filter((t): t is Task => t !== null);
    };

    return filterTree(tasks);
  }, [tasks, filter]);

  const pendingCount = useMemo(() => {
    return allFlattenedTasks.filter((t) => !t.completed).length;
  }, [allFlattenedTasks]);

  const completedCount = useMemo(() => {
    return allFlattenedTasks.filter((t) => t.completed).length;
  }, [allFlattenedTasks]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim());
    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <aside className="w-[360px] h-full bg-app-sidebar border-l border-app-border-subtle flex flex-col shrink-0 select-none relative">
      {/* Cabecera del Panel según 01-diseno-ux-ui.md */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-app-border-subtle/70 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-panel-title text-app-text-primary tracking-tight">
            Tareas
          </h2>
          {pendingCount > 0 && (
            <span className="text-badge px-2 py-0.5 rounded-full bg-black/5 text-app-text-secondary font-medium">
              {pendingCount}
            </span>
          )}
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-1 text-app-text-secondary">
          {/* Botón de Filtro */}
          <div className="relative">
            <button
              type="button"
              aria-label="Filtrar tareas"
              onClick={() => setShowFilterMenu((v) => !v)}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                filter !== 'all' || showFilterMenu
                  ? 'bg-app-active-pill text-app-text-primary'
                  : 'hover:bg-black/5 hover:text-app-text-primary'
              }`}
              title="Filtrar tareas"
            >
              <SlidersHorizontal className="w-4 h-4 stroke-[1.8]" />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 top-9 bg-white border border-app-border-subtle rounded-xl shadow-lg py-1.5 w-44 z-30">
                <button
                  type="button"
                  onClick={() => {
                    onChangeFilter('all');
                    setShowFilterMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-task hover:bg-black/5 text-app-text-primary"
                >
                  <span>Todas</span>
                  {filter === 'all' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeFilter('pending');
                    setShowFilterMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-task hover:bg-black/5 text-app-text-primary"
                >
                  <span>Pendientes</span>
                  {filter === 'pending' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeFilter('completed');
                    setShowFilterMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-task hover:bg-black/5 text-app-text-primary"
                >
                  <span>Completadas</span>
                  {filter === 'completed' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeFilter('high-priority');
                    setShowFilterMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-task hover:bg-black/5 text-app-text-primary"
                >
                  <span>Prioridad Alta</span>
                  {filter === 'high-priority' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Limpiar completadas si hay alguna */}
          {completedCount > 0 && (
            <button
              type="button"
              onClick={onClearCompleted}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 hover:text-red-600 transition-colors text-app-text-secondary"
              title={`Limpiar ${completedCount} completadas`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Botón Circular de Acción Primaria [+] según 01-diseno-ux-ui.md */}
          <button
            type="button"
            aria-label="Añadir tarea a la nota"
            onClick={() => setIsAdding((prev) => !prev)}
            className="w-6 h-6 rounded-action bg-app-action-primary text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all ml-1 shadow-xs"
            title="Añadir tarea a esta nota"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          {/* Botón de cerrar panel */}
          {onClose && (
            <button
              type="button"
              aria-label="Cerrar panel de tareas"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-black/5 text-app-text-secondary hover:text-app-text-primary transition-colors ml-0.5"
              title="Cerrar panel de tareas"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Formulario rápido para añadir tarea a la nota activa */}
      {isAdding && (
        <form onSubmit={handleCreate} className="px-6 pt-3 pb-2 shrink-0 border-b border-app-border-subtle/40 bg-white/40">
          <div className="relative flex items-center">
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nueva tarea... (ej: Revisar contrato @Omar)"
              className="w-full text-task pl-3 pr-8 py-1.5 rounded-lg bg-white border border-app-border-subtle outline-none focus:border-app-action-primary text-app-text-primary placeholder:text-app-text-secondary/50 shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="absolute right-2 text-app-text-secondary hover:text-app-text-primary p-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </form>
      )}

      {/* Lista Jerárquica de Tareas Contextuales */}
      <TaskList
        noteTitle={noteTitle}
        tasks={filteredTasks}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
      />
    </aside>
  );
};
