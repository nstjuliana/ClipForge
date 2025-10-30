/**
 * Timeline Panel Component
 * 
 * Displays and manages the video editing timeline using Konva.js.
 * Supports clip placement, trimming, and playhead control.
 * 
 * @component
 */

import React, { useRef, useCallback, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { useTimeline } from '@/contexts/TimelineContext';
import { useMedia } from '@/contexts/MediaContext';
import type Konva from 'konva';
import { useTimelineDimensions } from '@/hooks/useTimelineDimensions';
import { useTimelineZoom } from '@/hooks/useTimelineZoom';
import { useTimelineKeyboardShortcuts } from '@/hooks/useTimelineKeyboardShortcuts';
import { useClipDrag } from '@/hooks/useClipDrag';
import { useClipTrim } from '@/hooks/useClipTrim';
import { TimelineHeader } from './timeline/TimelineHeader';
import { TimelineRuler } from './timeline/TimelineRuler';
import { TimelineClip } from './timeline/TimelineClip';
import { TimelinePlayhead } from './timeline/TimelinePlayhead';
import { TimelineTracks } from './timeline/TimelineTracks';
import { RemovePausesModal } from '../modals/RemovePausesModal';
import {
  TRACK_HEIGHT,
  TRACK_PADDING,
  TIMELINE_PADDING,
  RULER_HEIGHT,
} from './timeline/timelineConstants';

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
 */
export function TimelinePanel({ className = '' }: TimelinePanelProps) {
  const timelineCanvasRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  
  const [isRemovePausesModalOpen, setIsRemovePausesModalOpen] = useState(false);
  
  const {
    timeline,
    setPlayhead,
    updateTimelineClip,
    splitClipAtPlayhead,
    splitAllClipsAtPlayhead,
    getClipAtPlayhead,
    setZoom,
    setScrollPosition,
    addTrack,
    removeTrack,
    moveClipToTrack,
    setSelectedClips,
    removeTimelineClip,
    startDragOperation,
    endDragOperation,
  } = useTimeline();
  
  const { clips: mediaClips } = useMedia();

  // Check if playhead is over a clip
  const clipAtPlayhead = getClipAtPlayhead();

  const NUM_TRACKS = timeline.tracks.length;

  // Hooks
  const { dimensions, containerRef } = useTimelineDimensions(NUM_TRACKS);

  const {
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleWheel,
  } = useTimelineZoom(timeline.zoom, timeline.scrollPosition, setZoom, setScrollPosition);

  const {
    handleLeftTrimDrag,
    handleRightTrimDrag,
  } = useClipTrim(timeline.clips, mediaClips, timeline.zoom, updateTimelineClip);

  const {
    handleClipDragEnd,
    getDragBoundFunc,
  } = useClipDrag(
    timeline.clips,
    timeline.zoom,
    NUM_TRACKS,
    updateTimelineClip,
    moveClipToTrack
  );

  /**
   * Handle split clip button click
   */
  const handleSplitClip = useCallback(() => {
    // If there are selected clips, split only those that intersect playhead
    // Otherwise, use default behavior (split clip at playhead)
    const clipIds = timeline.selectedClips.length > 0 ? timeline.selectedClips : null;
    const leftClipIds = splitClipAtPlayhead(clipIds);
    
    if (leftClipIds.length === 0) {
      alert('Cannot split clip(s) at this position');
      return;
    }
    
    // Select the left clip(s) after split
    setSelectedClips(leftClipIds);
  }, [timeline.selectedClips, splitClipAtPlayhead, setSelectedClips]);

  // Keyboard shortcuts
  useTimelineKeyboardShortcuts({
    timelineCanvasRef,
    selectedClips: timeline.selectedClips,
    clips: timeline.clips,
    duration: timeline.duration,
    numTracks: NUM_TRACKS,
    handleSplitClip,
    splitAllClipsAtPlayhead,
    setSelectedClips,
    removeTimelineClip,
    updateTimelineClip,
    moveClipToTrack,
  });

  /**
   * Handle stage click to set playhead and clear selection
   */
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    // Check if we clicked on a clip by traversing the parent chain
    let isClipClick = false;
    let node: Konva.Node | null = e.target;
    
    // Traverse parent chain to see if any parent is a clip Group
    while (node && node !== stage) {
      if (node.getType() === 'Group') {
        // Check if this Group represents a clip by checking its position against known clips
        const groupX = node.x();
        const groupY = node.y();
        
        // See if this group's position matches any clip's position
        const matchesClip = timeline.clips.some(clip => {
          const clipX = TIMELINE_PADDING + clip.startTime * timeline.zoom;
          const clipY = RULER_HEIGHT + TRACK_PADDING + clip.track * (TRACK_HEIGHT + TRACK_PADDING);
          // Allow small tolerance for floating point comparison
          return Math.abs(groupX - clipX) < 0.1 && Math.abs(groupY - clipY) < 0.1;
        });
        
        if (matchesClip) {
          isClipClick = true;
          break;
        }
      }
      node = node.getParent();
    }
    
    // If we didn't click on a clip, clear selection
    if (!isClipClick) {
      setSelectedClips([]);
    }
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    
    // Convert x position to time
    const x = pointerPos.x - TIMELINE_PADDING;
    const time = Math.max(0, x / timeline.zoom);
    
    setPlayhead(time);
  }, [timeline.zoom, timeline.clips, setPlayhead, setSelectedClips]);
  
  /**
   * Handle clip click for selection
   */
  const handleClipClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, clipId: string) => {
    // Prevent event from bubbling to stage
    e.cancelBubble = true;
    
    // Don't select if clicking on trim handles
    const target = e.target;
    if (target.getType() === 'Rect') {
      const attrs = target.getAttrs();
      // Trim handles are white rectangles at the edges
      if (attrs.fill === '#FFF' && attrs.opacity === 0.8) {
        return;
      }
    }
    
    const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
    
    if (isMultiSelect) {
      // Toggle clip in selection
      const isSelected = timeline.selectedClips.includes(clipId);
      if (isSelected) {
        setSelectedClips(timeline.selectedClips.filter(id => id !== clipId));
      } else {
        setSelectedClips([...timeline.selectedClips, clipId]);
      }
    } else {
      // Replace selection with single clip
      setSelectedClips([clipId]);
    }
    
    // Focus container for keyboard input
    if (timelineCanvasRef.current) {
      timelineCanvasRef.current.focus();
    }
  }, [timeline.selectedClips, setSelectedClips]);

  // Timeline constants object for passing to components
  const timelineConstants = {
    TRACK_HEIGHT,
    TRACK_PADDING,
    TIMELINE_PADDING,
    RULER_HEIGHT,
  };

  return (
    <>
      <div ref={containerRef} className={`flex flex-col h-full bg-gray-900 ${className}`}>
        {/* Timeline Header */}
        <TimelineHeader
          onSplitClip={handleSplitClip}
          clipAtPlayhead={!!clipAtPlayhead}
          onRemovePauses={() => setIsRemovePausesModalOpen(true)}
          hasClips={timeline.clips.length > 0}
          numTracks={NUM_TRACKS}
          onAddTrack={addTrack}
          onRemoveTrack={() => NUM_TRACKS > 1 && removeTrack(NUM_TRACKS - 1)}
          zoom={timeline.zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onResetPlayhead={() => setPlayhead(0)}
        />
      
      {/* Timeline Canvas */}
      <div 
        ref={timelineCanvasRef}
        className="flex-1 overflow-auto bg-gray-900 focus:outline-none scrollbar-hide"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE and Edge */
        }}
        tabIndex={0}
        onWheel={handleWheel}
        onClick={() => {
          // Focus container when clicking on timeline
          if (timelineCanvasRef.current) {
            timelineCanvasRef.current.focus();
          }
        }}
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
            <TimelineRuler
              zoom={timeline.zoom}
              duration={timeline.duration}
              padding={TIMELINE_PADDING}
              rulerHeight={RULER_HEIGHT}
            />
            
            {/* Track Backgrounds */}
            <TimelineTracks
              tracks={timeline.tracks}
              dimensions={dimensions}
              constants={timelineConstants}
            />
            
            {/* Clips */}
            {timeline.clips.map(timelineClip => {
              const mediaClip = mediaClips.find(c => c.id === timelineClip.clipId);
              if (!mediaClip) return null;

              const isSelected = timeline.selectedClips.includes(timelineClip.id);
              const clipWidth = timelineClip.duration * timeline.zoom;

              return (
                <TimelineClip
                  key={timelineClip.id}
                  timelineClip={timelineClip}
                  mediaClip={mediaClip}
                  isSelected={isSelected}
                  zoom={timeline.zoom}
                  constants={timelineConstants}
                  dragBoundFunc={getDragBoundFunc(timelineClip.id, clipWidth)}
                  onClipClick={handleClipClick}
                  onDragStart={(e) => {
                    // Only fire when the GROUP (not a handle) is dragged
                    const target = e.target;
                    if (target === e.currentTarget) {
                      startDragOperation();
                    }
                  }}
                  onDragEnd={(e) => {
                    // Only fire when the GROUP (not a handle) is dragged
                    const target = e.target;
                    if (target === e.currentTarget) {
                      handleClipDragEnd(timelineClip.id, target.x(), target.y());
                      endDragOperation();
                    }
                  }}
                  onLeftTrimDrag={(deltaX) => handleLeftTrimDrag(timelineClip.id, deltaX)}
                  onRightTrimDrag={(deltaX) => handleRightTrimDrag(timelineClip.id, deltaX)}
                  onStartDragOperation={startDragOperation}
                  onEndDragOperation={endDragOperation}
                />
              );
            })}
            
            {/* Playhead */}
            <TimelinePlayhead
              playhead={timeline.playhead}
              zoom={timeline.zoom}
              padding={TIMELINE_PADDING}
              height={dimensions.height}
              rulerHeight={RULER_HEIGHT}
            />
          </Layer>
        </Stage>
      </div>
      </div>
      
      {/* Remove Pauses Modal */}
      <RemovePausesModal
        isOpen={isRemovePausesModalOpen}
        onClose={() => setIsRemovePausesModalOpen(false)}
      />
    </>
  );
}