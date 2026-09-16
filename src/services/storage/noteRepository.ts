import type { Note, Folder, BoardCard } from '../../types';

export interface NoteRepository {
  getAll(): Promise<Note[]>;
  getById(id: string): Promise<Note | null>;
  save(note: Note): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface FolderRepository {
  getAll(): Promise<Folder[]>;
  save(folder: Folder): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface BoardCardRepository {
  getAll(): Promise<BoardCard[]>;
  save(card: BoardCard): Promise<void>;
  delete(id: string): Promise<void>;
}

const STORAGE_KEY = 'notas_app_notes_v1';
const FOLDERS_STORAGE_KEY = 'notas_app_folders_v1';

export const DEFAULT_FOLDERS: Folder[] = [
  {
    id: 'folder-01',
    name: '01',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'folder-02',
    name: '02',
    createdAt: Date.now() - 3600000,
  },
];

export const DEFAULT_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Notas de reunión con omar',
    content: `<p>Alineación de objetivos de producto y arquitectura del cliente ligero.</p>
<h2>Acuerdos de la reunión</h2>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>Definir contratos de datos y esquema de persistencia @Omar</p></div></li>
  <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked></label><div><p>Tarea completada [Prioridad Alta] @Omar</p></div></li>
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>Implementar sincronización reactiva en tiempo real</p></div></li>
</ul>
<h2>Siguientes pasos</h2>
<p>Se evaluará la integración nativa y el benchmark de consumo de memoria. Mantener interfaz limpia y tipografía cuidada.</p>`,
    updatedAt: Date.now(),
    folderId: 'folder-01',
    status: 'in_progress',
    priority: 'high',
  },
  {
    id: 'note-2',
    title: 'Plan de despliegue y empaquetado',
    content: `<p>Estrategia de distribución multiplataforma sin navegadores embebidos ni bloatware.</p>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>Validar compatibilidad de WebView2 en Windows 10 y 11</p></div></li>
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>Configurar toolchain de compilación en Linux (WebKitGTK)</p></div></li>
  <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked></label><div><p>Eliminar dependencias innecesarias de Chrome [Prioridad Alta]</p></div></li>
</ul>`,
    updatedAt: Date.now() - 3600000,
    folderId: 'folder-02',
    status: 'planned',
    priority: 'medium',
  },
];

export class LocalStorageNoteRepository implements NoteRepository {
  async getAll(): Promise<Note[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTES));
        return DEFAULT_NOTES;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_NOTES;
    }
  }

  async getById(id: string): Promise<Note | null> {
    const notes = await this.getAll();
    return notes.find((n) => n.id === id) || null;
  }

  async save(note: Note): Promise<void> {
    const notes = await this.getAll();
    const index = notes.findIndex((n) => n.id === note.id);
    let updated: Note[];
    if (index >= 0) {
      updated = [...notes];
      updated[index] = { ...note, updatedAt: Date.now() };
    } else {
      updated = [{ ...note, updatedAt: Date.now() }, ...notes];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async delete(id: string): Promise<void> {
    const notes = await this.getAll();
    const filtered = notes.filter((n) => n.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}

/**
 * Repositorio nativo Tauri con persistencia en SQLite
 */
export class TauriNoteRepository implements NoteRepository {
  private isTauriAvailable(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  async getAll(): Promise<Note[]> {
    if (this.isTauriAvailable()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const notes = await invoke<Note[]>('get_notes');
        if (notes && notes.length > 0) {
          return notes;
        }
        // Si SQLite está recién creado y vacío, sembramos las notas iniciales
        for (const note of DEFAULT_NOTES) {
          await invoke('save_note', { note });
        }
        const seeded = await invoke<Note[]>('get_notes');
        if (seeded && seeded.length > 0) {
          return seeded;
        }
      } catch (err) {
        console.warn('Tauri invoke falló, usando fallback LocalStorage:', err);
      }
    }
    return fallbackRepo.getAll();
  }

  async getById(id: string): Promise<Note | null> {
    const notes = await this.getAll();
    return notes.find((n) => n.id === id) || null;
  }

  async save(note: Note): Promise<void> {
    if (this.isTauriAvailable()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('save_note', { note });
        return;
      } catch (err) {
        console.warn('Tauri save falló, usando fallback LocalStorage:', err);
      }
    }
    await fallbackRepo.save(note);
  }

  async delete(id: string): Promise<void> {
    if (this.isTauriAvailable()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('delete_note', { id });
        return;
      } catch (err) {
        console.warn('Tauri delete falló, usando fallback LocalStorage:', err);
      }
    }
    await fallbackRepo.delete(id);
  }
}

export class LocalStorageFolderRepository implements FolderRepository {
  async getAll(): Promise<Folder[]> {
    try {
      const data = localStorage.getItem(FOLDERS_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(DEFAULT_FOLDERS));
        return DEFAULT_FOLDERS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_FOLDERS;
    }
  }

  async save(folder: Folder): Promise<void> {
    const folders = await this.getAll();
    const index = folders.findIndex((f) => f.id === folder.id);
    let updated: Folder[];
    if (index >= 0) {
      updated = [...folders];
      updated[index] = folder;
    } else {
      updated = [...folders, folder];
    }
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(updated));
  }

  async delete(id: string): Promise<void> {
    const folders = await this.getAll();
    const filtered = folders.filter((f) => f.id !== id);
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(filtered));
  }
}

const BOARD_CARDS_STORAGE_KEY = 'notas_app_board_cards_v1';

export const DEFAULT_BOARD_CARDS: BoardCard[] = [
  {
    id: 'card-1',
    title: 'Definir contratos de arquitectura',
    content: 'Especificar esquemas de persistencia y contratos de comunicación ligera.',
    status: 'in_progress',
    linkedNoteId: 'note-1',
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 7200000,
  },
  {
    id: 'card-2',
    title: 'Validación en WebView2',
    content: 'Verificar soporte sin dependencias innecesarias de Chrome ni bloatware.',
    status: 'planned',
    linkedNoteId: 'note-2',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'card-3',
    title: 'Diseño del Tablero Minimalista',
    content: 'Eliminar palabras y símbolos extraños, permitir mover las notas con la mano.',
    status: 'completed',
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000,
  },
];

export class LocalStorageBoardCardRepository implements BoardCardRepository {
  async getAll(): Promise<BoardCard[]> {
    try {
      const data = localStorage.getItem(BOARD_CARDS_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(BOARD_CARDS_STORAGE_KEY, JSON.stringify(DEFAULT_BOARD_CARDS));
        return DEFAULT_BOARD_CARDS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_BOARD_CARDS;
    }
  }

  async save(card: BoardCard): Promise<void> {
    const cards = await this.getAll();
    const index = cards.findIndex((c) => c.id === card.id);
    let updated: BoardCard[];
    if (index >= 0) {
      updated = [...cards];
      updated[index] = { ...card, updatedAt: Date.now() };
    } else {
      updated = [{ ...card, updatedAt: Date.now() }, ...cards];
    }
    localStorage.setItem(BOARD_CARDS_STORAGE_KEY, JSON.stringify(updated));
  }

  async delete(id: string): Promise<void> {
    const cards = await this.getAll();
    const filtered = cards.filter((c) => c.id !== id);
    localStorage.setItem(BOARD_CARDS_STORAGE_KEY, JSON.stringify(filtered));
  }
}

const fallbackRepo = new LocalStorageNoteRepository();
export const noteRepository: NoteRepository = new TauriNoteRepository();
export const folderRepository: FolderRepository = new LocalStorageFolderRepository();
export const boardCardRepository: BoardCardRepository = new LocalStorageBoardCardRepository();
