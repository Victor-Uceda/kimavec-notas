import type { StateCreator } from 'zustand';
import type { Note, NavigationItem, Folder, NoteStatus, TaskPriority, BoardCard, Task, Theme } from '../types';

export interface UiState {
  activeNav: NavigationItem;
  isAddModalOpen: boolean;
  isLoading: boolean;
  isSearchOpen: boolean;
  isTrashOpen: boolean;
  isSettingsOpen: boolean;
  persistenceError: string | null;
  theme: Theme;
  mobileView: 'list' | 'editor';
}

export interface UiActions {
  setNav: (item: NavigationItem) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setMobileView: (view: 'list' | 'editor') => void;
  setPersistenceError: (error: string | null) => void;
  setSearchOpen: (open: boolean) => void;
  setTrashOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setAddModalOpen: (open: boolean) => void;
}

export type UiSlice = UiState & UiActions;

export interface NotesState {
  notes: Note[];
  activeNoteId: string;
  secondaryNoteId: string | null;
  openNoteIds: string[];
  splitView: boolean;
  activePane: 'left' | 'right';
}

export interface NotesActions {
  setActivePane: (pane: 'left' | 'right') => void;
  setSecondaryNoteId: (id: string | null) => void;
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
  updateNoteStatus: (noteId: string, status: NoteStatus) => void;
  updateNotePriority: (noteId: string, priority: TaskPriority) => void;
}

export type NotesSlice = NotesState & NotesActions;

export interface FoldersState {
  folders: Folder[];
  activeFolderId: string | null;
}

export interface FoldersActions {
  loadFolders: () => Promise<void>;
  setActiveFolder: (id: string | null) => void;
  createFolder: (name: string, parentId?: string) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  moveFolder: (folderId: string, newParentId?: string) => Promise<void>;
  moveNoteToFolder: (noteId: string, folderId?: string) => void;
}

export type FoldersSlice = FoldersState & FoldersActions;

export interface BoardState {
  boardCards: BoardCard[];
}

export interface BoardActions {
  loadBoardCards: () => Promise<void>;
  createBoardCard: (data: {
    title: string;
    content?: string;
    status: NoteStatus;
    linkedNoteId?: string;
    dueDate?: string;
  }) => Promise<string>;
  updateBoardCard: (id: string, updates: Partial<BoardCard>) => Promise<void>;
  updateBoardCardStatus: (id: string, status: NoteStatus) => Promise<void>;
  toggleBoardCardCompleted: (id: string) => Promise<void>;
  deleteBoardCard: (id: string) => Promise<void>;
}

export type BoardSlice = BoardState & BoardActions;

export interface TasksState {
  standaloneTasks: Task[];
}

export interface TasksActions {
  loadStandaloneTasks: () => Promise<void>;
  createStandaloneTask: (title: string, dueDate?: string, priority?: TaskPriority) => Promise<Task>;
  toggleStandaloneTask: (id: string) => Promise<void>;
  deleteStandaloneTask: (id: string) => Promise<void>;
  restoreStandaloneTask: (id: string) => Promise<void>;
  deleteStandaloneTaskPermanently: (id: string) => Promise<void>;
}

export type TasksSlice = TasksState & TasksActions;

export interface TrashActions {
  restoreNote: (noteId: string) => Promise<void>;
  deleteNotePermanently: (noteId: string) => Promise<void>;
  restoreFolder: (folderId: string) => Promise<void>;
  deleteFolderPermanently: (folderId: string) => Promise<void>;
  restoreBoardCard: (cardId: string) => Promise<void>;
  deleteBoardCardPermanently: (cardId: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
}

export type TrashSlice = TrashActions;

export type AppState = UiSlice & NotesSlice & FoldersSlice & BoardSlice & TasksSlice & TrashSlice;

export type AppSlice<T> = StateCreator<AppState, [], [], T>;
