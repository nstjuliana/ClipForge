# ClipForge

**AI-First Desktop Video Editor**

A production-grade desktop video editor built with Electron, React, and TypeScript. ClipForge allows creators to record their screen, import clips, arrange them on a timeline, and export professional-looking videos.

## Features

### Phase 1 - MVP (Completed)
- ✅ Desktop app that launches (Electron.js)
- ✅ Video import (drag & drop and file picker for MP4/MOV/WebM)
- ✅ Timeline view showing imported clips
- ✅ Video preview player
- ✅ Trim functionality (set in/out points on clips)
- ✅ Export to MP4
- ✅ Project save/load functionality
- ✅ Packaged as native app

### Phase 2 - Core Features (Completed)
- ✅ Screen recording (full screen or window selection)
- ✅ Webcam recording with device selection
- ✅ Picture-in-Picture (PiP) recording (screen + webcam simultaneously)
- ✅ Split clips at playhead position
- ✅ Multiple timeline tracks (support for layered clips)
- ✅ Timeline zoom and pan controls
- ✅ Advanced preview controls with scrubbing
- ✅ Keyboard shortcuts for common operations
- ✅ Undo/redo functionality
- ✅ AI-powered pause removal feature

## Technology Stack

- **Desktop Framework:** Electron.js with Node.js backend
- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Media Processing:** fluent-ffmpeg with ffmpeg-static for video export and processing
- **Timeline UI:** Konva.js for canvas-based timeline rendering
- **State Management:** React Context API
- **Drag & Drop:** @dnd-kit/core for enhanced drag interactions

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ClipForge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Development

**Run the app in development mode:**
```bash
npm run dev
```

This will start the Vite dev server and launch the Electron app with hot module replacement.

## Building

**Build for your current platform:**
```bash
npm run build
```

**Platform-specific builds:**
```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

Built applications will be in the `out/` directory.

## Usage

### Import Media
1. Click "Import Media" or drag video files into the Media Library panel
2. Supported formats: MP4, MOV, WebM, AVI, MKV
3. Thumbnails and metadata are automatically generated

### Recording
1. Click "Record" to open the Recording Studio
2. Choose recording mode:
   - **Screen:** Record your screen or a specific window
   - **Webcam:** Record from your camera
   - **Picture-in-Picture:** Record screen and webcam simultaneously
3. Select your recording source (screen/window or camera device)
4. Toggle audio recording on/off
5. Click "Start Recording" to begin
6. Click "Stop Recording" when finished - recording is automatically added to timeline

### Edit on Timeline
1. Double-click a clip in the Media Library to add it to the timeline
2. Drag clips on the timeline to reposition them
3. Use the trim handles (white bars on clip edges) to adjust in/out points
4. Click anywhere on the timeline to move the playhead
5. Use the **Split** button (✂️) or press `S` to split clips at the playhead
6. Place clips on different tracks for layered compositions
7. Use zoom controls (+/-) or Ctrl/Cmd + mouse wheel to zoom the timeline
8. Scroll horizontally to pan through long timelines

### Preview
1. Use the play/pause button or press `Spacebar` to preview your timeline
2. Click on the timeline to scrub to a specific position
3. Preview shows the current frame at the playhead position
4. Use arrow keys to move playhead frame-by-frame
5. Press `Home` to jump to start, `End` to jump to end

### Export
1. Click the "Export" button in the top bar
2. Choose resolution (Source, 1080p, or 720p)
3. Set output filename
4. Click "Export" and wait for processing
5. Video will download automatically when complete

### Save Project
1. Click "Save" to save your current project
2. Projects are saved as `.clipforge` files
3. Reopen projects from the Project Selection screen

### Keyboard Shortcuts
- **Spacebar:** Play/pause preview
- **S:** Split clip(s) at playhead
- **Ctrl+S / Cmd+S:** Split all clips at playhead across all tracks
- **Arrow Keys:** Move playhead left/right
- **Home:** Jump to timeline start
- **End:** Jump to timeline end
- **Ctrl+Z / Cmd+Z:** Undo
- **Ctrl+Y / Cmd+Y:** Redo
- **Ctrl+Wheel / Cmd+Wheel:** Zoom timeline in/out
- **Wheel:** Pan timeline horizontally

## Project Structure

```
ClipForge/
├── src/
│   ├── main/               # Electron main process
│   │   ├── index.ts
│   │   ├── window.ts
│   │   ├── ipc/           # IPC handlers
│   │   └── services/      # Main process services
│   ├── preload/           # Preload scripts (IPC bridge)
│   └── renderer/          # React frontend
│       ├── components/    # React components
│       ├── contexts/      # React Context providers
│       ├── services/      # Frontend services
│       └── types/         # TypeScript type definitions
├── _docs/                 # Project documentation
└── assets/                # App icons and static assets
```

## Architecture

### Main Process
- **window.ts:** Creates and manages the main application window
- **ipc/handlers.ts:** Handles IPC communication between main and renderer
- **services/projectIO.ts:** Reads and writes project files to disk

### Renderer Process
- **Contexts:** State management for Media, Timeline, Project, Recording, and Undo/Redo
- **Services:** Business logic for media import, FFmpeg export, thumbnails, pause detection
- **Components:** UI components for panels, modals, and screens
- **Hooks:** Custom hooks for timeline operations, recording, keyboard shortcuts, and zoom

### Security
- Context isolation enabled
- Node integration disabled
- IPC communication via secure preload script

## Common Issues

### Recording Permissions
- Screen recording requires system permissions (automatically requested)
- Webcam/microphone access requires browser permissions
- On Windows, check Settings > Privacy > Microphone if audio recording fails
- Permissions are requested when starting a recording session

### Video Format Support
- Browser-based video decoding depends on system codecs
- H.264/AAC is universally supported

### Large Files
- Files over 500MB may cause memory issues
- Consider compressing source videos before import

## Performance Tips

- Keep timeline under 10 clips for optimal performance
- Generate thumbnails take a few seconds per clip
- Export time varies based on video length and resolution

## Roadmap

### Phase 3 - Polish (Planned)
- Text overlays and graphics
- Transitions and effects
- Audio controls (volume, fade in/out)
- Auto-save functionality
- Export presets for different platforms
- Enhanced visual design improvements

## Contributing

This project was built as part of a 72-hour sprint challenge. Contributions, issues, and feature requests are welcome!

## License

MIT

## Acknowledgments

Built with:
- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
- [Konva](https://konvajs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [@dnd-kit](https://dndkit.com/)
