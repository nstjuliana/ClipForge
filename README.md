# ClipForge - AI-First Video Editor

Desktop video editing application built with Electron, React, TypeScript, and Vite.

## Project Status

**Phase 0: Setup - COMPLETED ✅**

The foundation is now in place with:
- ✅ Electron + React + TypeScript + Vite configured
- ✅ Basic window management and security settings
- ✅ IPC communication setup (preload scripts)
- ✅ Three screen components (Launch, Project Selection, Main)
- ✅ Tailwind CSS styling
- ✅ Development environment ready

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

This will:
1. Build the Electron main and preload processes
2. Start the Vite dev server for the React renderer
3. Launch the Electron application with hot module replacement

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build development version
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
ClipForge/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Main entry point
│   │   ├── window.ts      # Window management
│   │   └── ipc/           # IPC handlers
│   ├── preload/           # Preload scripts (security bridge)
│   │   ├── index.ts       # Main preload script
│   │   └── types.ts       # Exposed API types
│   └── renderer/          # React frontend
│       ├── index.html     # HTML entry point
│       ├── main.tsx       # React entry point
│       ├── App.tsx        # Root component
│       ├── components/    # React components
│       ├── types/         # TypeScript types
│       ├── hooks/         # Custom React hooks
│       └── services/      # Services (future)
├── _docs/                 # Project documentation
├── dist-electron/         # Build output (auto-generated)
└── node_modules/          # Dependencies

```

## Technology Stack

- **Electron** - Desktop application framework
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Konva.js** - Timeline rendering (Phase 1)
- **@ffmpeg/ffmpeg** - Video processing (Phase 1)

## Current Screens

### 1. Launch Screen
- Displays app logo and branding
- "Get Started" button to proceed

### 2. Project Selection Screen
- Create new project
- Open existing project

### 3. Main Screen (Stub)
- Media library panel (placeholder)
- Preview panel (placeholder)
- Timeline panel (placeholder)
- Top menu bar with Import/Save/Export buttons

## Next Steps - Phase 1: MVP

Phase 1 will implement core functionality:
1. Project file management (save/load)
2. Media import and library
3. Basic timeline with drag-and-drop
4. Trim functionality
5. Video export

See `_docs/phases/phase-1-mvp.md` for details.

## Documentation

Full documentation is available in the `_docs/` directory:
- `project-overview.md` - Project vision and goals
- `tech-stack.md` - Detailed technology decisions
- `project-rules.md` - Coding standards and conventions
- `user-flow.md` - User interaction flows
- `phases/` - Phase-by-phase implementation guide

## Development Notes

### Security
- IPC communication uses `contextBridge` for security
- `nodeIntegration` is disabled
- `contextIsolation` is enabled
- All Electron APIs are exposed through preload script

### Code Quality
- TypeScript strict mode enabled
- ESLint and Prettier configured
- File size limit: 500 lines
- Comprehensive JSDoc documentation required

### File Naming
- Components: PascalCase (`LaunchScreen.tsx`)
- Utilities: camelCase (`formatTime.ts`)
- CSS: kebab-case (`main.css`)

## Troubleshooting

### App won't launch
- Make sure dependencies are installed: `npm install`
- Check that dist-electron directory exists (created on first build)
- Try clearing build cache: Delete `dist-electron/` and restart

### TypeScript errors
- Run `npm run typecheck` to see all errors
- Make sure all imports include file extensions
- Check that all types are properly defined

### Hot Module Replacement not working
- Restart the dev server
- Check Vite configuration in `vite.config.ts`

## License

MIT

---

Built with ❤️ by the ClipForge team

