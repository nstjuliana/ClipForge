/**
 * Main Process Entry Point
 * 
 * Initializes the Electron application and manages the app lifecycle.
 * Handles app ready event, window creation, and quit events.
 * 
 * @module main/index
 */
import { app, BrowserWindow, session, systemPreferences } from 'electron';
import { createWindow } from './window';
import { registerIPCHandlers } from './ipc/handlers';

/**
 * Set up media permission handlers
 * This is critical for camera and microphone access to work properly
 */
function setupMediaPermissions() {
  console.log('[Permissions] Setting up media permission handlers...');
  
  // Set up permission request handler for media devices
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    console.log(`[Permissions] Permission requested: ${permission}`, details);
    
    // Allow media permissions (camera, microphone)
    if (permission === 'media') {
      console.log('[Permissions] Granting media permission');
      callback(true);
      return;
    }
    
    if (permission === 'display-capture') {
      console.log('[Permissions] Granting display-capture permission');
      callback(true);
      return;
    }
    
    // Allow all other permissions for now (can be restricted later)
    console.log(`[Permissions] Granting permission: ${permission}`);
    callback(true);
  });

  // Set up permission check handler
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    console.log(`[Permissions] Permission check: ${permission} from ${requestingOrigin}`);
    
    if (permission === 'media') {
      console.log('[Permissions] Media permission check: GRANTED');
      return true;
    }
    
    if (permission === 'display-capture') {
      console.log('[Permissions] Display capture permission check: GRANTED');
      return true;
    }
    
    // For development, allow most permissions
    console.log(`[Permissions] Permission check for ${permission}: GRANTED`);
    return true;
  });

  // On macOS, request media access at app startup
  if (process.platform === 'darwin') {
    console.log('[Permissions] macOS detected, requesting system media access...');
    
    if (systemPreferences.askForMediaAccess) {
      // Request both camera and microphone access
      systemPreferences.askForMediaAccess('camera')
        .then(granted => {
          console.log(`[Permissions] Camera access: ${granted ? 'GRANTED' : 'DENIED'}`);
        })
        .catch(err => {
          console.error('[Permissions] Camera access request failed:', err);
        });
      
      systemPreferences.askForMediaAccess('microphone')
        .then(granted => {
          console.log(`[Permissions] Microphone access: ${granted ? 'GRANTED' : 'DENIED'}`);
        })
        .catch(err => {
          console.error('[Permissions] Microphone access request failed:', err);
        });
    } else {
      console.warn('[Permissions] systemPreferences.askForMediaAccess not available');
    }
  } else {
    console.log(`[Permissions] Platform: ${process.platform} - System permissions may need to be set manually`);
  }
  
  console.log('[Permissions] Media permission handlers setup complete');
}

/**
 * Set command-line switches for better media handling
 */
function setupCommandLineSwitches() {
  // Enable features for better media device access
  app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
  app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer');
  
  // On Windows, these might help with permissions
  if (process.platform === 'win32') {
    app.commandLine.appendSwitch('disable-features', 'MediaFoundationAsyncH264Encoding');
  }
  
  console.log('[CommandLine] Switches configured');
}

// Set up command-line switches before app is ready
setupCommandLineSwitches();

/**
 * Initialize the application when Electron is ready
 */
app.whenReady().then(() => {
  // Set up media permissions first
  setupMediaPermissions();
  
  // Register IPC handlers before creating window
  registerIPCHandlers();
  
  // Create the main application window
  createWindow();

  // On macOS, re-create window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Quit when all windows are closed (except on macOS)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

