import React from 'react';
import { Trash2 } from 'lucide-react';
import { Checkbox } from '../../components/ui/Checkbox';
import { PriorityBadge, TagBadge, DateBadge } from '../../components/ui/Badge';
import type { Task } from '../../types';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

/**
 * Molécula TaskItem con soporte para Composite Pattern (renderizado recursivo de subtareas).
 */
export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  return (
    <div className="flex flex-col py-0.5 group/item">
      <div className="flex items-start gap-3 group relative">
        {/* Checkbox con tokens exactos */}
        <div className="pt-0.5">
          <Checkbox
            checked={task.completed}
            onChange={() => onToggle(task.id)}
            ariaLabel={`Marcar ${task.title}`}
          />
        </div>

        {/* Contenido de la tarea */}
        <div className="flex-1 min-w-0 pr-6">
          <p
            onClick={() => onToggle(task.id)}
            className={`text-task leading-[18px] cursor-pointer transition-colors duration-150 select-text ${
              task.completed
                ? 'text-app-text-disabled line-through'
                : 'text-app-text-primary hover:text-black'
            }`}
          >
            {task.title}
          </p>

          {/* Badges de Metadatos (Prioridad, Asignado, Fecha, Etiquetas) */}
          {(task.priority || task.assignee || task.dueDate || (task.tags && task.tags.length > 0)) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {task.priority === 'high' && (
                <PriorityBadge>Prioridad Alta</PriorityBadge>
              )}
              {task.priority === 'medium' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-badge text-badge font-medium bg-amber-50 text-amber-700 tracking-tight select-none">
                  Prioridad Media
                </span>
              )}
              {task.priority === 'low' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-badge text-badge font-medium bg-slate-100 text-slate-600 tracking-tight select-none">
                  Prioridad Baja
                </span>
              )}
              {task.assignee && (
                <TagBadge label={task.assignee} />
              )}
              {task.dueDate && (
                <DateBadge date={task.dueDate} />
              )}
              {task.tags && task.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-badge text-badge font-medium bg-emerald-50 text-emerald-700 tracking-tight select-none"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Botón de eliminar en hover */}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 text-app-text-secondary hover:text-red-600 rounded hover:bg-red-50 absolute right-0 top-0"
            title="Eliminar tarea"
            aria-label="Eliminar tarea"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Composite Pattern: Subtareas anidadas */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="pl-6 ml-2 border-l border-app-border-subtle/70 mt-2.5 space-y-2.5">
          {task.subtasks.map((subtask) => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
