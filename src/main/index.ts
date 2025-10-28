/**
 * Main Process Entry Point
 * 
 * Initializes the Electron application and manages the app lifecycle.
 * Handles app ready event, window creation, and quit events.
 * 
 * @module main/index
 */
import { app, BrowserWindow } from 'electron';
import { createWindow } from './window';
import { registerIPCHandlers } from './ipc/handlers';

/**
 * Initialize the application when Electron is ready
 */
app.whenReady().then(() => {
  // Register IPC handlers before creating window
  registerIPCHandlers();
  
  // Create the main application window
  createWindow();

  // On macOS, re-create window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Quit when all windows are closed (except on macOS)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

