import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { NoteStatus } from '../../types';

interface NotesBoardViewProps {
  onOpenNote: (noteId: string) => void;
}

export const NotesBoardView: React.FC<NotesBoardViewProps> = ({ onOpenNote }) => {
  const {
    boardCards,
    notes,
    createBoardCard,
    updateBoardCardStatus,
    deleteBoardCard,
  } = useAppStore();

  const [addingInColumn, setAddingInColumn] = useState<NoteStatus | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardContent, setNewCardContent] = useState('');
  const [newCardLinkedNoteId, setNewCardLinkedNoteId] = useState<string>('');
  const [newCardDueDate, setNewCardDueDate] = useState<string>('');
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<NoteStatus | null>(null);

  const columns: Array<{
    id: NoteStatus;
    title: string;
  }> = [
    { id: 'planned', title: 'Planeadas' },
    { id: 'in_progress', title: 'En Progreso' },
    { id: 'completed', title: 'Completadas' },
  ];

  const getCardsByStatus = (status: NoteStatus) => {
    return boardCards.filter((c) => !c.deletedAt && c.status === status);
  };

  const isDateOverdue = (dateStr?: string) => {
    if (!dateStr) return false;
    const due = new Date(dateStr).getTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today.getTime();
  };

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    }
    return dateStr;
  };

  const handleAddCard = async (status: NoteStatus) => {
    if (!newCardTitle.trim()) {
      setAddingInColumn(null);
      return;
    }
    await createBoardCard({
      title: newCardTitle.trim(),
      content: newCardContent.trim(),
      status,
      linkedNoteId: newCardLinkedNoteId || undefined,
      dueDate: newCardDueDate || undefined,
    });
    setNewCardTitle('');
    setNewCardContent('');
    setNewCardLinkedNoteId('');
    setNewCardDueDate('');
    setAddingInColumn(null);
  };

  // Manejadores para arrastrar y mover con la mano (Drag & Drop)
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCardId(cardId);
  };

  const handleDragOver = (e: React.DragEvent, colId: NoteStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, colId: NoteStatus) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain') || draggedCardId;
    if (cardId) {
      updateBoardCardStatus(cardId, colId);
    }
    setDraggedCardId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-white rounded-sheet shadow-sheet border border-app-border-subtle overflow-hidden select-none">
      {/* Cabecera minimalista: solo título Flujo */}
      <header className="px-6 py-4 border-b border-app-border-subtle flex items-center bg-white">
        <h1 className="text-panel-title font-bold text-app-text-primary tracking-tight">
          Flujo
        </h1>
      </header>

      {/* 3 Columnas Kanban Minimalistas con arrastre de mano (Drag & Drop) */}
      <div className="flex-1 overflow-x-auto p-5 bg-app-canvas/40 flex gap-5">
        {columns.map((col) => {
          const colCards = getCardsByStatus(col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`w-80 sm:w-88 flex-shrink-0 flex flex-col bg-[#F8F9FA] border rounded-2xl overflow-hidden transition-colors ${
                isOver
                  ? 'border-blue-500/50 bg-blue-50/20 ring-2 ring-blue-500/10'
                  : 'border-app-border-subtle'
              }`}
            >
              {/* Encabezado de Columna */}
              <div className="p-3.5 border-b border-app-border-subtle flex items-center justify-between bg-white/70">
                <div className="flex items-center gap-2">
                  <span className="text-body font-semibold text-app-text-primary">
                    {col.title}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 text-app-text-secondary font-medium">
                    {colCards.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAddingInColumn(col.id);
                    setNewCardTitle('');
                    setNewCardContent('');
                    setNewCardLinkedNoteId('');
                  }}
                  className="p-1 rounded-lg hover:bg-black/5 text-app-text-secondary hover:text-app-text-primary transition-colors flex items-center justify-center"
                  title="Añadir tarjeta"
                >
                  <i className="fi fi-rr-plus text-xs leading-none" />
                </button>
              </div>

              {/* Lista de Tarjetas Minimalistas (SOLO Título y Contenido, con referencia opcional) */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[140px]">
                {/* Formulario rápido para añadir tarjeta en esta columna */}
                {addingInColumn === col.id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddCard(col.id);
                    }}
                    className="p-3 bg-white border border-black/15 rounded-xl shadow-md animate-in fade-in space-y-2"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      placeholder="Título de la nota..."
                      className="w-full text-xs font-medium text-app-text-primary border border-app-border-subtle rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-black/20"
                    />

                    <textarea
                      value={newCardContent}
                      onChange={(e) => setNewCardContent(e.target.value)}
                      placeholder="Contenido o descripción..."
                      rows={2}
                      className="w-full text-xs text-app-text-primary border border-app-border-subtle rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-black/20 resize-none"
                    />

                    {/* Selectores: Fecha límite y Nota vinculada */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-app-text-secondary bg-black/5 px-2 py-1.5 rounded-lg">
                        <i className="fi fi-rr-calendar text-xs opacity-70 leading-none" />
                        <input
                          type="date"
                          value={newCardDueDate}
                          onChange={(e) => setNewCardDueDate(e.target.value)}
                          className="bg-transparent border-none outline-none text-app-text-primary text-[11px] w-full cursor-pointer"
                          title="Fecha límite opcional"
                        />
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-app-text-secondary bg-black/5 px-2 py-1 rounded-lg">
                        <i className="fi fi-rr-document text-xs opacity-70 ml-0.5 leading-none" />
                        <select
                          value={newCardLinkedNoteId}
                          onChange={(e) => setNewCardLinkedNoteId(e.target.value)}
                          className="bg-transparent border-none outline-none text-app-text-primary text-[11px] w-full cursor-pointer truncate"
                        >
                          <option value="">Sin vincular</option>
                          {notes
                            .filter((n) => !n.deletedAt)
                            .map((n) => (
                              <option key={n.id} value={n.id}>
                                {n.title.trim() || 'Nota sin título'}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAddingInColumn(null);
                          setNewCardTitle('');
                          setNewCardContent('');
                          setNewCardLinkedNoteId('');
                          setNewCardDueDate('');
                        }}
                        className="px-2 py-1 text-xs text-app-text-secondary hover:text-app-text-primary"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!newCardTitle.trim()}
                        className="px-3 py-1 text-xs bg-app-action-primary text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-40"
                      >
                        Añadir
                      </button>
                    </div>
                  </form>
                )}

                {colCards.length === 0 && addingInColumn !== col.id && (
                  <div className="h-28 flex items-center justify-center text-center text-app-text-secondary/50 text-xs">
                    Arrastra notas aquí
                  </div>
                )}

                {colCards.map((card) => {
                  const isBeingDragged = draggedCardId === card.id;
                  const linkedNote = card.linkedNoteId ? notes.find((n) => n.id === card.linkedNoteId && !n.deletedAt) : null;

                  return (
                    <div
                      key={card.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onDragEnd={() => setDraggedCardId(null)}
                      className={`group relative p-3.5 rounded-xl bg-white border border-black/[0.07] hover:border-black/20 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing flex flex-col gap-1.5 ${
                        isBeingDragged ? 'opacity-40 scale-98 shadow-none' : 'opacity-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        {/* SOLO TÍTULO */}
                        <h4 className="text-task font-semibold text-app-text-primary leading-snug break-words flex-1">
                          {card.title.trim() || 'Nota sin título'}
                        </h4>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBoardCard(card.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-app-text-secondary hover:text-red-600 transition-opacity rounded"
                          title="Eliminar tarjeta"
                        >
                          <i className="fi fi-rr-trash text-xs leading-none" />
                        </button>
                      </div>

                      {/* SOLO CONTENIDO */}
                      {card.content.trim() ? (
                        <p className="text-xs text-app-text-secondary line-clamp-3 leading-relaxed break-words">
                          {card.content.trim()}
                        </p>
                      ) : (
                        <p className="text-xs text-app-text-secondary/40 italic">
                          Sin contenido
                        </p>
                      )}

                      {/* BADGE DE FECHA LÍMITE (DUE DATE) */}
                      {card.dueDate && (
                        <div className="flex items-center pt-0.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${
                              isDateOverdue(card.dueDate) && card.status !== 'completed'
                                ? 'bg-red-50 text-red-700 border border-red-200/60'
                                : 'bg-black/5 text-app-text-secondary'
                            }`}
                            title={`Fecha límite: ${card.dueDate}`}
                          >
                            <i className="fi fi-rr-calendar text-[10px] leading-none" />
                            <span>{formatDueDate(card.dueDate)}</span>
                            {isDateOverdue(card.dueDate) && card.status !== 'completed' && (
                              <span className="font-semibold text-[9px] ml-0.5">(Vencida)</span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* REFERENCIA OPCIONAL A NOTA NORMAL (SIN SER LA MISMA NOTA) */}
                      {linkedNote && (
                        <div className="pt-1 mt-0.5 border-t border-black/[0.04] flex items-center justify-between">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenNote(linkedNote.id);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline max-w-[200px] truncate"
                            title={`Abrir nota normal "${linkedNote.title}"`}
                          >
                            <i className="fi fi-rr-document text-[10px] leading-none" />
                            <span className="truncate">{linkedNote.title || 'Nota vinculada'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botón "+ Añadir nota" */}
              <div className="p-2 border-t border-app-border-subtle bg-white/40">
                <button
                  type="button"
                  onClick={() => {
                    setAddingInColumn(col.id);
                    setNewCardTitle('');
                    setNewCardContent('');
                    setNewCardLinkedNoteId('');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 transition-colors font-medium"
                >
                  <i className="fi fi-rr-plus text-xs leading-none" />
                  <span>Añadir nota</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
