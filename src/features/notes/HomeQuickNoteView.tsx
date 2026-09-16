import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useAppStore } from '../../store/useAppStore';

const QUICK_NOTE_STORAGE_KEY = 'notas_app_quick_note_draft_v1';

interface HomeQuickNoteViewProps {
  onOpenNotes: () => void;
}

export const HomeQuickNoteView: React.FC<HomeQuickNoteViewProps> = ({ onOpenNotes }) => {
  const { createNote, updateNote } = useAppStore();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialContent = localStorage.getItem(QUICK_NOTE_STORAGE_KEY) || '<p></p>';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: 'Escribe tu nota rápida aquí...',
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'prose max-w-none focus:outline-none min-h-[220px] text-body text-app-text-primary px-6 py-4 leading-relaxed',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setSaveStatus('saving');
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        const html = currentEditor.getHTML();
        localStorage.setItem(QUICK_NOTE_STORAGE_KEY, html);
        setSaveStatus('saved');
      }, 400);
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Convertir el borrador de Nota Rápida en una nota permanente y abrir en Notas
  const handleConvertToNote = async () => {
    const content = editor?.getHTML() || '<p></p>';
    const plain = editor?.getText().trim() || '';

    // Obtener la primera línea como título tentativo
    const lines = plain.split('\n').filter((l) => l.trim().length > 0);
    const title = lines.length > 0 ? lines[0].slice(0, 50) : 'Nota rápida';

    const noteId = await createNote(undefined, 'planned');
    updateNote(noteId, title, content);

    // Limpiar borrador local
    editor?.commands.setContent('<p></p>');
    localStorage.removeItem(QUICK_NOTE_STORAGE_KEY);

    notify('Nota guardada en tus notas');
    setTimeout(() => {
      onOpenNotes();
    }, 600);
  };

  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-6 bg-app-canvas select-none relative overflow-y-auto">
      {/* Lienzo flotante central estilo Ejemplo.html */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-app-border-subtle flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera del lienzo flotante */}
        <header className="px-6 py-4 border-b border-app-border-subtle flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-app-text-primary tracking-tight">
              Nota rápida
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicador de guardado en tiempo real (cloud_done) */}
            <div
              className="flex items-center gap-1.5 text-xs text-app-text-secondary transition-opacity"
              title="Indicador de auto-guardado"
            >
              <i
                className={`fi fi-rr-cloud-check text-xs leading-none ${
                  saveStatus === 'saved' ? 'text-emerald-600' : 'text-amber-500 animate-pulse'
                }`}
              />
              <span className="text-[11px] font-medium">
                {saveStatus === 'saved' ? 'Guardado' : 'Guardando...'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleConvertToNote}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-app-action-primary text-white text-xs font-medium hover:opacity-90 transition-opacity shadow-sm"
              title="Guardar en mis notas y organizar"
            >
              <i className="fi fi-rr-folder-download text-xs leading-none" />
              <span>Guardar como nota</span>
            </button>
          </div>
        </header>

        {/* Barra de herramientas sutil */}
        {editor && (
          <div className="px-6 py-2 border-b border-app-border-subtle/50 flex items-center gap-1 bg-[#FAFAFC] overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('bold') ? 'bg-black/10 text-black' : 'text-app-text-secondary hover:bg-black/5'
              }`}
              title="Negrita"
            >
              <i className="fi fi-rr-bold text-xs leading-none" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('italic') ? 'bg-black/10 text-black' : 'text-app-text-secondary hover:bg-black/5'
              }`}
              title="Cursiva"
            >
              <i className="fi fi-rr-italic text-xs leading-none" />
            </button>

            <div className="h-3.5 w-px bg-black/10 mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('bulletList') ? 'bg-black/10 text-black' : 'text-app-text-secondary hover:bg-black/5'
              }`}
              title="Viñetas"
            >
              <i className="fi fi-rr-list text-xs leading-none" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={`p-1.5 rounded-lg transition-colors ${
                editor.isActive('taskList') ? 'bg-black/10 text-black' : 'text-app-text-secondary hover:bg-black/5'
              }`}
              title="Tareas"
            >
              <i className="fi fi-rr-checkbox text-xs leading-none" />
            </button>

            <div className="h-3.5 w-px bg-black/10 mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded-lg text-app-text-secondary hover:bg-black/5 transition-colors disabled:opacity-30"
              title="Deshacer"
            >
              <i className="fi fi-rr-undo text-xs leading-none" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded-lg text-app-text-secondary hover:bg-black/5 transition-colors disabled:opacity-30"
              title="Rehacer"
            >
              <i className="fi fi-rr-redo text-xs leading-none" />
            </button>
          </div>
        )}

        {/* Área de escritura inmediata */}
        <div className="flex-1 overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Notificación toast */}
      {toastMessage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-slate-900/90 text-white text-xs font-medium shadow-2xl backdrop-blur-md border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
