/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          canvas: '#F5F6F8',
          editor: '#FFFFFF',
          sidebar: '#FBFBFD',
          'active-pill': '#E8EAED',
          border: {
            subtle: '#E5E7EB',
          },
          action: {
            primary: '#0D0D0D',
          },
          text: {
            primary: '#111827',
            secondary: '#6B7280',
            disabled: '#9CA3AF',
          },
          badge: {
            highBg: '#FEE2E2',
            highText: '#B91C1C',
            tagBg: '#F3F4F6',
            tagText: '#4B5563',
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
