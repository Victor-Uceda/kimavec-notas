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
    boardCards,
    activeFolderId,
    setActiveFolder,
    createFolder,
    deleteFolder,
    renameFolder,
    moveFolder,
    moveNoteToFolder,
    createNote,
    deleteNote,
    setTrashOpen,
  } = useAppStore();

  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Estados para crear o renombrar carpeta
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingSubfolderForId, setIsCreatingSubfolderForId] = useState<string | null>(null);
  const [subfolderName, setSubfolderName] = useState('');

  const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
  const [folderMoveMenuId, setFolderMoveMenuId] = useState<string | null>(null);
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

  const activeFolders = useMemo(() => folders.filter((f) => !f.deletedAt), [folders]);
  const activeNotes = useMemo(() => notes.filter((n) => !n.deletedAt), [notes]);

  const trashCount = useMemo(() => {
    const trashedN = notes.filter((n) => !!n.deletedAt).length;
    const trashedF = folders.filter((f) => !!f.deletedAt).length;
    const trashedC = boardCards.filter((c) => !!c.deletedAt).length;
    return trashedN + trashedF + trashedC;
  }, [notes, folders, boardCards]);

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

  const handleCreateSubfolder = async (parentId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!subfolderName.trim()) return;
    try {
      const created = await createFolder(subfolderName.trim(), parentId);
      setSubfolderName('');
      setIsCreatingSubfolderForId(null);
      setExpandedFolders((prev) => ({ ...prev, [parentId]: true, [created.id]: true }));
      notify('Subcarpeta creada');
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
    if (window.confirm(`¿Enviar la carpeta "${folder.name}" a la papelera?`)) {
      await deleteFolder(folder.id);
      notify('Carpeta enviada a la papelera');
    }
  };

  const handleCreateNoteInActiveFolder = async () => {
    const targetFolder = activeFolderId || (activeFolders.length > 0 ? activeFolders[0].id : undefined);
    const newId = await createNote(targetFolder);
    if (targetFolder) {
      setExpandedFolders((prev) => ({ ...prev, [targetFolder]: true }));
    }
    onSelectNote(newId);
    notify('Nota creada');
  };

  // Contar notas por carpeta
  const noteCounts = useMemo(() => {
    const counts: Record<string, number> = { all: activeNotes.length, unassigned: 0 };
    activeNotes.forEach((n) => {
      if (n.folderId) {
        counts[n.folderId] = (counts[n.folderId] || 0) + 1;
      } else {
        counts.unassigned = (counts.unassigned || 0) + 1;
      }
    });
    return counts;
  }, [activeNotes]);

  const getNotesForFolder = (folderId: string) => {
    return activeNotes.filter((n) => n.folderId === folderId);
  };

  const unassignedNotes = useMemo(() => {
    return activeNotes.filter((n) => !n.folderId);
  }, [activeNotes]);

  const rootFolders = useMemo(() => {
    return activeFolders.filter((f) => !f.parentId);
  }, [activeFolders]);

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
          <i
            className="fi fi-rr-document text-xs opacity-60 shrink-0 leading-none cursor-grab active:cursor-grabbing"
            title="Arrastra para mover a otra carpeta"
          />
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
                <div className="absolute right-0 top-6 w-44 liquid-glass-card border border-white/90 rounded-xl shadow-xl py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
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
                  {activeFolders.map((f) => (
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

          {/* Botón eliminar nota (soft-delete) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteNote(note.id);
              notify('Nota enviada a la papelera');
            }}
            className="opacity-0 group-hover/item:opacity-100 p-1 hover:text-red-600 hover:bg-red-50 rounded transition-opacity flex items-center justify-center"
            title="Enviar a papelera"
          >
            <i className="fi fi-rr-trash text-xs leading-none" />
          </button>
        </div>
      </div>
    );
  };

  // Renderizador recursivo de carpetas y sus subcarpetas
  const renderFolderItem = (folder: Folder, depth = 0) => {
    const isSelected = activeFolderId === folder.id;
    const isExpanded = !!expandedFolders[folder.id];
    const isDragOver = dragOverFolderId === folder.id;
    const count = noteCounts[folder.id] || 0;
    const folderNotes = getNotesForFolder(folder.id);
    const childFolders = activeFolders.filter((f) => f.parentId === folder.id);

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
            onClick={() => setActiveFolder(folder.id)}
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
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
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
              <i
                className={`fi fi-rr-folder text-sm leading-none shrink-0 ${
                  isSelected ? 'text-blue-600 font-bold' : 'opacity-80'
                }`}
              />
              <span className="truncate">{folder.name}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/5 text-app-text-secondary font-medium">
                {count}
              </span>

              {/* Menú de opciones de carpeta completo */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFolderMenuId(folderMenuId === folder.id ? null : folder.id);
                    setFolderMoveMenuId(null);
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
                    <div className="absolute right-0 top-6 w-44 liquid-glass-card border border-white/90 rounded-xl shadow-xl py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                      {/* Crear nota dentro */}
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          setFolderMenuId(null);
                          const newId = await createNote(folder.id);
                          setExpandedFolders((prev) => ({ ...prev, [folder.id]: true }));
                          onSelectNote(newId);
                          notify(`Nota creada en ${folder.name}`);
                        }}
                        className="w-full px-2.5 py-1.5 text-left flex items-center gap-2 hover:bg-black/5 text-app-text-primary"
                      >
                        <i className="fi fi-rr-edit text-xs leading-none text-blue-600" />
                        <span>Nueva nota dentro</span>
                      </button>

                      {/* Crear subcarpeta */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderMenuId(null);
                          setIsCreatingSubfolderForId(folder.id);
                          setExpandedFolders((prev) => ({ ...prev, [folder.id]: true }));
                        }}
                        className="w-full px-2.5 py-1.5 text-left flex items-center gap-2 hover:bg-black/5 text-app-text-primary"
                      >
                        <i className="fi fi-rr-add-folder text-xs leading-none text-app-text-secondary" />
                        <span>Crear subcarpeta</span>
                      </button>

                      {/* Renombrar */}
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
                        <i className="fi fi-rr-pencil text-xs leading-none text-app-text-secondary" />
                        <span>Renombrar</span>
                      </button>

                      {/* Mover de ubicación */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderMoveMenuId(folder.id);
                          setFolderMenuId(null);
                        }}
                        className="w-full px-2.5 py-1.5 text-left flex items-center gap-2 hover:bg-black/5 text-app-text-primary"
                      >
                        <i className="fi fi-rr-folder-download text-xs leading-none text-app-text-secondary" />
                        <span>Mover de ubicación</span>
                      </button>

                      <div className="my-1 border-t border-black/5" />

                      {/* Eliminar (papelera) */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteFolder(folder, e)}
                        className="w-full px-2.5 py-1.5 text-left flex items-center gap-2 hover:bg-red-50 text-red-600"
                      >
                        <i className="fi fi-rr-trash text-xs leading-none" />
                        <span>Enviar a papelera</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Submenú de selección de nueva ubicación para la carpeta */}
                {folderMoveMenuId === folder.id && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFolderMoveMenuId(null);
                      }}
                    />
                    <div className="absolute right-0 top-6 w-48 liquid-glass-card border border-white/90 rounded-xl shadow-xl py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-app-text-secondary tracking-wider">
                        Mover carpeta a:
                      </div>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await moveFolder(folder.id, undefined);
                          setFolderMoveMenuId(null);
                          notify('Carpeta movida a la raíz');
                        }}
                        className={`w-full px-2.5 py-1.5 text-left flex items-center gap-1.5 hover:bg-black/5 ${
                          !folder.parentId ? 'font-semibold text-blue-600' : 'text-app-text-primary'
                        }`}
                      >
                        <i className="fi fi-rr-folder text-xs leading-none" />
                        <span>Nivel raíz (sin padre)</span>
                      </button>
                      {activeFolders
                        .filter((f) => f.id !== folder.id && f.parentId !== folder.id)
                        .map((targetF) => (
                          <button
                            key={targetF.id}
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await moveFolder(folder.id, targetF.id);
                              setExpandedFolders((prev) => ({ ...prev, [targetF.id]: true }));
                              setFolderMoveMenuId(null);
                              notify(`Carpeta movida dentro de ${targetF.name}`);
                            }}
                            className={`w-full px-2.5 py-1.5 text-left flex items-center gap-1.5 hover:bg-black/5 ${
                              folder.parentId === targetF.id ? 'font-semibold text-blue-600' : 'text-app-text-primary'
                            }`}
                          >
                            <i className="fi fi-rr-folder text-xs leading-none opacity-60" />
                            <span className="truncate">{targetF.name}</span>
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Formulario para crear subcarpeta anidada */}
        {isCreatingSubfolderForId === folder.id && (
          <form
            onSubmit={(e) => handleCreateSubfolder(folder.id, e)}
            className="ml-4 pl-2 my-1 p-2 bg-white border border-black/10 rounded-xl shadow-md animate-in fade-in"
          >
            <div className="text-[11px] font-semibold text-app-text-primary mb-1 flex items-center gap-1">
              <i className="fi fi-rr-add-folder text-blue-600 text-xs" />
              <span>Nueva subcarpeta en {folder.name}</span>
            </div>
            <input
              type="text"
              autoFocus
              value={subfolderName}
              onChange={(e) => setSubfolderName(e.target.value)}
              placeholder="Nombre de subcarpeta..."
              className="w-full px-2 py-1 text-xs border border-app-border-subtle rounded-lg mb-1.5 focus:outline-none focus:border-black/30"
            />
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingSubfolderForId(null);
                  setSubfolderName('');
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

        {/* Contenido anidado de la carpeta: subcarpetas y notas */}
        {isExpanded && (childFolders.length > 0 || folderNotes.length > 0) && (
          <div className="ml-3.5 pl-2 border-l border-black/10 my-0.5 space-y-0.5">
            {/* Subcarpetas anidadas */}
            {childFolders.map((sub) => renderFolderItem(sub, depth + 1))}

            {/* Notas anidadas */}
            {folderNotes.map((note) => renderNoteItem(note))}
          </div>
        )}
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

          {/* Pill de notificación de estado */}
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

      {/* Input flotante para crear carpeta raíz */}
      {isCreatingFolder && (
        <form
          onSubmit={handleCreateFolder}
          className="p-2.5 mx-2 my-1.5 bg-white border border-black/10 rounded-xl shadow-md animate-in fade-in"
        >
          <div className="text-xs font-semibold text-app-text-primary mb-1 flex items-center gap-1.5">
            <i className="fi fi-rr-add-folder text-blue-600 text-sm leading-none" />
            <span>Nueva carpeta</span>
          </div>
          <input
            type="text"
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Ej. Proyectos, Ideas..."
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

        {/* Árbol jerárquico de Carpetas (Raíz y Subcarpetas) */}
        {rootFolders.map((folder) => renderFolderItem(folder))}

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

      {/* 4 Acciones Rápidas en el pie de la barra lateral */}
      <div className="p-2.5 border-t border-app-border-subtle bg-white/70 backdrop-blur-xs">
        <div className="grid grid-cols-2 gap-1.5">
          {/* 1. Crear nota */}
          <button
            type="button"
            onClick={handleCreateNoteInActiveFolder}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-app-action-primary text-white hover:opacity-90 transition-opacity shadow-2xs"
            title="Crear nota"
          >
            <i className="fi fi-rr-edit text-xs leading-none" />
            <span className="truncate">Crear nota</span>
          </button>

          {/* 2. Crear carpeta */}
          <button
            type="button"
            onClick={() => setIsCreatingFolder(true)}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-app-text-primary bg-black/5 hover:bg-black/10 transition-colors"
            title="Crear carpeta"
          >
            <i className="fi fi-rr-add-folder text-xs leading-none text-app-text-secondary" />
            <span className="truncate">Crear carpeta</span>
          </button>

          {/* 3. Crear tarea */}
          <button
            type="button"
            onClick={() => useAppStore.getState().setNav('todo')}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-app-text-primary bg-black/5 hover:bg-black/10 transition-colors"
            title="Ir a tareas Por hacer"
          >
            <i className="fi fi-rr-check-circle text-xs leading-none text-app-text-secondary" />
            <span className="truncate">Crear tarea</span>
          </button>

          {/* 4. Abrir Papelera */}
          <button
            type="button"
            onClick={() => setTrashOpen(true)}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-app-text-primary bg-black/5 hover:bg-black/10 transition-colors relative"
            title="Abrir papelera"
          >
            <i className="fi fi-rr-trash text-xs leading-none text-app-text-secondary" />
            <span className="truncate">Papelera</span>
            {trashCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-semibold leading-none">
                {trashCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
