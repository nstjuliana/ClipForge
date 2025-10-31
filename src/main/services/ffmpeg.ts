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
  track: number; // Track index for layering
}

/**
 * Export options
 */
interface ExportOptions {
  resolution?: [number, number];
  format?: 'mp4';
  bitrate?: number;
  frameRate?: number;
  subtitlePath?: string; // Optional SRT subtitle file to embed
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
 * Time segment with multiple layers
 */
interface TimeSegment {
  startTime: number;
  duration: number;
  clips: TimelineClipData[]; // Clips active during this segment, sorted by track
}

/**
 * Creates time segments from timeline clips considering track layering
 * Each segment represents a period where the clip configuration doesn't change
 */
function createTimeSegments(clips: TimelineClipData[], timelineDuration: number): TimeSegment[] {
  // Collect all unique time points where clips start or end
  const timePoints = new Set<number>();
  timePoints.add(0);
  timePoints.add(timelineDuration);
  
  clips.forEach(clip => {
    timePoints.add(clip.startTime);
    timePoints.add(clip.startTime + clip.duration);
  });
  
  const sortedTimes = Array.from(timePoints).sort((a, b) => a - b);
  const segments: TimeSegment[] = [];
  
  // Create segments between each pair of time points
  for (let i = 0; i < sortedTimes.length - 1; i++) {
    const segmentStart = sortedTimes[i];
    const segmentEnd = sortedTimes[i + 1];
    const segmentDuration = segmentEnd - segmentStart;
    
    if (segmentDuration < 0.01) continue; // Skip tiny segments
    
    // Find all clips active during this segment
    const activeClips = clips.filter(clip => {
      const clipEnd = clip.startTime + clip.duration;
      return clip.startTime < segmentEnd && clipEnd > segmentStart;
    });
    
    // Sort by track (ascending) - lower track renders on top
    activeClips.sort((a, b) => a.track - b.track);
    
    segments.push({
      startTime: segmentStart,
      duration: segmentDuration,
      clips: activeClips,
    });
  }
  
  return segments;
}

/**
 * Exports a time segment with track priority
 * Only the topmost track (lowest index) is used when multiple clips overlap
 */
async function exportSegmentWithLayers(
  segment: TimeSegment,
  outputPath: string,
  options: ExportOptions = {}
): Promise<ExportResult> {
  return new Promise((resolve) => {
    if (segment.clips.length === 0) {
      // No clips - generate black screen
      return resolve(
        new Promise<ExportResult>((res) => {
          generateBlackScreen(segment.duration, outputPath, options).then(res);
        })
      );
    }
    
    // When multiple clips overlap, only use the topmost track (lowest index)
    // Clips are already sorted by track in createTimeSegments
    const topClip = segment.clips[0]; // First clip has lowest track index (topmost)
    
    const clipStartInSegment = Math.max(0, segment.startTime - topClip.startTime);
    const inPoint = topClip.inPoint + clipStartInSegment;
    const outPoint = Math.min(topClip.outPoint, inPoint + segment.duration);
    
    return resolve(
      exportSingleClip(topClip.filePath, inPoint, outPoint, outputPath, options)
    );
  });
}

/**
 * Exports timeline with multiple clips and track layering
 * 
 * Handles multi-track compositing where lower track indices render on top.
 * 
 * @param clips - Array of timeline clips with file paths and track info
 * @param outputPath - Path for output file
 * @param options - Export options
 * @param onProgress - Progress callback
 * @param timelineDuration - Total duration of timeline
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
    if (clips.length === 0) {
      return {
        success: false,
        error: 'No clips to export',
      };
    }
    
    const finalDuration = timelineDuration || Math.max(...clips.map(c => c.startTime + c.duration));
    
    // Check for simple single-clip case
    if (clips.length === 1 && clips[0].startTime === 0 && 
        Math.abs(clips[0].duration - finalDuration) < 0.01) {
      const clip = clips[0];
      
      // If no subtitles, use simple export
      if (!options.subtitlePath) {
        return await exportSingleClip(
          clip.filePath,
          clip.inPoint,
          clip.outPoint,
          outputPath,
          options,
          onProgress
        );
      }
      
      // With subtitles, we need to use the full pipeline
      // Fall through to segment processing
    }
    
    // Create time segments considering track layering
    const segments = createTimeSegments(clips, finalDuration);
    
    if (segments.length === 0) {
      return {
        success: false,
        error: 'No content to export',
      };
    }
    
    // If only one segment and no subtitles, export it directly
    if (segments.length === 1 && !options.subtitlePath) {
      onProgress?.(50);
      const result = await exportSegmentWithLayers(segments[0], outputPath, options);
      onProgress?.(100);
      return result;
    }
    
    // If only one segment with subtitles, process and add subtitles
    if (segments.length === 1 && options.subtitlePath) {
      onProgress?.(50);
      const tempDir = path.join(process.cwd(), '.temp-export-' + randomUUID());
      await fs.mkdir(tempDir, { recursive: true });
      
      const tempOutput = path.join(tempDir, 'video.mp4');
      const result = await exportSegmentWithLayers(segments[0], tempOutput, options);
      
      if (!result.success) {
        await fs.rm(tempDir, { recursive: true, force: true });
        return result;
      }
      
      onProgress?.(80);
      
      // Add subtitles to the single segment
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempOutput)
          .input(options.subtitlePath!)
          .videoCodec('copy')
          .audioCodec('copy')
          .outputOptions([
            '-c:s mov_text',
            '-metadata:s:s:0 language=eng',
          ])
          .on('end', () => resolve())
          .on('error', (err: Error) => reject(err))
          .save(outputPath);
      });
      
      await fs.rm(tempDir, { recursive: true, force: true });
      onProgress?.(100);
      return { success: true, outputPath };
    }
    
    // Multiple segments - process and concatenate
    const tempDir = path.join(process.cwd(), '.temp-export-' + randomUUID());
    await fs.mkdir(tempDir, { recursive: true });
    
    const processedFiles: string[] = [];
    const totalSegments = segments.length;
    
    // Process each segment
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const tempOutput = path.join(tempDir, `segment_${i}.mp4`);
      
      const result = await exportSegmentWithLayers(segment, tempOutput, options);
      
      if (!result.success) {
        await fs.rm(tempDir, { recursive: true, force: true });
        return result;
      }
      
      processedFiles.push(tempOutput);
      
      const progress = ((i + 1) / totalSegments) * 90; // Reserve 10% for final concat
      onProgress?.(Math.min(progress, 90));
    }
    
    // Concatenate all segments
    const concatListPath = path.join(tempDir, 'concat.txt');
    const concatContent = processedFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
    await fs.writeFile(concatListPath, concatContent);
    
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
      
      // Add subtitle track if provided
      if (options.subtitlePath) {
        try {
          command = command
            .input(options.subtitlePath)
            .outputOptions([
              '-c:s mov_text', // Subtitle codec for MP4
              '-metadata:s:s:0 language=eng', // Set subtitle language
            ]);
          console.log('[FFmpeg] Adding subtitle track:', options.subtitlePath);
        } catch (err) {
          console.warn('[FFmpeg] Failed to add subtitle track:', err);
        }
      }
      
      if (options.resolution) {
        command = command.size(`${options.resolution[0]}x${options.resolution[1]}`);
      }
      
      command
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .save(outputPath);
    });
    
    // Cleanup
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

/**
 * Extracts and flattens audio from timeline clips into a single audio file
 * 
 * Handles multiple clips with trim points, gaps, and overlapping audio.
 * All audio tracks are mixed together into a single mono or stereo track.
 * 
 * @param clips - Array of timeline clips with file paths and timing info
 * @param outputPath - Path for output audio file (mp3 recommended)
 * @param timelineDuration - Total duration of timeline
 * @returns Promise resolving to export result
 */
export async function extractTimelineAudio(
  clips: TimelineClipData[],
  outputPath: string,
  timelineDuration: number
): Promise<ExportResult> {
  try {
    console.log('[FFmpeg] Extracting timeline audio...');
    
    if (clips.length === 0) {
      return {
        success: false,
        error: 'No clips to extract audio from',
      };
    }
    
    // Create temp directory for intermediate audio files
    const tempDir = path.join(process.cwd(), '.temp-audio-' + randomUUID());
    await fs.mkdir(tempDir, { recursive: true });
    
    // Extract audio from each clip with proper timing
    const audioSegments: { path: string; startTime: number; duration: number }[] = [];
    
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const tempAudioPath = path.join(tempDir, `clip_${i}.mp3`);
      
      console.log(`[FFmpeg] Extracting audio from clip ${i + 1}/${clips.length}`);
      
      // Extract audio segment with trim points applied
      await new Promise<void>((resolve, reject) => {
        ffmpeg(clip.filePath)
          .setStartTime(clip.inPoint)
          .setDuration(clip.duration)
          .audioCodec('libmp3lame')
          .audioBitrate('192k')
          .audioChannels(2)
          .noVideo()
          .on('end', () => resolve())
          .on('error', (err: Error) => reject(err))
          .save(tempAudioPath);
      });
      
      audioSegments.push({
        path: tempAudioPath,
        startTime: clip.startTime,
        duration: clip.duration,
      });
    }
    
    // If single clip that starts at 0, just use it directly
    if (audioSegments.length === 1 && audioSegments[0].startTime === 0) {
      await fs.rename(audioSegments[0].path, outputPath);
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log('[FFmpeg] Audio extraction complete (single clip)');
      return { success: true, outputPath };
    }
    
    // Build complex filter to mix all audio segments at their correct positions
    // We'll use adelay to position each clip and amix to combine them
    const filterComplex: string[] = [];
    const inputs: string[] = [];
    
    audioSegments.forEach((segment, index) => {
      inputs.push(segment.path);
      
      // Calculate delay in milliseconds
      const delayMs = Math.round(segment.startTime * 1000);
      
      if (delayMs > 0) {
        // Apply adelay to position the audio at the correct time
        filterComplex.push(`[${index}:a]adelay=${delayMs}|${delayMs}[a${index}]`);
      } else {
        // No delay needed
        filterComplex.push(`[${index}:a]anull[a${index}]`);
      }
    });
    
    // Mix all audio streams together
    const mixInputs = audioSegments.map((_, index) => `[a${index}]`).join('');
    filterComplex.push(`${mixInputs}amix=inputs=${audioSegments.length}:duration=longest:dropout_transition=2[aout]`);
    
    console.log('[FFmpeg] Mixing audio segments...');
    
    // Create the mixed audio file
    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg();
      
      // Add all input files
      audioSegments.forEach(segment => {
        command = command.input(segment.path);
      });
      
      command
        .complexFilter(filterComplex.join(';'), 'aout')
        .audioCodec('libmp3lame')
        .audioBitrate('192k')
        .audioChannels(2)
        .duration(timelineDuration)
        .noVideo()
        .on('end', () => resolve())
        .on('error', (err: Error) => {
          console.error('[FFmpeg] Audio mixing error:', err);
          reject(err);
        })
        .save(outputPath);
    });
    
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
    
    console.log('[FFmpeg] Audio extraction complete:', outputPath);
    
    return { success: true, outputPath };
  } catch (error) {
    console.error('[FFmpeg] Audio extraction failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

