export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskSource = 'manual' | 'automatic';

/**
 * Representa una tarea interactiva en el sistema (Composite Pattern).
 * Satisface la especificación TaskItem de docs/03-patrones-diseno.md.
 */
export interface Task {
  id: string;
  noteId?: string;
  title: string;
  completed: boolean;
  priority?: TaskPriority;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  source: TaskSource;
  createdAt: number;
  subtasks?: Task[];
}

export type TaskItem = Task;

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  color?: string;
}

export type NoteStatus = 'planned' | 'in_progress' | 'completed';

export interface BoardCard {
  id: string;
  title: string;
  content: string;
  status: NoteStatus;
  linkedNoteId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  folderId?: string;
  status?: NoteStatus;
  priority?: TaskPriority;
}

export type NavigationItem = 'home' | 'board' | 'todo' | 'canvas' | 'settings';
