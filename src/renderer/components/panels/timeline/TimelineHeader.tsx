/**
 * Timeline Header Component
 * 
 * Header bar with timeline controls (split, tracks, zoom, playhead reset).
 * 
 * @component
 */

import React from 'react';

/**
 * Props for TimelineHeader component
 */
export interface TimelineHeaderProps {
  /** Handler for split clip action */
  onSplitClip: () => void;
  /** Whether playhead is over a clip (enables split button) */
  clipAtPlayhead: boolean;
  /** Handler for remove pauses action */
  onRemovePauses: () => void;
  /** Whether there are clips on timeline (enables remove pauses button) */
  hasClips: boolean;
  /** Number of tracks */
  numTracks: number;
  /** Handler for adding a track */
  onAddTrack: () => void;
  /** Handler for removing the last track */
  onRemoveTrack: () => void;
  /** Current zoom level */
  zoom: number;
  /** Handler for zoom in */
  onZoomIn: () => void;
  /** Handler for zoom out */
  onZoomOut: () => void;
  /** Handler for zoom reset */
  onZoomReset: () => void;
  /** Handler for resetting playhead to start */
  onResetPlayhead: () => void;
}

/**
 * Timeline Header Component
 */
export function TimelineHeader({
  onSplitClip,
  clipAtPlayhead,
  onRemovePauses,
  hasClips,
  numTracks,
  onAddTrack,
  onRemoveTrack,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onResetPlayhead,
}: TimelineHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-white">Timeline</h3>
        <span className="text-xs text-gray-500">({numTracks} tracks)</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSplitClip}
          disabled={!clipAtPlayhead}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
          title={clipAtPlayhead ? 'Split clip at playhead' : 'Move playhead over a clip to split'}
        >
          ✂️ Split
        </button>
        <button
          onClick={onRemovePauses}
          disabled={!hasClips}
          className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
          title={hasClips ? 'Remove pauses with AI' : 'Add clips to timeline first'}
        >
          🪄 Remove Pauses
        </button>
        <div className="flex items-center gap-1 border-l border-gray-700 pl-2">
          <button
            onClick={onAddTrack}
            className="px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600"
            title="Add Track"
          >
            + Track
          </button>
          <button
            onClick={onRemoveTrack}
            disabled={numTracks <= 1}
            className="px-2 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            title="Remove Last Track"
          >
            − Track
          </button>
        </div>
        <div className="flex items-center gap-1 border-l border-gray-700 pl-2">
          <button
            onClick={onZoomOut}
            className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
            title="Zoom Out (Ctrl+Wheel)"
          >
            −
          </button>
          <button
            onClick={onZoomReset}
            className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 min-w-[60px]"
            title="Reset Zoom"
          >
            {Math.round(zoom)}px/s
          </button>
          <button
            onClick={onZoomIn}
            className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
            title="Zoom In (Ctrl+Wheel)"
          >
            +
          </button>
        </div>
        <button
          onClick={onResetPlayhead}
          className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
          title="Reset Playhead"
        >
          ⏮
        </button>
      </div>
    </div>
  );
}
