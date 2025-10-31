/**
 * Pause Detection Service
 * 
 * Analyzes audio files to detect and report pauses using FFmpeg's silencedetect filter.
 * This provides accurate detection of actual silence in the audio waveform.
 * 
 * @module main/services/pauseDetection
 */

import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

/**
 * Represents a pause interval in the audio
 */
export interface PauseInterval {
  start: number; // Start time in seconds
  end: number;   // End time in seconds
}

/**
 * Result of pause detection
 */
export interface PauseDetectionResult {
  success: boolean;
  pauses?: PauseInterval[];
  error?: string;
}

// Configure FFmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

/**
 * Detects silence/pauses in audio using FFmpeg's silencedetect filter
 * 
 * This method analyzes the actual audio waveform for silence, providing
 * more accurate results than transcription-based methods.
 * 
 * @param audioPath - Path to the audio file
 * @param minDuration - Minimum silence duration in seconds
 * @param noiseThreshold - Noise threshold in dB (default: -30dB)
 * @returns Promise resolving to pause detection result
 */
async function detectPausesWithFFmpeg(
  audioPath: string,
  minDuration: number = 0.5,
  noiseThreshold: number = -30
): Promise<PauseDetectionResult> {
  return new Promise((resolve) => {
    const pauses: PauseInterval[] = [];
    let stderrOutput = '';

    console.log(`[PauseDetection] Using FFmpeg silencedetect (threshold: ${noiseThreshold}dB, min: ${minDuration}s)`);

    ffmpeg(audioPath)
      .audioFilters(`silencedetect=noise=${noiseThreshold}dB:d=${minDuration}`)
      .outputOptions(['-f', 'null'])
      .on('stderr', (line: string) => {
        stderrOutput += line + '\n';
        
        // Parse silence_start and silence_end from FFmpeg output
        const silenceStart = line.match(/silence_start: ([\d.]+)/);
        const silenceEnd = line.match(/silence_end: ([\d.]+)/);
        
        if (silenceStart) {
          const startTime = parseFloat(silenceStart[1]);
          console.log(`[PauseDetection] Silence started at: ${startTime.toFixed(3)}s`);
        }
        
        if (silenceEnd) {
          const endTime = parseFloat(silenceEnd[1]);
          console.log(`[PauseDetection] Silence ended at: ${endTime.toFixed(3)}s`);
        }
      })
      .on('end', () => {
        // Parse all silence intervals from the stderr output
        const silenceRegex = /silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g;
        let match;
        
        while ((match = silenceRegex.exec(stderrOutput)) !== null) {
          const start = parseFloat(match[1]);
          const end = parseFloat(match[2]);
          const duration = end - start;
          
          if (duration >= minDuration) {
            pauses.push({ start, end });
            console.log(`[PauseDetection] Found pause: ${start.toFixed(3)}s - ${end.toFixed(3)}s (${duration.toFixed(3)}s)`);
          }
        }
        
        console.log(`[PauseDetection] FFmpeg detection complete. Found ${pauses.length} pause(s)`);
        
        resolve({
          success: true,
          pauses,
        });
      })
      .on('error', (err: Error) => {
        console.error('[PauseDetection] FFmpeg error:', err.message);
        resolve({
          success: false,
          error: `FFmpeg silence detection failed: ${err.message}`,
        });
      })
      .output('-')
      .run();
  });
}

/**
 * Initializes OpenAI client
 * 
 * @returns OpenAI client instance or null if API key is missing
 */
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    console.error('[PauseDetection] OpenAI API key not found in environment variables');
    return null;
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
}

/**
 * Detects pauses in an audio file
 * 
 * Uses FFmpeg's silencedetect filter to analyze the actual audio waveform
 * and find silence intervals that exceed the minimum duration threshold.
 * 
 * @param audioPath - Path to the audio file (mp3, wav, etc.)
 * @param minDuration - Minimum pause duration in seconds to detect
 * @param useFFmpeg - Use FFmpeg instead of OpenAI (default: true, faster and free)
 * @returns Promise resolving to pause detection result
 */
export async function detectPauses(
  audioPath: string,
  minDuration: number = 0.5,
  useFFmpeg: boolean = true
): Promise<PauseDetectionResult> {
  // Use FFmpeg by default (faster, more accurate, and free)
  if (useFFmpeg) {
    return detectPausesWithFFmpeg(audioPath, minDuration);
  }
  
  // Fallback to OpenAI method (kept for compatibility)
  return detectPausesWithOpenAI(audioPath, minDuration);
}

/**
 * Detects pauses in an audio file using OpenAI's Whisper API (legacy method)
 * 
 * Uses word-level timestamps from transcription to identify gaps.
 * Note: This is less accurate than FFmpeg's waveform analysis.
 * 
 * @param audioPath - Path to the audio file (mp3, wav, etc.)
 * @param minDuration - Minimum pause duration in seconds to detect
 * @returns Promise resolving to pause detection result
 */
async function detectPausesWithOpenAI(
  audioPath: string,
  minDuration: number = 0.5
): Promise<PauseDetectionResult> {
  try {
    console.log('[PauseDetection] Starting pause detection for:', audioPath);
    console.log('[PauseDetection] Minimum pause duration:', minDuration, 'seconds');
    
    // Check if API key is configured
    const client = getOpenAIClient();
    if (!client) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.',
      };
    }
    
    // Check if audio file exists
    try {
      await fs.access(audioPath);
    } catch {
      return {
        success: false,
        error: `Audio file not found: ${audioPath}`,
      };
    }
    
    // Check file size (OpenAI API has a 25MB limit for audio)
    const stats = await fs.stat(audioPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    if (fileSizeMB > 25) {
      return {
        success: false,
        error: `Audio file too large (${fileSizeMB.toFixed(2)}MB). OpenAI API supports files up to 25MB.`,
      };
    }
    
    console.log(`[PauseDetection] Audio file size: ${fileSizeMB.toFixed(2)}MB`);
    
    // Read the audio file into a buffer and create a File object
    const audioBuffer = await fs.readFile(audioPath);
    const audioFile = new File([audioBuffer], path.basename(audioPath), {
      type: 'audio/mpeg',
    });
    
    console.log('[PauseDetection] Calling OpenAI API for transcription...');
    
    // Get transcription with word-level timestamps for precise pause detection
    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    }) as any;
    
    console.log('[PauseDetection] Transcription received, analyzing for pauses...');
    
    // Analyze the words to find pauses
    const pauses: PauseInterval[] = [];
    
    if ('words' in transcription && Array.isArray(transcription.words)) {
      const words = transcription.words as Array<{start: number; end: number; word: string}>;
      
      console.log(`[PauseDetection] Found ${words.length} words in transcription`);
      
      // Check gaps between words
      for (let i = 0; i < words.length - 1; i++) {
        const currentWord = words[i];
        const nextWord = words[i + 1];
        
        const gapStart = currentWord.end;
        const gapEnd = nextWord.start;
        const gapDuration = gapEnd - gapStart;
        
        // If gap exceeds minimum duration, it's a pause
        if (gapDuration >= minDuration) {
          pauses.push({
            start: gapStart,
            end: gapEnd,
          });
          console.log(`[PauseDetection] Found pause: ${gapStart.toFixed(2)}s - ${gapEnd.toFixed(2)}s (${gapDuration.toFixed(2)}s)`);
        }
      }
      
      // Check for pause at the beginning (if first word doesn't start near 0)
      if (words.length > 0 && words[0].start >= minDuration) {
        pauses.unshift({
          start: 0,
          end: words[0].start,
        });
        console.log(`[PauseDetection] Found pause at beginning: 0s - ${words[0].start.toFixed(2)}s`);
      }
      
      // Check for pause at the end (if audio continues after last word)
      // We need to know the total audio duration for this
      if (words.length > 0 && 'duration' in transcription) {
        const totalDuration = transcription.duration as number;
        const lastWordEnd = words[words.length - 1].end;
        const remainingDuration = totalDuration - lastWordEnd;
        
        if (remainingDuration >= minDuration) {
          pauses.push({
            start: lastWordEnd,
            end: totalDuration,
          });
          console.log(`[PauseDetection] Found pause at end: ${lastWordEnd.toFixed(2)}s - ${totalDuration.toFixed(2)}s`);
        }
      }
    } else if ('segments' in transcription && Array.isArray(transcription.segments)) {
      // Fallback to segment-based detection if word-level not available
      const segments = transcription.segments as Array<{start: number; end: number}>;
      
      console.log(`[PauseDetection] Word-level timestamps not available, using ${segments.length} segments`);
      
      // Check gaps between segments
      for (let i = 0; i < segments.length - 1; i++) {
        const currentSegment = segments[i];
        const nextSegment = segments[i + 1];
        
        const gapStart = currentSegment.end;
        const gapEnd = nextSegment.start;
        const gapDuration = gapEnd - gapStart;
        
        // If gap exceeds minimum duration, it's a pause
        if (gapDuration >= minDuration) {
          pauses.push({
            start: gapStart,
            end: gapEnd,
          });
          console.log(`[PauseDetection] Found pause: ${gapStart.toFixed(2)}s - ${gapEnd.toFixed(2)}s (${gapDuration.toFixed(2)}s)`);
        }
      }
      
      // Check for pause at the beginning (if first segment doesn't start near 0)
      if (segments.length > 0 && segments[0].start >= minDuration) {
        pauses.unshift({
          start: 0,
          end: segments[0].start,
        });
        console.log(`[PauseDetection] Found pause at beginning: 0s - ${segments[0].start.toFixed(2)}s`);
      }
    }
    
    console.log(`[PauseDetection] Pause detection complete. Found ${pauses.length} pause(s)`);
    
    return {
      success: true,
      pauses,
    };
  } catch (error) {
    console.error('[PauseDetection] Pause detection failed:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      return {
        success: false,
        error: `OpenAI API error: ${error.message}`,
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during pause detection',
    };
  }
}

/**
 * Checks if OpenAI API key is configured
 * 
 * @returns True if API key is configured, false otherwise
 */
export function isPauseDetectionConfigured(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;
  return !!(apiKey && apiKey.trim() !== '');
}

