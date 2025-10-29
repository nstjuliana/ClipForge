/**
 * Vite Configuration for Electron + React
 * 
 * Configures Vite to work with Electron's dual-process architecture.
 * Sets up React plugin, path aliases, and Electron integration.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: path.resolve(__dirname, 'src/renderer'),
  plugins: [
    react(),
    electron([
      {
        // Main process entry point
        entry: path.resolve(__dirname, 'src/main/index.ts'),
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron/main'),
            minify: false,
            rollupOptions: {
              external: ['electron', 'path', 'fs', 'fs/promises', 'crypto', 'fluent-ffmpeg', 'ffmpeg-static', 'ffprobe-static'],
              output: {
                format: 'cjs',
                entryFileNames: 'index.js',
                exports: 'auto'
              }
            }
          }
        }
      },
      {
        // Preload script entry point
        entry: path.resolve(__dirname, 'src/preload/index.ts'),
        onstart(options) {
          // Notify renderer of preload changes
          options.reload();
        },
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron/preload'),
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs',
                entryFileNames: 'index.js'
              }
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer')
    }
  },
  build: {
    outDir: path.resolve(__dirname, 'dist-electron/renderer'),
    emptyOutDir: true
  },
  server: {
    port: 5173
  }
});

