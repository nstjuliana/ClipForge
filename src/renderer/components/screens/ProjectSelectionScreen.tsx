/**
 * Project Selection Screen Component
 * 
 * Allows users to create a new project or open an existing one.
 * Provides the main entry point for project management.
 */

import React from 'react';
import type { ScreenType } from '../../App';

/**
 * Props for ProjectSelectionScreen component.
 */
export interface ProjectSelectionScreenProps {
  /**
   * Callback to navigate to different screens.
   */
  onNavigate: (screen: ScreenType) => void;
}

/**
 * Project Selection Screen Component
 * 
 * Displays options to create a new project or open an existing project file.
 * 
 * @param props - Component props
 * @returns The project selection screen JSX
 */
export function ProjectSelectionScreen({ onNavigate }: ProjectSelectionScreenProps) {
  /**
   * Handles creating a new project.
   * Navigates to the main editing screen.
   */
  const handleNewProject = () => {
    // TODO: Create new project in Phase 1
    onNavigate('main');
  };

  /**
   * Handles opening an existing project.
   * Shows file dialog (stub for now).
   */
  const handleOpenProject = () => {
    // TODO: Show file dialog and load project in Phase 1
    onNavigate('main');
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <h1 className="mb-12 text-4xl font-bold text-white">Select Project</h1>
      
      <div className="flex flex-col gap-6">
        <button
          onClick={handleNewProject}
          className="rounded-lg bg-blue-600 px-12 py-6 text-xl font-semibold text-white transition-colors hover:bg-blue-700"
        >
          New Project
        </button>
        
      <button
        onClick={handleOpenProject}
        className="rounded-lg bg-gray-700 px-12 py-6 text-xl font-semibold text-white transition-colors hover:bg-gray-600"
      >
        Open Existing Project
      </button>
    </div>
  </div>
);
}

