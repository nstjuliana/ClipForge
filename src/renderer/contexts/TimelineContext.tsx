/**
 * Timeline Context
 * 
 * Provides timeline state and operations to all components.
 * Manages clips on the timeline, playhead position, and playback state.
 * 
 * @module contexts/TimelineContext
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { TimelineClip, TimelineState, Track } from '@/types/timeline';
import type { Clip } from '@/types/clip';

/**
 * Timeline context value type
 * 
 * @interface TimelineContextValue
 */
interface TimelineContextValue {
  /** Timeline state */
  timeline: TimelineState;
  
  /** Add a clip to the timeline */
  addClipToTimeline: (clip: Clip, startTime?: number) => void;
  
  /** Remove a clip from the timeline */
  removeTimelineClip: (timelineClipId: string) => void;
  
  /** Update a timeline clip */
  updateTimelineClip: (timelineClipId: string, updates: Partial<TimelineClip>) => void;
  
  /** Set playhead position */
  setPlayhead: (position: number) => void;
  
  /** Set playing state */
  setPlaying: (playing: boolean) => void;
  
  /** Set zoom level */
  setZoom: (zoom: number) => void;
  
  /** Set scroll position */
  setScrollPosition: (position: number) => void;
  
  /** Select clips */
  setSelectedClips: (clipIds: string[]) => void;
  
  /** Get timeline clip by ID */
  getTimelineClip: (timelineClipId: string) => TimelineClip | undefined;
  
  /** Clear timeline */
  clearTimeline: () => void;
  
  /** Get total timeline duration */
  getTotalDuration: () => number;
  
  /** Split clip at playhead position */
  splitClipAtPlayhead: () => boolean;
  
  /** Get clip at playhead position */
  getClipAtPlayhead: () => TimelineClip | null;
  
  /** Add a new track */
  addTrack: () => void;
  
  /** Remove a track */
  removeTrack: (trackIndex: number) => void;
  
  /** Move clip to different track */
  moveClipToTrack: (timelineClipId: string, newTrackIndex: number) => void;
}

/**
 * Timeline Context
 */
const TimelineContext = createContext<TimelineContextValue | null>(null);

/**
 * Timeline Provider Props
 * 
 * @interface TimelineProviderProps
 */
export interface TimelineProviderProps {
  children: React.ReactNode;
  /** Initial timeline state */
  initialTimeline?: TimelineState;
}

/**
 * Timeline Provider Component
 * 
 * Provides timeline state and operations to all child components.
 * 
 * @component
 */
export function TimelineProvider({ children, initialTimeline }: TimelineProviderProps) {
  // Initialize timeline state with default tracks
  const defaultTracks: Track[] = [
    { id: 'track-0', name: 'Track 1', index: 0 },
    { id: 'track-1', name: 'Track 2', index: 1 },
  ];
  
  // Handle backward compatibility: add tracks if not present in loaded project
  const initializedTimeline: TimelineState = initialTimeline 
    ? {
        ...initialTimeline,
        tracks: initialTimeline.tracks || defaultTracks, // Add tracks if missing
      }
    : {
        clips: [],
        tracks: defaultTracks,
        playhead: 0,
        isPlaying: false,
        zoom: 100, // pixels per second
        scrollPosition: 0,
        duration: 0,
        selectedClips: [],
      };
  
  const [timeline, setTimeline] = useState<TimelineState>(initializedTimeline);
  
  /**
   * Generate unique timeline clip ID
   */
  const generateTimelineClipId = useCallback((): string => {
    return `timeline_clip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);
  
  /**
   * Add a clip to the timeline
   */
  const addClipToTimeline = useCallback((clip: Clip, startTime?: number) => {
    setTimeline(prev => {
      // If no start time specified, place at end of timeline
      const clipStartTime = startTime !== undefined ? startTime : prev.duration;
      
      const newClip: TimelineClip = {
        id: generateTimelineClipId(),
        clipId: clip.id,
        startTime: clipStartTime,
        duration: clip.duration,
        inPoint: 0,
        outPoint: clip.duration,
        track: 0, // Default to track 0
        layer: 0,
      };
      
      const newClips = [...prev.clips, newClip];
      
      // Recalculate total duration
      const newDuration = Math.max(
        prev.duration,
        clipStartTime + newClip.duration
      );
      
      return {
        ...prev,
        clips: newClips,
        duration: newDuration,
      };
    });
  }, [generateTimelineClipId]);
  
  /**
   * Remove a clip from the timeline
   */
  const removeTimelineClip = useCallback((timelineClipId: string) => {
    setTimeline(prev => {
      const newClips = prev.clips.filter(c => c.id !== timelineClipId);
      
      // Recalculate total duration
      const newDuration = newClips.length > 0
        ? Math.max(...newClips.map(c => c.startTime + c.duration))
        : 0;
      
      return {
        ...prev,
        clips: newClips,
        duration: newDuration,
        selectedClips: prev.selectedClips.filter(id => id !== timelineClipId),
      };
    });
  }, []);
  
  /**
   * Update a timeline clip
   */
  const updateTimelineClip = useCallback((timelineClipId: string, updates: Partial<TimelineClip>) => {
    setTimeline(prev => {
      const newClips = prev.clips.map(c =>
        c.id === timelineClipId ? { ...c, ...updates } : c
      );
      
      // Recalculate total duration
      const newDuration = newClips.length > 0
        ? Math.max(...newClips.map(c => c.startTime + c.duration))
        : 0;
      
      return {
        ...prev,
        clips: newClips,
        duration: newDuration,
      };
    });
  }, []);
  
  /**
   * Set playhead position
   */
  const setPlayhead = useCallback((position: number) => {
    setTimeline(prev => ({
      ...prev,
      playhead: Math.max(0, Math.min(position, prev.duration)),
    }));
  }, []);
  
  /**
   * Set playing state
   */
  const setPlaying = useCallback((playing: boolean) => {
    setTimeline(prev => ({
      ...prev,
      isPlaying: playing,
    }));
  }, []);
  
  /**
   * Set zoom level
   */
  const setZoom = useCallback((zoom: number) => {
    setTimeline(prev => ({
      ...prev,
      zoom: Math.max(10, Math.min(zoom, 1000)), // Clamp between 10 and 1000
    }));
  }, []);
  
  /**
   * Set scroll position
   */
  const setScrollPosition = useCallback((position: number) => {
    setTimeline(prev => ({
      ...prev,
      scrollPosition: Math.max(0, position),
    }));
  }, []);
  
  /**
   * Set selected clips
   */
  const setSelectedClips = useCallback((clipIds: string[]) => {
    setTimeline(prev => ({
      ...prev,
      selectedClips: clipIds,
    }));
  }, []);
  
  /**
   * Get timeline clip by ID
   */
  const getTimelineClip = useCallback((timelineClipId: string): TimelineClip | undefined => {
    return timeline.clips.find(c => c.id === timelineClipId);
  }, [timeline.clips]);
  
  /**
   * Clear timeline
   */
  const clearTimeline = useCallback(() => {
    const defaultTracks: Track[] = [
      { id: 'track-0', name: 'Track 1', index: 0 },
      { id: 'track-1', name: 'Track 2', index: 1 },
    ];
    
    setTimeline({
      clips: [],
      tracks: defaultTracks,
      playhead: 0,
      isPlaying: false,
      zoom: 100,
      scrollPosition: 0,
      duration: 0,
      selectedClips: [],
    });
  }, []);
  
  /**
   * Get total timeline duration
   */
  const getTotalDuration = useCallback((): number => {
    return timeline.duration;
  }, [timeline.duration]);
  
  /**
   * Get clip at playhead position
   * Returns the clip from the topmost track (lowest track index) if multiple clips overlap
   */
  const getClipAtPlayhead = useCallback((): TimelineClip | null => {
    const playhead = timeline.playhead;
    
    // Find all clips at playhead position
    const clipsAtPlayhead = timeline.clips.filter(
      c => playhead >= c.startTime && playhead < c.startTime + c.duration
    );
    
    if (clipsAtPlayhead.length === 0) return null;
    
    // Sort by track index (ascending) - lower track index = higher priority (on top)
    clipsAtPlayhead.sort((a, b) => a.track - b.track);
    
    return clipsAtPlayhead[0];
  }, [timeline.playhead, timeline.clips]);
  
  /**
   * Split clip at playhead position
   * 
   * Creates two new clips from the clip at the playhead position.
   * Returns true if split was successful, false otherwise.
   */
  const splitClipAtPlayhead = useCallback((): boolean => {
    const clip = getClipAtPlayhead();
    
    if (!clip) {
      console.warn('No clip at playhead position to split');
      return false;
    }
    
    const playhead = timeline.playhead;
    
    // Calculate split point relative to clip's start
    const splitPoint = playhead - clip.startTime;
    
    // Ensure split point is within clip bounds (not at edges)
    if (splitPoint <= 0.01 || splitPoint >= clip.duration - 0.01) {
      console.warn('Cannot split at clip edge');
      return false;
    }
    
    // Calculate new in/out points for both clips
    const splitTimeInSource = clip.inPoint + splitPoint;
    
    // Create first clip (before split)
    const firstClip: TimelineClip = {
      ...clip,
      id: generateTimelineClipId(),
      duration: splitPoint,
      outPoint: splitTimeInSource,
    };
    
    // Create second clip (after split)
    const secondClip: TimelineClip = {
      ...clip,
      id: generateTimelineClipId(),
      startTime: clip.startTime + splitPoint,
      duration: clip.duration - splitPoint,
      inPoint: splitTimeInSource,
    };
    
    // Update timeline: remove original clip and add two new clips
    setTimeline(prev => {
      const newClips = prev.clips
        .filter(c => c.id !== clip.id)
        .concat([firstClip, secondClip])
        .sort((a, b) => a.startTime - b.startTime);
      
      return {
        ...prev,
        clips: newClips,
      };
    });
    
    return true;
  }, [timeline.playhead, timeline.clips, getClipAtPlayhead, generateTimelineClipId]);
  
  /**
   * Add a new track
   */
  const addTrack = useCallback(() => {
    setTimeline(prev => {
      const newIndex = prev.tracks.length;
      const newTrack: Track = {
        id: `track-${newIndex}`,
        name: `Track ${newIndex + 1}`,
        index: newIndex,
      };
      
      return {
        ...prev,
        tracks: [...prev.tracks, newTrack],
      };
    });
  }, []);
  
  /**
   * Remove a track
   * Moves all clips from the removed track to track 0
   */
  const removeTrack = useCallback((trackIndex: number) => {
    setTimeline(prev => {
      // Don't allow removing if only one track left
      if (prev.tracks.length <= 1) {
        console.warn('Cannot remove the last track');
        return prev;
      }
      
      // Move all clips from this track to track 0
      const updatedClips = prev.clips.map(clip =>
        clip.track === trackIndex ? { ...clip, track: 0 } : clip
      );
      
      // Remove the track and reindex remaining tracks
      const updatedTracks = prev.tracks
        .filter(t => t.index !== trackIndex)
        .map((t, i) => ({
          ...t,
          index: i,
          name: `Track ${i + 1}`,
        }));
      
      return {
        ...prev,
        clips: updatedClips,
        tracks: updatedTracks,
      };
    });
  }, []);
  
  /**
   * Move clip to a different track
   */
  const moveClipToTrack = useCallback((timelineClipId: string, newTrackIndex: number) => {
    setTimeline(prev => {
      // Ensure track exists
      if (newTrackIndex < 0 || newTrackIndex >= prev.tracks.length) {
        console.warn('Invalid track index:', newTrackIndex);
        return prev;
      }
      
      const updatedClips = prev.clips.map(clip =>
        clip.id === timelineClipId ? { ...clip, track: newTrackIndex } : clip
      );
      
      return {
        ...prev,
        clips: updatedClips,
      };
    });
  }, []);
  
  // Memoize context value
  const value = useMemo(
    () => ({
      timeline,
      addClipToTimeline,
      removeTimelineClip,
      updateTimelineClip,
      setPlayhead,
      setPlaying,
      setZoom,
      setScrollPosition,
      setSelectedClips,
      getTimelineClip,
      clearTimeline,
      getTotalDuration,
      splitClipAtPlayhead,
      getClipAtPlayhead,
      addTrack,
      removeTrack,
      moveClipToTrack,
    }),
    [
      timeline,
      addClipToTimeline,
      removeTimelineClip,
      updateTimelineClip,
      setPlayhead,
      setPlaying,
      setZoom,
      setScrollPosition,
      setSelectedClips,
      getTimelineClip,
      clearTimeline,
      getTotalDuration,
      splitClipAtPlayhead,
      getClipAtPlayhead,
      addTrack,
      removeTrack,
      moveClipToTrack,
    ]
  );
  
  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>;
}

/**
 * Custom hook to use Timeline Context
 * 
 * @returns Timeline context value
 * @throws Error if used outside TimelineProvider
 * 
 * @example
 * const { timeline, addClipToTimeline, setPlayhead } = useTimeline();
 */
export function useTimeline(): TimelineContextValue {
  const context = useContext(TimelineContext);
  
  if (!context) {
    throw new Error('useTimeline must be used within TimelineProvider');
  }
  
  return context;
}

