/**
 * Timeline Zoom Hook
 * 
 * Manages zoom level and zoom-related interactions.
 * 
 * @module hooks/useTimelineZoom
 */

import { useCallback } from 'react';

/**
 * Hook to manage timeline zoom
 * 
 * @param zoom - Current zoom level
 * @param scrollPosition - Current scroll position
 * @param setZoom - Function to set zoom level
 * @param setScrollPosition - Function to set scroll position
 * @returns Zoom control handlers
 */
export function useTimelineZoom(
  zoom: number,
  scrollPosition: number,
  setZoom: (zoom: number) => void,
  setScrollPosition: (position: number) => void
) {
  /**
   * Handle zoom in
   */
  const handleZoomIn = useCallback(() => {
    setZoom(zoom * 1.5);
  }, [zoom, setZoom]);
  
  /**
   * Handle zoom out
   */
  const handleZoomOut = useCallback(() => {
    setZoom(zoom / 1.5);
  }, [zoom, setZoom]);
  
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
      const newScrollPosition = scrollPosition + (e.deltaY / 100);
      setScrollPosition(newScrollPosition);
    }
  }, [scrollPosition, setScrollPosition, handleZoomIn, handleZoomOut]);

  return {
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleWheel,
  };
}
