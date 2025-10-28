# Phase 0: Setup Phase

**Barebones foundation that functions at a basic level but isn't fully usable.**

**Duration**: 4-6 hours  
**Goal**: Get Electron + React + TypeScript running with basic window and routing

---

## Deliverables

By the end of this phase, you should have:
- Electron app that launches and displays a window
- React rendering in the Electron window
- Basic navigation between screens (launch → project selection)
- TypeScript fully configured
- Development environment ready (Vite + HMR working)
- Basic project structure in place

---

## Tasks

### 1. Initialize Project Structure (1 hour)

#### Setup Development Environment
- **Install core dependencies**
  - Install Electron, React, ReactDOM, TypeScript
  - Install Vite and plugins (@vitejs/plugin-react, vite-plugin-electron)
  - Install Tailwind CSS and dependencies
  - Install ESLint and Prettier for code quality

- **Create directory structure**
  - Create `src/main/` for Electron main process
  - Create `src/preload/` for security bridge scripts
  - Create `src/renderer/` for React frontend
  - Create `src/renderer/components/` for React components
  - Create `src/renderer/screens/` for top-level screens

- **Create configuration files**
  - Create `tsconfig.json` with strict mode enabled
  - Create `tsconfig.main.json` for main process TypeScript
  - Create `tsconfig.renderer.json` for renderer TypeScript
  - Create `vite.config.ts` for Vite configuration
  - Create `tailwind.config.js` for Tailwind setup
  - Create `.gitignore` with appropriate exclusions

#### Code to Create
```typescript
// package.json - Define scripts and dependencies
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx"
  }
}

// tsconfig.json - TypeScript configuration
```

**Acceptance Criteria**:
- [ ] Project builds without errors
- [ ] Directory structure matches project-rules.md
- [ ] All configuration files properly set up

---

### 2. Electron Main Process Setup (1 hour)

#### Create Main Process Files
- **Main entry point** (`src/main/index.ts`)
  - Import required Electron modules (app, BrowserWindow, ipcMain)
  - Create app ready handler
  - Initialize application window
  - Handle app lifecycle events (ready, window-all-closed)

- **Window management** (`src/main/window.ts`)
  - Create BrowserWindow with proper security settings
  - Set window size and properties (width: 1200, height: 800)
  - Configure window options (titleBarStyle, webSecurity, etc.)
  - Load renderer HTML file
  - Handle window close events

- **App lifecycle** (`src/main/app.ts`)
  - Set app name and version
  - Configure single-instance app pattern
  - Handle app ready event
  - Set up basic menu (optional: File, Edit, Help)

#### Security Configuration
- Set `nodeIntegration: false` in window options
- Set `contextIsolation: true` for secure IPC
- Set `webSecurity: true` (or configure CSP if needed)
- Create preload script bridge

#### Code Example
```typescript
// src/main/index.ts
import { app, BrowserWindow } from 'electron';
import { createWindow } from './window';

app.whenReady().then(() => {
  createWindow();
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});
```

**Acceptance Criteria**:
- [ ] App launches and shows blank window
- [ ] Window has proper title and size
- [ ] Security settings configured correctly
- [ ] No console errors

---

### 3. React Renderer Setup (1 hour)

#### Create Renderer Entry Points
- **HTML entry** (`src/renderer/index.html`)
  - Create HTML structure
  - Link to React entry point
  - Include Tailwind CSS
  - Set title and meta tags

- **React entry point** (`src/renderer/main.tsx`)
  - Import React and ReactDOM
  - Create root element
  - Render App component
  - Enable React DevTools (development only)

- **Root component** (`src/renderer/App.tsx`)
  - Create basic component structure
  - Set up routing logic (simple state-based for MVP)
  - Define screen states (launch, project-selection, main)
  - Add Tailwind classes for styling

#### Basic Routing
- Implement simple state-based routing
- Create screen components (stubs for now)
- Handle navigation between screens

#### Code Example
```typescript
// src/renderer/App.tsx
/**
 * Root Application Component
 * 
 * Handles top-level routing and screen navigation.
 * Manages app state transitions between Launch, Project Selection, and Main screens.
 */
export function App() {
  const [currentScreen, setCurrentScreen] = useState<'launch' | 'project-selection' | 'main'>('launch');
  
  return (
    <div className="h-screen w-screen bg-gray-900 text-white">
      {currentScreen === 'launch' && <LaunchScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'project-selection' && <ProjectSelectionScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'main' && <MainScreen />}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] React renders in Electron window
- [ ] Tailwind CSS is working (can see styled elements)
- [ ] Basic routing between screens works
- [ ] Hot Module Replacement works

---

### 4. TypeScript Configuration (30 minutes)

#### Configure TypeScript
- **Main process config** (`tsconfig.main.json`)
  - Target ES2020 or ES2021
  - Module resolution: Node
  - Include main process files
  - Set compiler options for Node.js environment

- **Renderer process config** (`tsconfig.renderer.json`)
  - Target ES2020
  - Module resolution: Bundler (Vite)
  - Include renderer files
  - JSX support: React

- **Base config** (`tsconfig.json`)
  - Strict mode enabled
  - No unused locals/warnings
  - ES module interop
  - Force consistent casing in file names

#### Create Type Definitions
- Create `src/types/` directory
- Create basic type files (clip, timeline, project interfaces)
- Set up index.ts for type exports

#### Code Example
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Acceptance Criteria**:
- [ ] TypeScript compiles without errors
- [ ] Strict mode is enabled
- [ ] All files have proper type annotations
- [ ] Base type definitions created

---

### 5. Screen Components (Stubs) (1 hour)

#### Create Screen Components
- **LaunchScreen** (`src/renderer/components/screens/LaunchScreen.tsx`)
  - Create component structure
  - Display app logo/title
  - Add button to navigate to project selection
  - Style with Tailwind CSS

- **ProjectSelectionScreen** (`src/renderer/components/screens/ProjectSelectionScreen.tsx`)
  - Create two buttons: "New Project" and "Open Existing Project"
  - Add navigation handlers (stubs for now)
  - Style buttons and layout

- **MainScreen** (`src/renderer/components/screens/MainScreen.tsx`)
  - Create main layout structure
  - Placeholder for panels (media library, timeline, preview)
  - Add navigation back to launch screen (for testing)

#### Code Example
```typescript
/**
 * Launch Screen Component
 * 
 * Initial screen shown when app launches.
 * Displays app branding and option to start new project or continue.
 * 
 * @component
 */
export function LaunchScreen({ onNavigate }: LaunchScreenProps) {
  const handleStartProject = () => {
    onNavigate('project-selection');
  };
  
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">ClipForge</h1>
        <button 
          onClick={handleStartProject}
          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] All three screens render
- [ ] Navigation between screens works
- [ ] Buttons have basic styling
- [ ] Components are properly typed

---

### 6. Basic IPC Setup (30 minutes)

#### Create Preload Script
- **Preload script** (`src/preload/index.ts`)
  - Set up context bridge for secure IPC
  - Define exposed API methods (stubs)
  - Add type definitions for exposed API

- **Main process IPC handlers** (`src/main/ipc/handlers.ts`)
  - Create IPC handler structure
  - Add basic handlers (file dialog stubs)
  - Set up error handling

#### Code Example
```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

interface ElectronAPI {
  openFileDialog: () => Promise<string[]>;
}

const api: ElectronAPI = {
  openFileDialog: () => ipcRenderer.invoke('file:open-dialog'),
};

contextBridge.exposeInMainWorld('electron', api);
```

**Acceptance Criteria**:
- [ ] Preload script loads without errors
- [ ] IPC handlers are registered
- [ ] Type safety for IPC methods
- [ ] No security warnings in console

---

## Testing Checklist

### Basic Functionality
- [ ] App launches without errors
- [ ] Window displays correctly (1200x800)
- [ ] Can navigate between screens
- [ ] Hot Module Replacement works
- [ ] No console errors

### Code Quality
- [ ] All files have header documentation
- [ ] Functions have JSDoc comments
- [ ] TypeScript compiles without errors
- [ ] No ESLint warnings
- [ ] Formatting is consistent

### Project Structure
- [ ] Directory structure matches project-rules.md
- [ ] All files in correct locations
- [ ] Proper separation of main/renderer processes

---

## Success Criteria

**Phase 0 is complete when:**
- ✅ Electron app launches successfully
- ✅ React renders in the window with HMR working
- ✅ Can navigate between Launch, Project Selection, and Main screens
- ✅ TypeScript compiles without errors
- ✅ Basic IPC communication structure is in place
- ✅ No security warnings or console errors
- ✅ Development environment is fully functional

**Expected Output**: A barebones Electron app that launches, displays screens, and can navigate between different views. No functionality is implemented yet, but the foundation is solid.

---

## Common Issues

### Issue: App won't launch
**Solution**: Check Electron version compatibility, ensure all dependencies installed

### Issue: Window is blank
**Solution**: Verify index.html path in loadURL, check console for errors

### Issue: HMR not working
**Solution**: Ensure Vite config is correct for Electron, check plugin setup

### Issue: TypeScript errors
**Solution**: Verify tsconfig.json settings, check import paths

---

## Next Steps

After completing Phase 0, proceed to **Phase 1: MVP** to implement:
- Project file management
- Media import functionality
- Basic timeline with preview
- Trim functionality
- Export capability

