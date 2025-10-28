# Phase 2: Core Features

**Enhanced functionality building on MVP foundation.**

**Duration**: 10-14 hours  
**Goal**: Implement recording, split clips, multiple tracks, and advanced timeline features

---

## Deliverables

By the end of this phase, you should have:
- Screen recording functionality
- Webcam recording functionality  
- Split clips at playhead
- Multiple timeline tracks (at least 2)
- Timeline zoom and pan
- Advanced preview controls
- Better error handling and user feedback

---

## Tasks

### 1. Recording System (4-5 hours)

#### Screen Recording Implementation
- **Create RecordingContext** (`src/renderer/contexts/RecordingContext.tsx`)
  - Manage recording state (isRecording, duration, sources)
  - Handle permission requests
  - Start/stop recording functions

- **Create RecordingScreen** (`src/renderer/components/screens/RecordingScreen.tsx`)
  - Display available recording sources (screens, windows)
  - Show live preview (or source selection)
  - Record button, Stop button, timer display
  - Handle user selection of screen/window

- **Implement MediaRecorder API**
  - Use Electron's `desktopCapturer` for screen sources
  - Use `navigator.mediaDevices.getUserMedia()` for screen capture
  - Handle audio capture
  - Save recording chunks to file

- **Integrate with timeline**
  - Save recording on stop
  - Add to media library automatically
  - Add to timeline end automatically

#### Webcam Recording
- **Create webcam recording mode**
  - Use `navigator.mediaDevices.getUserMedia()` for camera
  - Show live preview
  - Record with audio
  - Save to timeline

#### Simultaneous Recording (Picture-in-Picture)
- **Implement PiP mode**
  - Record screen and webcam simultaneously
  - Overlay webcam on screen recording
  - Combine streams
  - Save combined recording

#### Code Example
```typescript
// src/renderer/services/recordingService.ts
/**
 * Records screen capture using MediaRecorder API.
 * 
 * @param sourceId - Screen/window source ID from desktopCapturer
 * @param audioEnabled - Whether to record audio
 * @returns Promise resolving to recorded video file path
 */
export async function recordScreen(
  sourceId: string,
  audioEnabled: boolean = true
): Promise<string> {
  // Get display media
  // Create MediaRecorder
  // Record to file
  // Return file path
}
```

**Acceptance Criteria**:
- [ ] Can select screen/window to record
- [ ] Can start and stop screen recording
- [ ] Recording saves to timeline
- [ ] Webcam recording works
- [ ] PiP mode records both sources
- [ ] Audio capture works

---

### 2. Split Clips Feature (1-2 hours)

#### Implement Split Functionality
- **Add split button to timeline controls**
  - Create split button component
  - Position button relative to playhead
  - Enable only when playhead is over a clip

- **Implement split logic**
  - Detect clip containing playhead position
  - Calculate split point relative to clip
  - Create two new clips from original
  - Update timeline state

- **Update timeline rendering**
  - Show split preview (visual indicator)
  - Update clip display after split
  - Maintain clip order

#### Code Example
```typescript
// src/renderer/services/clipService.ts
/**
 * Splits a clip at the specified playhead position.
 * 
 * Creates two new clips from the original, maintaining
 * trim points and metadata.
 * 
 * @param clip - Clip to split
 * @param splitTime - Position in seconds to split
 * @returns Array of two new clips
 */
export function splitClip(clip: Clip, splitTime: number): [Clip, Clip] {
  const firstClip: Clip = {
    ...clip,
    outPoint: splitTime,
  };
  
  const secondClip: Clip = {
    ...clip,
    inPoint: splitTime,
    outPoint: clip.outPoint,
  };
  
  return [firstClip, secondClip];
}
```

**Acceptance Criteria**:
- [ ] Split button appears when playhead over clip
- [ ] Can split clip at playhead
- [ ] Two clips created correctly
- [ ] Timeline updates immediately
- [ ] Split preserves clip data

---

### 3. Multiple Timeline Tracks (2-3 hours)

#### Implement Track System
- **Update timeline types**
  - Add Track interface with id, clips, layer
  - Update TimelineState to include tracks array
  - Add default tracks (video track, overlay track)

- **Update TimelinePanel rendering**
  - Render multiple track layers
  - Separate Video and Overlay tracks
  - Allow clips to be placed on any track

- **Update drag-and-drop**
  - Detect target track on drop
  - Place clip on correct track
  - Maintain track layering (overlay above video)

#### Code Example
```typescript
// src/renderer/types/timeline.ts
/**
 * Timeline track definition.
 * 
 * Represents a layer on the timeline (video, audio, overlay).
 */
export interface Track {
  id: string;
  name: string;
  clips: TimelineClip[];
  layer: number; // Lower numbers render first
  visible: boolean;
}

export interface TimelineState {
  tracks: Track[];
  playhead: number;
  zoom: number;
}
```

**Acceptance Criteria**:
- [ ] Timeline has at least 2 tracks
- [ ] Can place clips on different tracks
- [ ] Overlay track renders above video track
- [ ] Clips maintain position on correct track

---

### 4. Timeline Zoom and Pan (1-2 hours)

#### Implement Zoom Functionality
- **Add zoom controls**
  - Create zoom slider component
  - Connect to timeline zoom state
  - Update clip rendering scale

- **Update Konva rendering**
  - Scale clip positions based on zoom
  - Maintain playhead position during zoom
  - Update clip widths proportionally

#### Implement Pan Functionality
- **Add pan controls**
  - Detect wheel scroll on timeline
  - Update timeline offset
  - Constrain pan to valid range

- **Update rendering**
  - Apply offset to all timeline elements
  - Maintain playhead visibility
  - Smooth scroll behavior

#### Code Example
```typescript
// src/renderer/hooks/useTimelineZoom.ts
/**
 * Hook for timeline zoom functionality.
 * 
 * Manages zoom level state and provides zoom controls.
 */
export function useTimelineZoom() {
  const [zoom, setZoom] = useState(1);
  
  const zoomIn = () => setZoom(z => Math.min(z * 1.5, 10));
  const zoomOut = () => setZoom(z => Math.max(z / 1.5, 0.5));
  
  return { zoom, zoomIn, zoomOut };
}
```

**Acceptance Criteria**:
- [ ] Zoom slider controls timeline zoom
- [ ] Clips scale correctly with zoom
- [ ] Can pan timeline left/right
- [ ] Playhead stays visible during pan
- [ ] Zoom constraints work

---

### 5. Advanced Preview Controls (1 hour)

#### Enhanced Preview Features
- **Add scrub controls**
  - Make timeline playhead draggable
  - Update preview frame on drag
  - Show frame when not playing

- **Add playback controls**
  - Play/pause button (enhanced)
  - Jump to start/end buttons
  - Step frame forward/backward
  - Playback speed control (optional)

- **Add time display**
  - Show current time
  - Show total timeline duration
  - Format time as MM:SS or HH:MM:SS

#### Code Example
```typescript
// src/renderer/components/panels/PreviewPanel.tsx
/**
 * Enhanced preview with advanced controls.
 */
export function PreviewPanel() {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const handlePlayPause = () => {
    if (isPlaying) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleScrub = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setPlayhead(time);
  };
  
  return (
    <div>
      <video ref={videoRef} />
      <PreviewControls
        onPlayPause={handlePlayPause}
        onScrub={handleScrub}
      />
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Can scrub timeline to navigate
- [ ] Preview updates frame-by-frame on scrub
- [ ] Play/pause controls work
- [ ] Time display shows current position
- [ ] Jump to start/end works

---

### 6. Enhanced Error Handling (1-2 hours)

#### Global Error Boundaries
- **Create ErrorBoundary component**
  - Wrap app in error boundary
  - Catch rendering errors
  - Display user-friendly error messages
  - Add error reporting

#### Service-Level Error Handling
- **Update all services**
  - Add try-catch to all async operations
  - Return Result type instead of throwing
  - Log errors to console (and optionally to file)
  - Show user-friendly messages

#### Export Error Recovery
- **Handle export failures gracefully**
  - Show detailed error messages
  - Retry failed exports
  - Suggest solutions to common errors
  - Log export errors for debugging

#### Code Example
```typescript
// src/renderer/utils/result.ts
/**
 * Result type for error handling.
 * 
 * Pattern to handle errors without exceptions.
 */
export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// src/renderer/services/ffmpegService.ts
export async function exportTimeline(
  timeline: TimelineState,
  options: ExportOptions
): Promise<Result<string>> {
  try {
    const outputPath = await encodeVideo(timeline, options);
    return { success: true, data: outputPath };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}
```

**Acceptance Criteria**:
- [ ] Error boundary catches rendering errors
- [ ] Services return Result types
- [ ] Export errors show user-friendly messages
- [ ] All errors logged appropriately
- [ ] Can retry failed operations

---

## Testing Checklist

### Recording Features
- [ ] Screen recording works
- [ ] Webcam recording works
- [ ] PiP recording works
- [ ] Audio captured correctly
- [ ] Recording saves to timeline

### Timeline Features
- [ ] Can split clips
- [ ] Multiple tracks render correctly
- [ ] Zoom works
- [ ] Pan works
- [ ] Clips maintain positions

### Preview Features
- [ ] Scrub works
- [ ] Frame-by-frame navigation works
- [ ] Playback controls enhanced
- [ ] Time display accurate

### Error Handling
- [ ] Errors don't crash app
- [ ] User sees friendly messages
- [ ] Errors logged for debugging
- [ ] Can recover from errors

---

## Success Criteria

**Phase 2 is complete when:**
- ✅ Screen and webcam recording works
- ✅ Can split clips at playhead
- ✅ Timeline has multiple tracks
- ✅ Zoom and pan work smoothly
- ✅ Preview controls are enhanced
- ✅ Error handling is robust
- ✅ No regression in MVP features

---

## Common Issues

### Issue: Recording permission denied
**Solution**: Request permissions in sequence, show user instructions

### Issue: Split creates incorrect clip durations
**Solution**: Validate split point relative to clip trim points

### Issue: Tracks overlap incorrectly
**Solution**: Adjust layer rendering order, verify track positions

### Issue: Zoom causes timeline misalignment
**Solution**: Recalculate clip positions on zoom, maintain anchor point

---

## Next Steps

After completing Phase 2, proceed to **Phase 3: Polish & Enhancements** to implement:
- Welcome screen (post-MVP)
- UI/UX improvements
- Keyboard shortcuts
- Performance optimizations
- Final testing and bug fixes

