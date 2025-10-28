/**
 * Preload Script
 * 
 * Creates a secure bridge between Electron's main process and renderer process.
 * Exposes a typed API for IPC communication to the renderer while maintaining
 * security best practices (context isolation, no node integration).
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Exposed API interface for renderer process.
 */
interface ElectronAPI {
  /**
   * Gets the application version.
   * 
   * @returns Promise resolving to version string
   */
  getVersion: () => Promise<string>;

  // Add more API methods here as features are implemented
}

/**
 * Create and expose the secure API to the renderer.
 */
const electronAPI: ElectronAPI = {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
};

contextBridge.exposeInMainWorld('electron', electronAPI);

/**
 * Type declaration for the exposed API.
 */
export type { ElectronAPI };

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

