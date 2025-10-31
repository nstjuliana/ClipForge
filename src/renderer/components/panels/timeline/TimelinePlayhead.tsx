/**
 * Timeline Playhead Component
 * 
 * Displays the playhead indicator on the timeline.
 * 
 * @component
 */

import React from 'react';
import { Line, Rect } from 'react-konva';

/**
 * Props for TimelinePlayhead component
 */
export interface TimelinePlayheadProps {
  /** Playhead position in seconds */
  playhead: number;
  /** Zoom level (pixels per second) */
  zoom: number;
  /** Left padding of timeline */
  padding: number;
  /** Total timeline height */
  height: number;
  /** Height of ruler area */
  rulerHeight: number;
}

/**
 * Timeline Playhead Component
 */
export function TimelinePlayhead({
  playhead,
  zoom,
  padding,
  height,
  rulerHeight,
}: TimelinePlayheadProps) {
  const x = padding + playhead * zoom;
  
  return (
    <>
      {/* Playhead Line */}
      <Line
        points={[x, 0, x, height]}
        stroke="#FF0000"
        strokeWidth={2}
      />
      {/* Playhead Handle */}
      <Rect
        x={x - 6}
        y={0}
        width={12}
        height={rulerHeight}
        fill="#FF0000"
        cornerRadius={2}
      />
    </>
  );
}
