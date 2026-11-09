import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // GitHub Pages project sites live under /<repo>/; the custom domain uses '/'.
  base: (process.env.PAGES_BASE_PATH ?? '') + '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) }
  },
  // openplans loads its .wasm via `new URL(..., import.meta.url)`, which pre-bundling breaks.
  optimizeDeps: {
    exclude: ['opengeometry', '@opengeometry/openplans']
  }
});
