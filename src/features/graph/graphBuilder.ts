import type { Note } from '../../types';

export interface GraphNode {
  id: string;
  label: string;
  type: 'note' | 'mention' | 'tag';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  noteId?: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  initialNodes: GraphNode[];
  initialLinks: GraphLink[];
}

/**
 * Construye el modelo relacional del grafo cognitivo a partir de notas,
 * extrayendo sinapsis por Wikilinks [[...]], menciones de título, hashtags #tag y @colaboradores.
 */
export function buildGraphData(validNotes: Note[], activeNoteId: string): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const mentionsSet = new Set<string>();
  const tagsSet = new Set<string>();

  const width = 900;
  const height = 650;
  const count = Math.max(validNotes.length, 1);

  // 1. Nodos de Notas principales
  validNotes.forEach((note, index) => {
    const angle = (index / count) * Math.PI * 2;
    const radius = 220;
    // Posición determinista basada en el índice (elimina Math.random en render)
    const jitter = ((index % 5) - 2) * 5;
    const x = width / 2 + Math.cos(angle) * radius + jitter;
    const y = height / 2 + Math.sin(angle) * radius + jitter;

    nodes.push({
      id: `note-${note.id}`,
      label: note.title.trim() || 'Nota sin título',
      type: 'note',
      x,
      y,
      vx: 0,
      vy: 0,
      radius: note.id === activeNoteId ? 26 : 20,
      noteId: note.id,
    });

    // A. Conexión por Wikilinks: [[Título]]
    const wikilinkMatches = Array.from(note.content.matchAll(/\[\[(.*?)\]\]/g));
    wikilinkMatches.forEach((m) => {
      const targetTitle = m[1].trim().toLowerCase();
      const targetNote = validNotes.find(
        (other) => other.id !== note.id && other.title.trim().toLowerCase() === targetTitle
      );
      if (targetNote) {
        links.push({
          source: `note-${note.id}`,
          target: `note-${targetNote.id}`,
        });
      }
    });

    // B. Conexión por mención natural de título
    validNotes.forEach((other) => {
      if (other.id !== note.id && other.title.trim().length >= 4) {
        const plain = note.content.replace(/<[^>]+>/g, '').toLowerCase();
        if (plain.includes(other.title.trim().toLowerCase())) {
          const alreadyLinked = links.some(
            (l) =>
              (l.source === `note-${note.id}` && l.target === `note-${other.id}`) ||
              (l.source === `note-${other.id}` && l.target === `note-${note.id}`)
          );
          if (!alreadyLinked) {
            links.push({
              source: `note-${note.id}`,
              target: `note-${other.id}`,
            });
          }
        }
      }
    });

    // C. Conexión por Etiquetas (#tema)
    const tagMatches = note.content.match(/#([a-zA-Z0-9_\u00C0-\u017F]+)/g);
    if (tagMatches) {
      tagMatches.forEach((t) => {
        const tagName = t.replace('#', '').toLowerCase();
        tagsSet.add(tagName);
        links.push({
          source: `note-${note.id}`,
          target: `tag-${tagName}`,
        });
      });
    }

    // D. Conexión por Menciones (@persona)
    const mentionMatches = note.content.match(/@(\w+)/g);
    if (mentionMatches) {
      mentionMatches.forEach((m) => {
        const mentionName = m.replace('@', '');
        mentionsSet.add(mentionName);
        links.push({
          source: `note-${note.id}`,
          target: `mention-${mentionName}`,
        });
      });
    }
  });

  // 2. Nodos satélite de Etiquetas (#tag)
  Array.from(tagsSet).forEach((tag, index) => {
    const angle = (index / Math.max(tagsSet.size, 1)) * Math.PI * 2 + Math.PI / 6;
    const radius = 110;
    nodes.push({
      id: `tag-${tag}`,
      label: `#${tag}`,
      type: 'tag',
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      radius: 17,
    });
  });

  // 3. Nodos satélite de Menciones (@colaborador)
  Array.from(mentionsSet).forEach((mention, index) => {
    const angle = (index / Math.max(mentionsSet.size, 1)) * Math.PI * 2 + Math.PI / 3;
    const radius = 130;
    nodes.push({
      id: `mention-${mention}`,
      label: `@${mention}`,
      type: 'mention',
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      radius: 18,
    });
  });

  return { initialNodes: nodes, initialLinks: links };
}
