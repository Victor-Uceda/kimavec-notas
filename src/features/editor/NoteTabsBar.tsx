import React from 'react';
import { useAppStore } from '../../store/useAppStore';

export const NoteTabsBar: React.FC = () => {
  const {
    notes,
    openNoteIds,
    activeNoteId,
    secondaryNoteId,
    splitView,
    activePane,
    selectNote,
    closeNoteTab,
    closeAllTabs,
    setAddModalOpen,
    toggleSplitView,
  } = useAppStore();

  const activeOpenNoteIds = React.useMemo(() => {
    return openNoteIds.filter((id) => {
      const n = notes.find((item) => item.id === id);
      return n && !n.deletedAt;
    });
  }, [openNoteIds, notes]);

  const activeNotesCount = React.useMemo(() => {
    return notes.filter((n) => !n.deletedAt).length;
  }, [notes]);

  if (activeOpenNoteIds.length <= 1 && !splitView) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-2 py-1.5 border-b border-black/[0.06] bg-white/40 backdrop-blur-md select-none">
      {/* Lista de pestañas desplazable */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[calc(100%-140px)]">
        {activeOpenNoteIds.map((id) => {
          const note = notes.find((n) => n.id === id);
          const isLeft = splitView && id === activeNoteId;
          const isRight = splitView && id === secondaryNoteId && id !== activeNoteId;
          const isActive = splitView ? isLeft || isRight : id === activeNoteId;
          const isFocusedPane = splitView
            ? (activePane === 'left' && isLeft) || (activePane === 'right' && isRight)
            : isActive;

          const displayTitle = note?.title?.trim() || 'Sin título';

          return (
            <div
              key={id}
              onClick={() => selectNote(id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer border ${
                isFocusedPane
                  ? 'bg-white/95 text-app-text-primary font-medium shadow-sm border-black/[0.12] ring-1 ring-black/5'
                  : isActive
                  ? 'bg-white/80 text-app-text-primary font-medium border-black/[0.06]'
                  : 'text-app-text-secondary hover:text-app-text-primary hover:bg-white/50 border-transparent'
              }`}
              title={displayTitle}
            >
              <i className={`fi fi-rr-document text-xs leading-none shrink-0 ${isActive ? 'text-app-accent font-semibold' : 'opacity-60'}`} />
              <span className="truncate max-w-[130px]">{displayTitle}</span>

              {splitView && isLeft && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-black/10 text-app-text-primary">
                  Panel 1
                </span>
              )}
              {splitView && isRight && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-black/10 text-app-text-primary">
                  Panel 2
                </span>
              )}

              <button
                type="button"
                aria-label={`Cerrar pestaña ${displayTitle}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeNoteTab(id);
                }}
                className="w-4 h-4 rounded flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-black/10 transition-opacity ml-0.5"
              >
                <i className="fi fi-rr-cross-small text-xs leading-none" />
              </button>
            </div>
          );
        })}

        {/* Botón para añadir nueva pestaña / nota: abre selector crear o abrir existente */}
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          aria-label="Añadir pestaña"
          title="Añadir pestaña (+)"
          className="p-1.5 rounded-lg text-app-text-secondary hover:text-app-text-primary hover:bg-white/60 transition-colors flex items-center justify-center"
        >
          <i className="fi fi-rr-plus text-xs leading-none" />
        </button>
      </div>

      {/* Acciones de ventana: Cerrar todas & Split View */}
      <div className="flex items-center gap-1 shrink-0">
        {activeOpenNoteIds.length > 0 && (
          <button
            type="button"
            onClick={closeAllTabs}
            aria-label="Cerrar todas las notas"
            title="Cerrar todas las notas"
            className="px-2 py-1 rounded-lg text-[11px] text-app-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            Cerrar todas
          </button>
        )}

        {/* Solo mostrar la opción de Paralelo si hay más de 1 nota abierta y disponible */}
        {activeOpenNoteIds.length > 1 && activeNotesCount > 1 && (
          <button
            type="button"
            onClick={toggleSplitView}
            aria-label={splitView ? 'Desactivar vista dividida' : 'Ver varias notas al mismo tiempo (Split View)'}
            title={splitView ? 'Vista única' : 'Ver varias notas al mismo tiempo'}
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs ${
              splitView
                ? 'bg-black text-white shadow-sm font-medium'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-white/60'
            }`}
          >
            <i className="fi fi-rr-columns-3 text-xs leading-none" />
            <span className="hidden sm:inline text-[11px] pr-0.5">
              {splitView ? 'Dividida' : 'Paralelo'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
