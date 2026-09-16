import type { Task, TaskPriority } from '../types';

/**
 * ============================================================================
 * PATRÓN STRATEGY: Extracción Modular de Metadatos (docs/03-patrones-diseno.md 2.4)
 * ============================================================================
 */

export interface ExtractionContext {
  title: string;
  metadata: Partial<Task>;
}

export interface MetadataExtractorStrategy {
  readonly name: string;
  process(context: ExtractionContext): void;
}

/**
 * Strategy: Identifica tokens @usuario
 */
export class MentionExtractor implements MetadataExtractorStrategy {
  readonly name = 'mention';
  private readonly regex = /@(\w+)/;

  process(context: ExtractionContext): void {
    const match = context.title.match(this.regex);
    if (match) {
      context.metadata.assignee = match[1];
    }
  }
}

/**
 * Strategy: Identifica flags de prioridad !alta o [Prioridad Alta]
 */
export class PriorityExtractor implements MetadataExtractorStrategy {
  readonly name = 'priority';
  private readonly highPriorityRegex = /\[Prioridad Alta\]|!alta|!high/i;
  private readonly mediumPriorityRegex = /\[Prioridad Media\]|!media|!medium/i;
  private readonly lowPriorityRegex = /\[Prioridad Baja\]|!baja|!low/i;

  process(context: ExtractionContext): void {
    if (this.highPriorityRegex.test(context.title)) {
      context.metadata.priority = 'high';
      context.title = context.title.replace(this.highPriorityRegex, '').trim();
    } else if (this.mediumPriorityRegex.test(context.title)) {
      context.metadata.priority = 'medium';
      context.title = context.title.replace(this.mediumPriorityRegex, '').trim();
    } else if (this.lowPriorityRegex.test(context.title)) {
      context.metadata.priority = 'low';
      context.title = context.title.replace(this.lowPriorityRegex, '').trim();
    }
  }
}

/**
 * Strategy: Detecta expresiones temporales (hoy, mañana, YYYY-MM-DD, DD/MM/YYYY)
 */
export class DateExtractor implements MetadataExtractorStrategy {
  readonly name = 'date';
  private readonly dateRegex = /\b(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|hoy|mañana)\b/i;

  process(context: ExtractionContext): void {
    const match = context.title.match(this.dateRegex);
    if (match) {
      context.metadata.dueDate = match[1];
    }
  }
}

/**
 * Strategy: Detecta etiquetas #tema
 */
export class TagExtractor implements MetadataExtractorStrategy {
  readonly name = 'tag';
  private readonly tagRegex = /#([\w\u00C0-\u017F-]+)/g;

  process(context: ExtractionContext): void {
    const matches = Array.from(context.title.matchAll(this.tagRegex));
    if (matches.length > 0) {
      context.metadata.tags = matches.map((m) => m[1]);
    }
  }
}

/**
 * ============================================================================
 * PATRÓN COMPOSITE & PARSER: Construcción jerárquica de Tareas
 * ============================================================================
 */

export interface TaskParser {
  parse(content: string, noteId: string): Task[];
}

export class RuleBasedTaskParser implements TaskParser {
  private strategies: MetadataExtractorStrategy[];

  constructor(strategies?: MetadataExtractorStrategy[]) {
    this.strategies = strategies || [
      new PriorityExtractor(),
      new MentionExtractor(),
      new DateExtractor(),
      new TagExtractor(),
    ];
  }

  addStrategy(strategy: MetadataExtractorStrategy): void {
    this.strategies.push(strategy);
  }

  parse(content: string, noteId: string): Task[] {
    if (!content) return [];

    // 1. Detección en formato HTML de TipTap
    if (content.includes('data-type="taskItem"')) {
      const parsedHtmlTasks = this.parseTipTapHtml(content, noteId);
      if (parsedHtmlTasks.length > 0) return parsedHtmlTasks;
    }

    // 2. Detección en formato Markdown estándar (- [ ] / - [x])
    return this.parseMarkdown(content, noteId);
  }

  private runStrategies(rawTitle: string): { title: string; metadata: Partial<Task> } {
    const context: ExtractionContext = {
      title: rawTitle,
      metadata: {},
    };
    for (const strategy of this.strategies) {
      strategy.process(context);
    }
    return context;
  }

  private parseTipTapHtml(content: string, noteId: string): Task[] {
    if (typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const rootTaskLists = Array.from(doc.body.children).filter(
          (el) => el.tagName.toLowerCase() === 'ul' && el.getAttribute('data-type') === 'taskList'
        );

        const tasks: Task[] = [];
        rootTaskLists.forEach((listEl, listIndex) => {
          tasks.push(...this.parseHtmlListElement(listEl, noteId, `root-${listIndex}`));
        });
        return tasks;
      } catch {
        // Fallback a regex si DOMParser falla
      }
    }

    return this.parseTipTapHtmlRegex(content, noteId);
  }

  private parseHtmlListElement(container: Element, noteId: string, prefix: string): Task[] {
    const tasks: Task[] = [];
    const directItems = Array.from(container.children).filter(
      (el) => el.tagName.toLowerCase() === 'li' && el.getAttribute('data-type') === 'taskItem'
    );

    directItems.forEach((item, index) => {
      const isCompleted =
        item.getAttribute('data-checked') === 'true' ||
        item.querySelector('input[type="checkbox"]')?.hasAttribute('checked') ||
        false;

      const textEl = item.querySelector('div > p') || item.querySelector('p');
      const rawTitle = textEl?.textContent?.trim() || '';

      const { title, metadata } = this.runStrategies(rawTitle);

      // Comprobar sublistas anidadas (Composite Pattern)
      const innerList = Array.from(item.children).find(
        (el) => el.tagName.toLowerCase() === 'ul' && el.getAttribute('data-type') === 'taskList'
      );
      const subtasks = innerList
        ? this.parseHtmlListElement(innerList, noteId, `${prefix}-${index}`)
        : undefined;

      if (title) {
        tasks.push({
          id: `${noteId}-task-${prefix}-${index}`,
          noteId,
          title,
          completed: isCompleted,
          priority: metadata.priority as TaskPriority | undefined,
          assignee: metadata.assignee,
          dueDate: metadata.dueDate,
          tags: metadata.tags,
          source: 'automatic',
          createdAt: Date.now(),
          ...(subtasks && subtasks.length > 0 ? { subtasks } : {}),
        });
      }
    });

    return tasks;
  }

  private parseTipTapHtmlRegex(content: string, noteId: string): Task[] {
    const tasks: Task[] = [];
    const taskItemRegex = /<li\b[^>]*data-type="taskItem"[^>]*>([\s\S]*?)<\/li>/gi;
    let match: RegExpExecArray | null;
    let index = 0;

    while ((match = taskItemRegex.exec(content)) !== null) {
      const fullItem = match[0];
      const isCompleted = /data-checked="true"/i.test(fullItem);

      const textMatch =
        fullItem.match(/<div[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?<\/div>/i) ||
        fullItem.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

      const rawTitle = textMatch ? textMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      const { title, metadata } = this.runStrategies(rawTitle);

      if (title) {
        tasks.push({
          id: `${noteId}-task-${index++}`,
          noteId,
          title,
          completed: isCompleted,
          priority: metadata.priority as TaskPriority | undefined,
          assignee: metadata.assignee,
          dueDate: metadata.dueDate,
          tags: metadata.tags,
          source: 'automatic',
          createdAt: Date.now(),
        });
      }
    }

    return tasks;
  }

  private parseMarkdown(content: string, noteId: string): Task[] {
    const lines = content.split('\n');
    const taskRegex = /^(\s*)-\s*\[([ xX])\]\s+(.+)$/;

    const rootTasks: Task[] = [];
    const stack: { indent: number; task: Task }[] = [];
    let taskCounter = 0;

    lines.forEach((line) => {
      const match = line.match(taskRegex);
      if (!match) return;

      const indent = match[1].length;
      const isCompleted = match[2].toLowerCase() === 'x';
      const rawTitle = match[3].trim();
      const { title, metadata } = this.runStrategies(rawTitle);

      const newTask: Task = {
        id: `${noteId}-task-${taskCounter++}`,
        noteId,
        title,
        completed: isCompleted,
        priority: metadata.priority as TaskPriority | undefined,
        assignee: metadata.assignee,
        dueDate: metadata.dueDate,
        tags: metadata.tags,
        source: 'automatic',
        createdAt: Date.now(),
      };

      // Manejo del árbol jerárquico por sangría
      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      if (stack.length === 0) {
        rootTasks.push(newTask);
      } else {
        const parent = stack[stack.length - 1].task;
        if (!parent.subtasks) {
          parent.subtasks = [];
        }
        parent.subtasks.push(newTask);
      }

      stack.push({ indent, task: newTask });
    });

    return rootTasks;
  }
}

/** Instancia singleton por defecto */
export const defaultTaskParser = new RuleBasedTaskParser();

/**
 * Fachada para compatibilidad directa con el resto de la aplicación.
 */
export function extractTasksFromMarkdown(content: string, noteId: string): Task[] {
  return defaultTaskParser.parse(content, noteId);
}

/**
 * Aplana un árbol jerárquico de tareas (Composite Pattern) a una lista plana.
 */
export function flattenTasks(tasks: Task[]): Task[] {
  const result: Task[] = [];
  for (const t of tasks) {
    result.push(t);
    if (t.subtasks && t.subtasks.length > 0) {
      result.push(...flattenTasks(t.subtasks));
    }
  }
  return result;
}

/**
 * Busca recursivamente una tarea por su ID dentro de un árbol jerárquico.
 */
export function findTaskById(tasks: Task[], id: string): Task | null {
  for (const t of tasks) {
    if (t.id === id) return t;
    if (t.subtasks && t.subtasks.length > 0) {
      const found = findTaskById(t.subtasks, id);
      if (found) return found;
    }
  }
  return null;
}

