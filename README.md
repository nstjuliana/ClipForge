# ClipForge

**AI-powered desktop video editor built with Electron, React, and TypeScript.**

A professional video editing application for the desktop, inspired by CapCut's intuitive interface and powerful features.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🏗️ Project Structure

```
ClipForge/
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # Preload scripts (security bridge)
│   └── renderer/        # React frontend
│       ├── components/ # React components
│       ├── screens/     # Top-level screen components
│       └── types/       # TypeScript type definitions
├── _docs/              # Project documentation
└── dist/               # Build output
```

## 🎯 Current Status

**Phase 0: Setup** ✅ **COMPLETE**

- ✅ Electron app structure
- ✅ React + TypeScript setup
- ✅ Tailwind CSS styling
- ✅ Basic routing between screens
- ✅ IPC communication structure
- ✅ Security configurations

**Next Phase**: Implement MVP features (media import, timeline, preview, export)

## 🛠️ Technology Stack

- **Electron.js** - Desktop framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool with HMR
- **Tailwind CSS** - Styling
- **ESLint** - Code quality

## 📝 Documentation

See `_docs/` for detailed documentation:

- `project-overview.md` - Project goals and requirements
- `tech-stack.md` - Technology decisions
- `project-rules.md` - Coding standards
- `phases/` - Development phase documentation

## 🎨 Features (Planned)

### Phase 1: MVP
- Media file import
- Basic timeline
- Video preview
- Trim functionality
- Export to MP4

### Phase 2: Core Features
- Screen recording
- Webcam recording
- Drag & drop clips
- Timeline zoom
- Split clips

### Phase 3: Polish
- UI enhancements
- Keyboard shortcuts
- Project save/load
- Performance optimizations

## 📄 License

This project is part of a 72-hour sprint challenge.

## 🙋‍♂️ Support

For issues or questions, refer to the documentation in `_docs/` or review the phase-specific documentation.

---

**Built in 72 hours** 🚀

