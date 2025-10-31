/**
 * Timeline Tracks Component
 * 
 * Renders track backgrounds and labels.
 * 
 * @component
 */

import React from 'react';
import { Rect, Text } from 'react-konva';
import type { Track } from '@/types/timeline';

/**
 * Props for TimelineTracks component
 */
export interface TimelineTracksProps {
  /** Array of tracks */
  tracks: Track[];
  /** Timeline dimensions */
  dimensions: { width: number; height: number };
  /** Timeline constants */
  constants: {
    TIMELINE_PADDING: number;
    RULER_HEIGHT: number;
    TRACK_PADDING: number;
    TRACK_HEIGHT: number;
  };
}

/**
 * Timeline Tracks Component
 */
export function TimelineTracks({
  tracks,
  dimensions,
  constants,
}: TimelineTracksProps) {
  const { TIMELINE_PADDING, RULER_HEIGHT, TRACK_PADDING, TRACK_HEIGHT } = constants;

  return (
    <>
      {tracks.map((track) => (
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
    </>
  );
}
