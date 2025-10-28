/**
 * Preload Script
 * 
 * Creates a secure bridge between the main and renderer processes.
 * Exposes a limited API to the renderer through contextBridge for IPC communication.
 * 
 * @module preload/index
 */
import { contextBridge, ipcRenderer } from 'electron';

/**
 * Electron API exposed to renderer process
 * 
 * All methods are type-safe and use IPC invoke pattern.
 */
const electronAPI = {
  /**
   * Opens a file dialog for selecting video files
   * @returns Promise resolving to array of selected file paths
   */
  openFileDialog: (): Promise<string[]> => {
    return ipcRenderer.invoke('file:open-dialog');
  },

  /**
   * Opens a save dialog for saving projects
   * @returns Promise resolving to selected save path or null
   */
  saveProjectDialog: (): Promise<string | null> => {
    return ipcRenderer.invoke('file:save-dialog');
  },

  /**
   * Opens a dialog for selecting an existing project
   * @returns Promise resolving to selected file path or null
   */
  openProjectDialog: (): Promise<string | null> => {
    return ipcRenderer.invoke('file:open-project-dialog');
  },
};

/**
 * Expose the API to the renderer process
 * Makes the API available as window.electron in the renderer
 */
contextBridge.exposeInMainWorld('electron', electronAPI);

/**
 * Type definition for the exposed API
 * Import this type in renderer to get type safety
 */
export type ElectronAPI = typeof electronAPI;

