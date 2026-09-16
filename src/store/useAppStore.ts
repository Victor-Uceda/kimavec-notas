import { create } from 'zustand';
import type { Note, NavigationItem, Folder, NoteStatus, TaskPriority, BoardCard, Task } from '../types';
import {
  noteRepository,
  folderRepository,
  boardCardRepository,
  taskRepository,
  DEFAULT_NOTES,
  DEFAULT_FOLDERS,
} from '../services/storage/noteRepository';
import { extractTasksFromMarkdown, findTaskById } from '../utils/taskParser';
import {
  toggleTaskInContent,
  deleteTaskFromContent,
  clearCompletedTasksFromContent,
  addTaskToContent,
} from '../utils/taskSync';

export type TaskFilter = 'all' | 'pending' | 'completed' | 'high-priority';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingNoteToSave: Note | null = null;

export const isNoteEmpty = (note?: Note | null): boolean => {
  if (!note) return true;
  const hasTitle = note.title.trim().length > 0;
  const plainContent = note.content.replace(/<[^>]+>/g, '').trim();
  return !hasTitle && plainContent.length === 0;
};

const flushPendingSave = () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  if (pendingNoteToSave) {
    if (!isNoteEmpty(pendingNoteToSave)) {
      noteRepository.save(pendingNoteToSave).catch((err) => {
        console.error('Error crítico persistiendo nota:', err);
        useAppStore.setState({ persistenceError: 'No se pudieron guardar los cambios en la base de datos local.' });
      });
    }
    pendingNoteToSave = null;
  }
};

const debouncedSaveNote = (note: Note) => {
  if (isNoteEmpty(note)) {
    pendingNoteToSave = null;
    return;
  }
  pendingNoteToSave = note;
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    flushPendingSave();
  }, 400);
};

interface AppState {
  activeNav: NavigationItem;
  notes: Note[];
  folders: Folder[];
  activeFolderId: string | null;
  activeNoteId: string;
  secondaryNoteId: string | null;
  openNoteIds: string[];
  splitView: boolean;
  activePane: 'left' | 'right';
  isAddModalOpen: boolean;
  isTaskPanelOpen: boolean;
  taskFilter: TaskFilter;
  isLoading: boolean;
  isSearchOpen: boolean;
  isTrashOpen: boolean;
  persistenceError: string | null;

  // Acciones de navegación y búsqueda
  setNav: (item: NavigationItem) => void;
  setPersistenceError: (error: string | null) => void;
  setTaskFilter: (filter: TaskFilter) => void;
  setSearchOpen: (open: boolean) => void;
  setTrashOpen: (open: boolean) => void;
  setAddModalOpen: (open: boolean) => void;
  setActivePane: (pane: 'left' | 'right') => void;
  setSecondaryNoteId: (id: string | null) => void;
  toggleTaskPanel: (open?: boolean) => void;

  // Acciones de carpetas
  loadFolders: () => Promise<void>;
  setActiveFolder: (id: string | null) => void;
  createFolder: (name: string, parentId?: string) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  moveFolder: (folderId: string, newParentId?: string) => Promise<void>;
  moveNoteToFolder: (noteId: string, folderId?: string) => void;

  // Tarjetas del Tablero Kanban (entidad independiente de las notas)
  boardCards: BoardCard[];
  loadBoardCards: () => Promise<void>;
  createBoardCard: (data: { title: string; content?: string; status: NoteStatus; linkedNoteId?: string; dueDate?: string }) => Promise<string>;
  updateBoardCard: (id: string, updates: Partial<BoardCard>) => Promise<void>;
  updateBoardCardStatus: (id: string, status: NoteStatus) => Promise<void>;
  deleteBoardCard: (id: string) => Promise<void>;

  // Tareas independientes (entidad independiente, no ligada a la Nota 3)
  standaloneTasks: Task[];
  loadStandaloneTasks: () => Promise<void>;
  createStandaloneTask: (title: string, dueDate?: string, priority?: TaskPriority) => Promise<Task>;
  toggleStandaloneTask: (id: string) => Promise<void>;
  deleteStandaloneTask: (id: string) => Promise<void>;
  restoreStandaloneTask: (id: string) => Promise<void>;
  deleteStandaloneTaskPermanently: (id: string) => Promise<void>;

  // Acciones de Papelera Centralizada (Recuperar, Eliminar Permanente, Vaciar)
  restoreNote: (noteId: string) => Promise<void>;
  deleteNotePermanently: (noteId: string) => Promise<void>;
  restoreFolder: (folderId: string) => Promise<void>;
  deleteFolderPermanently: (folderId: string) => Promise<void>;
  restoreBoardCard: (cardId: string) => Promise<void>;
  deleteBoardCardPermanently: (cardId: string) => Promise<void>;
  emptyTrash: () => Promise<void>;

  // Acciones de estado de nota y prioridad (Kanban legacy)
  updateNoteStatus: (noteId: string, status: NoteStatus) => void;
  updateNotePriority: (noteId: string, priority: TaskPriority) => void;

  // Ciclo de vida de notas y pestañas
  loadNotes: () => Promise<void>;
  selectNote: (noteId: string, pane?: 'left' | 'right') => void;
  openNoteTab: (noteId: string) => void;
  openExistingNoteInTab: (noteId: string) => void;
  closeNoteTab: (noteId: string) => void;
  closeAllTabs: () => void;
  toggleSplitView: () => void;
  createNote: (folderId?: string, status?: NoteStatus) => Promise<string>;
  deleteNote: (noteId: string) => Promise<void>;
  cleanEmptyNotes: () => Promise<number>;
  updateNote: (id: string, title: string, content: string, extra?: Partial<Note>) => void;
  updateActiveNote: (title: string, content: string) => void;

  // Acciones sobre tareas (Single Source of Truth en el cuerpo de la nota)
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
  addManualTask: (title: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeNav: 'home',
  notes: [],
  folders: [],
  boardCards: [],
  standaloneTasks: [],
  activeFolderId: null,
  activeNoteId: '',
  secondaryNoteId: null,
  openNoteIds: [],
  splitView: false,
  activePane: 'left',
  isAddModalOpen: false,
  isTaskPanelOpen: false,
  taskFilter: 'all',
  isLoading: true,
  isSearchOpen: false,
  isTrashOpen: false,
  persistenceError: null,

  setPersistenceError: (error: string | null) => set({ persistenceError: error }),

  setNav: (item: NavigationItem) => {
    flushPendingSave();
    set({ activeNav: item });
  },

  setTaskFilter: (filter: TaskFilter) => set({ taskFilter: filter }),

  setSearchOpen: (open: boolean) => set({ isSearchOpen: open }),

  setTrashOpen: (open: boolean) => set({ isTrashOpen: open }),

  setAddModalOpen: (open: boolean) => set({ isAddModalOpen: open }),

  setActivePane: (pane: 'left' | 'right') => set({ activePane: pane }),

  setSecondaryNoteId: (id: string | null) => set({ secondaryNoteId: id }),

  toggleTaskPanel: (open?: boolean) => {
    set((state) => ({
      isTaskPanelOpen: open !== undefined ? open : !state.isTaskPanelOpen,
    }));
  },

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

  // Tarjetas del Tablero Kanban (entidades independientes)
  loadBoardCards: async () => {
    try {
      const boardCards = await boardCardRepository.getAll();
      set({ boardCards });
    } catch (err) {
      console.error('Error cargando tarjetas del tablero:', err);
    }
  },

  createBoardCard: async (data: { title: string; content?: string; status: NoteStatus; linkedNoteId?: string; dueDate?: string }) => {
    const newCard: BoardCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: data.title.trim(),
      content: data.content?.trim() || '',
      status: data.status,
      linkedNoteId: data.linkedNoteId,
      dueDate: data.dueDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await boardCardRepository.save(newCard);
    set((state) => ({
      boardCards: [newCard, ...state.boardCards],
    }));
    return newCard.id;
  },

  updateBoardCard: async (id: string, updates: Partial<BoardCard>) => {
    const { boardCards } = get();
    const target = boardCards.find((c) => c.id === id);
    if (!target) return;
    const updated: BoardCard = { ...target, ...updates, updatedAt: Date.now() };
    await boardCardRepository.save(updated);
    set((state) => ({
      boardCards: state.boardCards.map((c) => (c.id === id ? updated : c)),
    }));
  },

  updateBoardCardStatus: async (id: string, status: NoteStatus) => {
    const { boardCards } = get();
    const target = boardCards.find((c) => c.id === id);
    if (!target) return;
    const updated: BoardCard = { ...target, status, updatedAt: Date.now() };
    await boardCardRepository.save(updated);
    set((state) => ({
      boardCards: state.boardCards.map((c) => (c.id === id ? updated : c)),
    }));
  },

  deleteBoardCard: async (id: string) => {
    const { boardCards } = get();
    const target = boardCards.find((c) => c.id === id);
    if (!target) return;
    const updated: BoardCard = { ...target, deletedAt: Date.now(), updatedAt: Date.now() };
    await boardCardRepository.save(updated);
    set((state) => ({
      boardCards: state.boardCards.map((c) => (c.id === id ? updated : c)),
    }));
  },

  // Tareas independientes (entidad independiente, no ligada a la Nota 3)
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

  // Acciones de Papelera Centralizada
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

      let notes = (rawNotes || []).filter((n) => !isNoteEmpty(n) || !!n.deletedAt);
      const activeNotes = notes.filter((n) => !n.deletedAt);

      if (activeNotes.length === 0) {
        notes = [...DEFAULT_NOTES, ...notes.filter((n) => !!n.deletedAt)];
        for (const n of DEFAULT_NOTES) {
          await noteRepository.save(n);
        }
      }

      // Al abrir la app lo primero que se debe ver es escribir una nota rápida.
      // Creamos un borrador inicial limpio. Las notas previas no se abren en pestañas
      // a menos que el usuario haga clic en ellas.
      const quickInitialNote: Note = {
        id: `note-quick-${Date.now()}`,
        title: '',
        content: '<p></p>',
        updatedAt: Date.now(),
        status: 'planned',
      };

      set({
        notes: [quickInitialNote, ...notes],
        folders,
        boardCards: rawBoardCards || [],
        standaloneTasks: rawStandaloneTasks || [],
        activeFolderId: null,
        activeNoteId: quickInitialNote.id,
        openNoteIds: [quickInitialNote.id],
        isLoading: false,
      });
    } catch (err) {
      console.error('Error cargando notas en el store:', err);
      const quickInitialNote: Note = {
        id: `note-quick-${Date.now()}`,
        title: '',
        content: '<p></p>',
        updatedAt: Date.now(),
        status: 'planned',
      };
      set({
        notes: [quickInitialNote, ...DEFAULT_NOTES],
        folders: DEFAULT_FOLDERS,
        activeFolderId: null,
        activeNoteId: quickInitialNote.id,
        openNoteIds: [quickInitialNote.id],
        isLoading: false,
      });
    }
  },

  selectNote: (noteId: string, pane?: 'left' | 'right') => {
    flushPendingSave();
    const { notes, activeNoteId, secondaryNoteId, openNoteIds, splitView, activePane } = get();
    const targetPane = pane || activePane;
    const currentActive = notes.find((n) => n.id === activeNoteId);

    // Si la nota previa quedó vacía sin escribir, se descarta limpiamente
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
      // PREVENCIÓN ESTRICTA: NUNCA abrir la misma nota en ambos paneles
      if (targetPane === 'right') {
        if (noteId === activeNoteId) {
          // Ya está en el panel 1 -> enfocar panel 1 sin duplicar
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
        });
      } else {
        if (noteId === secondaryNoteId) {
          // Ya está en el panel 2 -> enfocar panel 2 sin duplicar
          set({
            notes: updatedNotes,
            openNoteIds: updatedOpenIds,
            activePane: 'right',
          });
          return;
        }
        set({
          notes: updatedNotes,
          activeNoteId: noteId,
          openNoteIds: updatedOpenIds,
          activePane: 'left',
        });
      }
    } else {
      set({
        notes: updatedNotes,
        activeNoteId: noteId,
        openNoteIds: updatedOpenIds,
        activePane: 'left',
      });
    }
  },

  openExistingNoteInTab: (noteId: string) => {
    get().selectNote(noteId);
    set({ isAddModalOpen: false, activeNav: 'home' });
  },

  openNoteTab: (noteId: string) => {
    const { openNoteIds } = get();
    if (!openNoteIds.includes(noteId)) {
      set({
        openNoteIds: [...openNoteIds, noteId],
        activeNoteId: noteId,
        activeNav: 'home',
      });
    } else {
      set({ activeNoteId: noteId, activeNav: 'home' });
    }
  },

  closeNoteTab: (noteId: string) => {
    flushPendingSave();
    const { openNoteIds, activeNoteId, secondaryNoteId, notes } = get();
    const newOpenIds = openNoteIds.filter((id) => id !== noteId);

    // Si la nota que se cierra estaba vacía, eliminarla de la lista de notas
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
    // Si solo hay una nota abierta o en la app, no debe funcionar
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

    // Si la nota actual ya estaba vacía, la descartamos para reemplazarla sin acumular
    const remainingNotes = notes.filter((n) => {
      if (n.id === activeNoteId && isNoteEmpty(n)) {
        noteRepository.delete(n.id).catch(console.error);
        return false;
      }
      return true;
    });

    const targetFolder = folderId !== undefined ? folderId : (activeFolderId || undefined);

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: '',
      content: '<p></p>',
      updatedAt: Date.now(),
      folderId: targetFolder,
      status: status || 'planned',
    };

    const remainingOpenIds = openNoteIds.filter(
      (id) => id !== activeNoteId || remainingNotes.some((n) => n.id === id)
    );

    if (splitView && activePane === 'right') {
      set({
        notes: [newNote, ...remainingNotes],
        secondaryNoteId: newNote.id,
        openNoteIds: [...remainingOpenIds.filter((id) => id !== newNote.id), newNote.id],
        activeNav: 'home',
        isAddModalOpen: false,
      });
    } else {
      set({
        notes: [newNote, ...remainingNotes],
        activeNoteId: newNote.id,
        openNoteIds: [...remainingOpenIds.filter((id) => id !== newNote.id), newNote.id],
        activeNav: 'home',
        isAddModalOpen: false,
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

      if (nonDeleted.length === 0) {
        await get().createNote();
      }
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

  toggleTask: (taskId: string) => {
    const { notes, activeNoteId, secondaryNoteId, splitView, activePane } = get();
    const targetId = splitView && activePane === 'right' && secondaryNoteId ? secondaryNoteId : activeNoteId;
    const currentNote = notes.find((n) => n.id === targetId);
    if (!currentNote) return;

    const extracted = extractTasksFromMarkdown(currentNote.content, currentNote.id);
    const target = findTaskById(extracted, taskId);
    if (!target) return;

    const updatedContent = toggleTaskInContent(currentNote.content, target.title, target.completed);
    get().updateNote(currentNote.id, currentNote.title, updatedContent);
  },

  deleteTask: (taskId: string) => {
    const { notes, activeNoteId, secondaryNoteId, splitView, activePane } = get();
    const targetId = splitView && activePane === 'right' && secondaryNoteId ? secondaryNoteId : activeNoteId;
    const currentNote = notes.find((n) => n.id === targetId);
    if (!currentNote) return;

    const extracted = extractTasksFromMarkdown(currentNote.content, currentNote.id);
    const target = findTaskById(extracted, taskId);
    if (!target) return;

    const updatedContent = deleteTaskFromContent(currentNote.content, target.title);
    get().updateNote(currentNote.id, currentNote.title, updatedContent);
  },

  clearCompletedTasks: () => {
    const { notes, activeNoteId, secondaryNoteId, splitView, activePane } = get();
    const targetId = splitView && activePane === 'right' && secondaryNoteId ? secondaryNoteId : activeNoteId;
    const currentNote = notes.find((n) => n.id === targetId);
    if (!currentNote) return;

    const updatedContent = clearCompletedTasksFromContent(currentNote.content);
    get().updateNote(currentNote.id, currentNote.title, updatedContent);
  },

  addManualTask: (title: string) => {
    const { notes, activeNoteId, secondaryNoteId, splitView, activePane } = get();
    const targetId = splitView && activePane === 'right' && secondaryNoteId ? secondaryNoteId : activeNoteId;
    const currentNote = notes.find((n) => n.id === targetId);
    if (!currentNote) return;

    const updatedContent = addTaskToContent(currentNote.content, title);
    get().updateNote(currentNote.id, currentNote.title, updatedContent);
  },
}));
