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
      // Don't stop if already recording (keep preview alive during recording)
      if (streamRef.current && !isRecording) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setStream(null);
      }

      // If already have a preview stream and recording, keep using it
      if (streamRef.current && isRecording) {
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

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      streamRef.current = newStream;
      setStream(newStream);

      // Set stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      return newStream;
    } catch (error) {
      console.error('Failed to start webcam preview:', error);
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

