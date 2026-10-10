import type { Note } from '../../types';
import { noteRepository } from './noteRepository';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingNoteToSave: Note | null = null;

export const isNoteEmpty = (note?: Note | null): boolean => {
  if (!note) return true;
  const hasTitle = note.title.trim().length > 0;
  const plainContent = note.content.replace(/<[^>]+>/g, '').trim();
  return !hasTitle && plainContent.length === 0;
};

export const flushPendingSave = () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  if (pendingNoteToSave) {
    if (!isNoteEmpty(pendingNoteToSave)) {
      noteRepository.save(pendingNoteToSave).catch((err) => {
        console.error('Error crítico persistiendo nota:', err);
      });
    }
    pendingNoteToSave = null;
  }
};

export const debouncedSaveNote = (note: Note) => {
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
