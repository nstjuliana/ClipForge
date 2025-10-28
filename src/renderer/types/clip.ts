/**
 * Clip Type Definitions
 * 
 * Type definitions for video clips in the media library and timeline.
 * 
 * @module types/clip
 */

/**
 * Represents a video clip in the media library and timeline.
 * 
 * Contains all metadata needed to display and manipulate a video clip.
 * 
 * @interface Clip
 */
export interface Clip {
  /** Unique identifier for the clip */
  id: string;

  /** File path on local system */
  filePath: string;

  /** Display name of the clip */
  name: string;

  /** Duration in seconds */
  duration: number;

  /** Resolution as [width, height] */
  resolution: [number, number];

  /** Frame rate (fps) */
  frameRate: number;

  /** Video codec */
  codec?: string;

  /** File size in bytes */
  fileSize: number;

  /** Thumbnail file path or data URL */
  thumbnailPath?: string;

  /** Date when clip was imported */
  importedAt: Date;
}

/**
 * Clip metadata extracted from video file
 * 
 * @interface ClipMetadata
 */
export interface ClipMetadata {
  /** Duration in seconds */
  duration: number;

  /** Resolution as [width, height] */
  resolution: [number, number];

  /** Frame rate (fps) */
  frameRate: number;

  /** Video codec */
  codec: string;

  /** File size in bytes */
  fileSize: number;
}

