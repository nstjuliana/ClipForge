/**
 * Timeline Dimensions Hook
 * 
 * Manages timeline container dimensions and responsive sizing.
 * 
 * @module hooks/useTimelineDimensions
 */

import { useRef, useState, useEffect } from 'react';
import { TRACK_HEIGHT, TRACK_PADDING, RULER_HEIGHT } from '@/components/panels/timeline/timelineConstants';

/**
 * Hook to manage timeline dimensions
 * 
 * @param numTracks - Number of tracks in the timeline
 * @returns Object containing dimensions state and container ref
 */
export function useTimelineDimensions(numTracks: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 200 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        // Calculate height to fit all tracks
        const totalTrackHeight = RULER_HEIGHT + (numTracks * (TRACK_HEIGHT + TRACK_PADDING)) + TRACK_PADDING;
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
  }, [numTracks]);

  return { dimensions, containerRef };
}
