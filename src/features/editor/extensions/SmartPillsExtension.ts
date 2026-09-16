import { Extension } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Note } from '../../../types';

export interface SmartPillsOptions {
  getNotes: () => Note[];
  onOpenNote?: (noteTitle: string) => void;
}

export const SmartPillsExtension = Extension.create<SmartPillsOptions>({
  name: 'smartPills',

  addOptions() {
    return {
      getNotes: () => [],
      onOpenNote: undefined,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    const pluginKey = new PluginKey('smartPills');

    return [
      new Plugin({
        key: pluginKey,
        props: {
          decorations(state) {
            const { doc } = state;
            const decorations: Decoration[] = [];
            const notes = options.getNotes ? options.getNotes() : [];
            const noteTitleMap = new Map(
              notes.map((n) => [n.title.trim().toLowerCase(), n])
            );

            doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;

              // 1. Wikilinks [[Título]]
              const wikilinkRegex = /\[\[([^\]\n]+)\]\]/g;
              let match: RegExpExecArray | null;
              while ((match = wikilinkRegex.exec(node.text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;
                const targetTitle = match[1].trim();
                const isConnected = noteTitleMap.has(targetTitle.toLowerCase());

                decorations.push(
                  Decoration.inline(start, end, {
                    class: isConnected
                      ? 'wikilink-pill wikilink-connected'
                      : 'wikilink-pill wikilink-unresolved',
                    'data-title': targetTitle,
                    'data-connected': isConnected ? 'true' : 'false',
                    title: isConnected
                      ? `✓ Conectado con "${targetTitle}" (Clic para abrir)`
                      : `Nota no creada: "${targetTitle}" (Clic para crear)`,
                  })
                );
              }

              // 2. Tags #tema
              const tagRegex = /(?:^|\s)(#[\w\u00C0-\u017F-]+)/g;
              while ((match = tagRegex.exec(node.text)) !== null) {
                const fullMatch = match[0];
                const tag = match[1];
                const offset = fullMatch.indexOf(tag);
                const start = pos + match.index + offset;
                const end = start + tag.length;

                decorations.push(
                  Decoration.inline(start, end, {
                    class: 'tag-pill',
                    title: `Etiqueta ${tag}`,
                  })
                );
              }

              // 3. Menciones @persona
              const mentionRegex = /(?:^|\s)(@[\w\u00C0-\u017F-]+)/g;
              while ((match = mentionRegex.exec(node.text)) !== null) {
                const fullMatch = match[0];
                const mention = match[1];
                const offset = fullMatch.indexOf(mention);
                const start = pos + match.index + offset;
                const end = start + mention.length;

                decorations.push(
                  Decoration.inline(start, end, {
                    class: 'mention-pill',
                    title: `Mención ${mention}`,
                  })
                );
              }
            });

            return DecorationSet.create(doc, decorations);
          },
          handleClick(_view, _pos, event) {
            const target = event.target as HTMLElement | null;
            const pill = target?.closest('.wikilink-pill') as HTMLElement | null;
            if (pill) {
              const noteTitle = pill.getAttribute('data-title');
              if (noteTitle && options.onOpenNote) {
                options.onOpenNote(noteTitle);
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});
