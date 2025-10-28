# Technology Stack

**ClipForge - Desktop Video Editor**

Final technology stack decisions for the 72-hour MVP sprint. Alternatives are listed as fallbacks in case primary approaches fail.

---

## ✅ Final Stack Decisions

### Core Framework
- **Electron.js** - Desktop application framework
- **TypeScript** - Type safety and developer experience
- **Vite** - Build tool and dev server

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **React Context** - State management

### Media Processing
- **@ffmpeg/ffmpeg** - Video export and manipulation (primary)
  - Alternative: **fluent-ffmpeg** (if WASM performance issues)
- **ffmpeg-static** + **ffprobe-static** - Thumbnail generation and metadata
- **HTML5 `<video>`** - Video player (primary)
  - Alternative: **Video.js** (if advanced features needed)

### Timeline & UI
- **Konva.js** - Timeline canvas rendering (primary)
  - Alternative: **HTML5 Canvas** custom implementation
- **@dnd-kit/core** - Drag & drop interactions
  - Alternative: **Native HTML5 Drag API**

### Project Management
- **JSON Files** - Project state persistence
- **Node.js fs module** - File system operations

### Packaging & Distribution
- **electron-builder** - Application packaging

---

## Detailed Technology Information

### 1. Frontend Framework: **React 18** ✅

**Why**: Largest ecosystem, extensive documentation, dominant in Electron apps, massive community support.

**Key Features**:
- Hooks for state management and lifecycle
- Component-based architecture
- Great TypeScript support
- Extensive library ecosystem

**Alternatives** (if primary fails):
- **Vue 3**: Easier learning curve, built-in reactivity, single-file components
  - Switched if: React proves too verbose or configuration becomes problematic

---

### 2. Media Processing: **@ffmpeg/ffmpeg** ✅

**Why**: Simplest setup, no native FFmpeg installation needed, works in renderer process, portable.

**Key Features**:
- WebAssembly-based, runs in browser context
- No system dependencies
- Simple npm install
- Platform independent

**Pros**:
- No native FFmpeg install required
- Portable, works across platforms
- Can run in Electron renderer process
- Fast to set up

**Cons**:
- Larger bundle size (~20MB)
- Slower than native FFmpeg
- WebAssembly overhead

**Alternatives** (if primary fails):
- **fluent-ffmpeg** (Node.js native)
  - Switched if: Performance becomes bottleneck or export fails
  - Requires FFmpeg binary bundled with app
  - More complex setup but faster processing

---

### 3. Timeline UI: **Konva.js** ✅

**Why**: Built-in event handling, drag-drop, zoom, transforms - saves time on timeline development.

**Key Features**:
- 2D canvas library with rich interactions
- Built-in event handling
- Transforms and animations
- Node-based architecture

**Pros**:
- Drag-drop functionality built-in
- Zoom, pan, transforms ready to use
- Performance optimizations included
- Well-documented API

**Cons**:
- Additional dependency (~50KB)
- Learning curve for API

**Alternatives** (if primary fails):
- **HTML5 Canvas** custom implementation
  - Switched if: Konva bundle size or API issues
  - More code but full control
  - No external dependencies

---

### 4. Video Player: **HTML5 `<video>`** ✅

**Why**: Native browser support, zero dependencies, perfect for MVP preview functionality.

**Key Features**:
- Built-in video playback
- Simple API
- Native browser controls
- No setup required

**Pros**:
- Zero dependencies
- Native browser support
- Simple to implement
- Fast loading

**Cons**:
- Limited customization
- Basic controls only
- Browser inconsistencies possible

**Alternatives** (if primary fails):
- **Video.js**
  - Switched if: Need advanced controls, plugins, or better responsiveness
  - More features but larger bundle

---

### 5. State Management: **React Context + Hooks** ✅

**Why**: Built into React, simple for MVP scope, no extra dependencies, familiar to developers.

**Key Features**:
- `useState` for component state
- `useContext` for global state
- `useReducer` for complex state logic

**Pros**:
- No dependencies
- Built into React
- Simple and familiar
- Perfect for MVP scope

**Cons**:
- Can become unwieldy with complex state
- Performance concerns at scale
- Prop drilling if not careful

**Alternatives** (if primary fails):
- **Zustand**
  - Switched if: Context performance issues or state becomes too complex
  - Lightweight (1kb), simple API, good TypeScript support

---

### 6. UI Framework: **Tailwind CSS** ✅

**Why**: Utility-first approach enables rapid development, perfect for quick iteration and MVP timelines.

**Key Features**:
- Utility classes for rapid styling
- PurgeCSS for optimal bundle size
- Responsive design utilities
- Dark mode support

**Pros**:
- Rapid development
- Consistent design system
- Great for quick iteration
- Modern, popular framework

**Cons**:
- Initial learning curve
- Class-heavy HTML
- Custom build needed for Electron

**Alternatives** (if primary fails):
- **styled-components** or **CSS Modules**
  - Switched if: Prefer CSS-in-JS or need component-scoped styles
  - More setup but flexible

---

### 7. Component Library: **shadcn/ui** ✅

**Why**: Beautiful, customizable components that integrate perfectly with Tailwind, copy-paste code approach.

**Key Features**:
- Accessible components (Radix UI based)
- Fully customizable
- Tailwind-native
- Copy-paste approach (not a dependency)

**Pros**:
- Beautiful, accessible components
- Fully customizable code
- Perfect for Tailwind
- Rapid prototyping

**Cons**:
- Requires Tailwind
- Need to implement yourself
- Not a drop-in dependency

**Alternatives** (if primary fails):
- **Material-UI (MUI)** or **Ant Design**
  - Switched if: Need complete component ecosystem or don't want to implement components
  - More opinionated design, larger bundle

---

### 8. Packaging: **electron-builder** ✅

**Why**: Industry standard, handles all platforms, production-ready packaging.

**Key Features**:
- Cross-platform packaging
- Auto-updater support
- Code signing
- Installer generation

**Pros**:
- Industry standard
- Handles all platforms (Windows, Mac, Linux)
- Production-ready
- Auto-updater support

**Cons**:
- Can be slow
- Complex configuration
- Large configuration files

**Alternatives** (if primary fails):
- **electron-forge**
  - Switched if: electron-builder configuration becomes too complex
  - Official Electron tool, simpler setup
  - Less mature ecosystem

---

### 9. Build Tool: **Vite** ✅

**Why**: Lightning fast HMR, modern dev experience, simple configuration for Electron.

**Key Features**:
- Fast HMR (Hot Module Replacement)
- ESM by default
- Simple configuration
- Built-in TypeScript support

**Pros**:
- Lightning fast development
- Simple configuration
- Great for Electron
- Modern, optimized builds

**Cons**:
- Need to configure for Electron specifically
- Less mature than Webpack

**Alternatives** (if primary fails):
- **Webpack** or **electron-react-boilerplate**
  - Switched if: Configuration becomes too difficult
  - More templates available
  - Slower builds

---

### 10. Type Safety: **TypeScript** ✅

**Why**: Essential for complex apps, catches errors early, better IDE support, self-documenting.

**Key Features**:
- Static type checking
- Interface definitions
- Better autocomplete
- Error prevention

**Pros**:
- Catches errors before runtime
- Better IDE support
- Self-documenting code
- Refactoring safety

**Cons**:
- Requires build step
- Slight learning curve
- More verbose than JS

**Alternatives** (if primary fails):
- **JavaScript (ES6+)**
  - Switched if: TypeScript becomes time-consuming (NOT recommended)
  - Faster to write but no type safety

---

### 11. File Handling: **ffmpeg-static** ✅

**Why**: Bundled FFmpeg binaries work offline, simplify thumbnail generation and metadata extraction.

**Key Features**:
- Bundled binaries
- Works offline
- No system installation needed
- Platform-specific builds

**Pros**:
- No system dependencies
- Works offline
- Fast thumbnail generation
- npm install and go

**Cons**:
- Large bundle size (~50MB)
- Platform-specific binaries

**Alternatives** (if primary fails):
- **Native media APIs**
  - Switched if: Bundle size becomes critical issue
  - Need to write platform-specific code

---

### 12. Drag & Drop: **@dnd-kit/core** ✅

**Why**: Modern, React-friendly, robust API for timeline interactions.

**Key Features**:
- React-friendly API
- Accessibility built-in
- Performance optimized
- Powerful collision detection

**Pros**:
- Modern, maintained library
- Built for React
- Handles edge cases
- Accessibility support

**Cons**:
- Learning curve
- Dependency size
- More complex than native

**Alternatives** (if primary fails):
- **Native HTML5 Drag API**
  - Switched if: @dnd-kit becomes too complex or adds too much bundle size
  - No dependencies but more code

---

### 13. State Persistence: **JSON Files** ✅

**Why**: Simple, human-readable, no database overhead, perfect for MVP project files.

**Key Features**:
- Simple file format
- Human-readable
- Platform independent
- No parsing complexity

**Pros**:
- Simple to implement
- Human-readable files
- No database needed
- Fast read/write

**Cons**:
- Not scalable for very large projects
- No querying capabilities
- File size limitations

**Alternatives** (if primary fails):
- **SQLite** or **lowdb**
  - Switched if: Need advanced querying or relational data
  - More setup overhead

---

## Best Practices, Limitations & Conventions

### Electron.js

#### Best Practices
- **Separate processes**: Always use IPC (Inter-Process Communication) between main and renderer processes
- **Security**: Set `nodeIntegration: false` and use `contextIsolation: true` in window config
- **Performance**: Use `webSecurity: false` ONLY when necessary and understand the risks
- **Window management**: Always handle window lifecycle (close, minimize, maximize)
- **File system**: Use Electron's file dialogs (`dialog.showOpenDialog()`) instead of browser APIs
- **Error handling**: Implement proper error boundaries and IPC error handling

#### Limitations
- **Large bundle size**: Electron apps are typically 100-200MB+ (Chromium + Node.js)
- **Memory usage**: Chrome instances consume significant RAM
- **Startup time**: Can be slow on first launch (5+ seconds)
- **Auto-updates**: Requires additional setup for production
- **Native modules**: Some npm packages don't work (need electron-builder rebuild)

#### Common Pitfalls
- ❌ Using `nodeIntegration: true` (security risk)
- ❌ Blocking main process (always use async operations)
- ❌ Forgetting to handle window-all-closed event on Mac
- ❌ Not setting up preload scripts properly
- ❌ Using browser APIs that don't work in Electron

#### Project Conventions
- Create `preload.js` for secure IPC communication
- Use named exports for IPC handlers
- Implement single-instance app pattern
- Handle file associations for `.clipforge` project files

---

### React 18

#### Best Practices
- **Component structure**: Keep components under 200 lines, split if larger
- **Hooks**: Extract custom hooks for reusable logic
- **State location**: Keep state as local as possible, lift up only when needed
- **Performance**: Use `React.memo()` for components with expensive renders (timeline, media library)
- **Event handling**: Always clean up event listeners in `useEffect` return
- **Conditional rendering**: Use early returns for cleaner code

#### Limitations
- **Bundle size**: React adds ~40KB to bundle (worth it for this app)
- **Learning curve**: Requires understanding of hooks, context, and component lifecycle
- **Re-renders**: Can cause unnecessary re-renders if not careful with context

#### Common Pitfalls
- ❌ Forgetting cleanup in useEffect hooks (memory leaks with media)
- ❌ Creating functions inside render (causes unnecessary re-renders)
- ❌ Mutating state directly (always use setState or functional updates)
- ❌ Not using keys in lists (breaks reconciliation)
- ❌ Context overuse causing performance issues

#### Project Conventions
- **File naming**: PascalCase for components (`MediaLibrary.tsx`)
- **Export style**: Use named exports for components
- **Props interface**: Define TypeScript interfaces for all props
- **Component structure**: Display logic at top, hooks in middle, handlers at bottom
- **Maximum file size**: 500 lines per component

---

### TypeScript

#### Best Practices
- **Strict mode**: Always use `"strict": true` in `tsconfig.json`
- **Type definitions**: Define interfaces for all data structures (Clip, Project, Timeline, etc.)
- **No `any` types**: Use `unknown` if truly unknown, then narrow down
- **Generic functions**: Use generics for reusable functions (e.g., file handlers)
- **Enums vs Unions**: Use union types instead of enums (better tree-shaking)

#### Limitations
- **Build time**: Adds compilation step (offset by error catching)
- **Learning curve**: Need to understand type system
- **Library types**: Some packages lack TypeScript definitions

#### Common Pitfalls
- ❌ Using `any` type (defeats purpose of TypeScript)
- ❌ Over-typing simple values
- ❌ Not using strict mode from the start
- ❌ Ignoring TypeScript errors (fix them immediately)
- ❌ Forgetting to type React event handlers

#### Project Conventions
- **Type files**: Create `types/` directory for shared interfaces
- **Naming**: Use descriptive type names (`Clip`, `TimelineState`, `ExportOptions`)
- **Components**: Always type props as interface (never inline)
- **Functions**: Add JSDoc comments for complex functions
- **Never use `@ts-ignore`** - fix the underlying issue

---

### Vite + Electron

#### Best Practices
- **Config separation**: Use different configs for development and production
- **Path aliases**: Set up `@/` alias for `src/` directory
- **HMR**: Only reload renderer process, not entire app
- **Asset handling**: Use static imports for assets to leverage Vite's optimizations
- **Environment variables**: Use `.env` files for configuration

#### Limitations
- **Electron integration**: Need to configure properly for Electron's dual-process setup
- **Native modules**: May need special handling for node modules
- **Hot reload**: Need to manually reload Electron windows on changes

#### Common Pitfalls
- ❌ Not configuring Vite for Electron's dual-process architecture
- ❌ Using web-specific APIs without checking Electron context
- ❌ Forgetting to set base path for production builds
- ❌ Not handling static assets correctly
- ❌ Overlooking CSP (Content Security Policy) settings

#### Project Conventions
- Create separate entry points for main and preload processes
- Use `vite-plugin-electron` for simplified setup
- Configure watch mode for development
- Set up separate build commands for main and renderer

---

### Tailwind CSS

#### Best Practices
- **Atomic classes**: Use utility classes for styling
- **Responsive design**: Use prefix-based breakpoints (`sm:`, `md:`, `lg:`)
- **Custom values**: Define theme values for consistent spacing/colors
- **PurgeCSS**: Ensure correct content paths in `tailwind.config.js`
- **Component extraction**: Use `@apply` sparingly (prefer utilities in JSX)

#### Limitations
- **Electron bundling**: Need proper PostCSS config for Electron
- **File size**: Full CSS can be large (purging solves this)
- **Class names**: Can get verbose for complex layouts

#### Common Pitfalls
- ❌ Not configuring PurgeCSS for Electron paths
- ❌ Using too many arbitrary values (breaks design system)
- ❌ Overusing `@apply` (defeats purpose of utility classes)
- ❌ Not defining theme values (inconsistent styling)
- ❌ Forgetting dark mode utilities

#### Project Conventions
- Define custom colors for the video editor theme in `tailwind.config.js`
- Create responsive utilities for panel layouts
- Use consistent spacing scale (4, 8, 12, 16, etc.)
- Avoid inline styles - use Tailwind classes
- Document custom utility classes

---

### @ffmpeg/ffmpeg (WASM)

#### Best Practices
- **Lazy loading**: Load FFmpeg only when needed (large bundle)
- **Worker threads**: Run FFmpeg in Web Worker to avoid blocking UI
- **Progress tracking**: Use FFmpeg's progress callback for user feedback
- **Error handling**: Catch and handle all encoding errors gracefully
- **Memory management**: Dispose of FFmpeg instances after export

#### Limitations
- **Performance**: 2-5x slower than native FFmpeg
- **Large bundle**: ~20MB added to app size
- **Memory usage**: High memory consumption during encoding
- **Browser limits**: Some codecs may not be supported
- **WASM overhead**: Additional processing overhead from WebAssembly

#### Common Pitfalls
- ❌ Loading FFmpeg synchronously (blocks app startup)
- ❌ Not handling progress (users wait without feedback)
- ❌ Running in main thread (freezes UI during export)
- ❌ Not disposing of instances (memory leaks)
- ❌ Failing silently on encoding errors

#### Project Conventions
- Load FFmpeg asynchronously on first export trigger
- Show progress indicator during encoding
- Run in Web Worker for large exports
- Add timeout for long-running operations
- Implement retry logic for failed exports
- Log all FFmpeg errors with context

---

### Konva.js

#### Best Practices
- **Stage optimization**: Set `listening={false}` for non-interactive shapes
- **Batch updates**: Use `stage.cache()` for complex shapes
- **Event handling**: Use Konva's events, not DOM events
- **Memory**: Destroy stages properly when unmounting
- **Scaling**: Use Konva transforms instead of manual calculations

#### Limitations
- **Bundle size**: ~50KB gzipped
- **Mobile performance**: Limited touch support
- **3D**: No 3D rendering (only 2D canvas)
- **Text**: Limited text layout capabilities

#### Common Pitfalls
- ❌ Not cleaning up stages (memory leaks)
- ❌ Using too many shapes (performance degradation)
- ❌ Forgetting to update cursor coordinates
- ❌ Not optimizing for large timelines
- ❌ Mixing DOM and Konva events

#### Project Conventions
- Create separate components for timeline layers (video, audio, effects)
- Use `Konva.Group` to organize timeline clips
- Implement virtual scrolling for long timelines
- Cache complex shapes to improve performance
- Handle zoom transforms at stage level, not individual objects

---

### React Context

#### Best Practices
- **Split contexts**: Don't put all state in one context (causes re-renders)
- **Multiple contexts**: Create separate contexts for timeline, media library, settings
- **Memoization**: Memoize context values to prevent unnecessary re-renders
- **Provider structure**: Keep providers close to consumers
- **Custom hooks**: Create custom hooks to wrap context access

#### Limitations
- **Re-render cascades**: All consumers re-render when context value changes
- **No selective updates**: Can't update individual consumers
- **Performance**: Can become slow with complex state
- **Scope**: Not suitable for high-frequency updates (e.g., playhead position)

#### Common Pitfalls
- ❌ Single context for entire app (causes everything to re-render)
- ❌ Creating new objects in render (infinite loops)
- ❌ Not memoizing context values
- ❌ Using context for frequently updated values
- ❌ Deeply nested providers

#### Project Conventions
- Create separate contexts: `MediaContext`, `TimelineContext`, `ProjectContext`
- Use `useMemo` for context values
- Create custom hooks: `useMedia()`, `useTimeline()`, `useProject()`
- Keep playhead position OUT of context (use local state or props)
- Implement context providers in separate files

---

### @dnd-kit/core

#### Best Practices
- **Sensor options**: Configure sensors for mouse, keyboard, touch
- **Collision detection**: Use appropriate algorithm for timeline
- **Modifiers**: Add snap-to-grid modifier for timeline
- **Accessibility**: Implement keyboard navigation
- **Performance**: Use `useSortable` hook correctly for drag handles

#### Limitations
- **Bundle size**: ~15KB for core + plugins
- **Learning curve**: Complex API for advanced features
- **Native drag**: Doesn't support native file drag (use separate handler)
- **Animation**: Need to implement custom animations

#### Common Pitfalls
- ❌ Not handling drag start/end events properly
- ❌ Forgetting to add collision detection
- ❌ Not implementing keyboard accessibility
- ❌ Using wrong sensors for timeline interaction
- ❌ Missing CSS for drag overlay

#### Project Conventions
- Configure mouse and keyboard sensors for timeline
- Implement custom drag overlay for timeline clips
- Add snap-to-grid modifier
- Handle drop zones for timeline tracks separately
- Test keyboard navigation for accessibility

---

### HTML5 Video Element

#### Best Practices
- **Event handling**: Listen to all relevant events (`loadedmetadata`, `timeupdate`, etc.)
- **Error handling**: Always handle `error` event
- **Performance**: Unload video when not needed
- **Seeking**: Use `currentTime` for scrubbing
- **Controls**: Hide native controls, build custom ones

#### Limitations
- **Codec support**: Browser/platform dependent
- **Customization**: Limited styling options
- **Performance**: Can be sluggish with large files
- **Format**: May need format conversion

#### Common Pitfalls
- ❌ Not handling `onLoadedMetadata` before seeking
- ❌ Forgetting to pause video when unmounting
- ❌ Not handling errors (videos can fail to load)
- ❌ Seeking before video is ready (can hang)
- ❌ Not cleaning up event listeners

#### Project Conventions
- Always check `readyState` before operations
- Implement custom progress bar and controls
- Handle loading states (buffering indicator)
- Clean up all event listeners on unmount
- Use refs for video element access

---

### shadcn/ui

#### Best Practices
- **Copy, don't install**: Components are copied into your project
- **Customization**: Modify components to match design
- **Accessibility**: Components use Radix UI (accessible by default)
- **Styling**: Use Tailwind utilities, not CSS classes
- **Updates**: Track changes and update components manually

#### Limitations
- **Setup**: Need to set up Radix UI dependencies
- **Not a library**: Need to maintain components yourself
- **Learning curve**: Need to understand Radix primitives
- **Updates**: Manual updates required

#### Common Pitfalls
- ❌ Not installing required Radix dependencies
- ❌ Trying to import components (they're your code)
- ❌ Not modifying components for your needs
- ❌ Missing Tailwind/Radix dependencies
- ❌ Overlooking accessibility features

#### Project Conventions
- Copy only needed components (keep bundle small)
- Place components in `components/ui/` directory
- Modify components to match project design
- Use shadcn CLI for initial setup
- Document custom modifications

---

### electron-builder

#### Best Practices
- **Icon generation**: Create app icons for all platforms
- **Code signing**: Set up certificates for distribution
- **Auto-updater**: Configure for production updates
- **File associations**: Register `.clipforge` file type
- **Testing**: Test installers on target platforms

#### Limitations
- **Slow builds**: Can take 5-10 minutes
- **Complex config**: Large configuration file
- **Platform-specific**: Different configs for Mac/Windows/Linux
- **Large installers**: App size inflates with Electron

#### Common Pitfalls
- ❌ Forgetting to generate app icons
- ❌ Not testing installers before release
- ❌ Missing file associations
- ❌ Incorrect platform-specific configs
- ❌ Not setting up auto-updater for production

#### Project Conventions
- Create icons in multiple sizes (16x16 to 1024x1024)
- Configure Windows file association for `.clipforge`
- Test installer on clean machines before releasing
- Set up GitHub Actions for automated builds
- Use semantic versioning

---

### JSON Project Files

#### Best Practices
- **Validation**: Validate JSON structure on load
- **Versioning**: Include version number in project schema
- **Backups**: Create backup before overwriting
- **Error handling**: Handle corrupted or missing files
- **Compression**: Consider compression for large projects

#### Limitations
- **File size**: Large projects can have huge files
- **No queries**: Need to load entire file
- **No relationships**: Flat structure
- **Corruption**: File corruption means data loss

#### Common Pitfalls
- ❌ Not validating JSON on load
- ❌ Writing synchronously (blocks UI)
- ❌ No error recovery for corrupted files
- ❌ Losing data on save failure
- ❌ No version migration strategy

#### Project Conventions
- Always validate project schema on load
- Include version field for future migrations
- Create `.clipforge` extension registration
- Implement project backup before save
- Use atomic writes (write to temp, then rename)
- Add error recovery for corrupted projects

---

### ffmpeg-static / ffprobe-static

#### Best Practices
- **Lazy loading**: Load binaries only when needed
- **Path resolution**: Use proper path resolution for bundled binaries
- **Metadata extraction**: Use ffprobe for durations, resolution
- **Thumbnails**: Generate on import, cache for performance
- **Error handling**: Handle missing binaries gracefully

#### Limitations
- **Bundle size**: ~50MB for all binaries
- **Platform-specific**: Different binaries for each OS
- **Performance**: Slower than system FFmpeg
- **Updates**: Binary updates require app update

#### Common Pitfalls
- ❌ Not handling platform-specific binary paths
- ❌ Loading binaries on app startup (slows launch)
- ❌ Failing silently when binary not found
- ❌ Not caching thumbnail generation results
- ❌ Running thumbnail generation synchronously

#### Project Conventions
- Lazy load ffmpeg binaries on first export
- Generate thumbnails asynchronously in background
- Cache thumbnails to disk for performance
- Handle all platform-specific paths
- Show loading indicator during thumbnail generation

---

## Common Pitfalls Across Stack

### Performance Issues
- ❌ Not using React.memo for expensive components (timeline, media library)
- ❌ Loading FFmpeg on app startup (slow launch)
- ❌ Not implementing virtual scrolling for long media lists
- ❌ Generating thumbnails synchronously
- ❌ Keeping too many video elements loaded

### Memory Leaks
- ❌ Not cleaning up video elements when unmounting
- ❌ Keeping event listeners attached
- ❌ Not disposing of Konva stages
- ❌ Keeping FFmpeg instances after export
- ❌ Caching too many thumbnails in memory

### TypeScript Issues
- ❌ Using `any` types
- ❌ Not typing event handlers
- ❌ Incomplete type definitions for Clip, Timeline, etc.
- ❌ Ignoring TypeScript errors
- ❌ Not using strict mode

### Electron Security
- ❌ Using `nodeIntegration: true`
- ❌ Not using preload scripts for IPC
- ❌ Not setting CSP headers
- ❌ Exposing Node.js APIs to renderer
- ❌ Not validating IPC messages

---

## Dependencies Summary

### Production Dependencies
```json
{
  "electron": "^latest",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "@ffmpeg/ffmpeg": "^latest",
  "ffmpeg-static": "^latest",
  "konva": "^latest",
  "@dnd-kit/core": "^latest",
  "tailwindcss": "^latest"
}
```

### Development Dependencies
```json
{
  "typescript": "^latest",
  "vite": "^latest",
  "@vitejs/plugin-react": "^latest",
  "electron-builder": "^latest",
  "autoprefixer": "^latest",
  "postcss": "^latest"
}
```

---

## Fallback Strategy

If any primary technology causes blocking issues during development:

1. **@ffmpeg/ffmpeg** → **fluent-ffmpeg** (if export performance fails)
2. **Konva.js** → **HTML5 Canvas** (if bundle size or API issues)
3. **HTML5 `<video>`** → **Video.js** (if advanced playback needed)
4. **React Context** → **Zustand** (if state management too complex)
5. **@dnd-kit/core** → **Native HTML5 Drag** (if library fails)

---

## Development Priorities

**Phase 1 - Setup (Day 1 Morning)**:
- Electron + React + TypeScript + Vite
- Basic window rendering
- File import working

**Phase 2 - MVP Core (Day 1-2)**:
- Media library display
- Timeline with Konva.js
- Basic trim functionality
- Export working

**Phase 3 - Polish (Day 2-3)**:
- Recording features
- UI polish
- Testing and packaging

