import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

type TrashTab = 'notes' | 'folders' | 'tasks';

export const TrashModal: React.FC = () => {
  const {
    isTrashOpen,
    setTrashOpen,
    notes,
    folders,
    boardCards,
    standaloneTasks,
    restoreNote,
    deleteNotePermanently,
    restoreFolder,
    deleteFolderPermanently,
    restoreBoardCard,
    deleteBoardCardPermanently,
    restoreStandaloneTask,
    deleteStandaloneTaskPermanently,
    emptyTrash,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TrashTab>('notes');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  useEffect(() => {
    if (feedbackToast) {
      const timer = setTimeout(() => setFeedbackToast(null), 2200);
      return () => clearTimeout(timer);
    }
  }, [feedbackToast]);

  // Manejador para cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTrashOpen) {
        setTrashOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTrashOpen, setTrashOpen]);

  const trashedNotes = useMemo(() => {
    return notes.filter((n) => !!n.deletedAt).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  }, [notes]);

  const trashedFolders = useMemo(() => {
    return folders.filter((f) => !!f.deletedAt).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  }, [folders]);

  const trashedCards = useMemo(() => {
    return boardCards.filter((c) => !!c.deletedAt).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  }, [boardCards]);

  const trashedStandaloneTasks = useMemo(() => {
    return (standaloneTasks || []).filter((t) => !!t.deletedAt).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  }, [standaloneTasks]);

  const totalTrashedCount = trashedNotes.length + trashedFolders.length + trashedCards.length + trashedStandaloneTasks.length;

  if (!isTrashOpen) return null;

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
  };

  const handleEmptyTrash = async () => {
    if (totalTrashedCount === 0) return;
    if (window.confirm('¿Vaciar toda la papelera permanentemente? Esta acción no se puede deshacer.')) {
      await emptyTrash();
      showToast('Papelera vaciada por completo');
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={() => setTrashOpen(false)} />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-app-border-subtle flex flex-col max-h-[85vh] overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Cabecera minimalista: solo título */}
        <div className="px-5 py-4 border-b border-app-border-subtle flex items-center justify-between bg-white">
          <h2 className="text-panel-title font-bold text-app-text-primary tracking-tight">
            Papelera
          </h2>

          <div className="flex items-center gap-2">
            {totalTrashedCount > 0 && (
              <button
                type="button"
                onClick={handleEmptyTrash}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                title="Vaciar papelera"
              >
                Vaciar papelera
              </button>
            )}

            <button
              type="button"
              onClick={() => setTrashOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 transition-colors"
              title="Cerrar (Esc)"
            >
              <i className="fi fi-rr-cross-small text-base leading-none" />
            </button>
          </div>
        </div>

        {/* Pestañas limpias: Notas, Carpetas, Tareas */}
        <div className="px-5 pt-3 border-b border-app-border-subtle flex items-center gap-4 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`pb-2.5 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'notes'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-app-text-secondary hover:text-app-text-primary'
            }`}
          >
            <i className="fi fi-rr-document text-xs leading-none" />
            <span>Notas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 text-app-text-secondary">
              {trashedNotes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('folders')}
            className={`pb-2.5 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'folders'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-app-text-secondary hover:text-app-text-primary'
            }`}
          >
            <i className="fi fi-rr-folder text-xs leading-none" />
            <span>Carpetas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 text-app-text-secondary">
              {trashedFolders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`pb-2.5 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'tasks'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-app-text-secondary hover:text-app-text-primary'
            }`}
          >
            <i className="fi fi-rr-chart-kanban text-xs leading-none" />
            <span>Tareas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 text-app-text-secondary">
              {trashedCards.length}
            </span>
          </button>
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 bg-[#F9FAFB]/50 min-h-[260px]">
          {/* Pestaña Notas */}
          {activeTab === 'notes' && (
            <>
              {trashedNotes.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-2 text-app-text-secondary/60">
                    <i className="fi fi-rr-document text-xl leading-none" />
                  </div>
                  <p className="text-xs font-medium text-app-text-primary">No hay notas en la papelera</p>
                  <p className="text-[11px] text-app-text-secondary mt-0.5">
                    Las notas que elimines aparecerán aquí
                  </p>
                </div>
              ) : (
                trashedNotes.map((note) => {
                  const folder = note.folderId ? folders.find((f) => f.id === note.folderId) : null;
                  return (
                    <div
                      key={note.id}
                      className="p-3.5 bg-white border border-app-border-subtle rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-black/15 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <i className="fi fi-rr-document text-base text-app-text-secondary shrink-0 leading-none" />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-app-text-primary truncate">
                            {note.title.trim() || 'Nota sin título'}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-app-text-secondary">
                            {folder ? (
                              <span className="flex items-center gap-1">
                                <i className="fi fi-rr-folder text-[10px] leading-none" />
                                {folder.name}
                              </span>
                            ) : (
                              <span>Sin carpeta</span>
                            )}
                            <span>•</span>
                            <span>Eliminado: {formatDate(note.deletedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            await restoreNote(note.id);
                            showToast(`Nota "${note.title || 'sin título'}" restaurada`);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100/80 transition-colors flex items-center gap-1"
                          title="Restaurar nota"
                        >
                          <i className="fi fi-rr-rotate-left text-xs leading-none" />
                          <span>Restaurar</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`¿Eliminar definitivamente "${note.title || 'sin título'}"?`)) {
                              await deleteNotePermanently(note.id);
                              showToast('Nota eliminada definitivamente');
                            }
                          }}
                          className="p-1.5 rounded-lg text-xs text-app-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar definitivamente"
                        >
                          <i className="fi fi-rr-trash text-xs leading-none" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* Pestaña Carpetas */}
          {activeTab === 'folders' && (
            <>
              {trashedFolders.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-2 text-app-text-secondary/60">
                    <i className="fi fi-rr-folder text-xl leading-none" />
                  </div>
                  <p className="text-xs font-medium text-app-text-primary">No hay carpetas en la papelera</p>
                  <p className="text-[11px] text-app-text-secondary mt-0.5">
                    Las carpetas que elimines aparecerán aquí
                  </p>
                </div>
              ) : (
                trashedFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className="p-3.5 bg-white border border-app-border-subtle rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-black/15 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <i className="fi fi-rr-folder text-base text-blue-600 shrink-0 leading-none" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-app-text-primary truncate">
                          {folder.name}
                        </h4>
                        <p className="text-[11px] text-app-text-secondary mt-0.5">
                          Eliminada: {formatDate(folder.deletedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          await restoreFolder(folder.id);
                          showToast(`Carpeta "${folder.name}" restaurada`);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100/80 transition-colors flex items-center gap-1"
                        title="Restaurar carpeta"
                      >
                        <i className="fi fi-rr-rotate-left text-xs leading-none" />
                        <span>Restaurar</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`¿Eliminar definitivamente la carpeta "${folder.name}"?`)) {
                            await deleteFolderPermanently(folder.id);
                            showToast('Carpeta eliminada definitivamente');
                          }
                        }}
                        className="p-1.5 rounded-lg text-xs text-app-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar definitivamente"
                      >
                        <i className="fi fi-rr-trash text-xs leading-none" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* Pestaña Tareas */}
          {activeTab === 'tasks' && (
            <>
              {trashedCards.length === 0 && trashedStandaloneTasks.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-2 text-app-text-secondary/60">
                    <i className="fi fi-rr-clipboard-list-check text-xl leading-none" />
                  </div>
                  <p className="text-xs font-medium text-app-text-primary">No hay tareas en la papelera</p>
                  <p className="text-[11px] text-app-text-secondary mt-0.5">
                    Las tareas eliminadas aparecerán aquí
                  </p>
                </div>
              ) : (
                <>
                  {/* Tareas independientes de Por hacer */}
                  {trashedStandaloneTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 bg-white border border-app-border-subtle rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-black/15 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <i className="fi fi-rr-check-circle text-base text-app-text-secondary shrink-0 leading-none" />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-app-text-primary truncate">
                            {task.title.trim() || 'Tarea sin título'}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-app-text-secondary">
                            <span>Por hacer</span>
                            <span>•</span>
                            <span>Eliminado: {formatDate(task.deletedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            await restoreStandaloneTask(task.id);
                            showToast(`Tarea "${task.title}" restaurada`);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100/80 transition-colors flex items-center gap-1"
                          title="Restaurar tarea"
                        >
                          <i className="fi fi-rr-rotate-left text-xs leading-none" />
                          <span>Restaurar</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`¿Eliminar definitivamente "${task.title}"?`)) {
                              await deleteStandaloneTaskPermanently(task.id);
                              showToast('Tarea eliminada definitivamente');
                            }
                          }}
                          className="p-1.5 rounded-lg text-xs text-app-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar definitivamente"
                        >
                          <i className="fi fi-rr-trash text-xs leading-none" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Tarjetas del tablero */}
                  {trashedCards.map((card) => (
                    <div
                      key={card.id}
                      className="p-3.5 bg-white border border-app-border-subtle rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-black/15 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <i className="fi fi-rr-chart-kanban text-base text-app-text-secondary shrink-0 leading-none" />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-app-text-primary truncate">
                            {card.title.trim() || 'Tarjeta sin título'}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-app-text-secondary">
                            <span className="capitalize">
                              {card.status === 'planned' ? 'Planeadas' : card.status === 'in_progress' ? 'En progreso' : 'Completada'}
                            </span>
                            {card.dueDate && (
                              <>
                                <span>•</span>
                                <span>Límite: {card.dueDate}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>Eliminado: {formatDate(card.deletedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            await restoreBoardCard(card.id);
                            showToast(`Tarea "${card.title || 'sin título'}" restaurada`);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100/80 transition-colors flex items-center gap-1"
                          title="Restaurar tarjeta"
                        >
                          <i className="fi fi-rr-rotate-left text-xs leading-none" />
                          <span>Restaurar</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`¿Eliminar definitivamente "${card.title || 'sin título'}"?`)) {
                              await deleteBoardCardPermanently(card.id);
                              showToast('Tarjeta eliminada definitivamente');
                            }
                          }}
                          className="p-1.5 rounded-lg text-xs text-app-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar definitivamente"
                        >
                          <i className="fi fi-rr-trash text-xs leading-none" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Feedback toast flotante */}
        {feedbackToast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-medium shadow-2xl backdrop-blur-md border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{feedbackToast}</span>
          </div>
        )}
      </div>
    </div>
  );
};
