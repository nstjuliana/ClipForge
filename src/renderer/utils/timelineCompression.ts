/**
 * Timeline Compression Utilities
 * 
 * Functions for compressing clips on tracks by removing gaps.
 * 
 * @module utils/timelineCompression
 */

import type { TimelineClip } from '@/types/timeline';

/**
 * Compress clips on a track by removing gaps (sequential processing)
 * Processes clips left to right, keeping the first clip in place and moving subsequent clips
 * If clipIds is provided, only compresses those specific clips (must be on the same track)
 */
export function compressTrack(
  trackIndex: number,
  clips: TimelineClip[],
  updateTimelineClip: (clipId: string, updates: Partial<TimelineClip>) => void,
  clipIds?: string[]
): void {
  // Get clips on this track
  let trackClips = clips.filter(clip => clip.track === trackIndex);
  
  // If specific clip IDs provided, filter to only those clips
  if (clipIds && clipIds.length > 0) {
    trackClips = trackClips.filter(clip => clipIds.includes(clip.id));
  }
  
  // Sort by startTime (left to right)
  trackClips.sort((a, b) => a.startTime - b.startTime);
  
  if (trackClips.length === 0) return;
  if (trackClips.length === 1) return; // Only one clip, nothing to compress
  
  // Keep first clip in place, track where it ends
  const firstClip = trackClips[0];
  let currentEndTime = firstClip.startTime + firstClip.duration;
  
  // Process subsequent clips, placing them right after the previous one
  for (let i = 1; i < trackClips.length; i++) {
    const clip = trackClips[i];
    
    // Calculate where this clip should start (right after previous clip ends)
    const newStartTime = currentEndTime;
    
    // Update the clip
    updateTimelineClip(clip.id, { startTime: newStartTime });
    
    // Update current end time for next clip
    currentEndTime = newStartTime + clip.duration;
  }
}
