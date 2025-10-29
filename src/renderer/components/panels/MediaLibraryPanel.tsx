/**
 * Media Library Panel Component
 * 
 * Displays the media library with imported video clips.
 * Shows thumbnails, metadata, and handles drag-and-drop to timeline.
 * 
 * @component
 */

import React, { useCallback, useRef } from 'react';
import { useMedia } from '@/contexts/MediaContext';
import { useTimeline } from '@/contexts/TimelineContext';
import { getFilesFromDragEvent, fileListToArray } from '@/services/mediaService';
import { formatDuration, formatFileSize } from '@/services/metadataService';
import type { Clip } from '@/types/clip';

/**
 * Props for MediaLibraryPanel component
 * 
 * @interface MediaLibraryPanelProps
 */
export interface MediaLibraryPanelProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Media Library Panel Component
 * 
 * Displays imported clips with thumbnails and metadata.
 * Supports drag-and-drop to add clips to timeline.
 */
export function MediaLibraryPanel({ className = '' }: MediaLibraryPanelProps) {
  const { clips, selectedClipId, selectClip, importFiles } = useMedia();
  const { addClipToTimeline } = useTimeline();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  
  /**
   * Handle file import button click
   */
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  /**
   * Handle file input change
   */
  const handleFileInput = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const fileArray = fileListToArray(files);
    const results = await importFiles(fileArray);
    
    // Show results in console for now (could add toast notifications later)
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`Import complete: ${successful} succeeded, ${failed} failed`);
    
    // Reset input
    event.target.value = '';
  }, [importFiles]);
  
  /**
   * Handle drag over event
   */
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);
  
  /**
   * Handle drag leave event
   */
  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);
  
  /**
   * Handle drop event
   */
  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    
    const files = getFilesFromDragEvent(event);
    if (files.length === 0) return;
    
    const results = await importFiles(files);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`Import complete: ${successful} succeeded, ${failed} failed`);
  }, [importFiles]);
  
  /**
   * Handle clip click
   */
  const handleClipClick = useCallback((clip: Clip) => {
    selectClip(clip.id);
  }, [selectClip]);
  
  /**
   * Handle double click to add to timeline
   */
  const handleClipDoubleClick = useCallback((clip: Clip) => {
    addClipToTimeline(clip);
    console.log(`Added clip "${clip.name}" to timeline`);
  }, [addClipToTimeline]);
  
  return (
    <div className={`flex flex-col h-full bg-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Media Library</h2>
        <button
          onClick={handleImportClick}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          + Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
      
      {/* Content Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 ${isDragging ? 'bg-blue-600/20' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {clips.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-center mb-2">No media imported yet</p>
            <p className="text-sm text-gray-500 text-center mb-4">
              Drag and drop video files here<br />or click Import to get started
            </p>
            <button
              onClick={handleImportClick}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Import Files
            </button>
          </div>
        ) : (
          /* Clip Grid */
          <div className="grid grid-cols-1 gap-3">
            {clips.map(clip => (
              <ClipItem
                key={clip.id}
                clip={clip}
                isSelected={clip.id === selectedClipId}
                onClick={() => handleClipClick(clip)}
                onDoubleClick={() => handleClipDoubleClick(clip)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="p-3 border-t border-gray-700 text-xs text-gray-400">
        {clips.length} clip{clips.length !== 1 ? 's' : ''} imported
      </div>
    </div>
  );
}

/**
 * Clip Item Component
 * 
 * Displays a single clip in the media library.
 */
interface ClipItemProps {
  clip: Clip;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}

function ClipItem({ clip, isSelected, onClick, onDoubleClick }: ClipItemProps) {
  return (
    <div
      className={`
        flex gap-3 p-3 rounded-lg cursor-pointer transition-all
        ${isSelected ? 'bg-blue-600/30 border-2 border-blue-500' : 'bg-gray-700/50 border-2 border-transparent hover:bg-gray-700'}
      `}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-24 h-16 bg-gray-900 rounded overflow-hidden">
        {clip.thumbnailPath ? (
          <img
            src={clip.thumbnailPath}
            alt={clip.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-500">
            🎥
          </div>
        )}
      </div>
      
      {/* Metadata */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate mb-1" title={clip.name}>
          {clip.name}
        </p>
        <div className="text-xs text-gray-400 space-y-0.5">
          <p>{formatDuration(clip.duration)}</p>
          <p>{clip.resolution[0]}x{clip.resolution[1]}</p>
          <p>{formatFileSize(clip.fileSize)}</p>
        </div>
      </div>
    </div>
  );
}

