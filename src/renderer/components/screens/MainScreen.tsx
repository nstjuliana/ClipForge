/**
 * Main Screen Component
 * 
 * Primary editing interface with media library, timeline, and preview panels.
 * This is the core screen where video editing happens.
 * 
 * @component
 */

import React, { useState, useCallback } from 'react';
import { MediaProvider, useMedia } from '@/contexts/MediaContext';
import { TimelineProvider, useTimeline } from '@/contexts/TimelineContext';
import { ProjectProvider, useProject } from '@/contexts/ProjectContext';
import { MediaLibraryPanel } from '@/components/panels/MediaLibraryPanel';
import { PreviewPanel } from '@/components/panels/PreviewPanel';
import { TimelinePanel } from '@/components/panels/TimelinePanel';
import { ExportModal } from '@/components/modals/ExportModal';
import type { ProjectFile } from '@/types/project';

/**
 * Props for MainScreen component
 * 
 * @interface MainScreenProps
 */
export interface MainScreenProps {
  /** Navigation callback to switch screens */
  onNavigate: (
    screen: 'launch' | 'project-selection' | 'main',
    project?: ProjectFile | null,
    filePath?: string | null
  ) => void;
  /** Loaded project data (null for new project) */
  loadedProject?: ProjectFile | null;
  /** Project file path */
  projectFilePath?: string | null;
}

/**
 * Main Screen Content Component
 * 
 * Inner component that has access to all contexts.
 */
function MainScreenContent({ onNavigate }: MainScreenProps) {
  const { clips } = useMedia();
  const { timeline } = useTimeline();
  const {
    metadata,
    exportSettings,
    projectFilePath,
    setProjectFilePath,
    hasUnsavedChanges,
    markSaved,
    markModified,
  } = useProject();
  
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to go back?');
      if (!confirmed) return;
    }
    onNavigate('project-selection');
  }, [hasUnsavedChanges, onNavigate]);
  
  /**
   * Handle save project
   */
  const handleSaveProject = useCallback(async () => {
    try {
      let savePath = projectFilePath;
      
      // If no path, show save dialog
      if (!savePath) {
        savePath = await window.electron.saveProjectDialog();
        if (!savePath) return;
      }
      
      // Prepare project data
      const projectData: ProjectFile = {
        version: '1.0.0',
        metadata: {
          ...metadata,
          modifiedAt: new Date(),
        },
        clips: clips.map(clip => ({
          ...clip,
          importedAt: clip.importedAt,
        })),
        timeline,
        exportSettings,
      };
      
      // Save project
      const result = await window.electron.saveProject(savePath, projectData);
      
      if (result.success) {
        setProjectFilePath(savePath);
        markSaved();
        console.log('Project saved successfully');
        alert('Project saved successfully!');
      } else {
        console.error('Failed to save project:', result.error);
        alert(`Failed to save project: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project. Please try again.');
    }
  }, [projectFilePath, metadata, exportSettings, clips, timeline, setProjectFilePath, markSaved]);
  
  
  /**
   * Handle export
   */
  const handleExport = useCallback(() => {
    if (timeline.clips.length === 0) {
      alert('No clips on timeline to export');
      return;
    }
    setIsExportModalOpen(true);
  }, [timeline.clips.length]);
  
  /**
   * Mark as modified when clips or timeline changes
   */
  React.useEffect(() => {
    if (clips.length > 0 || timeline.clips.length > 0) {
      markModified();
    }
  }, [clips.length, timeline.clips.length, markModified]);
  
  return (
    <div className="flex h-full w-full flex-col bg-gray-900">
      {/* Top Bar / Menu */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold">
            ClipForge - {metadata.name}
            {hasUnsavedChanges && <span className="text-yellow-500 ml-2">*</span>}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveProject}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
            title="Save Project"
          >
            💾 Save
          </button>
          <button
            onClick={handleExport}
            disabled={timeline.clips.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm disabled:bg-gray-700 disabled:cursor-not-allowed"
            title="Export Video"
          >
            🎬 Export
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Panel - Media Library */}
        <div className="w-80 flex-shrink-0">
          <MediaLibraryPanel />
        </div>

        {/* Center - Preview and Timeline */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Preview Panel */}
          <div className="flex-1 min-h-0">
            <PreviewPanel />
          </div>

          {/* Timeline Panel */}
          <div className="h-64 flex-shrink-0">
            <TimelinePanel />
          </div>
        </div>
      </div>
      
      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}

/**
 * Main Screen Component
 * 
 * Wraps the content with all necessary context providers.
 */
export function MainScreen({ loadedProject, projectFilePath, ...props }: MainScreenProps) {
  // Initialize contexts with loaded project data or defaults
  const initialMetadata = loadedProject?.metadata;
  const initialExportSettings = loadedProject?.exportSettings;
  const initialClips = loadedProject?.clips || [];
  const initialTimeline = loadedProject?.timeline;
  
  return (
    <ProjectProvider
      initialMetadata={initialMetadata}
      initialExportSettings={initialExportSettings}
      initialProjectFilePath={projectFilePath || undefined}
    >
      <MediaProvider initialClips={initialClips}>
        <TimelineProvider initialTimeline={initialTimeline}>
          <MainScreenContent {...props} />
        </TimelineProvider>
      </MediaProvider>
    </ProjectProvider>
  );
}
