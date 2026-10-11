# Stack Tecnológico

Este documento define la arquitectura técnica, librerías, motores de procesamiento y la configuración de estilos de la aplicación.

---

## 1. Diagrama de Capas de la Aplicación

```plaintext
+-------------------------------------------------------------------------------+
|                             Capa de Presentación                              |
|             React / Vite (o Vanilla JS / Next.js) + Tailwind CSS              |
+-------------------------------------------------------------------------------+
|                             Capa de Edición & Rich Text                       |
|           TipTap / ProseMirror (o Lexical) + Markdown AST Parser              |
+-------------------------------------------------------------------------------+
|                             Capa de Estado & Reactividad                      |
|                  Zustand / Nanostores (Estado Unidireccional)                 |
+-------------------------------------------------------------------------------+
|                             Capa de Persistencia Local                        |
|              IndexedDB / LocalStorage / SQLite (si Tauri/Electron)             |
+-------------------------------------------------------------------------------+
```

---

## 2. Tecnologías Clave Seleccionadas

- **Frontend Core:** React con Vite (o Next.js / Vanilla JS según la meta de distribución). Provee renderizado reactivo y carga instantánea.
- **Sistema de Diseño y Estilos:** Tailwind CSS con tokens mapeados a variables semánticas (`tailwind.config.js`).
- **Motor de Edición Rich Text:** TipTap (basado en ProseMirror). Permite:
  - Documentos estructurados en nodos (bloques, listas, títulos).
  - Serialización directa a Markdown y JSON AST.
  - Extensiones personalizadas para detección automática de tareas (`TaskItem`).
- **Iconografía:** Lucide Icons (diseño consistente con trazo limpio de 1.5px a 2px y soporte SVG inline).
- **Gestión de Estado Reactivo:** Zustand o Nanostores. Estado atómico, ultraligero y desacoplado de la vista.
- **Almacenamiento Local:** IndexedDB (vía Dexie.js) para persistencia rápida en el navegador, o SQLite si se empaqueta como app de escritorio con Tauri / Electron.

---

## 3. Configuración de Tailwind CSS (`tailwind.config.js`) y Sistema de Temas

El diseño utiliza tokens mapeados dinámicamente a **Variables CSS Semánticas** (`var(--app-...)`). Esto permite alternar instantáneamente entre el modo claro (*Light*) y el modo oscuro profundo (*OLED #000000*) sin recompilar estilos ni sobrecargar selectores:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          canvas: 'var(--app-canvas)',
          editor: 'var(--app-editor)',
          sidebar: 'var(--app-sidebar)',
          'active-pill': 'var(--app-active-pill)',
          border: {
            subtle: 'var(--app-border-subtle)',
          },
          action: {
            primary: 'var(--app-action-primary)',
            'primary-hover': 'var(--app-action-primary-hover)',
            'primary-text': 'var(--app-action-primary-text)',
          },
          text: {
            primary: 'var(--app-text-primary)',
            secondary: 'var(--app-text-secondary)',
            disabled: 'var(--app-text-disabled)',
          },
          badge: {
            highBg: 'var(--app-badge-high-bg)',
            highText: 'var(--app-badge-high-text)',
            tagBg: 'var(--app-badge-tag-bg)',
            tagText: 'var(--app-badge-tag-text)',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        sheet: '24px',
        dock: '12px',
        checkbox: '6px',
        badge: '6px',
        action: '9999px',
      },
      boxShadow: {
        sheet: '0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
      },
      fontSize: {
        'panel-title': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        h1: ['17px', { lineHeight: '24px', fontWeight: '700' }],
        body: ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'task-item': ['13px', { lineHeight: '18px', fontWeight: '450' }],
        task: ['13px', { lineHeight: '18px', fontWeight: '450' }],
        badge: ['11px', { lineHeight: '14px', fontWeight: '500', letterSpacing: '-0.01em' }],
      },
    },
  },
  plugins: [],
};
```

### 3.1. Clases de Estilo Personalizadas (`src/index.css`)
Adicionalmente, los efectos de translucidez y vidrio líquido se definen en `src/index.css`:
- `.liquid-glass`: Contenedores translúcidos con `backdrop-filter: blur(16px)` y sutiles reflejos de luz.
- `.liquid-glass-card`: Tarjetas con borde satinado `rgba(255, 255, 255, 0.2)` y sombra elevada.
- `.liquid-glass-pill`: Píldoras interactivas ultra-curvadas para badges y controles de vista.

