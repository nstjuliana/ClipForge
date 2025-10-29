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
  exportVideoDialog: (defaultFileName?: string) => Promise<string | null>;
  openProjectDialog: () => Promise<string | null>;
  saveProject: (filePath: string, projectData: unknown) => Promise<{ success: boolean; data?: string; error?: string }>;
  loadProject: (filePath: string) => Promise<{ success: boolean; data?: unknown; error?: string }>;
  exportVideo: (clips: unknown[], outputPath: string, options: unknown, timelineDuration?: number) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  getVideoBlobUrl: (filePath: string) => Promise<{ success: boolean; buffer?: Buffer; error?: string }>;
}

export {};

