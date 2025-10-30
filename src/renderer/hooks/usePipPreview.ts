/**
 * Hook to manage Picture-in-Picture preview with canvas compositing
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import type React from 'react';

export type PipPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface UsePipPreviewOptions {
  selectedSourceId?: string;
  selectedVideoDeviceId?: string;
  isRecording: boolean;
  pipPosition: PipPosition;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  screenVideoRef: React.RefObject<HTMLVideoElement>;
  webcamVideoRef: React.RefObject<HTMLVideoElement>;
}

export function usePipPreview({
  selectedSourceId,
  selectedVideoDeviceId,
  isRecording,
  pipPosition,
  canvasRef,
  screenVideoRef,
  webcamVideoRef,
}: UsePipPreviewOptions) {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  
  const animationFrameRef = useRef<number | null>(null);
  const pipPositionRef = useRef(pipPosition);
  const previewStartedForSourceRef = useRef<string | null>(null);

  // Update position ref when prop changes
  useEffect(() => {
    pipPositionRef.current = pipPosition;
  }, [pipPosition]);

  /**
   * Convert preset position to pixel coordinates
   */
  const getPipPositionPixels = useCallback((position: PipPosition, canvasWidth: number, canvasHeight: number) => {
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

  const stopPreview = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }

    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    if (webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = null;
    }

    // Reset preview tracking
    previewStartedForSourceRef.current = null;
  }, [screenStream, webcamStream, screenVideoRef, webcamVideoRef]);

  const startPreview = useCallback(async () => {
    // Prevent multiple simultaneous starts
    if (isStarting) {
      console.log('[PiP Preview] Already starting, ignoring duplicate call');
      return;
    }

    // Prevent starting preview for same source again
    if (previewStartedForSourceRef.current === selectedSourceId && screenStream && webcamStream) {
      console.log('[PiP Preview] Preview already started for this source, ignoring');
      return;
    }

    try {
      console.log('[PiP Preview] Starting preview...');
      setIsStarting(true);

      // Stop existing previews
      stopPreview();

      if (!selectedSourceId) {
        console.log('[PiP Preview] No source selected');
        setIsStarting(false);
        return;
      }

      previewStartedForSourceRef.current = selectedSourceId;

      console.log('[PiP Preview] Getting screen stream...');
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

      let newScreenStream: MediaStream;
      try {
        newScreenStream = await (navigator.mediaDevices.getUserMedia as any)(screenConstraints);
        console.log('[PiP Preview] Screen stream obtained');
      } catch (error) {
        console.error('[PiP Preview] Screen capture failed, trying getDisplayMedia:', error);
        newScreenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } } as any,
          audio: false as any,
        });
        console.log('[PiP Preview] Screen stream obtained via getDisplayMedia');
      }

      setScreenStream(newScreenStream);
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = newScreenStream;
      }

      console.log('[PiP Preview] Getting webcam stream...');
      // Get webcam stream
      const webcamVideoConstraints: MediaTrackConstraints = {
        width: { ideal: 320 },
        height: { ideal: 240 },
      };

      if (selectedVideoDeviceId) {
        webcamVideoConstraints.deviceId = { exact: selectedVideoDeviceId };
      }

      const newWebcamStream = await navigator.mediaDevices.getUserMedia({
        video: webcamVideoConstraints,
        audio: false,
      });

      console.log('[PiP Preview] Webcam stream obtained');
      setWebcamStream(newWebcamStream);
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = newWebcamStream;
      }

      console.log('[PiP Preview] Both streams obtained, waiting for canvas to be rendered...');
      setIsStarting(false);
    } catch (error) {
      console.error('[PiP Preview] Failed to start PiP preview:', error);
      setIsStarting(false);
      alert(`Failed to start preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedSourceId, selectedVideoDeviceId, stopPreview, screenStream, webcamStream, screenVideoRef, webcamVideoRef, isStarting]);

  /**
   * Start canvas drawing when streams are ready
   */
  useEffect(() => {
    if (!screenStream || !webcamStream) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const startCanvasDrawing = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        setTimeout(startCanvasDrawing, 100);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('[PiP Preview] Failed to get canvas context');
        return;
      }

      console.log('[PiP Preview] Canvas ready, starting drawing...');
      canvas.width = 1280;
      canvas.height = 720;

      const draw = () => {
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw screen if ready
        if (screenVideoRef.current && screenVideoRef.current.readyState >= 2) {
          ctx.drawImage(screenVideoRef.current, 0, 0, canvas.width, canvas.height);
        }

        // Draw webcam overlay if ready
        if (webcamVideoRef.current && webcamVideoRef.current.readyState >= 2) {
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
          ctx.drawImage(webcamVideoRef.current, x, y, pipWidth, pipHeight);
        }

        animationFrameRef.current = requestAnimationFrame(draw);
      };

      // Wait for videos to be ready
      const checkReady = () => {
        const screenReady = screenVideoRef.current?.readyState !== undefined && screenVideoRef.current.readyState >= 2;
        const webcamReady = webcamVideoRef.current?.readyState !== undefined && webcamVideoRef.current.readyState >= 2;

        if (screenReady && webcamReady) {
          console.log('[PiP Preview] Videos ready, starting draw loop');
          draw();
        } else {
          setTimeout(checkReady, 100);
        }
      };

      setTimeout(checkReady, 100);
    };

    requestAnimationFrame(() => {
      setTimeout(startCanvasDrawing, 100);
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [screenStream, webcamStream, canvasRef, screenVideoRef, webcamVideoRef, getPipPositionPixels]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview]);

  return {
    screenStream,
    webcamStream,
    isStarting,
    startPreview,
    stopPreview,
  };
}

