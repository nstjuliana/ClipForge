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
  const { timeline, setPlayhead, updateTimelineClip } = useTimeline();
  const { clips: mediaClips } = useMedia();
  
  // Timeline constants
  const TRACK_HEIGHT = 80;
  const TRACK_PADDING = 10;
  const TIMELINE_PADDING = 50;
  const RULER_HEIGHT = 30;
  
  /**
   * Update dimensions on mount and resize
   */
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
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
   * Handle clip drag
   */
  const handleClipDragEnd = useCallback((clipId: string, newX: number) => {
    const newStartTime = Math.max(0, (newX - TIMELINE_PADDING) / timeline.zoom);
    updateTimelineClip(clipId, { startTime: newStartTime });
  }, [timeline.zoom, updateTimelineClip]);
  
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
    const markers = [];
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
          dragBoundFunc={(pos: { x: number; y: number }) => ({
            x: Math.max(TIMELINE_PADDING, pos.x),
            y: groupY,
          })}
          onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
            // Only fire when the GROUP (not a handle) is dragged
            const target = e.target;
            if (target === e.currentTarget) {
              handleClipDragEnd(timelineClip.id, target.x());
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
        <h3 className="text-sm font-semibold text-white">Timeline</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlayhead(0)}
            className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            ⏮ Reset
          </button>
          <span className="text-xs text-gray-400">
            Zoom: {Math.round(timeline.zoom)}px/s
          </span>
        </div>
      </div>
      
      {/* Timeline Canvas */}
      <div className="flex-1 overflow-auto bg-gray-900">
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
            
            {/* Track Background */}
            <Rect
              x={TIMELINE_PADDING}
              y={RULER_HEIGHT + TRACK_PADDING}
              width={dimensions.width - TIMELINE_PADDING}
              height={TRACK_HEIGHT}
              fill="#2a2a2a"
              stroke="#3a3a3a"
              strokeWidth={1}
            />
            
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

