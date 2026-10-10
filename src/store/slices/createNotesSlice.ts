import type { Note, NoteStatus, TaskPriority } from '../../types';
import type { NotesSlice, AppSlice } from '../types';
import {
  noteRepository,
  folderRepository,
  boardCardRepository,
  taskRepository,
  DEFAULT_NOTES,
  DEFAULT_FOLDERS,
} from '../../services/storage/noteRepository';

import {
  isNoteEmpty,
  flushPendingSave,
  debouncedSaveNote,
} from '../../services/storage/noteSaveManager';

export { isNoteEmpty, flushPendingSave, debouncedSaveNote };

export const createNotesSlice: AppSlice<NotesSlice> = (set, get) => ({
  notes: [],
  activeNoteId: '',
  secondaryNoteId: null,
  openNoteIds: [],
  splitView: false,
  activePane: 'left',

  setActivePane: (pane: 'left' | 'right') => set({ activePane: pane }),

  setSecondaryNoteId: (id: string | null) => set({ secondaryNoteId: id }),

  loadNotes: async () => {
    try {
      const [rawNotes, rawFolders, rawBoardCards, rawStandaloneTasks] = await Promise.all([
        noteRepository.getAll(),
        folderRepository.getAll(),
        boardCardRepository.getAll(),
        taskRepository.getAll(),
      ]);

      let folders = rawFolders;
      if (!folders || folders.length === 0) {
        folders = DEFAULT_FOLDERS;
        for (const f of DEFAULT_FOLDERS) {
          await folderRepository.save(f);
        }
      }

      // Purgar notas vacías históricas de la base de datos y de la papelera
      const emptyNotes = (rawNotes || []).filter((n) => isNoteEmpty(n));
      for (const empty of emptyNotes) {
        noteRepository.delete(empty.id).catch(console.error);
      }

      let notes = (rawNotes || []).filter((n) => !isNoteEmpty(n));
      const activeNotes = notes.filter((n) => !n.deletedAt);

      if (activeNotes.length === 0 && !localStorage.getItem('notas_app_seeded_v1')) {
        localStorage.setItem('notas_app_seeded_v1', 'true');
        notes = [...DEFAULT_NOTES, ...notes.filter((n) => !!n.deletedAt)];
        for (const n of DEFAULT_NOTES) {
          await noteRepository.save(n);
        }
      }

      const initialActiveId = activeNotes[0]?.id || notes[0]?.id || '';

      set({
        notes,
        folders,
        boardCards: rawBoardCards || [],
        standaloneTasks: rawStandaloneTasks || [],
        activeFolderId: null,
        activeNoteId: initialActiveId,
        openNoteIds: initialActiveId ? [initialActiveId] : [],
        isLoading: false,
      });
    } catch (err) {
      console.error('Error cargando notas en el store:', err);
      set({
        notes: [],
        folders: DEFAULT_FOLDERS,
        activeFolderId: null,
        activeNoteId: '',
        openNoteIds: [],
        isLoading: false,
      });
    }
  },

  selectNote: (noteId: string, pane?: 'left' | 'right') => {
    flushPendingSave();
    const { notes, activeNoteId, secondaryNoteId, openNoteIds, splitView, activePane } = get();
    const targetPane = pane || activePane;
    const currentActive = notes.find((n) => n.id === activeNoteId);

    let updatedNotes = notes;
    let updatedOpenIds = openNoteIds;

    if (currentActive && isNoteEmpty(currentActive) && currentActive.id !== noteId) {
      updatedNotes = notes.filter((n) => n.id !== currentActive.id);
      updatedOpenIds = openNoteIds.filter((id) => id !== currentActive.id);
      noteRepository.delete(currentActive.id).catch(console.error);
    }

    if (!updatedOpenIds.includes(noteId)) {
      updatedOpenIds = [...updatedOpenIds, noteId];
    }

    if (splitView) {
      if (targetPane === 'right') {
        if (noteId === activeNoteId) {
          set({
            notes: updatedNotes,
            openNoteIds: updatedOpenIds,
            activePane: 'left',
          });
          return;
        }
        set({
          notes: updatedNotes,
          secondaryNoteId: noteId,
          openNoteIds: updatedOpenIds,
          activePane: 'right',
          mobileView: 'editor',
        });
      } else {
        if (noteId === secondaryNoteId) {
          set({
            notes: updatedNotes,
            openNoteIds: updatedOpenIds,
            activePane: 'right',
            mobileView: 'editor',
          });
          return;
        }
        set({
          notes: updatedNotes,
          activeNoteId: noteId,
          openNoteIds: updatedOpenIds,
          activePane: 'left',
          mobileView: 'editor',
        });
      }
    } else {
      set({
        notes: updatedNotes,
        activeNoteId: noteId,
        openNoteIds: updatedOpenIds,
        activePane: 'left',
        mobileView: 'editor',
      });
    }
  },

  openExistingNoteInTab: (noteId: string) => {
    get().selectNote(noteId);
    set({ isAddModalOpen: false, activeNav: 'notes' });
  },

  openNoteTab: (noteId: string) => {
    const { openNoteIds } = get();
    if (!openNoteIds.includes(noteId)) {
      set({
        openNoteIds: [...openNoteIds, noteId],
        activeNoteId: noteId,
        activeNav: 'notes',
      });
    } else {
      set({ activeNoteId: noteId, activeNav: 'notes' });
    }
  },

  closeNoteTab: (noteId: string) => {
    flushPendingSave();
    const { openNoteIds, activeNoteId, secondaryNoteId, notes } = get();
    const newOpenIds = openNoteIds.filter((id) => id !== noteId);

    const closedNote = notes.find((n) => n.id === noteId);
    let updatedNotes = notes;
    if (closedNote && isNoteEmpty(closedNote)) {
      updatedNotes = notes.filter((n) => n.id !== noteId);
      noteRepository.delete(noteId).catch(console.error);
    }

    let nextActiveId = activeNoteId;
    if (activeNoteId === noteId) {
      if (newOpenIds.length > 0) {
        nextActiveId = newOpenIds[newOpenIds.length - 1];
      } else {
        nextActiveId = '';
      }
    }

    let nextSecondaryId = secondaryNoteId;
    if (secondaryNoteId === noteId) {
      nextSecondaryId = newOpenIds.find((id) => id !== nextActiveId) || null;
    }

    set({
      openNoteIds: newOpenIds,
      activeNoteId: nextActiveId,
      secondaryNoteId: nextSecondaryId,
      notes: updatedNotes,
      splitView: newOpenIds.length < 2 ? false : get().splitView,
    });
  },

  closeAllTabs: () => {
    flushPendingSave();
    const { openNoteIds, notes } = get();
    let updatedNotes = notes;
    for (const id of openNoteIds) {
      const n = notes.find((item) => item.id === id);
      if (n && isNoteEmpty(n)) {
        updatedNotes = updatedNotes.filter((item) => item.id !== id);
        noteRepository.delete(id).catch(console.error);
      }
    }
    set({
      openNoteIds: [],
      activeNoteId: '',
      secondaryNoteId: null,
      splitView: false,
      notes: updatedNotes,
    });
  },

  toggleSplitView: () => {
    const { splitView, openNoteIds, notes, activeNoteId, secondaryNoteId } = get();
    if (openNoteIds.length <= 1 || notes.length <= 1) {
      if (splitView) {
        set({ splitView: false, secondaryNoteId: null });
      }
      return;
    }

    const nextState = !splitView;

    if (nextState) {
      let targetSecondary = secondaryNoteId;
      if (!targetSecondary || targetSecondary === activeNoteId || !notes.some((n) => n.id === targetSecondary)) {
        const candidate = openNoteIds.find((id) => id !== activeNoteId) || notes.find((n) => n.id !== activeNoteId)?.id;
        targetSecondary = candidate || null;
      }

      if (!targetSecondary) {
        set({ splitView: false, secondaryNoteId: null });
        return;
      }

      const nextOpen = !openNoteIds.includes(targetSecondary)
        ? [...openNoteIds, targetSecondary]
        : openNoteIds;

      set({
        splitView: true,
        secondaryNoteId: targetSecondary,
        openNoteIds: nextOpen,
      });
      return;
    }

    set({ splitView: false });
  },

  createNote: async (folderId?: string, status?: NoteStatus) => {
    flushPendingSave();
    const { notes, activeNoteId, openNoteIds, splitView, activePane, activeFolderId } = get();
    const targetFolder = folderId !== undefined ? folderId : (activeFolderId || undefined);

    // Si la nota activa actual ya está vacía y sin guardar, reutilizarla sin duplicar
    const currentActive = notes.find((n) => n.id === activeNoteId);
    if (currentActive && isNoteEmpty(currentActive)) {
      if (currentActive.folderId !== targetFolder) {
        const updated = { ...currentActive, folderId: targetFolder, updatedAt: Date.now() };
        set({
          notes: notes.map((n) => (n.id === currentActive.id ? updated : n)),
          activeNav: 'notes',
          isAddModalOpen: false,
          mobileView: 'editor',
        });
      } else {
        set({
          activeNav: 'notes',
          isAddModalOpen: false,
          mobileView: 'editor',
        });
      }
      return currentActive.id;
    }

    // Filtrar y descartar permanentemente notas vacías no guardadas previas
    const remainingNotes = notes.filter((n) => {
      if (isNoteEmpty(n)) {
        noteRepository.delete(n.id).catch(console.error);
        return false;
      }
      return true;
    });

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: '',
      content: '<p></p>',
      updatedAt: Date.now(),
      folderId: targetFolder,
      status: status || 'planned',
    };

    const remainingOpenIds = openNoteIds.filter((id) =>
      remainingNotes.some((n) => n.id === id)
    );

    if (splitView && activePane === 'right') {
      set({
        notes: [newNote, ...remainingNotes],
        secondaryNoteId: newNote.id,
        openNoteIds: [...remainingOpenIds.filter((id) => id !== newNote.id), newNote.id],
        activeNav: 'notes',
        isAddModalOpen: false,
        mobileView: 'editor',
      });
    } else {
      set({
        notes: [newNote, ...remainingNotes],
        activeNoteId: newNote.id,
        openNoteIds: [...remainingOpenIds.filter((id) => id !== newNote.id), newNote.id],
        activeNav: 'notes',
        isAddModalOpen: false,
        mobileView: 'editor',
      });
    }
    return newNote.id;
  },

  cleanEmptyNotes: async () => {
    flushPendingSave();
    const { notes, activeNoteId, openNoteIds } = get();
    const nonEmpty: Note[] = [];
    const toDelete: Note[] = [];

    notes.forEach((n) => {
      if (n.deletedAt || !isNoteEmpty(n) || n.id === activeNoteId) {
        nonEmpty.push(n);
      } else {
        toDelete.push(n);
      }
    });

    for (const note of toDelete) {
      await noteRepository.delete(note.id).catch(console.error);
    }

    const finalNotes = nonEmpty.length > 0 ? nonEmpty : [DEFAULT_NOTES[0]];
    const nextActiveId = finalNotes.some((n) => n.id === activeNoteId)
      ? activeNoteId
      : finalNotes[0].id;

    const finalOpenIds = openNoteIds.filter((id) => finalNotes.some((n) => n.id === id));
    if (!finalOpenIds.includes(nextActiveId)) {
      finalOpenIds.push(nextActiveId);
    }

    set({
      notes: finalNotes,
      activeNoteId: nextActiveId,
      openNoteIds: finalOpenIds,
    });
    return toDelete.length;
  },

  deleteNote: async (noteId: string) => {
    flushPendingSave();
    try {
      const { notes, activeNoteId, openNoteIds } = get();
      const target = notes.find((n) => n.id === noteId);
      if (!target) return;

      // Si la nota está vacía o nunca fue guardada, destruirla permanentemente.
      // NUNCA enviar notas vacías a la papelera.
      if (isNoteEmpty(target)) {
        await noteRepository.delete(noteId).catch(console.error);
        const updatedNotes = notes.filter((n) => n.id !== noteId);
        const updatedOpenIds = openNoteIds.filter((id) => id !== noteId);
        const nonDeleted = updatedNotes.filter((n) => !n.deletedAt);

        let nextActiveId = activeNoteId;
        if (activeNoteId === noteId) {
          nextActiveId = updatedOpenIds.length > 0
            ? updatedOpenIds[0]
            : (nonDeleted.length > 0 ? nonDeleted[0].id : '');
        }

        set({
          notes: updatedNotes,
          activeNoteId: nextActiveId,
          openNoteIds: updatedOpenIds.length > 0
            ? updatedOpenIds
            : (nextActiveId ? [nextActiveId] : []),
          splitView: updatedOpenIds.length < 2 ? false : get().splitView,
        });
        return;
      }

      // Solo notas con contenido real van a la papelera (soft-delete):
      const updatedNote: Note = { ...target, deletedAt: Date.now(), updatedAt: Date.now() };
      await noteRepository.save(updatedNote);

      const updatedNotes = notes.map((n) => (n.id === noteId ? updatedNote : n));
      const updatedOpenIds = openNoteIds.filter((id) => id !== noteId);

      const nonDeleted = updatedNotes.filter((n) => !n.deletedAt);
      let nextActiveId = activeNoteId;
      if (activeNoteId === noteId) {
        nextActiveId = updatedOpenIds.length > 0
          ? updatedOpenIds[0]
          : (nonDeleted.length > 0 ? nonDeleted[0].id : '');
      }

      set({
        notes: updatedNotes,
        activeNoteId: nextActiveId,
        openNoteIds: updatedOpenIds.length > 0
          ? updatedOpenIds
          : (nextActiveId ? [nextActiveId] : []),
        splitView: updatedOpenIds.length < 2 ? false : get().splitView,
      });
    } catch (err) {
      console.error('Error eliminando nota:', err);
    }
  },

  updateNote: (id: string, title: string, content: string, extra?: Partial<Note>) => {
    const { notes } = get();
    const updatedNotes = notes.map((n) =>
      n.id === id ? { ...n, title, content, ...extra, updatedAt: Date.now() } : n
    );
    set({ notes: updatedNotes });

    const target = updatedNotes.find((n) => n.id === id);
    if (target) {
      debouncedSaveNote(target);
    }
  },

  updateActiveNote: (title: string, content: string) => {
    const { activeNoteId } = get();
    if (activeNoteId) {
      get().updateNote(activeNoteId, title, content);
    }
  },

  updateNoteStatus: (noteId: string, status: NoteStatus) => {
    const { notes } = get();
    const updatedNotes = notes.map((n) =>
      n.id === noteId ? { ...n, status, updatedAt: Date.now() } : n
    );
    set({ notes: updatedNotes });
    const target = updatedNotes.find((n) => n.id === noteId);
    if (target) {
      debouncedSaveNote(target);
    }
  },

  updateNotePriority: (noteId: string, priority: TaskPriority) => {
    const { notes } = get();
    const updatedNotes = notes.map((n) =>
      n.id === noteId ? { ...n, priority, updatedAt: Date.now() } : n
    );
    set({ notes: updatedNotes });
    const target = updatedNotes.find((n) => n.id === noteId);
    if (target) {
      debouncedSaveNote(target);
    }
  },
});
