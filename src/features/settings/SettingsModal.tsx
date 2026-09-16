import React, { useMemo } from 'react';
import { Settings, Database, Download, FileText, X, HardDrive, Info } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { extractTasksFromMarkdown } from '../../utils/taskParser';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { notes } = useAppStore();

  const totalTasks = useMemo(() => {
    return notes.reduce((acc, n) => acc + extractTasksFromMarkdown(n.content, n.id).length, 0);
  }, [notes]);

  if (!isOpen) return null;

  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  const handleExportJSON = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notes,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notas-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    let mdContent = `# Respaldo de Notas\nExportado el: ${new Date().toLocaleString()}\n\n---\n\n`;

    notes.forEach((note, index) => {
      mdContent += `## ${index + 1}. ${note.title || 'Sin título'}\n\n`;
      // Convertir HTML básico a texto plano/markdown
      const text = note.content
        .replace(/<h1>/gi, '# ')
        .replace(/<\/h1>/gi, '\n')
        .replace(/<h2>/gi, '## ')
        .replace(/<\/h2>/gi, '\n')
        .replace(/<p>/gi, '')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<li[^>]*data-checked="true"[^>]*>[\s\S]*?<div><p>(.*?)<\/p><\/div><\/li>/gi, '- [x] $1\n')
        .replace(/<li[^>]*data-checked="false"[^>]*>[\s\S]*?<div><p>(.*?)<\/p><\/div><\/li>/gi, '- [ ] $1\n')
        .replace(/<[^>]+>/g, '');
      mdContent += `${text.trim()}\n\n---\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notas-coleccion-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="liquid-glass-card border border-white/90 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col backdrop-blur-2xl">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-app-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-app-active-pill flex items-center justify-center text-app-text-primary">
              <Settings className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-body font-bold text-app-text-primary">
                Configuración del Sistema
              </h3>
              <p className="text-badge text-app-text-secondary">
                Preferencias y respaldo del espacio de trabajo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Almacenamiento */}
          <div>
            <h4 className="text-task font-semibold text-app-text-primary mb-3 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-app-text-secondary" />
              <span>Motor de Persistencia</span>
            </h4>

            <div className="bg-app-canvas rounded-xl p-4 border border-app-border-subtle/70 space-y-2.5 text-task">
              <div className="flex items-center justify-between">
                <span className="text-app-text-secondary">Base de datos:</span>
                <span className="font-semibold text-app-text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {isTauri ? 'SQLite Nativo (Tauri v2)' : 'LocalStorage (Navegador)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-app-text-secondary">Notas almacenadas:</span>
                <span className="font-medium text-app-text-primary">{notes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-app-text-secondary">Tareas registradas:</span>
                <span className="font-medium text-app-text-primary">{totalTasks}</span>
              </div>
            </div>
          </div>

          {/* Exportación y Respaldo */}
          <div>
            <h4 className="text-task font-semibold text-app-text-primary mb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-app-text-secondary" />
              <span>Copia de Seguridad y Exportación</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex flex-col items-start p-3.5 rounded-xl border border-app-border-subtle hover:border-black/30 hover:bg-black/[0.02] transition-all text-left group"
              >
                <Database className="w-4 h-4 text-app-text-secondary group-hover:text-black mb-2" />
                <span className="text-task font-semibold text-app-text-primary">
                  Copia JSON
                </span>
                <span className="text-badge text-app-text-secondary mt-0.5">
                  Respaldo completo de notas y tareas
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportMarkdown}
                className="flex flex-col items-start p-3.5 rounded-xl border border-app-border-subtle hover:border-black/30 hover:bg-black/[0.02] transition-all text-left group"
              >
                <FileText className="w-4 h-4 text-app-text-secondary group-hover:text-black mb-2" />
                <span className="text-task font-semibold text-app-text-primary">
                  Exportar Markdown
                </span>
                <span className="text-badge text-app-text-secondary mt-0.5">
                  Archivo legible para Obsidian o editores
                </span>
              </button>
            </div>
          </div>

          {/* Acerca de */}
          <div className="pt-2 border-t border-app-border-subtle/80 flex items-center justify-between text-badge text-app-text-secondary">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Notas • Zero-distraction Canvas
            </span>
            <span>Versión 0.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
