import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@tiptap/') || id.includes('node_modules/prosemirror-')) {
            return 'tiptap-vendor';
          }
          if (id.includes('node_modules/lowlight/') || id.includes('node_modules/highlight.js/')) {
            return 'syntax-highlighter';
          }
        },
      },
    },
  },
})
