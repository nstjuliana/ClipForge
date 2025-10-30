/**
 * Source Selector Component
 * 
 * Displays available screen/window sources for recording.
 */

import { DesktopCapturerSource } from '@/contexts/RecordingContext';

export interface SourceSelectorProps {
  sources: DesktopCapturerSource[];
  selectedSourceId?: string;
  isLoading: boolean;
  onSourceSelect: (sourceId: string) => void;
  title?: string;
}

export function SourceSelector({
  sources,
  selectedSourceId,
  isLoading,
  onSourceSelect,
  title = 'Select a screen or window to record',
}: SourceSelectorProps) {
  if (isLoading) {
    return (
      <div className="text-center text-gray-400">
        Loading available sources...
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="text-center text-gray-400">
        No sources available. Please check permissions.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-2xl font-semibold text-white mb-6 text-center">
        {title}
      </h3>
      <div className="grid grid-cols-3 gap-6 mt-8">
        {sources.map(source => (
          <button
            key={source.id}
            onClick={() => onSourceSelect(source.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedSourceId === source.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            {source.thumbnail && (
              <img
                src={source.thumbnail}
                alt={source.name}
                className="w-full h-56 object-contain rounded mb-3"
              />
            )}
            <p className="text-white text-sm font-medium text-center truncate">
              {source.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

