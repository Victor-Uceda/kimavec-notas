import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorToolbar } from './EditorToolbar';
import { WikilinkAutocomplete } from './WikilinkAutocomplete';
import { SmartPillsExtension } from './extensions/SmartPillsExtension';
import { useAppStore } from '../../store/useAppStore';
import type { Note } from '../../types';

const lowlight = createLowlight(common);

interface NoteEditorProps {
  note: Note;
  onChangeTitle: (title: string) => void;
  onChangeContent: (content: string) => void;
  onOpenGraph?: () => void;
  onDeleteNote?: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onChangeTitle,
  onChangeContent,
  onOpenGraph,
  onDeleteNote,
}) => {
  const { notes } = useAppStore();
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Estado para feedback visual de conexión
  const [connectionToast, setConnectionToast] = useState<string | null>(null);

  useEffect(() => {
    if (connectionToast) {
      const timer = setTimeout(() => setConnectionToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [connectionToast]);

  const showConnectionToast = useCallback((title: string) => {
    setConnectionToast(`🔗 Conexión confirmada con "${title}"`);
  }, []);

  // Estados para autocompletado [[Wikilinks]]
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestCoords, setSuggestCoords] = useState<{ top: number; left: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Posición de reemplazo del texto [[
  const rangeRef = useRef<{ from: number; to: number } | null>(null);

  // Notas candidatas para conectar
  const filteredNotes = useMemo(() => {
    const candidates = notes.filter((n) => n.id !== note.id);
    if (!query.trim()) return candidates.slice(0, 7);
    const q = query.toLowerCase();
    return candidates
      .filter((n) => n.title.toLowerCase().includes(q))
      .slice(0, 7);
  }, [notes, note.id, query]);

  // Detector de sintaxis [[
  const checkWikilink = useCallback((editorInstance: ReturnType<typeof useEditor>) => {
    if (!editorInstance) return;
    const { from, to } = editorInstance.state.selection;
    if (from !== to) {
      setIsSuggesting(false);
      return;
    }

    const textBefore = editorInstance.state.doc.textBetween(Math.max(0, from - 80), from, '\n');
    const match = textBefore.match(/\[\[([^\]\n]*)$/);

    if (match) {
      const q = match[1];
      const rangeStart = from - match[0].length;
      const coords = editorInstance.view.coordsAtPos(from);
      rangeRef.current = { from: rangeStart, to: from };
      setSuggestCoords({ top: coords.bottom + 6, left: coords.left });
      setQuery(q);
      setIsSuggesting(true);
      setSelectedIndex(0);
    } else {
      setIsSuggesting(false);
      rangeRef.current = null;
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      SmartPillsExtension.configure({
        getNotes: () => useAppStore.getState().notes,
        onOpenNote: (noteTitle: string) => {
          const currentNotes = useAppStore.getState().notes;
          const found = currentNotes.find(
            (n) => n.title.trim().toLowerCase() === noteTitle.trim().toLowerCase()
          );
          if (found) {
            useAppStore.getState().selectNote(found.id);
            setConnectionToast(`🔗 Conexión confirmada con "${found.title}"`);
          }
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: 'Escribe tus pensamientos, tareas o notas aquí (usa [[ para conectar notas)...',
      }),
    ],
    content: note.content || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose focus:outline-none max-w-none text-body text-app-text-primary',
      },
      handleKeyDown: (view, event) => {
        // Atajo Ctrl + Espacio para abrir lista de notas
        if ((event.ctrlKey || event.metaKey) && event.code === 'Space') {
          event.preventDefault();
          const { from } = view.state.selection;
          const textBefore = view.state.doc.textBetween(Math.max(0, from - 80), from, '\n');
          if (!/\[\[([^\]\n]*)$/.test(textBefore)) {
            view.dispatch(view.state.tr.insertText('[[', from));
          }
          return true;
        }

        // Navegación por teclado dentro del autocompletado
        if (isSuggesting && filteredNotes.length > 0) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % filteredNotes.length);
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + filteredNotes.length) % filteredNotes.length);
            return true;
          }
          if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            const target = filteredNotes[selectedIndex];
            if (target && rangeRef.current) {
              const insertText = `[[${target.title.trim() || 'Nota sin título'}]] `;
              view.dispatch(
                view.state.tr
                  .delete(rangeRef.current.from, rangeRef.current.to)
                  .insertText(insertText, rangeRef.current.from)
              );
              setIsSuggesting(false);
              showConnectionToast(target.title.trim() || 'Nota sin título');
            }
            return true;
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setIsSuggesting(false);
            return true;
          }
        }

        return false;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChangeContent(currentEditor.getHTML());
      checkWikilink(currentEditor);
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      checkWikilink(currentEditor);
    },
  });

  // Sincronizar contenido al cambiar de nota activa
  useEffect(() => {
    if (editor && note.content !== editor.getHTML()) {
      editor.commands.setContent(note.content || '<p></p>');
    }
  }, [note.id, note.content, editor]);

  // Auto-enfocar el título cuando se crea o abre una nota vacía
  useEffect(() => {
    if (!note.title.trim()) {
      const timer = setTimeout(() => titleInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [note.id, note.title]);

  // Insertar sinapsis al hacer clic en una sugerencia
  const handleSelectWikilink = (targetNote: Note) => {
    if (!editor || !rangeRef.current) return;
    const insertText = `[[${targetNote.title.trim() || 'Nota sin título'}]] `;
    editor
      .chain()
      .focus()
      .deleteRange({ from: rangeRef.current.from, to: rangeRef.current.to })
      .insertContent(insertText)
      .run();
    setIsSuggesting(false);
    showConnectionToast(targetNote.title.trim() || 'Nota sin título');
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-app-editor overflow-hidden relative">
      <EditorToolbar
        editor={editor}
        note={note}
        onOpenGraph={onOpenGraph}
        onDeleteNote={onDeleteNote}
      />

      {/* Hoja física de escritura */}
      <div className="flex-1 overflow-y-auto px-10 py-8 flex flex-col">
        <input
          ref={titleInputRef}
          type="text"
          value={note.title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Escribe una nota rápida..."
          className="w-full text-h1 font-bold text-app-text-primary bg-transparent outline-none border-none p-0 mb-4 placeholder:text-app-text-secondary/50 tracking-tight"
        />

        <div
          className="flex-1 cursor-text min-h-[300px]"
          onClick={() => {
            if (!editor?.isFocused) {
              editor?.commands.focus('end');
            }
          }}
        >
          <EditorContent editor={editor} className="min-h-full" />
        </div>
      </div>

      {/* Popover de autocompletado flotante */}
      {isSuggesting && suggestCoords && (
        <WikilinkAutocomplete
          query={query}
          notes={filteredNotes}
          selectedIndex={selectedIndex}
          coords={suggestCoords}
          onSelect={handleSelectWikilink}
          onHoverIndex={setSelectedIndex}
        />
      )}

      {/* Toast de confirmación de conexión neuronal */}
      {connectionToast && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-medium shadow-2xl backdrop-blur-md border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{connectionToast}</span>
        </div>
      )}
    </div>
  );
};
