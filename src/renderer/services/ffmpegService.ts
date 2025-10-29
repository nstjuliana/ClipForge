/**
 * FFmpeg Service (Renderer Process)
 * 
 * Handles video encoding and export by communicating with main process.
 * Uses native FFmpeg binary via IPC for better performance.
 * 
 * @module services/ffmpegService
 */

import type { TimelineClip } from '@/types/timeline';
import type { Clip } from '@/types/clip';

/**
 * Export options for video rendering
 * 
 * @interface ExportOptions
 */
export interface ExportOptions {
  /** Output resolution */
  resolution?: [number, number];
  
  /** Output format (MP4 for MVP) */
  format?: 'mp4';
  
  /** Video bitrate in kbps */
  bitrate?: number;
  
  /** Frame rate */
  frameRate?: number;
  
  /** Output file name */
  fileName?: string;
}

/**
 * Export progress callback
 */
export type ExportProgressCallback = (progress: number) => void;

/**
 * Timeline clip data for export (with file path)
 */
interface TimelineClipData {
  id: string;
  clipId: string;
  startTime: number;
  duration: number;
  inPoint: number;
  outPoint: number;
  filePath: string;
}

/**
 * No need to load FFmpeg - native binary is always available
 * 
 * @returns Promise resolving immediately
 */
export async function loadFFmpeg(): Promise<void> {
  // No-op: native FFmpeg is already available
  return Promise.resolve();
}

/**
 * Exports timeline with multiple clips
 * 
 * Communicates with main process to use native FFmpeg for export.
 * 
 * @param clips - Array of source clips
 * @param timelineClips - Array of timeline clips with trim and position info
 * @param options - Export options
 * @param onProgress - Progress callback (0-100)
 * @returns Promise resolving to output file path
 * @throws Error if export fails
 */
export async function exportTimeline(
  clips: Clip[],
  timelineClips: TimelineClip[],
  options: ExportOptions = {},
  onProgress?: ExportProgressCallback
): Promise<string> {
  try {
    // Prepare timeline clips with file paths
    const clipsWithPaths: TimelineClipData[] = timelineClips.map(tc => {
      const clip = clips.find(c => c.id === tc.clipId);
      if (!clip) {
        throw new Error(`Clip ${tc.clipId} not found`);
      }
      
      return {
        id: tc.id,
        clipId: tc.clipId,
        startTime: tc.startTime,
        duration: tc.duration,
        inPoint: tc.inPoint,
        outPoint: tc.outPoint,
        filePath: clip.filePath,
      };
    });
    
    // Get output path from user
    const defaultFileName = options.fileName || 'exported-video.mp4';
    const outputPath = await window.electron.saveProjectDialog();
    
    if (!outputPath) {
      throw new Error('Export cancelled');
    }
    
    // Ensure correct extension
    const finalPath = outputPath.endsWith('.mp4') ? outputPath : `${outputPath}.mp4`;
    
    // Setup progress listener
    if (onProgress) {
      // Listen for progress events from main process
      const progressHandler = (_event: any, progress: number) => {
        onProgress(progress);
      };
      
      // Note: In a full implementation, we'd use ipcRenderer.on here
      // For now, we'll rely on the export promise
    }
    
    // Call main process export
    const result = await window.electron.exportVideo(clipsWithPaths, finalPath, {
      resolution: options.resolution,
      format: options.format || 'mp4',
      bitrate: options.bitrate,
      frameRate: options.frameRate,
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Export failed');
    }
    
    return result.outputPath || finalPath;
  } catch (error) {
    console.error('Timeline export failed:', error);
    throw new Error(`Failed to export timeline: ${error}`);
  }
}

/**
 * Downloads a file (no-op for desktop app)
 * 
 * File is already saved by FFmpeg export.
 * 
 * @param _path - File path (unused)
 * @param _fileName - File name (unused)
 */
export function downloadBlob(_path: string, _fileName: string): void {
  // No-op: file is already saved to disk
  console.log('File saved successfully');
}

/**
 * Checks if FFmpeg is loaded
 * 
 * @returns Always true (native FFmpeg is always available)
 */
export function isFFmpegLoaded(): boolean {
  return true;
}
