/// <reference types="vite/client" />

// Extend Window interface with Electron API
interface Window {
  electron: {
    openFileDialog: () => Promise<string[]>;
    saveProjectDialog: () => Promise<string | null>;
    openProjectDialog: () => Promise<string | null>;
  };
}

