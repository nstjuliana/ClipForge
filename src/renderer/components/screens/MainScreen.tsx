/**
 * Main Screen Component
 * 
 * Primary editing interface with media library, timeline, and preview panels.
 * This is the core screen where video editing happens.
 * 
 * @component
 */

/**
 * Props for MainScreen component
 * 
 * @interface MainScreenProps
 */
export interface MainScreenProps {
  /** Navigation callback to switch screens */
  onNavigate: (screen: 'launch' | 'project-selection' | 'main') => void;
}

/**
 * MainScreen Component
 * 
 * For Phase 0, this is a stub showing the basic layout structure.
 * Full panels will be implemented in Phase 1.
 */
export function MainScreen({ onNavigate }: MainScreenProps) {
  const handleBack = () => {
    onNavigate('project-selection');
  };

  const handleImportMedia = async () => {
    if (typeof window !== 'undefined' && window.electron) {
      const files = await window.electron.openFileDialog();
      if (files.length > 0) {
        console.log('Imported files:', files);
        // In Phase 1, this will import media to the library
      }
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-gray-900">
      {/* Top Bar / Menu */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold">ClipForge - Untitled Project</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleImportMedia}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            Import Media
          </button>
          <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm">
            Save Project
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm">
            Export
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Media Library */}
        <div className="w-80 bg-panel-bg border-r border-panel-border p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Media Library</h2>
            <p className="text-sm text-gray-500">Phase 0 - Placeholder</p>
          </div>
          
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-700 rounded-lg">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📁</div>
              <p className="text-sm">No media imported yet</p>
              <button
                onClick={handleImportMedia}
                className="mt-3 text-sm text-blue-500 hover:text-blue-400"
              >
                Import files
              </button>
            </div>
          </div>
        </div>

        {/* Center - Preview and Timeline */}
        <div className="flex flex-1 flex-col">
          {/* Preview Panel */}
          <div className="flex-1 bg-black p-4">
            <div className="h-full flex items-center justify-center bg-gray-900 rounded">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">🎥</div>
                <p>Preview Panel</p>
                <p className="text-sm mt-2">Phase 0 - Placeholder</p>
              </div>
            </div>
          </div>

          {/* Timeline Panel */}
          <div className="h-64 bg-timeline-bg border-t border-gray-700 p-4">
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-gray-400">Timeline</h2>
            </div>
            <div className="h-48 bg-gray-900 rounded border border-gray-700 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-3xl mb-2">🎞️</div>
                <p className="text-sm">Timeline Panel</p>
                <p className="text-xs mt-1">Phase 0 - Placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

