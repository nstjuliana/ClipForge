/**
 * Clip Drag Hook
 * 
 * Handles dragging of timeline clips with snapping behavior.
 * 
 * @module hooks/useClipDrag
 */

import { useCallback } from 'react';
import { snapToTrack, snapToClipEdges } from '@/utils/timelineSnapping';
import { TIMELINE_PADDING, TRACK_HEIGHT, TRACK_PADDING, RULER_HEIGHT, SNAP_THRESHOLD } from '@/components/panels/timeline/timelineConstants';
import type { TimelineClip } from '@/types/timeline';

const TIMELINE_CONSTANTS = {
  TRACK_HEIGHT,
  TRACK_PADDING,
  TIMELINE_PADDING,
  RULER_HEIGHT,
  SNAP_THRESHOLD,
};

/**
 * Hook to manage clip dragging
 * 
 * @param clips - Timeline clips
 * @param zoom - Current zoom level
 * @param numTracks - Number of tracks
 * @param updateTimelineClip - Function to update timeline clip
 * @param moveClipToTrack - Function to move clip to different track
 * @returns Drag handlers
 */
export function useClipDrag(
  clips: TimelineClip[],
  zoom: number,
  numTracks: number,
  updateTimelineClip: (clipId: string, updates: Partial<TimelineClip>) => void,
  moveClipToTrack: (clipId: string, trackIndex: number) => void
) {
  /**
   * Handle clip drag end - also detect track changes
   */
  const handleClipDragEnd = useCallback((clipId: string, newX: number, newY: number) => {
    const newStartTime = Math.max(0, (newX - TIMELINE_PADDING) / zoom);
    
    // Calculate which track the clip was dropped on (Y should already be snapped)
    const trackY = newY - RULER_HEIGHT - TRACK_PADDING;
    const newTrackIndex = Math.round(trackY / (TRACK_HEIGHT + TRACK_PADDING));
    const clampedTrackIndex = Math.max(0, Math.min(newTrackIndex, numTracks - 1));
    
    // Get the current clip to check if track changed
    const clip = clips.find(c => c.id === clipId);
    
    if (clip && clip.track !== clampedTrackIndex) {
      // Track changed
      moveClipToTrack(clipId, clampedTrackIndex);
    }
    
    updateTimelineClip(clipId, { startTime: newStartTime });
  }, [zoom, clips, updateTimelineClip, moveClipToTrack, numTracks]);

  /**
   * Get drag bound function for a clip
   */
  const getDragBoundFunc = useCallback((clipId: string, clipWidth: number) => {
    return (pos: { x: number; y: number }) => {
      const snappedY = snapToTrack(pos.y, numTracks, TIMELINE_CONSTANTS);
      const snappedX = snapToClipEdges(
        pos.x,
        snappedY,
        clipId,
        clipWidth,
        clips,
        zoom,
        numTracks,
        TIMELINE_CONSTANTS
      );
      return {
        x: snappedX,
        y: snappedY,
      };
    };
  }, [clips, zoom, numTracks]);

  return {
    handleClipDragEnd,
    getDragBoundFunc,
  };
}
