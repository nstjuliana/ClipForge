/**
 * Preview Panel Component
 * 
 * Displays video preview and playback controls.
 * Synchronized with timeline playhead position.
 * 
 * @component
 */

import { useRef, useEffect, useCallback, useState } from 'react';
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
  const { timeline, setPlayhead, setPlaying } = useTimeline();
  const { clips: mediaClips } = useMedia();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTimelineClipId, setCurrentTimelineClipId] = useState<string | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  /**
   * Get the clip at the current playhead position
   * Returns the clip from the topmost track (lowest track index)
   */
  const getCurrentClip = useCallback(() => {
    const playhead = timeline.playhead;
    
    console.log('=== getCurrentClip Debug ===');
    console.log('Playhead:', playhead);
    console.log('Timeline clips count:', timeline.clips.length);
    console.log('Timeline clips:', timeline.clips.map(tc => ({
      id: tc.id,
      clipId: tc.clipId,
      startTime: tc.startTime,
      duration: tc.duration,
      endTime: tc.startTime + tc.duration,
      track: tc.track
    })));
    console.log('Media clips count:', mediaClips.length);
    
    // Find all clips at playhead position
    const clipsAtPlayhead = timeline.clips.filter(tc => {
      const isInRange = playhead >= tc.startTime && playhead < tc.startTime + tc.duration;
      console.log(`Checking clip ${tc.id}: start=${tc.startTime}, end=${tc.startTime + tc.duration}, playhead=${playhead}, track=${tc.track}, inRange=${isInRange}`);
      return isInRange;
    });
    
    console.log('Found clips at playhead:', clipsAtPlayhead);
    
    if (clipsAtPlayhead.length === 0) return null;
    
    // Sort by track index (ascending) - lower track index = higher priority (on top)
    // Track 1 (index 0) renders on top of Track 2 (index 1), etc.
    clipsAtPlayhead.sort((a, b) => a.track - b.track);
    
    const timelineClip = clipsAtPlayhead[0]; // Get topmost track clip
    console.log('Selected topmost clip:', timelineClip);
    
    // Get source clip
    const clip = mediaClips.find(c => c.id === timelineClip.clipId);
    console.log('Found source clip:', clip);
    
    if (!clip) return null;
    
    return { clip, timelineClip };
  }, [timeline.playhead, timeline.clips, mediaClips]);

  /**
   * Find the next clip after the given playhead position
   * If multiple clips start at the same time, returns the one from the topmost track
   */
  const getNextClip = useCallback((playhead: number) => {
    // Find all clips that start after the playhead, then get the earliest one
    const futureClips = timeline.clips
      .filter(tc => tc.startTime > playhead)
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
   * Tracks timelineClip.id to ensure reload when switching clips (even same file, different trim)
   */
  useEffect(() => {
    const current = getCurrentClip();
    
    if (!current) {
      // Clean up old blob URL if we created it
      if (videoBlobUrl && currentTimelineClipId) {
        URL.revokeObjectURL(videoBlobUrl);
      }
      setVideoBlobUrl(null);
      setCurrentTimelineClipId(null);
      return;
    }
    
    const { timelineClip } = current;
    
    // Trigger reload if we're showing a *different timeline clip*
    if (timelineClip.id !== currentTimelineClipId) {
      setIsLoading(true);
      setCurrentTimelineClipId(timelineClip.id);
      
      // Always load via IPC for consistent behavior
      // This handles both real file paths and will error gracefully for invalid blob URLs
      window.electron.getVideoBlobUrl(current.clip.filePath)
        .then((result: { success: boolean; buffer?: ArrayBuffer; error?: string }) => {
          if (!result.success || !result.buffer) {
            console.error('Failed to load video:', result.error);
            console.error('Attempted to load path:', current.clip.filePath);
            setVideoBlobUrl(null);
            setIsLoading(false);
            return;
          }
          
          // Revoke previous blob
          if (videoBlobUrl) {
            URL.revokeObjectURL(videoBlobUrl);
          }
          
          // Convert buffer to Blob and create URL
          const blob = new Blob([result.buffer], { type: 'video/mp4' });
          const url = URL.createObjectURL(blob);
          
          setVideoBlobUrl(url);
          setIsLoading(false);
        })
        .catch((err: unknown) => {
          console.error('Failed to load video:', err);
          console.error('Attempted to load path:', current.clip.filePath);
          setVideoBlobUrl(null);
          setIsLoading(false);
        });
    }
  }, [getCurrentClip, currentTimelineClipId, videoBlobUrl]);
  
  /**
   * Cleanup blob URL on unmount (only if we created it)
   */
  useEffect(() => {
    return () => {
      if (videoBlobUrl && currentTimelineClipId) {
        URL.revokeObjectURL(videoBlobUrl);
      }
    };
  }, [videoBlobUrl, currentTimelineClipId]);
  
  /**
   * Sync video currentTime with playhead
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoBlobUrl) return;
    
    const current = getCurrentClip();
    if (!current) return;
    
    // Calculate time within the clip
    const timeInClip = timeline.playhead - current.timelineClip.startTime + current.timelineClip.inPoint;
    
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
    
    const timeInClip = timeline.playhead - current.timelineClip.startTime + current.timelineClip.inPoint;
    
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
      const timeInClip = timeline.playhead - current.timelineClip.startTime + current.timelineClip.inPoint;
      videoRef.current.currentTime = timeInClip;
    }
  }, [getCurrentClip, timeline.playhead]);
  
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
   * Update playhead during playback
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!timeline.isPlaying) return;
    
    let lastUpdateTime = performance.now();
    
    const updatePlayhead = () => {
      const now = performance.now();
      const deltaTime = (now - lastUpdateTime) / 1000; // Convert to seconds
      lastUpdateTime = now;
      
      const current = getCurrentClip();
      
      if (current && video && video.readyState >= 2) {
        // We're in a clip - sync with video playback
        const timelinePosition = current.timelineClip.startTime + (video.currentTime - current.timelineClip.inPoint);
        
        // Check if we've reached the end of the clip
        if (video.currentTime >= current.timelineClip.outPoint) {
          // Move to next clip or blank area (don't pause, just move forward)
          const nextPlayhead = current.timelineClip.startTime + current.timelineClip.duration;
          
          if (nextPlayhead >= timeline.duration) {
            // End of timeline - pause here
            setPlayhead(timeline.duration);
            setPlaying(false);
            return;
          }
          
          setPlayhead(nextPlayhead);
        } else {
          setPlayhead(timelinePosition);
        }
      } else {
        // We're in a blank area or video not ready - advance playhead forward
        const nextClip = getNextClip(timeline.playhead);
        const maxTime = timeline.duration;
        const newPlayhead = timeline.playhead + deltaTime;
        
        if (nextClip) {
          // There's a next clip - advance until we reach it
          if (newPlayhead >= nextClip.timelineClip.startTime) {
            // We've reached the next clip
            setPlayhead(nextClip.timelineClip.startTime);
            // The effect that syncs video will load the new clip
          } else {
            // Still in blank area, continue advancing
            setPlayhead(Math.min(newPlayhead, nextClip.timelineClip.startTime));
          }
        } else if (newPlayhead >= maxTime) {
          // Reached end of timeline
          setPlayhead(maxTime);
          setPlaying(false);
          return;
        } else {
          // No next clip, advance to end
          setPlayhead(Math.min(newPlayhead, maxTime));
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    };
    
    animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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
   * Force a playhead jump and let the system re-evaluate getCurrentClip()
   */
  const handleVideoEnded = useCallback(() => {
    const current = getCurrentClip();
    if (!current || !timeline.isPlaying) return;
    
    const nextPlayhead = current.timelineClip.startTime + current.timelineClip.duration;
    
    // This will trigger getCurrentClip() to return new clip
    setPlayhead(nextPlayhead);
    
    // Optional: if nextPlayhead exceeds duration, stop
    if (nextPlayhead >= timeline.duration) {
      setPlaying(false);
    }
  }, [getCurrentClip, timeline.isPlaying, timeline.duration, setPlayhead, setPlaying]);
  
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
            
            {/* Progress Bar */}
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden cursor-pointer">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{
                  width: timeline.duration > 0 ? `${(timeline.playhead / timeline.duration) * 100}%` : '0%'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

