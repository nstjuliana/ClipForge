/**
 * Preview Panel Component
 * 
 * Displays video preview and playback controls.
 * Synchronized with timeline playhead position.
 * 
 * @component
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useTimeline } from '@/contexts/TimelineContext';
import { useMedia } from '@/contexts/MediaContext';
import { formatDuration } from '@/services/metadataService';

/**
 * Props for PreviewPanel component
 * 
 * @interface PreviewPanelProps
 */
export interface PreviewPanelProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Preview Panel Component
 * 
 * Displays video preview with playback controls.
 * For MVP, shows the clip at the current playhead position.
 */
export function PreviewPanel({ className = '' }: PreviewPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { timeline, setPlayhead, setPlaying } = useTimeline();
  const { clips: mediaClips } = useMedia();
  const [isLoading, setIsLoading] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  // Mutable ref for smooth progress bar updates (updated every frame)
  const playheadRef = useRef(timeline.playhead);
  
  /**
   * Get the clip at the current playhead position
   * Returns the clip from the topmost track (lowest track index)
   */
  /**
   * Keep playheadRef in sync with timeline.playhead for external changes (scrubbing, jumping)
   * Also update progress bar DOM when playhead changes externally (when not playing)
   */
  useEffect(() => {
    playheadRef.current = timeline.playhead;
    
    // Update progress bar DOM directly when playhead changes externally (not during playback)
    // During playback, the playback loop handles DOM updates
    if (!timeline.isPlaying && progressBarRef.current && timeline.duration > 0) {
      const progressBar = progressBarRef.current.querySelector('.bg-blue-600') as HTMLElement;
      if (progressBar) {
        const percentage = (timeline.playhead / timeline.duration) * 100;
        progressBar.style.width = `${percentage}%`;
      }
    }
  }, [timeline.playhead, timeline.isPlaying, timeline.duration]);

  const getCurrentClip = useCallback((playheadPosition?: number) => {
    // Use provided playhead or fall back to ref (for animation frame) or state (for effects)
    const playhead = playheadPosition ?? playheadRef.current ?? timeline.playhead;
    
    // Find all clips at playhead position - inclusive end for gapless clips
    const clipsAtPlayhead = timeline.clips.filter(tc => {
      const isInRange = playhead >= tc.startTime && playhead <= tc.startTime + tc.duration;
      return isInRange;
    });
    
    if (clipsAtPlayhead.length === 0) return null;
    
    // Sort by track index (ascending) - lower track index = higher priority (on top)
    // Track 1 (index 0) renders on top of Track 2 (index 1), etc.
    // For clips on same track, later start time wins (for gapless transitions)
    clipsAtPlayhead.sort((a, b) => {
      if (a.track !== b.track) return a.track - b.track;
      return b.startTime - a.startTime; // later start wins
    });
    
    const timelineClip = clipsAtPlayhead[0]; // Get topmost track clip
    
    // Get source clip
    const clip = mediaClips.find(c => c.id === timelineClip.clipId);
    
    if (!clip) return null;
    
    return { clip, timelineClip };
  }, [timeline.clips, mediaClips]);

  /**
   * Find the next clip after the given playhead position
   * If multiple clips start at the same time, returns the one from the topmost track
   */
  const getNextClip = useCallback((playhead: number) => {
    // Find all clips that start at or after the playhead (>= for gapless clips)
    const futureClips = timeline.clips
      .filter(tc => tc.startTime >= playhead)
      .sort((a, b) => {
        // First sort by start time
        if (a.startTime !== b.startTime) {
          return a.startTime - b.startTime;
        }
        // If same start time, sort by track (lower track = higher priority)
        return a.track - b.track;
      });
    
    if (futureClips.length === 0) return null;
    
    const timelineClip = futureClips[0];
    const clip = mediaClips.find(c => c.id === timelineClip.clipId);
    if (!clip) return null;
    
    return { clip, timelineClip };
  }, [timeline.clips, mediaClips]);
  
  /**
   * Update video source when clip changes
   * Tracks file path to avoid reloading when switching between segments of the same file
   * Only reloads when the actual source file changes
   */
  useEffect(() => {
    const current = getCurrentClip();
    
    if (!current) {
      // Clean up old blob URL immediately if we had one
      if (currentFilePath !== null) {
        if (videoBlobUrl) {
          URL.revokeObjectURL(videoBlobUrl);
        }
        setVideoBlobUrl(null);
        setCurrentFilePath(null);
      }
      return;
    }
    
    const { clip } = current;
    
    // Only reload if we're showing a *different source file*
    // This avoids reloading when switching between split segments of the same video
    if (clip.filePath !== currentFilePath) {
      // Revoke previous blob URL only when changing files
      if (videoBlobUrl && currentFilePath !== null) {
        URL.revokeObjectURL(videoBlobUrl);
      }
      
      setIsLoading(true);
      setCurrentFilePath(clip.filePath);
      
      // Always load via IPC for consistent behavior
      // This handles both real file paths and will error gracefully for invalid blob URLs
      window.electron.getVideoBlobUrl(clip.filePath)
        .then((result: { success: boolean; buffer?: ArrayBuffer; error?: string }) => {
          if (!result.success || !result.buffer) {
            console.error('Failed to load video:', result.error);
            console.error('Attempted to load path:', clip.filePath);
            setVideoBlobUrl(null);
            setIsLoading(false);
            return;
          }
          
          // Convert buffer to Blob and create URL
          const blob = new Blob([result.buffer], { type: 'video/mp4' });
          const url = URL.createObjectURL(blob);
          
          setVideoBlobUrl(url);
          setIsLoading(false);
        })
        .catch((err: unknown) => {
          console.error('Failed to load video:', err);
          console.error('Attempted to load path:', clip.filePath);
          setVideoBlobUrl(null);
          setIsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline.playhead, timeline.clips, mediaClips, currentFilePath]);
  
  /**
   * Cleanup blob URL on unmount - always revoke to prevent memory leaks
   */
  useEffect(() => {
    return () => {
      if (videoBlobUrl) {
        URL.revokeObjectURL(videoBlobUrl);
      }
    };
  }, [videoBlobUrl]);
  
  /**
   * Sync video currentTime with playhead
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoBlobUrl) return;
    
    const current = getCurrentClip();
    if (!current) return;
    
    // Calculate time within the clip using ref for accuracy
    const currentPlayhead = playheadRef.current;
    const timeInClip = currentPlayhead - current.timelineClip.startTime + current.timelineClip.inPoint;
    
    // Update video time if significantly different (avoid constant seeking)
    if (Math.abs(video.currentTime - timeInClip) > 0.1) {
      video.currentTime = timeInClip;
    }
    
    // If we're playing and video is paused, start it (in case we just entered a clip from blank area)
    if (timeline.isPlaying && video.paused && video.readyState >= 2) {
      video.play().catch((err: unknown) => {
        console.error('Failed to start video playback:', err);
      });
    }
  }, [timeline.playhead, timeline.isPlaying, getCurrentClip, videoBlobUrl]);
  
  /**
   * Force video seek & play when clip changes mid-playback
   * This ensures smooth transitions when switching between clips on different tracks
   */
  useEffect(() => {
    const video = videoRef.current;
    const current = getCurrentClip();
    if (!video || !current || !videoBlobUrl) return;
    
    const currentPlayhead = playheadRef.current;
    const timeInClip = currentPlayhead - current.timelineClip.startTime + current.timelineClip.inPoint;
    
    // If we're within the clip's in/out point range
    if (timeInClip >= current.timelineClip.inPoint && timeInClip <= current.timelineClip.outPoint) {
      // Seek if time difference is significant
      if (Math.abs(video.currentTime - timeInClip) > 0.05) {
        video.currentTime = timeInClip;
      }
      // Ensure playback continues if we're supposed to be playing
      if (timeline.isPlaying && video.paused && video.readyState >= 2) {
        video.play().catch(() => {
          // Silently handle play errors during transitions
        });
      }
    }
  }, [timeline.playhead, getCurrentClip, videoBlobUrl, timeline.isPlaying]);
  
  /**
   * Handle video loaded metadata
   */
  const handleLoadedMetadata = useCallback(() => {
    setIsLoading(false);
    
    // Seek to correct position
    const current = getCurrentClip();
    if (current && videoRef.current) {
      const currentPlayhead = playheadRef.current;
      const timeInClip = currentPlayhead - current.timelineClip.startTime + current.timelineClip.inPoint;
      videoRef.current.currentTime = timeInClip;
    }
  }, [getCurrentClip]);
  
  /**
   * Handle play/pause
   */
  const handlePlayPause = useCallback(() => {
    if (timeline.isPlaying) {
      // Pause playback
      const video = videoRef.current;
      if (video) {
        video.pause();
      }
      setPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      // Start playback
      // If we're at the end of the timeline, reset to beginning
      if (timeline.playhead >= timeline.duration && timeline.duration > 0) {
        setPlayhead(0);
      }
      
      // Check if we're in a clip - if so, start video playback
      const current = getCurrentClip();
      const video = videoRef.current;
      
      if (current && video && video.readyState >= 2) {
        // We're in a clip with a loaded video - play it
        video.play();
      }
      // If we're in a blank area, the updatePlayhead effect will handle advancing the playhead
      setPlaying(true);
    }
  }, [timeline.isPlaying, timeline.playhead, timeline.duration, getCurrentClip, setPlaying, setPlayhead]);
  
  /**
   * Jump to start of timeline
   */
  const handleJumpToStart = useCallback(() => {
    setPlayhead(0);
  }, [setPlayhead]);
  
  /**
   * Jump to end of timeline
   */
  const handleJumpToEnd = useCallback(() => {
    setPlayhead(timeline.duration);
  }, [timeline.duration, setPlayhead]);
  
  /**
   * Step forward one frame (assuming 30fps)
   */
  const handleStepForward = useCallback(() => {
    const frameTime = 1 / 30; // Approx 0.033 seconds per frame
    setPlayhead(Math.min(timeline.playhead + frameTime, timeline.duration));
  }, [timeline.playhead, timeline.duration, setPlayhead]);
  
  /**
   * Step backward one frame (assuming 30fps)
   */
  const handleStepBackward = useCallback(() => {
    const frameTime = 1 / 30; // Approx 0.033 seconds per frame
    setPlayhead(Math.max(timeline.playhead - frameTime, 0));
  }, [timeline.playhead, setPlayhead]);
  
  /**
   * Cleaner playback loop - stops at end, jumps to next clip instantly
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!timeline.isPlaying) {
      // Cancel animation frame if we're not playing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    
    let lastUpdateTime = performance.now();
    
    const updatePlayhead = () => {
      // Check if still playing (might have been paused/stopped)
      if (!timeline.isPlaying) {
        animationFrameRef.current = null;
        return;
      }
      
      const now = performance.now();
      const deltaTime = (now - lastUpdateTime) / 1000; // Convert to seconds
      lastUpdateTime = now;
      
      const current = getCurrentClip();
      let newPosition: number;
      
      if (current && video && video.readyState >= 2) {
        // We're in a clip - sync with video playback
        const timelinePosition = current.timelineClip.startTime + (video.currentTime - current.timelineClip.inPoint);
        
        // Check if we've reached the end of the clip
        if (video.currentTime >= current.timelineClip.outPoint || video.ended) {
          const clipEndTime = current.timelineClip.startTime + current.timelineClip.duration;
          
          // Jump to next clip instantly
          const nextClip = getNextClip(clipEndTime);
          
          if (nextClip) {
            // Jump directly to next clip start
            // Add tiny epsilon (0.001s) to move past the boundary when transitioning between tracks
            // This ensures getCurrentClip() finds the new clip instead of the old one at the boundary
            newPosition = nextClip.timelineClip.startTime + 0.001;
            
            // Pause current video to prevent it from continuing during transition
            if (video) {
              video.pause();
            }
            
            // Update ref immediately for next frame
            playheadRef.current = newPosition;
            updateProgressBarWidth(newPosition);
            // Force state update to trigger video loading effect for gapless clips
            setPlayhead(newPosition);
            animationFrameRef.current = requestAnimationFrame(updatePlayhead);
            return;
          } else if (clipEndTime >= timeline.duration) {
            // End of timeline - stop
            newPosition = timeline.duration;
            setPlayhead(newPosition);
            playheadRef.current = newPosition;
            updateProgressBarWidth(newPosition);
            setPlaying(false);
            animationFrameRef.current = null;
            return;
          } else {
            // No next clip, move to end of current clip
            newPosition = clipEndTime;
          }
        } else {
          // Still within clip - sync with video
          newPosition = timelinePosition;
        }
      } else {
        // Blank area - advance through blank space
        const nextClip = getNextClip(playheadRef.current);
        newPosition = playheadRef.current + deltaTime;
        
        if (nextClip) {
          // There's a next clip - jump to it if we've reached it
          if (newPosition >= nextClip.timelineClip.startTime) {
            // Add tiny epsilon to ensure we're inside the new clip
            newPosition = nextClip.timelineClip.startTime + 0.001;
            // Update ref immediately for next frame
            playheadRef.current = newPosition;
            updateProgressBarWidth(newPosition);
            // Force state update when entering a clip from blank area
            setPlayhead(newPosition);
            animationFrameRef.current = requestAnimationFrame(updatePlayhead);
            return;
          }
        } else if (newPosition >= timeline.duration) {
          // Reached end of timeline - stop
          newPosition = timeline.duration;
          setPlayhead(newPosition);
          playheadRef.current = newPosition;
          updateProgressBarWidth(newPosition);
          setPlaying(false);
          animationFrameRef.current = null;
          return;
        } else {
          // Clamp to timeline duration
          newPosition = Math.min(newPosition, timeline.duration);
        }
      }
      
      // Update ref every frame for smooth progress bar
      playheadRef.current = newPosition;
      
      // Directly update DOM for frame-accurate progress bar (bypasses React re-renders)
      updateProgressBarWidth(newPosition);
      
      // Throttle React state updates to ~30-60 updates/sec (only update if change > 0.016s)
      // This reduces re-renders while keeping progress bar smooth via ref and direct DOM updates
      if (Math.abs(newPosition - timeline.playhead) > 0.016) {
        setPlayhead(newPosition);
      }
      
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    };
    
    // Helper to directly update progress bar width (for smooth frame-by-frame updates)
    const updateProgressBarWidth = (position: number) => {
      if (progressBarRef.current && timeline.duration > 0) {
        const progressBar = progressBarRef.current.querySelector('.bg-blue-600') as HTMLElement;
        if (progressBar) {
          const percentage = (position / timeline.duration) * 100;
          progressBar.style.width = `${percentage}%`;
        }
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [timeline.isPlaying, timeline.playhead, timeline.duration, getCurrentClip, getNextClip, setPlayhead, setPlaying]);

  /**
   * Handle keyboard shortcuts (spacebar for play/pause)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle spacebar
      if (e.key !== ' ') {
        return;
      }

      // Don't process if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Prevent default to avoid scrolling the page
      e.preventDefault();
      handlePlayPause();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPause]);
  
  /**
   * Handle video ended
   * Jump to next clip instantly or stop at end
   */
  const handleVideoEnded = useCallback(() => {
    if (!timeline.isPlaying) return;
    
    const current = getCurrentClip();
    const clipEndTime = current ? current.timelineClip.startTime + current.timelineClip.duration : timeline.playhead;
    
    // Check for next clip instantly
    const nextClip = getNextClip(clipEndTime);
    
    if (nextClip) {
      // Jump directly to next clip start
      setPlayhead(nextClip.timelineClip.startTime);
    } else if (clipEndTime >= timeline.duration) {
      // End of timeline - stop
      setPlayhead(timeline.duration);
      setPlaying(false);
    } else {
      // No next clip, move to end of current clip
      setPlayhead(clipEndTime);
    }
  }, [getCurrentClip, getNextClip, timeline.isPlaying, timeline.duration, timeline.playhead, setPlayhead, setPlaying]);

  /**
   * Handle scrubbing on progress bar
   */
  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || timeline.duration <= 0) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newPlayhead = Math.max(0, Math.min(timeline.duration, percent * timeline.duration));
    
    // Update both ref and state
    playheadRef.current = newPlayhead;
    setPlayhead(newPlayhead);
    
    // Update progress bar visually
    const progressBar = progressBarRef.current.querySelector('.bg-blue-600') as HTMLElement;
    if (progressBar) {
      const percentage = (newPlayhead / timeline.duration) * 100;
      progressBar.style.width = `${percentage}%`;
    }
  }, [timeline.duration, setPlayhead]);
  
  return (
    <div className={`flex flex-col h-full bg-black ${className}`}>
      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center bg-gray-900 relative overflow-hidden min-h-0">
        {videoBlobUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoBlobUrl}
              className="max-w-full max-h-full object-contain"
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleVideoEnded}
            />
            {/* Debug: Track and Clip ID Indicator */}
            {(() => {
              const current = getCurrentClip();
              return current ? (
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  Track {current.timelineClip.track + 1} | Clip ID: {current.timelineClip.id}
                </div>
              ) : null;
            })()}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <div className="text-white">Loading...</div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">🎥</div>
            <p>No clip at playhead</p>
            <p className="text-sm mt-2">{isLoading ? 'Loading video...' : 'Add clips to timeline to preview'}</p>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 p-4 flex-shrink-0">
        <div className="flex flex-col gap-3">
          {/* Main Controls Row */}
          <div className="flex items-center gap-4">
            {/* Transport Controls */}
            <div className="flex items-center gap-2">
              {/* Jump to Start */}
              <button
                onClick={handleJumpToStart}
                disabled={timeline.duration === 0}
                className="w-8 h-8 flex items-center justify-center bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed"
                title="Jump to Start"
              >
                ⏮
              </button>
              
              {/* Step Backward */}
              <button
                onClick={handleStepBackward}
                disabled={timeline.duration === 0 || timeline.isPlaying}
                className="w-8 h-8 flex items-center justify-center bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed"
                title="Step Backward (1 frame)"
              >
                ⏪
              </button>
              
              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                disabled={timeline.duration === 0}
                className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                title={timeline.duration === 0 ? 'No clips on timeline' : timeline.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {timeline.isPlaying ? '⏸' : '▶'}
              </button>
              
              {/* Step Forward */}
              <button
                onClick={handleStepForward}
                disabled={timeline.duration === 0 || timeline.isPlaying}
                className="w-8 h-8 flex items-center justify-center bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed"
                title="Step Forward (1 frame)"
              >
                ⏩
              </button>
              
              {/* Jump to End */}
              <button
                onClick={handleJumpToEnd}
                disabled={timeline.duration === 0}
                className="w-8 h-8 flex items-center justify-center bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed"
                title="Jump to End"
              >
                ⏭
              </button>
            </div>
            
            {/* Time Display */}
            <div className="flex items-center gap-2 text-sm text-gray-300 font-mono bg-gray-900 px-3 py-1 rounded">
              <span className="text-blue-400 font-semibold">{formatDuration(timeline.playhead)}</span>
              <span className="text-gray-600">/</span>
              <span>{formatDuration(timeline.duration)}</span>
            </div>
            
            {/* Progress Bar - Click to scrub */}
            <div 
              ref={progressBarRef}
              className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden cursor-pointer"
              onClick={handleProgressBarClick}
              title="Click to jump to position"
            >
              <div
                className="h-full bg-blue-600"
                style={{
                  width: timeline.duration > 0 ? `${(playheadRef.current / timeline.duration) * 100}%` : '0%'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

