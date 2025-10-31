/**
 * Metadata Service
 * 
 * Extracts video metadata using ffprobe.
 * Provides information about video files including duration, resolution, codec, etc.
 * 
 * @module services/metadataService
 */

import type { ClipMetadata } from '@/types/clip';

/**
 * Extracts metadata from a video file
 * 
 * Uses the File API and HTMLVideoElement to extract basic metadata.
 * For MVP, we use browser APIs instead of ffprobe for simplicity.
 * 
 * @param filePath - Path to the video file
 * @returns Promise resolving to clip metadata
 * @throws Error if metadata extraction fails
 * 
 * @example
 * const metadata = await extractMetadata('/path/to/video.mp4');
 * console.log(metadata.duration, metadata.resolution);
 */
export async function extractMetadata(filePath: string): Promise<ClipMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const metadata: ClipMetadata = {
        duration: video.duration,
        resolution: [video.videoWidth, video.videoHeight],
        frameRate: 30, // Default, would need ffprobe for accurate framerate
        codec: 'unknown', // Would need ffprobe for codec info
        fileSize: 0, // Will be set by media service
      };
      
      // Clean up
      video.remove();
      URL.revokeObjectURL(video.src);
      
      resolve(metadata);
    };
    
    video.onerror = () => {
      video.remove();
      URL.revokeObjectURL(video.src);
      reject(new Error(`Failed to extract metadata from: ${filePath}`));
    };
    
    // For local files, use file:// protocol
    video.src = filePath;
  });
}

/**
 * Extracts metadata from a File object (browser File API)
 * 
 * @param file - File object from file input or drag-drop
 * @returns Promise resolving to clip metadata
 * @throws Error if metadata extraction fails
 */
export async function extractMetadataFromFile(file: File): Promise<ClipMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const metadata: ClipMetadata = {
        duration: video.duration,
        resolution: [video.videoWidth, video.videoHeight],
        frameRate: 30, // Default framerate
        codec: file.type || 'unknown',
        fileSize: file.size,
      };
      
      // Clean up
      video.remove();
      URL.revokeObjectURL(video.src);
      
      resolve(metadata);
    };
    
    video.onerror = () => {
      video.remove();
      URL.revokeObjectURL(video.src);
      reject(new Error(`Failed to extract metadata from file: ${file.name}`));
    };
    
    // Create object URL from file
    const url = URL.createObjectURL(file);
    video.src = url;
  });
}

/**
 * Formats duration in seconds to human-readable format (MM:SS)
 * 
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 * 
 * @example
 * formatDuration(125); // "02:05"
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats file size in bytes to human-readable format
 * 
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 * 
 * @example
 * formatFileSize(1048576); // "1.00 MB"
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

