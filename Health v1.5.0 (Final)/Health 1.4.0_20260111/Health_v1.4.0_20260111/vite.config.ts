import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path configuration for deployment
  // Default: "/" for root deployment
  // Change to "/your-sub-path/" for subdirectory deployment
  // Can also be set via environment variable: VITE_BASE_PATH
  base: './',
  build: {
    // Output directory for production build
    outDir: 'dist',
    // Generate source maps for debugging (optional)
    sourcemap: false,
    // Minify the output using esbuild (built-in)
    minify: 'esbuild',
  },
  server: {
    // Development server port
    port: 3000,
    // Open browser automatically
    open: true,
  },
  preview: {
    // Preview server port
    port: 4173,
  },
})
