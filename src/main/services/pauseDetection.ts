/**
 * Pause Detection Service
 * 
 * Analyzes audio files to detect and report pauses using OpenAI's API.
 * Uses function calling to have the AI identify silence periods.
 * 
 * @module main/services/pauseDetection
 */

import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

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
 * Detects pauses in an audio file using OpenAI's API
 * 
 * Uses function calling to have the AI analyze the audio and report
 * pause intervals that exceed the minimum duration threshold.
 * 
 * @param audioPath - Path to the audio file (mp3, wav, etc.)
 * @param minDuration - Minimum pause duration in seconds to detect
 * @returns Promise resolving to pause detection result
 */
export async function detectPauses(
  audioPath: string,
  minDuration: number = 3
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

