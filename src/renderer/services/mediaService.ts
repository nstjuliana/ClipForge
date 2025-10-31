/**
 * Media Service
 * 
 * Handles video file import, validation, and processing.
 * Coordinates metadata extraction and thumbnail generation.
 * 
 * @module services/mediaService
 */

import type { Clip } from '@/types/clip';
import { extractMetadataFromFile } from './metadataService';
import { generateThumbnailFromFile } from './thumbnailService';

/**
 * Supported video file formats
 */
const SUPPORTED_FORMATS = ['mp4', 'mov', 'webm', 'avi', 'mkv'];

/**
 * Maximum file size in bytes (500 MB)
 */
const MAX_FILE_SIZE = 500 * 1024 * 1024;

/**
 * Result of media import operation
 * 
 * @interface MediaImportResult
 */
export interface MediaImportResult {
  /** Whether the import was successful */
  success: boolean;
  
  /** The imported clip (if successful) */
  clip?: Clip;
  
  /** Error message (if failed) */
  error?: string;
  
  /** Original file name */
  fileName: string;
}

/**
 * Validates if a file is a supported video format
 * 
 * @param file - File to validate
 * @returns True if file format is supported
 */
export function isValidVideoFile(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension ? SUPPORTED_FORMATS.includes(extension) : false;
}

/**
 * Validates file size
 * 
 * @param file - File to validate
 * @returns True if file size is within limits
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Imports a video file and extracts all necessary metadata
 * 
 * Performs validation, metadata extraction, and thumbnail generation.
 * Creates a complete Clip object ready to be added to the media library.
 * 
 * @param file - File object to import
 * @returns Promise resolving to import result
 * 
 * @example
 * const result = await importVideoFile(file);
 * if (result.success) {
 *   addClipToLibrary(result.clip);
 * } else {
 *   showError(result.error);
 * }
 */
export async function importVideoFile(file: File): Promise<MediaImportResult> {
  try {
    // Validate file format
    if (!isValidVideoFile(file)) {
      return {
        success: false,
        error: `Unsupported file format. Supported: ${SUPPORTED_FORMATS.join(', ')}`,
        fileName: file.name,
      };
    }
    
    // Validate file size
    if (!isValidFileSize(file)) {
      return {
        success: false,
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)} MB`,
        fileName: file.name,
      };
    }
    
    // Extract metadata
    const metadata = await extractMetadataFromFile(file);
    
    // Generate thumbnail
    const thumbnail = await generateThumbnailFromFile(file);
    
    // Create clip object
    // In Electron renderer, File objects from file inputs don't have a path property
    // We use an object URL as a temporary identifier and the actual path is handled via IPC
    const clip: Clip = {
      id: generateClipId(),
      filePath: URL.createObjectURL(file), // Temporary identifier, actual path handled in IPC
      name: file.name,
      duration: metadata.duration,
      resolution: metadata.resolution,
      frameRate: metadata.frameRate,
      codec: metadata.codec,
      fileSize: metadata.fileSize,
      thumbnailPath: thumbnail,
      importedAt: new Date(),
    };
    
    return {
      success: true,
      clip,
      fileName: file.name,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during import',
      fileName: file.name,
    };
  }
}

/**
 * Imports multiple video files
 * 
 * Processes files in parallel and returns results for all files.
 * 
 * @param files - Array of files to import
 * @returns Promise resolving to array of import results
 * 
 * @example
 * const results = await importMultipleFiles(fileList);
 * const successful = results.filter(r => r.success);
 * const failed = results.filter(r => !r.success);
 */
export async function importMultipleFiles(files: File[]): Promise<MediaImportResult[]> {
  const importPromises = files.map(file => importVideoFile(file));
  return Promise.all(importPromises);
}

/**
 * Converts FileList to File array
 * 
 * Helper function for drag-drop and file input handling.
 * 
 * @param fileList - FileList from input or drop event
 * @returns Array of File objects
 */
export function fileListToArray(fileList: FileList): File[] {
  return Array.from(fileList);
}

/**
 * Imports a video file from a file path (Electron only)
 * 
 * Uses file path directly instead of creating blob URLs.
 * This is more reliable for Electron apps as file paths persist across sessions.
 * 
 * @param filePath - Full path to the video file
 * @returns Promise resolving to import result
 */
export async function importVideoFilePath(filePath: string): Promise<MediaImportResult> {
  try {
    const fileName = filePath.split(/[/\\]/).pop() || 'video.mp4';
    
    // Validate file extension
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension || !SUPPORTED_FORMATS.includes(extension)) {
      return {
        success: false,
        error: `Unsupported file format. Supported: ${SUPPORTED_FORMATS.join(', ')}`,
        fileName,
      };
    }
    
    // Get video file via IPC to create a File object for metadata extraction
    const result: { success: boolean; buffer?: ArrayBuffer; error?: string } = 
      await window.electron.getVideoBlobUrl(filePath);
    
    if (!result.success || !result.buffer) {
      return {
        success: false,
        error: result.error || 'Failed to read video file',
        fileName,
      };
    }
    
    // Create File object from buffer for metadata extraction
    const blob = new Blob([result.buffer], { type: 'video/mp4' });
    const file = new File([blob], fileName, { type: 'video/mp4' });
    
    // Validate file size
    if (!isValidFileSize(file)) {
      return {
        success: false,
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)} MB`,
        fileName,
      };
    }
    
    // Extract metadata
    const metadata = await extractMetadataFromFile(file);
    
    // Generate thumbnail
    const thumbnail = await generateThumbnailFromFile(file);
    
    // Create clip object with actual file path
    const clip: Clip = {
      id: generateClipId(),
      filePath: filePath, // Use actual file path instead of blob URL
      name: fileName,
      duration: metadata.duration,
      resolution: metadata.resolution,
      frameRate: metadata.frameRate,
      codec: metadata.codec,
      fileSize: metadata.fileSize,
      thumbnailPath: thumbnail,
      importedAt: new Date(),
    };
    
    return {
      success: true,
      clip,
      fileName,
    };
  } catch (error) {
    const fileName = filePath.split(/[/\\]/).pop() || 'unknown';
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during import',
      fileName,
    };
  }
}

/**
 * Imports multiple video files from file paths
 * 
 * @param filePaths - Array of file paths to import
 * @returns Promise resolving to array of import results
 */
export async function importMultipleFilePaths(filePaths: string[]): Promise<MediaImportResult[]> {
  const importPromises = filePaths.map(filePath => importVideoFilePath(filePath));
  return Promise.all(importPromises);
}

/**
 * Generates a unique clip ID
 * 
 * Uses timestamp and random string for uniqueness.
 * 
 * @returns Unique clip ID string
 */
function generateClipId(): string {
  return `clip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Filters files to only include video files
 * 
 * @param files - Array of files to filter
 * @returns Array of valid video files
 */
export function filterVideoFiles(files: File[]): File[] {
  return files.filter(file => isValidVideoFile(file));
}

/**
 * Gets files from a drag event
 * 
 * Handles both files and file entries from drag-drop.
 * 
 * @param event - Drag event
 * @returns Array of File objects
 */
export function getFilesFromDragEvent(event: React.DragEvent<HTMLElement>): File[] {
  const files: File[] = [];
  
  if (event.dataTransfer.items) {
    // Use DataTransferItemList interface
    for (let i = 0; i < event.dataTransfer.items.length; i++) {
      const item = event.dataTransfer.items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
  } else {
    // Use DataTransfer interface
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      files.push(event.dataTransfer.files[i]);
    }
  }
  
  return filterVideoFiles(files);
}

