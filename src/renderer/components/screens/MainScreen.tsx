/**
 * Main Screen Component
 * 
 * Primary editing interface with media library, timeline, and preview panels.
 * This is the core screen where video editing happens.
 * 
 * @component
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MediaProvider, useMedia } from '@/contexts/MediaContext';
import { TimelineProvider, useTimeline } from '@/contexts/TimelineContext';
import { ProjectProvider, useProject } from '@/contexts/ProjectContext';
import { RecordingProvider } from '@/contexts/RecordingContext';
import { UndoRedoProvider } from '@/contexts/UndoRedoContext';
import { MediaLibraryPanel } from '@/components/panels/MediaLibraryPanel';
import { PreviewPanel } from '@/components/panels/PreviewPanel';
import { TimelinePanel } from '@/components/panels/TimelinePanel';
import { ExportModal } from '@/components/modals/ExportModal';
import { RecordingScreen } from '@/components/screens/RecordingScreen';
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
  const { timeline, applySnapshot } = useTimeline();
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
  const [isRecordingScreenOpen, setIsRecordingScreenOpen] = useState(false);
  const [isMediaLibraryVisible, setIsMediaLibraryVisible] = useState(true);
  const [previewHeight, setPreviewHeight] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  
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
  
  /**
   * Handle undo/redo state changes from UndoRedoProvider
   */
  useEffect(() => {
    const handleUndoRedoStateChange = (event: Event) => {
      const customEvent = event as CustomEvent<import('@/services/undoRedoService').TimelineStateSnapshot>;
      applySnapshot(customEvent.detail);
      markModified(); // Mark project as modified when undo/redo occurs
    };
    
    window.addEventListener('undoRedoStateChange', handleUndoRedoStateChange);
    
    return () => {
      window.removeEventListener('undoRedoStateChange', handleUndoRedoStateChange);
    };
  }, [applySnapshot, markModified]);

  /**
   * Handle vertical resize between preview and timeline
   */
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    
    const startY = e.clientY;
    const startPreviewHeight = previewHeight ?? (previewRef.current?.getBoundingClientRect().height ?? 0);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !previewRef.current || !timelineRef.current) return;
      
      const container = previewRef.current.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const deltaY = e.clientY - startY;
      
      // Calculate new preview height
      const newPreviewHeight = startPreviewHeight + deltaY;
      
      // Set constraints
      const minPreviewHeight = 150;
      const maxPreviewHeight = containerHeight - 200; // Leave at least 200px for timeline
      
      const constrainedPreviewHeight = Math.max(minPreviewHeight, Math.min(maxPreviewHeight, newPreviewHeight));
      
      setPreviewHeight(constrainedPreviewHeight);
    };
    
    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [previewHeight]);
  
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
            onClick={() => setIsMediaLibraryVisible(!isMediaLibraryVisible)}
            className="px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
            title={isMediaLibraryVisible ? "Hide Media Library" : "Show Media Library"}
          >
            {isMediaLibraryVisible ? '◀' : '▶'} Media
          </button>
          <button
            onClick={() => setIsRecordingScreenOpen(true)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            title="Record Screen/Webcam"
          >
            ⏺ Record
          </button>
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
      <div className="flex flex-1 overflow-hidden min-h-0 relative">
        {/* Left Panel - Media Library */}
        {isMediaLibraryVisible && (
          <div className="w-80 flex-shrink-0">
            <MediaLibraryPanel />
          </div>
        )}

        {/* Toggle button for media library when hidden */}
        {!isMediaLibraryVisible && (
          <button
            onClick={() => setIsMediaLibraryVisible(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-2 py-8 rounded-r-lg border-r border-y border-gray-700 transition-colors z-10"
            title="Show Media Library"
          >
            ◀
          </button>
        )}

        {/* Center - Preview and Timeline */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Preview Panel */}
          <div 
            ref={previewRef}
            className="flex-1 min-h-0"
            style={previewHeight !== null ? { height: `${previewHeight}px`, flexShrink: 0 } : {}}
          >
            <PreviewPanel />
          </div>

          {/* Resizer Handle */}
          <div
            ref={resizeRef}
            onMouseDown={handleResizeStart}
            className="h-1 bg-gray-700 hover:bg-blue-600 cursor-ns-resize transition-colors relative z-10 flex-shrink-0 group"
            style={{ userSelect: 'none' }}
            title="Drag to resize"
          >
            <div className="absolute inset-y-0 left-0 right-0 -my-1 cursor-ns-resize" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-gray-600 group-hover:bg-blue-500 rounded-full transition-colors" />
          </div>

          {/* Timeline Panel */}
          <div 
            ref={timelineRef}
            className="flex-shrink-0"
            style={previewHeight !== null ? { 
              height: `calc(100% - ${previewHeight}px - 4px)`,
              minHeight: '200px'
            } : {}}
          >
            <TimelinePanel />
          </div>
        </div>
      </div>
      
      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      
      {/* Recording Screen */}
      {isRecordingScreenOpen && (
        <RecordingScreen onClose={() => setIsRecordingScreenOpen(false)} />
      )}
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
  
  // Create handler for undo/redo state changes
  // This needs to be a stable reference, so we'll create it inside a wrapper component
  const UndoRedoWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <UndoRedoProvider
        maxHistorySize={50}
        onStateChange={(snapshot) => {
          // Find TimelineContext and apply snapshot
          // We'll handle this via a ref pattern in MainScreenContent
          // For now, we use a global approach
          const event = new CustomEvent('undoRedoStateChange', { detail: snapshot });
          window.dispatchEvent(event);
        }}
      >
        {children}
      </UndoRedoProvider>
    );
  };
  
  return (
    <ProjectProvider
      initialMetadata={initialMetadata}
      initialExportSettings={initialExportSettings}
      initialProjectFilePath={projectFilePath || undefined}
    >
      <MediaProvider initialClips={initialClips}>
        <UndoRedoWrapper>
          <TimelineProvider initialTimeline={initialTimeline}>
            <RecordingProvider>
              <MainScreenContent {...props} />
            </RecordingProvider>
          </TimelineProvider>
        </UndoRedoWrapper>
      </MediaProvider>
    </ProjectProvider>
  );
}
