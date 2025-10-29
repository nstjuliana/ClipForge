/**
 * FFmpeg Service (Main Process)
 * 
 * Handles video encoding and export using native FFmpeg binary.
 * Runs in the main process for better performance and access to Node.js APIs.
 * 
 * @module main/services/ffmpeg
 */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

/**
 * Resolves a path that might be inside an ASAR archive to the unpacked location
 * 
 * When Electron packages the app, native executables are unpacked to app.asar.unpacked.
 * This function checks if a path is inside app.asar and resolves it to the unpacked location.
 * 
 * @param filePath - The original file path
 * @returns The resolved path (either original or unpacked location)
 */
function resolveUnpackedPath(filePath: string): string {
  if (!filePath) return filePath;
  
  // In production, replace .asar with .asar.unpacked
  if (filePath.includes('.asar')) {
    return filePath.replace(/\.asar([\\/])/g, '.asar.unpacked$1');
  }
  
  return filePath;
}

/**
 * Sets up FFmpeg and FFprobe paths, handling ASAR unpacking in production
 */
function setupFFmpegPaths() {
  if (ffmpegStatic) {
    const resolvedPath = resolveUnpackedPath(ffmpegStatic);
    ffmpeg.setFfmpegPath(resolvedPath);
    console.log('FFmpeg path set to:', resolvedPath);
  }
  
  if (ffprobeStatic?.path) {
    const resolvedPath = resolveUnpackedPath(ffprobeStatic.path);
    ffmpeg.setFfprobePath(resolvedPath);
    console.log('FFprobe path set to:', resolvedPath);
  }
}

// Initialize paths
setupFFmpegPaths();

/**
 * Timeline clip data for export
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
 * Export options
 */
interface ExportOptions {
  resolution?: [number, number];
  format?: 'mp4';
  bitrate?: number;
  frameRate?: number;
}

/**
 * Export result
 */
interface ExportResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Progress callback type
 */
type ProgressCallback = (progress: number) => void;

/**
 * Exports a single clip with trim points
 * 
 * @param clipPath - Path to source video file
 * @param inPoint - Start time in seconds
 * @param outPoint - End time in seconds
 * @param outputPath - Path for output file
 * @param options - Export options
 * @param onProgress - Progress callback
 * @returns Promise resolving to export result
 */
export function exportSingleClip(
  clipPath: string,
  inPoint: number,
  outPoint: number,
  outputPath: string,
  options: ExportOptions = {},
  onProgress?: ProgressCallback
): Promise<ExportResult> {
  return new Promise((resolve) => {
    const duration = outPoint - inPoint;
    
    let command = ffmpeg(clipPath)
      .setStartTime(inPoint)
      .setDuration(duration)
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate('128k')
      .outputOptions([
        '-preset fast',
        '-crf 23',
      ]);
    
    // Add resolution if specified
    if (options.resolution) {
      command = command.size(`${options.resolution[0]}x${options.resolution[1]}`);
    }
    
    // Add progress handler
    if (onProgress) {
      command.on('progress', (progress: { percent?: number }) => {
        if (progress.percent) {
          onProgress(Math.min(progress.percent, 100));
        }
      });
    }
    
    command
      .on('end', () => {
        resolve({ success: true, outputPath });
      })
      .on('error', (err: Error) => {
        console.error('FFmpeg error:', err);
        resolve({ success: false, error: err.message });
      })
      .save(outputPath);
  });
}

/**
 * Exports timeline with multiple clips
 * 
 * Concatenates clips in sequence and exports as single video.
 * 
 * @param clips - Array of timeline clips with file paths
 * @param outputPath - Path for output file
 * @param options - Export options
 * @param onProgress - Progress callback
 * @returns Promise resolving to export result
 */
export async function exportTimeline(
  clips: TimelineClipData[],
  outputPath: string,
  options: ExportOptions = {},
  onProgress?: ProgressCallback
): Promise<ExportResult> {
  try {
    // Sort clips by start time
    const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);
    
    // If single clip, use simple export
    if (sortedClips.length === 1) {
      const clip = sortedClips[0];
      return await exportSingleClip(
        clip.filePath,
        clip.inPoint,
        clip.outPoint,
        outputPath,
        options,
        onProgress
      );
    }
    
    // For multiple clips, process each and concatenate
    const tempDir = path.join(process.cwd(), '.temp-export-' + randomUUID());
    await fs.mkdir(tempDir, { recursive: true });
    
    const processedFiles: string[] = [];
    
    // Process each clip
    for (let i = 0; i < sortedClips.length; i++) {
      const clip = sortedClips[i];
      const tempOutput = path.join(tempDir, `clip_${i}.mp4`);
      
      const result = await exportSingleClip(
        clip.filePath,
        clip.inPoint,
        clip.outPoint,
        tempOutput,
        options,
        (clipProgress) => {
          // Calculate overall progress
          const overallProgress = ((i / sortedClips.length) * 100) + (clipProgress / sortedClips.length);
          onProgress?.(Math.min(overallProgress, 99));
        }
      );
      
      if (!result.success) {
        // Cleanup and return error
        await fs.rm(tempDir, { recursive: true, force: true });
        return result;
      }
      
      processedFiles.push(tempOutput);
    }
    
    // Create concat file list
    const concatListPath = path.join(tempDir, 'concat.txt');
    const concatContent = processedFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
    await fs.writeFile(concatListPath, concatContent);
    
    // Concatenate all clips
    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f concat', '-safe 0'])
        .videoCodec('libx264')
        .audioCodec('aac')
        .audioBitrate('128k')
        .outputOptions([
          '-preset fast',
          '-crf 23',
        ]);
      
      // Add resolution if specified
      if (options.resolution) {
        command = command.size(`${options.resolution[0]}x${options.resolution[1]}`);
      }
      
      command
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .save(outputPath);
    });
    
    // Cleanup temp files
    await fs.rm(tempDir, { recursive: true, force: true });
    
    onProgress?.(100);
    
    return { success: true, outputPath };
  } catch (error) {
    console.error('Export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets video metadata using ffprobe
 * 
 * @param filePath - Path to video file
 * @returns Promise resolving to metadata
 */
export function getVideoMetadata(filePath: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: Error | null, metadata: unknown) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
}

