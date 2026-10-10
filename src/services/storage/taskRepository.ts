import type { Task } from '../../types';

export interface TaskRepository {
  getAll(): Promise<Task[]>;
  save(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
}

const TASKS_STORAGE_KEY = 'notas_app_standalone_tasks_v1';

export const DEFAULT_STANDALONE_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Revisar diseño minimalista de la interfaz',
    completed: false,
    source: 'manual',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'task-2',
    title: 'Organizar documentos y notas en carpetas',
    completed: true,
    source: 'manual',
    createdAt: Date.now() - 7200000,
  },
];

export class LocalStorageTaskRepository implements TaskRepository {
  async getAll(): Promise<Task[]> {
    try {
      const data = localStorage.getItem(TASKS_STORAGE_KEY);
      if (!data) {
        if (!localStorage.getItem('notas_app_seeded_v1')) {
          localStorage.setItem('notas_app_seeded_v1', 'true');
          localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(DEFAULT_STANDALONE_TASKS));
          return DEFAULT_STANDALONE_TASKS;
        }
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async save(task: Task): Promise<void> {
    const tasks = await this.getAll();
    const index = tasks.findIndex((t) => t.id === task.id);
    let updated: Task[];
    if (index >= 0) {
      updated = [...tasks];
      updated[index] = task;
    } else {
      updated = [{ ...task }, ...tasks];
    }
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updated));
  }

  async delete(id: string): Promise<void> {
    const tasks = await this.getAll();
    const filtered = tasks.filter((t) => t.id !== id);
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(filtered));
  }
}

const fallbackTaskRepo = new LocalStorageTaskRepository();

export class TauriTaskRepository implements TaskRepository {
  private isTauriAvailable(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  async getAll(): Promise<Task[]> {
    if (this.isTauriAvailable()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<Task[]>('get_tasks');
      } catch (err) {
        console.warn('Tauri get_tasks falló, usando LocalStorage fallback:', err);
      }
    }
    return fallbackTaskRepo.getAll();
  }

  async save(task: Task): Promise<void> {
    if (this.isTauriAvailable()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('save_task', { task });
        return;
      } catch (err) {
        console.warn('Tauri save_task falló, usando LocalStorage fallback:', err);
      }
    }
    await fallbackTaskRepo.save(task);
  }

  async delete(id: string): Promise<void> {
    if (this.isTauriAvailable()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('delete_task', { id });
        return;
      } catch (err) {
        console.warn('Tauri delete_task falló, usando LocalStorage fallback:', err);
      }
    }
    await fallbackTaskRepo.delete(id);
  }
}

export const taskRepository: TaskRepository = new TauriTaskRepository();
