/**
 * Recording Preview Component
 * 
 * Displays the preview for different recording modes.
 */

import type React from 'react';
import { RecordingMode } from '@/contexts/RecordingContext';
import { PipPosition } from '@/hooks/usePipPreview';

export interface RecordingPreviewProps {
  mode: RecordingMode;
  isRecording: boolean;
  duration?: number;
  
  // Video elements
  videoRef?: React.RefObject<HTMLVideoElement>;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  screenVideoRef?: React.RefObject<HTMLVideoElement>;
  webcamVideoRef?: React.RefObject<HTMLVideoElement>;
  
  // Streams
  hasPreview: boolean;
  hasPipStreams?: boolean;
  
  // PiP specific
  pipPosition?: PipPosition;
  onPipPositionChange?: (position: PipPosition) => void;
}

export function RecordingPreview({
  mode,
  isRecording,
  duration = 0,
  videoRef,
  canvasRef,
  screenVideoRef,
  webcamVideoRef,
  hasPreview,
  hasPipStreams = false,
  pipPosition = 'top-left',
  onPipPositionChange,
}: RecordingPreviewProps) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Screen mode preview
  if (mode === 'screen') {
    console.log('[RecordingPreview] Screen mode rendering', { 
      hasPreview, 
      videoRefCurrent: !!videoRef?.current,
      videoRefSrcObject: videoRef?.current?.srcObject ? 'has stream' : 'no stream'
    });
    
    return (
      <div className="text-center">
        {!isRecording && (
          <h3 className="text-2xl font-semibold text-white mb-4">
            Preview: Screen Recording
          </h3>
        )}
        <div className="mx-auto bg-gray-800 rounded-lg overflow-hidden mb-4" style={{ width: '854px', height: '480px', maxWidth: '100%', aspectRatio: '16/9' }}>
          {hasPreview ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
              onLoadedMetadata={(e) => {
                console.log('[RecordingPreview Video] Metadata loaded, readyState:', e.currentTarget.readyState);
                e.currentTarget.play().catch(err => {
                  console.error('[RecordingPreview Video] Failed to play after metadata loaded:', err);
                });
              }}
              onPlay={() => {
                console.log('[RecordingPreview Video] Video started playing');
              }}
              onError={(e) => {
                console.error('[RecordingPreview Video] Video error:', e);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Loading preview...
            </div>
          )}
        </div>
        {/* Hidden video element for screen preview */}
        <video
          ref={screenVideoRef}
          autoPlay
          muted
          playsInline
          style={{ display: 'none' }}
        />
        {isRecording && (
          <>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              <span className="text-red-500 font-mono text-3xl">
                {formatDuration(duration)}
              </span>
            </div>
            <p className="text-gray-400">
              Click "Stop Recording" when you're done
            </p>
          </>
        )}
      </div>
    );
  }

  // Webcam mode preview
  if (mode === 'webcam') {
    return (
      <div className="text-center">
        {!isRecording && (
          <h3 className="text-2xl font-semibold text-white mb-6">
            Ready to record webcam
          </h3>
        )}
        <div className="mx-auto bg-gray-800 rounded-lg overflow-hidden mb-4" style={{ width: '854px', height: '480px', maxWidth: '100%', aspectRatio: '16/9' }}>
          {hasPreview ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">📹</span>
              <p className="ml-4 text-gray-400">Loading preview...</p>
            </div>
          )}
        </div>
        {isRecording && (
          <>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              <span className="text-red-500 font-mono text-3xl">
                {formatDuration(duration)}
              </span>
            </div>
            <p className="text-gray-400">
              Click "Stop Recording" when you're done
            </p>
          </>
        )}
      </div>
    );
  }

  // PiP mode preview
  if (mode === 'pip') {
    return (
      <div className="text-center">
        {!isRecording && (
          <>
            <h3 className="text-2xl font-semibold text-white mb-4">
              Preview: Screen + Webcam
            </h3>
            <p className="text-gray-400 mb-4">
              Choose webcam position
            </p>
            <div className="flex justify-center gap-3 mb-4">
              <button
                onClick={() => onPipPositionChange?.('top-left')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  pipPosition === 'top-left'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Top Left
              </button>
              <button
                onClick={() => onPipPositionChange?.('top-right')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  pipPosition === 'top-right'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Top Right
              </button>
              <button
                onClick={() => onPipPositionChange?.('bottom-left')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  pipPosition === 'bottom-left'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Bottom Left
              </button>
              <button
                onClick={() => onPipPositionChange?.('bottom-right')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  pipPosition === 'bottom-right'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Bottom Right
              </button>
            </div>
          </>
        )}
        <div className="relative inline-block mb-4">
          {hasPipStreams ? (
            <canvas
              ref={canvasRef}
              className="bg-gray-900 rounded-lg"
              style={{ width: '854px', height: '480px', maxWidth: '100%', aspectRatio: '16/9' }}
            />
          ) : (
            <div className="w-96 h-72 mx-auto bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-6xl animate-pulse">⏳</span>
            </div>
          )}
        </div>
        {/* Hidden video elements for canvas composition */}
        <video
          ref={screenVideoRef}
          autoPlay
          muted
          playsInline
          style={{ display: 'none' }}
        />
        <video
          ref={webcamVideoRef}
          autoPlay
          muted
          playsInline
          style={{ display: 'none' }}
        />
        {isRecording && (
          <>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              <span className="text-red-500 font-mono text-3xl">
                {formatDuration(duration)}
              </span>
            </div>
            <p className="text-gray-400">
              Click "Stop Recording" when you're done
            </p>
          </>
        )}
      </div>
    );
  }

  return null;
}

