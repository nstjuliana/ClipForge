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
 * Segment type for export (either a clip or a gap/black screen)
 */
interface ExportSegment {
  type: 'clip' | 'gap';
  startTime: number;
  duration: number;
  clipPath?: string; // Only for 'clip' type
  inPoint?: number; // Only for 'clip' type
  outPoint?: number; // Only for 'clip' type
}

/**
 * Generates a black screen video segment
 * 
 * Creates a video file with black frames for the specified duration.
 * Used to fill gaps in the timeline export.
 * 
 * @param duration - Duration in seconds
 * @param outputPath - Path for output file
 * @param options - Export options (resolution, frame rate)
 * @returns Promise resolving to export result
 */
function generateBlackScreen(
  duration: number,
  outputPath: string,
  options: ExportOptions = {}
): Promise<ExportResult> {
  return new Promise((resolve) => {
    const resolution = options.resolution || [1920, 1080]; // Default to 1080p
    const frameRate = options.frameRate || 30; // Default to 30fps
    
    // Create black screen using color filter with lavfi
    // Format: color=black:size=WxH:duration=D:rate=R
    const colorInput = `color=black:size=${resolution[0]}x${resolution[1]}:duration=${duration}:rate=${frameRate}`;
    // Create silent audio using anullsrc
    const audioInput = `anullsrc=channel_layout=stereo:sample_rate=48000`;
    
    let command = ffmpeg()
      .input(colorInput)
      .inputOptions(['-f lavfi'])
      .input(audioInput)
      .inputOptions(['-f lavfi', `-t ${duration}`])
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate('128k')
      .outputOptions([
        '-preset fast',
        '-crf 23',
        '-pix_fmt yuv420p', // Ensure compatibility
        '-shortest', // Match shortest input (duration)
      ]);
    
    command
      .on('end', () => {
        resolve({ success: true, outputPath });
      })
      .on('error', (err: Error) => {
        console.error('Black screen generation error:', err);
        resolve({ success: false, error: err.message });
      })
      .save(outputPath);
  });
}

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
 * Concatenates clips in sequence with black screens filling gaps.
 * 
 * @param clips - Array of timeline clips with file paths
 * @param outputPath - Path for output file
 * @param options - Export options
 * @param onProgress - Progress callback
 * @param timelineDuration - Total duration of timeline (for gaps at end)
 * @returns Promise resolving to export result
 */
export async function exportTimeline(
  clips: TimelineClipData[],
  outputPath: string,
  options: ExportOptions = {},
  onProgress?: ProgressCallback,
  timelineDuration?: number
): Promise<ExportResult> {
  try {
    // Sort clips by start time
    const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);
    
    // If single clip with no gaps, use simple export
    if (sortedClips.length === 1 && sortedClips[0].startTime === 0) {
      const clip = sortedClips[0];
      const clipEndTime = clip.startTime + clip.duration;
      const finalDuration = timelineDuration || clipEndTime;
      
      // If clip fills entire timeline, no gaps
      if (Math.abs(clipEndTime - finalDuration) < 0.01) {
        return await exportSingleClip(
          clip.filePath,
          clip.inPoint,
          clip.outPoint,
          outputPath,
          options,
          onProgress
        );
      }
    }
    
    // Build segments array (clips + gaps)
    const segments: ExportSegment[] = [];
    const finalDuration = timelineDuration || (sortedClips.length > 0 
      ? Math.max(...sortedClips.map(c => c.startTime + c.duration))
      : 0);
    
    // Add gap before first clip if needed
    if (sortedClips.length > 0 && sortedClips[0].startTime > 0) {
      segments.push({
        type: 'gap',
        startTime: 0,
        duration: sortedClips[0].startTime,
      });
    }
    
    // Add clips and gaps between them
    for (let i = 0; i < sortedClips.length; i++) {
      const clip = sortedClips[i];
      const clipEndTime = clip.startTime + clip.duration;
      
      // Add the clip
      segments.push({
        type: 'clip',
        startTime: clip.startTime,
        duration: clip.duration,
        clipPath: clip.filePath,
        inPoint: clip.inPoint,
        outPoint: clip.outPoint,
      });
      
      // Check for gap after this clip
      if (i < sortedClips.length - 1) {
        const nextClip = sortedClips[i + 1];
        const gap = nextClip.startTime - clipEndTime;
        if (gap > 0.01) { // Only add gap if > 10ms
          segments.push({
            type: 'gap',
            startTime: clipEndTime,
            duration: gap,
          });
        }
      }
    }
    
    // Add gap after last clip if needed
    if (sortedClips.length > 0) {
      const lastClip = sortedClips[sortedClips.length - 1];
      const lastClipEndTime = lastClip.startTime + lastClip.duration;
      const finalGap = finalDuration - lastClipEndTime;
      if (finalGap > 0.01) {
        segments.push({
          type: 'gap',
          startTime: lastClipEndTime,
          duration: finalGap,
        });
      }
    } else if (finalDuration > 0) {
      // No clips, but timeline has duration - create all black
      segments.push({
        type: 'gap',
        startTime: 0,
        duration: finalDuration,
      });
    }
    
    // If no segments, return error
    if (segments.length === 0) {
      return {
        success: false,
        error: 'No content to export',
      };
    }
    
    // For multiple segments, process each and concatenate
    const tempDir = path.join(process.cwd(), '.temp-export-' + randomUUID());
    await fs.mkdir(tempDir, { recursive: true });
    
    const processedFiles: string[] = [];
    const totalSegments = segments.length;
    
    // Process each segment (clip or gap)
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const tempOutput = path.join(tempDir, `segment_${i}.mp4`);
      
      let result: ExportResult;
      
      if (segment.type === 'clip' && segment.clipPath && segment.inPoint !== undefined && segment.outPoint !== undefined) {
        // Export clip
        result = await exportSingleClip(
          segment.clipPath,
          segment.inPoint,
          segment.outPoint,
          tempOutput,
          options,
          (clipProgress) => {
            // Calculate overall progress
            const overallProgress = ((i / totalSegments) * 100) + (clipProgress / totalSegments);
            onProgress?.(Math.min(overallProgress, 99));
          }
        );
      } else if (segment.type === 'gap') {
        // Generate black screen
        result = await generateBlackScreen(
          segment.duration,
          tempOutput,
          options
        );
        // Update progress for gap generation
        const overallProgress = ((i / totalSegments) * 100) + (50 / totalSegments);
        onProgress?.(Math.min(overallProgress, 99));
      } else {
        result = { success: false, error: 'Invalid segment type' };
      }
      
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
    
    // Concatenate all segments
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

