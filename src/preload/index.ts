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
   * Opens a save dialog for exporting video files
   * @param defaultFileName - Optional default file name
   * @returns Promise resolving to selected save path or null
   */
  exportVideoDialog: (defaultFileName?: string): Promise<string | null> => {
    return ipcRenderer.invoke('file:export-video-dialog', defaultFileName);
  },

  /**
   * Opens a dialog for selecting an existing project
   * @returns Promise resolving to selected file path or null
   */
  openProjectDialog: (): Promise<string | null> => {
    return ipcRenderer.invoke('file:open-project-dialog');
  },

  /**
   * Saves project data to a file
   * @param filePath - Path to save the project
   * @param projectData - Project data to save
   * @returns Promise resolving to save result
   */
  saveProject: (filePath: string, projectData: unknown): Promise<{ success: boolean; data?: string; error?: string }> => {
    return ipcRenderer.invoke('project:save', filePath, projectData);
  },

  /**
   * Loads project data from a file
   * @param filePath - Path to the project file
   * @returns Promise resolving to load result with project data
   */
  loadProject: (filePath: string): Promise<{ success: boolean; data?: unknown; error?: string }> => {
    return ipcRenderer.invoke('project:load', filePath);
  },

  /**
   * Exports timeline to video file
   * @param clips - Timeline clips with file paths
   * @param outputPath - Path for output file
   * @param options - Export options
   * @returns Promise resolving to export result
   */
  exportVideo: (clips: unknown[], outputPath: string, options: unknown): Promise<{ success: boolean; outputPath?: string; error?: string }> => {
    return ipcRenderer.invoke('video:export', clips, outputPath, options);
  },

  /**
   * Gets video buffer for creating blob URL
   * @param filePath - Path to video file
   * @returns Promise resolving to video buffer
   */
  getVideoBlobUrl: (filePath: string): Promise<{ success: boolean; buffer?: Buffer; error?: string }> => {
    return ipcRenderer.invoke('video:getBlobUrl', filePath);
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

