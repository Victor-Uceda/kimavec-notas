import type { BoardCard, NoteStatus } from '../../types';
import type { BoardSlice, AppSlice } from '../types';
import { boardCardRepository } from '../../services/storage/noteRepository';

export const createBoardSlice: AppSlice<BoardSlice> = (set, get) => ({
  boardCards: [],

  loadBoardCards: async () => {
    try {
      const boardCards = await boardCardRepository.getAll();
      const normalized = (boardCards || []).map((card) => ({
        ...card,
        completed: card.completed !== undefined ? card.completed : card.status === 'completed',
      }));
      set({ boardCards: normalized });
    } catch (err) {
      console.error('Error cargando tarjetas del tablero:', err);
    }
  },

  createBoardCard: async (data: {
    title: string;
    content?: string;
    status: NoteStatus;
    linkedNoteId?: string;
    dueDate?: string;
  }) => {
    const newCard: BoardCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: data.title.trim(),
      content: data.content?.trim() || '',
      status: data.status,
      completed: data.status === 'completed',
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
    const completed =
      updates.completed !== undefined
        ? updates.completed
        : updates.status
        ? updates.status === 'completed'
        : target.completed;
    const updated: BoardCard = {
      ...target,
      ...updates,
      completed,
      updatedAt: Date.now(),
    };
    await boardCardRepository.save(updated);
    set((state) => ({
      boardCards: state.boardCards.map((c) => (c.id === id ? updated : c)),
    }));
  },

  updateBoardCardStatus: async (id: string, status: NoteStatus) => {
    const { boardCards } = get();
    const target = boardCards.find((c) => c.id === id);
    if (!target) return;
    const updated: BoardCard = {
      ...target,
      status,
      completed: status === 'completed',
      updatedAt: Date.now(),
    };
    await boardCardRepository.save(updated);
    set((state) => ({
      boardCards: state.boardCards.map((c) => (c.id === id ? updated : c)),
    }));
  },

  toggleBoardCardCompleted: async (id: string) => {
    const { boardCards } = get();
    const target = boardCards.find((c) => c.id === id);
    if (!target) return;
    const isCurrentlyCompleted = target.status === 'completed' || !!target.completed;
    const nextCompleted = !isCurrentlyCompleted;
    const nextStatus: NoteStatus = nextCompleted ? 'completed' : 'planned';
    const updated: BoardCard = {
      ...target,
      status: nextStatus,
      completed: nextCompleted,
      updatedAt: Date.now(),
    };
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
});
