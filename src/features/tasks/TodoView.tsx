import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { extractTasksFromMarkdown, flattenTasks } from '../../utils/taskParser';
import { toggleTaskInContent, deleteTaskFromContent } from '../../utils/taskSync';

interface TodoViewProps {
  onOpenNote: (noteId: string) => void;
}

interface UnifiedTaskItem {
  id: string;
  title: string;
  completed: boolean;
  isStandalone: boolean;
  noteId?: string;
  noteTitle?: string;
  taskIndex?: number;
  createdAt: number;
}

export const TodoView: React.FC<TodoViewProps> = ({ onOpenNote }) => {
  const {
    notes,
    standaloneTasks,
    updateNote,
    createStandaloneTask,
    toggleStandaloneTask,
    deleteStandaloneTask,
  } = useAppStore();

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Unificar tareas independientes y tareas extraídas de notas vivas
  const allTasks = useMemo(() => {
    const list: UnifiedTaskItem[] = [];

    // 1. Tareas independientes (creadas directamente en "Por hacer" - NO tocan notas)
    (standaloneTasks || [])
      .filter((t) => !t.deletedAt)
      .forEach((t) => {
        list.push({
          id: t.id,
          title: t.title,
          completed: t.completed,
          isStandalone: true,
          createdAt: t.createdAt,
        });
      });

    // 2. Tareas extraídas de notas vivas
    (notes || [])
      .filter((n) => !n.deletedAt)
      .forEach((note) => {
        const extracted = extractTasksFromMarkdown(note.content, note.id);
        const flat = flattenTasks(extracted);
        flat.forEach((task, index) => {
          list.push({
            id: `${note.id}-${task.id}-${index}`,
            title: task.title,
            completed: task.completed,
            isStandalone: false,
            noteId: note.id,
            noteTitle: note.title.trim() || 'Nota sin título',
            taskIndex: index,
            createdAt: task.createdAt || note.updatedAt,
          });
        });
      });

    return list;
  }, [standaloneTasks, notes]);

  // Filtrado de tareas
  const filteredList = useMemo(() => {
    return allTasks.filter((item) => {
      if (filter === 'pending' && item.completed) return false;
      if (filter === 'completed' && !item.completed) return false;
      return true;
    });
  }, [allTasks, filter]);

  const pendingCount = useMemo(() => {
    return allTasks.filter((t) => !t.completed).length;
  }, [allTasks]);

  const completedCount = useMemo(() => {
    return allTasks.filter((t) => t.completed).length;
  }, [allTasks]);

  // Alternar completado
  const handleToggle = (item: UnifiedTaskItem) => {
    if (item.isStandalone) {
      toggleStandaloneTask(item.id);
    } else if (item.noteId && item.taskIndex !== undefined) {
      const targetNote = notes.find((n) => n.id === item.noteId);
      if (!targetNote) return;
      const updated = toggleTaskInContent(targetNote.content, item.title, item.completed, item.taskIndex);
      updateNote(targetNote.id, targetNote.title, updated);
    }
  };

  // Eliminar tarea
  const handleDelete = (item: UnifiedTaskItem) => {
    if (item.isStandalone) {
      deleteStandaloneTask(item.id);
    } else if (item.noteId && item.taskIndex !== undefined) {
      const targetNote = notes.find((n) => n.id === item.noteId);
      if (!targetNote) return;
      const updated = deleteTaskFromContent(targetNote.content, item.title, item.taskIndex);
      updateNote(targetNote.id, targetNote.title, updated);
    }
  };

  // Crear nueva tarea independiente (DESACOPLADA: no se añade a la Nota 3 ni a ninguna nota)
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await createStandaloneTask(newTaskTitle.trim());
      setNewTaskTitle('');
    } catch (err) {
      console.error('Error creando tarea independiente:', err);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-white rounded-sheet shadow-sheet border border-app-border-subtle overflow-hidden select-none">
      {/* Cabecera minimalista: solo título Por hacer y filtros */}
      <header className="px-8 py-5 border-b border-app-border-subtle flex items-center justify-between gap-4 bg-white">
        <h1 className="text-panel-title font-bold text-app-text-primary tracking-tight text-xl">
          Por hacer
        </h1>

        {/* Filtros de estado */}
        <div className="flex items-center bg-black/5 rounded-xl p-1 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-white text-app-text-primary shadow-2xs'
                : 'text-app-text-secondary hover:text-app-text-primary'
            }`}
          >
            Todas ({allTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-white text-app-text-primary shadow-2xs'
                : 'text-app-text-secondary hover:text-app-text-primary'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-white text-app-text-primary shadow-2xs'
                : 'text-app-text-secondary hover:text-app-text-primary'
            }`}
          >
            Completadas ({completedCount})
          </button>
        </div>
      </header>

      {/* Formulario para añadir nueva tarea independiente */}
      <div className="px-8 py-4 border-b border-app-border-subtle/60 bg-[#FAFAFC]">
        <form onSubmit={handleAddTask} className="flex items-center gap-2 max-w-2xl">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="+ Escribir una nueva tarea y presionar Enter..."
            className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white border border-app-border-subtle text-app-text-primary placeholder:text-app-text-secondary/60 focus:outline-none focus:border-black/30 shadow-2xs"
          />
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-app-action-primary text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:pointer-events-none shadow-sm shrink-0"
          >
            <i className="fi fi-rr-plus text-xs leading-none" />
            <span>Añadir tarea</span>
          </button>
        </form>
      </div>

      {/* Lista de Tareas */}
      <div className="flex-1 overflow-y-auto px-8 py-5">
        <div className="max-w-3xl space-y-2">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center text-app-text-secondary/60 text-xs">
              No hay tareas en esta vista.
            </div>
          ) : (
            filteredList.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between p-3.5 rounded-xl bg-white border border-black/[0.06] hover:border-black/15 hover:shadow-2xs transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Checkbox interactivo */}
                  <button
                    type="button"
                    onClick={() => handleToggle(item)}
                    className={`w-5 h-5 rounded-checkbox flex items-center justify-center border transition-colors shrink-0 ${
                      item.completed
                        ? 'bg-app-action-primary border-app-action-primary text-white'
                        : 'border-app-border-subtle hover:border-black/40 bg-white'
                    }`}
                  >
                    {item.completed && <i className="fi fi-rr-check text-[11px] leading-none" />}
                  </button>

                  {/* Texto de la tarea */}
                  <span
                    className={`text-body text-app-text-primary leading-normal break-words ${
                      item.completed ? 'line-through text-app-text-disabled' : ''
                    }`}
                  >
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {/* Si proviene de una nota, muestra enlace a la nota */}
                  {!item.isStandalone && item.noteId && (
                    <button
                      type="button"
                      onClick={() => onOpenNote(item.noteId!)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-app-text-secondary hover:text-app-text-primary transition-colors max-w-[160px] truncate"
                      title={`Abrir nota "${item.noteTitle}"`}
                    >
                      {item.noteTitle}
                    </button>
                  )}

                  {/* Botón eliminar tarea */}
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-app-text-secondary hover:text-red-600 hover:bg-red-50 transition-opacity flex items-center justify-center"
                    title="Eliminar tarea"
                  >
                    <i className="fi fi-rr-trash text-xs leading-none" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
