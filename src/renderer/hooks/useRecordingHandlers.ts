/**
 * Hook to manage recording lifecycle handlers
 */

import { useCallback } from 'react';
import { RecordingMode } from '@/contexts/RecordingContext';
import { importVideoFile } from '@/services/mediaService';

export interface UseRecordingHandlersOptions {
  mode: RecordingMode;
  selectedSourceId?: string;
  
  // Context functions
  requestPermissions: (mode: RecordingMode) => Promise<boolean>;
  startRecording: (mode: RecordingMode, sourceId?: string) => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => void;
  addClip: (clip: any) => void;
  addClipToTimeline: (clip: any) => void;
  selectSource: (sourceId: string) => void;
  
  // Preview functions
  startWebcamPreview?: () => Promise<MediaStream | null>;
  startScreenPreview?: () => Promise<MediaStream | null>;
  startPipPreview?: () => Promise<void>;
  
  // Callbacks
  onClose: () => void;
}

export function useRecordingHandlers({
  mode,
  selectedSourceId,
  requestPermissions,
  startRecording,
  stopRecording,
  cancelRecording,
  addClip,
  addClipToTimeline,
  selectSource,
  startWebcamPreview,
  startScreenPreview,
  startPipPreview,
  onClose,
}: UseRecordingHandlersOptions) {
  /**
   * Start recording with selected settings
   */
  const handleStartRecording = useCallback(async () => {
    try {
      // Request permissions first
      const granted = await requestPermissions(mode);
      if (!granted) {
        return;
      }

      // For webcam mode, no source selection needed
      if (mode === 'webcam') {
        // Ensure preview is running before starting recording
        if (startWebcamPreview) {
          await startWebcamPreview();
        }
        await startRecording(mode);
        return;
      }

      // For screen/pip mode, ensure source is selected
      if (!selectedSourceId) {
        throw new Error('No source selected');
      }

      // For screen mode, ensure preview is running before starting recording
      if (mode === 'screen' && startScreenPreview) {
        await startScreenPreview();
      }

      // For PiP mode, ensure preview is running
      if (mode === 'pip' && startPipPreview) {
        await startPipPreview();
      }

      await startRecording(mode, selectedSourceId);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please check permissions and try again.');
    }
  }, [
    mode,
    selectedSourceId,
    requestPermissions,
    startRecording,
    startWebcamPreview,
    startScreenPreview,
    startPipPreview,
  ]);

  /**
   * Stop recording and add to timeline
   */
  const handleStopRecording = useCallback(async () => {
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
  }, [stopRecording, addClip, addClipToTimeline, onClose]);

  /**
   * Cancel recording
   */
  const handleCancelRecording = useCallback(() => {
    cancelRecording();
    onClose();
  }, [cancelRecording, onClose]);

  return {
    handleStartRecording,
    handleStopRecording,
    handleCancelRecording,
  };
}

