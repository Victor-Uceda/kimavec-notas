import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { Folder, Note } from '../../types';

interface FolderSidebarProps {
  onSelectNote: (noteId: string) => void;
  activeNoteId?: string;
  onOpenSearch?: () => void;
}

export const FolderSidebar: React.FC<FolderSidebarProps> = ({
  onSelectNote,
  activeNoteId,
}) => {
  const {
    folders,
    notes,
    activeFolderId,
    setActiveFolder,
    createFolder,
    deleteFolder,
    renameFolder,
    moveNoteToFolder,
    createNote,
    deleteNote,
  } = useAppStore();

  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Estados para crear o renombrar carpeta
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  // Drag & drop y selector de movimiento de nota
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'unassigned'>(null);
  const [noteMoveMenuId, setNoteMoveMenuId] = useState<string | null>(null);

  // Carpetas colapsadas/expandidas para ver sus notas directamente
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    all: true,
    'folder-01': true,
    'folder-02': true,
  });

  const toggleFolderExpanded = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const notify = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 2400);
  };

  const handleCreateFolder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const created = await createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
      setExpandedFolders((prev) => ({ ...prev, [created.id]: true }));
      notify('Carpeta creada');
    } catch {
      // Ignorar
    }
  };

  const handleRenameFolder = async (folderId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingFolderName.trim()) return;
    await renameFolder(folderId, editingFolderName.trim());
    setEditingFolderId(null);
    setEditingFolderName('');
    notify('Carpeta renombrada');
  };

  const handleDeleteFolder = async (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolderMenuId(null);
    if (window.confirm(`¿Eliminar la carpeta "${folder.name}"? Las notas pasarán a "Sin carpeta".`)) {
      await deleteFolder(folder.id);
      notify('Carpeta eliminada');
    }
  };

  const handleCreateNoteInActiveFolder = async () => {
    const targetFolder = activeFolderId || (folders.length > 0 ? folders[0].id : undefined);
    const newId = await createNote(targetFolder);
    if (targetFolder) {
      setExpandedFolders((prev) => ({ ...prev, [targetFolder]: true }));
    }
    onSelectNote(newId);
    notify('Nota creada');
  };

  // Contar notas por carpeta
  const noteCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notes.length, unassigned: 0 };
    notes.forEach((n) => {
      if (n.folderId) {
        counts[n.folderId] = (counts[n.folderId] || 0) + 1;
      } else {
        counts.unassigned = (counts.unassigned || 0) + 1;
      }
    });
    return counts;
  }, [notes]);

  const getNotesForFolder = (folderId: string) => {
    return notes.filter((n) => n.folderId === folderId);
  };

  const unassignedNotes = useMemo(() => {
    return notes.filter((n) => !n.folderId);
  }, [notes]);

  // Renderizador de un ítem de nota reutilizable con Drag&Drop y menú mover
  const renderNoteItem = (note: Note) => {
    const isNoteActive = note.id === activeNoteId;
    return (
      <div
        key={note.id}
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', note.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onClick={() => onSelectNote(note.id)}
        className={`group/item flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-colors relative ${
          isNoteActive
            ? 'bg-white text-app-text-primary font-medium shadow-2xs border border-black/5'
            : 'text-app-text-secondary hover:bg-white/70 hover:text-app-text-primary'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <i className="fi fi-rr-document text-xs opacity-60 shrink-0 leading-none cursor-grab active:cursor-grabbing" title="Arrastra para mover a otra carpeta" />
          <span className="truncate">{note.title.trim() || 'Nota sin título'}</span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          {/* Botón mover a carpeta */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setNoteMoveMenuId(noteMoveMenuId === note.id ? null : note.id);
              }}
              className="opacity-0 group-hover/item:opacity-100 p-1 hover:text-blue-600 hover:bg-black/5 rounded transition-opacity flex items-center justify-center"
              title="Mover a carpeta..."
            >
              <i className="fi fi-rr-folder-download text-xs leading-none" />
            </button>

            {noteMoveMenuId === note.id && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNoteMoveMenuId(null);
                  }}
                />
                <div className="absolute right-0 top-6 w-40 liquid-glass-card border border-white/90 rounded-xl shadow-xl py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-app-text-secondary tracking-wider">
                    Mover a:
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveNoteToFolder(note.id, undefined);
                      setNoteMoveMenuId(null);
                      notify('Nota movida a Sin carpeta');
                    }}
                    className={`w-full px-2.5 py-1.5 text-left flex items-center gap-1.5 hover:bg-black/5 transition-colors ${
                      !note.folderId ? 'font-semibold text-blue-600' : 'text-app-text-primary'
                    }`}
                  >
                    <i className="fi fi-rr-document text-xs opacity-60 leading-none" />
                    <span className="truncate">Sin carpeta</span>
                  </button>
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveNoteToFolder(note.id, f.id);
                        setExpandedFolders((prev) => ({ ...prev, [f.id]: true }));
                        setNoteMoveMenuId(null);
                        notify(`Nota movida a ${f.name}`);
                      }}
                      className={`w-full px-2.5 py-1.5 text-left flex items-center gap-1.5 hover:bg-black/5 transition-colors ${
                        note.folderId === f.id ? 'font-semibold text-blue-600' : 'text-app-text-primary'
                      }`}
                    >
                      <i className="fi fi-rr-folder text-xs opacity-60 leading-none" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Botón eliminar nota */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`¿Eliminar la nota "${note.title || 'sin título'}"?`)) {
                deleteNote(note.id);
              }
            }}
            className="opacity-0 group-hover/item:opacity-100 p-1 hover:text-red-600 hover:bg-red-50 rounded transition-opacity flex items-center justify-center"
            title="Eliminar nota"
          >
            <i className="fi fi-rr-trash text-xs leading-none" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <aside className="w-64 h-full bg-app-sidebar border-r border-app-border-subtle flex flex-col shrink-0 select-none overflow-hidden text-app-text-primary relative">
      {/* Cabecera superior limpia: Notas + botón Crear Carpeta */}
      <div className="p-3.5 border-b border-app-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-panel-title font-bold text-app-text-primary tracking-tight">
            Notas
          </h2>

          {/* Pill de notificación estilo "Carpeta creada" */}
          {statusNotification && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60 animate-in fade-in duration-150">
              {statusNotification}
            </span>
          )}
        </div>

        {/* Botón superior "+ Crear carpeta" */}
        <button
          type="button"
          onClick={() => setIsCreatingFolder(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-app-active-pill text-app-text-primary text-xs font-medium hover:bg-black/10 transition-colors shadow-2xs"
          title="Crear nueva carpeta"
        >
          <i className="fi fi-rr-plus text-xs leading-none" />
          <span>Crear carpeta</span>
        </button>
      </div>

      {/* Input flotante para crear carpeta */}
      {isCreatingFolder && (
        <form onSubmit={handleCreateFolder} className="p-2.5 mx-2 my-1.5 bg-white border border-black/10 rounded-xl shadow-md animate-in fade-in">
          <div className="text-xs font-semibold text-app-text-primary mb-1 flex items-center gap-1.5">
            <i className="fi fi-rr-add-folder text-blue-600 text-sm leading-none" />
            <span>Nueva carpeta</span>
          </div>
          <input
            type="text"
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Ej. 01, Proyectos, Ideas..."
            className="w-full px-2 py-1 text-xs border border-app-border-subtle rounded-lg mb-2 focus:outline-none focus:border-black/30"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName('');
              }}
              className="px-2 py-0.5 text-xs text-app-text-secondary hover:text-app-text-primary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-2.5 py-0.5 text-xs bg-app-action-primary text-white rounded-md font-medium hover:opacity-90"
            >
              Crear
            </button>
          </div>
        </form>
      )}

      {/* Lista de Carpetas y sus Notas */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {/* Opción Todas las Notas (y zona de drop para quitar carpeta) */}
        <div
          onClick={() => setActiveFolder(null)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverFolderId('unassigned');
          }}
          onDragLeave={() => {
            setDragOverFolderId(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverFolderId(null);
            const noteId = e.dataTransfer.getData('text/plain');
            if (noteId) {
              moveNoteToFolder(noteId, undefined);
              notify('Nota movida a Sin carpeta');
            }
          }}
          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer text-xs transition-all ${
            dragOverFolderId === 'unassigned'
              ? 'bg-blue-50/90 border-2 border-dashed border-blue-400 text-blue-800'
              : activeFolderId === null
              ? 'bg-app-active-pill text-app-text-primary font-medium shadow-2xs'
              : 'text-app-text-secondary hover:bg-black/5 hover:text-app-text-primary'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <i className="fi fi-rr-folder text-sm text-app-text-primary shrink-0 opacity-80 leading-none" />
            <span className="truncate">Todas las notas</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/5 text-app-text-secondary font-medium">
            {noteCounts.all || 0}
          </span>
        </div>

        {/* Lista de Carpetas del usuario */}
        {folders.map((folder) => {
          const isSelected = activeFolderId === folder.id;
          const isExpanded = !!expandedFolders[folder.id];
          const isDragOver = dragOverFolderId === folder.id;
          const count = noteCounts[folder.id] || 0;
          const folderNotes = getNotesForFolder(folder.id);

          return (
            <div key={folder.id} className="flex flex-col">
              {editingFolderId === folder.id ? (
                <form
                  onSubmit={(e) => handleRenameFolder(folder.id, e)}
                  className="flex items-center gap-1 px-2 py-1 bg-white border border-black/15 rounded-lg shadow-sm"
                >
                  <input
                    type="text"
                    autoFocus
                    value={editingFolderName}
                    onChange={(e) => setEditingFolderName(e.target.value)}
                    className="w-full text-xs outline-none bg-transparent"
                  />
                  <button
                    type="submit"
                    className="text-xs font-semibold text-blue-600 px-1 hover:underline"
                  >
                    OK
                  </button>
                </form>
              ) : (
                <div
                  onClick={() => {
                    setActiveFolder(folder.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setDragOverFolderId(folder.id);
                  }}
                  onDragLeave={() => {
                    setDragOverFolderId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverFolderId(null);
                    const noteId = e.dataTransfer.getData('text/plain');
                    if (noteId) {
                      moveNoteToFolder(noteId, folder.id);
                      setExpandedFolders((prev) => ({ ...prev, [folder.id]: true }));
                      notify(`Nota movida a ${folder.name}`);
                    }
                  }}
                  className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer text-xs transition-all ${
                    isDragOver
                      ? 'bg-blue-50/90 border-2 border-dashed border-blue-400 text-blue-800'
                      : isSelected
                      ? 'bg-app-active-pill text-app-text-primary font-medium shadow-2xs'
                      : 'text-app-text-secondary hover:bg-black/5 hover:text-app-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => toggleFolderExpanded(folder.id, e)}
                      className="p-0.5 -ml-1 text-app-text-secondary hover:text-app-text-primary rounded flex items-center justify-center"
                      title={isExpanded ? 'Colapsar carpeta' : 'Expandir carpeta'}
                    >
                      {isExpanded ? (
                        <i className="fi fi-rr-angle-small-down text-xs leading-none" />
                      ) : (
                        <i className="fi fi-rr-angle-small-right text-xs leading-none" />
                      )}
                    </button>
                    <i className={`fi fi-rr-folder text-sm leading-none shrink-0 ${isSelected ? 'text-blue-600 font-bold' : 'opacity-80'}`} />
                    <span className="truncate">{folder.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/5 text-app-text-secondary font-medium">
                      {count}
                    </span>

                    {/* Menú de opciones de carpeta */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderMenuId(folderMenuId === folder.id ? null : folder.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 rounded transition-opacity flex items-center justify-center"
                        title="Opciones de carpeta"
                      >
                        <i className="fi fi-rr-menu-dots-vertical text-xs text-app-text-secondary leading-none" />
                      </button>

                      {folderMenuId === folder.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderMenuId(null);
                            }}
                          />
                          <div className="absolute right-0 top-6 w-32 liquid-glass-card border border-white/90 rounded-xl shadow-xl py-1 z-40 text-xs">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFolderId(folder.id);
                                setEditingFolderName(folder.name);
                                setFolderMenuId(null);
                              }}
                              className="w-full px-2.5 py-1.5 text-left flex items-center gap-2 hover:bg-black/5 text-app-text-primary"
                            >
                              <i className="fi fi-rr-edit text-xs leading-none" />
                              <span>Renombrar</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteFolder(folder, e)}
                              className="w-full px-2.5 py-1.5 text-left flex items-center gap-2 hover:bg-red-50 text-red-600"
                            >
                              <i className="fi fi-rr-trash text-xs leading-none" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notas anidadas desplegadas bajo la carpeta */}
              {isExpanded && folderNotes.length > 0 && (
                <div className="ml-4 pl-2 border-l border-black/10 my-0.5 space-y-0.5">
                  {folderNotes.map((note) => renderNoteItem(note))}
                </div>
              )}
            </div>
          );
        })}

        {/* Notas sin carpeta asignada */}
        {unassignedNotes.length > 0 && (
          <div className="pt-2">
            <span className="text-[10px] font-semibold text-app-text-secondary uppercase tracking-wider px-2 block mb-1">
              Sin carpeta
            </span>
            <div className="space-y-0.5">
              {unassignedNotes.map((note) => renderNoteItem(note))}
            </div>
          </div>
        )}
      </div>

      {/* Pie de la barra lateral con acciones Crear carpeta y Crear nota */}
      <div className="p-3 border-t border-app-border-subtle bg-white/50 backdrop-blur-xs flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setIsCreatingFolder(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-app-text-primary hover:bg-black/5 transition-colors"
        >
          <i className="fi fi-rr-add-folder text-sm text-app-text-secondary leading-none" />
          <span>Crear carpeta</span>
        </button>

        <button
          type="button"
          onClick={handleCreateNoteInActiveFolder}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium bg-app-action-primary text-white hover:opacity-90 transition-opacity shadow-sm"
        >
          <i className="fi fi-rr-edit text-sm leading-none" />
          <span>Crear nota</span>
        </button>
      </div>
    </aside>
  );
};
