import React from 'react';
import type { Editor } from '@tiptap/react';
import {
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
} from 'lucide-react';
import type { Note } from '../../types';

interface EditorToolbarProps {
  editor: Editor | null;
  note?: Note;
  onClose?: () => void;
  onDeleteNote?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  return (
    <div className="w-full flex flex-col select-none bg-app-editor relative shrink-0">
      {/* Barra cápsula flotante con los controles de formato */}
      <div className="px-3 sm:px-6 py-1.5 flex items-center">
        <div data-editor-toolbar className="w-full bg-app-canvas dark:bg-app-canvas border border-app-border-subtle rounded-2xl px-2.5 sm:px-3 py-1 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-2xs">
          {/* Deshacer */}
          <button
            type="button"
            disabled={!editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
            title="Deshacer (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5 stroke-[2]" />
          </button>

          {/* Rehacer */}
          <button
            type="button"
            disabled={!editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
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
                ? 'bg-black/10 dark:bg-white/15 text-app-text-primary font-bold'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10'
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
                ? 'bg-black/10 dark:bg-white/15 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10'
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
                ? 'bg-black/10 dark:bg-white/15 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10'
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
                ? 'bg-black/10 dark:bg-white/15 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10'
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
                ? 'bg-black/10 dark:bg-white/15 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10'
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
                ? 'bg-black/10 dark:bg-white/15 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10'
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
                ? 'bg-black/10 dark:bg-white/15 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10'
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
                ? 'bg-black/10 dark:bg-white/15 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10'
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
                ? 'bg-black/10 dark:bg-white/15 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10'
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
                ? 'bg-black/10 dark:bg-white/15 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10'
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
                ? 'bg-black/10 dark:bg-white/15 text-app-text-primary'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title="Título 2"
          >
            H2
          </button>
        </div>
      </div>

      {/* Línea divisoria delgada */}
      <div className="w-full border-b border-app-border-subtle" />
    </div>
  );
};
