/**
 * Electron Main Process Entry Point
 * 
 * Initializes the Electron application and creates the main window.
 * Handles app lifecycle events and IPC communication setup.
 */

import { app } from 'electron';
import { initializeApp } from './app';

/**
 * Initialize the application when Electron is ready.
 */
app.whenReady().then(() => {
  initializeApp();

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (!global.mainWindow) {
      initializeApp();
    }
  });
});

app.on('before-quit', () => {
  // Cleanup logic here if needed
});

