import type { Note, Folder, BoardCard } from '../../types';
import type { TrashSlice, AppSlice } from '../types';
import {
  noteRepository,
  folderRepository,
  boardCardRepository,
  taskRepository,
} from '../../services/storage/noteRepository';
import { debouncedSaveNote } from './createNotesSlice';

export const createTrashSlice: AppSlice<TrashSlice> = (set, get) => ({
  restoreNote: async (noteId: string) => {
    const { notes } = get();
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;
    const restored: Note = { ...target, deletedAt: undefined, updatedAt: Date.now() };
    await noteRepository.save(restored);
    set((state) => ({
      notes: state.notes.map((n) => (n.id === noteId ? restored : n)),
      openNoteIds: state.openNoteIds.includes(noteId) ? state.openNoteIds : [...state.openNoteIds, noteId],
      activeNoteId: noteId,
    }));
  },

  deleteNotePermanently: async (noteId: string) => {
    await noteRepository.delete(noteId);
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== noteId),
      openNoteIds: state.openNoteIds.filter((id) => id !== noteId),
    }));
  },

  restoreFolder: async (folderId: string) => {
    const { folders } = get();
    const target = folders.find((f) => f.id === folderId);
    if (!target) return;
    const restored: Folder = { ...target, deletedAt: undefined };
    await folderRepository.save(restored);
    set((state) => ({
      folders: state.folders.map((f) => (f.id === folderId ? restored : f)),
    }));
  },

  deleteFolderPermanently: async (folderId: string) => {
    await folderRepository.delete(folderId);
    const { notes } = get();
    const updatedNotes = notes.map((n) => (n.folderId === folderId ? { ...n, folderId: undefined } : n));
    for (const n of updatedNotes) {
      if (n.folderId === undefined) debouncedSaveNote(n);
    }
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== folderId),
      notes: updatedNotes,
    }));
  },

  restoreBoardCard: async (cardId: string) => {
    const { boardCards } = get();
    const target = boardCards.find((c) => c.id === cardId);
    if (!target) return;
    const restored: BoardCard = { ...target, deletedAt: undefined, updatedAt: Date.now() };
    await boardCardRepository.save(restored);
    set((state) => ({
      boardCards: state.boardCards.map((c) => (c.id === cardId ? restored : c)),
    }));
  },

  deleteBoardCardPermanently: async (cardId: string) => {
    await boardCardRepository.delete(cardId);
    set((state) => ({
      boardCards: state.boardCards.filter((c) => c.id !== cardId),
    }));
  },

  emptyTrash: async () => {
    const { notes, folders, boardCards, standaloneTasks } = get();
    const trashedNotes = notes.filter((n) => !!n.deletedAt);
    const trashedFolders = folders.filter((f) => !!f.deletedAt);
    const trashedCards = boardCards.filter((c) => !!c.deletedAt);
    const trashedTasks = standaloneTasks.filter((t) => !!t.deletedAt);

    for (const n of trashedNotes) {
      await noteRepository.delete(n.id).catch(console.error);
    }
    for (const f of trashedFolders) {
      await folderRepository.delete(f.id).catch(console.error);
    }
    for (const c of trashedCards) {
      await boardCardRepository.delete(c.id).catch(console.error);
    }
    for (const t of trashedTasks) {
      await taskRepository.delete(t.id).catch(console.error);
    }

    set({
      notes: notes.filter((n) => !n.deletedAt),
      folders: folders.filter((f) => !f.deletedAt),
      boardCards: boardCards.filter((c) => !c.deletedAt),
      standaloneTasks: standaloneTasks.filter((t) => !t.deletedAt),
    });
  },
});
