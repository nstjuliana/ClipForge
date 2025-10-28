# User Flow

**ClipForge - User Journey**

This document defines the primary user journey through ClipForge, mapping how users interact with different features and how they connect.

---

## Overview

The core flow: **Launch → Project Selection → Media Acquisition → Timeline Editing → Export**

---

## 1. Application Launch

### 1.1 Happy Path
- User opens ClipForge app
- App loads and initializes Electron backend
- System permissions are checked in the background
- **MVP**: Direct to Project Selection screen
- **Post-MVP**: Show Welcome screen on first launch, then route to appropriate screen

### 1.2 Error States
- App fails to launch → Display error message with diagnostic info
- Permissions denied → Warn user about missing permissions (camera, microphone, file system)
- FFmpeg not available → Display setup error, provide installation instructions

---

## 2. Project Selection

### 2.1 Happy Path
- User sees two options: "New Project" or "Open Existing Project"
- **New Project**: Click "New Project" → App creates new project file → Route to Main Screen
- **Open Existing**: Click "Open Existing Project" → File picker opens → User selects `.clipforge` project file → App loads project state → Route to Main Screen

### 2.2 Error States
- Project file corrupted → Display error, offer to recover or start fresh
- Cannot read project file → Show file system error message
- No existing projects → Show empty state with "Create New Project" prompt

---

## 3. Welcome Screen (Post-MVP)

### 3.1 Happy Path
- Display welcome screen on first launch
- Show app overview, key features, or tutorial options
- User clicks "Get Started" or "Skip" → Route to Project Selection
- Option to "Don't show again" → Save preference

### 3.2 Error States
- None (graceful degradation if welcome screen fails)

---

## 4. Main Screen - Media Library

### 4.1 Screen Layout
- **Media Library Panel** (left/side): Shows imported videos with thumbnails and metadata
- **Timeline View** (bottom): Visual timeline with clips
- **Preview Player** (top/center): Video preview window with playback controls
- **Action Buttons**: Import Media, Record Screen, Record Webcam, Record Both

### 4.2 Empty State
- No media in library yet
- Display "Import Media" or "Start Recording" call-to-action buttons
- Show helpful tips about supported formats

### 4.3 Happy Path - Viewing Media Library
- User sees imported clips in Media Library
- Each clip shows: thumbnail, filename, duration, resolution, file size
- User can click a clip to see preview in Preview Player (MVP shows full clip)
- Clips ready to drag to Timeline

### 4.4 Error States
- Media file corrupted during import → Show error badge on specific clip
- Cannot generate thumbnail → Show placeholder icon
- Unsupported file format → Filter out from library with error notification

---

## 5. Recording Flow

### 5.1 Initiate Recording
User clicks one of three recording buttons:
- **Record Screen**: Screen recording mode
- **Record Webcam**: Webcam recording mode  
- **Record Both**: Simultaneous screen + webcam (PiP)

### 5.2 Permission Handling
- **First-time recording**: System permission dialog appears for camera/microphone access
- User grants permission → Continue to recording screen
- User denies permission → Display error, explain requirement, offer to retry

### 5.3 Recording Screen (New Screen)
- **Screen Mode**: Display available screens/windows for selection
- **Webcam Mode**: Show live webcam preview
- **Both Mode**: Show screen preview + webcam overlay preview
- **Controls**: Record button, Stop button, audio toggle (mute/unmute microphone)
- **Timer**: Show recording duration counter
- User clicks "Record" → Recording begins
- User clicks "Stop" → Recording stops, prompt to save to timeline

### 5.4 Save Recording
- After stop: Modal or notification asks "Add to Timeline?"
- **Save**: Recording is added to Media Library AND automatically added to Timeline
- **Discard**: Recording is deleted, user returns to Main Screen
- **MVP**: Recording added to end of timeline
- **Post-MVP**: User can choose timeline position

### 5.5 Error States
- Cannot access screen → Show error, list troubleshooting steps
- Camera not found → Show error, offer to use screen-only recording
- Recording interrupted (system sleep, app crash) → Attempt to save partial recording or warn about data loss
- File too large → Warn user about file size, offer to limit duration

---

## 6. Import Flow

### 6.1 Happy Path - Import Methods
- **Method A - Drag & Drop**: User drags video files into app → Files appear in Media Library with metadata
- **Method B - File Picker**: User clicks "Import Media" button → File picker opens → User selects videos → Files imported to Media Library

### 6.2 File Processing
- App validates file format (MP4, MOV, WebM)
- App generates thumbnails for each clip
- App extracts metadata (duration, resolution, file size)
- Files added to Media Library panel
- Success notification appears

### 6.3 Error States
- Unsupported file format → Display error, show list of supported formats
- File too large for available memory → Warn user, suggest file compression
- Cannot access file → Display file system error
- Import process interrupted → Show partial import status, allow retry

---

## 7. Timeline Editing

### 7.1 Adding Clips to Timeline
- User drags clip from Media Library → Drop onto Timeline
- Clip appears on main video track
- Preview updates to show timeline state

### 7.2 Timeline Interaction
- **Playhead Control**: User can click on timeline or scrub playhead → Preview updates
- **Play/Pause**: User clicks play button → Preview plays from current playhead position
- **Scrubbing**: User drags playhead → Preview shows frame at that position

### 7.3 Editing Operations (MVP)
- **Trim Clip**: User selects clip on timeline → Drag start/end handles → Clip duration adjusted
- **Delete Clip**: User selects clip → Press delete key → Clip removed from timeline

### 7.4 Editing Operations (Post-MVP)
- **Split Clip**: User sets playhead at desired position → Click "Split" button → Clip divided into two at that point
- **Rearrange Clips**: User drags clip to new position → Clip moved, gaps filled or clips overlap
- **Multiple Tracks**: User can drag clips to overlay track for PiP effects
- **Zoom Timeline**: User adjusts zoom slider → Timeline expands/contracts for precision
- **Snap-to-Grid**: Clips automatically align to clip edges or grid points

### 7.5 Error States
- Cannot update timeline preview → Show error, refresh preview
- Trim invalid (start after end) → Prevent action, show error message
- Timeline too long for preview → Warn about performance, limit max duration
- Out of memory → Pause editing, suggest exporting and starting fresh

---

## 8. Preview & Playback

### 8.1 Happy Path
- **Play**: User clicks play → Video plays from current playhead position
- **Pause**: User clicks pause → Playback stops at current frame
- **Scrub**: User drags playhead → Preview updates to show frame at that timecode
- **Audio Sync**: Audio and video synchronized during playback
- Preview shows real-time composition of timeline (what will be exported)

### 8.2 Error States
- Video cannot decode → Show error in preview player, mark problematic clips
- Audio missing for clip → Show warning in UI, allow playback without audio
- Preview stutters or lags → Display performance warning, suggest reducing timeline complexity

---

## 9. Export Flow

### 9.1 Initiate Export
- User clicks "Export" button
- Modal or dialog appears with export options:
  - Resolution: 720p, 1080p, Source
  - File format: MP4 (MVP only), additional formats (Post-MVP)
  - Export location: Local file system (MVP), cloud options (Post-MVP)
- User selects options → Click "Export"

### 9.2 Export Processing
- **Progress Indicator**: Show progress bar with percentage and estimated time
- **Background Processing**: FFmpeg processes timeline composition
- **Real-time Updates**: Progress updates as export proceeds
- Processing continues even if user navigates away from export modal

### 9.3 Export Complete
- Export finishes → Show success notification
- Offer to open file location or open video file
- File saved to user-selected location or default export folder

### 9.4 Error States
- Export fails (FFmpeg error) → Show error message with diagnostic details, allow retry
- Insufficient disk space → Warn user before export, prevent export if no space
- Encoding timeout → Warn user, allow to increase timeout or simplify project
- Cannot write to location → Show file access error, suggest alternate location
- Export interrupted (app closed) → Attempt to save partial export or display failure on restart

---

## 10. Project Management

### 10.1 Save Project (MVP)
- **Manual Save**: User clicks "Save Project" or File menu → Project state saved to `.clipforge` file
- Save includes: all imported clips (references), timeline arrangement, trim points, track layout
- Save location: User selects location via file picker

### 10.2 Load Project
- User selects "Open Existing Project" → File picker opens
- User selects `.clipforge` file → App loads project state
- Media Library repopulates (if files still exist)
- Timeline reconstructs with saved arrangement

### 10.3 Error States
- Cannot read project file → Show corruption error, attempt recovery if possible
- Clip files missing → Show warning list of missing files, allow to relink or remove
- Save failed → Show error, prevent data loss by keeping app state
- File locked by another process → Warn user, offer to retry

---

## 11. Welcome Screen Navigation (Post-MVP)
- User can access Welcome screen from Help menu
- User can access tutorials or feature overviews
- User can reset preferences

---

## 12. Exit Application

### 12.1 Happy Path
- User clicks close button or selects File → Exit
- App saves project state (if project is open)
- App exits cleanly

### 12.2 Error States
- Unsaved changes detected → Prompt user to save, discard, or cancel
- Save fails during exit → Warn user, offer to retry or force exit

---

## Feature Connection Summary

**MVP Path:**
Launch → New/Existing Project → Main Screen → Import Media → Add to Timeline → Trim → Export

**Full Feature Path:**
Launch → Welcome (first time) → New/Existing Project → Main Screen → Import OR Record → Timeline Editing (trim, split, arrange, multi-track) → Preview → Export (with options)

**Key Connections:**
- Media Library ↔ Timeline (drag and drop)
- Recording → Media Library + Timeline (auto-add)
- Timeline ↔ Preview (synchronized playback)
- Timeline → Export (composition rendering)
- Project saves state of Media Library + Timeline + playback position

