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
  
  const [mode, setMode] = useState<RecordingMode>(initialMode);
  const [showSourceSelection, setShowSourceSelection] = useState(true);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const webcamPreviewStreamRef = useRef<MediaStream | null>(null);
  const screenPreviewStreamRef = useRef<MediaStream | null>(null);
  const screenPreviewVideoRef = useRef<HTMLVideoElement>(null);
  
  // PiP mode state
  const [pipScreenStream, setPipScreenStream] = useState<MediaStream | null>(null);
  const [pipWebcamStream, setPipWebcamStream] = useState<MediaStream | null>(null);
  const [pipPosition, setPipPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-left');
  const [isStartingPipPreview, setIsStartingPipPreview] = useState(false);
  const pipCanvasRef = useRef<HTMLCanvasElement>(null);
  const pipScreenVideoRef = useRef<HTMLVideoElement>(null);
  const pipWebcamVideoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pipPositionRef = useRef(pipPosition);
  const pipPreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPreviewSourceIdRef = useRef<string | null>(null);
  const previewStartedForSourceRef = useRef<string | null>(null);
  
  /**
   * Convert preset position to pixel coordinates
   */
  const getPipPositionPixels = useCallback((position: typeof pipPosition, canvasWidth: number, canvasHeight: number) => {
    const pipWidth = 320;
    const pipHeight = 240;
    const margin = 20;
    
    switch (position) {
      case 'top-left':
        return { x: margin, y: margin };
      case 'top-right':
        return { x: canvasWidth - pipWidth - margin, y: margin };
      case 'bottom-left':
        return { x: margin, y: canvasHeight - pipHeight - margin };
      case 'bottom-right':
        return { x: canvasWidth - pipWidth - margin, y: canvasHeight - pipHeight - margin };
      default:
        return { x: margin, y: margin };
    }
  }, []);
  
  /**
   * Start webcam preview
   */
  const startWebcamPreview = useCallback(async () => {
    try {
      // Don't stop if already recording (keep preview alive during recording)
      if (webcamPreviewStreamRef.current && !recording.isRecording) {
        webcamPreviewStreamRef.current.getTracks().forEach(track => track.stop());
        webcamPreviewStreamRef.current = null;
      }
      
      // If already have a preview stream and recording, keep using it
      if (webcamPreviewStreamRef.current && recording.isRecording) {
        return;
      }
      
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };
      
      // Use selected video device if available
      if (recording.selectedVideoDeviceId) {
        videoConstraints.deviceId = { exact: recording.selectedVideoDeviceId };
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false, // Don't capture audio in preview
      });
      
      webcamPreviewStreamRef.current = stream;
      setPreviewStream(stream);
      
      // Set stream to video element
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to start webcam preview:', error);
    }
  }, [recording.selectedVideoDeviceId, recording.isRecording]);
  
  /**
   * Stop webcam preview
   */
  const stopWebcamPreview = useCallback(() => {
    if (webcamPreviewStreamRef.current) {
      webcamPreviewStreamRef.current.getTracks().forEach(track => track.stop());
      webcamPreviewStreamRef.current = null;
    }
    setPreviewStream(null);
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  }, []);

  /**
   * Start screen preview
   */
  const startScreenPreview = useCallback(async () => {
    try {
      // Don't stop if already recording (keep preview alive during recording)
      if (screenPreviewStreamRef.current && !recording.isRecording) {
        screenPreviewStreamRef.current.getTracks().forEach(track => track.stop());
        screenPreviewStreamRef.current = null;
      }
      
      // If already have a preview stream and recording, keep using it
      if (screenPreviewStreamRef.current && recording.isRecording) {
        return;
      }

      if (!recording.selectedSourceId) {
        console.log('[Screen Preview] No source selected');
        return;
      }

      console.log('[Screen Preview] Starting preview for source:', recording.selectedSourceId);
      
      // Get screen stream
      const screenConstraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: recording.selectedSourceId,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080,
          },
        },
      } as any;

      let screenStream: MediaStream;
      try {
        screenStream = await (navigator.mediaDevices.getUserMedia as any)(screenConstraints);
        console.log('[Screen Preview] Screen stream obtained');
      } catch (error) {
        console.error('[Screen Preview] Screen capture failed, trying getDisplayMedia:', error);
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } } as any,
          audio: false as any,
        });
        console.log('[Screen Preview] Screen stream obtained via getDisplayMedia');
      }

      screenPreviewStreamRef.current = screenStream;
      
      // Check stream tracks
      const videoTracks = screenStream.getVideoTracks();
      console.log('[Screen Preview] Stream obtained, video tracks:', videoTracks.length);
      videoTracks.forEach((track, i) => {
        console.log(`[Screen Preview] Track ${i}:`, track.label, 'readyState:', track.readyState, 'enabled:', track.enabled);
      });
      
      // Set preview stream - this will trigger useEffect to attach to video element
      setPreviewStream(screenStream);
    } catch (error) {
      console.error('[Screen Preview] Failed to start screen preview:', error);
    }
  }, [recording.selectedSourceId, recording.isRecording]);

  /**
   * Stop screen preview
   */
  const stopScreenPreview = useCallback(() => {
    if (screenPreviewStreamRef.current) {
      screenPreviewStreamRef.current.getTracks().forEach(track => track.stop());
      screenPreviewStreamRef.current = null;
    }
    setPreviewStream(null);
    if (screenPreviewVideoRef.current) {
      screenPreviewVideoRef.current.srcObject = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  }, []);
  
  /**
   * Stop PiP preview
   */
  const stopPipPreview = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (pipScreenStream) {
      pipScreenStream.getTracks().forEach(track => track.stop());
      setPipScreenStream(null);
    }
    if (pipWebcamStream) {
      pipWebcamStream.getTracks().forEach(track => track.stop());
      setPipWebcamStream(null);
    }
    
    if (pipScreenVideoRef.current) {
      pipScreenVideoRef.current.srcObject = null;
    }
    if (pipWebcamVideoRef.current) {
      pipWebcamVideoRef.current.srcObject = null;
    }
    
    // Reset preview tracking
    lastPreviewSourceIdRef.current = null;
    previewStartedForSourceRef.current = null;
  }, [pipScreenStream, pipWebcamStream]);
  
  /**
   * Start PiP preview
   */
  const startPipPreview = useCallback(async () => {
    // Prevent multiple simultaneous starts
    if (isStartingPipPreview) {
      console.log('[PiP Preview] Already starting, ignoring duplicate call');
      return;
    }
    
    // Prevent starting preview for same source again
    if (previewStartedForSourceRef.current === recording.selectedSourceId && pipScreenStream && pipWebcamStream) {
      console.log('[PiP Preview] Preview already started for this source, ignoring');
      return;
    }
    
    try {
      console.log('[PiP Preview] Starting preview...');
      setIsStartingPipPreview(true);
      
      // Stop existing previews
      stopPipPreview();
      
      if (!recording.selectedSourceId) {
        console.log('[PiP Preview] No source selected');
        setIsStartingPipPreview(false);
        return;
      }
      
      // Note: previewStartedForSourceRef was already set in useEffect to prevent duplicates
      console.log('[PiP Preview] Getting screen stream...');
      // Get screen stream
      const screenConstraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: recording.selectedSourceId,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080,
          },
        },
      } as any;
      
      let screenStream: MediaStream;
      try {
        screenStream = await (navigator.mediaDevices.getUserMedia as any)(screenConstraints);
        console.log('[PiP Preview] Screen stream obtained');
      } catch (error) {
        console.error('[PiP Preview] Screen capture failed, trying getDisplayMedia:', error);
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } } as any,
          audio: false as any,
        });
        console.log('[PiP Preview] Screen stream obtained via getDisplayMedia');
      }
      
      setPipScreenStream(screenStream);
      if (pipScreenVideoRef.current) {
        pipScreenVideoRef.current.srcObject = screenStream;
      }
      
      console.log('[PiP Preview] Getting webcam stream...');
      // Get webcam stream
      const webcamVideoConstraints: MediaTrackConstraints = {
        width: { ideal: 320 },
        height: { ideal: 240 },
      };
      
      if (recording.selectedVideoDeviceId) {
        webcamVideoConstraints.deviceId = { exact: recording.selectedVideoDeviceId };
      }
      
      const webcamStream = await navigator.mediaDevices.getUserMedia({
        video: webcamVideoConstraints,
        audio: false, // Don't capture audio in preview
      });
      
      console.log('[PiP Preview] Webcam stream obtained');
      setPipWebcamStream(webcamStream);
      if (pipWebcamVideoRef.current) {
        pipWebcamVideoRef.current.srcObject = webcamStream;
      }
      
      // Streams are now set - canvas drawing will start via useEffect when canvas is rendered
      console.log('[PiP Preview] Both streams obtained, waiting for canvas to be rendered...');
      
      // Mark as no longer starting
      setIsStartingPipPreview(false);
    } catch (error) {
      console.error('[PiP Preview] Failed to start PiP preview:', error);
      setIsStartingPipPreview(false);
      // Show error to user
      alert(`Failed to start preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [recording.selectedSourceId, recording.selectedVideoDeviceId, stopPipPreview, getPipPositionPixels, isStartingPipPreview]);
  
  /**
   * Update canvas drawing when position changes (position is read from state in draw function)
   */
  useEffect(() => {
    pipPositionRef.current = pipPosition;
  }, [pipPosition]);
  
  /**
   * Ensure webcam preview continues during recording
   */
  useEffect(() => {
    if (mode === 'webcam' && recording.isRecording && webcamPreviewStreamRef.current && videoPreviewRef.current) {
      // Re-attach stream if needed
      if (videoPreviewRef.current.srcObject !== webcamPreviewStreamRef.current) {
        videoPreviewRef.current.srcObject = webcamPreviewStreamRef.current;
      }
    }
  }, [mode, recording.isRecording]);

  /**
   * Auto-start screen preview when source is selected in screen mode
   */
  useEffect(() => {
    if (mode === 'screen' && recording.selectedSourceId && !recording.isRecording) {
      console.log('[Screen Effect] Auto-starting preview for selected source:', recording.selectedSourceId);
      const timer = setTimeout(() => {
        startScreenPreview();
      }, 300); // Give UI time to render
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [mode, recording.selectedSourceId, recording.isRecording, startScreenPreview]);

  /**
   * Ensure screen preview stream is attached to video element when available
   */
  useEffect(() => {
    if (mode === 'screen' && previewStream) {
      // Wait for video element to be rendered
      const attachStream = () => {
        if (videoPreviewRef.current) {
          console.log('[Screen Effect] Attaching stream to video element');
          if (videoPreviewRef.current.srcObject !== previewStream) {
            videoPreviewRef.current.srcObject = previewStream;
            // Don't manually call play() - let autoPlay handle it
            // The onLoadedMetadata handler will trigger playback when ready
          } else {
            console.log('[Screen Effect] Stream already attached');
          }
        } else {
          console.log('[Screen Effect] Video element not ready yet, retrying...');
          setTimeout(attachStream, 100);
        }
      };
      
      attachStream();
    }
  }, [mode, previewStream]);

  /**
   * Ensure preview stream state is maintained when view switches
   */
  useEffect(() => {
    if (mode === 'screen' && !showSourceSelection && screenPreviewStreamRef.current && !previewStream) {
      // When switching to recording view, ensure previewStream state is set
      console.log('[Screen Effect] Restoring previewStream state after view switch');
      setPreviewStream(screenPreviewStreamRef.current);
    }
  }, [mode, showSourceSelection, previewStream]);

  /**
   * Ensure screen preview continues during recording
   */
  useEffect(() => {
    if (mode === 'screen' && recording.isRecording && screenPreviewStreamRef.current) {
      // Use a retry mechanism to ensure video element is ready
      const ensurePreview = () => {
        if (videoPreviewRef.current) {
          // Re-attach stream if needed
          if (videoPreviewRef.current.srcObject !== screenPreviewStreamRef.current) {
            console.log('[Screen Effect] Re-attaching preview stream during recording');
            videoPreviewRef.current.srcObject = screenPreviewStreamRef.current;
            // Wait for video to be ready
            const tryPlay = () => {
              if (videoPreviewRef.current && videoPreviewRef.current.readyState >= 2) {
                videoPreviewRef.current.play().catch(err => {
                  // Ignore interruptions
                  if (!err.message.includes('interrupted') && !err.message.includes('removed')) {
                    console.error('[Screen Effect] Failed to play during recording:', err);
                  }
                });
              } else if (videoPreviewRef.current) {
                setTimeout(tryPlay, 100);
              }
            };
            setTimeout(tryPlay, 200);
          } else if (videoPreviewRef.current.paused && videoPreviewRef.current.readyState >= 2) {
            // Only try to resume if video is paused and ready (autoPlay might have been blocked)
            console.log('[Screen Effect] Video is paused and ready, attempting to resume');
            videoPreviewRef.current.play().catch(err => {
              // Ignore interruptions - these are harmless and happen during normal operation
              if (!err.message.includes('interrupted') && !err.message.includes('removed')) {
                console.error('[Screen Effect] Failed to resume playback:', err);
              }
            });
          }
        } else {
          // Video element not ready yet, retry
          setTimeout(ensurePreview, 100);
        }
      };
      
      ensurePreview();
    }
  }, [mode, recording.isRecording]);
  
  /**
   * Auto-start PiP preview when source is selected in PiP mode
   */
  useEffect(() => {
    // Early return if conditions not met
    if (mode !== 'pip' || !recording.selectedSourceId || recording.isRecording || isStartingPipPreview) {
      return;
    }
    
    // Check if we've already started for this source
    const sourceChanged = lastPreviewSourceIdRef.current !== recording.selectedSourceId;
    const notStartedYet = previewStartedForSourceRef.current !== recording.selectedSourceId;
    
    if (!sourceChanged || !notStartedYet) {
      // Already handled this source
      return;
    }
    
    // Clear any existing timeout
    if (pipPreviewTimeoutRef.current) {
      clearTimeout(pipPreviewTimeoutRef.current);
      pipPreviewTimeoutRef.current = null;
    }
    
    console.log('[PiP Effect] Auto-starting preview for selected source:', recording.selectedSourceId);
    lastPreviewSourceIdRef.current = recording.selectedSourceId;
    
    // Mark immediately to prevent duplicate calls
    previewStartedForSourceRef.current = recording.selectedSourceId;
    
    pipPreviewTimeoutRef.current = setTimeout(() => {
      startPipPreview();
    }, 300); // Give UI time to render
    
    return () => {
      if (pipPreviewTimeoutRef.current) {
        clearTimeout(pipPreviewTimeoutRef.current);
        pipPreviewTimeoutRef.current = null;
      }
    };
  }, [mode, recording.selectedSourceId, recording.isRecording, isStartingPipPreview, startPipPreview]);
  
  /**
   * Handle PiP position selection
   */
  const handlePipPositionChange = useCallback((position: typeof pipPosition) => {
    setPipPosition(position);
  }, []);
  
  /**
   * Load available sources on mount
   */
  useEffect(() => {
    if (mode === 'screen' || mode === 'pip') {
      loadSources();
      // Stop webcam preview when switching away from webcam
      if (mode !== 'webcam') {
        stopWebcamPreview();
      }
      // Stop screen preview when switching away from screen
      if (mode !== 'screen') {
        stopScreenPreview();
      }
      // Stop PiP preview when switching away from PiP
      if (mode !== 'pip') {
        stopPipPreview();
      }
    } else {
      // Stop screen and PiP preview when not in screen/PiP mode
      stopScreenPreview();
      stopPipPreview();
    }
    
    // Load media devices for webcam mode
    if (mode === 'webcam' || mode === 'pip') {
      enumerateDevices();
    }
    
    // Start webcam preview when in webcam mode
    if (mode === 'webcam' && recording.videoDevices.length > 0) {
      startWebcamPreview();
    }
  }, [mode, enumerateDevices, stopWebcamPreview, stopScreenPreview, stopPipPreview, startWebcamPreview]);
  
  /**
   * Update preview when video device changes or devices are enumerated
   */
  useEffect(() => {
    if (mode === 'webcam' && recording.videoDevices.length > 0) {
      // Small delay to ensure devices are fully enumerated
      const timer = setTimeout(() => {
        startWebcamPreview();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mode, recording.selectedVideoDeviceId, recording.videoDevices.length, startWebcamPreview]);
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopWebcamPreview();
      stopScreenPreview();
      stopPipPreview();
    };
  }, [stopWebcamPreview, stopScreenPreview, stopPipPreview]);
  
  /**
   * Start canvas drawing when streams are ready and canvas is available
   */
  useEffect(() => {
    if (mode !== 'pip' || !pipScreenStream || !pipWebcamStream) {
      // Stop drawing if streams are not available
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    
    // Canvas should be rendered now since streams are set
    const startCanvasDrawing = () => {
      const canvas = pipCanvasRef.current;
      if (!canvas) {
        // Canvas not ready yet, retry after a short delay
        setTimeout(startCanvasDrawing, 100);
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('[PiP Preview] Failed to get canvas context');
        return;
      }
      
      console.log('[PiP Preview] Canvas ready, starting drawing...');
      // Set canvas size
      canvas.width = 1280;
      canvas.height = 720;
      
      const draw = () => {
        if (!canvas || !ctx) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw screen if ready
        if (pipScreenVideoRef.current && pipScreenVideoRef.current.readyState >= 2) {
          ctx.drawImage(pipScreenVideoRef.current, 0, 0, canvas.width, canvas.height);
        }
        
        // Draw webcam overlay if ready
        if (pipWebcamVideoRef.current && pipWebcamVideoRef.current.readyState >= 2) {
          const pipWidth = 320;
          const pipHeight = 240;
          const pos = getPipPositionPixels(pipPositionRef.current, canvas.width, canvas.height);
          const x = Math.max(0, Math.min(pos.x, canvas.width - pipWidth));
          const y = Math.max(0, Math.min(pos.y, canvas.height - pipHeight));
          
          // Draw border around webcam
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 3;
          ctx.strokeRect(x - 2, y - 2, pipWidth + 4, pipHeight + 4);
          
          // Draw webcam
          ctx.drawImage(pipWebcamVideoRef.current, x, y, pipWidth, pipHeight);
        }
        
        animationFrameRef.current = requestAnimationFrame(draw);
      };
      
      // Wait for videos to be ready, then start drawing
      const checkReady = () => {
        const screenReady = pipScreenVideoRef.current?.readyState !== undefined && pipScreenVideoRef.current.readyState >= 2;
        const webcamReady = pipWebcamVideoRef.current?.readyState !== undefined && pipWebcamVideoRef.current.readyState >= 2;
        
        if (screenReady && webcamReady) {
          console.log('[PiP Preview] Videos ready, starting draw loop');
          draw();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      
      // Give videos a moment to initialize
      setTimeout(checkReady, 100);
    };
    
    // Start canvas drawing after ensuring DOM is updated
    requestAnimationFrame(() => {
      setTimeout(startCanvasDrawing, 100);
    });
    
    // Cleanup on unmount or when streams change
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [mode, pipScreenStream, pipWebcamStream, getPipPositionPixels]);
  
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
  const handleSourceSelect = async (sourceId: string) => {
    console.log('[Source Selection] Selecting source:', sourceId);
    selectSource(sourceId);
    // Don't manually start preview here - let the useEffect handle it
    // This prevents duplicate calls
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
        // Ensure preview is running before starting recording
        if (!previewStream) {
          await startWebcamPreview();
        }
        // Start recording (will create its own stream, preview continues separately)
        await startRecording(mode);
        setShowSourceSelection(false);
        // Ensure video element still has the preview stream
        if (videoPreviewRef.current && webcamPreviewStreamRef.current) {
          videoPreviewRef.current.srcObject = webcamPreviewStreamRef.current;
        }
        return;
      }
      
      // For screen/pip mode, ensure source is selected
      if (!recording.selectedSourceId && recording.sources.length > 0) {
        selectSource(recording.sources[0].id);
      }
      
      if (recording.selectedSourceId) {
        // For screen mode, ensure preview is running before starting recording
        if (mode === 'screen' && !previewStream) {
          await startScreenPreview();
        }
        // Start recording (will create its own stream, preview continues separately)
        await startRecording(mode, recording.selectedSourceId);
        setShowSourceSelection(false);
        // Ensure video element still has the preview stream
        if (mode === 'screen') {
          // Ensure previewStream state is set from ref
          if (screenPreviewStreamRef.current && !previewStream) {
            console.log('[Screen Recording] Setting previewStream state from ref');
            setPreviewStream(screenPreviewStreamRef.current);
          }
          // Attach stream to video element
          if (videoPreviewRef.current && screenPreviewStreamRef.current) {
            videoPreviewRef.current.srcObject = screenPreviewStreamRef.current;
            // Let autoPlay and onLoadedMetadata handle playback - don't force it
            // The video element already has autoPlay attribute and onLoadedMetadata handler
          }
        }
        // For PiP mode, keep preview running during recording
        if (mode === 'pip' && !pipScreenStream) {
          startPipPreview();
        }
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
        // Read file via IPC to get metadata
        const fileName = filePath.split(/[/\\]/).pop() || 'recording.webm';
        const result: { success: boolean; buffer?: ArrayBuffer; error?: string } = 
          await window.electron.getVideoBlobUrl(filePath);
        
        if (!result.success || !result.buffer) {
          throw new Error(result.error || 'Failed to read recording file');
        }
        
        // Create File object from buffer for metadata extraction
        const blob = new Blob([result.buffer], { type: 'video/webm' });
        const file = new File([blob], fileName, { type: 'video/webm' });
        
        // Import the recording
        const importResult = await importVideoFile(file);
        
        if (importResult.success && importResult.clip) {
          // IMPORTANT: Replace the blob URL with the actual file path
          const clipWithRealPath = {
            ...importResult.clip,
            filePath: filePath, // Use the actual saved file path, not the blob URL
          };
          
          // Add to media library with real path
          addClip(clipWithRealPath);
          
          // Add to timeline
          addClipToTimeline(clipWithRealPath);
          
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
      <div className="flex-1 flex items-start justify-center p-8 overflow-auto pt-12">
        {showSourceSelection && !recording.isRecording ? (
          <div className="w-full max-w-6xl">
            {/* Source Selection for Screen/PiP */}
            {(mode === 'screen' || mode === 'pip') && (
              <div>
                {mode === 'screen' && recording.selectedSourceId ? (
                  <div className="text-center">
                    {previewStream ? (
                      <>
                        <h3 className="text-2xl font-semibold text-white mb-4">
                          Preview: Screen Recording
                        </h3>
                        <div className="mx-auto bg-gray-800 rounded-lg overflow-hidden" style={{ width: '854px', height: '480px', maxWidth: '100%', aspectRatio: '16/9' }}>
                          <video
                            ref={videoPreviewRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-contain"
                            onLoadedMetadata={(e) => {
                              console.log('[Screen Preview] Video metadata loaded');
                              e.currentTarget.play().catch(err => {
                                console.error('[Screen Preview] Failed to play after metadata loaded:', err);
                              });
                            }}
                            onPlay={() => {
                              console.log('[Screen Preview] Video started playing');
                            }}
                            onError={(e) => {
                              console.error('[Screen Preview] Video error:', e);
                            }}
                          />
                        </div>
                        {/* Hidden video element for screen preview */}
                        <video
                          ref={screenPreviewVideoRef}
                          autoPlay
                          muted
                          playsInline
                          style={{ display: 'none' }}
                        />
                      </>
                    ) : (
                      <div className="text-center">
                        <h3 className="text-2xl font-semibold text-white mb-4">
                          Loading preview...
                        </h3>
                        <div className="w-96 h-72 mx-auto bg-gray-800 rounded-lg flex items-center justify-center">
                          <span className="text-6xl animate-pulse">⏳</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : mode === 'pip' && recording.selectedSourceId ? (
                  <div className="text-center">
                    {pipScreenStream && pipWebcamStream ? (
                      <>
                        <h3 className="text-2xl font-semibold text-white mb-4">
                          Preview: Screen + Webcam
                        </h3>
                        <p className="text-gray-400 mb-4">
                          Choose webcam position
                        </p>
                        <div className="flex justify-center gap-3 mb-4">
                          <button
                            onClick={() => handlePipPositionChange('top-left')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              pipPosition === 'top-left'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            Top Left
                          </button>
                          <button
                            onClick={() => handlePipPositionChange('top-right')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              pipPosition === 'top-right'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            Top Right
                          </button>
                          <button
                            onClick={() => handlePipPositionChange('bottom-left')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              pipPosition === 'bottom-left'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            Bottom Left
                          </button>
                          <button
                            onClick={() => handlePipPositionChange('bottom-right')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              pipPosition === 'bottom-right'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            Bottom Right
                          </button>
                        </div>
                        <div className="relative inline-block">
                          <canvas
                            ref={pipCanvasRef}
                            className="bg-gray-900 rounded-lg"
                            style={{ width: '854px', height: '480px', maxWidth: '100%', aspectRatio: '16/9' }}
                          />
                        </div>
                        {/* Hidden video elements for canvas composition */}
                        <video
                          ref={pipScreenVideoRef}
                          autoPlay
                          muted
                          playsInline
                          style={{ display: 'none' }}
                        />
                        <video
                          ref={pipWebcamVideoRef}
                          autoPlay
                          muted
                          playsInline
                          style={{ display: 'none' }}
                        />
                      </>
                    ) : (
                      <div className="text-center">
                        <h3 className="text-2xl font-semibold text-white mb-4">
                          Loading preview...
                        </h3>
                        <div className="w-96 h-72 mx-auto bg-gray-800 rounded-lg flex items-center justify-center">
                          <span className="text-6xl animate-pulse">⏳</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                <h3 className="text-2xl font-semibold text-white mb-6 text-center">
                      {mode === 'pip' ? 'First, select a screen or window to record' : 'Select a screen or window to record'}
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
                      <div className="grid grid-cols-3 gap-6 mt-8">
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
                                className="w-full h-56 object-contain rounded mb-3"
                          />
                        )}
                        <p className="text-white text-sm font-medium text-center truncate">
                          {source.name}
                        </p>
                      </button>
                    ))}
                  </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* Webcam Preview */}
            {mode === 'webcam' && (
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-white mb-6">
                  {recording.isRecording ? 'Recording...' : 'Ready to record webcam'}
                </h3>
                <div className="mx-auto bg-gray-800 rounded-lg overflow-hidden" style={{ width: '854px', height: '480px', maxWidth: '100%', aspectRatio: '16/9' }}>
                  {previewStream ? (
                    <video
                      ref={videoPreviewRef}
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
              </div>
            )}
          </div>
        ) : recording.isRecording ? (
          <div className="text-center w-full max-w-6xl">
            {mode === 'screen' ? (
              <div>
                <div className="mx-auto bg-gray-800 rounded-lg overflow-hidden mb-4" style={{ width: '854px', height: '480px', maxWidth: '100%', aspectRatio: '16/9' }}>
                  {(previewStream || screenPreviewStreamRef.current) ? (
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                      onLoadedMetadata={(e) => {
                        console.log('[Screen Recording] Video metadata loaded');
                        e.currentTarget.play().catch(err => {
                          console.error('[Screen Recording] Failed to play after metadata loaded:', err);
                        });
                      }}
                      onPlay={() => {
                        console.log('[Screen Recording] Video started playing');
                      }}
                      onError={(e) => {
                        console.error('[Screen Recording] Video error:', e);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Loading preview...
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-red-500 font-mono text-3xl">
                    {formatDuration(recording.duration)}
                  </span>
                </div>
                <p className="text-gray-400">
                  Click "Stop Recording" when you're done
                </p>
                {/* Hidden video element for screen preview */}
                <video
                  ref={screenPreviewVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ display: 'none' }}
                />
              </div>
            ) : mode === 'webcam' ? (
              <div>
                <div className="mx-auto bg-gray-800 rounded-lg overflow-hidden mb-4" style={{ width: '854px', height: '480px', maxWidth: '100%', aspectRatio: '16/9' }}>
                  {previewStream ? (
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Loading preview...
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-red-500 font-mono text-3xl">
                    {formatDuration(recording.duration)}
                  </span>
                </div>
                <p className="text-gray-400">
                  Click "Stop Recording" when you're done
                </p>
              </div>
            ) : mode === 'pip' && pipScreenStream && pipWebcamStream ? (
              <div>
                <div className="relative inline-block mb-4">
                  <canvas
                    ref={pipCanvasRef}
                    className="bg-gray-900 rounded-lg"
                    style={{ width: '854px', height: '480px', maxWidth: '100%', aspectRatio: '16/9' }}
                  />
                </div>
                {/* Hidden video elements for canvas composition */}
                <video
                  ref={pipScreenVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ display: 'none' }}
                />
                <video
                  ref={pipWebcamVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ display: 'none' }}
                />
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-red-500 font-mono text-3xl">
                    {formatDuration(recording.duration)}
                  </span>
                </div>
                <p className="text-gray-400">
                  Click "Stop Recording" when you're done
                </p>
              </div>
            ) : (
              <>
            <div className="text-6xl mb-6">🔴</div>
            <h3 className="text-3xl font-bold text-white mb-4">Recording in progress...</h3>
            <p className="text-gray-400 mb-8">
              Click "Stop Recording" when you're done
            </p>
            <div className="text-6xl font-mono text-red-500">
              {formatDuration(recording.duration)}
            </div>
              </>
            )}
          </div>
        ) : null}
      </div>
      
      {/* Controls */}
      <div className="px-6 py-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-between max-w-5xl mx-auto gap-4">
          {/* Left Side - Device Selection & Audio Toggle */}
          <div className="flex items-center gap-3">
            {/* Video Device Selector (for webcam/pip modes) */}
            {(mode === 'webcam' || mode === 'pip') && recording.videoDevices.length > 0 && !recording.isRecording && (
              <div className="flex flex-col">
                <label className="text-xs text-gray-400 mb-1">Camera</label>
                <select
                  value={recording.selectedVideoDeviceId || ''}
                  onChange={(e) => selectVideoDevice(e.target.value)}
                  className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm focus:outline-none focus:border-blue-500"
                >
                  {recording.videoDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Audio Device Selector */}
            {recording.audioDevices.length > 0 && !recording.isRecording && recording.audioEnabled && (
              <div className="flex flex-col">
                <label className="text-xs text-gray-400 mb-1">Microphone</label>
                <select
                  value={recording.selectedAudioDeviceId || ''}
                  onChange={(e) => selectAudioDevice(e.target.value)}
                  className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm focus:outline-none focus:border-blue-500"
                >
                  {recording.audioDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
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
          </div>
          
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

