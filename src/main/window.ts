/**
 * Window Management
 * 
 * Creates and configures the Electron BrowserWindow with proper security settings.
 * Manages window lifecycle and handles window events.
 */

import { BrowserWindow, screen } from 'electron';
import path from 'path';

/**
 * Window dimensions and properties
 */
const WINDOW_WIDTH = 1200;
const WINDOW_HEIGHT = 800;

/**
 * Determine the correct path for the preload script.
 * Works in both development and production builds.
 */
function getPreloadPath(): string {
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, '../../preload/index.js');
  }
  return path.join(__dirname, '../preload/index.js');
}

/**
 * Creates and returns a new application window.
 * 
 * Configures security settings, window properties, and lifecycle handlers.
 * 
 * @returns {BrowserWindow} The created BrowserWindow instance
 */
export function createWindow(): BrowserWindow {
  // Get primary display dimensions for centering
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Create the browser window
  const mainWindowInstance = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: Math.floor((screenWidth - WINDOW_WIDTH) / 2),
    y: Math.floor((screenHeight - WINDOW_HEIGHT) / 2),
    title: 'ClipForge',
    show: false, // Don't show until ready
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: getPreloadPath(),
    },
  });

  // Load the renderer HTML file
  if (process.env.NODE_ENV === 'development') {
    mainWindowInstance.loadURL('http://localhost:5173');
    mainWindowInstance.webContents.openDevTools();
  } else {
    mainWindowInstance.loadFile('dist/index.html');
  }

  // Show window when ready to prevent visual flash
  mainWindowInstance.once('ready-to-show', () => {
    mainWindowInstance.show();
  });

  // Handle window closed
  mainWindowInstance.on('closed', () => {
    // Window is now closed
  });

  return mainWindowInstance;
}

