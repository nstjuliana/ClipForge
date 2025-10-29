/**
 * IPC Message Handlers
 * 
 * Registers all IPC (Inter-Process Communication) handlers for communication
 * between the main process and renderer process.
 * 
 * @module main/ipc/handlers
 */
import { ipcMain, dialog } from 'electron';
import { saveProject, loadProject } from '../services/projectIO';
import { exportTimeline } from '../services/ffmpeg';
import fs from 'fs/promises';

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
   * Handle export video save dialog
   * Opens a save dialog for exporting video files
   * 
   * @param _event - IPC event
   * @param defaultFileName - Default file name to suggest
   * @returns Selected save path or null if canceled
   */
  ipcMain.handle('file:export-video-dialog', async (_event, defaultFileName?: string) => {
    const result = await dialog.showSaveDialog({
      filters: [
        { name: 'MP4 Video', extensions: ['mp4'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      defaultPath: defaultFileName || 'exported-video.mp4',
      title: 'Export Video'
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

  /**
   * Handle project save
   * Saves project data to a file
   * 
   * @param _event - IPC event
   * @param filePath - Path to save the project
   * @param projectData - Project data to save
   * @returns Result of save operation
   */
  ipcMain.handle('project:save', async (_event, filePath: string, projectData: unknown) => {
    return await saveProject(filePath, projectData as any);
  });

  /**
   * Handle project load
   * Loads project data from a file
   * 
   * @param _event - IPC event
   * @param filePath - Path to the project file
   * @returns Result of load operation with project data
   */
  ipcMain.handle('project:load', async (_event, filePath: string) => {
    return await loadProject(filePath);
  });

  /**
   * Handle video export
   * Exports timeline to video file using native FFmpeg
   * 
   * @param _event - IPC event
   * @param clips - Timeline clips with file paths
   * @param outputPath - Path for output file
   * @param options - Export options
   * @returns Result of export operation
   */
  ipcMain.handle('video:export', async (event, clips: any[], outputPath: string, options: any) => {
    return await exportTimeline(clips, outputPath, options, (progress) => {
      // Send progress updates back to renderer
      event.sender.send('video:export-progress', progress);
    });
  });

  /**
   * Handle video blob URL request
   * Reads video file and returns buffer to renderer for blob creation
   * 
   * @param _event - IPC event
   * @param filePath - Path to video file
   * @returns Buffer data for creating blob URL
   */
  ipcMain.handle('video:getBlobUrl', async (_event, filePath: string) => {
    try {
      // Read video file into buffer
      const buffer = await fs.readFile(filePath);
      
      // Return buffer directly (Electron will handle serialization)
      return { success: true, buffer: buffer };
    } catch (error) {
      console.error('Failed to read video file:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to read video file' 
      };
    }
  });
}

