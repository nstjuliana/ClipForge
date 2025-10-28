/**
 * Type Definitions
 * 
 * Central export point for all TypeScript type definitions.
 * Import from this file for consistent type access.
 */

/**
 * Basic clip interface for video clips.
 * Will be expanded in Phase 1.
 */
export interface Clip {
  /** Unique identifier for the clip */
  id: string;
  
  /** File path on local system */
  filePath: string;
  
  /** Duration in seconds */
  duration: number;
  
  /** Resolution as [width, height] */
  resolution: [number, number];
  
  /** In-point in seconds (for trimming) */
  inPoint: number;
  
  /** Out-point in seconds (for trimming) */
  outPoint: number;
  
  /** Thumbnail file path */
  thumbnailPath?: string;
}

/**
 * Timeline state interface.
 * Will be expanded in Phase 1.
 */
export interface TimelineState {
  /** Array of clips in the timeline */
  clips: Clip[];
  
  /** Current playhead position in seconds */
  playhead: number;
  
  /** Timeline zoom level */
  zoom: number;
}

/**
 * Project file interface.
 * Will be expanded in Phase 1.
 */
export interface ProjectFile {
  /** Project version */
  version: string;
  
  /** Project name */
  name: string;
  
  /** Timeline state */
  timeline: TimelineState;
  
  /** Project creation timestamp */
  createdAt: string;
  
  /** Project last modified timestamp */
  modifiedAt: string;
}

