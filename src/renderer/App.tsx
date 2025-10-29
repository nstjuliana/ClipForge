/**
 * Root Application Component
 * 
 * Handles top-level routing and screen navigation.
 * Manages app state transitions between Launch, Project Selection, and Main screens.
 * 
 * @component
 */
import { useState } from 'react';
import { LaunchScreen } from './components/screens/LaunchScreen.tsx';
import { ProjectSelectionScreen } from './components/screens/ProjectSelectionScreen.tsx';
import { MainScreen } from './components/screens/MainScreen.tsx';
import type { ProjectFile } from './types/project';

/**
 * Screen type definition for routing
 */
type ScreenType = 'launch' | 'project-selection' | 'main';

/**
 * App Component
 * 
 * Root component that manages screen navigation.
 * Uses simple state-based routing for MVP.
 */
export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('launch');
  const [loadedProject, setLoadedProject] = useState<ProjectFile | null>(null);
  const [projectFilePath, setProjectFilePath] = useState<string | null>(null);

  /**
   * Navigate to a different screen
   * @param screen - The screen to navigate to
   * @param project - Optional project data to pass to main screen
   * @param filePath - Optional project file path
   */
  const handleNavigate = (
    screen: ScreenType,
    project?: ProjectFile | null,
    filePath?: string | null
  ) => {
    if (project !== undefined) {
      setLoadedProject(project);
    }
    if (filePath !== undefined) {
      setProjectFilePath(filePath);
    }
    setCurrentScreen(screen);
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-white overflow-hidden">
      {currentScreen === 'launch' && <LaunchScreen onNavigate={handleNavigate} />}
      {currentScreen === 'project-selection' && (
        <ProjectSelectionScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'main' && (
        <MainScreen 
          onNavigate={handleNavigate}
          loadedProject={loadedProject}
          projectFilePath={projectFilePath}
        />
      )}
    </div>
  );
}

