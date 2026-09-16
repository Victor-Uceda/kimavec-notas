/**
 * Utilidades puras para sincronizar tareas con el contenido de la nota (Single Source of Truth),
 * soportando tanto el formato HTML interactivo de TipTap como Markdown estándar.
 */

export function toggleTaskInContent(
  content: string,
  targetTitle: string,
  currentCompleted: boolean,
  taskIndex?: number
): string {
  if (!content) return content;
  const nextCheckedBool = !currentCompleted;
  const nextCheckedStr = nextCheckedBool ? 'true' : 'false';

  // 1. TipTap HTML taskItem (Browser DOMParser para manipulación exacta del árbol DOM)
  if (typeof DOMParser !== 'undefined' && content.includes('data-type="taskItem"')) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const items = Array.from(doc.querySelectorAll('li[data-type="taskItem"]'));

      let targetItem: Element | undefined;
      // 1.1 Coincidencia por índice si es provisto
      if (typeof taskIndex === 'number' && items[taskIndex]) {
        targetItem = items[taskIndex];
      }

      // 1.2 Si no se especificó índice o no coincide, buscar por contenido de texto
      if (!targetItem) {
        const cleanTarget = targetTitle.trim().toLowerCase();
        targetItem = items.find((item) => {
          const itemText = (item.textContent || '').trim().toLowerCase();
          return (
            itemText.includes(cleanTarget) ||
            cleanTarget.includes(itemText)
          );
        });
      }

      if (targetItem) {
        targetItem.setAttribute('data-checked', nextCheckedStr);
        const input = targetItem.querySelector('input[type="checkbox"]');
        if (input) {
          if (nextCheckedBool) {
            input.setAttribute('checked', 'checked');
          } else {
            input.removeAttribute('checked');
          }
        }
        return doc.body.innerHTML;
      }
    } catch {
      // Fallback a regex en caso de error de parseo
    }
  }

  // 1b. Fallback TipTap HTML con regex seguro elemento por elemento
  if (content.includes('data-type="taskItem"')) {
    let count = 0;
    const cleanTarget = targetTitle.trim().toLowerCase();
    return content.replace(/<li\b[^>]*data-type="taskItem"[^>]*>[\s\S]*?<\/li>/gi, (match) => {
      const isMatch =
        (typeof taskIndex === 'number' && count === taskIndex) ||
        match.toLowerCase().includes(cleanTarget);
      count++;
      if (isMatch) {
        let updated = match.replace(/data-checked="(true|false)"/i, `data-checked="${nextCheckedStr}"`);
        if (nextCheckedBool) {
          if (!updated.includes('checked="checked"')) {
            updated = updated.replace(/<input\b([^>]*)type="checkbox"([^>]*)>/i, '<input$1type="checkbox"$2 checked="checked">');
          }
        } else {
          updated = updated.replace(/\s*checked="checked"/gi, '').replace(/\s*checked(?=[\s>])/gi, '');
        }
        return updated;
      }
      return match;
    });
  }

  // 2. Markdown - [ ] / - [x]
  const lines = content.split('\n');
  let currentTaskIdx = 0;
  const cleanTarget = targetTitle.trim().toLowerCase();
  const updatedLines = lines.map((line) => {
    const match = line.match(/^\s*-\s*\[([ xX])\]\s+(.+)$/);
    if (match) {
      const lineText = match[2].trim().toLowerCase();
      const isTarget =
        (typeof taskIndex === 'number' && currentTaskIdx === taskIndex) ||
        lineText.includes(cleanTarget) ||
        cleanTarget.includes(lineText);
      currentTaskIdx++;
      if (isTarget) {
        const nextMark = nextCheckedBool ? 'x' : ' ';
        return line.replace(/-\s*\[([ xX])\]/, `- [${nextMark}]`);
      }
    }
    return line;
  });
  return updatedLines.join('\n');
}

export function deleteTaskFromContent(
  content: string,
  targetTitle: string,
  taskIndex?: number
): string {
  if (!content) return content;

  // 1. TipTap HTML (Browser DOMParser)
  if (typeof DOMParser !== 'undefined' && content.includes('data-type="taskItem"')) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const items = Array.from(doc.querySelectorAll('li[data-type="taskItem"]'));

      let targetItem: Element | undefined;
      if (typeof taskIndex === 'number' && items[taskIndex]) {
        targetItem = items[taskIndex];
      }

      if (!targetItem) {
        const cleanTarget = targetTitle.trim().toLowerCase();
        targetItem = items.find((item) => {
          const itemText = (item.textContent || '').trim().toLowerCase();
          return itemText.includes(cleanTarget) || cleanTarget.includes(itemText);
        });
      }

      if (targetItem) {
        targetItem.remove();
        return doc.body.innerHTML;
      }
    } catch {
      // Fallback
    }
  }

  // 1b. Fallback TipTap HTML con regex elemento por elemento
  if (content.includes('data-type="taskItem"')) {
    let count = 0;
    const cleanTarget = targetTitle.trim().toLowerCase();
    return content.replace(/<li\b[^>]*data-type="taskItem"[^>]*>[\s\S]*?<\/li>/gi, (match) => {
      const isMatch =
        (typeof taskIndex === 'number' && count === taskIndex) ||
        match.toLowerCase().includes(cleanTarget);
      count++;
      return isMatch ? '' : match;
    });
  }

  // 2. Markdown
  const lines = content.split('\n');
  let currentTaskIdx = 0;
  const cleanTarget = targetTitle.trim().toLowerCase();
  const updatedLines = lines.filter((line) => {
    const match = line.match(/^\s*-\s*\[([ xX])\]\s+(.+)$/);
    if (match) {
      const lineText = match[2].trim().toLowerCase();
      const isTarget =
        (typeof taskIndex === 'number' && currentTaskIdx === taskIndex) ||
        lineText.includes(cleanTarget) ||
        cleanTarget.includes(lineText);
      currentTaskIdx++;
      return !isTarget;
    }
    return true;
  });
  return updatedLines.join('\n');
}

export function clearCompletedTasksFromContent(content: string): string {
  if (!content) return content;

  // 1. TipTap HTML (Browser DOMParser)
  if (typeof DOMParser !== 'undefined' && content.includes('data-type="taskItem"')) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const items = Array.from(doc.querySelectorAll('li[data-type="taskItem"]'));
      items.forEach((item) => {
        const isCompleted =
          item.getAttribute('data-checked') === 'true' ||
          item.querySelector('input[type="checkbox"]')?.hasAttribute('checked');
        if (isCompleted) {
          item.remove();
        }
      });
      return doc.body.innerHTML;
    } catch {
      // Fallback
    }
  }

  // 1b. Fallback TipTap HTML
  if (content.includes('data-type="taskItem"')) {
    return content.replace(
      /<li[^>]*data-type="taskItem"[^>]*data-checked="true"[^>]*>[\s\S]*?<\/li>/gi,
      ''
    );
  }

  // 2. Markdown
  const lines = content.split('\n');
  const updatedLines = lines.filter((line) => !line.match(/^\s*-\s*\[[xX]\]\s+/));
  return updatedLines.join('\n');
}

export function addTaskToContent(content: string, title: string): string {
  const baseContent = content || '<p></p>';
  const taskHtml = `<li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>${title}</p></div></li>`;

  if (baseContent.includes('data-type="taskList"')) {
    return baseContent.replace('</ul>', `${taskHtml}</ul>`);
  }
  return `${baseContent}<ul data-type="taskList">${taskHtml}</ul>`;
}
