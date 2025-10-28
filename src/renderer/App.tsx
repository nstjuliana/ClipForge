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

  /**
   * Navigate to a different screen
   * @param screen - The screen to navigate to
   */
  const handleNavigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-white overflow-hidden">
      {currentScreen === 'launch' && <LaunchScreen onNavigate={handleNavigate} />}
      {currentScreen === 'project-selection' && (
        <ProjectSelectionScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'main' && <MainScreen onNavigate={handleNavigate} />}
    </div>
  );
}

