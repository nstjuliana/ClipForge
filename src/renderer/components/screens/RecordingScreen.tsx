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
import { useWebcamPreview } from '@/hooks/useWebcamPreview';
import { useScreenPreview } from '@/hooks/useScreenPreview';
import { usePipPreview, PipPosition } from '@/hooks/usePipPreview';
import { useRecordingHandlers } from '@/hooks/useRecordingHandlers';
import { ModeSelector } from './recording/ModeSelector';
import { SourceSelector } from './recording/SourceSelector';
import { RecordingPreview } from './recording/RecordingPreview';
import { RecordingControls } from './recording/RecordingControls';

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
    enumerateDevices,
    selectVideoDevice,
    selectAudioDevice,
    startRecording,
    stopRecording,
    cancelRecording,
    toggleAudio,
  } = useRecording();
  
  const { addClip } = useMedia();
  const { addClipToTimeline } = useTimeline();
  
  // Local state
  const [mode, setMode] = useState<RecordingMode>(initialMode);
  const [showSourceSelection, setShowSourceSelection] = useState(true);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [pipPosition, setPipPosition] = useState<PipPosition>('top-left');
  
  // Video refs
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const screenPreviewVideoRef = useRef<HTMLVideoElement>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement>(null);
  const pipScreenVideoRef = useRef<HTMLVideoElement>(null);
  const pipWebcamVideoRef = useRef<HTMLVideoElement>(null);
  
  // Preview hooks
  const webcamPreview = useWebcamPreview({
    selectedVideoDeviceId: recording.selectedVideoDeviceId,
    isRecording: recording.isRecording,
    videoRef: videoPreviewRef,
  });
  
  const screenPreview = useScreenPreview({
    selectedSourceId: recording.selectedSourceId,
    isRecording: recording.isRecording,
    videoRef: videoPreviewRef,
  });
  
  const pipPreview = usePipPreview({
    selectedSourceId: recording.selectedSourceId,
    selectedVideoDeviceId: recording.selectedVideoDeviceId,
    isRecording: recording.isRecording,
    pipPosition,
    canvasRef: pipCanvasRef,
    screenVideoRef: pipScreenVideoRef,
    webcamVideoRef: pipWebcamVideoRef,
  });
  
  // Recording handlers
  const {
    handleStartRecording,
    handleStopRecording,
    handleCancelRecording,
  } = useRecordingHandlers({
    mode,
    selectedSourceId: recording.selectedSourceId,
    requestPermissions,
    startRecording,
    stopRecording,
    cancelRecording,
    addClip,
    addClipToTimeline,
    selectSource,
    startWebcamPreview: webcamPreview.startPreview,
    startScreenPreview: screenPreview.startPreview,
    startPipPreview: pipPreview.startPreview,
    onClose,
  });
  
  /**
   * Load available desktop sources
   */
  const loadSources = useCallback(async () => {
    setIsLoadingSources(true);
    await getAvailableSources();
    setIsLoadingSources(false);
  }, [getAvailableSources]);
  
  /**
   * Handle source selection
   */
  const handleSourceSelect = useCallback((sourceId: string) => {
    console.log('[Source Selection] Selecting source:', sourceId);
    selectSource(sourceId);
  }, [selectSource]);
  
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
  const handleModeChange = useCallback((newMode: RecordingMode) => {
    setMode(newMode);
    setShowSourceSelection(true);
  }, []);
  
  /**
   * Handle starting recording - hide source selection after starting
   */
  const handleStart = useCallback(async () => {
    await handleStartRecording();
    setShowSourceSelection(false);
  }, [handleStartRecording]);
  
  /**
   * Load sources and devices on mode change
   */
  useEffect(() => {
    if (mode === 'screen' || mode === 'pip') {
      loadSources();
    }
    
    if (mode === 'webcam' || mode === 'pip') {
      enumerateDevices();
    }
  }, [mode, loadSources, enumerateDevices]);
  
  /**
   * Auto-start webcam preview when conditions are met
   */
  useEffect(() => {
    if (recording.isRecording) return;
    if (mode !== 'webcam') return;
    if (recording.videoDevices.length === 0) return;
    
    const timer = setTimeout(() => {
      webcamPreview.startPreview();
    }, 100);
    return () => clearTimeout(timer);
  }, [
    mode,
    recording.isRecording,
    recording.videoDevices.length,
    webcamPreview.startPreview,
  ]);
  
  /**
   * Auto-start screen preview when source is selected
   */
  useEffect(() => {
    if (recording.isRecording) return;
    if (mode !== 'screen') return;
    if (!recording.selectedSourceId) return;
    
    const timer = setTimeout(() => {
      screenPreview.startPreview();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    mode,
    recording.isRecording,
    recording.selectedSourceId,
    screenPreview.startPreview,
  ]);
  
  /**
   * Auto-start PiP preview when source is selected
   */
  useEffect(() => {
    if (recording.isRecording) return;
    if (mode !== 'pip') return;
    if (!recording.selectedSourceId) return;
    
    const timer = setTimeout(() => {
      pipPreview.startPreview();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    mode,
    recording.isRecording,
    recording.selectedSourceId,
    pipPreview.startPreview,
  ]);
  
  /**
   * Ensure preview continues during recording
   */
  useEffect(() => {
    if (!recording.isRecording) return;
    
    // Ensure video element has correct stream during recording
    if (mode === 'webcam' && webcamPreview.stream && videoPreviewRef.current) {
      if (videoPreviewRef.current.srcObject !== webcamPreview.stream) {
        videoPreviewRef.current.srcObject = webcamPreview.stream;
      }
    }
    
    if (mode === 'screen' && screenPreview.stream && videoPreviewRef.current) {
      if (videoPreviewRef.current.srcObject !== screenPreview.stream) {
        videoPreviewRef.current.srcObject = screenPreview.stream;
        // Try to play if paused
        if (videoPreviewRef.current.paused && videoPreviewRef.current.readyState >= 2) {
          videoPreviewRef.current.play().catch(err => {
            if (!err.message.includes('interrupted') && !err.message.includes('removed')) {
              console.error('[Recording] Failed to play preview:', err);
            }
          });
        }
      }
    }
  }, [mode, recording.isRecording, webcamPreview.stream, screenPreview.stream]);
  
  // Determine what to show
  const shouldShowSourceSelection = showSourceSelection && !recording.isRecording;
  const shouldShowPreview = 
    mode === 'webcam' || // Always show preview in webcam mode
    (mode === 'screen' && recording.selectedSourceId) ||
    (mode === 'pip' && recording.selectedSourceId);
  
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
        <ModeSelector
          mode={mode}
          onModeChange={handleModeChange}
          disabled={recording.isRecording}
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex items-start justify-center p-8 overflow-auto pt-12">
          <div className="w-full max-w-6xl">
          {/* Source Selection */}
          {shouldShowSourceSelection && (mode === 'screen' || mode === 'pip') && !recording.selectedSourceId && (
            <SourceSelector
              sources={recording.sources}
              selectedSourceId={recording.selectedSourceId}
              isLoading={isLoadingSources}
              onSourceSelect={handleSourceSelect}
              title={mode === 'pip' ? 'First, select a screen or window to record' : 'Select a screen or window to record'}
            />
          )}
          
          {/* Preview */}
          {shouldShowPreview && (
            <RecordingPreview
              mode={mode}
              isRecording={recording.isRecording}
              duration={recording.duration}
              videoRef={videoPreviewRef}
              canvasRef={pipCanvasRef}
              screenVideoRef={mode === 'screen' ? screenPreviewVideoRef : pipScreenVideoRef}
              webcamVideoRef={pipWebcamVideoRef}
              hasPreview={
                mode === 'webcam' ? !!webcamPreview.stream :
                mode === 'screen' ? !!screenPreview.stream :
                false
              }
              hasPipStreams={!!pipPreview.screenStream && !!pipPreview.webcamStream}
              pipPosition={pipPosition}
              onPipPositionChange={setPipPosition}
            />
            )}
          </div>
      </div>
      
      {/* Controls */}
      <RecordingControls
        mode={mode}
        isRecording={recording.isRecording}
        audioEnabled={recording.audioEnabled}
        statusMessage={recording.statusMessage}
        videoDevices={recording.videoDevices}
        audioDevices={recording.audioDevices}
        selectedVideoDeviceId={recording.selectedVideoDeviceId}
        selectedAudioDeviceId={recording.selectedAudioDeviceId}
        selectedSourceId={recording.selectedSourceId}
        onToggleAudio={toggleAudio}
        onSelectVideoDevice={selectVideoDevice}
        onSelectAudioDevice={selectAudioDevice}
        onStartRecording={handleStart}
        onStopRecording={handleStopRecording}
        onCancel={handleCancelRecording}
      />
    </div>
  );
}
