import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { NoteStatus } from '../../types';
import { Checkbox } from '../../components/ui/Checkbox';

interface NotesBoardViewProps {
  onOpenNote: (noteId: string) => void;
}

export const NotesBoardView: React.FC<NotesBoardViewProps> = ({ onOpenNote }) => {
  const {
    boardCards,
    notes,
    createBoardCard,
    updateBoardCardStatus,
    toggleBoardCardCompleted,
    deleteBoardCard,
  } = useAppStore();

  const [addingInColumn, setAddingInColumn] = useState<NoteStatus | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardContent, setNewCardContent] = useState('');
  const [newCardLinkedNoteId, setNewCardLinkedNoteId] = useState<string>('');
  const [newCardDueDate, setNewCardDueDate] = useState<string>('');
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<NoteStatus | null>(null);

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

  // Renderizador de tarjeta individual reutilizable
  const renderCard = (card: typeof boardCards[0]) => {
    const isBeingDragged = draggedCardId === card.id;
    const isCompleted = card.status === 'completed' || !!card.completed;
    const linkedNote = card.linkedNoteId
      ? notes.find((n) => n.id === card.linkedNoteId && !n.deletedAt)
      : null;

    return (
      <div
        key={card.id}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, card.id)}
        onDragEnd={() => setDraggedCardId(null)}
        className={`group relative p-3.5 rounded-xl bg-app-editor dark:bg-[#141416] border border-app-border-subtle hover:border-app-border-contrast/60 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing flex flex-col gap-2 ${
          isBeingDragged ? 'opacity-40 scale-98 shadow-none' : 'opacity-100'
        }`}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
            <Checkbox
              checked={isCompleted}
              onChange={() => toggleBoardCardCompleted(card.id)}
              ariaLabel={
                isCompleted
                  ? 'Marcar como pendiente (mover a Tus tareas)'
                  : 'Marcar como completada (mover a Completadas)'
              }
            />
          </div>

          <h4
            className={`text-task font-semibold leading-snug break-words flex-1 transition-all ${
              isCompleted
                ? 'line-through text-app-text-disabled opacity-60'
                : 'text-app-text-primary'
            }`}
          >
            {card.title.trim() || 'Nota sin título'}
          </h4>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteBoardCard(card.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-app-text-secondary hover:text-red-600 transition-opacity rounded shrink-0"
            title="Eliminar tarea"
          >
            <i className="fi fi-rr-trash text-xs leading-none" />
          </button>
        </div>

        {card.content.trim() && (
          <p
            className={`text-xs leading-relaxed break-words pl-7 transition-all ${
              isCompleted
                ? 'text-app-text-secondary/40 line-through'
                : 'text-app-text-secondary line-clamp-3'
            }`}
          >
            {card.content.trim()}
          </p>
        )}

        {card.dueDate && (
          <div className="flex items-center pl-7 pt-0.5">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${
                isDateOverdue(card.dueDate) && !isCompleted
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200/60 dark:border-red-900/60'
                  : 'bg-app-active-pill text-app-text-secondary'
              }`}
              title={`Fecha límite: ${card.dueDate}`}
            >
              <i className="fi fi-rr-calendar text-[10px] leading-none" />
              <span>{formatDueDate(card.dueDate)}</span>
              {isDateOverdue(card.dueDate) && !isCompleted && (
                <span className="font-semibold text-[9px] ml-0.5">(Vencida)</span>
              )}
            </span>
          </div>
        )}

        {linkedNote && (
          <div className="pl-7 pt-1.5 mt-0.5 border-t border-app-border-subtle flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenNote(linkedNote.id);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline max-w-[200px] truncate"
              title={`Abrir nota normal "${linkedNote.title}"`}
            >
              <i className="fi fi-rr-document text-[10px] leading-none" />
              <span className="truncate">{linkedNote.title || 'Nota vinculada'}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Renderizador de formulario de añadir tarea
  const renderAddForm = (status: NoteStatus) => {
    if (addingInColumn !== status) return null;

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddCard(status);
        }}
        className="p-3 bg-app-editor border border-app-border-subtle rounded-xl shadow-md animate-in fade-in space-y-2 mb-3"
      >
        <input
          type="text"
          autoFocus
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
          placeholder="Título de la tarea..."
          className="w-full text-xs font-medium text-app-text-primary border border-app-border-subtle bg-transparent rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-app-action-primary"
        />

        <textarea
          value={newCardContent}
          onChange={(e) => setNewCardContent(e.target.value)}
          placeholder="Descripción opcional..."
          rows={2}
          className="w-full text-xs text-app-text-primary border border-app-border-subtle bg-transparent rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-app-action-primary resize-none"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-app-text-secondary bg-app-active-pill px-2 py-1.5 rounded-lg">
            <i className="fi fi-rr-calendar text-xs opacity-70 leading-none" />
            <input
              type="date"
              value={newCardDueDate}
              onChange={(e) => setNewCardDueDate(e.target.value)}
              className="bg-transparent border-none outline-none text-app-text-primary text-[11px] w-full cursor-pointer"
              title="Fecha límite opcional"
            />
          </div>

          <div className="flex items-center gap-1 text-[11px] text-app-text-secondary bg-app-active-pill px-2 py-1 rounded-lg">
            <i className="fi fi-rr-document text-xs opacity-70 ml-0.5 leading-none" />
            <select
              value={newCardLinkedNoteId}
              onChange={(e) => setNewCardLinkedNoteId(e.target.value)}
              className="bg-transparent border-none outline-none text-app-text-primary text-[11px] w-full cursor-pointer truncate"
            >
              <option value="" className="bg-app-editor text-app-text-primary">
                Sin vincular
              </option>
              {notes
                .filter((n) => !n.deletedAt)
                .map((n) => (
                  <option key={n.id} value={n.id} className="bg-app-editor text-app-text-primary">
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
            className="px-3 py-1 text-xs bg-app-action-primary text-app-action-primary-text rounded-lg font-medium hover:opacity-90 disabled:opacity-40"
          >
            Añadir
          </button>
        </div>
      </form>
    );
  };

  const plannedCards = getCardsByStatus('planned');
  const inProgressCards = getCardsByStatus('in_progress');
  const completedCards = getCardsByStatus('completed');

  return (
    <div className="flex-1 h-full flex flex-col md:flex-row gap-3.5 sm:gap-4.5 p-3 sm:p-5 bg-app-canvas overflow-y-auto md:overflow-hidden select-none">
      {/* 1. COLUMNA PRINCIPAL IZQUIERDA: "Tus tareas" (Ocupa todo el alto) */}
      <div
        onDragOver={(e) => handleDragOver(e, 'planned')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'planned')}
        className={`flex-1 md:w-3/5 h-full flex flex-col bg-app-sidebar border rounded-2xl overflow-hidden transition-colors ${
          dragOverColumn === 'planned'
            ? 'border-blue-500/50 bg-blue-50/20 dark:bg-blue-950/20 ring-2 ring-blue-500/10'
            : 'border-app-border-subtle'
        }`}
      >
        {/* Cabecera de Tus tareas */}
        <div className="p-4 sm:p-5 border-b border-app-border-subtle flex items-center justify-between bg-app-sidebar">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-app-text-primary tracking-tight">
              Tus tareas
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-app-active-pill text-app-text-secondary font-medium">
              {plannedCards.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setAddingInColumn('planned');
              setNewCardTitle('');
              setNewCardContent('');
              setNewCardLinkedNoteId('');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-app-action-primary-text bg-app-action-primary hover:opacity-90 rounded-xl transition-all shadow-sm leading-none"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span>Añadir Tarea</span>
          </button>
        </div>

        {/* Lista de Tus tareas */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-2.5 min-h-[160px]">
          {renderAddForm('planned')}

          {plannedCards.length === 0 && addingInColumn !== 'planned' && (
            <div className="h-40 flex flex-col items-center justify-center text-center text-app-text-secondary/50 text-xs border border-dashed border-app-border-subtle/60 rounded-xl my-2 gap-2">
              <i className="fi fi-rr-clipboard-list-check text-xl opacity-40" />
              <span>No tienes tareas pendientes</span>
            </div>
          )}

          {plannedCards.map((card) => renderCard(card))}
        </div>

        {/* Botón inferior rápido "Añadir Tarea" */}
        <div className="p-3 border-t border-app-border-subtle/60 bg-app-sidebar">
          <button
            type="button"
            onClick={() => {
              setAddingInColumn('planned');
              setNewCardTitle('');
              setNewCardContent('');
              setNewCardLinkedNoteId('');
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-app-text-secondary hover:text-app-text-primary hover:bg-app-active-pill transition-colors font-medium leading-none"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />
            <span>Añadir Tarea</span>
          </button>
        </div>
      </div>

      {/* 2. COLUMNA DERECHA: "En progreso" (Arriba) y "Completadas" (Abajo) */}
      <div className="flex-1 md:w-2/5 h-full flex flex-col gap-3.5 sm:gap-4.5 min-h-0">
        {/* 2.1 CAJA SUPERIOR: "En progreso" */}
        <div
          onDragOver={(e) => handleDragOver(e, 'in_progress')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'in_progress')}
          className={`flex-1 min-h-[220px] flex flex-col bg-app-sidebar border rounded-2xl overflow-hidden transition-colors ${
            dragOverColumn === 'in_progress'
              ? 'border-blue-500/50 bg-blue-50/20 dark:bg-blue-950/20 ring-2 ring-blue-500/10'
              : 'border-app-border-subtle'
          }`}
        >
          {/* Cabecera En progreso */}
          <div className="p-3.5 sm:p-4 border-b border-app-border-subtle flex items-center justify-between bg-app-sidebar">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-app-text-primary tracking-tight">
                En progreso
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-app-active-pill text-app-text-secondary font-medium">
                {inProgressCards.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setAddingInColumn('in_progress');
                setNewCardTitle('');
                setNewCardContent('');
                setNewCardLinkedNoteId('');
              }}
              className="p-1.5 rounded-lg hover:bg-app-active-pill text-app-text-secondary hover:text-app-text-primary transition-colors inline-flex items-center justify-center"
              title="Añadir tarea en progreso"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            </button>
          </div>

          {/* Lista de En progreso */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 min-h-[100px]">
            {renderAddForm('in_progress')}

            {inProgressCards.length === 0 && addingInColumn !== 'in_progress' && (
              <div className="h-28 flex items-center justify-center text-center text-app-text-secondary/50 text-xs border border-dashed border-app-border-subtle/60 rounded-xl">
                Arrastra tareas aquí
              </div>
            )}

            {inProgressCards.map((card) => renderCard(card))}
          </div>
        </div>

        {/* 2.2 CAJA INFERIOR: "Completadas" */}
        <div
          onDragOver={(e) => handleDragOver(e, 'completed')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'completed')}
          className={`flex-1 min-h-[220px] flex flex-col bg-app-sidebar border rounded-2xl overflow-hidden transition-colors ${
            dragOverColumn === 'completed'
              ? 'border-blue-500/50 bg-blue-50/20 dark:bg-blue-950/20 ring-2 ring-blue-500/10'
              : 'border-app-border-subtle'
          }`}
        >
          {/* Cabecera Completadas */}
          <div className="p-3.5 sm:p-4 border-b border-app-border-subtle flex items-center justify-between bg-app-sidebar">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-app-text-primary tracking-tight">
                Completadas
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-app-active-pill text-app-text-secondary font-medium">
                {completedCards.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setAddingInColumn('completed');
                setNewCardTitle('');
                setNewCardContent('');
                setNewCardLinkedNoteId('');
              }}
              className="p-1.5 rounded-lg hover:bg-app-active-pill text-app-text-secondary hover:text-app-text-primary transition-colors inline-flex items-center justify-center"
              title="Añadir tarea completada"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            </button>
          </div>

          {/* Lista de Completadas */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 min-h-[100px]">
            {renderAddForm('completed')}

            {completedCards.length === 0 && addingInColumn !== 'completed' && (
              <div className="h-28 flex items-center justify-center text-center text-app-text-secondary/50 text-xs border border-dashed border-app-border-subtle/60 rounded-xl">
                Las tareas completadas aparecerán aquí
              </div>
            )}

            {completedCards.map((card) => renderCard(card))}
          </div>
        </div>
      </div>
    </div>
  );
};
