/**
 * Recording Controls Component
 * 
 * Displays device selectors, audio toggle, and recording start/stop buttons.
 */

import { RecordingMode } from '@/contexts/RecordingContext';

export interface RecordingControlsProps {
  mode: RecordingMode;
  isRecording: boolean;
  audioEnabled: boolean;
  statusMessage?: string;
  
  // Devices
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
  selectedVideoDeviceId?: string;
  selectedAudioDeviceId?: string;
  selectedSourceId?: string;
  
  // Handlers
  onToggleAudio: () => void;
  onSelectVideoDevice: (deviceId: string) => void;
  onSelectAudioDevice: (deviceId: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancel: () => void;
}

export function RecordingControls({
  mode,
  isRecording,
  audioEnabled,
  statusMessage,
  videoDevices,
  audioDevices,
  selectedVideoDeviceId,
  selectedAudioDeviceId,
  selectedSourceId,
  onToggleAudio,
  onSelectVideoDevice,
  onSelectAudioDevice,
  onStartRecording,
  onStopRecording,
  onCancel,
}: RecordingControlsProps) {
  return (
    <div className="px-6 py-4 bg-gray-800 border-t border-gray-700">
      <div className="flex items-center justify-between max-w-5xl mx-auto gap-4">
        {/* Left Side - Device Selection & Audio Toggle */}
        <div className="flex items-center gap-3">
          {/* Video Device Selector (for webcam/pip modes) */}
          {(mode === 'webcam' || mode === 'pip') && videoDevices.length > 0 && !isRecording && (
            <div className="flex flex-col">
              <label className="text-xs text-gray-400 mb-1">Camera</label>
              <select
                value={selectedVideoDeviceId || ''}
                onChange={(e) => onSelectVideoDevice(e.target.value)}
                className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm focus:outline-none focus:border-blue-500"
              >
                {videoDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Audio Device Selector */}
          {audioDevices.length > 0 && !isRecording && audioEnabled && (
            <div className="flex flex-col">
              <label className="text-xs text-gray-400 mb-1">Microphone</label>
              <select
                value={selectedAudioDeviceId || ''}
                onChange={(e) => onSelectAudioDevice(e.target.value)}
                className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm focus:outline-none focus:border-blue-500"
              >
                {audioDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Audio Toggle */}
          <button
            onClick={onToggleAudio}
            disabled={isRecording}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              audioEnabled
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {audioEnabled ? '🎤 Audio On' : '🔇 Audio Off'}
          </button>
        </div>
        
        {/* Recording Control */}
        <div className="flex items-center gap-4">
          {isRecording ? (
            <button
              onClick={onStopRecording}
              className="px-8 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 transition-colors"
            >
              ⏹ Stop Recording
            </button>
          ) : (
            <button
              onClick={onStartRecording}
              disabled={(mode === 'screen' || mode === 'pip') && !selectedSourceId}
              className="px-8 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              ⏺ Start Recording
            </button>
          )}
          
          <button
            onClick={onCancel}
            className="px-6 py-4 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
        
        {/* Status Message */}
        <div className="w-48 text-right">
          {statusMessage && (
            <p className="text-sm text-gray-400">{statusMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}

