import type { Theme, NavigationItem } from '../../types';
import type { UiSlice, AppSlice } from '../types';

import { flushPendingSave } from './createNotesSlice';

export const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('app-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
};

export const applyThemeToDOM = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

// Aplicar tema inicial de inmediato para evitar flash blanco
if (typeof window !== 'undefined') {
  applyThemeToDOM(getInitialTheme());
}

export const createUiSlice: AppSlice<UiSlice> = (set, get) => ({
  activeNav: 'home',
  isAddModalOpen: false,
  isLoading: true,
  isSearchOpen: false,
  isTrashOpen: false,
  isSettingsOpen: false,
  persistenceError: null,
  theme: getInitialTheme(),
  mobileView: 'list',

  setTheme: (theme: Theme) => {
    applyThemeToDOM(theme);
    try {
      localStorage.setItem('app-theme', theme);
    } catch {}
    set({ theme });
  },

  toggleTheme: () => {
    const current = get().theme;
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  setMobileView: (view: 'list' | 'editor') => set({ mobileView: view }),

  setPersistenceError: (error: string | null) => set({ persistenceError: error }),

  setNav: (item: NavigationItem) => {
    flushPendingSave();
    set({ activeNav: item });
  },

  setSearchOpen: (open: boolean) => set({ isSearchOpen: open }),

  setTrashOpen: (open: boolean) => set({ isTrashOpen: open }),

  setSettingsOpen: (open: boolean) => set({ isSettingsOpen: open }),

  setAddModalOpen: (open: boolean) => set({ isAddModalOpen: open }),
});
