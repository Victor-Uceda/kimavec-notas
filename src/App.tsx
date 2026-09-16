import { useEffect, useMemo } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Dock } from './features/dock/Dock';
import { NoteEditor } from './features/editor/NoteEditor';
import { NoteTabsBar } from './features/editor/NoteTabsBar';
import { OpenOrCreateModal } from './features/editor/OpenOrCreateModal';
import { TaskPanel } from './features/tasks/TaskPanel';
import { CommandPalette } from './features/search/CommandPalette';
import { GraphCanvas } from './features/graph/GraphCanvas';
import { SettingsModal } from './features/settings/SettingsModal';
import { FolderSidebar } from './features/folders/FolderSidebar';
import { FolderEmptyState } from './features/folders/FolderEmptyState';
import { NotesBoardView } from './features/board/NotesBoardView';
import { TodoView } from './features/tasks/TodoView';
import { TrashModal } from './features/trash/TrashModal';
import { HomeQuickNoteView } from './features/notes/HomeQuickNoteView';
import { useAppStore } from './store/useAppStore';
import { extractTasksFromMarkdown } from './utils/taskParser';

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
    taskFilter,
    isLoading,
    isTaskPanelOpen,
    toggleTaskPanel,
    setNav,
    setTaskFilter,
    setSearchOpen,
    setAddModalOpen,
    setActivePane,
    loadNotes,
    selectNote,
    closeNoteTab,
    createNote,
    deleteNote,
    cleanEmptyNotes,
    updateNote,
    toggleTask,
    deleteTask,
    clearCompletedTasks,
    addManualTask,
    persistenceError,
    setPersistenceError,
  } = useAppStore();

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

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

  // Nota enfocada actualmente: cambia si estás en Panel 1 o Panel 2
  const focusedNote = useMemo(() => {
    if (splitView && activePane === 'right' && secondaryNote) {
      return secondaryNote;
    }
    return activeNote;
  }, [splitView, activePane, secondaryNote, activeNote]);

  // Tareas extraídas reactivamente del cuerpo de la nota seleccionada
  const currentTasks = useMemo(() => {
    if (!focusedNote) return [];
    return extractTasksFromMarkdown(focusedNote.content, focusedNote.id);
  }, [focusedNote]);

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
            notes={activeNotes}
            activeNoteId={activeNote?.id || ''}
            onSelectItem={setNav}
            onSelectNote={selectNote}
            onCreateNote={async () => {
              const newId = await createNote();
              selectNote(newId);
              setNav('notes');
            }}
            onOpenAddModal={() => setAddModalOpen(true)}
            onDeleteNote={deleteNote}
            onCleanEmptyNotes={cleanEmptyNotes}
            onOpenSearch={() => setSearchOpen(true)}
          />
        }
        editor={
          activeNav === 'home' ? (
            <HomeQuickNoteView onOpenNotes={() => setNav('notes')} />
          ) : activeNav === 'canvas' ? (
            <GraphCanvas onClose={() => setNav('notes')} />
          ) : activeNav === 'board' ? (
            <NotesBoardView
              onOpenNote={(noteId) => {
                selectNote(noteId);
                setNav('notes');
              }}
            />
          ) : activeNav === 'todo' ? (
            <TodoView
              onOpenNote={(noteId) => {
                selectNote(noteId);
                setNav('notes');
              }}
            />
          ) : (
            <div className="flex-1 h-full flex overflow-hidden rounded-sheet shadow-sheet border border-app-border-subtle bg-white">
              {/* Barra lateral de carpetas en vista Notas */}
              <FolderSidebar
                onSelectNote={selectNote}
                activeNoteId={activeNote?.id}
                onOpenSearch={() => setSearchOpen(true)}
              />

              {/* Área central: Editor o Estado Vacío */}
              <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-app-canvas">
                {activeNote ? (
                  <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-white">
                    {/* Barra de pestañas de notas abiertas */}
                    <NoteTabsBar />

                    {/* Área del editor: simple o dividida */}
                    <div className="flex-1 min-h-0 flex overflow-hidden">
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
                          onOpenGraph={() => setNav('canvas')}
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
                            onOpenGraph={() => setNav('canvas')}
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
        tasks={
          isTaskPanelOpen && focusedNote && (activeNav === 'notes' || activeNav === 'home') ? (
            <TaskPanel
              noteTitle={focusedNote.title}
              tasks={currentTasks}
              filter={taskFilter}
              onChangeFilter={setTaskFilter}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onClearCompleted={clearCompletedTasks}
              onAddTask={addManualTask}
              onClose={() => toggleTaskPanel(false)}
            />
          ) : undefined
        }
      />
      <CommandPalette />
      <SettingsModal
        isOpen={activeNav === 'settings'}
        onClose={() => setNav('notes')}
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
