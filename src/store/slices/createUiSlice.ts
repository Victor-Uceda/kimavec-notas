import type { Theme, NavigationItem } from '../../types';
import type { UiSlice, AppSlice } from '../types';

import { flushPendingSave } from '../../services/storage/noteSaveManager';

export const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('app-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark' || saved === 'amber') {
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
    root.classList.remove('dark', 'theme-amber');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'amber') {
      root.classList.add('dark', 'theme-amber');
    }
  }
};

// Aplicar tema inicial de inmediato para evitar flash blanco
if (typeof window !== 'undefined') {
  applyThemeToDOM(getInitialTheme());
}

const getInitialSidebarState = (): boolean => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('app-sidebar-open');
    if (saved !== null) {
      return saved === 'true';
    }
  }
  return true;
};

const getInitialSidebarWidth = (): number => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('app-sidebar-width');
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 220 && parsed <= 280) {
        return parsed;
      }
    }
  }
  return 260;
};

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
  isSidebarOpen: getInitialSidebarState(),
  sidebarWidth: getInitialSidebarWidth(),

  setTheme: (theme: Theme) => {
    applyThemeToDOM(theme);
    try {
      localStorage.setItem('app-theme', theme);
    } catch {}
    set({ theme });
  },

  toggleTheme: () => {
    const current = get().theme;
    const cycle: Record<Theme, Theme> = {
      light: 'dark',
      dark: 'amber',
      amber: 'light',
    };
    const next: Theme = cycle[current] || 'light';
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

  toggleSidebar: () => {
    const next = !get().isSidebarOpen;
    try {
      localStorage.setItem('app-sidebar-open', String(next));
    } catch {}
    set({ isSidebarOpen: next });
  },

  setSidebarOpen: (open: boolean) => {
    try {
      localStorage.setItem('app-sidebar-open', String(open));
    } catch {}
    set({ isSidebarOpen: open });
  },

  setSidebarWidth: (width: number) => {
    const clamped = Math.min(Math.max(width, 220), 280);
    try {
      localStorage.setItem('app-sidebar-width', String(clamped));
    } catch {}
    set({ sidebarWidth: clamped });
  },
});
