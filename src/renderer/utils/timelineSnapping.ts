/**
 * Timeline Snapping Utilities
 * 
 * Functions for snapping clips to tracks and other clip edges.
 * 
 * @module utils/timelineSnapping
 */

import type { TimelineClip } from '@/types/timeline';
import { TRACK_HEIGHT, TRACK_PADDING, TIMELINE_PADDING, RULER_HEIGHT, SNAP_THRESHOLD } from '@/components/panels/timeline/timelineConstants';

type TimelineConstants = {
  TRACK_HEIGHT: number;
  TRACK_PADDING: number;
  TIMELINE_PADDING: number;
  RULER_HEIGHT: number;
  SNAP_THRESHOLD: number;
};

/**
 * Find nearest track index from Y position and snap to it
 */
export function snapToTrack(
  y: number,
  numTracks: number,
  constants: TimelineConstants
): number {
  const { RULER_HEIGHT, TRACK_PADDING, TRACK_HEIGHT } = constants;
  const trackY = y - RULER_HEIGHT - TRACK_PADDING;
  const trackIndex = Math.round(trackY / (TRACK_HEIGHT + TRACK_PADDING));
  const clampedTrackIndex = Math.max(0, Math.min(trackIndex, numTracks - 1));
  return RULER_HEIGHT + TRACK_PADDING + clampedTrackIndex * (TRACK_HEIGHT + TRACK_PADDING);
}

/**
 * Find snap points from nearby clips and snap X position if close enough
 * Left edge snaps to right edges, right edge snaps to left edges
 */
export function snapToClipEdges(
  x: number,
  y: number,
  currentClipId: string,
  clipWidth: number,
  clips: TimelineClip[],
  zoom: number,
  numTracks: number,
  constants: TimelineConstants
): number {
  const { TIMELINE_PADDING, RULER_HEIGHT, TRACK_PADDING, TRACK_HEIGHT, SNAP_THRESHOLD } = constants;
  
  // Calculate which track we're on
  const trackY = y - RULER_HEIGHT - TRACK_PADDING;
  const trackIndex = Math.round(trackY / (TRACK_HEIGHT + TRACK_PADDING));
  const clampedTrackIndex = Math.max(0, Math.min(trackIndex, numTracks - 1));
  
  // Get all clips on relevant tracks (excluding the current clip being dragged)
  const relevantClips: Array<{ clip: TimelineClip; trackIndex: number }> = [];
  
  // Same track
  clips
    .filter(clip => clip.id !== currentClipId && clip.track === clampedTrackIndex)
    .forEach(clip => relevantClips.push({ clip, trackIndex: clampedTrackIndex }));
  
  // Adjacent tracks
  if (clampedTrackIndex > 0) {
    clips
      .filter(clip => clip.id !== currentClipId && clip.track === clampedTrackIndex - 1)
      .forEach(clip => relevantClips.push({ clip, trackIndex: clampedTrackIndex - 1 }));
  }
  if (clampedTrackIndex < numTracks - 1) {
    clips
      .filter(clip => clip.id !== currentClipId && clip.track === clampedTrackIndex + 1)
      .forEach(clip => relevantClips.push({ clip, trackIndex: clampedTrackIndex + 1 }));
  }
  
  // Calculate current clip's left and right edges
  const currentLeftEdge = x;
  const currentRightEdge = x + clipWidth;
  
  // Find snap candidates:
  // - Right edges of other clips (for left edge snapping)
  // - Left edges of other clips (for right edge snapping)
  let snappedX = x;
  let minDistance = SNAP_THRESHOLD;
  
  relevantClips.forEach(({ clip }) => {
    const otherClipStartX = TIMELINE_PADDING + clip.startTime * zoom;
    const otherClipEndX = otherClipStartX + clip.duration * zoom;
    
    // Check if current clip's LEFT edge should snap to other clip's RIGHT edge
    const leftToRightDistance = Math.abs(currentLeftEdge - otherClipEndX);
    if (leftToRightDistance < minDistance) {
      minDistance = leftToRightDistance;
      snappedX = otherClipEndX; // Snap left edge to right edge
    }
    
    // Check if current clip's RIGHT edge should snap to other clip's LEFT edge
    const rightToLeftDistance = Math.abs(currentRightEdge - otherClipStartX);
    if (rightToLeftDistance < minDistance) {
      minDistance = rightToLeftDistance;
      snappedX = otherClipStartX - clipWidth; // Adjust X so right edge snaps to left edge
    }
  });
  
  return Math.max(TIMELINE_PADDING, snappedX);
}

/**
 * Snap a clip's left edge to the nearest edge to its left
 */
export function snapClipLeft(
  clipId: string,
  clips: TimelineClip[],
  numTracks: number,
  updateTimelineClip: (clipId: string, updates: Partial<TimelineClip>) => void
): void {
  const clip = clips.find(c => c.id === clipId);
  if (!clip) return;
  
  // If clip's left edge is already at 0, do nothing
  if (clip.startTime <= 0.001) {
    return;
  }
  
  // Collect all snap candidates: clip edges on same and adjacent tracks
  const snapCandidates: number[] = [0]; // Timeline start
  
  // Check same track and adjacent tracks
  const relevantTrackIndices = [
    clip.track,
    clip.track > 0 ? clip.track - 1 : -1,
    clip.track < numTracks - 1 ? clip.track + 1 : -1,
  ].filter(idx => idx >= 0);
  
  clips.forEach(otherClip => {
    if (otherClip.id === clipId) return; // Exclude self
    if (!relevantTrackIndices.includes(otherClip.track)) return;
    
    // Add other clip's left edge (startTime)
    snapCandidates.push(otherClip.startTime);
    // Add other clip's right edge (startTime + duration)
    snapCandidates.push(otherClip.startTime + otherClip.duration);
  });
  
  // Find nearest edge to the LEFT of current left edge
  const currentLeftEdge = clip.startTime;
  const leftCandidates = snapCandidates.filter(pos => pos < currentLeftEdge && pos >= 0);
  
  if (leftCandidates.length > 0) {
    // Find the maximum (closest to current position but still left of it)
    const targetEdge = Math.max(...leftCandidates);
    updateTimelineClip(clipId, { startTime: targetEdge });
  }
}

/**
 * Snap a clip's right edge to the nearest edge to its right
 */
export function snapClipRight(
  clipId: string,
  clips: TimelineClip[],
  duration: number,
  numTracks: number,
  updateTimelineClip: (clipId: string, updates: Partial<TimelineClip>) => void
): void {
  const clip = clips.find(c => c.id === clipId);
  if (!clip) return;
  
  const clipRightEdge = clip.startTime + clip.duration;
  
  // If clip's right edge is already at timeline end, do nothing
  if (clipRightEdge >= duration - 0.001) {
    return;
  }
  
  // Collect all snap candidates: clip edges on same and adjacent tracks
  const snapCandidates: number[] = [duration]; // Timeline end
  
  // Check same track and adjacent tracks
  const relevantTrackIndices = [
    clip.track,
    clip.track > 0 ? clip.track - 1 : -1,
    clip.track < numTracks - 1 ? clip.track + 1 : -1,
  ].filter(idx => idx >= 0);
  
  clips.forEach(otherClip => {
    if (otherClip.id === clipId) return; // Exclude self
    if (!relevantTrackIndices.includes(otherClip.track)) return;
    
    // Add other clip's left edge (startTime)
    snapCandidates.push(otherClip.startTime);
    // Add other clip's right edge (startTime + duration)
    snapCandidates.push(otherClip.startTime + otherClip.duration);
  });
  
  // Find candidates to the right of current right edge
  const rightCandidates = snapCandidates.filter(pos => pos > clipRightEdge && pos <= duration);
  
  if (rightCandidates.length > 0) {
    // Find the minimum (closest to current position but right of it)
    const targetEdge = Math.min(...rightCandidates);
    
    // Calculate new startTime so that clip's right edge aligns with target
    // targetEdge = newStartTime + duration
    // newStartTime = targetEdge - duration
    const newStartTime = targetEdge - clip.duration;
    
    // Ensure we don't go below 0
    if (newStartTime >= 0) {
      updateTimelineClip(clipId, { startTime: newStartTime });
    } else {
      // If aligning right edge would push left edge below 0, align left edge to 0
      updateTimelineClip(clipId, { startTime: 0 });
    }
  }
}
