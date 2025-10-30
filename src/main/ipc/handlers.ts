/**
 * IPC Message Handlers
 * 
 * Registers all IPC (Inter-Process Communication) handlers for communication
 * between the main process and renderer process.
 * 
 * @module main/ipc/handlers
 */
import { ipcMain, dialog, desktopCapturer } from 'electron';
import { saveProject, loadProject } from '../services/projectIO';
import { exportTimeline } from '../services/ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

/**
 * Resolves a path that might be inside an ASAR archive to the unpacked location
 */
function resolveUnpackedPath(filePath: string): string {
  if (!filePath) return filePath;
  if (filePath.includes('.asar')) {
    return filePath.replace(/\.asar([\\/])/g, '.asar.unpacked$1');
  }
  return filePath;
}

/**
 * Sets up FFmpeg paths
 */
function setupFFmpegPaths() {
  if (ffmpegStatic) {
    const resolvedPath = resolveUnpackedPath(ffmpegStatic);
    ffmpeg.setFfmpegPath(resolvedPath);
  }
  if (ffprobeStatic?.path) {
    const resolvedPath = resolveUnpackedPath(ffprobeStatic.path);
    ffmpeg.setFfprobePath(resolvedPath);
  }
}

// Initialize FFmpeg paths
setupFFmpegPaths();

/**
 * Registers all IPC handlers
 * 
 * Sets up handlers for file dialogs, project operations, and other
 * main process operations that the renderer needs to access.
 */
export function registerIPCHandlers(): void {
  /**
   * Handle file open dialog
   * Opens a native file picker dialog for selecting video files
   * 
   * @returns Array of selected file paths
   */
  ipcMain.handle('file:open-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Videos', extensions: ['mp4', 'mov', 'webm', 'avi', 'mkv'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      title: 'Select Video Files'
    });

    if (result.canceled) {
      return [];
    }

    return result.filePaths;
  });

  /**
   * Handle project save dialog
   * Opens a save dialog for saving project files
   * 
   * @returns Selected save path or null if canceled
   */
  ipcMain.handle('file:save-dialog', async () => {
    const result = await dialog.showSaveDialog({
      filters: [
        { name: 'ClipForge Project', extensions: ['clipforge'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      defaultPath: 'untitled.clipforge',
      title: 'Save Project'
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    return result.filePath;
  });

  /**
   * Handle export video save dialog
   * Opens a save dialog for exporting video files
   * 
   * @param _event - IPC event
   * @param defaultFileName - Default file name to suggest
   * @returns Selected save path or null if canceled
   */
  ipcMain.handle('file:export-video-dialog', async (_event, defaultFileName?: string) => {
    const result = await dialog.showSaveDialog({
      filters: [
        { name: 'MP4 Video', extensions: ['mp4'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      defaultPath: defaultFileName || 'exported-video.mp4',
      title: 'Export Video'
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    return result.filePath;
  });

  /**
   * Handle project open dialog
   * Opens a dialog for selecting an existing project file
   * 
   * @returns Selected file path or null if canceled
   */
  ipcMain.handle('file:open-project-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'ClipForge Project', extensions: ['clipforge'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      title: 'Open Project'
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  /**
   * Handle project save
   * Saves project data to a file
   * 
   * @param _event - IPC event
   * @param filePath - Path to save the project
   * @param projectData - Project data to save
   * @returns Result of save operation
   */
  ipcMain.handle('project:save', async (_event, filePath: string, projectData: unknown) => {
    return await saveProject(filePath, projectData as any);
  });

  /**
   * Handle project load
   * Loads project data from a file
   * 
   * @param _event - IPC event
   * @param filePath - Path to the project file
   * @returns Result of load operation with project data
   */
  ipcMain.handle('project:load', async (_event, filePath: string) => {
    return await loadProject(filePath);
  });

  /**
   * Handle video export
   * Exports timeline to video file using native FFmpeg
   * 
   * @param _event - IPC event
   * @param clips - Timeline clips with file paths
   * @param outputPath - Path for output file
   * @param options - Export options
   * @param timelineDuration - Total timeline duration (for gaps)
   * @returns Result of export operation
   */
  ipcMain.handle('video:export', async (event, clips: any[], outputPath: string, options: any, timelineDuration?: number) => {
    return await exportTimeline(clips, outputPath, options, (progress) => {
      // Send progress updates back to renderer
      event.sender.send('video:export-progress', progress);
    }, timelineDuration);
  });

  /**
   * Handle video blob URL request
   * Reads video file and returns buffer to renderer for blob creation
   * 
   * @param _event - IPC event
   * @param filePath - Path to video file
   * @returns Buffer data for creating blob URL
   */
  ipcMain.handle('video:getBlobUrl', async (_event, filePath: string) => {
    try {
      // Read video file into buffer
      const buffer = await fs.readFile(filePath);
      
      // Return buffer directly (Electron will handle serialization)
      return { success: true, buffer: buffer };
    } catch (error) {
      console.error('Failed to read video file:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to read video file' 
      };
    }
  });

  /**
   * Handle desktop sources request
   * Gets available screens and windows for recording
   * 
   * @returns Array of desktop sources with thumbnails
   */
  ipcMain.handle('recording:get-sources', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 800, height: 600 }
      });

      return sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
      }));
    } catch (error) {
      console.error('Failed to get desktop sources:', error);
      return [];
    }
  });

  /**
   * Handle recording save
   * Saves recorded video blob to file system and adds duration metadata
   * 
   * @param _event - IPC event
   * @param buffer - Video buffer from recording
   * @param duration - Recording duration in seconds
   * @returns Path to saved recording file
   */
  ipcMain.handle('recording:save', async (_event, buffer: Buffer, duration: number) => {
    try {
      // Create recordings directory in user data path
      const userDataPath = app.getPath('userData');
      const recordingsDir = path.join(userDataPath, 'recordings');
      
      // Create directory if it doesn't exist
      await fs.mkdir(recordingsDir, { recursive: true });
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `recording-${timestamp}.webm`;
      const filePath = path.join(recordingsDir, fileName);
      const tempPath = `${filePath}.tmp`;
      
      // Write buffer to temp file first
      await fs.writeFile(tempPath, buffer);
      
      // Use ffmpeg to remux the file with duration metadata
      // We copy the video/audio streams and explicitly set the duration
      await new Promise<void>((resolve) => {
        ffmpeg(tempPath)
          .outputOptions([
            '-c copy', // Copy codecs without re-encoding
            '-t', duration.toString(), // Set duration explicitly
            '-avoid_negative_ts', 'make_zero', // Fix timestamp issues
          ])
          .on('end', () => resolve())
          .on('error', (err: Error) => {
            console.error('FFmpeg remux error:', err);
            // If ffmpeg fails, we'll still use the original file
            resolve();
          })
          .save(filePath);
      });
      
      // Remove temp file
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore if temp file doesn't exist
      }
      
      console.log('Recording saved to:', filePath, 'with duration:', duration, 'seconds');
      return filePath;
    } catch (error) {
      console.error('Failed to save recording:', error);
      throw error;
    }
  });

  /**
   * Handle media access request
   * Request system-level media access on macOS
   * 
   * @param _event - IPC event
   * @param mediaType - Type of media ('camera' or 'microphone')
   * @returns Whether access was granted
   */
  ipcMain.handle('media:request-access', async (_event, mediaType: 'camera' | 'microphone') => {
    try {
      // On macOS, use systemPreferences to request access
      if (process.platform === 'darwin') {
        const { systemPreferences } = require('electron');
        if (systemPreferences.askForMediaAccess) {
          const granted = await systemPreferences.askForMediaAccess(mediaType);
          return { success: true, granted };
        }
      }
      // On other platforms, assume granted (browser-level permissions handle it)
      return { success: true, granted: true };
    } catch (error) {
      console.error('Failed to request media access:', error);
      return { success: false, granted: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * Handle system permission check
   * Check if system-level permissions are granted
   * 
   * @param _event - IPC event
   * @param mediaType - Type of media ('camera' or 'microphone')
   * @returns Permission status
   */
  ipcMain.handle('media:check-system-permissions', async (_event, mediaType: 'camera' | 'microphone' | 'screen') => {
    try {
      const platform = process.platform;
      
      if (platform === 'darwin') {
        // macOS - can check actual system permissions
        const { systemPreferences } = require('electron');
        if (systemPreferences.getMediaAccessStatus) {
          const status = systemPreferences.getMediaAccessStatus(mediaType);
          console.log(`[System Permissions] ${mediaType} status on macOS: ${status}`);
          return {
            success: true,
            platform,
            status,
            granted: status === 'granted',
            help: status === 'denied' 
              ? 'Please grant camera/microphone access in System Preferences > Security & Privacy > Privacy'
              : null
          };
        }
      } else if (platform === 'win32') {
        // Windows - provide guidance
        console.log(`[System Permissions] Windows detected - cannot check ${mediaType} permissions programmatically`);
        
        let helpMessage = '';
        if (mediaType === 'microphone') {
          helpMessage = 'To enable microphone access:\n' +
                        '1. Open Windows Settings (Press Win + I)\n' +
                        '2. Go to Privacy & Security > Microphone\n' +
                        '3. Enable "Let apps access your microphone"\n' +
                        '4. Enable "Let desktop apps access your microphone"\n' +
                        '5. Scroll down and find "ClipForge" in the list\n' +
                        '6. Make sure the toggle is ON for ClipForge\n' +
                        '7. Restart ClipForge after making changes';
        } else if (mediaType === 'camera') {
          helpMessage = 'To enable camera access:\n' +
                        '1. Open Windows Settings (Press Win + I)\n' +
                        '2. Go to Privacy & Security > Camera\n' +
                        '3. Enable "Let apps access your camera"\n' +
                        '4. Enable "Let desktop apps access your camera"\n' +
                        '5. Scroll down and find "ClipForge" in the list\n' +
                        '6. Make sure the toggle is ON for ClipForge\n' +
                        '7. Restart ClipForge after making changes';
        } else {
          helpMessage = 'If you\'re having permission issues:\n' +
                        '1. Open Windows Settings\n' +
                        '2. Go to Privacy & Security > Camera (or Microphone)\n' +
                        '3. Enable "Let apps access your camera/microphone"\n' +
                        '4. Find ClipForge in the list and enable it\n' +
                        '5. Restart the app';
        }
        
        return {
          success: true,
          platform,
          status: 'unknown',
          granted: null,
          help: helpMessage
        };
      } else {
        // Linux and others
        console.log(`[System Permissions] ${platform} detected`);
        return {
          success: true,
          platform,
          status: 'unknown',
          granted: null,
          help: 'Make sure your system allows applications to access camera/microphone devices'
        };
      }
      
      return { success: false, error: 'Unable to check permissions' };
    } catch (error) {
      console.error('Failed to check system permissions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}

