import { useEffect, useMemo, useState, useRef } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Dock } from './features/dock/Dock';
import { NoteEditor } from './features/editor/NoteEditor';
import { NoteTabsBar } from './features/editor/NoteTabsBar';
import { OpenOrCreateModal } from './features/editor/OpenOrCreateModal';
import { CommandPalette } from './features/search/CommandPalette';
import { SettingsModal } from './features/settings/SettingsModal';
import { FolderSidebar } from './features/folders/FolderSidebar';
import { FolderEmptyState } from './features/folders/FolderEmptyState';
import { NotesBoardView } from './features/board/NotesBoardView';
import { TrashModal } from './features/trash/TrashModal';
import { HomeQuickNoteView } from './features/notes/HomeQuickNoteView';
import { useAppStore } from './store/useAppStore';
import { flushPendingSave } from './services/storage/noteSaveManager';

export default function App() {
  const {
    activeNav,
    notes,
    folders,
    activeFolderId,
    activeNoteId,
    secondaryNoteId,
    openNoteIds,
    splitView,
    activePane,
    isLoading,
    setNav,
    setSearchOpen,
    setActivePane,
    loadNotes,
    selectNote,
    closeNoteTab,
    createNote,
    deleteNote,
    updateNote,
    persistenceError,
    setPersistenceError,
    mobileView,
    isSettingsOpen,
    setSettingsOpen,
    isSidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    sidebarWidth,
    setSidebarWidth,
  } = useAppStore();

  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(sidebarWidth);

  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingDivider(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = isSidebarOpen ? sidebarWidth : 0;
  };

  useEffect(() => {
    if (!isDraggingDivider) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartXRef.current;

      if (!isSidebarOpen) {
        // Si estaba cerrado y se arrastra hacia la derecha más de 20px, se abre
        if (deltaX > 20) {
          setSidebarOpen(true);
          const newWidth = Math.min(Math.max(260, 220), 280);
          setSidebarWidth(newWidth);
          dragStartWidthRef.current = newWidth;
          dragStartXRef.current = e.clientX;
        }
        return;
      }

      // Si estaba abierto y se arrastra hacia la izquierda por debajo de 150px, se colapsa
      const targetWidth = dragStartWidthRef.current + deltaX;
      if (targetWidth < 150) {
        setSidebarOpen(false);
      } else {
        const clamped = Math.min(Math.max(targetWidth, 220), 280);
        setSidebarWidth(clamped);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingDivider(false);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingDivider, isSidebarOpen, setSidebarOpen, setSidebarWidth]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Asegurar persistencia de cambios pendientes al cerrar o desenfocar ventana
  useEffect(() => {
    const handleFlush = () => {
      flushPendingSave();
    };
    window.addEventListener('beforeunload', handleFlush);
    window.addEventListener('blur', handleFlush);
    return () => {
      window.removeEventListener('beforeunload', handleFlush);
      window.removeEventListener('blur', handleFlush);
    };
  }, []);

  // Atajo global Ctrl+\ o Cmd+\ para colapsar/expandir barra lateral
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const activeNotes = useMemo(() => {
    return notes.filter((n) => !n.deletedAt);
  }, [notes]);

  const activeNote = useMemo(() => {
    return activeNotes.find((n) => n.id === activeNoteId) || null;
  }, [activeNotes, activeNoteId]);

  const secondaryNote = useMemo(() => {
    if (!splitView) return null;
    const targetId =
      secondaryNoteId && secondaryNoteId !== activeNote?.id
        ? secondaryNoteId
        : openNoteIds.find((id) => id !== activeNote?.id && activeNotes.some((n) => n.id === id)) ||
          activeNotes.find((n) => n.id !== activeNote?.id)?.id;

    if (!targetId || targetId === activeNote?.id) return null;
    return activeNotes.find((n) => n.id === targetId) || null;
  }, [splitView, secondaryNoteId, openNoteIds, activeNote?.id, activeNotes]);


  const activeFolderName = useMemo(() => {
    if (!activeFolderId) return undefined;
    return folders.find((f) => f.id === activeFolderId && !f.deletedAt)?.name;
  }, [folders, activeFolderId]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-app-canvas flex items-center justify-center text-app-text-secondary text-body">
        Cargando notas...
      </div>
    );
  }

  return (
    <>
      <AppShell
        dock={
          <Dock
            activeItem={activeNav}
            onSelectItem={setNav}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        }
        editor={
          activeNav === 'home' ? (
            <HomeQuickNoteView onOpenNotes={() => setNav('notes')} />
          ) : activeNav === 'board' || activeNav === 'todo' ? (
            <NotesBoardView
              onOpenNote={(noteId) => {
                selectNote(noteId);
                setNav('notes');
              }}
            />
          ) : (
            <div className="flex-1 h-full flex overflow-hidden rounded-sheet shadow-sheet border border-app-border-subtle bg-app-editor relative">
              {/* Barra lateral de carpetas en vista Notas (Colapsable y redimensionable con animación) */}
              <div
                style={{
                  width: isSidebarOpen ? `${sidebarWidth}px` : '0px',
                }}
                className={`h-full shrink-0 overflow-hidden ${
                  isDraggingDivider ? '' : 'transition-[width,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]'
                } ${
                  mobileView === 'editor' && activeNote ? 'hidden md:block' : 'block'
                } ${
                  isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <div className="w-full h-full">
                  <FolderSidebar
                    onSelectNote={selectNote}
                    activeNoteId={activeNote?.id}
                    onOpenSearch={() => setSearchOpen(true)}
                  />
                </div>
              </div>

              {/* Divisor arrastrable tipo VS Code entre carpetas y editor */}
              <div
                onMouseDown={handleDividerMouseDown}
                onDoubleClick={toggleSidebar}
                className={`hidden md:flex items-center justify-center w-2 -ml-1 cursor-col-resize select-none shrink-0 relative z-30 group ${
                  isDraggingDivider ? 'bg-blue-500/15' : 'hover:bg-blue-500/10'
                }`}
                title="Arrastra para redimensionar o colapsar (doble clic para alternar)"
              >
                <div
                  className={`w-[1.5px] h-full transition-colors ${
                    isDraggingDivider
                      ? 'bg-blue-500 shadow-sm'
                      : 'bg-app-border-subtle group-hover:bg-blue-400'
                  }`}
                />
              </div>

              {/* Área central: Editor o Estado Vacío */}
              <div
                className={`flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-app-canvas ${
                  !activeNote || mobileView === 'list' ? 'hidden md:flex' : 'flex'
                }`}
              >
                {activeNote ? (
                  <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-app-editor">
                    {/* Barra de pestañas de notas abiertas */}
                    <NoteTabsBar />

                    {/* Área del editor: simple o dividida */}
                    <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
                      <div
                        onPointerDownCapture={() => setActivePane('left')}
                        onFocusCapture={() => setActivePane('left')}
                        className={`flex-1 h-full min-w-0 transition-all ${
                          splitView && activePane !== 'left' ? 'opacity-85' : 'opacity-100'
                        }`}
                      >
                        <NoteEditor
                          key={activeNote.id}
                          note={activeNote}
                          onChangeTitle={(title) => updateNote(activeNote.id, title, activeNote.content)}
                          onChangeContent={(content) => updateNote(activeNote.id, activeNote.title, content)}
                          onClose={() => closeNoteTab(activeNote.id)}
                          onDeleteNote={() => {
                            if (window.confirm(`¿Eliminar la nota "${activeNote.title || 'sin título'}"?`)) {
                              deleteNote(activeNote.id);
                            }
                          }}
                        />
                      </div>

                      {splitView && secondaryNote && secondaryNote.id !== activeNote.id && (
                        <div
                          onPointerDownCapture={() => setActivePane('right')}
                          onFocusCapture={() => setActivePane('right')}
                          className={`flex-1 h-full min-w-0 border-l border-app-border-subtle transition-all ${
                            splitView && activePane !== 'right' ? 'opacity-85' : 'opacity-100'
                          }`}
                        >
                          <NoteEditor
                            key={secondaryNote.id}
                            note={secondaryNote}
                            onChangeTitle={(title) => updateNote(secondaryNote.id, title, secondaryNote.content)}
                            onChangeContent={(content) => updateNote(secondaryNote.id, secondaryNote.title, content)}
                            onClose={() => closeNoteTab(secondaryNote.id)}
                            onDeleteNote={() => {
                              if (window.confirm(`¿Eliminar la nota "${secondaryNote.title || 'sin título'}"?`)) {
                                deleteNote(secondaryNote.id);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <FolderEmptyState
                    folderName={activeFolderName}
                    onCreateNote={() => createNote()}
                    onQuickNote={() => setNav('home')}
                  />
                )}
              </div>
            </div>
          )
        }
      />
      <CommandPalette />
      <SettingsModal
        isOpen={isSettingsOpen || activeNav === 'settings'}
        onClose={() => {
          setSettingsOpen(false);
          if (activeNav === 'settings') {
            setNav('notes');
          }
        }}
      />
      <OpenOrCreateModal />
      <TrashModal />

      {/* Banner de error de persistencia (docs/04-code-standards.md 48.7) */}
      {persistenceError && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-medium shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 select-none">
          <span>⚠️ {persistenceError}</span>
          <button
            type="button"
            onClick={() => setPersistenceError(null)}
            className="underline text-[11px] text-white/80 hover:text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}
    </>
  );
}
