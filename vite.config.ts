import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import { resolve } from 'path';

/**
 * Vite Configuration
 * 
 * Configures Vite for Electron development with React.
 * Sets up plugins for Electron and React, including HMR support.
 */
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: '../main/index.ts',
        onstart(args) {
          // Start the Electron app
          const { startup } = args;
          startup();
        },
        vite: {
          build: {
            outDir: '../../dist-electron/main',
            sourcemap: true,
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      {
        entry: '../preload/index.ts',
        onstart(args) {
          // Reload on preload changes
          args.reload();
        },
        vite: {
          build: {
            outDir: '../../dist-electron/preload',
            sourcemap: 'inline',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ])
  ],
  root: 'src/renderer',
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  },
  base: './',
  build: {
    outDir: '../../dist',
    emptyOutDir: true
  }
});

