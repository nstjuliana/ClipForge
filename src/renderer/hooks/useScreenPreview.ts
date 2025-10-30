/**
 * Hook to manage screen preview stream
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type React from 'react';

export interface UseScreenPreviewOptions {
  selectedSourceId?: string;
  isRecording: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function useScreenPreview({
  selectedSourceId,
  isRecording,
  videoRef,
}: UseScreenPreviewOptions) {
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

      if (!selectedSourceId) {
        console.log('[Screen Preview] No source selected');
        return null;
      }

      console.log('[Screen Preview] Starting preview for source:', selectedSourceId);

      // Get screen stream
      const screenConstraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: selectedSourceId,
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

      streamRef.current = screenStream;
      setStream(screenStream);

      // Check stream tracks
      const videoTracks = screenStream.getVideoTracks();
      console.log('[Screen Preview] Stream obtained, video tracks:', videoTracks.length);
      videoTracks.forEach((track, i) => {
        console.log(`[Screen Preview] Track ${i}:`, track.label, 'readyState:', track.readyState, 'enabled:', track.enabled);
      });

      // Set stream to video element
      if (videoRef.current && videoRef.current.srcObject !== screenStream) {
        videoRef.current.srcObject = screenStream;
      }

      return screenStream;
    } catch (error) {
      console.error('[Screen Preview] Failed to start screen preview:', error);
      return null;
    }
  }, [selectedSourceId, isRecording, videoRef]);

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

