/**
 * Preload Type Definitions
 * 
 * Type definitions for the preload API exposed to the renderer.
 * Import these types in renderer code for type-safe access to Electron APIs.
 * 
 * @module preload/types
 */

/**
 * Electron API interface
 * Available as window.electron in the renderer process
 */
export interface ElectronAPI {
  openFileDialog: () => Promise<string[]>;
  saveProjectDialog: () => Promise<string | null>;
  openProjectDialog: () => Promise<string | null>;
}

/**
 * Augment the Window interface to include our Electron API
 */
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};

