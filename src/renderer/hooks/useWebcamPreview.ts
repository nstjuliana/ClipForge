/**
 * Hook to manage webcam preview stream
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type React from 'react';

export interface UseWebcamPreviewOptions {
  selectedVideoDeviceId?: string;
  isRecording: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function useWebcamPreview({
  selectedVideoDeviceId,
  isRecording,
  videoRef,
}: UseWebcamPreviewOptions) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startPreview = useCallback(async () => {
    try {
      console.log('[useWebcamPreview] startPreview called', { 
        hasStream: !!streamRef.current, 
        isRecording,
        selectedVideoDeviceId 
      });
      
      // Don't stop if already recording (keep preview alive during recording)
      if (streamRef.current && !isRecording) {
        console.log('[useWebcamPreview] Stopping existing stream');
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setStream(null);
      }

      // If already have a preview stream and recording, keep using it
      if (streamRef.current && isRecording) {
        console.log('[useWebcamPreview] Keeping existing stream (recording)');
        return streamRef.current;
      }

      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };

      // Use selected video device if available
      if (selectedVideoDeviceId) {
        videoConstraints.deviceId = { exact: selectedVideoDeviceId };
      }

      console.log('[useWebcamPreview] Requesting webcam with constraints:', videoConstraints);
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      console.log('[useWebcamPreview] Webcam stream obtained:', newStream.id);
      streamRef.current = newStream;
      setStream(newStream);

      // Set stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        console.log('[useWebcamPreview] Stream attached to video element');
      } else {
        console.warn('[useWebcamPreview] Video ref not available');
      }

      return newStream;
    } catch (error) {
      console.error('[useWebcamPreview] Failed to start webcam preview:', error);
      return null;
    }
  }, [selectedVideoDeviceId, isRecording, videoRef]);

  const stopPreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [videoRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    stream,
    startPreview,
    stopPreview,
  };
}

