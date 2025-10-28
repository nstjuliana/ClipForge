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

