/**
 * Media Context
 * 
 * Provides media library state and operations to all components.
 * Manages imported clips and media-related actions.
 * 
 * @module contexts/MediaContext
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { Clip } from '@/types/clip';
import { importVideoFile, importMultipleFiles, type MediaImportResult } from '@/services/mediaService';

/**
 * Media context value type
 * 
 * @interface MediaContextValue
 */
interface MediaContextValue {
  /** All imported clips */
  clips: Clip[];
  
  /** Currently selected clip ID */
  selectedClipId: string | null;
  
  /** Import a single file */
  importFile: (file: File) => Promise<MediaImportResult>;
  
  /** Import multiple files */
  importFiles: (files: File[]) => Promise<MediaImportResult[]>;
  
  /** Add a clip to the library */
  addClip: (clip: Clip) => void;
  
  /** Remove a clip from the library */
  removeClip: (clipId: string) => void;
  
  /** Select a clip */
  selectClip: (clipId: string | null) => void;
  
  /** Get clip by ID */
  getClip: (clipId: string) => Clip | undefined;
  
  /** Clear all clips */
  clearAll: () => void;
}

/**
 * Media Context
 */
const MediaContext = createContext<MediaContextValue | null>(null);

/**
 * Media Provider Props
 * 
 * @interface MediaProviderProps
 */
export interface MediaProviderProps {
  children: React.ReactNode;
  /** Initial clips to load */
  initialClips?: Clip[];
}

/**
 * Media Provider Component
 * 
 * Provides media library state and operations to all child components.
 * 
 * @component
 */
export function MediaProvider({ children, initialClips = [] }: MediaProviderProps) {
  const [clips, setClips] = useState<Clip[]>(initialClips);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  
  /**
   * Import a single file
   */
  const importFile = useCallback(async (file: File): Promise<MediaImportResult> => {
    const result = await importVideoFile(file);
    
    if (result.success && result.clip) {
      setClips(prev => [...prev, result.clip!]);
    }
    
    return result;
  }, []);
  
  /**
   * Import multiple files
   */
  const importFiles = useCallback(async (files: File[]): Promise<MediaImportResult[]> => {
    const results = await importMultipleFiles(files);
    
    const successfulClips = results
      .filter(r => r.success && r.clip)
      .map(r => r.clip!);
    
    if (successfulClips.length > 0) {
      setClips(prev => [...prev, ...successfulClips]);
    }
    
    return results;
  }, []);
  
  /**
   * Add a clip to the library
   */
  const addClip = useCallback((clip: Clip) => {
    setClips(prev => [...prev, clip]);
  }, []);
  
  /**
   * Remove a clip from the library
   */
  const removeClip = useCallback((clipId: string) => {
    setClips(prev => prev.filter(c => c.id !== clipId));
    if (selectedClipId === clipId) {
      setSelectedClipId(null);
    }
  }, [selectedClipId]);
  
  /**
   * Select a clip
   */
  const selectClip = useCallback((clipId: string | null) => {
    setSelectedClipId(clipId);
  }, []);
  
  /**
   * Get clip by ID
   */
  const getClip = useCallback((clipId: string): Clip | undefined => {
    return clips.find(c => c.id === clipId);
  }, [clips]);
  
  /**
   * Clear all clips
   */
  const clearAll = useCallback(() => {
    setClips([]);
    setSelectedClipId(null);
  }, []);
  
  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      clips,
      selectedClipId,
      importFile,
      importFiles,
      addClip,
      removeClip,
      selectClip,
      getClip,
      clearAll,
    }),
    [clips, selectedClipId, importFile, importFiles, addClip, removeClip, selectClip, getClip, clearAll]
  );
  
  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

/**
 * Custom hook to use Media Context
 * 
 * @returns Media context value
 * @throws Error if used outside MediaProvider
 * 
 * @example
 * const { clips, importFile } = useMedia();
 */
export function useMedia(): MediaContextValue {
  const context = useContext(MediaContext);
  
  if (!context) {
    throw new Error('useMedia must be used within MediaProvider');
  }
  
  return context;
}

