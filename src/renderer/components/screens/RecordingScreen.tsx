/**
 * Recording Screen Component
 * 
 * Full-screen interface for recording screen/webcam.
 * Shows source selection, live preview, and recording controls.
 * 
 * @component
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRecording, RecordingMode } from '@/contexts/RecordingContext';
import { useMedia } from '@/contexts/MediaContext';
import { useTimeline } from '@/contexts/TimelineContext';
import { importVideoFile } from '@/services/mediaService';

/**
 * Props for RecordingScreen component
 * 
 * @interface RecordingScreenProps
 */
export interface RecordingScreenProps {
  /** Callback when recording is finished or cancelled */
  onClose: () => void;
  
  /** Initial recording mode */
  initialMode?: RecordingMode;
}

/**
 * Recording Screen Component
 * 
 * Shows recording interface with source selection and controls.
 */
export function RecordingScreen({ onClose, initialMode = 'screen' }: RecordingScreenProps) {
  const {
    recording,
    requestPermissions,
    getAvailableSources,
    selectSource,
    startRecording,
    stopRecording,
    cancelRecording,
    toggleAudio,
  } = useRecording();
  
  const { addClip } = useMedia();
  const { addClipToTimeline } = useTimeline();
  
  const [mode, setMode] = useState<RecordingMode>(initialMode);
  const [showSourceSelection, setShowSourceSelection] = useState(true);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  
  /**
   * Load available sources on mount
   */
  useEffect(() => {
    if (mode === 'screen' || mode === 'pip') {
      loadSources();
    }
  }, [mode]);
  
  /**
   * Load available desktop sources
   */
  const loadSources = async () => {
    setIsLoadingSources(true);
    await getAvailableSources();
    setIsLoadingSources(false);
  };
  
  /**
   * Handle source selection
   */
  const handleSourceSelect = (sourceId: string) => {
    selectSource(sourceId);
  };
  
  /**
   * Start recording with selected settings
   */
  const handleStartRecording = async () => {
    try {
      // Request permissions first
      const granted = await requestPermissions(mode);
      if (!granted) {
        return;
      }
      
      // For webcam mode, no source selection needed
      if (mode === 'webcam') {
        await startRecording(mode);
        setShowSourceSelection(false);
        return;
      }
      
      // For screen/pip mode, ensure source is selected
      if (!recording.selectedSourceId && recording.sources.length > 0) {
        selectSource(recording.sources[0].id);
      }
      
      if (recording.selectedSourceId) {
        await startRecording(mode, recording.selectedSourceId);
        setShowSourceSelection(false);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please check permissions and try again.');
    }
  };
  
  /**
   * Stop recording and add to timeline
   */
  const handleStopRecording = async () => {
    try {
      const filePath = await stopRecording();
      
      if (filePath) {
        // Read file via IPC (works correctly in Electron)
        const fileName = filePath.split(/[/\\]/).pop() || 'recording.webm';
        const result: { success: boolean; buffer?: ArrayBuffer; error?: string } = 
          await window.electron.getVideoBlobUrl(filePath);
        
        if (!result.success || !result.buffer) {
          throw new Error(result.error || 'Failed to read recording file');
        }
        
        // Create File object from buffer
        const blob = new Blob([result.buffer], { type: 'video/webm' });
        const file = new File([blob], fileName, { type: 'video/webm' });
        
        // Import the recording
        const importResult = await importVideoFile(file);
        
        if (importResult.success && importResult.clip) {
          // Add to media library
          addClip(importResult.clip);
          
          // Add to timeline
          addClipToTimeline(importResult.clip);
          
          alert('Recording added to timeline!');
        } else {
          throw new Error(importResult.error || 'Failed to import recording');
        }
      }
      
      // Close recording screen
      onClose();
    } catch (error) {
      console.error('Failed to save recording:', error);
      alert(`Failed to save recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onClose();
    }
  };
  
  /**
   * Cancel recording
   */
  const handleCancelRecording = () => {
    cancelRecording();
    onClose();
  };
  
  /**
   * Format duration for display
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  /**
   * Change recording mode
   */
  const handleModeChange = (newMode: RecordingMode) => {
    setMode(newMode);
    setShowSourceSelection(true);
  };
  
  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Recording Studio</h2>
          {recording.isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              <span className="text-red-500 font-mono text-lg">
                {formatDuration(recording.duration)}
              </span>
            </div>
          )}
        </div>
        
        <button
          onClick={handleCancelRecording}
          className="px-4 py-2 text-white hover:bg-gray-700 rounded transition-colors"
        >
          ✕ Close
        </button>
      </div>
      
      {/* Mode Selection */}
      {!recording.isRecording && (
        <div className="flex items-center justify-center gap-4 px-6 py-4 bg-gray-800/50 border-b border-gray-700">
          <button
            onClick={() => handleModeChange('screen')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              mode === 'screen'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🖥️ Screen
          </button>
          <button
            onClick={() => handleModeChange('webcam')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              mode === 'webcam'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📹 Webcam
          </button>
          <button
            onClick={() => handleModeChange('pip')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              mode === 'pip'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📺 Screen + Webcam
          </button>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        {showSourceSelection && !recording.isRecording ? (
          <div className="w-full max-w-5xl">
            {/* Source Selection for Screen/PiP */}
            {(mode === 'screen' || mode === 'pip') && (
              <div>
                <h3 className="text-2xl font-semibold text-white mb-6 text-center">
                  Select a screen or window to record
                </h3>
                
                {isLoadingSources ? (
                  <div className="text-center text-gray-400">
                    Loading available sources...
                  </div>
                ) : recording.sources.length === 0 ? (
                  <div className="text-center text-gray-400">
                    No sources available. Please check permissions.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-6">
                    {recording.sources.map(source => (
                      <button
                        key={source.id}
                        onClick={() => handleSourceSelect(source.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          recording.selectedSourceId === source.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        }`}
                      >
                        {source.thumbnail && (
                          <img
                            src={source.thumbnail}
                            alt={source.name}
                            className="w-full h-32 object-cover rounded mb-3"
                          />
                        )}
                        <p className="text-white text-sm font-medium text-center truncate">
                          {source.name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Webcam Preview */}
            {mode === 'webcam' && (
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-white mb-6">
                  Ready to record webcam
                </h3>
                <div className="w-96 h-72 mx-auto bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-6xl">📹</span>
                </div>
              </div>
            )}
          </div>
        ) : recording.isRecording ? (
          <div className="text-center">
            <div className="text-6xl mb-6">🔴</div>
            <h3 className="text-3xl font-bold text-white mb-4">Recording in progress...</h3>
            <p className="text-gray-400 mb-8">
              Click "Stop Recording" when you're done
            </p>
            <div className="text-6xl font-mono text-red-500">
              {formatDuration(recording.duration)}
            </div>
          </div>
        ) : null}
      </div>
      
      {/* Controls */}
      <div className="px-6 py-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            disabled={recording.isRecording}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              recording.audioEnabled
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {recording.audioEnabled ? '🎤 Audio On' : '🔇 Audio Off'}
          </button>
          
          {/* Recording Control */}
          <div className="flex items-center gap-4">
            {recording.isRecording ? (
              <button
                onClick={handleStopRecording}
                className="px-8 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 transition-colors"
              >
                ⏹ Stop Recording
              </button>
            ) : (
              <button
                onClick={handleStartRecording}
                disabled={
                  (mode === 'screen' || mode === 'pip') && !recording.selectedSourceId
                }
                className="px-8 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                ⏺ Start Recording
              </button>
            )}
            
            <button
              onClick={handleCancelRecording}
              className="px-6 py-4 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
          
          {/* Status Message */}
          <div className="w-48 text-right">
            {recording.statusMessage && (
              <p className="text-sm text-gray-400">{recording.statusMessage}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

