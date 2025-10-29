/**
 * Recording Context
 * 
 * Provides recording state and operations to all components.
 * Manages screen recording, webcam recording, and picture-in-picture mode.
 * 
 * @module contexts/RecordingContext
 */

import React, { createContext, useContext, useState, useMemo, useCallback, useRef } from 'react';

/**
 * Recording mode types
 */
export type RecordingMode = 'screen' | 'webcam' | 'pip';

/**
 * Recording source for screen/window selection
 */
export interface RecordingSource {
  id: string;
  name: string;
  thumbnail?: string;
}

/**
 * Media device info
 */
export interface MediaDeviceInfo {
  deviceId: string;
  kind: 'videoinput' | 'audioinput' | 'audiooutput';
  label: string;
  groupId: string;
}

/**
 * Recording state
 * 
 * @interface RecordingState
 */
export interface RecordingState {
  /** Whether currently recording */
  isRecording: boolean;
  
  /** Current recording mode */
  mode: RecordingMode | null;
  
  /** Recording duration in seconds */
  duration: number;
  
  /** Whether audio is enabled */
  audioEnabled: boolean;
  
  /** Available recording sources */
  sources: RecordingSource[];
  
  /** Selected source ID */
  selectedSourceId: string | null;
  
  /** Recording status message */
  statusMessage: string | null;
  
  /** Whether permissions are granted */
  permissionsGranted: boolean;
  
  /** Available video input devices (webcams) */
  videoDevices: MediaDeviceInfo[];
  
  /** Available audio input devices (microphones) */
  audioDevices: MediaDeviceInfo[];
  
  /** Selected video device ID */
  selectedVideoDeviceId: string | null;
  
  /** Selected audio device ID */
  selectedAudioDeviceId: string | null;
}

/**
 * Recording context value type
 * 
 * @interface RecordingContextValue
 */
interface RecordingContextValue {
  /** Recording state */
  recording: RecordingState;
  
  /** Request recording permissions */
  requestPermissions: (mode: RecordingMode) => Promise<boolean>;
  
  /** Get available sources for screen recording */
  getAvailableSources: () => Promise<RecordingSource[]>;
  
  /** Select a recording source */
  selectSource: (sourceId: string) => void;
  
  /** Enumerate available media devices (webcams and microphones) */
  enumerateDevices: () => Promise<void>;
  
  /** Select a video input device */
  selectVideoDevice: (deviceId: string) => void;
  
  /** Select an audio input device */
  selectAudioDevice: (deviceId: string) => void;
  
  /** Start recording */
  startRecording: (mode: RecordingMode, sourceId?: string) => Promise<void>;
  
  /** Stop recording */
  stopRecording: () => Promise<string | null>;
  
  /** Cancel recording */
  cancelRecording: () => void;
  
  /** Toggle audio */
  toggleAudio: () => void;
  
  /** Set status message */
  setStatus: (message: string | null) => void;
}

/**
 * Recording Context
 */
const RecordingContext = createContext<RecordingContextValue | null>(null);

/**
 * Recording Provider Props
 * 
 * @interface RecordingProviderProps
 */
export interface RecordingProviderProps {
  children: React.ReactNode;
}

/**
 * Recording Provider Component
 * 
 * Provides recording state and operations to all child components.
 * 
 * @component
 */
export function RecordingProvider({ children }: RecordingProviderProps) {
  // Recording state
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    mode: null,
    duration: 0,
    audioEnabled: true,
    sources: [],
    selectedSourceId: null,
    statusMessage: null,
    permissionsGranted: false,
    videoDevices: [],
    audioDevices: [],
    selectedVideoDeviceId: null,
    selectedAudioDeviceId: null,
  });
  
  // Media recorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef<number>(0);
  
  /**
   * Request recording permissions based on mode
   */
  const requestPermissions = useCallback(async (mode: RecordingMode): Promise<boolean> => {
    try {
      console.log(`[Permissions] Requesting permissions for mode: ${mode}`);
      setRecording(prev => ({ ...prev, statusMessage: 'Requesting permissions...' }));
      
      // Check if media devices API is available
      if (!navigator.mediaDevices) {
        console.error('[Permissions] navigator.mediaDevices not available');
        setRecording(prev => ({
          ...prev,
          statusMessage: 'Media devices API not available',
          permissionsGranted: false,
        }));
        return false;
      }
      
      if (mode === 'screen' || mode === 'pip') {
        // For screen recording, we need display media
        if (!navigator.mediaDevices.getDisplayMedia) {
          console.error('[Permissions] getDisplayMedia not available');
          setRecording(prev => ({
            ...prev,
            statusMessage: 'Screen capture not supported',
            permissionsGranted: false,
          }));
          return false;
        }
      }
      
      if (mode === 'webcam' || mode === 'pip') {
        // For webcam, we need user media
        if (!navigator.mediaDevices.getUserMedia) {
          console.error('[Permissions] getUserMedia not available');
          setRecording(prev => ({
            ...prev,
            statusMessage: 'Camera not supported',
            permissionsGranted: false,
          }));
          return false;
        }
        
        // Test video and audio separately to identify which permission is failing
        let videoGranted = false;
        let audioGranted = false;
        
        // Test video access
        try {
          console.log('[Permissions] Testing camera access...');
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          console.log('[Permissions] Camera access: GRANTED');
          videoStream.getTracks().forEach(track => {
            console.log(`[Permissions] Video track: ${track.label}`);
            track.stop();
          });
          videoGranted = true;
        } catch (videoError: any) {
          console.error('[Permissions] Camera access failed:', videoError);
          videoGranted = false;
        }
        
        // Test audio access (microphone) separately
        try {
          console.log('[Permissions] Testing microphone access...');
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('[Permissions] Microphone access: GRANTED');
          audioStream.getTracks().forEach(track => {
            console.log(`[Permissions] Audio track: ${track.label}`);
            track.stop();
          });
          audioGranted = true;
        } catch (audioError: any) {
          console.error('[Permissions] Microphone access failed:', audioError);
          console.error('[Permissions] Microphone error name:', audioError.name);
          console.error('[Permissions] Microphone error message:', audioError.message);
          audioGranted = false;
          
          // Check system-level permissions specifically for microphone
          if ((window as any).electron?.checkSystemPermissions) {
            console.log('[Permissions] Checking system-level microphone permissions...');
            
            const micCheck = await (window as any).electron.checkSystemPermissions('microphone');
            console.log('[Permissions] Microphone system check:', micCheck);
            
            // Show microphone-specific help
            if (micCheck.help) {
              alert(`Microphone Permission Required\n\n${micCheck.help}`);
            } else {
              // Generic microphone help (if platform check isn't available)
              if (micCheck.platform === 'win32' || navigator.platform.includes('Win')) {
                alert(`Microphone Permission Required\n\n` +
                      `Please enable microphone access:\n` +
                      `1. Open Windows Settings (Win + I)\n` +
                      `2. Go to Privacy & Security > Microphone\n` +
                      `3. Enable "Let apps access your microphone"\n` +
                      `4. Enable "Let desktop apps access your microphone"\n` +
                      `5. Find ClipForge in the list and make sure it's enabled\n` +
                      `6. Restart the app`);
              } else {
                alert(`Microphone Permission Required\n\n` +
                      `Please check your system settings to enable microphone access for ClipForge.`);
              }
            }
          }
        }
        
        // If audio is required and not granted, fail
        if (!audioGranted && recording.audioEnabled) {
          setRecording(prev => ({
            ...prev,
            statusMessage: `Microphone permission denied. Check Windows Settings > Privacy > Microphone.`,
            permissionsGranted: false,
          }));
          return false;
        }
        
        // If neither is granted, fail
        if (!videoGranted && !audioGranted) {
          setRecording(prev => ({
            ...prev,
            statusMessage: `Camera and microphone permissions denied. Check your OS settings.`,
            permissionsGranted: false,
          }));
          return false;
        }
        
        // At least one is granted, continue (audio might be optional)
        if (!videoGranted) {
          console.warn('[Permissions] Video not available, but continuing with audio only');
        }
        if (!audioGranted) {
          console.warn('[Permissions] Audio not available - continuing without audio');
        }
      }
      
      console.log('[Permissions] Permissions granted successfully');
      setRecording(prev => ({
        ...prev,
        permissionsGranted: true,
        statusMessage: null,
      }));
      
      return true;
    } catch (error: any) {
      console.error('[Permissions] Permission request failed:', error);
      console.error('[Permissions] Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      setRecording(prev => ({
        ...prev,
        statusMessage: `Permission denied: ${error?.message || 'Unknown error'}`,
        permissionsGranted: false,
      }));
      return false;
    }
  }, []);
  
  /**
   * Get available sources for screen recording
   * Uses Electron's desktopCapturer API
   */
  const getAvailableSources = useCallback(async (): Promise<RecordingSource[]> => {
    try {
      setRecording(prev => ({ ...prev, statusMessage: 'Loading sources...' }));
      
      // Use Electron's desktopCapturer if available
      if ((window as any).electron?.getDesktopSources) {
        const sources = await (window as any).electron.getDesktopSources();
        
        const recordingSources: RecordingSource[] = sources.map((source: any) => ({
          id: source.id,
          name: source.name,
          thumbnail: source.thumbnail,
        }));
        
        setRecording(prev => ({
          ...prev,
          sources: recordingSources,
          statusMessage: null,
        }));
        
        return recordingSources;
      }
      
      // Fallback: create a default source
      const defaultSource: RecordingSource = {
        id: 'default',
        name: 'Entire Screen',
      };
      
      setRecording(prev => ({
        ...prev,
        sources: [defaultSource],
        statusMessage: null,
      }));
      
      return [defaultSource];
    } catch (error) {
      console.error('Failed to get sources:', error);
      setRecording(prev => ({
        ...prev,
        statusMessage: 'Failed to load sources',
        sources: [],
      }));
      return [];
    }
  }, []);
  
  /**
   * Select a recording source
   */
  const selectSource = useCallback((sourceId: string) => {
    setRecording(prev => ({
      ...prev,
      selectedSourceId: sourceId,
    }));
  }, []);
  
  /**
   * Enumerate available media devices (webcams and microphones)
   */
  const enumerateDevices = useCallback(async () => {
    try {
      setRecording(prev => ({ ...prev, statusMessage: 'Loading devices...' }));
      
      // Request permissions first to get device labels
      if ((window as any).electron?.requestMediaAccess) {
        await (window as any).electron.requestMediaAccess('camera');
        await (window as any).electron.requestMediaAccess('microphone');
      }
      
      // First, get initial permission to enumerate devices with labels
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        tempStream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.warn('Could not get initial stream for device enumeration:', err);
      }
      
      // Now enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoDevices: MediaDeviceInfo[] = devices
        .filter(d => d.kind === 'videoinput')
        .map(d => ({
          deviceId: d.deviceId,
          kind: 'videoinput' as const,
          label: d.label || `Camera ${d.deviceId.substring(0, 5)}`,
          groupId: d.groupId,
        }));
      
      const audioDevices: MediaDeviceInfo[] = devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({
          deviceId: d.deviceId,
          kind: 'audioinput' as const,
          label: d.label || `Microphone ${d.deviceId.substring(0, 5)}`,
          groupId: d.groupId,
        }));
      
      setRecording(prev => ({
        ...prev,
        videoDevices,
        audioDevices,
        // Auto-select first device if none selected
        selectedVideoDeviceId: prev.selectedVideoDeviceId || (videoDevices[0]?.deviceId ?? null),
        selectedAudioDeviceId: prev.selectedAudioDeviceId || (audioDevices[0]?.deviceId ?? null),
        statusMessage: null,
      }));
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      setRecording(prev => ({
        ...prev,
        statusMessage: 'Failed to load devices',
      }));
    }
  }, []);
  
  /**
   * Select a video input device
   */
  const selectVideoDevice = useCallback((deviceId: string) => {
    setRecording(prev => ({
      ...prev,
      selectedVideoDeviceId: deviceId,
    }));
  }, []);
  
  /**
   * Select an audio input device
   */
  const selectAudioDevice = useCallback((deviceId: string) => {
    setRecording(prev => ({
      ...prev,
      selectedAudioDeviceId: deviceId,
    }));
  }, []);
  
  /**
   * Start recording
   */
  const startRecording = useCallback(async (mode: RecordingMode, sourceId?: string) => {
    try {
      // Clear previous recording
      recordedChunksRef.current = [];
      
      let stream: MediaStream;
      
      // Get appropriate media stream based on mode
      if (mode === 'screen') {
        // Screen recording - use correct Electron constraints
        const constraints = {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId || recording.selectedSourceId,
              minWidth: 1280,
              maxWidth: 1920,
              minHeight: 720,
              maxHeight: 1080,
            },
          },
        } as any;
        
        try {
          stream = await (navigator.mediaDevices.getUserMedia as any)(constraints);
        } catch (error) {
          console.error('Screen capture failed, trying alternative method:', error);
          // Fallback: try getDisplayMedia
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: { width: { ideal: 1920 }, height: { ideal: 1080 } } as any,
            audio: false as any,
          });
        }
        
        // Add audio if enabled
        if (recording.audioEnabled) {
          try {
            console.log('[Recording] Requesting audio stream for screen recording...');
            const audioConstraints: MediaTrackConstraints = recording.selectedAudioDeviceId 
              ? { deviceId: { exact: recording.selectedAudioDeviceId } }
              : {};
            
            const audioStream = await navigator.mediaDevices.getUserMedia({ 
              video: false,
              audio: audioConstraints 
            });
            audioStream.getAudioTracks().forEach(track => {
              console.log(`[Recording] Added audio track: ${track.label}`);
              stream.addTrack(track);
            });
          } catch (audioError: any) {
            console.error('[Recording] Microphone access failed for screen recording:', audioError);
            console.warn('[Recording] Continuing screen recording without audio...');
            setRecording(prev => ({
              ...prev,
              statusMessage: 'Screen recording without audio - microphone permission denied',
            }));
          }
        }
      } else if (mode === 'webcam') {
        // Webcam recording with device selection
        // Get video and audio separately so mic failure doesn't block video
        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        };
        
        // Use selected video device if available
        if (recording.selectedVideoDeviceId) {
          videoConstraints.deviceId = { exact: recording.selectedVideoDeviceId };
        }
        
        // Get video stream first
        console.log('[Recording] Requesting video stream...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false, // Get audio separately
        });
        
        // Add audio if enabled (with better error handling)
        if (recording.audioEnabled) {
          try {
            console.log('[Recording] Requesting audio stream...');
            const audioConstraints: MediaTrackConstraints = recording.selectedAudioDeviceId 
              ? { deviceId: { exact: recording.selectedAudioDeviceId } }
              : {};
            
            const audioStream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: audioConstraints,
            });
            
            // Add audio tracks to main stream
            audioStream.getAudioTracks().forEach(track => {
              console.log(`[Recording] Added audio track: ${track.label}`);
              stream.addTrack(track);
            });
          } catch (audioError: any) {
            console.error('[Recording] Microphone access failed during recording:', audioError);
            console.warn('[Recording] Continuing recording without audio...');
            // Continue without audio - video recording will work
            setRecording(prev => ({
              ...prev,
              statusMessage: 'Recording without audio - microphone permission denied',
            }));
          }
        }
      } else {
        // PiP mode (screen + webcam)
        const screenConstraints = {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId || recording.selectedSourceId,
              minWidth: 1280,
              maxWidth: 1920,
              minHeight: 720,
              maxHeight: 1080,
            },
          },
        } as any;
        
        try {
          stream = await (navigator.mediaDevices.getUserMedia as any)(screenConstraints);
        } catch (error) {
          console.error('Screen capture failed for PiP, trying alternative method:', error);
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: { width: { ideal: 1920 }, height: { ideal: 1080 } } as any,
            audio: false as any,
          });
        }
        
        // Try to add webcam with device selection
        try {
          const webcamVideoConstraints: MediaTrackConstraints = {
            width: { ideal: 320 },
            height: { ideal: 240 },
          };
          
          // Use selected video device if available
          if (recording.selectedVideoDeviceId) {
            webcamVideoConstraints.deviceId = { exact: recording.selectedVideoDeviceId };
          }
          
          const webcamAudioConstraints: MediaTrackConstraints | boolean = recording.audioEnabled
            ? (recording.selectedAudioDeviceId 
                ? { deviceId: { exact: recording.selectedAudioDeviceId } }
                : true)
            : false;
          
          const webcamStream = await navigator.mediaDevices.getUserMedia({
            video: webcamVideoConstraints,
            audio: webcamAudioConstraints,
          });
          webcamStream.getTracks().forEach(track => stream.addTrack(track));
        } catch (webcamError) {
          console.warn('Webcam capture failed for PiP, continuing with screen only:', webcamError);
          // Add audio if enabled and webcam didn't provide it
          if (recording.audioEnabled) {
            try {
              const audioConstraints: MediaTrackConstraints | boolean = recording.selectedAudioDeviceId
                ? { deviceId: { exact: recording.selectedAudioDeviceId } }
                : true;
              const audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
              audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
            } catch (audioError) {
              console.warn('Audio capture failed:', audioError);
            }
          }
        }
      }
      
      streamRef.current = stream;
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      
      // Reset duration ref and start duration timer
      durationRef.current = 0;
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const duration = (Date.now() - startTime) / 1000;
        durationRef.current = duration;
        setRecording(prev => ({ ...prev, duration }));
      }, 100);
      
      setRecording(prev => ({
        ...prev,
        isRecording: true,
        mode,
        duration: 0,
        statusMessage: 'Recording...',
      }));
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecording(prev => ({
        ...prev,
        statusMessage: `Failed to start recording: ${error}`,
      }));
      throw error;
    }
  }, [recording.selectedSourceId, recording.audioEnabled]);
  
  /**
   * Stop recording and return file path
   */
  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }
      
      mediaRecorder.onstop = async () => {
        // Capture duration from ref (most up-to-date value)
        const capturedDuration = durationRef.current;
        
        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Create blob from recorded chunks
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        
        try {
          // Save recording via IPC with duration metadata
          const filePath = await (window as any).electron.saveRecording(blob, capturedDuration);
          
          setRecording(prev => ({
            ...prev,
            isRecording: false,
            mode: null,
            duration: 0,
            statusMessage: 'Recording saved',
          }));
          
          resolve(filePath);
        } catch (error) {
          console.error('Failed to save recording:', error);
          setRecording(prev => ({
            ...prev,
            isRecording: false,
            statusMessage: 'Failed to save recording',
          }));
          resolve(null);
        }
      };
      
      mediaRecorder.stop();
    });
  }, []);
  
  /**
   * Cancel recording without saving
   */
  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset duration ref
    durationRef.current = 0;
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear chunks
    recordedChunksRef.current = [];
    
    setRecording(prev => ({
      ...prev,
      isRecording: false,
      mode: null,
      duration: 0,
      statusMessage: 'Recording cancelled',
    }));
  }, []);
  
  /**
   * Toggle audio recording
   */
  const toggleAudio = useCallback(() => {
    setRecording(prev => ({
      ...prev,
      audioEnabled: !prev.audioEnabled,
    }));
  }, []);
  
  /**
   * Set status message
   */
  const setStatus = useCallback((message: string | null) => {
    setRecording(prev => ({
      ...prev,
      statusMessage: message,
    }));
  }, []);
  
  // Memoize context value
  const value = useMemo(
    () => ({
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
      setStatus,
    }),
    [
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
      setStatus,
    ]
  );
  
  return <RecordingContext.Provider value={value}>{children}</RecordingContext.Provider>;
}

/**
 * Custom hook to use Recording Context
 * 
 * @returns Recording context value
 * @throws Error if used outside RecordingProvider
 * 
 * @example
 * const { recording, startRecording, stopRecording } = useRecording();
 */
export function useRecording(): RecordingContextValue {
  const context = useContext(RecordingContext);
  
  if (!context) {
    throw new Error('useRecording must be used within RecordingProvider');
  }
  
  return context;
}

