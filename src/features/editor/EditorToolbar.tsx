import React, { useState, useMemo } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Clock,
  Network,
  ChevronDown,
  CheckSquare,
  Undo,
  Redo,
  Trash2,
  Calendar,
  FileText,
  Timer,
  Code,
  Folder as FolderIcon,
  ListTodo,
} from 'lucide-react';
import type { Note } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { extractTasksFromMarkdown } from '../../utils/taskParser';

interface EditorToolbarProps {
  editor: Editor | null;
  note?: Note;
  onOpenGraph?: () => void;
  onDeleteNote?: () => void;
}

// Configuración declarativa de herramientas inline
const INLINE_ACTIONS = [
  {
    id: 'bold',
    label: 'Negrita (Ctrl+B)',
    icon: Bold,
    action: (editor: Editor) => editor.chain().focus().toggleBold().run(),
    isActive: (editor: Editor) => editor.isActive('bold'),
  },
  {
    id: 'italic',
    label: 'Cursiva (Ctrl+I)',
    icon: Italic,
    action: (editor: Editor) => editor.chain().focus().toggleItalic().run(),
    isActive: (editor: Editor) => editor.isActive('italic'),
  },
  {
    id: 'bulletList',
    label: 'Lista con viñetas',
    icon: List,
    action: (editor: Editor) => editor.chain().focus().toggleBulletList().run(),
    isActive: (editor: Editor) => editor.isActive('bulletList'),
  },
  {
    id: 'orderedList',
    label: 'Lista numerada',
    icon: ListOrdered,
    action: (editor: Editor) => editor.chain().focus().toggleOrderedList().run(),
    isActive: (editor: Editor) => editor.isActive('orderedList'),
  },
  {
    id: 'blockquote',
    label: 'Cita en bloque',
    icon: Quote,
    action: (editor: Editor) => editor.chain().focus().toggleBlockquote().run(),
    isActive: (editor: Editor) => editor.isActive('blockquote'),
  },
  {
    id: 'taskList',
    label: 'Lista de tareas',
    icon: CheckSquare,
    action: (editor: Editor) => editor.chain().focus().toggleTaskList().run(),
    isActive: (editor: Editor) => editor.isActive('taskList'),
  },
  {
    id: 'codeBlock',
    label: 'Bloque de código (mismo recuadro)',
    icon: Code,
    action: (editor: Editor) => {
      if (editor.isActive('code')) {
        editor.chain().focus().unsetCode().run();
      }
      editor.chain().focus().toggleCodeBlock().run();
    },
    isActive: (editor: Editor) => editor.isActive('codeBlock'),
  },
];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  note,
  onOpenGraph,
  onDeleteNote,
}) => {
  const { isTaskPanelOpen, toggleTaskPanel, folders, moveNoteToFolder } = useAppStore();
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);

  const currentFolder = useMemo(() => {
    if (!note?.folderId) return null;
    return folders.find((f) => f.id === note.folderId) || null;
  }, [folders, note]);

  const noteTasks = useMemo(() => {
    if (!note) return [];
    return extractTasksFromMarkdown(note.content, note.id);
  }, [note]);

  const pendingTasksCount = useMemo(() => {
    return noteTasks.filter((t) => !t.completed).length;
  }, [noteTasks]);

  // Estadísticas reactivas de la nota
  const stats = useMemo(() => {
    if (!editor) return { words: 0, chars: 0, readingTime: 1 };
    const text = editor.getText().trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readingTime };
  }, [editor]);

  if (!editor) {
    return (
      <div className="h-12 w-full border-b border-app-border-subtle flex items-center px-6 bg-white rounded-none opacity-50" />
    );
  }

  const getActiveBlockLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Título H1';
    if (editor.isActive('heading', { level: 2 })) return 'Subtítulo H2';
    if (editor.isActive('codeBlock')) return 'Código';
    if (editor.isActive('taskList')) return 'Lista de tareas';
    return 'Texto';
  };

  return (
    <div className="h-11 w-full border-b border-app-border-subtle flex items-center justify-between px-2 sm:px-3 select-none bg-white rounded-none relative shrink-0 overflow-x-auto no-scrollbar gap-1">
      {/* Controles Izquierdos de Formato */}
      <div className="flex items-center gap-0.5 text-app-text-secondary shrink-0">
        {/* Selector de tipo de bloque */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBlockMenu((v) => !v)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md hover:bg-black/5 text-app-text-primary transition-colors"
          >
            <span className="truncate max-w-[80px] sm:max-w-none">{getActiveBlockLabel()}</span>
            <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
          </button>

          {showBlockMenu && (
            <div className="absolute left-0 top-10 liquid-glass-card border border-white/90 rounded-xl shadow-2xl py-1.5 w-44 z-30 backdrop-blur-2xl">
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setShowBlockMenu(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-body hover:bg-black/5 ${
                  editor.isActive('paragraph') ? 'font-semibold text-black' : 'text-app-text-primary'
                }`}
              >
                Párrafo regular
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  setShowBlockMenu(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-body hover:bg-black/5 ${
                  editor.isActive('heading', { level: 1 }) ? 'font-bold text-black' : 'text-app-text-primary'
                }`}
              >
                Título H1
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  setShowBlockMenu(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-body hover:bg-black/5 ${
                  editor.isActive('heading', { level: 2 }) ? 'font-semibold text-black' : 'text-app-text-primary'
                }`}
              >
                Subtítulo H2
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleCodeBlock().run();
                  setShowBlockMenu(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-body hover:bg-black/5 ${
                  editor.isActive('codeBlock') ? 'font-semibold text-black' : 'text-app-text-primary'
                }`}
              >
                Bloque de Código
              </button>
            </div>
          )}
        </div>

        <div className="w-[1px] h-3.5 bg-app-border-subtle mx-1" />

        {/* Botones de formato inline generados limpiamente */}
        {INLINE_ACTIONS.map(({ id, label, icon: Icon, action, isActive }) => (
          <button
            key={id}
            type="button"
            aria-label={label}
            onClick={() => action(editor)}
            className={`w-6.5 h-6.5 sm:w-7 sm:h-7 flex items-center justify-center rounded transition-colors ${
              isActive(editor)
                ? 'bg-app-active-pill text-app-text-primary'
                : 'hover:bg-black/5 hover:text-app-text-primary'
            }`}
            title={label}
          >
            <Icon className="w-3.5 h-3.5 stroke-[2]" />
          </button>
        ))}

        <div className="w-[1px] h-3.5 bg-app-border-subtle mx-1" />

        {/* Deshacer / Rehacer */}
        <button
          type="button"
          aria-label="Deshacer"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
          className="w-6.5 h-6.5 sm:w-7 sm:h-7 flex items-center justify-center rounded hover:bg-black/5 hover:text-app-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Deshacer (Ctrl+Z)"
        >
          <Undo className="w-3.5 h-3.5 stroke-[2]" />
        </button>
        <button
          type="button"
          aria-label="Rehacer"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          className="w-6.5 h-6.5 sm:w-7 sm:h-7 flex items-center justify-center rounded hover:bg-black/5 hover:text-app-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Rehacer (Ctrl+Y)"
        >
          <Redo className="w-3.5 h-3.5 stroke-[2]" />
        </button>
      </div>

      {/* Utilidades Derechas: Carpeta, Tareas, Estadísticas, Grafo y Eliminar */}
      <div className="flex items-center gap-1 text-app-text-secondary shrink-0 ml-auto pl-1">
        {/* Selector de Carpeta para la nota actual */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFolderMenu((v) => !v)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 transition-colors"
            title="Mover o asignar carpeta a esta nota"
          >
            <FolderIcon className="w-3.5 h-3.5 opacity-70" />
            <span className="truncate max-w-[85px] sm:max-w-[110px]">
              {currentFolder ? currentFolder.name : 'Sin carpeta'}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showFolderMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowFolderMenu(false)}
              />
              <div className="absolute right-0 top-9 liquid-glass-card border border-white/90 rounded-xl shadow-xl py-1.5 w-44 z-40 text-xs text-app-text-primary">
                <span className="px-3 py-1 text-[10px] font-bold text-app-text-secondary uppercase tracking-wider block">
                  Carpeta de la nota
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (note) moveNoteToFolder(note.id, undefined);
                    setShowFolderMenu(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-black/5 ${
                    !note?.folderId ? 'font-semibold text-blue-600' : ''
                  }`}
                >
                  <span>Sin carpeta</span>
                  {!note?.folderId && <CheckSquare className="w-3.5 h-3.5" />}
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      if (note) moveNoteToFolder(note.id, f.id);
                      setShowFolderMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-black/5 ${
                      note?.folderId === f.id ? 'font-semibold text-blue-600' : ''
                    }`}
                  >
                    <span className="truncate">{f.name}</span>
                    {note?.folderId === f.id && <CheckSquare className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Alternar Panel Lateral de Tareas bajo demanda */}
        <button
          type="button"
          aria-label={isTaskPanelOpen ? 'Ocultar panel de tareas' : 'Abrir panel de tareas'}
          onClick={() => toggleTaskPanel()}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
            isTaskPanelOpen
              ? 'bg-app-action-primary text-white shadow-2xs'
              : 'text-app-text-secondary hover:bg-black/5 hover:text-app-text-primary'
          }`}
          title={isTaskPanelOpen ? 'Ocultar panel lateral de tareas' : 'Abrir panel lateral de tareas'}
        >
          <ListTodo className="w-3.5 h-3.5 stroke-[1.8]" />
          <span className="hidden md:inline">Tareas</span>
          {noteTasks.length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                isTaskPanelOpen ? 'bg-white/25 text-white' : 'bg-black/10 text-app-text-primary'
              }`}
            >
              {pendingTasksCount > 0 ? pendingTasksCount : '✓'}
            </span>
          )}
        </button>

        <div className="w-[1px] h-3.5 bg-app-border-subtle mx-0.5" />

        <div className="relative">
          <button
            type="button"
            aria-label="Historial y estadísticas"
            onClick={() => setShowStats((v) => !v)}
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
              showStats ? 'bg-app-active-pill text-app-text-primary' : 'hover:bg-black/5 hover:text-app-text-primary'
            }`}
            title="Estadísticas de la nota"
          >
            <Clock className="w-4 h-4 stroke-[1.8]" />
          </button>

          {showStats && (
            <div className="absolute right-0 top-9 liquid-glass-card border border-white/90 rounded-2xl shadow-2xl p-4 w-64 z-30 text-app-text-primary backdrop-blur-2xl">
              <h4 className="text-body font-semibold mb-2.5 pb-1.5 border-b border-app-border-subtle">
                Información de la Nota
              </h4>
              <div className="space-y-2 text-task">
                <div className="flex items-center justify-between text-app-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Palabras:
                  </span>
                  <span className="font-medium text-app-text-primary">{stats.words}</span>
                </div>
                <div className="flex items-center justify-between text-app-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Caracteres:
                  </span>
                  <span className="font-medium text-app-text-primary">{stats.chars}</span>
                </div>
                <div className="flex items-center justify-between text-app-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" />
                    Lectura estimada:
                  </span>
                  <span className="font-medium text-app-text-primary">~{stats.readingTime} min</span>
                </div>
                {note?.updatedAt && (
                  <div className="pt-2 border-t border-app-border-subtle flex flex-col gap-1 text-badge text-app-text-secondary">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Última modificación:
                    </span>
                    <span className="text-app-text-primary font-medium">
                      {new Date(note.updatedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Ver grafo"
          onClick={onOpenGraph}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-black/5 hover:text-app-text-primary transition-colors"
          title="Ver en grafo"
        >
          <Network className="w-4 h-4 stroke-[1.8]" />
        </button>

        {onDeleteNote && (
          <button
            type="button"
            aria-label="Eliminar nota"
            onClick={onDeleteNote}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 hover:text-red-600 transition-colors ml-1"
            title="Eliminar esta nota"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
