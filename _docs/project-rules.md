# Project Rules

**ClipForge - AI-First Codebase Standards**

This document defines the directory structure, file naming conventions, coding standards, and best practices for building an AI-friendly, maintainable codebase.

---

## Core Principles

### AI-First Development
- **Modular architecture**: Each module has a single, well-defined responsibility
- **Explicit naming**: Names should be self-documenting (no abbreviations unless industry standard)
- **Comprehensive documentation**: Every file, function, and complex logic block is documented
- **Navigable structure**: File organization makes it easy for AI to understand relationships
- **Reasonable file size**: Files should not exceed 500 lines (split if larger)

### Code Readability
- **Descriptive naming**: Function and variable names explain their purpose
- **Top-level documentation**: Every file starts with a docblock explaining its purpose
- **Function documentation**: All functions have JSDoc/TSDoc comments
- **Organized imports**: Group imports by source (Node modules, local files, types)
- **Consistent formatting**: Use Prettier and ESLint for consistency

---

## Directory Structure

```
ClipForge/
├── .vscode/                    # IDE settings (optional)
├── dist/                       # Build output (git-ignored)
├── out/                        # Electron packaged apps (git-ignored)
├── src/
│   ├── main/                   # Electron main process
│   │   ├── index.ts           # Main entry point
│   │   ├── app.ts             # App lifecycle management
│   │   ├── window.ts          # Window creation and management
│   │   ├── ipc/               # IPC handlers
│   │   │   ├── handlers.ts    # All IPC message handlers
│   │   │   └── types.ts       # IPC type definitions
│   │   ├── services/          # Main process services
│   │   │   ├── ffmpeg.ts      # FFmpeg wrapper (Node.js)
│   │   │   ├── fileWatcher.ts # File system watchers
│   │   │   └── projectIO.ts   # Project save/load operations
│   │   └── utils/             # Main process utilities
│   │       ├── logger.ts
│   │       └── errors.ts
│   │
│   ├── preload/               # Preload scripts (security bridge)
│   │   ├── index.ts          # Main preload script
│   │   └── types.ts          # Exposed API types
│   │
│   ├── renderer/             # React renderer process (frontend)
│   │   ├── index.html        # HTML entry point
│   │   ├── main.tsx          # React entry point
│   │   ├── App.tsx           # Root component
│   │   │
│   │   ├── components/       # React components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   │   ├── button/
│   │   │   │   ├── slider/
│   │   │   │   └── ...
│   │   │   ├── screens/      # Top-level screens
│   │   │   │   ├── LaunchScreen.tsx
│   │   │   │   ├── ProjectSelectionScreen.tsx
│   │   │   │   ├── WelcomeScreen.tsx (post-MVP)
│   │   │   │   └── MainScreen.tsx
│   │   │   ├── panels/       # Main screen panels
│   │   │   │   ├── MediaLibraryPanel.tsx
│   │   │   │   ├── PreviewPanel.tsx
│   │   │   │   └── TimelinePanel.tsx
│   │   │   ├── recording/    # Recording screen components
│   │   │   │   ├── RecordingScreen.tsx
│   │   │   │   ├── RecordingControls.tsx
│   │   │   │   └── SourceSelector.tsx
│   │   │   └── modals/       # Modal dialogs
│   │   │       ├── ExportModal.tsx
│   │   │       ├── SaveProjectModal.tsx
│   │   │       └── ErrorModal.tsx
│   │   │
│   │   ├── contexts/         # React Context providers
│   │   │   ├── MediaContext.tsx
│   │   │   ├── TimelineContext.tsx
│   │   │   ├── ProjectContext.tsx
│   │   │   └── RecordingContext.tsx
│   │   │
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── useMedia.ts
│   │   │   ├── useTimeline.ts
│   │   │   ├── useProject.ts
│   │   │   ├── useFFmpeg.ts
│   │   │   └── useRecording.ts
│   │   │
│   │   ├── services/         # Renderer process services
│   │   │   ├── ffmpegService.ts    # FFmpeg WASM integration
│   │   │   ├── mediaService.ts     # Media file operations
│   │   │   ├── thumbnailService.ts  # Thumbnail generation
│   │   │   └── metadataService.ts  # Video metadata extraction
│   │   │
│   │   ├── stores/           # State stores (if using Zustand fallback)
│   │   │   ├── mediaStore.ts
│   │   │   └── timelineStore.ts
│   │   │
│   │   ├── types/            # TypeScript type definitions
│   │   │   ├── clip.ts       # Clip interface
│   │   │   ├── timeline.ts   # Timeline state types
│   │   │   ├── project.ts   # Project file types
│   │   │   ├── ffmpeg.ts    # FFmpeg-related types
│   │   │   └── index.ts     # Re-export all types
│   │   │
│   │   ├── utils/            # Utility functions
│   │   │   ├── time.ts      # Timecode formatting
│   │   │   ├── file.ts      # File path utilities
│   │   │   ├── video.ts     # Video-related utilities
│   │   │   └── validation.ts # Data validation
│   │   │
│   │   └── constants/        # App-wide constants
│   │       ├── paths.ts
│   │       ├── formats.ts
│   │       └── ui.ts
│   │
│   └── assets/                # Static assets
│       ├── icons/
│       ├── images/
│       └── fonts/
│
├── _docs/                     # Project documentation
│   ├── phases/               # Phase-specific documentation
│   ├── project-overview.md
│   ├── user-flow.md
│   ├── tech-stack.md
│   ├── project-rules.md
│   ├── ui-rules.md (to be created)
│   └── theme-rules.md (to be created)
│
├── .gitignore
├── electron-builder.yml       # electron-builder configuration
├── package.json
├── tsconfig.json             # TypeScript configuration
├── tsconfig.main.json        # Main process TS config
├── tsconfig.renderer.json    # Renderer process TS config
├── vite.config.ts            # Vite configuration
└── tailwind.config.js        # Tailwind CSS configuration
```

---

## File Naming Conventions

### General Rules
- **PascalCase**: React components, TypeScript interfaces/types (`MediaLibrary.tsx`, `Clip.ts`)
- **camelCase**: Functions, variables, hooks (`generateThumbnail.ts`, `useMedia.ts`)
- **kebab-case**: CSS files, HTML files (`main.css`, `index.html`)
- **SCREAMING_SNAKE_CASE**: Constants (`EXPORT_FORMATS`, `MAX_FILE_SIZE`)
- **Descriptive names**: No abbreviations unless industry standard (API, HTML, URL, etc.)
- **File extensions**: Always include extensions in imports (`.ts`, `.tsx`, `.js`)

### Component Files
```typescript
// ✅ Good
MediaLibrary.tsx
TimelineClip.tsx
ExportModal.tsx

// ❌ Bad
ML.tsx
Timeline.tsx (too generic)
export.tsx
```

### Service Files
```typescript
// ✅ Good
ffmpegService.ts
thumbnailService.ts
projectService.ts

// ❌ Bad
ffmpeg.ts (too generic, conflicts with package)
thumbnail.ts
```

### Hook Files
```typescript
// ✅ Good
useMedia.ts
useTimeline.ts
useExportProgress.ts

// ❌ Bad
useTimelineState.ts (redundant - hooks already imply state)
media.ts (missing 'use' prefix)
```

---

## Code Organization Rules

### File Header Documentation
Every file MUST start with a docblock explaining its purpose:

```typescript
/**
 * MediaLibraryPanel Component
 * 
 * Displays the media library with imported video clips.
 * Shows thumbnails, metadata, and handles drag-and-drop to timeline.
 * 
 * @component
 * @requires MediaContext - For accessing imported media
 * @requires @dnd-kit/core - For drag-and-drop functionality
 */
```

### Function Documentation
All functions MUST have JSDoc/TSDoc comments:

```typescript
/**
 * Generates a thumbnail for a video file.
 * 
 * Uses FFmpeg to extract a frame at the specified time and save it as a JPEG.
 * The thumbnail is cached on disk for subsequent access.
 * 
 * @param filePath - Absolute path to the video file
 * @param timestamp - Time in seconds to extract frame from (default: 0)
 * @returns Promise resolving to the thumbnail file path, or null on failure
 * @throws Error if FFmpeg is not loaded or file cannot be processed
 * 
 * @example
 * const thumbnail = await generateThumbnail('/path/to/video.mp4', 5.0);
 * console.log(thumbnail); // '/cache/thumbnails/video-5.jpg'
 */
async function generateThumbnail(
  filePath: string,
  timestamp: number = 0
): Promise<string | null> {
  // Implementation
}
```

### Import Organization
Group imports in this order:

1. External Node modules
2. Internal imports (components, services)
3. Types/interfaces
4. Constants and utilities

```typescript
// 1. External
import React, { useState, useEffect } from 'react';
import { Stage, Layer, Rect } from 'konva';

// 2. Internal Components
import { MediaLibraryPanel } from '@/components/panels/MediaLibraryPanel';
import { PreviewPanel } from '@/components/panels/PreviewPanel';

// 3. Types
import type { Clip } from '@/types/clip';
import type { TimelineState } from '@/types/timeline';

// 4. Utilities
import { formatTimecode } from '@/utils/time';
import { VALID_VIDEO_FORMATS } from '@/constants/formats';
```

### Component Structure
Follow this order inside React components:

```typescript
/**
 * Component documentation
 */
export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // 1. Hooks (React hooks first, then custom hooks)
  const [state, setState] = useState();
  const media = useMedia();
  const timeline = useTimeline();
  
  // 2. Computed values / derived state
  const filteredClips = useMemo(() => ..., []);
  
  // 3. Event handlers
  const handleClick = useCallback(() => {}, []);
  
  // 4. Effects
  useEffect(() => {}, []);
  
  // 5. Render helpers
  const renderClip = (clip: Clip) => { ... };
  
  // 6. Return JSX
  return (
    <div>...</div>
  );
}
```

---

## TypeScript Conventions

### Type Definitions
- **Interfaces** for object shapes (`interface Clip {}`)
- **Types** for unions, intersections, and computed types (`type ExportFormat = 'mp4' | 'webm'`)
- **Never use `any`** - use `unknown` if truly unknown
- **Always export types** for reuse across files

```typescript
/**
 * Represents a video clip in the media library and timeline.
 * 
 * @interface Clip
 */
export interface Clip {
  /** Unique identifier for the clip */
  id: string;
  
  /** File path on local system */
  filePath: string;
  
  /** Duration in seconds */
  duration: number;
  
  /** Resolution as [width, height] */
  resolution: [number, number];
  
  /** In-point in seconds (for trimming) */
  inPoint: number;
  
  /** Out-point in seconds (for trimming) */
  outPoint: number;
  
  /** Thumbnail file path */
  thumbnailPath?: string;
}
```

### Type File Organization
- One interface/type per domain (not one giant `types.ts`)
- Group related types in the same file
- Export from `types/index.ts` for easy imports

```typescript
// types/clip.ts
export interface Clip { ... }
export interface ClipMetadata { ... }

// types/index.ts
export type { Clip, ClipMetadata } from './clip';
export type { TimelineState } from './timeline';
export type { ProjectFile } from './project';
```

---

## React Component Rules

### Component Props
Always define props as a separate interface:

```typescript
/**
 * Props for MediaLibraryPanel component
 * 
 * @interface MediaLibraryPanelProps
 */
export interface MediaLibraryPanelProps {
  /** Callback when a clip is selected */
  onClipSelect?: (clipId: string) => void;
  
  /** Whether to show thumbnails (default: true) */
  showThumbnails?: boolean;
  
  /** Maximum number of clips to display */
  maxClips?: number;
}

/**
 * MediaLibraryPanel Component
 * 
 * Component description here...
 */
export function MediaLibraryPanel({ 
  onClipSelect,
  showThumbnails = true,
  maxClips = 50
}: MediaLibraryPanelProps) {
  // Implementation
}
```

### Component Size Limit
- **Single responsibility**: Each component does one thing
- **500 line limit**: Split components that exceed this limit
- **Extract sub-components**: Create smaller, focused components
- **Extract hooks**: Move complex logic to custom hooks

```typescript
// ✅ Good - Split large component
// MediaLibraryPanel.tsx (main component)
export function MediaLibraryPanel() {
  // ...
}

// ClipThumbnail.tsx (sub-component)
export function ClipThumbnail({ clip }: ClipThumbnailProps) {
  // ...
}

// ❌ Bad - One giant component
export function MediaLibraryPanel() {
  // 600 lines of mixed concerns
}
```

### Memoization Rules
- Use `React.memo()` for expensive components (timeline, media library)
- Use `useMemo()` for expensive computations
- Use `useCallback()` for functions passed to child components
- Don't over-memoize (measure first, optimize second)

```typescript
// ✅ Good
export const TimelineClip = React.memo(function TimelineClip({ clip }: Props) {
  // ...
});

// ❌ Bad - Memoizing simple components
export const Header = React.memo(function Header({ title }: Props) {
  return <h1>{title}</h1>;
});
```

---

## Context API Rules

### Context Structure
- **Separate contexts** by domain (Media, Timeline, Project)
- **Memoize context values** to prevent unnecessary re-renders
- **Custom hooks** to access contexts
- **No deep nesting** of providers

```typescript
// ✅ Good - Separate contexts
const MediaContext = createContext<MediaContextType | null>(null);
const TimelineContext = createContext<TimelineContextType | null>(null);

// ✅ Good - Memoized provider value
function MediaProvider({ children }: Props) {
  const [clips, setClips] = useState<Clip[]>([]);
  
  const value = useMemo(() => ({
    clips,
    addClip,
    removeClip,
  }), [clips]);
  
  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

// Custom hook
export function useMedia() {
  const context = useContext(MediaContext);
  if (!context) throw new Error('useMedia must be used within MediaProvider');
  return context;
}
```

### Context Limitations
- **Don't put playhead position in context** (updates too frequently)
- **Don't put all app state in one context** (causes re-renders)
- **Keep context values stable** (use refs for frequently updated values)

```typescript
// ✅ Good - Keep playhead in local state
const [playhead, setPlayhead] = useState(0);

// ❌ Bad - Playhead in context
const TimelineContext = createContext({ playhead: 0 });
```

---

## IPC Communication Rules

### Preload Script
- **Define exposed API** in TypeScript types
- **Validate all IPC messages** before executing
- **Use structured cloning** for data transfer
- **Error handling** for all IPC operations

```typescript
// preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

interface ElectronAPI {
  openFileDialog: () => Promise<string[]>;
  saveProject: (data: ProjectData) => Promise<void>;
  exportVideo: (options: ExportOptions) => Promise<string>;
}

const api: ElectronAPI = {
  openFileDialog: () => ipcRenderer.invoke('file:open-dialog'),
  saveProject: (data) => ipcRenderer.invoke('project:save', data),
  exportVideo: (options) => ipcRenderer.invoke('video:export', options),
};

contextBridge.exposeInMainWorld('electron', api);

export type { ElectronAPI };
```

### Main Process Handlers
- **Organize by domain** (project, file, video, etc.)
- **Type all IPC messages** with TypeScript
- **Handle errors gracefully**
- **Validate input data**

```typescript
// main/ipc/handlers.ts
import { ipcMain } from 'electron';
import type { ExportOptions } from '../types';

export function registerIPCHandlers() {
  ipcMain.handle('video:export', async (event, options: ExportOptions) => {
    try {
      validateExportOptions(options);
      const outputPath = await exportVideo(options);
      return { success: true, outputPath };
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error: error.message };
    }
  });
}
```

---

## File Size Management

### 500 Line Rule
Files must not exceed 500 lines. Split if larger.

**Strategies for splitting:**
1. **Extract sub-components** from large components
2. **Extract custom hooks** from complex components
3. **Split service files** by functionality (e.g., `ffmpegService.ts`, `ffmpegUtils.ts`)
4. **Separate types** into domain-specific files

### Example: Splitting a Large Component

```typescript
// TimelinePanel.tsx (350 lines) - OK
// But if it grows to 600 lines:

// Split into:
// - TimelinePanel.tsx (main component, 200 lines)
// - TimelineTrack.tsx (track rendering, 150 lines)
// - TimelineClip.tsx (clip rendering, 100 lines)
// - useTimelineDragDrop.ts (custom hook, 100 lines)
```

---

## Constants and Configuration

### Constant Files
- **Group by purpose** (formats, paths, UI, etc.)
- **Use SCREAMING_SNAKE_CASE**
- **Add JSDoc comments** explaining values
- **Export from dedicated files**

```typescript
// constants/formats.ts
/**
 * Supported video file formats for import
 */
export const VALID_VIDEO_FORMATS = ['mp4', 'mov', 'webm'] as const;

/**
 * Export format options
 */
export type ExportFormat = 'mp4' | 'webm' | 'mov';
export const EXPORT_FORMATS: ExportFormat[] = ['mp4', 'webm', 'mov'];

/**
 * Maximum file size for import (in MB)
 */
export const MAX_FILE_SIZE_MB = 500;

/**
 * Maximum project duration (in minutes)
 */
export const MAX_PROJECT_DURATION_MINUTES = 60;
```

---

## Error Handling

### Error Boundaries
- **Use React error boundaries** for component-level errors
- **Log all errors** to console and optionally to file
- **Show user-friendly messages** for recoverable errors
- **Graceful degradation** for non-critical errors

```typescript
// ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component error:', error, errorInfo);
    // Log to file or error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.resetError} />;
    }
    return this.props.children;
  }
}
```

### Service Error Handling
```typescript
/**
 * FFmpeg Service
 * 
 * Handles video encoding and export operations.
 * All functions return Result types for error handling.
 */
export class FFmpegService {
  /**
   * Export video from timeline to MP4
   * 
   * @returns Result type - check .success before using .data
   */
  async exportVideo(options: ExportOptions): Promise<Result<string>> {
    try {
      const outputPath = await this.encode(options);
      return { success: true, data: outputPath };
    } catch (error) {
      return { success: false, error: this.formatError(error) };
    }
  }
}
```

---

## Testing Conventions (Future)

### Test Organization
```
src/
├── renderer/
│   ├── components/
│   │   └── __tests__/
│   │       └── MediaLibraryPanel.test.tsx
│   └── services/
│       └── __tests__/
│           └── ffmpegService.test.ts
```

### Test Naming
- **Descriptive test names** explaining what is being tested
- **Arrange-Act-Assert** pattern
- **Mock external dependencies**

```typescript
// MediaLibraryPanel.test.tsx
describe('MediaLibraryPanel', () => {
  it('should render thumbnails for all imported clips', () => {
    // Arrange
    const clips = createMockClips(3);
    
    // Act
    render(<MediaLibraryPanel clips={clips} />);
    
    // Assert
    expect(screen.getAllByRole('img')).toHaveLength(3);
  });
});
```

---

## Git Commit Conventions

### Commit Message Format
```
type(scope): short description

Longer description if needed
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Build/maintenance

**Examples:**
```
feat(timeline): add trim functionality to clips
fix(export): handle FFmpeg errors gracefully
docs(readme): add setup instructions
refactor(media): extract thumbnail generation to service
```

---

## Summary Checklist

### Before Committing Code
- [ ] File has header documentation explaining purpose
- [ ] All functions have JSDoc/TSDoc comments
- [ ] File does not exceed 500 lines
- [ ] Types properly defined (no `any`)
- [ ] Imports organized correctly
- [ ] Component structure follows conventions
- [ ] Error handling implemented
- [ ] No console.log statements (use logger utility)

### Code Quality
- [ ] Self-documenting names
- [ ] Single responsibility per file
- [ ] Proper TypeScript types
- [ ] Comments explain *why*, not *what*
- [ ] Consistent formatting (Prettier)
- [ ] No linting errors (ESLint)

### Architecture
- [ ] Separation of concerns (main vs renderer)
- [ ] Services modular and reusable
- [ ] Context usage appropriate (not overused)
- [ ] IPC handlers properly organized
- [ ] Constants in dedicated files

---

## Additional Notes

### AI Tool Compatibility
- **Descriptive names** help AI understand code structure
- **Comprehensive docs** improve AI suggestions
- **Modular files** allow AI to focus on specific areas
- **Consistent patterns** make code predictable for AI
- **Type information** helps AI provide accurate suggestions

### Performance Considerations
- **Memoize expensive components** (timeline, media library)
- **Lazy load FFmpeg** (don't block app startup)
- **Generate thumbnails asynchronously**
- **Clean up resources** (event listeners, video elements)
- **Virtualize long lists** (media library with 100+ clips)

### Security Best Practices
- **Always use preload scripts** for IPC
- **Never expose Node.js APIs** to renderer
- **Validate all IPC messages**
- **Sanitize file paths** before use
- **Handle permissions gracefully**

---

This document is a living guide. Update it as patterns emerge during development.

