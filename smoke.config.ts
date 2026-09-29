import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Builds a single IIFE bundle so the app can be executed inside jsdom. */
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: 'smoke-dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: 'src/smoke.tsx',
      name: 'Smoke',
      formats: ['iife'],
      fileName: () => 'smoke.js',
    },
  },
})
