import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { extractTasksFromMarkdown, flattenTasks } from '../../utils/taskParser';
import { toggleTaskInContent, deleteTaskFromContent, addTaskToContent } from '../../utils/taskSync';
import type { Task } from '../../types';

interface TodoViewProps {
  onOpenNote: (noteId: string) => void;
}

export const TodoView: React.FC<TodoViewProps> = ({ onOpenNote }) => {
  const { notes, updateNote, createNote } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Extraer todas las tareas de todas las notas vivas (SSOT)
  const allTasksWithNote = useMemo(() => {
    const list: Array<{ task: Task; noteId: string; noteTitle: string; taskIndex: number }> = [];
    notes.forEach((note) => {
      const extracted = extractTasksFromMarkdown(note.content, note.id);
      const flat = flattenTasks(extracted);
      flat.forEach((task, index) => {
        list.push({
          task,
          noteId: note.id,
          noteTitle: note.title.trim() || 'Nota sin título',
          taskIndex: index,
        });
      });
    });
    return list;
  }, [notes]);

  // Filtrado de tareas
  const filteredList = useMemo(() => {
    return allTasksWithNote.filter(({ task }) => {
      if (filter === 'pending' && task.completed) return false;
      if (filter === 'completed' && !task.completed) return false;
      return true;
    });
  }, [allTasksWithNote, filter]);

  const pendingCount = useMemo(() => {
    return allTasksWithNote.filter(({ task }) => !task.completed).length;
  }, [allTasksWithNote]);

  const completedCount = useMemo(() => {
    return allTasksWithNote.filter(({ task }) => task.completed).length;
  }, [allTasksWithNote]);

  // Alternar tarea en el contenido de su nota correspondiente
  const handleToggle = (noteId: string, taskTitle: string, currentCompleted: boolean, taskIndex: number) => {
    const targetNote = notes.find((n) => n.id === noteId);
    if (!targetNote) return;
    const updated = toggleTaskInContent(targetNote.content, taskTitle, currentCompleted, taskIndex);
    updateNote(targetNote.id, targetNote.title, updated);
  };

  // Eliminar tarea del contenido de su nota
  const handleDelete = (noteId: string, taskTitle: string, taskIndex: number) => {
    const targetNote = notes.find((n) => n.id === noteId);
    if (!targetNote) return;
    const updated = deleteTaskFromContent(targetNote.content, taskTitle, taskIndex);
    updateNote(targetNote.id, targetNote.title, updated);
  };

  // Crear nueva tarea en la nota actual o en una nota de tareas
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    // Buscar una nota para agregar la tarea o crear una nota "Tareas"
    let targetNote = notes.find((n) => n.title.toLowerCase().includes('tarea') || n.title.toLowerCase().includes('todo'));
    if (!targetNote && notes.length > 0) {
      targetNote = notes[0];
    }

    if (!targetNote) {
      const newId = await createNote(undefined, 'planned');
      updateNote(newId, 'Mis Tareas', `<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>${newTaskTitle.trim()}</p></div></li></ul>`);
    } else {
      const updated = addTaskToContent(targetNote.content, newTaskTitle.trim());
      updateNote(targetNote.id, targetNote.title, updated);
    }

    setNewTaskTitle('');
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
            Todas ({allTasksWithNote.length})
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

      {/* Formulario para añadir nueva tarea */}
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
            filteredList.map(({ task, noteId, noteTitle, taskIndex }) => (
              <div
                key={`${noteId}-${task.id}-${taskIndex}`}
                className="group flex items-center justify-between p-3.5 rounded-xl bg-white border border-black/[0.06] hover:border-black/15 hover:shadow-2xs transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Checkbox interactivo estilo Design System */}
                  <button
                    type="button"
                    onClick={() => handleToggle(noteId, task.title, task.completed, taskIndex)}
                    className={`w-5 h-5 rounded-checkbox flex items-center justify-center border transition-colors shrink-0 ${
                      task.completed
                        ? 'bg-app-action-primary border-app-action-primary text-white'
                        : 'border-app-border-subtle hover:border-black/40 bg-white'
                    }`}
                  >
                    {task.completed && <i className="fi fi-rr-check text-[11px] leading-none" />}
                  </button>

                  {/* Texto de la tarea */}
                  <span
                    className={`text-body text-app-text-primary leading-normal break-words ${
                      task.completed ? 'line-through text-app-text-disabled' : ''
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {/* Referencia a la nota de origen */}
                  <button
                    type="button"
                    onClick={() => onOpenNote(noteId)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-app-text-secondary hover:text-app-text-primary transition-colors max-w-[160px] truncate"
                    title={`Abrir nota "${noteTitle}"`}
                  >
                    {noteTitle}
                  </button>

                  {/* Botón eliminar tarea */}
                  <button
                    type="button"
                    onClick={() => handleDelete(noteId, task.title, taskIndex)}
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
