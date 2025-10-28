/**
 * Root Application Component
 * 
 * Handles top-level routing and screen navigation.
 * Manages app state transitions between Project Selection and Main screens.
 */

import React, { useState } from 'react';
import { ProjectSelectionScreen } from './components/screens/ProjectSelectionScreen';
import { MainScreen } from './components/screens/MainScreen';

/**
 * Screen navigation type for app state.
 */
export type ScreenType = 'project-selection' | 'main';

/**
 * Root App Component
 * 
 * Manages top-level screen routing using simple state-based navigation.
 * This will be expanded in Phase 1 to include actual functionality.
 */
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('project-selection');

  return (
    <div className="h-screen w-screen bg-gray-900 text-white">
      {currentScreen === 'project-selection' && (
        <ProjectSelectionScreen onNavigate={setCurrentScreen} />
      )}
      {currentScreen === 'main' && <MainScreen onNavigate={setCurrentScreen} />}
    </div>
  );
}

