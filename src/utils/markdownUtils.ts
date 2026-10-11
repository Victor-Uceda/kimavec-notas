import type { Note } from '../types';

/**
 * Convierte contenido HTML básico generado por TipTap a formato Markdown limpio.
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  return html
    .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<s>(.*?)<\/s>/gi, '~~$1~~')
    .replace(/<strike>(.*?)<\/strike>/gi, '~~$1~~')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<li[^>]*data-checked="true"[^>]*>[\s\S]*?<div><p>(.*?)<\/p><\/div><\/li>/gi, '- [x] $1\n')
    .replace(/<li[^>]*data-checked="false"[^>]*>[\s\S]*?<div><p>(.*?)<\/p><\/div><\/li>/gi, '- [ ] $1\n')
    .replace(/<li[^>]*data-checked="true"[^>]*>[\s\S]*?(.*?)<\/li>/gi, '- [x] $1\n')
    .replace(/<li[^>]*data-checked="false"[^>]*>[\s\S]*?(.*?)<\/li>/gi, '- [ ] $1\n')
    .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Descarga una cadena de texto como archivo Markdown.
 */
export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = filename.endsWith('.md') ? filename : `${filename}.md`;
  link.download = safeName;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Exporta una nota individual como archivo .md.
 */
export function exportSingleNoteMarkdown(note: Note): void {
  const title = (note.title || 'Sin título').trim();
  const safeFilename = title.replace(/[\\/:*?"<>|]/g, '-').slice(0, 50) || 'nota';
  const bodyMarkdown = htmlToMarkdown(note.content || '');
  const content = `# ${title}\n\n${bodyMarkdown}\n`;
  downloadMarkdown(safeFilename, content);
}
