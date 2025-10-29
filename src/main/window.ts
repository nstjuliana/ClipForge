/**
 * Window Management
 * 
 * Creates and manages the main application window.
 * Configures window properties, security settings, and loads the renderer HTML.
 * 
 * @module main/window
 */
import { BrowserWindow } from 'electron';
import path from 'path';

// __dirname is available in CommonJS (tsconfig.main.json compiles to CommonJS)

/**
 * Creates the main application window
 * 
 * Configures window size, security settings, and loads the renderer process.
 * Uses preload script for secure IPC communication.
 * 
 * @returns The created BrowserWindow instance
 */
export function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1e1e1e',
    titleBarStyle: 'default',
    webPreferences: {
      // Security settings
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Required for some Electron features
      
      // Preload script for secure IPC
      preload: path.join(__dirname, '../preload/index.js'),
    },
    show: false, // Don't show until ready to prevent flash
  });

  // Show window when ready to prevent flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the renderer process
  if (process.env.VITE_DEV_SERVER_URL) {
    // Development mode - load from Vite dev server
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - load from built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Handle window close event
  mainWindow.on('closed', () => {
    // Dereference the window object
  });

  return mainWindow;
}

