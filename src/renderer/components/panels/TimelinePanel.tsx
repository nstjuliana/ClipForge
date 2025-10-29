/**
 * Timeline Panel Component
 * 
 * Displays and manages the video editing timeline using Konva.js.
 * Supports clip placement, trimming, and playhead control.
 * 
 * @component
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Line, Group } from 'react-konva';
import { useTimeline } from '@/contexts/TimelineContext';
import { useMedia } from '@/contexts/MediaContext';
import type Konva from 'konva';

/** 
 * Props for TimelinePanel component
 * 
 * @interface TimelinePanelProps
 */
export interface TimelinePanelProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Timeline Panel Component
 * 
 * Visual timeline with clips, playhead, and editing capabilities.
 * For MVP: basic clip display and trim handles.
 */
export function TimelinePanel({ className = '' }: TimelinePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 200 });
  const { timeline, setPlayhead, updateTimelineClip, splitClipAtPlayhead, getClipAtPlayhead, setZoom, setScrollPosition, addTrack, removeTrack, moveClipToTrack } = useTimeline();
  const { clips: mediaClips } = useMedia();
  
  // Check if playhead is over a clip
  const clipAtPlayhead = getClipAtPlayhead();
  
  // Timeline constants
  const TRACK_HEIGHT = 80;
  const TRACK_PADDING = 10;
  const TIMELINE_PADDING = 50;
  const RULER_HEIGHT = 30;
  const NUM_TRACKS = timeline.tracks.length;
  
  /**
   * Update dimensions on mount and resize
   */
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        // Calculate height to fit all tracks
        const totalTrackHeight = RULER_HEIGHT + (NUM_TRACKS * (TRACK_HEIGHT + TRACK_PADDING)) + TRACK_PADDING;
        const containerHeight = containerRef.current.offsetHeight;
        
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: Math.max(containerHeight, totalTrackHeight),
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [NUM_TRACKS, TRACK_HEIGHT, TRACK_PADDING, RULER_HEIGHT]);
  
  /**
   * Handle split clip button click
   */
  const handleSplitClip = useCallback(() => {
    const success = splitClipAtPlayhead();
    if (!success) {
      alert('Cannot split clip at this position');
    }
  }, [splitClipAtPlayhead]);
  
  /**
   * Handle zoom in
   */
  const handleZoomIn = useCallback(() => {
    setZoom(timeline.zoom * 1.5);
  }, [timeline.zoom, setZoom]);
  
  /**
   * Handle zoom out
   */
  const handleZoomOut = useCallback(() => {
    setZoom(timeline.zoom / 1.5);
  }, [timeline.zoom, setZoom]);
  
  /**
   * Handle zoom reset
   */
  const handleZoomReset = useCallback(() => {
    setZoom(100);
  }, [setZoom]);
  
  /**
   * Handle mouse wheel for zoom
   */
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom with Ctrl/Cmd + wheel
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    } else {
      // Pan horizontally with wheel
      const newScrollPosition = timeline.scrollPosition + (e.deltaY / 100);
      setScrollPosition(newScrollPosition);
    }
  }, [timeline.scrollPosition, setScrollPosition, handleZoomIn, handleZoomOut]);
  
  /**
   * Handle stage click to set playhead
   */
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    
    // Convert x position to time
    const x = pointerPos.x - TIMELINE_PADDING;
    const time = Math.max(0, x / timeline.zoom);
    
    setPlayhead(time);
  }, [timeline.zoom, setPlayhead]);
  
  /**
   * Find nearest track index from Y position and snap to it
   */
  const snapToTrack = useCallback((y: number): number => {
    const trackY = y - RULER_HEIGHT - TRACK_PADDING;
    const trackIndex = Math.round(trackY / (TRACK_HEIGHT + TRACK_PADDING));
    const clampedTrackIndex = Math.max(0, Math.min(trackIndex, NUM_TRACKS - 1));
    return RULER_HEIGHT + TRACK_PADDING + clampedTrackIndex * (TRACK_HEIGHT + TRACK_PADDING);
  }, [RULER_HEIGHT, TRACK_PADDING, TRACK_HEIGHT, NUM_TRACKS]);

  /**
   * Snap threshold in pixels - how close clips need to be to snap
   */
  const SNAP_THRESHOLD = 10;

  /**
   * Find snap points from nearby clips and snap X position if close enough
   * Left edge snaps to right edges, right edge snaps to left edges
   */
  const snapToClipEdges = useCallback((x: number, y: number, currentClipId: string, clipWidth: number): number => {
    // Calculate which track we're on
    const trackY = y - RULER_HEIGHT - TRACK_PADDING;
    const trackIndex = Math.round(trackY / (TRACK_HEIGHT + TRACK_PADDING));
    const clampedTrackIndex = Math.max(0, Math.min(trackIndex, NUM_TRACKS - 1));
    
    // Get all clips on relevant tracks (excluding the current clip being dragged)
    const relevantClips: Array<{ clip: typeof timeline.clips[0]; trackIndex: number }> = [];
    
    // Same track
    timeline.clips
      .filter(clip => clip.id !== currentClipId && clip.track === clampedTrackIndex)
      .forEach(clip => relevantClips.push({ clip, trackIndex: clampedTrackIndex }));
    
    // Adjacent tracks
    if (clampedTrackIndex > 0) {
      timeline.clips
        .filter(clip => clip.id !== currentClipId && clip.track === clampedTrackIndex - 1)
        .forEach(clip => relevantClips.push({ clip, trackIndex: clampedTrackIndex - 1 }));
    }
    if (clampedTrackIndex < NUM_TRACKS - 1) {
      timeline.clips
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
      const otherClipStartX = TIMELINE_PADDING + clip.startTime * timeline.zoom;
      const otherClipEndX = otherClipStartX + clip.duration * timeline.zoom;
      
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
  }, [timeline.clips, timeline.zoom, NUM_TRACKS, TIMELINE_PADDING, RULER_HEIGHT, TRACK_PADDING, TRACK_HEIGHT]);

  /**
   * Handle clip drag - also detect track changes
   */
  const handleClipDragEnd = useCallback((clipId: string, newX: number, newY: number) => {
    const newStartTime = Math.max(0, (newX - TIMELINE_PADDING) / timeline.zoom);
    
    // Calculate which track the clip was dropped on (Y should already be snapped)
    const trackY = newY - RULER_HEIGHT - TRACK_PADDING;
    const newTrackIndex = Math.round(trackY / (TRACK_HEIGHT + TRACK_PADDING));
    const clampedTrackIndex = Math.max(0, Math.min(newTrackIndex, NUM_TRACKS - 1));
    
    // Get the current clip to check if track changed
    const clip = timeline.clips.find(c => c.id === clipId);
    
    if (clip && clip.track !== clampedTrackIndex) {
      // Track changed
      moveClipToTrack(clipId, clampedTrackIndex);
    }
    
    updateTimelineClip(clipId, { startTime: newStartTime });
  }, [timeline.zoom, timeline.clips, updateTimelineClip, moveClipToTrack, NUM_TRACKS, TIMELINE_PADDING, RULER_HEIGHT, TRACK_PADDING, TRACK_HEIGHT]);
  
/**
 * LEFT HANDLE – trim inPoint
 */
const handleLeftTrimDrag = useCallback((clipId: string, deltaX: number) => {
  const clip = timeline.clips.find(c => c.id === clipId);
  if (!clip) return;

  const mediaClip = mediaClips.find(c => c.id === clip.clipId);
  if (!mediaClip) return;

  const deltaTime = deltaX / timeline.zoom;

  // NEW: Clamp inPoint between 0 and current outPoint
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
}, [timeline.clips, timeline.zoom, updateTimelineClip, mediaClips]);

/**
 * RIGHT HANDLE – trim outPoint
 */
const handleRightTrimDrag = useCallback((clipId: string, deltaX: number) => {
  const clip = timeline.clips.find(c => c.id === clipId);
  if (!clip) return;

  const mediaClip = mediaClips.find(c => c.id === clip.clipId);
  if (!mediaClip) return;

  const deltaTime = deltaX / timeline.zoom;

  // NEW: Clamp outPoint between current inPoint and source duration
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
}, [timeline.clips, timeline.zoom, updateTimelineClip, mediaClips]);
  
  /**
   * Render timeline ruler (time markers)
   */
  const renderRuler = () => {
    const markers: React.ReactNode[] = [];
    const interval = 1; // 1 second intervals
    const maxTime = Math.max(timeline.duration, 10);
    
    for (let t = 0; t <= maxTime; t += interval) {
      const x = TIMELINE_PADDING + t * timeline.zoom;
      
      markers.push(
        <React.Fragment key={`marker-${t}`}>
          <Line
            points={[x, RULER_HEIGHT - 10, x, RULER_HEIGHT]}
            stroke="#666"
            strokeWidth={1}
          />
          <Text
            x={x - 15}
            y={5}
            text={`${t}s`}
            fontSize={10}
            fill="#999"
          />
        </React.Fragment>
      );
    }
    
    return markers;
  };
  
  /**
   * Render timeline clips
   */
  const renderClips = () => {
    return timeline.clips.map(timelineClip => {
      const mediaClip = mediaClips.find(c => c.id === timelineClip.clipId);
      if (!mediaClip) return null;
  
      const groupX = TIMELINE_PADDING + timelineClip.startTime * timeline.zoom;
      const groupY = RULER_HEIGHT + TRACK_PADDING + timelineClip.track * (TRACK_HEIGHT + TRACK_PADDING);
      const width = timelineClip.duration * timeline.zoom;
  
      return (
        <Group
          key={timelineClip.id}
          x={groupX}
          y={groupY}
          draggable
          dragBoundFunc={(pos: { x: number; y: number }) => {
            const snappedY = snapToTrack(pos.y);
            const clipWidth = timelineClip.duration * timeline.zoom;
            const snappedX = snapToClipEdges(pos.x, snappedY, timelineClip.id, clipWidth);
            return {
              x: snappedX,
              y: snappedY,
            };
          }}
          onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
            // Only fire when the GROUP (not a handle) is dragged
            const target = e.target;
            if (target === e.currentTarget) {
              handleClipDragEnd(timelineClip.id, target.x(), target.y());
            }
          }}
        >
          {/* Clip Body */}
          <Rect
            x={0}
            y={0}
            width={width}
            height={TRACK_HEIGHT}
            fill="#4A90E2"
            stroke="#2E5C8A"
            strokeWidth={2}
            cornerRadius={4}
          />
  
          {/* Clip Name */}
          <Text
            x={8}
            y={8}
            text={mediaClip.name}
            fontSize={12}
            fill="#FFF"
            width={width - 16}
            ellipsis={true}
          />
  
         {/* LEFT TRIM HANDLE */}
<Rect
  x={0}
  y={0}
  width={8}
  height={TRACK_HEIGHT}
  fill="#FFF"
  opacity={0.8}
  draggable
  listening={true}
  dragBoundFunc={(pos) => ({
    x: pos.x,
    y: 0,  // ← lock to group-local top
  })}
  onDragStart={(e) => {
    e.cancelBubble = true;
    // Force stay in group
    const node = e.target;
    node.moveTo(node.getParent());
  }}
  onDragMove={(e) => {
    const node = e.target;
    node.y(0);  // ← enforce group-local Y
    const deltaX = node.x();
    handleLeftTrimDrag(timelineClip.id, deltaX);
  }}
  onDragEnd={(e) => {
    const node = e.target;
    node.x(0);
    node.y(0);
  }}
/>

{/* RIGHT TRIM HANDLE */}
<Rect
  x={width - 8}
  y={0}
  width={8}
  height={TRACK_HEIGHT}
  fill="#FFF"
  opacity={0.8}
  draggable
  listening={true}
  dragBoundFunc={(pos) => ({
    x: pos.x,
    y: 0,
  })}
  onDragStart={(e) => {
    e.cancelBubble = true;
    const node = e.target;
    node.moveTo(node.getParent());
  }}
  onDragMove={(e) => {
    const node = e.target;
    node.y(0);
    const deltaX = node.x() - (width - 8);
    handleRightTrimDrag(timelineClip.id, deltaX);
  }}
  onDragEnd={(e) => {
    const node = e.target;
    node.x(width - 8);
    node.y(0);
  }}
/>
        </Group>
      );
    });
  };
  
  /**
   * Render playhead
   */
  const renderPlayhead = () => {
    const x = TIMELINE_PADDING + timeline.playhead * timeline.zoom;
    
    return (
      <>
        {/* Playhead Line */}
        <Line
          points={[x, 0, x, dimensions.height]}
          stroke="#FF0000"
          strokeWidth={2}
        />
        {/* Playhead Handle */}
        <Rect
          x={x - 6}
          y={0}
          width={12}
          height={RULER_HEIGHT}
          fill="#FF0000"
          cornerRadius={2}
        />
      </>
    );
  };
  
  return (
    <div ref={containerRef} className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Timeline Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Timeline</h3>
          <span className="text-xs text-gray-500">({NUM_TRACKS} tracks)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSplitClip}
            disabled={!clipAtPlayhead}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            title={clipAtPlayhead ? 'Split clip at playhead' : 'Move playhead over a clip to split'}
          >
            ✂️ Split
          </button>
          <div className="flex items-center gap-1 border-l border-gray-700 pl-2">
            <button
              onClick={addTrack}
              className="px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600"
              title="Add Track"
            >
              + Track
            </button>
            <button
              onClick={() => NUM_TRACKS > 1 && removeTrack(NUM_TRACKS - 1)}
              disabled={NUM_TRACKS <= 1}
              className="px-2 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
              title="Remove Last Track"
            >
              − Track
            </button>
          </div>
          <div className="flex items-center gap-1 border-l border-gray-700 pl-2">
            <button
              onClick={handleZoomOut}
              className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
              title="Zoom Out (Ctrl+Wheel)"
            >
              −
            </button>
            <button
              onClick={handleZoomReset}
              className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 min-w-[60px]"
              title="Reset Zoom"
            >
              {Math.round(timeline.zoom)}px/s
            </button>
            <button
              onClick={handleZoomIn}
              className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
              title="Zoom In (Ctrl+Wheel)"
            >
              +
            </button>
          </div>
          <button
            onClick={() => setPlayhead(0)}
            className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
            title="Reset Playhead"
          >
            ⏮
          </button>
        </div>
      </div>
      
      {/* Timeline Canvas */}
      <div 
        className="flex-1 overflow-auto bg-gray-900"
        onWheel={handleWheel}
      >
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          onClick={handleStageClick}
          perfectDrawEnabled={false}
          
        >
          <Layer>
            {/* Background */}
            <Rect
              x={0}
              y={0}
              width={dimensions.width}
              height={dimensions.height}
              fill="#1a1a1a"
            />
            
            {/* Ruler */}
            {renderRuler()}
            
            {/* Track Backgrounds */}
            {timeline.tracks.map((track) => (
              <React.Fragment key={track.id}>
                <Rect
                  x={TIMELINE_PADDING}
                  y={RULER_HEIGHT + TRACK_PADDING + track.index * (TRACK_HEIGHT + TRACK_PADDING)}
                  width={dimensions.width - TIMELINE_PADDING}
                  height={TRACK_HEIGHT}
                  fill={track.index % 2 === 0 ? "#2a2a2a" : "#252530"}
                  stroke="#3a3a3a"
                  strokeWidth={1}
                />
                {/* Track Label */}
                <Text
                  x={8}
                  y={RULER_HEIGHT + TRACK_PADDING + track.index * (TRACK_HEIGHT + TRACK_PADDING) + TRACK_HEIGHT / 2 - 6}
                  text={track.name}
                  fontSize={10}
                  fill="#666"
                  rotation={-90}
                  offsetX={-10}
                />
              </React.Fragment>
            ))}
            
            {/* Clips */}
            {renderClips()}
            
            {/* Playhead */}
            {renderPlayhead()}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

