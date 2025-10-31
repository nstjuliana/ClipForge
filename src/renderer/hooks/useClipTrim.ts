/**
 * Clip Trim Hook
 * 
 * Handles trimming of timeline clips (adjusting inPoint and outPoint).
 * 
 * @module hooks/useClipTrim
 */

import { useCallback } from 'react';
import type { TimelineClip } from '@/types/timeline';
import type { Clip } from '@/types/clip';

/**
 * Hook to manage clip trimming
 * 
 * @param clips - Timeline clips
 * @param mediaClips - Media clips
 * @param zoom - Current zoom level
 * @param updateTimelineClip - Function to update timeline clip
 * @returns Trim handlers
 */
export function useClipTrim(
  clips: TimelineClip[],
  mediaClips: Clip[],
  zoom: number,
  updateTimelineClip: (clipId: string, updates: Partial<TimelineClip>) => void
) {
  /**
   * LEFT HANDLE – trim inPoint
   */
  const handleLeftTrimDrag = useCallback((clipId: string, deltaX: number) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    const mediaClip = mediaClips.find(c => c.id === clip.clipId);
    if (!mediaClip) return;

    const deltaTime = deltaX / zoom;

    // Clamp inPoint between 0 and current outPoint
    const newInPoint = Math.max(0, Math.min(clip.inPoint + deltaTime, clip.outPoint - 0.01));
    const newStartTime = clip.startTime + (newInPoint - clip.inPoint);
    const newDuration = clip.outPoint - newInPoint;

    if (newDuration > 0) {
      updateTimelineClip(clipId, {
        inPoint: newInPoint,
        startTime: newStartTime,
        duration: newDuration,
      });
    }
  }, [clips, mediaClips, zoom, updateTimelineClip]);

  /**
   * RIGHT HANDLE – trim outPoint
   */
  const handleRightTrimDrag = useCallback((clipId: string, deltaX: number) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    const mediaClip = mediaClips.find(c => c.id === clip.clipId);
    if (!mediaClip) return;

    const deltaTime = deltaX / zoom;

    // Clamp outPoint between current inPoint and source duration
    const newOutPoint = Math.min(
      mediaClip.duration,
      Math.max(clip.outPoint + deltaTime, clip.inPoint + 0.01)
    );
    const newDuration = newOutPoint - clip.inPoint;

    if (newDuration > 0) {
      updateTimelineClip(clipId, {
        outPoint: newOutPoint,
        duration: newDuration,
      });
    }
  }, [clips, mediaClips, zoom, updateTimelineClip]);

  return {
    handleLeftTrimDrag,
    handleRightTrimDrag,
  };
}
