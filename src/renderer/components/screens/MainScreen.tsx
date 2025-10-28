/**
 * Main Screen Component
 * 
 * The primary editing interface with media library, timeline, and preview panels.
 * This is a placeholder that will be expanded in Phase 1.
 */

import React from 'react';
import type { ScreenType } from '../../App';

/**
 * Props for MainScreen component.
 */
export interface MainScreenProps {
  /**
   * Callback to navigate to different screens.
   */
  onNavigate: (screen: ScreenType) => void;
}

/**
 * Main Screen Component
 * 
 * Displays the main editing interface with panels for media, timeline, and preview.
 * This is a stub component that will be fully implemented in Phase 1.
 * 
 * @param props - Component props
 * @returns The main screen JSX
 */
export function MainScreen({ onNavigate }: MainScreenProps) {
  return (
    <div className="flex h-full w-full flex-col bg-gray-900">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-gray-800 bg-gray-950 px-6">
        <h1 className="text-xl font-semibold text-white">ClipForge</h1>
        <div className="ml-auto">
          <button
            onClick={() => onNavigate('project-selection')}
            className="rounded px-4 py-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            Back
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Media Library Panel */}
        <div className="w-80 border-r border-gray-800 bg-gray-900 p-4">
          <h2 className="mb-4 text-lg font-semibold text-white">Media Library</h2>
          <p className="text-sm text-gray-500">
            Imported clips will appear here
          </p>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 bg-gray-950 p-4">
          <h2 className="mb-4 text-lg font-semibold text-white">Preview</h2>
          <div className="flex h-full items-center justify-center rounded border border-gray-800 bg-gray-900">
            <p className="text-gray-500">Preview panel - coming in Phase 1</p>
          </div>
        </div>
      </div>

      {/* Timeline Panel */}
      <div className="h-48 border-t border-gray-800 bg-gray-900 p-4">
        <h2 className="mb-4 text-lg font-semibold text-white">Timeline</h2>
        <div className="flex h-full items-center justify-center rounded border border-gray-800 bg-gray-950">
          <p className="text-gray-500">Timeline - coming in Phase 1</p>
        </div>
      </div>
    </div>
  );
}

