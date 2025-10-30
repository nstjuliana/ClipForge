/**
 * OpenAI Whisper Service
 * 
 * Handles audio transcription using OpenAI's Whisper API.
 * Generates SRT subtitle files with timing information.
 * 
 * @module main/services/whisper
 */

import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * Result of subtitle generation
 */
export interface SubtitleGenerationResult {
  success: boolean;
  subtitlePath?: string;
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
    console.error('[Whisper] OpenAI API key not found in environment variables');
    return null;
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
}

/**
 * Generates subtitles from an audio file using OpenAI Whisper API
 * 
 * @param audioPath - Path to the audio file (mp3, wav, etc.)
 * @returns Promise resolving to subtitle generation result
 */
export async function generateSubtitles(audioPath: string): Promise<SubtitleGenerationResult> {
  try {
    console.log('[Whisper] Starting subtitle generation for:', audioPath);
    
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
    
    // Check file size (Whisper API has a 25MB limit)
    const stats = await fs.stat(audioPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    if (fileSizeMB > 25) {
      return {
        success: false,
        error: `Audio file too large (${fileSizeMB.toFixed(2)}MB). Whisper API supports files up to 25MB.`,
      };
    }
    
    console.log(`[Whisper] Audio file size: ${fileSizeMB.toFixed(2)}MB`);
    
    // Read the audio file into a buffer and create a File object
    // The OpenAI SDK requires a File object (polyfilled in main/index.ts)
    const audioBuffer = await fs.readFile(audioPath);
    const audioFile = new File([audioBuffer], path.basename(audioPath), {
      type: 'audio/mpeg',
    });
    
    console.log('[Whisper] Calling OpenAI Whisper API...');
    
    // Call Whisper API with SRT format
    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'srt',
      language: 'en', // Can be made configurable
    });
    
    console.log('[Whisper] Transcription received');
    
    // Save SRT file
    const srtPath = audioPath.replace(path.extname(audioPath), '.srt');
    await fs.writeFile(srtPath, transcription as string, 'utf-8');
    
    console.log('[Whisper] Subtitle file saved to:', srtPath);
    
    return {
      success: true,
      subtitlePath: srtPath,
    };
  } catch (error) {
    console.error('[Whisper] Subtitle generation failed:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      return {
        success: false,
        error: `OpenAI API error: ${error.message}`,
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during subtitle generation',
    };
  }
}

/**
 * Checks if OpenAI API key is configured
 * 
 * @returns True if API key is configured, false otherwise
 */
export function isWhisperConfigured(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;
  return !!(apiKey && apiKey.trim() !== '');
}

/**
 * Cleans up temporary subtitle files
 * 
 * @param subtitlePath - Path to subtitle file to delete
 */
export async function cleanupSubtitleFile(subtitlePath: string): Promise<void> {
  try {
    await fs.unlink(subtitlePath);
    console.log('[Whisper] Cleaned up subtitle file:', subtitlePath);
  } catch (error) {
    console.warn('[Whisper] Failed to cleanup subtitle file:', error);
  }
}

