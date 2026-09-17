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
  deletedAt?: number;
}

export type TaskItem = Task;

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  color?: string;
  parentId?: string;
  deletedAt?: number;
}

export type NoteStatus = 'planned' | 'in_progress' | 'completed';

export interface BoardCard {
  id: string;
  title: string;
  content: string;
  status: NoteStatus;
  linkedNoteId?: string;
  dueDate?: string;
  completed?: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  folderId?: string;
  status?: NoteStatus;
  priority?: TaskPriority;
  deletedAt?: number;
}

export type NavigationItem = 'home' | 'notes' | 'board' | 'todo' | 'canvas' | 'settings';

export type Theme = 'light' | 'dark';
