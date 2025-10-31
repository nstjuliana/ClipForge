/**
 * Mode Selector Component
 * 
 * Allows users to choose between screen, webcam, or PiP recording modes.
 */

import { RecordingMode } from '@/contexts/RecordingContext';

export interface ModeSelectorProps {
  mode: RecordingMode;
  onModeChange: (mode: RecordingMode) => void;
  disabled?: boolean;
}

export function ModeSelector({ mode, onModeChange, disabled = false }: ModeSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-4 px-6 py-4 bg-gray-800/50 border-b border-gray-700">
      <button
        onClick={() => onModeChange('screen')}
        disabled={disabled}
        className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          mode === 'screen'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        🖥️ Screen
      </button>
      <button
        onClick={() => onModeChange('webcam')}
        disabled={disabled}
        className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          mode === 'webcam'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        📹 Webcam
      </button>
      <button
        onClick={() => onModeChange('pip')}
        disabled={disabled}
        className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          mode === 'pip'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        📺 Screen + Webcam
      </button>
    </div>
  );
}

