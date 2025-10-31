/**
 * Timeline Keyboard Shortcuts Hook
 * 
 * Handles all keyboard shortcuts for timeline operations.
 * 
 * @module hooks/useTimelineKeyboardShortcuts
 */

import { useEffect } from 'react';
import { compressTrack } from '@/utils/timelineCompression';
import { snapClipLeft, snapClipRight } from '@/utils/timelineSnapping';
import { FRAME_DURATION } from '@/components/panels/timeline/timelineConstants';
import type { TimelineClip } from '@/types/timeline';

interface UseTimelineKeyboardShortcutsProps {
  timelineCanvasRef: React.RefObject<HTMLDivElement>;
  selectedClips: string[];
  clips: TimelineClip[];
  duration: number;
  numTracks: number;
  handleSplitClip: () => void;
  splitAllClipsAtPlayhead: () => string[];
  setSelectedClips: (clipIds: string[]) => void;
  removeTimelineClip: (clipId: string) => void;
  updateTimelineClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  moveClipToTrack: (clipId: string, trackIndex: number) => void;
}

/**
 * Hook to manage timeline keyboard shortcuts
 */
export function useTimelineKeyboardShortcuts({
  timelineCanvasRef,
  selectedClips,
  clips,
  duration,
  numTracks,
  handleSplitClip,
  splitAllClipsAtPlayhead,
  setSelectedClips,
  removeTimelineClip,
  updateTimelineClip,
  moveClipToTrack,
}: UseTimelineKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if timeline canvas is focused
      if (document.activeElement !== timelineCanvasRef.current) {
        return;
      }

      // Don't process if focus is in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Check for Ctrl/Cmd modifier
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // 's' key: split clip(s) (same as clicking split button)
      // Works even without selected clips (splits clip at playhead)
      if (e.key === 's' && !isCtrlOrCmd) {
        e.preventDefault();
        handleSplitClip();
        return;
      }

      // Ctrl+S: split all clips at playhead across all tracks
      // Works even without selected clips
      if (e.key === 's' && isCtrlOrCmd) {
        e.preventDefault();
        const leftClipIds = splitAllClipsAtPlayhead();
        if (leftClipIds.length > 0) {
          // Select all left clips from the splits as multi-select
          setSelectedClips(leftClipIds);
        }
        return;
      }

      // 'd' key: compress selected clips (remove gaps)
      // Only works if there are selected clips
      // Groups selected clips by track and compresses each group separately
      if (e.key === 'd' && !isCtrlOrCmd) {
        e.preventDefault();
        if (selectedClips.length > 0) {
          // Group selected clips by track
          const clipsByTrack = new Map<number, string[]>();
          selectedClips.forEach(clipId => {
            const clip = clips.find(c => c.id === clipId);
            if (clip) {
              if (!clipsByTrack.has(clip.track)) {
                clipsByTrack.set(clip.track, []);
              }
              clipsByTrack.get(clip.track)!.push(clipId);
            }
          });
          
          // Compress each track's selected clips separately
          clipsByTrack.forEach((clipIds, trackIndex) => {
            compressTrack(trackIndex, clips, updateTimelineClip, clipIds);
          });
        }
        return;
      }

      // Ctrl+D: compress all clips on all tracks (remove gaps)
      if (e.key === 'd' && isCtrlOrCmd) {
        e.preventDefault();
        // Compress all tracks
        for (let trackIndex = 0; trackIndex < numTracks; trackIndex++) {
          compressTrack(trackIndex, clips, updateTimelineClip);
        }
        return;
      }

      // No selected clips, nothing to do (for other operations)
      if (selectedClips.length === 0) {
        return;
      }

      // Delete key: remove selected clips
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        selectedClips.forEach(clipId => {
          removeTimelineClip(clipId);
        });
        return;
      }

      // Arrow keys for nudging, track movement, or edge snapping

      // Ctrl/Cmd + Left/Right: snap to nearest clip edge
      if (e.key === 'ArrowLeft' && isCtrlOrCmd) {
        e.preventDefault();
        selectedClips.forEach(clipId => {
          snapClipLeft(clipId, clips, numTracks, updateTimelineClip);
        });
        return;
      }

      if (e.key === 'ArrowRight' && isCtrlOrCmd) {
        e.preventDefault();
        selectedClips.forEach(clipId => {
          snapClipRight(clipId, clips, duration, numTracks, updateTimelineClip);
        });
        return;
      }

      // Left/Right arrows: nudge clips horizontally
      if (e.key === 'ArrowLeft' && !isCtrlOrCmd) {
        e.preventDefault();
        const nudgeAmount = -FRAME_DURATION;
        selectedClips.forEach(clipId => {
          const clip = clips.find(c => c.id === clipId);
          if (clip) {
            const newStartTime = Math.max(0, clip.startTime + nudgeAmount);
            updateTimelineClip(clipId, { startTime: newStartTime });
          }
        });
        return;
      }

      if (e.key === 'ArrowRight' && !isCtrlOrCmd) {
        e.preventDefault();
        const nudgeAmount = FRAME_DURATION;
        selectedClips.forEach(clipId => {
          const clip = clips.find(c => c.id === clipId);
          if (clip) {
            updateTimelineClip(clipId, { startTime: clip.startTime + nudgeAmount });
          }
        });
        return;
      }

      // Ctrl/Cmd + Up/Down: move clips between tracks
      if (e.key === 'ArrowUp' && isCtrlOrCmd) {
        e.preventDefault();
        selectedClips.forEach(clipId => {
          const clip = clips.find(c => c.id === clipId);
          if (clip && clip.track > 0) {
            moveClipToTrack(clipId, clip.track - 1);
          }
        });
        return;
      }

      if (e.key === 'ArrowDown' && isCtrlOrCmd) {
        e.preventDefault();
        selectedClips.forEach(clipId => {
          const clip = clips.find(c => c.id === clipId);
          if (clip && clip.track < numTracks - 1) {
            moveClipToTrack(clipId, clip.track + 1);
          }
        });
        return;
      }
    };

    if (timelineCanvasRef.current) {
      timelineCanvasRef.current.addEventListener('keydown', handleKeyDown);
      return () => {
        if (timelineCanvasRef.current) {
          timelineCanvasRef.current.removeEventListener('keydown', handleKeyDown);
        }
      };
    }
  }, [
    timelineCanvasRef,
    selectedClips,
    clips,
    duration,
    numTracks,
    handleSplitClip,
    splitAllClipsAtPlayhead,
    setSelectedClips,
    removeTimelineClip,
    updateTimelineClip,
    moveClipToTrack,
  ]);
}
