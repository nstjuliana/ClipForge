/// <reference types="vite/client" />

// Desktop source type for screen recording
type DesktopSource = {
  id: string;
  name: string;
  thumbnail?: string;
};

// Electron API type (matches preload/types.ts but for renderer context)
type ElectronAPI = {
  openFileDialog: () => Promise<string[]>;
  saveProjectDialog: () => Promise<string | null>;
  exportVideoDialog: (defaultFileName?: string) => Promise<string | null>;
  openProjectDialog: () => Promise<string | null>;
  saveProject: (filePath: string, projectData: unknown) => Promise<{ success: boolean; data?: string; error?: string }>;
  loadProject: (filePath: string) => Promise<{ success: boolean; data?: unknown; error?: string }>;
  exportVideo: (clips: unknown[], outputPath: string, options: unknown, timelineDuration?: number) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  getVideoBlobUrl: (filePath: string) => Promise<{ success: boolean; buffer?: ArrayBuffer; error?: string }>;
  getDesktopSources: () => Promise<DesktopSource[]>;
  saveRecording: (blob: Blob) => Promise<string>;
};

// Extend Window interface with Electron API
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};

