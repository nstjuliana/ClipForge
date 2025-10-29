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
      setRecording(prev => ({ ...prev, statusMessage: 'Requesting permissions...' }));
      
      if (mode === 'screen' || mode === 'pip') {
        // For screen recording, we need display media
        // Note: We'll use Electron's desktopCapturer in the actual implementation
        // For now, we'll check if the API is available
        if (!navigator.mediaDevices?.getDisplayMedia) {
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
        if (!navigator.mediaDevices?.getUserMedia) {
          setRecording(prev => ({
            ...prev,
            statusMessage: 'Camera not supported',
            permissionsGranted: false,
          }));
          return false;
        }
      }
      
      setRecording(prev => ({
        ...prev,
        permissionsGranted: true,
        statusMessage: null,
      }));
      
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      setRecording(prev => ({
        ...prev,
        statusMessage: 'Permission denied',
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
      if (window.electron?.getDesktopSources) {
        const sources = await window.electron.getDesktopSources();
        
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
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
          } catch (audioError) {
            console.warn('Audio capture failed, continuing without audio:', audioError);
          }
        }
      } else if (mode === 'webcam') {
        // Webcam recording
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: recording.audioEnabled,
        });
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
        
        // Try to add webcam
        try {
          const webcamStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 320 }, height: { ideal: 240 } },
            audio: recording.audioEnabled,
          });
          webcamStream.getTracks().forEach(track => stream.addTrack(track));
        } catch (webcamError) {
          console.warn('Webcam capture failed for PiP, continuing with screen only:', webcamError);
          // Add audio if enabled and webcam didn't provide it
          if (recording.audioEnabled) {
            try {
              const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
          const filePath = await window.electron.saveRecording(blob, capturedDuration);
          
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

