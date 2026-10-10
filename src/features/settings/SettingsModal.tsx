import React from 'react';
import { X, Sun, Moon, Database, FileText, Flame } from 'lucide-react';
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
    link.download = `notas_backup_${new Date().toISOString().split('T')[0]}.json`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-app-editor border border-app-border-subtle rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 border-b border-app-border-subtle">
          <div className="flex items-center gap-2">
            <i className="fi fi-rr-settings text-lg text-app-text-secondary leading-none" />
            <h3 className="text-sm font-semibold text-app-text-primary">
              Configuración
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-app-text-secondary hover:text-app-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* 1. Selector de Tema (Segmented control elegante de 3 opciones) */}
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-medium text-app-text-secondary">
              Apariencia
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-app-canvas rounded-xl border border-app-border-subtle">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
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
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-app-editor text-app-text-primary shadow-xs font-semibold'
                    : 'text-app-text-secondary hover:text-app-text-primary'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>OLED</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('amber')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                  theme === 'amber'
                    ? 'bg-app-editor text-app-text-primary shadow-xs font-semibold'
                    : 'text-app-text-secondary hover:text-app-text-primary'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Ámbar</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Exportación Minimalista */}
        <div className="p-4 pt-0 space-y-2">
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

        {/* Pie y Créditos de la App */}
        <div className="px-5 py-4 border-t border-app-border-subtle bg-app-canvas/40 flex flex-col gap-2 text-xs text-app-text-secondary">
          <div className="flex items-center justify-between font-medium text-app-text-primary">
            <span className="flex items-center gap-1.5">
              <span className="font-semibold">Notas</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-app-active-pill text-app-text-secondary font-mono border border-app-border-subtle/40">
                v0.1.0
              </span>
            </span>
            <span className="text-[11px] text-app-text-secondary font-normal">
              Hecho con sueño por <span className="text-app-text-primary font-medium">Victor Uceda</span>
            </span>
          </div>
          <p className="text-[11px] text-app-text-secondary/80 leading-relaxed">
            Espacio de notas, tareas y grafos minimalista, rápido y con almacenamiento 100% local y privado.
          </p>
        </div>
      </div>
    </div>
  );
};
