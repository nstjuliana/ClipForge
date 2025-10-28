/**
 * Application Lifecycle Management
 * 
 * Handles application initialization, window creation, and lifecycle events.
 * Manages the main window instance and application state.
 */

import { app, BrowserWindow } from 'electron';
import { createWindow } from './window';
import { registerIPCHandlers } from './ipc/handlers';

/**
 * Global reference to the main window.
 */
export let mainWindow: BrowserWindow | null = null;

/**
 * Global namespace for window references.
 */
declare global {
  var mainWindow: BrowserWindow | null;
}

/**
 * Initialize the application.
 * Creates the main window and registers IPC handlers.
 */
export function initializeApp(): void {
  // Set application metadata
  app.setName('ClipForge');

  // Create the main application window
  mainWindow = createWindow();

  // Store reference globally
  global.mainWindow = mainWindow;

  // Register IPC handlers
  registerIPCHandlers();
}

