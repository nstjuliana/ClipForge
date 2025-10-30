/**
 * Export Modal Component
 * 
 * Displays export options and progress for video export.
 * Handles FFmpeg initialization, export configuration, and download.
 * 
 * @component
 */

import { useState, useCallback, useEffect } from 'react';
import { useTimeline } from '@/contexts/TimelineContext';
import { useMedia } from '@/contexts/MediaContext';
import { useProject } from '@/contexts/ProjectContext';
import {
  loadFFmpeg,
  exportTimeline,
  isFFmpegLoaded,
  type ExportOptions,
} from '@/services/ffmpegService';

/**
 * Props for ExportModal component
 * 
 * @interface ExportModalProps
 */
export interface ExportModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * Export state
 */
type ExportState = 'idle' | 'loading-ffmpeg' | 'generating-subtitles' | 'exporting' | 'success' | 'error';

/**
 * Export Modal Component
 * 
 * Allows user to configure export settings and export timeline to video.
 */
export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { timeline } = useTimeline();
  const { clips } = useMedia();
  const { metadata } = useProject();
  
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'source' | '1080p' | '720p'>('1080p');
  const [fileName, setFileName] = useState('');
  const [generateSubtitles, setGenerateSubtitles] = useState(false);
  const [subtitleWarning, setSubtitleWarning] = useState<string | null>(null);
  
  /**
   * Initialize file name when modal opens
   */
  useEffect(() => {
    if (isOpen && !fileName) {
      const timestamp = new Date().toISOString().slice(0, 10);
      setFileName(`${metadata.name.replace(/\s+/g, '_')}_${timestamp}.mp4`);
    }
  }, [isOpen, fileName, metadata.name]);
  
  /**
   * Handle export start
   */
  const handleExport = useCallback(async () => {
    if (timeline.clips.length === 0) {
      setError('No clips on timeline to export');
      return;
    }
    
    try {
      setError(null);
      setProgress(0);
      setSubtitleWarning(null);
      
      // Load FFmpeg if not already loaded
      if (!isFFmpegLoaded()) {
        setExportState('loading-ffmpeg');
        await loadFFmpeg();
      }
      
      let subtitlePath: string | undefined;
      
      // Generate subtitles if enabled
      if (generateSubtitles) {
        setExportState('generating-subtitles');
        
        try {
          // Prepare timeline clips with file paths
          const clipsWithPaths = timeline.clips.map(tc => {
            const clip = clips.find(c => c.id === tc.clipId);
            if (!clip) {
              throw new Error(`Clip ${tc.clipId} not found`);
            }
            
            return {
              id: tc.id,
              clipId: tc.clipId,
              startTime: tc.startTime,
              duration: tc.duration,
              inPoint: tc.inPoint,
              outPoint: tc.outPoint,
              filePath: clip.filePath,
              track: tc.track,
            };
          });
          
          console.log('[Export] Generating subtitles...');
          const subtitleResult = await window.electron.generateSubtitles(
            clipsWithPaths,
            timeline.duration
          );
          
          if (subtitleResult.success && subtitleResult.subtitlePath) {
            subtitlePath = subtitleResult.subtitlePath;
            console.log('[Export] Subtitles generated:', subtitlePath);
          } else {
            // Subtitle generation failed - show warning but continue
            const warningMsg = subtitleResult.error || 'Subtitle generation failed';
            console.warn('[Export] Subtitle generation failed:', warningMsg);
            setSubtitleWarning(`Subtitles could not be generated: ${warningMsg}`);
          }
        } catch (err) {
          // Catch any errors and continue with export
          const warningMsg = err instanceof Error ? err.message : 'Unknown error';
          console.warn('[Export] Subtitle generation error:', err);
          setSubtitleWarning(`Subtitles could not be generated: ${warningMsg}`);
        }
      }
      
      // Start export
      setExportState('exporting');
      
      // Determine resolution
      let exportResolution: [number, number] | undefined;
      if (resolution === '1080p') {
        exportResolution = [1920, 1080];
      } else if (resolution === '720p') {
        exportResolution = [1280, 720];
      }
      
      const options: ExportOptions = {
        resolution: exportResolution,
        format: 'mp4',
        fileName,
        subtitlePath, // Include subtitle path if generated
      };
      
      // Export timeline (will save to disk via native FFmpeg)
      const outputPath = await exportTimeline(
        clips,
        timeline.clips,
        { ...options, fileName },
        (p) => setProgress(p),
        timeline.duration
      );
      
      console.log('Video exported to:', outputPath);
      
      setExportState('success');
      setProgress(100);
    } catch (err) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
      setExportState('error');
    }
  }, [timeline.clips, timeline.duration, clips, resolution, fileName, generateSubtitles]);
  
  /**
   * Handle close
   */
  const handleClose = useCallback(() => {
    if (exportState === 'exporting' || exportState === 'loading-ffmpeg' || exportState === 'generating-subtitles') {
      // Don't allow closing during export or subtitle generation
      return;
    }
    
    // Reset state
    setExportState('idle');
    setProgress(0);
    setError(null);
    setSubtitleWarning(null);
    onClose();
  }, [exportState, onClose]);
  
  /**
   * Handle resolution change
   */
  const handleResolutionChange = useCallback((value: 'source' | '1080p' | '720p') => {
    setResolution(value);
  }, []);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">Export Video</h2>
          <p className="text-sm text-gray-400">Export your timeline to MP4</p>
        </div>
        
        {/* Export State Display */}
        {exportState === 'idle' && (
          <>
            {/* Export Options */}
            <div className="space-y-4 mb-6">
              {/* File Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  File Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName((e.target as HTMLInputElement).value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="my-video.mp4"
                />
              </div>
              
              {/* Resolution */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Resolution
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleResolutionChange('source')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      resolution === 'source'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Source
                  </button>
                  <button
                    onClick={() => handleResolutionChange('1080p')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      resolution === '1080p'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    1080p
                  </button>
                  <button
                    onClick={() => handleResolutionChange('720p')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      resolution === '720p'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    720p
                  </button>
                </div>
              </div>
              
              {/* AI Subtitles */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateSubtitles}
                    onChange={(e) => setGenerateSubtitles(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Generate AI Subtitles
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Uses OpenAI Whisper to transcribe audio (requires API key in .env)
                </p>
              </div>
              
              {/* Timeline Info */}
              <div className="bg-gray-700/50 rounded p-3 text-sm">
                <p className="text-gray-300">
                  <span className="font-medium">Clips:</span> {timeline.clips.length}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium">Duration:</span> {Math.round(timeline.duration)}s
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={timeline.clips.length === 0 || !fileName}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Export
              </button>
            </div>
          </>
        )}
        
        {/* Loading FFmpeg */}
        {exportState === 'loading-ffmpeg' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-white font-medium mb-2">Loading FFmpeg...</p>
            <p className="text-sm text-gray-400">This may take a moment on first export</p>
          </div>
        )}
        
        {/* Generating Subtitles */}
        {exportState === 'generating-subtitles' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-white font-medium mb-2">Generating Subtitles...</p>
            <p className="text-sm text-gray-400">Transcribing audio with OpenAI Whisper</p>
          </div>
        )}
        
        {/* Exporting */}
        {exportState === 'exporting' && (
          <div className="py-8">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Exporting...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-400 text-center">
              Please wait while your video is being processed...
            </p>
          </div>
        )}
        
        {/* Success */}
        {exportState === 'success' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-white font-medium mb-2">Export Complete!</p>
            <p className="text-sm text-gray-400 mb-2">
              Your video has been downloaded successfully
            </p>
            {subtitleWarning && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 mb-4 text-left">
                <p className="text-xs text-yellow-300">⚠️ {subtitleWarning}</p>
              </div>
            )}
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors mt-4"
            >
              Done
            </button>
          </div>
        )}
        
        {/* Error */}
        {exportState === 'error' && (
          <div className="py-8">
            <div className="text-center text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-white font-medium mb-2 text-center">Export Failed</p>
            <div className="bg-red-900/30 border border-red-800 rounded p-3 mb-6">
              <p className="text-sm text-red-300">{error}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setExportState('idle');
                  setError(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

