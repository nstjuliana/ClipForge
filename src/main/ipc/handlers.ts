/**
 * IPC Message Handlers
 * 
 * Registers all IPC (Inter-Process Communication) handlers for communication
 * between the main process and renderer process.
 * 
 * @module main/ipc/handlers
 */
import { ipcMain, dialog } from 'electron';

/**
 * Registers all IPC handlers
 * 
 * Sets up handlers for file dialogs, project operations, and other
 * main process operations that the renderer needs to access.
 */
export function registerIPCHandlers(): void {
  /**
   * Handle file open dialog
   * Opens a native file picker dialog for selecting video files
   * 
   * @returns Array of selected file paths
   */
  ipcMain.handle('file:open-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Videos', extensions: ['mp4', 'mov', 'webm', 'avi', 'mkv'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      title: 'Select Video Files'
    });

    if (result.canceled) {
      return [];
    }

    return result.filePaths;
  });

  /**
   * Handle project save dialog
   * Opens a save dialog for saving project files
   * 
   * @returns Selected save path or null if canceled
   */
  ipcMain.handle('file:save-dialog', async () => {
    const result = await dialog.showSaveDialog({
      filters: [
        { name: 'ClipForge Project', extensions: ['clipforge'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      defaultPath: 'untitled.clipforge',
      title: 'Save Project'
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    return result.filePath;
  });

  /**
   * Handle project open dialog
   * Opens a dialog for selecting an existing project file
   * 
   * @returns Selected file path or null if canceled
   */
  ipcMain.handle('file:open-project-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'ClipForge Project', extensions: ['clipforge'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      title: 'Open Project'
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });
}

