import React, { useState, useMemo } from 'react';
import type { Editor } from '@tiptap/react';
import {
  X,
  FileText,
  ShieldCheck,
  Info,
  FolderInput,
  Trash2,
  Undo,
  Redo,
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  CheckSquare,
} from 'lucide-react';
import type { Note } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface EditorToolbarProps {
  editor: Editor | null;
  note?: Note;
  onClose?: () => void;
  onOpenGraph?: () => void;
  onDeleteNote?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  note,
  onClose,
  onOpenGraph,
  onDeleteNote,
}) => {
  const { isTaskPanelOpen, toggleTaskPanel, folders, moveNoteToFolder } = useAppStore();
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const currentFolder = useMemo(() => {
    if (!note?.folderId) return null;
    return folders.find((f) => f.id === note.folderId) || null;
  }, [folders, note]);

  // Estadísticas rápidas para el modal de Información
  const stats = useMemo(() => {
    if (!editor) return { words: 0, chars: 0, readingTime: 1 };
    const text = editor.getText().trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readingTime };
  }, [editor]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (note) {
      useAppStore.getState().closeNoteTab(note.id);
    }
  };

  const handleOpenGraph = () => {
    if (onOpenGraph) {
      onOpenGraph();
    } else {
      useAppStore.getState().setNav('canvas');
    }
  };

  const handleDeleteNote = () => {
    if (onDeleteNote) {
      onDeleteNote();
    } else if (note) {
      if (window.confirm(`¿Eliminar la nota "${note.title || 'sin título'}"?`)) {
        useAppStore.getState().deleteNote(note.id);
      }
    }
  };

  return (
    <div className="w-full flex flex-col select-none bg-white relative shrink-0">
      {/* 1. Fila Superior: Botón Cerrar (X) a la izquierda y Acciones a la derecha */}
      <div className="h-11 px-6 flex items-center justify-between">
        {/* Botón Cerrar (X) */}
        <div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 transition-colors"
            title="Cerrar nota"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Fila de iconos de acción minimalistas (derecha) */}
        <div className="flex items-center gap-1.5">
          {/* Documento / Ver en grafo */}
          <button
            type="button"
            onClick={handleOpenGraph}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 transition-colors"
            title="Ver conexiones en grafo"
          >
            <FileText className="w-4 h-4 stroke-[1.8]" />
          </button>

          {/* Escudo / Panel de Tareas */}
          <button
            type="button"
            onClick={() => toggleTaskPanel()}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              isTaskPanelOpen
                ? 'bg-app-action-primary text-white shadow-2xs'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
            }`}
            title={isTaskPanelOpen ? 'Ocultar panel de tareas' : 'Abrir panel de tareas'}
          >
            <ShieldCheck className="w-4 h-4 stroke-[1.8]" />
          </button>

          {/* Información de la nota (i) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowInfoModal((v) => !v)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                showInfoModal
                  ? 'bg-black/10 text-app-text-primary'
                  : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
              }`}
              title="Información de la nota"
            >
              <Info className="w-4 h-4 stroke-[1.8]" />
            </button>

            {showInfoModal && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowInfoModal(false)}
                />
                <div className="absolute right-0 top-10 liquid-glass-card border border-white/90 rounded-2xl shadow-2xl p-4 w-60 z-40 text-app-text-primary backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100">
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
                    {note?.updatedAt && (
                      <div className="pt-2 border-t border-app-border-subtle text-[11px] text-app-text-secondary/80">
                        <span>Modificado: {new Date(note.updatedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mover a carpeta (FolderInput) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFolderMenu((v) => !v)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                showFolderMenu
                  ? 'bg-black/10 text-app-text-primary'
                  : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
              }`}
              title={currentFolder ? `Mover (en ${currentFolder.name})` : 'Mover a carpeta'}
            >
              <FolderInput className="w-4 h-4 stroke-[1.8]" />
            </button>

            {showFolderMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowFolderMenu(false)}
                />
                <div className="absolute right-0 top-10 liquid-glass-card border border-white/90 rounded-xl shadow-xl py-1.5 w-44 z-40 text-xs text-app-text-primary animate-in fade-in zoom-in-95 duration-100">
                  <span className="px-3 py-1 text-[10px] font-bold text-app-text-secondary uppercase tracking-wider block">
                    Mover a carpeta
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (note) moveNoteToFolder(note.id, undefined);
                      setShowFolderMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-black/5 transition-colors ${
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
                      className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-black/5 transition-colors ${
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

          {/* Eliminar nota (Papelera) */}
          <button
            type="button"
            onClick={handleDeleteNote}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-app-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Enviar nota a la papelera"
          >
            <Trash2 className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>
      </div>

      {/* 2. Segunda Fila: Barra cápsula flotante con los iconos exactos de formato */}
      <div className="px-6 py-1 flex items-center">
        <div className="w-full bg-[#F1F2F5] border border-black/[0.04] rounded-2xl px-3 py-1 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-2xs">
          {/* Deshacer */}
          <button
            type="button"
            disabled={!editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 disabled:opacity-30 transition-colors"
            title="Deshacer (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5 stroke-[2]" />
          </button>

          {/* Rehacer */}
          <button
            type="button"
            disabled={!editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 disabled:opacity-30 transition-colors"
            title="Rehacer (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5 stroke-[2]" />
          </button>

          {/* Negrita (B) */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
              editor?.isActive('bold')
                ? 'bg-black/10 text-app-text-primary font-bold'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
            }`}
            title="Negrita (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5 stroke-[2.4]" />
          </button>

          {/* Cursiva (I) */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
              editor?.isActive('italic')
                ? 'bg-black/10 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
            }`}
            title="Cursiva (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5 stroke-[2]" />
          </button>

          {/* Tachado (S) */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
              editor?.isActive('strike')
                ? 'bg-black/10 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
            }`}
            title="Tachado"
          >
            <Strikethrough className="w-3.5 h-3.5 stroke-[2]" />
          </button>

          {/* Subrayado (U) */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
              editor?.isActive('underline')
                ? 'bg-black/10 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
            }`}
            title="Subrayado"
          >
            <UnderlineIcon className="w-3.5 h-3.5 stroke-[2]" />
          </button>

          {/* Alinear a la izquierda */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
              editor?.isActive({ textAlign: 'left' })
                ? 'bg-black/10 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
            }`}
            title="Alinear a la izquierda"
          >
            <AlignLeft className="w-3.5 h-3.5 stroke-[2]" />
          </button>

          {/* Alinear al centro */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
              editor?.isActive({ textAlign: 'center' })
                ? 'bg-black/10 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
            }`}
            title="Centrar"
          >
            <AlignCenter className="w-3.5 h-3.5 stroke-[2]" />
          </button>

          {/* Alinear a la derecha */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
              editor?.isActive({ textAlign: 'right' })
                ? 'bg-black/10 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
            }`}
            title="Alinear a la derecha"
          >
            <AlignRight className="w-3.5 h-3.5 stroke-[2]" />
          </button>

          {/* Justificar */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
              editor?.isActive({ textAlign: 'justify' })
                ? 'bg-black/10 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
            }`}
            title="Justificar"
          >
            <AlignJustify className="w-3.5 h-3.5 stroke-[2]" />
          </button>

          {/* Viñetas (Lista) */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
              editor?.isActive('bulletList')
                ? 'bg-black/10 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
            }`}
            title="Lista con viñetas"
          >
            <List className="w-3.5 h-3.5 stroke-[2]" />
          </button>

          {/* H1 */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
              editor?.isActive('heading', { level: 1 })
                ? 'bg-black/10 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
            }`}
            title="Título 1"
          >
            H1
          </button>

          {/* H2 */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
              editor?.isActive('heading', { level: 2 })
                ? 'bg-black/10 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5'
            }`}
            title="Título 2"
          >
            H2
          </button>
        </div>
      </div>

      {/* 3. Línea divisoria delgada */}
      <div className="w-full border-b border-app-border-subtle mt-2" />
    </div>
  );
};
