import { create } from 'zustand';
import type { AppState } from './types';
import { createUiSlice } from './slices/createUiSlice';
import { createNotesSlice } from './slices/createNotesSlice';
import { createFoldersSlice } from './slices/createFoldersSlice';
import { createBoardSlice } from './slices/createBoardSlice';
import { createTasksSlice } from './slices/createTasksSlice';
import { createTrashSlice } from './slices/createTrashSlice';

/**
 * Almacén global unificado mediante el patrón de Slices de Zustand.
 * Mantiene compatibilidad total con la API existente, modularizando
 * la lógica en slices por dominio de responsabilidad.
 */
export const useAppStore = create<AppState>()((...a) => ({
  ...createUiSlice(...a),
  ...createNotesSlice(...a),
  ...createFoldersSlice(...a),
  ...createBoardSlice(...a),
  ...createTasksSlice(...a),
  ...createTrashSlice(...a),
}));

// Re-exportación de tipos y utilidades para compatibilidad total hacia atrás
export type { AppState } from './types';
export { applyThemeToDOM, getInitialTheme } from './slices/createUiSlice';
export { isNoteEmpty, flushPendingSave, debouncedSaveNote } from './slices/createNotesSlice';
