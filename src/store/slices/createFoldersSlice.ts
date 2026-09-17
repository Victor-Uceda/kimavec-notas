import type { Folder } from '../../types';
import type { FoldersSlice, AppSlice } from '../types';
import { folderRepository } from '../../services/storage/noteRepository';
import { debouncedSaveNote } from './createNotesSlice';

export const createFoldersSlice: AppSlice<FoldersSlice> = (set, get) => ({
  folders: [],
  activeFolderId: null,

  loadFolders: async () => {
    try {
      const folders = await folderRepository.getAll();
      set({ folders });
    } catch (err) {
      console.error('Error cargando carpetas:', err);
    }
  },

  setActiveFolder: (id: string | null) => set({ activeFolderId: id }),

  createFolder: async (name: string, parentId?: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nombre de carpeta no puede estar vacío');
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: trimmed,
      createdAt: Date.now(),
      parentId,
    };
    await folderRepository.save(newFolder);
    set((state) => ({
      folders: [...state.folders, newFolder],
      activeFolderId: newFolder.id,
    }));
    return newFolder;
  },

  deleteFolder: async (id: string) => {
    const { folders, activeFolderId } = get();
    const target = folders.find((f) => f.id === id);
    if (!target) return;
    const updatedFolder: Folder = { ...target, deletedAt: Date.now() };
    await folderRepository.save(updatedFolder);
    set({
      folders: folders.map((f) => (f.id === id ? updatedFolder : f)),
      activeFolderId: activeFolderId === id ? null : activeFolderId,
    });
  },

  renameFolder: async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { folders } = get();
    const target = folders.find((f) => f.id === id);
    if (!target) return;
    const updatedFolder: Folder = { ...target, name: trimmed };
    await folderRepository.save(updatedFolder);
    set({
      folders: folders.map((f) => (f.id === id ? updatedFolder : f)),
    });
  },

  moveFolder: async (folderId: string, newParentId?: string) => {
    if (folderId === newParentId) return;
    const { folders } = get();
    const target = folders.find((f) => f.id === folderId);
    if (!target) return;
    const updatedFolder: Folder = { ...target, parentId: newParentId };
    await folderRepository.save(updatedFolder);
    set({
      folders: folders.map((f) => (f.id === folderId ? updatedFolder : f)),
    });
  },

  moveNoteToFolder: (noteId: string, folderId?: string) => {
    const { notes } = get();
    const updatedNotes = notes.map((n) =>
      n.id === noteId ? { ...n, folderId, updatedAt: Date.now() } : n
    );
    set({ notes: updatedNotes });
    const target = updatedNotes.find((n) => n.id === noteId);
    if (target) {
      debouncedSaveNote(target);
    }
  },
});
