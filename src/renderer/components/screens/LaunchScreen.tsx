/**
 * Launch Screen Component
 * 
 * Initial screen shown when app launches.
 * Displays app branding and option to start new project or continue.
 * 
 * @component
 */

/**
 * Props for LaunchScreen component
 * 
 * @interface LaunchScreenProps
 */
export interface LaunchScreenProps {
  /** Navigation callback to switch screens */
  onNavigate: (screen: 'launch' | 'project-selection' | 'main') => void;
}

/**
 * LaunchScreen Component
 * 
 * Shows the app logo and a "Get Started" button that navigates
 * to the project selection screen.
 */
export function LaunchScreen({ onNavigate }: LaunchScreenProps) {
  const handleGetStarted = () => {
    onNavigate('project-selection');
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="text-center">
        {/* App Logo/Title */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            ClipForge
          </h1>
          <p className="text-xl text-gray-400">AI-First Video Editor</p>
        </div>

        {/* Get Started Button */}
        <button
          onClick={handleGetStarted}
          className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform"
        >
          Get Started
        </button>

        {/* Version info */}
        <p className="mt-8 text-sm text-gray-500">Version 1.0.0</p>
      </div>
    </div>
  );
}

