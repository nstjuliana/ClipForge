/**
 * Timeline Clip Component
 * 
 * Individual clip visualization with drag, trim, and selection support.
 * 
 * @component
 */

import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { TimelineClip } from '@/types/timeline';
import type { Clip } from '@/types/clip';

/**
 * Props for TimelineClip component
 */
export interface TimelineClipProps {
  /** Timeline clip data */
  timelineClip: TimelineClip;
  /** Media clip data */
  mediaClip: Clip;
  /** Whether this clip is selected */
  isSelected: boolean;
  /** Zoom level (pixels per second) */
  zoom: number;
  /** Timeline constants */
  constants: {
    TRACK_HEIGHT: number;
    TIMELINE_PADDING: number;
    RULER_HEIGHT: number;
    TRACK_PADDING: number;
  };
  /** Drag bound function */
  dragBoundFunc: (pos: { x: number; y: number }) => { x: number; y: number };
  /** Handler for clip click */
  onClipClick: (e: Konva.KonvaEventObject<MouseEvent>, clipId: string) => void;
  /** Handler for drag start */
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  /** Handler for drag end */
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  /** Handler for left trim drag */
  onLeftTrimDrag: (deltaX: number) => void;
  /** Handler for right trim drag */
  onRightTrimDrag: (deltaX: number) => void;
  /** Handler for starting drag operation */
  onStartDragOperation: () => void;
  /** Handler for ending drag operation */
  onEndDragOperation: () => void;
}

/**
 * Timeline Clip Component
 */
export function TimelineClip({
  timelineClip,
  mediaClip,
  isSelected,
  zoom,
  constants,
  dragBoundFunc,
  onClipClick,
  onDragStart,
  onDragEnd,
  onLeftTrimDrag,
  onRightTrimDrag,
  onStartDragOperation,
  onEndDragOperation,
}: TimelineClipProps) {
  const { TRACK_HEIGHT, TIMELINE_PADDING, RULER_HEIGHT, TRACK_PADDING } = constants;

  const groupX = TIMELINE_PADDING + timelineClip.startTime * zoom;
  const groupY = RULER_HEIGHT + TRACK_PADDING + timelineClip.track * (TRACK_HEIGHT + TRACK_PADDING);
  const width = timelineClip.duration * zoom;

  return (
    <Group
      x={groupX}
      y={groupY}
      draggable
      onClick={(e: Konva.KonvaEventObject<MouseEvent>) => onClipClick(e, timelineClip.id)}
      dragBoundFunc={dragBoundFunc}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Clip Body */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={TRACK_HEIGHT}
        fill="#4A90E2"
        stroke={isSelected ? "#FFD700" : "#2E5C8A"}
        strokeWidth={isSelected ? 3 : 2}
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
          onStartDragOperation();
        }}
        onDragMove={(e) => {
          const node = e.target;
          node.y(0);  // ← enforce group-local Y
          const deltaX = node.x();
          onLeftTrimDrag(deltaX);
        }}
        onDragEnd={(e) => {
          const node = e.target;
          node.x(0);
          node.y(0);
          onEndDragOperation();
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
          onStartDragOperation();
        }}
        onDragMove={(e) => {
          const node = e.target;
          node.y(0);
          const deltaX = node.x() - (width - 8);
          onRightTrimDrag(deltaX);
        }}
        onDragEnd={(e) => {
          const node = e.target;
          node.x(width - 8);
          node.y(0);
          onEndDragOperation();
        }}
      />
    </Group>
  );
}
