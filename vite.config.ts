import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// THE HAND-ME-DOWN — Vite config.
// CSS modules are on by default for *.module.css; theme tokens load globally.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
