/**
 * Project Context
 * 
 * Provides project-level state and operations.
 * Manages project metadata, save/load operations, and export settings.
 * 
 * @module contexts/ProjectContext
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { ProjectFile, ProjectMetadata, ExportSettings } from '@/types/project';

/**
 * Project context value type
 * 
 * @interface ProjectContextValue
 */
interface ProjectContextValue {
  /** Project metadata */
  metadata: ProjectMetadata;
  
  /** Export settings */
  exportSettings: ExportSettings;
  
  /** Current project file path */
  projectFilePath: string | null;
  
  /** Whether project has unsaved changes */
  hasUnsavedChanges: boolean;
  
  /** Update project metadata */
  updateMetadata: (metadata: Partial<ProjectMetadata>) => void;
  
  /** Update export settings */
  updateExportSettings: (settings: Partial<ExportSettings>) => void;
  
  /** Set project file path */
  setProjectFilePath: (path: string | null) => void;
  
  /** Mark project as modified */
  markModified: () => void;
  
  /** Mark project as saved */
  markSaved: () => void;
  
  /** Get project name */
  getProjectName: () => string;
}

/**
 * Project Context
 */
const ProjectContext = createContext<ProjectContextValue | null>(null);

/**
 * Project Provider Props
 * 
 * @interface ProjectProviderProps
 */
export interface ProjectProviderProps {
  children: React.ReactNode;
  /** Initial project metadata */
  initialMetadata?: ProjectMetadata;
  /** Initial export settings */
  initialExportSettings?: ExportSettings;
  /** Initial project file path */
  initialProjectFilePath?: string | null;
}

/**
 * Default project metadata
 */
const defaultMetadata: ProjectMetadata = {
  name: 'Untitled Project',
  createdAt: new Date(),
  modifiedAt: new Date(),
};

/**
 * Default export settings
 */
const defaultExportSettings: ExportSettings = {
  format: 'mp4',
  resolution: [1920, 1080],
  frameRate: 30,
  videoCodec: 'libx264',
  videoBitrate: 5000,
  audioCodec: 'aac',
  audioBitrate: 128,
};

/**
 * Project Provider Component
 * 
 * Provides project-level state and operations to all child components.
 * 
 * @component
 */
export function ProjectProvider({ 
  children,
  initialMetadata,
  initialExportSettings,
  initialProjectFilePath = null,
}: ProjectProviderProps) {
  const [metadata, setMetadata] = useState<ProjectMetadata>(initialMetadata || defaultMetadata);
  const [exportSettings, setExportSettings] = useState<ExportSettings>(initialExportSettings || defaultExportSettings);
  const [projectFilePath, setProjectFilePath] = useState<string | null>(initialProjectFilePath);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  
  /**
   * Update project metadata
   */
  const updateMetadata = useCallback((updates: Partial<ProjectMetadata>) => {
    setMetadata(prev => ({
      ...prev,
      ...updates,
      modifiedAt: new Date(),
    }));
    setHasUnsavedChanges(true);
  }, []);
  
  /**
   * Update export settings
   */
  const updateExportSettings = useCallback((settings: Partial<ExportSettings>) => {
    setExportSettings(prev => ({
      ...prev,
      ...settings,
    }));
    setHasUnsavedChanges(true);
  }, []);
  
  /**
   * Mark project as modified
   */
  const markModified = useCallback(() => {
    setHasUnsavedChanges(true);
    setMetadata(prev => ({
      ...prev,
      modifiedAt: new Date(),
    }));
  }, []);
  
  /**
   * Mark project as saved
   */
  const markSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);
  
  /**
   * Get project name
   */
  const getProjectName = useCallback((): string => {
    return metadata.name;
  }, [metadata.name]);
  
  // Memoize context value
  const value = useMemo(
    () => ({
      metadata,
      exportSettings,
      projectFilePath,
      hasUnsavedChanges,
      updateMetadata,
      updateExportSettings,
      setProjectFilePath,
      markModified,
      markSaved,
      getProjectName,
    }),
    [
      metadata,
      exportSettings,
      projectFilePath,
      hasUnsavedChanges,
      updateMetadata,
      updateExportSettings,
      markModified,
      markSaved,
      getProjectName,
    ]
  );
  
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

/**
 * Custom hook to use Project Context
 * 
 * @returns Project context value
 * @throws Error if used outside ProjectProvider
 * 
 * @example
 * const { metadata, updateMetadata } = useProject();
 */
export function useProject(): ProjectContextValue {
  const context = useContext(ProjectContext);
  
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  
  return context;
}

