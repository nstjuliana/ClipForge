/**
 * IPC Type Definitions
 * 
 * TypeScript type definitions for IPC messages between main and renderer processes.
 * Ensures type safety for inter-process communication.
 * 
 * @module main/ipc/types
 */

/**
 * File dialog result type
 */
export interface FileDialogResult {
  filePaths: string[];
  canceled: boolean;
}

/**
 * Save dialog result type
 */
export interface SaveDialogResult {
  filePath: string | null;
  canceled: boolean;
}

/**
 * Subtitle generation result
 */
export interface SubtitleGenerationResult {
  success: boolean;
  subtitlePath?: string;
  error?: string;
}

/**
 * Timeline clip data for subtitle generation
 */
export interface TimelineClipData {
  id: string;
  clipId: string;
  startTime: number;
  duration: number;
  inPoint: number;
  outPoint: number;
  filePath: string;
  track: number;
}

