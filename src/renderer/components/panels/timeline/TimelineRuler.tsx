/**
 * Timeline Ruler Component
 * 
 * Displays time markers along the timeline.
 * 
 * @component
 */

import React from 'react';
import { Line, Text } from 'react-konva';

/**
 * Props for TimelineRuler component
 */
export interface TimelineRulerProps {
  /** Zoom level (pixels per second) */
  zoom: number;
  /** Timeline duration in seconds */
  duration: number;
  /** Left padding of timeline */
  padding: number;
  /** Height of ruler area */
  rulerHeight: number;
}

/**
 * Timeline Ruler Component
 */
export function TimelineRuler({
  zoom,
  duration,
  padding,
  rulerHeight,
}: TimelineRulerProps) {
  const markers: React.ReactNode[] = [];
  const interval = 1; // 1 second intervals
  const maxTime = Math.max(duration, 10);
  
  for (let t = 0; t <= maxTime; t += interval) {
    const x = padding + t * zoom;
    
    markers.push(
      <React.Fragment key={`marker-${t}`}>
        <Line
          points={[x, rulerHeight - 10, x, rulerHeight]}
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
  
  return <>{markers}</>;
}
