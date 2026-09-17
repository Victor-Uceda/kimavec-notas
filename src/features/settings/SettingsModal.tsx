import React from 'react';
import { X, Sun, Moon, Database, FileText } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { notes, theme, setTheme } = useAppStore();

  if (!isOpen) return null;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="liquid-glass-card border border-app-border-subtle rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-5 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera limpia y minimalista */}
        <div className="flex items-center justify-between pb-1 border-b border-app-border-subtle/60">
          <h3 className="text-body font-semibold text-app-text-primary tracking-tight">
            Configuración
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Selector de Tema (Segmented control elegante) */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-app-text-secondary">
            Apariencia
          </span>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-app-canvas rounded-xl border border-app-border-subtle">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                theme === 'light'
                  ? 'bg-app-editor text-app-text-primary shadow-xs font-semibold'
                  : 'text-app-text-secondary hover:text-app-text-primary'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Claro</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-app-editor text-app-text-primary shadow-xs font-semibold'
                  : 'text-app-text-secondary hover:text-app-text-primary'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Oscuro (OLED)</span>
            </button>
          </div>
        </div>

        {/* 2. Exportación Minimalista */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-app-text-secondary">
            Exportar datos
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportJSON}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-app-border-subtle bg-app-canvas hover:bg-app-active-pill text-app-text-primary text-xs font-medium transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-app-text-secondary" />
              <span>JSON</span>
            </button>

            <button
              type="button"
              onClick={handleExportMarkdown}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-app-border-subtle bg-app-canvas hover:bg-app-active-pill text-app-text-primary text-xs font-medium transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-app-text-secondary" />
              <span>Markdown</span>
            </button>
          </div>
        </div>

        {/* Pie de versión discreto */}
        <div className="pt-2 border-t border-app-border-subtle/50 flex items-center justify-between text-[11px] text-app-text-secondary/70">
          <span>Notas</span>
          <span>v0.1.0</span>
        </div>
      </div>
    </div>
  );
};
