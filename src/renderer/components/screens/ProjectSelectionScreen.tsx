/**
 * Project Selection Screen Component
 * 
 * Allows user to choose between creating a new project or opening an existing one.
 * Shows two main options with visual cards.
 * 
 * @component
 */

/**
 * Props for ProjectSelectionScreen component
 * 
 * @interface ProjectSelectionScreenProps
 */
export interface ProjectSelectionScreenProps {
  /** Navigation callback to switch screens */
  onNavigate: (
    screen: 'launch' | 'project-selection' | 'main',
    project?: import('@/types/project').ProjectFile | null,
    filePath?: string | null
  ) => void;
}

/**
 * ProjectSelectionScreen Component
 * 
 * Displays options to create a new project or open an existing one.
 * For Phase 0, both options navigate directly to the main screen.
 */
export function ProjectSelectionScreen({ onNavigate }: ProjectSelectionScreenProps) {
  const handleNewProject = () => {
    // Create new project - pass null to indicate new project
    onNavigate('main', null, null);
  };

  const handleOpenProject = async () => {
    // Open file dialog and load project
    if (typeof window !== 'undefined' && window.electron) {
      const projectPath = await window.electron.openProjectDialog();
      if (projectPath) {
        try {
          // Load the project file
          const result = await window.electron.loadProject(projectPath);
          if (result.success && result.data) {
            console.log('Project loaded successfully:', projectPath);
            // Parse dates from strings (JSON serialization converts dates to strings)
            const projectData = result.data as any;
            if (projectData.metadata) {
              projectData.metadata.createdAt = new Date(projectData.metadata.createdAt);
              projectData.metadata.modifiedAt = new Date(projectData.metadata.modifiedAt);
            }
            if (projectData.clips) {
              projectData.clips = projectData.clips.map((clip: any) => ({
                ...clip,
                importedAt: new Date(clip.importedAt),
              }));
            }
            // Navigate to main screen with loaded project
            onNavigate('main', projectData, projectPath);
          } else {
            console.error('Failed to load project:', result.error);
            alert(`Failed to load project: ${result.error}`);
          }
        } catch (error) {
          console.error('Error loading project:', error);
          alert('Failed to load project. Please try again.');
        }
      }
    }
  };

  const handleBack = () => {
    onNavigate('launch');
  };

  return (
    <div className="flex h-full w-full flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <button
          onClick={handleBack}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-semibold">Choose Project</h2>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="grid grid-cols-2 gap-8 max-w-4xl w-full">
          {/* New Project Card */}
          <button
            onClick={handleNewProject}
            className="group relative p-8 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 rounded-xl hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/20 hover:scale-105"
          >
            <div className="text-center">
              <div className="mb-4 text-6xl">🎬</div>
              <h3 className="text-2xl font-bold mb-2">New Project</h3>
              <p className="text-gray-400">Start with a blank canvas</p>
            </div>
          </button>

          {/* Open Existing Project Card */}
          <button
            onClick={handleOpenProject}
            className="group relative p-8 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 rounded-xl hover:border-purple-500 transition-all hover:shadow-xl hover:shadow-purple-500/20 hover:scale-105"
          >
            <div className="text-center">
              <div className="mb-4 text-6xl">📂</div>
              <h3 className="text-2xl font-bold mb-2">Open Project</h3>
              <p className="text-gray-400">Continue where you left off</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

