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
