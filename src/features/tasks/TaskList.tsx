import React from 'react';
import { CheckSquare } from 'lucide-react';
import { TaskItem } from './TaskItem';
import type { Task } from '../../types';

interface TaskListProps {
  noteTitle: string;
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  noteTitle,
  tasks,
  onToggleTask,
  onDeleteTask,
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {/* Grupo jerárquico asociado a la nota según 01-diseno-ux-ui.md */}
      <div className="mb-6">
        <h3 className="text-body font-semibold text-app-text-primary mb-4 truncate" title={noteTitle}>
          {noteTitle || 'Nota sin título'}
        </h3>

        {/* Lista de subtareas extraídas con 16px de espaciado (space-y-4) */}
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 px-2 text-app-text-secondary select-none">
            <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center mb-3">
              <CheckSquare className="w-5 h-5 opacity-60 stroke-[1.5]" />
            </div>
            <p className="text-body font-medium text-app-text-primary mb-1">
              Sin tareas en esta nota
            </p>
            <p className="text-task text-app-text-secondary max-w-[240px] leading-relaxed">
              Las tareas que escribas en el editor con <span className="font-mono text-badge bg-black/5 px-1 py-0.5 rounded">- [ ]</span> o menciones como <span className="text-badge bg-app-badge-tagBg text-app-badge-tagText px-1 py-0.5 rounded font-medium">@Omar</span> se sincronizarán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pl-0.5">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
