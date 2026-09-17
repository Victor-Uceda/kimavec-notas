import type { Task, TaskPriority } from '../../types';
import type { TasksSlice, AppSlice } from '../types';
import { taskRepository } from '../../services/storage/noteRepository';

export const createTasksSlice: AppSlice<TasksSlice> = (set, get) => ({
  standaloneTasks: [],

  loadStandaloneTasks: async () => {
    try {
      const standaloneTasks = await taskRepository.getAll();
      set({ standaloneTasks: standaloneTasks || [] });
    } catch (err) {
      console.error('Error cargando tareas independientes:', err);
    }
  },

  createStandaloneTask: async (title: string, dueDate?: string, priority?: TaskPriority) => {
    const trimmed = title.trim();
    if (!trimmed) throw new Error('Título de la tarea no puede estar vacío');
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: trimmed,
      completed: false,
      dueDate,
      priority,
      source: 'manual',
      createdAt: Date.now(),
    };
    await taskRepository.save(newTask);
    set((state) => ({
      standaloneTasks: [newTask, ...state.standaloneTasks],
    }));
    return newTask;
  },

  toggleStandaloneTask: async (id: string) => {
    const { standaloneTasks } = get();
    const target = standaloneTasks.find((t) => t.id === id);
    if (!target) return;
    const updated: Task = { ...target, completed: !target.completed };
    await taskRepository.save(updated);
    set((state) => ({
      standaloneTasks: state.standaloneTasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteStandaloneTask: async (id: string) => {
    const { standaloneTasks } = get();
    const target = standaloneTasks.find((t) => t.id === id);
    if (!target) return;
    const updated: Task = { ...target, deletedAt: Date.now() };
    await taskRepository.save(updated);
    set((state) => ({
      standaloneTasks: state.standaloneTasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  restoreStandaloneTask: async (id: string) => {
    const { standaloneTasks } = get();
    const target = standaloneTasks.find((t) => t.id === id);
    if (!target) return;
    const restored: Task = { ...target, deletedAt: undefined };
    await taskRepository.save(restored);
    set((state) => ({
      standaloneTasks: state.standaloneTasks.map((t) => (t.id === id ? restored : t)),
    }));
  },

  deleteStandaloneTaskPermanently: async (id: string) => {
    await taskRepository.delete(id);
    set((state) => ({
      standaloneTasks: state.standaloneTasks.filter((t) => t.id !== id),
    }));
  },
});
