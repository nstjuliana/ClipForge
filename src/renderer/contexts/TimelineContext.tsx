/**
 * Timeline Context
 * 
 * Provides timeline state and operations to all components.
 * Manages clips on the timeline, playhead position, and playback state.
 * 
 * @module contexts/TimelineContext
 */

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { TimelineClip, TimelineState, Track } from '@/types/timeline';
import type { Clip } from '@/types/clip';
import { UndoRedoContext } from './UndoRedoContext';
import type { TimelineStateSnapshot } from '@/services/undoRedoService';

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
  splitClipAtPlayhead: (clipIds?: string[] | null) => string[];
  
  /** Split all clips at playhead position across all tracks */
  splitAllClipsAtPlayhead: () => string[];
  
  /** Get clip at playhead position */
  getClipAtPlayhead: () => TimelineClip | null;
  
  /** Add a new track */
  addTrack: () => void;
  
  /** Remove a track */
  removeTrack: (trackIndex: number) => void;
  
  /** Move clip to different track */
  moveClipToTrack: (timelineClipId: string, newTrackIndex: number) => void;
  
  /** Apply undo/redo state snapshot (internal use) */
  applySnapshot: (snapshot: TimelineStateSnapshot) => void;
  
  /** Start a drag operation (defers undo recording until drag ends) */
  startDragOperation: () => void;
  
  /** End a drag operation (records undo state) */
  endDragOperation: () => void;
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
  
  // Flag to prevent recording undo when applying undo/redo state
  const isApplyingUndoRedoRef = useRef(false);
  
  // Flag to track if we're in a drag operation
  const isDragOperationRef = useRef(false);
  
  // Store the state before drag started
  const dragStartStateRef = useRef<TimelineStateSnapshot | null>(null);
  
  /**
   * Create a snapshot of mutable timeline state
   */
  const createSnapshot = useCallback((state: TimelineState): TimelineStateSnapshot => {
    return {
      clips: state.clips,
      tracks: state.tracks,
      duration: state.duration,
    };
  }, []);
  
  /**
   * Apply a snapshot to the timeline (preserving view state)
   */
  const applySnapshot = useCallback((snapshot: TimelineStateSnapshot, currentState: TimelineState): TimelineState => {
    return {
      ...currentState,
      clips: snapshot.clips,
      tracks: snapshot.tracks,
      duration: snapshot.duration,
    };
  }, []);
  
  // Get undo/redo context (optional - may be null if not wrapped)
  const undoRedo = useContext(UndoRedoContext);
  
  // Track previous timeline state for undo recording
  const prevTimelineRef = useRef<TimelineState>(timeline);
  
  // Initialize undo/redo with current state on mount
  useEffect(() => {
    if (undoRedo) {
      undoRedo.initialize(createSnapshot(timeline));
      prevTimelineRef.current = timeline;
    }
  }, []); // Only on mount
  
  // Handle undo/redo operations by applying state changes
  // This effect listens for undo/redo and applies the returned state
  useEffect(() => {
    if (!undoRedo) return;
    
    // We can't directly listen to undo/redo calls, so we'll handle this
    // via the onStateChange callback pattern in UndoRedoProvider
    // which will be set up in MainScreen
  }, [undoRedo, applySnapshot]);
  
  // Function to apply undo/redo state snapshot
  const applySnapshotToTimeline = useCallback((snapshot: TimelineStateSnapshot) => {
    isApplyingUndoRedoRef.current = true;
    setTimeline(prev => {
      const newState = applySnapshot(snapshot, prev);
      prevTimelineRef.current = newState;
      return newState;
    });
    // Reset flag after state update
    setTimeout(() => {
      isApplyingUndoRedoRef.current = false;
    }, 0);
  }, [applySnapshot]);
  
  /**
   * Start a drag operation
   * Records the current state as the "before" state for undo
   */
  const startDragOperation = useCallback(() => {
    if (!undoRedo) return;
    
    isDragOperationRef.current = true;
    dragStartStateRef.current = createSnapshot(timeline);
    prevTimelineRef.current = timeline;
  }, [undoRedo, timeline, createSnapshot]);
  
  /**
   * End a drag operation
   * Records the final state and creates an undo entry
   */
  const endDragOperation = useCallback(() => {
    if (!undoRedo) {
      isDragOperationRef.current = false;
      dragStartStateRef.current = null;
      return;
    }
    
    if (!isDragOperationRef.current || !dragStartStateRef.current) {
      isDragOperationRef.current = false;
      dragStartStateRef.current = null;
      return;
    }
    
    const beforeSnapshot = dragStartStateRef.current;
    const afterSnapshot = createSnapshot(timeline);
    
    // Only record if state actually changed
    if (
      JSON.stringify(beforeSnapshot.clips) !== JSON.stringify(afterSnapshot.clips) ||
      JSON.stringify(beforeSnapshot.tracks) !== JSON.stringify(afterSnapshot.tracks) ||
      beforeSnapshot.duration !== afterSnapshot.duration
    ) {
      undoRedo.recordChange(beforeSnapshot, afterSnapshot, 'Drag operation');
    }
    
    isDragOperationRef.current = false;
    dragStartStateRef.current = null;
    prevTimelineRef.current = timeline;
  }, [undoRedo, timeline, createSnapshot]);
  
  // Record state changes after timeline updates (but not from undo/redo or during drags)
  useEffect(() => {
    if (isApplyingUndoRedoRef.current) {
      prevTimelineRef.current = timeline;
      return;
    }
    
    // Skip recording during drag operations (will be recorded on drag end)
    if (isDragOperationRef.current) {
      return;
    }
    
    if (!undoRedo) {
      prevTimelineRef.current = timeline;
      return;
    }
    
    // Check if timeline state changed
    const prevSnapshot = createSnapshot(prevTimelineRef.current);
    const currentSnapshot = createSnapshot(timeline);
    
    // Only record if clips, tracks, or duration changed
    if (
      JSON.stringify(prevSnapshot.clips) !== JSON.stringify(currentSnapshot.clips) ||
      JSON.stringify(prevSnapshot.tracks) !== JSON.stringify(currentSnapshot.tracks) ||
      prevSnapshot.duration !== currentSnapshot.duration
    ) {
      // Record the change
      undoRedo.recordChange(prevSnapshot, currentSnapshot, 'Timeline change');
      prevTimelineRef.current = timeline;
    }
  }, [timeline.clips, timeline.tracks, timeline.duration, undoRedo, createSnapshot]);
  
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
   * Split clip(s) at playhead position
   * 
   * If clipIds is provided, splits only those clips that intersect the playhead.
   * If clipIds is null/undefined, uses current behavior (split clip at playhead).
   * Returns array of left clip IDs created from splits.
   */
  const splitClipAtPlayhead = useCallback((clipIds?: string[] | null): string[] => {
    const playhead = timeline.playhead;
    let clipsToSplit: TimelineClip[] = [];
    
    if (clipIds && clipIds.length > 0) {
      // Split only selected clips that intersect playhead
      clipsToSplit = timeline.clips.filter(clip => 
        clipIds.includes(clip.id) &&
        playhead > clip.startTime &&
        playhead < clip.startTime + clip.duration
      );
    } else {
      // Default behavior: split clip at playhead
      const clip = getClipAtPlayhead();
      if (clip) {
        clipsToSplit = [clip];
      }
    }
    
    if (clipsToSplit.length === 0) {
      console.warn('No clip(s) at playhead position to split');
      return [];
    }
    
    // Prepare clips to split before state update
    const clipsToRemove = new Set(clipsToSplit.map(c => c.id));
    const splitResults: Array<{ firstClip: TimelineClip; secondClip: TimelineClip }> = [];
    
    for (const clip of clipsToSplit) {
      // Calculate split point relative to clip's start
      const splitPoint = playhead - clip.startTime;
      
      // Ensure split point is within clip bounds (not at edges)
      if (splitPoint <= 0.01 || splitPoint >= clip.duration - 0.01) {
        console.warn(`Cannot split clip ${clip.id} at clip edge`);
        continue;
      }
      
      // Calculate new in/out points for both clips
      const splitTimeInSource = clip.inPoint + splitPoint;
      
      // Create first clip (before split - left clip)
      const firstClip: TimelineClip = {
        ...clip,
        id: generateTimelineClipId(),
        duration: splitPoint,
        outPoint: splitTimeInSource,
      };
      
      // Create second clip (after split - right clip)
      const secondClip: TimelineClip = {
        ...clip,
        id: generateTimelineClipId(),
        startTime: clip.startTime + splitPoint,
        duration: clip.duration - splitPoint,
        inPoint: splitTimeInSource,
      };
      
      splitResults.push({ firstClip, secondClip });
    }
    
    // Collect left clip IDs
    const leftClipIds = splitResults.map(r => r.firstClip.id);
    
    // Update timeline: remove original clips and add split clips
    if (splitResults.length > 0) {
      setTimeline(prev => {
        const newClips = splitResults.flatMap(r => [r.firstClip, r.secondClip]);
        
        // Remove original clips and add new split clips
        const updatedClips = prev.clips
          .filter(c => !clipsToRemove.has(c.id))
          .concat(newClips)
          .sort((a, b) => a.startTime - b.startTime);
        
        return {
          ...prev,
          clips: updatedClips,
        };
      });
    }
    
    return leftClipIds;
  }, [timeline.playhead, timeline.clips, getClipAtPlayhead, generateTimelineClipId]);
  
  /**
   * Split all clips at playhead position across all tracks
   * 
   * Finds all clips that intersect the playhead and splits them all.
   * Returns array of all left clip IDs created from splits.
   */
  const splitAllClipsAtPlayhead = useCallback((): string[] => {
    const playhead = timeline.playhead;
    
    // Find all clips that intersect playhead across all tracks
    const clipsToSplit = timeline.clips.filter(clip => 
      playhead > clip.startTime &&
      playhead < clip.startTime + clip.duration
    );
    
    if (clipsToSplit.length === 0) {
      console.warn('No clips at playhead position to split');
      return [];
    }
    
    // Prepare clips to split before state update
    const clipsToRemove = new Set(clipsToSplit.map(c => c.id));
    const splitResults: Array<{ firstClip: TimelineClip; secondClip: TimelineClip }> = [];
    
    for (const clip of clipsToSplit) {
      // Calculate split point relative to clip's start
      const splitPoint = playhead - clip.startTime;
      
      // Ensure split point is within clip bounds (not at edges)
      if (splitPoint <= 0.01 || splitPoint >= clip.duration - 0.01) {
        console.warn(`Cannot split clip ${clip.id} at clip edge`);
        continue;
      }
      
      // Calculate new in/out points for both clips
      const splitTimeInSource = clip.inPoint + splitPoint;
      
      // Create first clip (before split - left clip)
      const firstClip: TimelineClip = {
        ...clip,
        id: generateTimelineClipId(),
        duration: splitPoint,
        outPoint: splitTimeInSource,
      };
      
      // Create second clip (after split - right clip)
      const secondClip: TimelineClip = {
        ...clip,
        id: generateTimelineClipId(),
        startTime: clip.startTime + splitPoint,
        duration: clip.duration - splitPoint,
        inPoint: splitTimeInSource,
      };
      
      splitResults.push({ firstClip, secondClip });
    }
    
    // Collect left clip IDs
    const leftClipIds = splitResults.map(r => r.firstClip.id);
    
    // Update timeline: remove original clips and add split clips
    if (splitResults.length > 0) {
      setTimeline(prev => {
        const newClips = splitResults.flatMap(r => [r.firstClip, r.secondClip]);
        
        // Remove original clips and add new split clips
        const updatedClips = prev.clips
          .filter(c => !clipsToRemove.has(c.id))
          .concat(newClips)
          .sort((a, b) => a.startTime - b.startTime);
        
        return {
          ...prev,
          clips: updatedClips,
        };
      });
    }
    
    return leftClipIds;
  }, [timeline.playhead, timeline.clips, generateTimelineClipId]);
  
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
      splitAllClipsAtPlayhead,
      getClipAtPlayhead,
      addTrack,
      removeTrack,
      moveClipToTrack,
      applySnapshot: applySnapshotToTimeline,
      startDragOperation,
      endDragOperation,
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
      splitAllClipsAtPlayhead,
      getClipAtPlayhead,
      addTrack,
      removeTrack,
      moveClipToTrack,
      applySnapshotToTimeline,
      startDragOperation,
      endDragOperation,
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


