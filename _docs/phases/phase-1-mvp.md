# Phase 1: MVP Phase

**Minimal, usable version with core features integrated.**

**Duration**: 12-16 hours  
**Goal**: Implement all MVP requirements - import, display, trim, export

**Hard Gate**: Must complete by Tuesday, October 28th at 10:59 PM CT

---

## Deliverables

By the end of this phase, you should have:
- Desktop app that launches
- Video import (drag & drop or file picker)
- Timeline view showing imported clips
- Video preview player
- Trim functionality (set in/out points)
- Export to MP4
- Packaged as native app

---

## Tasks

### 1. Project File Management (2 hours)

#### Implement Project I/O
- **Create project types** (`src/renderer/types/project.ts`)
  - Define Project interface with version, clips, timeline state
  - Define Clip interface with file path, metadata, trim points
  - Add JSON schema validation types

- **Create project service** (`src/main/services/projectIO.ts`)
  - Implement saveProject function (write JSON file)
  - Implement loadProject function (read JSON file)
  - Add file dialog for save/load locations
  - Handle corrupted file errors

- **Add IPC handlers** (`src/main/ipc/handlers.ts`)
  - Add `project:save` handler
  - Add `project:open-dialog` handler
  - Add error handling and validation

#### Implement Project Selection Screen
- **ProjectSelectionScreen component**
  - Wire up "New Project" button to create empty project
  - Wire up "Open Existing Project" to load project file
  - Add error handling for file operations
  - Navigate to MainScreen on successful load

#### Code Example
```typescript
// src/renderer/types/project.ts
/**
 * Project file structure.
 * 
 * Represents a saved ClipForge project including all clips and timeline state.
 */
export interface ProjectFile {
  version: string;
  clips: Clip[];
  timeline: TimelineState;
  metadata: ProjectMetadata;
}

// src/main/services/projectIO.ts
/**
 * Saves project state to a .clipforge file
 * 
 * @param data - Project data to save
 * @param filePath - Destination file path
 * @returns Promise resolving to saved file path
 */
export async function saveProject(data: ProjectFile, filePath: string): Promise<string> {
  // Implementation
}
```

**Acceptance Criteria**:
- [ ] Can create new project
- [ ] Can save project to .clipforge file
- [ ] Can open existing project
- [ ] Error handling for corrupted files

---

### 2. Media Import System (2-3 hours)

#### Implement File Import
- **Create media types** (`src/renderer/types/clip.ts`)
  - Define Clip interface with id, filePath, duration, resolution, metadata
  - Define MediaImportResult type for import operations
  - Add validation types

- **Create thumbnail service** (`src/renderer/services/thumbnailService.ts`)
  - Generate thumbnail from video frame
  - Cache thumbnails to disk
  - Handle thumbnail generation errors

- **Create metadata service** (`src/renderer/services/metadataService.ts`)
  - Extract video duration, resolution, file size
  - Use ffprobe-static for metadata extraction
  - Parse FFmpeg output

- **Create media service** (`src/renderer/services/mediaService.ts`)
  - Implement file validation (format, size)
  - Implement drag-and-drop handler
  - Implement file picker handler
  - Add to media library after import

- **Create MediaLibraryPanel component**
  - Display imported clips with thumbnails
  - Show clip metadata (duration, resolution)
  - Handle clip selection
  - Implement drag to timeline (stub for now)

#### Code Example
```typescript
// src/renderer/services/mediaService.ts
/**
 * Imports a video file into the media library.
 * 
 * Validates file format, generates thumbnail, extracts metadata,
 * and adds clip to the media library.
 * 
 * @param filePath - Path to video file to import
 * @returns Promise resolving to import result with clip data
 */
export async function importVideo(filePath: string): Promise<MediaImportResult> {
  // Validate file
  // Generate thumbnail
  // Extract metadata
  // Create clip object
  // Return result
}
```

**Acceptance Criteria**:
- [ ] Can import video files (MP4, MOV, WebM)
- [ ] Thumbnails are generated and displayed
- [ ] Metadata is extracted and shown
- [ ] Drag and drop works
- [ ] File picker works
- [ ] Unsupported formats show error

---

### 3. Basic Timeline (3-4 hours)

#### Create Timeline Foundation
- **Create timeline types** (`src/renderer/types/timeline.ts`)
  - Define TimelineState with clips, playhead, tracks
  - Define TimelineClip interface
  - Define timeline interaction types

- **Create TimelinePanel component** (`src/renderer/components/panels/TimelinePanel.tsx`)
  - Set up Konva Stage and Layer
  - Render timeline track (horizontal line)
  - Render clips as rectangles on timeline
  - Show playhead indicator
  - Handle mouse click to move playhead

- **Add timeline context** (`src/renderer/contexts/TimelineContext.tsx`)
  - Create context provider
  - Manage timeline state
  - Provide timeline operations (add clip, remove clip, set playhead)
  - Memoize context value

- **Create custom hook** (`src/renderer/hooks/useTimeline.ts`)
  - Wrap TimelineContext access
  - Provide convenient hook for components

#### Code Example
```typescript
// src/renderer/components/panels/TimelinePanel.tsx
/**
 * Timeline Panel Component
 * 
 * Displays and manages the video editing timeline.
 * Uses Konva.js for canvas rendering and drag-drop interactions.
 * 
 * Features:
 * - Visual timeline with playhead
 * - Clip placement and manipulation
 * - Zoom and pan capabilities (Phase 2)
 * 
 * @component
 */
export function TimelinePanel() {
  const timeline = useTimeline();
  
  return (
    <Stage width={800} height={200}>
      <Layer>
        {/* Render timeline track */}
        {/* Render clips */}
        {/* Render playhead */}
      </Layer>
    </Stage>
  );
}
```

**Acceptance Criteria**:
- [ ] Timeline renders with Konva
- [ ] Clips appear as rectangles on timeline
- [ ] Playhead updates on click
- [ ] Timeline state is managed in context
- [ ] Can add clips to timeline (stub for now)

---

### 4. Preview Player (1-2 hours)

#### Create Preview Component
- **Create PreviewPanel component** (`src/renderer/components/panels/PreviewPanel.tsx`)
  - Add HTML5 video element
  - Implement play/pause functionality
  - Update video source when playhead moves
  - Show loading state during video load
  - Display video resolution info

- **Create video controls** (`src/renderer/components/ui/VideoControls.tsx`)
  - Play/pause button
  - Time display (current time / total time)
  - Progress bar (stub for Phase 2)

- **Wire up preview to timeline**
  - Sync playhead position to video currentTime
  - Update preview when clips change
  - Handle video loading errors

#### Code Example
```typescript
// src/renderer/components/panels/PreviewPanel.tsx
/**
 * Preview Panel Component
 * 
 * Displays video preview and controls for playback.
 * Synchronized with timeline playhead position.
 * 
 * @component
 */
export function PreviewPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeline = useTimeline();
  
  // Sync playhead to video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeline.playhead;
    }
  }, [timeline.playhead]);
  
  return (
    <div className="preview-container">
      <video ref={videoRef} controls />
      <VideoControls />
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Video element displays
- [ ] Play/pause works
- [ ] Playhead sync with video works
- [ ] Preview updates when clips change
- [ ] Loading state shown

---

### 5. Trim Functionality (2-3 hours)

#### Implement Clip Trimming
- **Add trim handles to timeline clips**
  - Render trim handles at clip start/end
  - Detect handle drag events
  - Update clip trim points (inPoint, outPoint)
  - Validate trim points (can't exceed clip duration)

- **Update Clip interface with trim points**
  - Add inPoint: number (start of visible clip)
  - Add outPoint: number (end of visible clip)
  - Default to full clip duration

- **Update preview to respect trim points**
  - Seek video to inPoint when clip starts
  - Stop video at outPoint
  - Show trimmed duration

- **Create trim service** (`src/renderer/services/trimService.ts`)
  - Calculate actual trim points
  - Handle trim validation
  - Update clip metadata

#### Code Example
```typescript
// src/renderer/services/trimService.ts
/**
 * Trims a clip by updating its in and out points.
 * 
 * @param clip - Clip to trim
 * @param inPoint - New in point in seconds
 * @param outPoint - New out point in seconds
 * @returns Updated clip with new trim points
 * @throws Error if trim points are invalid
 */
export function trimClip(clip: Clip, inPoint: number, outPoint: number): Clip {
  if (inPoint < 0 || outPoint > clip.duration || inPoint >= outPoint) {
    throw new Error('Invalid trim points');
  }
  
  return { ...clip, inPoint, outPoint };
}
```

**Acceptance Criteria**:
- [ ] Trim handles visible on timeline clips
- [ ] Can drag trim handles
- [ ] Trim points update clip metadata
- [ ] Preview respects trim points
- [ ] Can't create invalid trims (start after end)

---

### 6. Export Functionality (3-4 hours)

#### Implement Video Export
- **Create FFmpeg service** (`src/renderer/services/ffmpegService.ts`)
  - Load FFmpeg on first export
  - Implement encode function
  - Handle export progress
  - Handle export errors

- **Create export modal** (`src/renderer/components/modals/ExportModal.tsx`)
  - Show export options (resolution, output path)
  - Display progress bar during export
  - Show success/error messages
  - Handle cancellation

- **Implement export logic**
  - Get all clips from timeline
  - Apply trim points to clips
  - Concatenate clips with FFmpeg
  - Encode to MP4 format
  - Save to user-selected location

- **Add export progress tracking**
  - Show percentage complete
  - Show estimated time remaining
  - Handle export cancellation

#### Code Example
```typescript
// src/renderer/services/ffmpegService.ts
/**
 * Exports timeline to video file.
 * 
 * Processes all clips on timeline, applies trim points,
 * concatenates clips, and encodes to MP4 format.
 * 
 * @param timeline - Timeline state to export
 * @param options - Export options (resolution, quality, output path)
 * @returns Promise resolving to output file path
 */
export async function exportTimeline(
  timeline: TimelineState,
  options: ExportOptions
): Promise<string> {
  // Load FFmpeg if not loaded
  // Process each clip with trim points
  // Concatenate clips
  // Encode to MP4
  // Save to output path
  // Return file path
}
```

**Acceptance Criteria**:
- [ ] Export button opens modal
- [ ] Can select output path and resolution
- [ ] Export creates MP4 file
- [ ] Progress bar updates during export
- [ ] Success/error messages displayed
- [ ] Clips trimmed correctly in export

---

### 7. Packaging (1-2 hours)

#### Configure electron-builder
- **Update electron-builder.yml**
  - Configure for Windows and Mac
  - Set app icons
  - Configure file associations (.clipforge)
  - Set up code signing (for production)

- **Create package scripts**
  - Add "build" script for production build
  - Add "package" script for creating distributables
  - Add platform-specific build scripts

- **Test packaging**
  - Build production bundle
  - Create installer
  - Test on clean machine
  - Verify file associations work

#### Code Example
```yaml
# electron-builder.yml
appId: com.clipforge.app
productName: ClipForge

files:
  - 'dist/**/*'
  - 'package.json'

win:
  target: 'nsis'
  icon: 'assets/icons/icon.ico'

mac:
  target: 'dmg'
  icon: 'assets/icons/icon.icns'

fileAssociations:
  - ext: 'clipforge'
    name: 'ClipForge Project'
```

**Acceptance Criteria**:
- [ ] Production build succeeds
- [ ] Installer creates correctly
- [ ] App installs and launches
- [ ] .clipforge files open app
- [ ] Icons display correctly

---

## Testing Checklist

### Core Functionality
- [ ] Can create new project
- [ ] Can save project
- [ ] Can open project
- [ ] Can import video files
- [ ] Clips display in media library
- [ ] Can add clip to timeline
- [ ] Can trim clips
- [ ] Preview shows video
- [ ] Can export to MP4
- [ ] App packages successfully

### User Flow
- [ ] Launch → Project Selection → Main Screen
- [ ] Import media → Add to timeline → Trim → Export
- [ ] Save project → Close app → Reopen project

### Error Handling
- [ ] Unsupported file formats show error
- [ ] Corrupted project files handled gracefully
- [ ] Export failures show error message
- [ ] Missing files show error

---

## MVP Success Criteria

**MVP is complete when all of these work:**
- ✅ Desktop app launches
- ✅ Can import video files (MP4/MOV/WebM)
- ✅ Timeline shows imported clips
- ✅ Preview player displays video
- ✅ Can trim clips on timeline
- ✅ Can export timeline to MP4
- ✅ App is packaged as native app
- ✅ No crashes or blocking bugs

**This fulfills the MVP requirement deadline.**

---

## Common Issues

### Issue: FFmpeg WASM loads slowly
**Solution**: Load FFmpeg only on first export, show loading indicator

### Issue: Timeline clips not rendering
**Solution**: Check Konva setup, verify clip data structure

### Issue: Export fails silently
**Solution**: Add error logging, validate FFmpeg installation

### Issue: Preview not syncing with playhead
**Solution**: Check video ref updates, verify timeline state

### Issue: Packaging fails
**Solution**: Check electron-builder config, verify file paths

---

## Next Steps

After completing Phase 1 (MVP), proceed to **Phase 2: Core Features** to implement:
- Screen and webcam recording
- Split clips functionality
- Multiple timeline tracks
- Advanced preview controls
- Welcome screen (post-MVP)

