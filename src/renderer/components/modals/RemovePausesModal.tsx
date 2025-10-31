/**
 * Remove Pauses Modal Component
 * 
 * Modal for removing long pauses from timeline audio using AI detection.
 * Allows user to configure minimum pause duration and processes the timeline
 * by detecting pauses, making cuts, and compressing gaps.
 * 
 * @component
 */

import React, { useState, useCallback } from 'react';
import { useTimeline } from '@/contexts/TimelineContext';
import { useMedia } from '@/contexts/MediaContext';
import { compressTrack } from '@/utils/timelineCompression';

/**
 * Props for RemovePausesModal component
 */
export interface RemovePausesModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * Processing stages
 */
type ProcessingStage = 'idle' | 'extracting' | 'analyzing' | 'cutting' | 'compressing' | 'complete' | 'error';

/**
 * Remove Pauses Modal Component
 */
export function RemovePausesModal({ isOpen, onClose }: RemovePausesModalProps) {
  const [minPauseDuration, setMinPauseDuration] = useState<number>(3);
  const [padding, setPadding] = useState<number>(0.1);
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pausesFound, setPausesFound] = useState<number>(0);

  const {
    timeline,
    updateTimelineClip,
    splitClipsAtTime,
    removeClipsInRange,
  } = useTimeline();
  
  const { clips: mediaClips } = useMedia();

  /**
   * Reset modal state
   */
  const resetState = useCallback(() => {
    setStage('idle');
    setErrorMessage('');
    setPausesFound(0);
  }, []);

  /**
   * Handle modal close
   */
  const handleClose = useCallback(() => {
    if (stage === 'extracting' || stage === 'analyzing' || stage === 'cutting' || stage === 'compressing') {
      // Don't allow closing during processing
      return;
    }
    resetState();
    onClose();
  }, [stage, resetState, onClose]);

  /**
   * Process pauses - main workflow
   */
  const handleRemovePauses = useCallback(async () => {
    try {
      resetState();
      setStage('extracting');

      // Prepare timeline clips data for IPC
      const timelineClipsData = timeline.clips.map(timelineClip => {
        const mediaClip = mediaClips.find(c => c.id === timelineClip.clipId);
        if (!mediaClip) {
          throw new Error(`Media clip not found for timeline clip ${timelineClip.id}`);
        }

        return {
          id: timelineClip.id,
          clipId: timelineClip.clipId,
          startTime: timelineClip.startTime,
          duration: timelineClip.duration,
          inPoint: timelineClip.inPoint,
          outPoint: timelineClip.outPoint,
          filePath: mediaClip.filePath,
          track: timelineClip.track,
        };
      });

      console.log('[RemovePauses] Starting pause detection...');
      console.log('[RemovePauses] Timeline clips:', timelineClipsData.length);
      console.log('[RemovePauses] Timeline duration:', timeline.duration);
      
      // Call main process to detect pauses
      setStage('analyzing');
      const result = await window.electron.detectPauses(
        timelineClipsData,
        timeline.duration,
        minPauseDuration
      );

      if (!result.success) {
        setStage('error');
        setErrorMessage(result.error || 'Failed to detect pauses');
        return;
      }

      const pauses = result.pauses || [];
      setPausesFound(pauses.length);

      if (pauses.length === 0) {
        setStage('complete');
        console.log('[RemovePauses] No pauses found');
        return;
      }

      console.log(`[RemovePauses] Found ${pauses.length} pause(s), removing...`);
      setStage('cutting');

      // Apply padding to pauses
      const paddedPauses = pauses.map(pause => ({
        start: pause.start + padding,
        end: pause.end - padding,
      })).filter(pause => pause.end > pause.start); // Filter out pauses that are too short after padding

      console.log(`[RemovePauses] After applying ${padding}s padding: ${paddedPauses.length} pause(s) to remove`);

      // Collect all unique split points (with padding applied)
      const splitPoints = new Set<number>();
      paddedPauses.forEach(pause => {
        splitPoints.add(pause.start);
        splitPoints.add(pause.end);
      });
      
      const sortedSplitPoints = Array.from(splitPoints).sort((a, b) => a - b);
      console.log(`[RemovePauses] Applying ${sortedSplitPoints.length} splits...`);
      
      // Apply all splits at once
      sortedSplitPoints.forEach(time => {
        splitClipsAtTime(time);
      });
      
      console.log('[RemovePauses] Splits complete, removing pause clips...');
      
      // Remove clips in each pause range (with padding)
      paddedPauses.forEach(pause => {
        console.log(`[RemovePauses] Removing clips in range: ${pause.start.toFixed(2)}s - ${pause.end.toFixed(2)}s`);
        removeClipsInRange(pause.start, pause.end);
      });

      console.log('[RemovePauses] Compressing timeline...');
      setStage('compressing');

      // Compress all tracks to remove gaps
      const numTracks = timeline.tracks.length;
      for (let trackIndex = 0; trackIndex < numTracks; trackIndex++) {
        compressTrack(trackIndex, timeline.clips, updateTimelineClip);
      }

      console.log('[RemovePauses] Pause removal complete');
      setStage('complete');
      
      // Auto-close after 2 seconds on success
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('[RemovePauses] Error:', error);
      setStage('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }, [
    minPauseDuration,
    padding,
    timeline.clips,
    timeline.duration,
    timeline.tracks.length,
    mediaClips,
    splitClipsAtTime,
    removeClipsInRange,
    updateTimelineClip,
    resetState,
    handleClose,
  ]);

  /**
   * Get stage display text
   */
  const getStageText = (): string => {
    switch (stage) {
      case 'idle':
        return 'Ready to process';
      case 'extracting':
        return 'Extracting audio...';
      case 'analyzing':
        return 'Analyzing with AI...';
      case 'cutting':
        return `Making cuts... (${pausesFound} pause${pausesFound !== 1 ? 's' : ''} found)`;
      case 'compressing':
        return 'Compressing timeline...';
      case 'complete':
        return `Complete! Removed ${pausesFound} pause${pausesFound !== 1 ? 's' : ''}`;
      case 'error':
        return 'Error occurred';
      default:
        return '';
    }
  };

  /**
   * Check if processing is in progress
   */
  const isProcessing = stage === 'extracting' || stage === 'analyzing' || stage === 'cutting' || stage === 'compressing';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Remove Pauses</h2>

        {/* Configuration */}
        {stage === 'idle' && (
          <>
            <div className="mb-4">
              <p className="text-gray-300 text-sm mb-4">
                AI will analyze your timeline audio and automatically remove pauses longer than the specified duration.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Pause Duration (seconds)
                </label>
                <input
                  type="number"
                  value={minPauseDuration}
                  onChange={(e) => setMinPauseDuration(Math.max(0.5, parseFloat(e.target.value) || 0))}
                  min="0.5"
                  step="0.5"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Pauses shorter than this will be kept
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Padding (seconds)
                </label>
                <input
                  type="number"
                  value={padding}
                  onChange={(e) => setPadding(Math.max(0, parseFloat(e.target.value) || 0))}
                  min="0"
                  step="0.05"
                  max="1"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Keep this amount of time before and after each pause for smoother cuts
                </p>
              </div>
            </div>

            {timeline.clips.length === 0 && (
              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded p-3 mb-4">
                <p className="text-yellow-300 text-sm">
                  No clips on timeline. Add clips before using this feature.
                </p>
              </div>
            )}
          </>
        )}

        {/* Progress indicator */}
        {(isProcessing || stage === 'complete') && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              {isProcessing && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
              {stage === 'complete' && (
                <div className="w-5 h-5 text-green-500">✓</div>
              )}
              <p className="text-white">{getStageText()}</p>
            </div>
            
            {isProcessing && (
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: stage === 'extracting' ? '25%'
                      : stage === 'analyzing' ? '50%'
                      : stage === 'cutting' ? '75%'
                      : stage === 'compressing' ? '90%'
                      : '0%'
                  }}
                ></div>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {stage === 'error' && (
          <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded p-3 mb-4">
            <p className="text-red-300 text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stage === 'complete' ? 'Close' : 'Cancel'}
          </button>
          
          {stage === 'idle' && (
            <button
              onClick={handleRemovePauses}
              disabled={timeline.clips.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🪄 Remove Pauses
            </button>
          )}

          {stage === 'error' && (
            <button
              onClick={() => setStage('idle')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

