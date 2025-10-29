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
  const [currentClipPath, setCurrentClipPath] = useState<string | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  /**
   * Get the clip at the current playhead position
   */
  const getCurrentClip = useCallback(() => {
    const playhead = timeline.playhead;
    
    // Find clip at playhead position
    const timelineClip = timeline.clips.find(
      tc => playhead >= tc.startTime && playhead < tc.startTime + tc.duration
    );
    
    if (!timelineClip) return null;
    
    // Get source clip
    const clip = mediaClips.find(c => c.id === timelineClip.clipId);
    if (!clip) return null;
    
    return { clip, timelineClip };
  }, [timeline.playhead, timeline.clips, mediaClips]);

  /**
   * Find the next clip after the given playhead position
   */
  const getNextClip = useCallback((playhead: number) => {
    // Find all clips that start after the playhead, then get the earliest one
    const futureClips = timeline.clips
      .filter(tc => tc.startTime > playhead)
      .sort((a, b) => a.startTime - b.startTime);
    
    if (futureClips.length === 0) return null;
    
    const timelineClip = futureClips[0];
    const clip = mediaClips.find(c => c.id === timelineClip.clipId);
    if (!clip) return null;
    
    return { clip, timelineClip };
  }, [timeline.clips, mediaClips]);
  
  /**
   * Update video source when clip changes
   */
  useEffect(() => {
    const current = getCurrentClip();
    
    if (!current) {
      // Clean up old blob URL
      if (videoBlobUrl) {
        URL.revokeObjectURL(videoBlobUrl);
        setVideoBlobUrl(null);
      }
      setCurrentClipPath(null);
      return;
    }
    
    if (current.clip.filePath !== currentClipPath) {
      setIsLoading(true);
      setCurrentClipPath(current.clip.filePath);
      
      // Request video buffer via IPC and create blob URL
      window.electron.getVideoBlobUrl(current.clip.filePath)
        .then((result: { success: boolean; buffer?: ArrayBuffer; error?: string }) => {
          if (!result.success || !result.buffer) {
            console.error('Failed to load video:', result.error);
            setIsLoading(false);
            return;
          }
          
          // Clean up old blob URL
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
          setIsLoading(false);
        });
    }
  }, [getCurrentClip, currentClipPath, videoBlobUrl]);
  
  /**
   * Cleanup blob URL on unmount
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
   * Handle video ended
   * Note: We don't pause here - the playback loop will handle moving to the next clip
   */
  const handleVideoEnded = useCallback(() => {
    // When a video ends, immediately move playhead forward to continue playback
    // Don't pause - let the playback loop continue to the next clip or blank area
    const current = getCurrentClip();
    if (current && timeline.isPlaying) {
      const nextPlayhead = current.timelineClip.startTime + current.timelineClip.duration;
      
      if (nextPlayhead < timeline.duration) {
        // Move to next position (clip or blank area)
        setPlayhead(nextPlayhead);
      } else {
        // End of timeline
        setPlayhead(timeline.duration);
        setPlaying(false);
      }
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
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            disabled={timeline.duration === 0}
            className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            title={timeline.duration === 0 ? 'No clips on timeline' : timeline.isPlaying ? 'Pause' : 'Play'}
          >
            {timeline.isPlaying ? '⏸' : '▶'}
          </button>
          
          {/* Time Display */}
          <div className="flex items-center gap-2 text-sm text-gray-300 font-mono">
            <span>{formatDuration(timeline.playhead)}</span>
            <span className="text-gray-600">/</span>
            <span>{formatDuration(timeline.duration)}</span>
          </div>
          
          {/* Progress Bar (Simple for MVP) */}
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
  );
}

