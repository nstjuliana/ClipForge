/**
 * Timeline Type Definitions
 * 
 * Type definitions for timeline state and timeline clips.
 * 
 * @module types/timeline
 */

/**
 * Represents a clip on the timeline
 * 
 * Extends base Clip with timeline-specific properties.
 * 
 * @interface TimelineClip
 */
export interface TimelineClip {
  /** Unique identifier for this timeline instance */
  id: string;

  /** Reference to the source clip ID */
  clipId: string;

  /** Start time on timeline (in seconds) */
  startTime: number;

  /** Duration on timeline (in seconds) */
  duration: number;

  /** In-point of source clip (trim start, in seconds) */
  inPoint: number;

  /** Out-point of source clip (trim end, in seconds) */
  outPoint: number;

  /** Track index (0 = bottom track) */
  track: number;

  /** Z-index for layering */
  layer: number;
}

/**
 * Timeline Track definition
 * 
 * @interface Track
 */
export interface Track {
  /** Track ID */
  id: string;
  
  /** Track name */
  name: string;
  
  /** Track index (0-based) */
  index: number;
}

/**
 * Timeline state
 * 
 * Represents the current state of the timeline.
 * 
 * @interface TimelineState
 */
export interface TimelineState {
  /** All clips on the timeline */
  clips: TimelineClip[];

  /** Available tracks */
  tracks: Track[];

  /** Current playhead position (in seconds) */
  playhead: number;

  /** Whether timeline is playing */
  isPlaying: boolean;

  /** Zoom level (pixels per second) */
  zoom: number;

  /** Scroll position (in seconds) */
  scrollPosition: number;

  /** Total duration of timeline (in seconds) */
  duration: number;

  /** Selected clip IDs */
  selectedClips: string[];
}

