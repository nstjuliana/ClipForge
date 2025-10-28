/**
 * IPC Handlers
 * 
 * Registers and handles all Inter-Process Communication messages between
 * the main and renderer processes. Provides secure communication channel
 * for file operations, project management, and app control.
 */

import { ipcMain } from 'electron';

/**
 * Registers all IPC message handlers.
 * Should be called during app initialization.
 */
export function registerIPCHandlers(): void {
  // Example handler - placeholder for future functionality
  ipcMain.handle('app:get-version', async () => {
    return process.env.npm_package_version || '0.1.0';
  });

  // Add more handlers here as features are implemented
  // Example: ipcMain.handle('file:open-dialog', handleOpenFileDialog);
}

