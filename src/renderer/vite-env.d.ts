/// <reference types="vite/client" />

// Extend Window interface with Electron API
interface Window {
  electron: {
    openFileDialog: () => Promise<string[]>;
    saveProjectDialog: () => Promise<string | null>;
    openProjectDialog: () => Promise<string | null>;
    saveProject: (filePath: string, projectData: unknown) => Promise<{ success: boolean; data?: string; error?: string }>;
    loadProject: (filePath: string) => Promise<{ success: boolean; data?: unknown; error?: string }>;
    exportVideo: (clips: unknown[], outputPath: string, options: unknown) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
    getVideoBlobUrl: (filePath: string) => Promise<{ success: boolean; buffer?: ArrayBuffer; error?: string }>;
  };
}

