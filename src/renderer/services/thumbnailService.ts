/**
 * Thumbnail Service
 * 
 * Generates thumbnail images from video files.
 * Creates thumbnails at specific timestamps and caches them as data URLs.
 * 
 * @module services/thumbnailService
 */

/**
 * Generates a thumbnail from a video file at a specific timestamp
 * 
 * Uses HTML5 Canvas to capture a frame from the video element.
 * Returns a data URL that can be used directly in img src attributes.
 * 
 * @param filePath - Path to the video file
 * @param timestamp - Time in seconds to capture thumbnail (default: 1)
 * @returns Promise resolving to data URL of the thumbnail
 * @throws Error if thumbnail generation fails
 * 
 * @example
 * const thumbnail = await generateThumbnail('/path/to/video.mp4', 2.5);
 * imageElement.src = thumbnail;
 */
export async function generateThumbnail(
  filePath: string,
  timestamp: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }
    
    video.preload = 'metadata';
    video.muted = true;
    
    video.onloadedmetadata = () => {
      // Ensure timestamp is within video duration
      const safeTimestamp = Math.min(timestamp, video.duration - 0.1);
      video.currentTime = safeTimestamp;
    };
    
    video.onseeked = () => {
      try {
        // Set canvas size to video dimensions (scaled down for performance)
        const maxWidth = 320;
        const scale = maxWidth / video.videoWidth;
        canvas.width = maxWidth;
        canvas.height = video.videoHeight * scale;
        
        // Draw the current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Clean up
        video.remove();
        canvas.remove();
        URL.revokeObjectURL(video.src);
        
        resolve(dataUrl);
      } catch (error) {
        video.remove();
        canvas.remove();
        URL.revokeObjectURL(video.src);
        reject(new Error(`Failed to generate thumbnail: ${error}`));
      }
    };
    
    video.onerror = () => {
      video.remove();
      canvas.remove();
      URL.revokeObjectURL(video.src);
      reject(new Error(`Failed to load video for thumbnail: ${filePath}`));
    };
    
    video.src = filePath;
  });
}

/**
 * Generates a thumbnail from a File object
 * 
 * @param file - File object from file input or drag-drop
 * @param timestamp - Time in seconds to capture thumbnail (default: 1)
 * @returns Promise resolving to data URL of the thumbnail
 * @throws Error if thumbnail generation fails
 */
export async function generateThumbnailFromFile(
  file: File,
  timestamp: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }
    
    video.preload = 'metadata';
    video.muted = true;
    
    const url = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      // Ensure timestamp is within video duration
      const safeTimestamp = Math.min(timestamp, video.duration - 0.1);
      video.currentTime = safeTimestamp;
    };
    
    video.onseeked = () => {
      try {
        // Set canvas size to video dimensions (scaled down for performance)
        const maxWidth = 320;
        const scale = maxWidth / video.videoWidth;
        canvas.width = maxWidth;
        canvas.height = video.videoHeight * scale;
        
        // Draw the current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Clean up
        video.remove();
        canvas.remove();
        URL.revokeObjectURL(url);
        
        resolve(dataUrl);
      } catch (error) {
        video.remove();
        canvas.remove();
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to generate thumbnail: ${error}`));
      }
    };
    
    video.onerror = () => {
      video.remove();
      canvas.remove();
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load video for thumbnail: ${file.name}`));
    };
    
    video.src = url;
  });
}

/**
 * Generates multiple thumbnails at different timestamps
 * 
 * Useful for creating a thumbnail strip or timeline preview.
 * 
 * @param filePath - Path to the video file
 * @param timestamps - Array of timestamps in seconds
 * @returns Promise resolving to array of data URLs
 * @throws Error if any thumbnail generation fails
 * 
 * @example
 * const thumbnails = await generateMultipleThumbnails('/path/to/video.mp4', [1, 5, 10, 15]);
 */
export async function generateMultipleThumbnails(
  filePath: string,
  timestamps: number[]
): Promise<string[]> {
  const thumbnails: string[] = [];
  
  for (const timestamp of timestamps) {
    const thumbnail = await generateThumbnail(filePath, timestamp);
    thumbnails.push(thumbnail);
  }
  
  return thumbnails;
}

