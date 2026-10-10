import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  FileText,
  Info,
  FolderInput,
  Trash2,
  CheckSquare,
  Columns2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const NoteTabsBar: React.FC = () => {
  const {
    notes,
    folders,
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
    isSidebarOpen,
    toggleSidebar,
    setMobileView,
    setNav,
    moveNoteToFolder,
    deleteNote,
  } = useAppStore();

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const infoModalRef = useRef<HTMLDivElement>(null);
  const folderMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar popovers al hacer clic fuera sin usar overlays invisibles que bloqueen clics
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (infoModalRef.current && !infoModalRef.current.contains(e.target as Node)) {
        setShowInfoModal(false);
      }
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target as Node)) {
        setShowFolderMenu(false);
      }
    };
    if (showInfoModal || showFolderMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showInfoModal, showFolderMenu]);

  const activeOpenNoteIds = useMemo(() => {
    return openNoteIds.filter((id) => {
      const n = notes.find((item) => item.id === id);
      return n && !n.deletedAt;
    });
  }, [openNoteIds, notes]);

  const activeNotesCount = useMemo(() => {
    return notes.filter((n) => !n.deletedAt).length;
  }, [notes]);

  const currentActiveId = splitView && activePane === 'right' && secondaryNoteId ? secondaryNoteId : activeNoteId;

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === currentActiveId) || null;
  }, [notes, currentActiveId]);

  const currentFolder = useMemo(() => {
    if (!activeNote?.folderId) return null;
    return folders.find((f) => f.id === activeNote.folderId) || null;
  }, [folders, activeNote]);

  const stats = useMemo(() => {
    if (!activeNote) return { words: 0, chars: 0, readingTime: 1 };
    const plainText = (activeNote.content || '').replace(/<[^>]+>/g, ' ').trim();
    const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
    const chars = plainText.length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readingTime };
  }, [activeNote]);

  if (activeOpenNoteIds.length === 0 && !activeNoteId) {
    return null;
  }

  const handleDeleteActiveNote = () => {
    if (!activeNote) return;
    if (window.confirm(`¿Eliminar la nota "${activeNote.title || 'sin título'}"?`)) {
      deleteNote(activeNote.id);
    }
  };

  return (
    <div data-tabs-bar className="relative z-30 flex items-center justify-between px-2.5 py-1.5 border-b border-app-border-subtle bg-app-sidebar/60 backdrop-blur-md select-none">
      {/* Controles de ventana a la izquierda: Solo colapsar carpetas (sin X redundante) */}
      <div className="flex items-center gap-1 shrink-0 pr-2 border-r border-app-border-subtle/60 mr-1.5">
        <button
          type="button"
          onClick={() => setMobileView('list')}
          className="md:hidden flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title="Volver a carpetas"
        >
          <i className="fi fi-rr-angle-small-left text-base leading-none" />
          <span>Carpetas</span>
        </button>

        <button
          type="button"
          onClick={toggleSidebar}
          className={`w-7 h-7 rounded-lg hidden md:flex items-center justify-center transition-all ${
            !isSidebarOpen
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
              : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10'
          }`}
          title={isSidebarOpen ? 'Ocultar panel de carpetas (Ctrl + \\)' : 'Mostrar panel de carpetas (Ctrl + \\)'}
          aria-label="Alternar panel de carpetas"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4 stroke-[1.8]" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 stroke-[2] text-blue-600 dark:text-blue-400" />
          )}
        </button>
      </div>

      {/* Lista de pestañas desplazable */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0">
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
              data-note-tab
              onClick={() => selectNote(id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer border ${
                isFocusedPane
                  ? 'bg-app-editor text-app-text-primary font-medium shadow-sm border-app-border-subtle ring-1 ring-black/5 dark:ring-white/10 is-active'
                  : isActive
                  ? 'bg-app-editor/80 text-app-text-primary font-medium border-app-border-subtle/60 is-active'
                  : 'text-app-text-secondary hover:text-app-text-primary hover:bg-app-editor/50 border-transparent'
              }`}
              title={displayTitle}
            >
              <FileText className={`w-3.5 h-3.5 stroke-[1.8] shrink-0 ${isActive ? 'text-app-action-primary' : 'opacity-60'}`} />
              <span className="truncate max-w-[130px]">{displayTitle}</span>

              {splitView && isLeft && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-app-active-pill text-app-text-primary">
                  Panel 1
                </span>
              )}
              {splitView && isRight && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-app-active-pill text-app-text-primary">
                  Panel 2
                </span>
              )}

              {/* Botón X de la pestaña: centrado geométricamente con SVG */}
              <button
                type="button"
                aria-label={`Cerrar pestaña ${displayTitle}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeNoteTab(id);
                }}
                className="w-4 h-4 rounded-md flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all ml-1 shrink-0"
              >
                <X className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          );
        })}

        {/* Botón para añadir nueva pestaña / nota */}
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          aria-label="Añadir pestaña"
          title="Añadir pestaña (+)"
          className="p-1.5 rounded-lg text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors inline-flex items-center justify-center"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />
        </button>
      </div>

      {/* Acciones unificadas en una sola barra a la derecha */}
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {/* 1. Cerrar todas las pestañas (primero a la izquierda) */}
        {activeOpenNoteIds.length > 0 && (
          <button
            type="button"
            onClick={closeAllTabs}
            aria-label="Cerrar todas las notas"
            title="Cerrar todas las notas"
            className="px-2 py-1 rounded-lg text-[11px] text-app-text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            Cerrar todas
          </button>
        )}

        {/* 2. Paralelo (Split View): icono SVG perfectamente centrado y alineado */}
        {activeOpenNoteIds.length > 1 && activeNotesCount > 1 && (
          <button
            type="button"
            onClick={toggleSplitView}
            aria-label={splitView ? 'Desactivar vista dividida' : 'Ver varias notas al mismo tiempo (Split View)'}
            title={splitView ? 'Vista única' : 'Ver varias notas al mismo tiempo'}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1.5 text-xs ${
              splitView
                ? 'bg-app-action-primary text-app-action-primary-text shadow-sm font-medium'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5 stroke-[1.8] shrink-0" />
            <span className="hidden sm:inline text-[11px] font-medium leading-none">
              {splitView ? 'Dividida' : 'Paralelo'}
            </span>
          </button>
        )}

        {/* Separador vertical sutil */}
        {activeNote && (activeOpenNoteIds.length > 0 || (activeOpenNoteIds.length > 1 && activeNotesCount > 1)) && (
          <div className="w-[1px] h-3.5 bg-app-border-subtle/80 mx-0.5" />
        )}

        {/* 3. Iconos de acción de la nota activa (todos interactivos y 100% operativos) */}
        {activeNote && (
          <div className="flex items-center gap-0.5">
            {/* Ver en grafo */}
            <button
              type="button"
              onClick={() => setNav('canvas')}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Ver conexiones en grafo"
            >
              <FileText className="w-4 h-4 stroke-[1.8]" />
            </button>

            {/* Información de la nota (i) */}
            <div className="relative" ref={infoModalRef}>
              <button
                type="button"
                onClick={() => {
                  setShowFolderMenu(false);
                  setShowInfoModal((v) => !v);
                }}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                  showInfoModal
                    ? 'bg-black/10 dark:bg-white/15 text-app-text-primary'
                    : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title="Información de la nota"
              >
                <Info className="w-4 h-4 stroke-[1.8]" />
              </button>

              {showInfoModal && (
                <div className="absolute right-0 top-full mt-1.5 bg-app-editor dark:bg-[#18181b] border border-app-border-subtle rounded-2xl shadow-2xl p-4 w-64 z-50 text-app-text-primary backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100">
                  <h4 className="text-xs font-bold text-app-text-primary mb-2.5 pb-1.5 border-b border-app-border-subtle">
                    Detalles de la nota
                  </h4>
                  <div className="space-y-2 text-xs text-app-text-secondary">
                    <div className="flex items-center justify-between">
                      <span>Palabras:</span>
                      <span className="font-semibold text-app-text-primary">{stats.words}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Caracteres:</span>
                      <span className="font-semibold text-app-text-primary">{stats.chars}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Lectura estimada:</span>
                      <span className="font-semibold text-app-text-primary">~{stats.readingTime} min</span>
                    </div>
                    {currentFolder && (
                      <div className="flex items-center justify-between">
                        <span>Carpeta:</span>
                        <span className="font-semibold text-app-text-primary">{currentFolder.name}</span>
                      </div>
                    )}
                    {activeNote.updatedAt && (
                      <div className="pt-2 border-t border-app-border-subtle text-[11px] text-app-text-secondary/80">
                        <span>Modificado: {new Date(activeNote.updatedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mover a carpeta (FolderInput) */}
            <div className="relative" ref={folderMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setShowInfoModal(false);
                  setShowFolderMenu((v) => !v);
                }}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                  showFolderMenu
                    ? 'bg-black/10 dark:bg-white/15 text-app-text-primary'
                    : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title={currentFolder ? `Mover (en ${currentFolder.name})` : 'Mover a carpeta'}
              >
                <FolderInput className="w-4 h-4 stroke-[1.8]" />
              </button>

              {showFolderMenu && (
                <div className="absolute right-0 top-full mt-1.5 bg-app-editor dark:bg-[#18181b] border border-app-border-subtle rounded-xl shadow-xl py-1.5 w-48 z-50 text-xs text-app-text-primary animate-in fade-in zoom-in-95 duration-100">
                  <span className="px-3 py-1 text-[10px] font-bold text-app-text-secondary uppercase tracking-wider block">
                    Mover a carpeta
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      moveNoteToFolder(activeNote.id, undefined);
                      setShowFolderMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                      !activeNote.folderId ? 'font-semibold text-blue-600 dark:text-blue-400' : ''
                    }`}
                  >
                    <span>Sin carpeta</span>
                    {!activeNote.folderId && <CheckSquare className="w-3.5 h-3.5" />}
                  </button>
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        moveNoteToFolder(activeNote.id, f.id);
                        setShowFolderMenu(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                        activeNote.folderId === f.id ? 'font-semibold text-blue-600 dark:text-blue-400' : ''
                      }`}
                    >
                      <span className="truncate">{f.name}</span>
                      {activeNote.folderId === f.id && <CheckSquare className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Eliminar nota */}
            <button
              type="button"
              onClick={handleDeleteActiveNote}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-app-text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title="Enviar nota a la papelera"
            >
              <Trash2 className="w-4 h-4 stroke-[1.8]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
