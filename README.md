# Phantasm - WebGL Version

A web-based Voronoi puzzle with WebGL 3D rendering, staged piece release, level progression, and a unified theming system. Players start each level unsolved, release pieces in batches, and advance through levels by completing the puzzle.

## TODO
- [ ] **Remove array system leftovers** — Remove `separateGlowOutlines[]` and `pieceZIndices[]` fallback arrays in `webgl-renderer.js`; use object-based fields only (`this.pieces[index].glowOutline`, `this.pieces[index].zIndex`)

## 🐛 Debugging & Error Reporting

The project uses a lightweight `js/logger.js` for app logging and console commands for manual diagnostics.

### 🚀 Debugging Approach
- **Console Commands** — Global debug functions accessible via browser console (dev only)
- **Logger** — `logger.error()` always logs; `logger.warn()` is dev-only
- **Debug Utilities** — `debug-utils.js` with diagnostic commands (loaded in dev only)
- **Production** — Only errors surface in the console; debug commands are not bundled

### 🎯 Available Debug Commands
Run `showDebugCommands()` in the console to see all available debugging utilities:
- `autoRecoverPieces()` — Auto-fix stuck/unreachable pieces
- `debugLostPieces()` — Diagnose piece interaction issues
- `checkGhostPieces()` — Detect invisible unresponsive pieces
- `fixMispositionedPieces()` — Fix pieces positioned at origin
- `testInteractionSystem()` — Run interaction diagnostics


## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Usage & Controls](#usage--controls)
- [Development](#development)
- [Known Issues](#known-issues)
- [Browser Compatibility](#browser-compatibility)
- [Performance](#performance)
- [Dependencies](#dependencies)
- [Debug Utilities](#debug-utilities)
- [Future Development](#future-development)

## Features

### 🧩 Interactive Puzzle Gameplay
- **Unsolved Start**: Puzzle begins with empty slots, ghost outlines, and a small batch of scattered pieces
- **Staged Release**: Tap the **+** button (top-right) to release more pieces in responsive batches
- **Drag & Drop**: Move individual puzzle pieces around the canvas (mouse, touch, or keyboard)
- **Smart Snapping**: Pieces automatically snap to their correct positions when within 25px threshold
- **Audio Feedback**: Satisfying snap sound plays instantly when pieces lock into place (WebM Opus with MP3 fallback)
- **Visual Feedback**: Hover effects, drag glows, loose-piece outlines, and snap confirmations
- **Z-Index Management**: Clicked pieces always appear on top
- **Hit Detection**: Accurate piece selection with expanded interaction areas
- **Auto-Recovery System**: Automatically detects and restores unreachable or off-screen pieces
- **Responsive Stage**: 1:1 square stage (450×450 logical) scales to viewport; max display width 1200px

### 🎨 WebGL 3D Rendering
- **Hardware Acceleration**: GPU-accelerated rendering with Three.js
- **True Z-Layering**: Proper depth testing for accurate piece stacking
- **Advanced Materials**: Dynamic textures and lighting effects
- **High Performance**: Optimized for 40–60 pieces with smooth animation

### ✨ Advanced Visual Effects
- **Animated Boundaries**: Smooth Perlin noise animation of cell edges
- **State-Based Rendering**: Different visual states for pieces (normal, hover, dragging, snapped)
- **Neon Glow Effects**: Dynamic glowing outlines while dragging pieces
- **Piece Scaling**: Smooth scaling animations for interactive feedback
- **Slot Hover System**: Visual feedback when hovering over placement areas

### 🎨 Unified Theme System
- **Multiple Themes**: Level-specific themes with distinct visual styles
- **Dev Tools Integration**: Console-based theme switching for development
- **Dynamic Color Updates**: Real-time theme changes via theme manager
- **Persistent Preferences**: Unlock progress saved between sessions; manual level choice saved when using the dev panel

### 🎮 Level System & Progression
- **Manifest-Driven Levels**: Ordered level list in `js/levels.config.js` (theme, SVG, difficulty, release batches)
- **Unlock on Solve**: Level 2 unlocks when Level 1 is completed; progress saved in `phantasm-unlocked-levels`
- **Automatic Level Transition**: Solved puzzle holds 2s, then crossfades into the next level's grid
- **Completion Screen**: After the final level, a **done** screen with **Play again**
- **Always Starts at Level 1**: Cold start loads Level 1 regardless of saved preferences
- **Per-Level Difficulty**: Cell count, animation speed, and noise amplitude defined per level
- **Per-Level Release Batches**: Fewer pieces released per tap on harder levels and smaller screens

#### Level Configurations
| Level | Pieces | Speed | Noise | Release (phone / desktop) |
|-------|--------|-------|-------|-------------------------|
| Level 1 | 40 | 1.0× | 10px | 3 / 12 |
| Level 2 | 60 | 0.8× | 15px | 2 / 10 |

#### Adding a New Level
1. Add `assets/Level-N.svg`
2. Add a theme block in `js/theme.js` (palette + `baseImage`)
3. Append one entry to `LEVEL_MANIFEST` in `js/levels.config.js`

## Quick Start

1. **Clone/Download** the project
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   # or
   npm start
   ```
4. **Browser will auto-open** to `http://localhost:8080`
5. **Interact** with puzzle pieces by clicking and dragging
6. **Release more pieces** with the **+** button (top-right)
7. **Dev tuning panel** (local dev only): click the caret at the bottom to adjust cell count, speed, noise, and switch levels manually

### Environment Variables

Copy `.env.example` to `.env.development` for local tuning:

| Variable | Default (production) | Effect |
|----------|----------------------|--------|
| `VITE_DEV_PANEL` | `false` | Shows the bottom controls drawer (level selector, sliders, regenerate) |

Local development sets `VITE_DEV_PANEL=true` in `.env.development`. Production builds hide the drawer — players advance only by solving levels.

### Building for Production
```bash
npm run build        # Build optimized version to dist/
npm run preview      # Preview production build locally
npm test             # Run unit tests (Vitest)
```

## Architecture

### 🏗️ Clean Modular Structure
```
js/
├── app.js                # Vite entry point, bootstrapping, dev panel gating
├── main.js               # VoronoiPuzzle + WebGLRenderer controller
├── base.js               # Base puzzle logic
├── webgl-renderer.js     # WebGL 3D renderer (Three.js)
├── levels.config.js      # Level manifest (order, difficulty, release batches)
├── level-manager.js      # Level switching, unlock, progression
├── level-transition.js   # Phantasm Bloom transitions + completion screen
├── piece-release-manager.js  # Staged piece release (+ button)
├── unsolved-layout.js    # Scatter placement and batch sizing
├── dev-panel.js          # VITE_DEV_PANEL visibility helper
├── theme.js              # Theme definitions and utilities
├── theme-manager.js      # Dynamic theme management
├── responsive-canvas.js  # Responsive 1:1 stage layout
├── stage-constants.js    # Stage dimensions and padding
├── coordinate-utils.js   # Coordinate system utilities
├── position-manager.js   # Position and coordinate management
├── drag-offset.js        # Separate-piece positioning invariants
├── piece-material.js     # Unsolved piece texture invariants
├── pointer-input.js      # Mouse/touch/keyboard input
├── voronoi-coordinates.js
├── three-config.js       # Three.js renderer setup
├── polygon-geometry.js
├── animated-path.js      # Animated polygon + level config resolution
├── accessibility.js      # Screen reader + reduced motion helpers
├── constants.js          # Snap/solve thresholds
├── utils.js              # Voronoi diagram utilities
├── noise.js              # Perlin noise implementation
└── debug-utils.js        # Debug utilities (dev only)
```

### 🔧 Core Technologies
1. **Voronoi Generation**: d3-delaunay library for efficient diagram generation
2. **3D Rendering**: Three.js for WebGL-accelerated graphics
3. **Animation**: Perlin noise for organic boundary movement
4. **State Management**: Comprehensive piece and slot state tracking

### ⚡ Technical Highlights
- **WebGL Rendering**: Hardware-accelerated 3D graphics with Three.js
- **True Z-Layering**: WebGL depth testing for proper piece stacking
- **Dynamic Geometry**: Real-time mesh updates for animated boundaries
- **Smart Caching**: Efficient piece image capture and reuse
- **Edge Deduplication**: Optimized outline rendering to prevent overdraw
- **Object-Based Architecture**: Eliminates array synchronization issues

### 🎯 Coordinate System
The application uses **WebGL coordinates** as the global standard throughout the system:
- **Internal Calculations**: All piece positions, offsets, and transformations use WebGL coordinates (Y=0 at bottom, Y=height at top)
- **Mouse Input**: Converted from screen coordinates to WebGL coordinates at input boundary
- **Display Output**: Converted from WebGL coordinates to screen coordinates for display
- **UV Mapping**: Correctly flipped for WebGL texture coordinates
- **Camera Setup**: Orthographic camera configured for WebGL coordinate space
- **Position Manager**: Centralized coordinate conversion and position calculations

## File Structure

```
phantasm/
├── index.html                    # Main HTML entry point
├── styles.css                    # Main CSS (imports modular styles)
├── package.json                  # Project dependencies
├── vite.config.js                # Vite configuration for development server
├── .env.example                  # Documented environment variables
├── .env.development              # Local dev env (VITE_DEV_PANEL=true)
├── assets/                       # Game assets and images
│   ├── Level-1.svg               # Level 1 background (450×450)
│   ├── Level-2.svg               # Level 2 background (450×450)
│   ├── Phantasm.svg              # Legacy theme asset
│   └── sounds/                   # Audio assets
│       ├── snap.webm             # Snap sound (WebM Opus format, ~10KB)
│       └── snap.mp3              # Snap sound fallback (MP3 format, ~15KB)
├── css/
│   ├── base.css                  # Base colors, stage glow, loading overlay
│   ├── controls.css              # UI controls + release button
│   ├── progression.css           # Level transition + completion overlays
│   ├── responsive.css            # Responsive design
│   └── webgl.css                 # WebGL 3D specific styles
├── js/                           # JavaScript modules (see Architecture)
├── tests/                        # Vitest unit tests
└── README.md                     # This documentation
```

## Usage & Controls

### Player Controls (production)
1. **Click and drag** (or touch / keyboard) any loose piece to move it
2. **Tap +** (top-right) to release more pieces from the pool
3. **Auto-snap** when a piece is within 25px of its slot
4. **Complete a level** — solved image holds briefly, then crossfades into the next level automatically
5. **Complete all levels** → **done** screen → **Play again**

Ghost slot outlines show where pieces belong. Loose pieces show a default outline so they remain visible on the dark background.

### Dev Tuning Panel (`VITE_DEV_PANEL=true` only)
Access by clicking the caret at the bottom of the screen:

- **Level**: Jump between levels (all levels selectable in dev; locked levels disabled in production builds with panel enabled)
- **Cell Count**: Number of Voronoi pieces (5–60)
- **Animation Speed**: Boundary animation speed (0.1–2.0×)
- **Noise Amplitude**: Boundary deformation intensity (0–50)
- **Regenerate Puzzle**: Create a new layout (returns to unsolved start)
- **Toggle Animation** / **Toggle Grid Outlines**

### 🎨 Theme Development (Console Commands)
```javascript
// Switch to available theme
themeManager.setTheme('phantasm')   // Default cyan/green theme

// Theme information
themeManager.getAvailableThemes()    // List all available themes
themeManager.getCurrentTheme()       // Get current theme details

// Direct theme access for customization
themeManager.currentTheme.colors     // Access all color definitions
```

## Development

### 🧪 Testing
```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode during development
```

Tests cover level manifest validation, unlock/progression logic, unsolved layout batch sizing, responsive stage layout, reduced-motion behavior, and core geometry/coordinate invariants.

### ♿ Accessibility
- Screen reader announcements for level completion and game completion (`js/accessibility.js`)
- Reduced motion: level transitions skip the 2s hold and use a shorter crossfade

### 🛠️ Development Tools
- **Dev Panel**: Enable with `VITE_DEV_PANEL=true` in `.env.development`
- **Theme System**: Browser console theme switching via `themeManager`
- **Debug Utilities**: Global functions in `debug-utils.js` (loaded in dev only)
- **Hot Reload**: Vite dev server with HMR

### 🔧 Debug Utilities (Console Commands)
```javascript
// Show all available debug commands
showDebugCommands()

// Common debugging commands
autoRecoverPieces()           // Fix stuck/unreachable pieces
debugLostPieces()            // Diagnose piece issues
checkGhostPieces()           // Find invisible pieces
fixMispositionedPieces()     // Fix pieces at origin
testInteractionSystem()       // Run diagnostic tests

// Theme system
themeManager.setTheme('phantasm')
themeManager.getCurrentTheme()
```

### 🏗️ Object-Based Architecture
The system uses a fully object-based architecture for clean, maintainable code:

#### Piece Objects
```javascript
pieces[index] = {
  id: index,                    // Unique identifier
  polygon: [...],              // Voronoi shape data
  mesh: THREE.Mesh,            // 3D mesh object (or null if connected)
  state: 'solved'|'unsolved',  // Current state
  zIndex: 0,                   // Rendering depth
  offset: {x: 0, y: 0},        // Position offset
  visible: true,               // Visibility state
  isInSlot: true,              // Whether piece is in correct slot
  // ... additional properties
}
```

#### Benefits of Object System
- **No Sync Issues**: All piece data in one object
- **Better Debugging**: Clear object structure for troubleshooting
- **Atomic Updates**: All data changes together
- **Future-Proof**: Easy to extend with new properties
- **Performance**: Object property access is fast and reliable

## Known Issues



#### Detection & Recovery Tools:
Run `showDebugCommands()` in the console to see all available tools, including:
- **Auto-Recovery**: `autoRecoverPieces()` - Automatically detects and restores unreachable pieces
- **Lost Piece Diagnosis**: `debugLostPieces()` - Identifies pieces with interaction issues
- **Ghost Piece Detection**: `checkGhostPieces()` - Finds invisible unresponsive pieces
- **Scene Sync Fix**: `fixMispositionedPieces()` - Ensures pieces are properly positioned
- **System Tests**: `testInteractionSystem()` - Run comprehensive diagnostics

#### Prevention Strategies:
- **Object-Based Architecture**: Clean, maintainable code structure
- **Enhanced State Management**: Better tracking of piece states and relationships
- **Robust Hit Detection**: Multiple fallback methods for piece selection
- **Z-Index Management**: Automatic normalization to prevent accumulation
- **Debug Utilities**: Built-in diagnostic tools for troubleshooting (see `debug-utils.js`)

## Browser Compatibility

### ✅ Fully Supported
- **Chrome/Edge** 80+ (WebGL)
- **Firefox** 75+ (WebGL)
- **Safari** 13+ (WebGL)

### ⚠️ Limited Support
- **Older browsers**: WebGL required for functionality
- **Mobile browsers**: Touch interactions supported, performance may vary
- **IE11**: Not supported (requires ES6+ features)

### 🎯 Recommended
- **Desktop browsers** with WebGL support for best performance
- **Hardware acceleration** enabled for smooth 3D rendering
- **16GB+ RAM** recommended for development with larger cell counts (60 pieces)

## Performance

- **WebGL Rendering**: Optimized for 40–60 pieces with smooth animation
- **Staged Release**: Initial batch keeps separate-mesh count low on load
- **Hardware Acceleration**: GPU-accelerated rendering
- **Responsive Stage**: Logical resolution locked at init; display size updates on resize without resetting puzzle state
- **Resource Management**: WebGL disposal on level switch and regenerate

## Dependencies

### 📦 Core Libraries
- **d3-delaunay** `^5.3.0`: Efficient Voronoi diagram generation
- **Three.js** `^0.185`: WebGL 3D graphics library
- **Custom Perlin Noise**: Smooth boundary animation implementation

### 🌐 Browser APIs
- **WebGL**: Hardware-accelerated 3D graphics
- **Web Audio API**: Low-latency audio playback for snap sounds
- **HTML5 Audio**: Audio element with preloading for instant playback
- **Local Storage**: Unlock progress (`phantasm-unlocked-levels`); level preference on manual switch (`phantasm-level`)
- **Modern JavaScript**: ES modules (Vite bundle)

### 🔊 Audio System
- **Format**: WebM (Opus codec) primary, MP3 fallback
- **Trigger**: Plays instantly when piece snaps into place (magnetic snap)
- **Performance**: Preloaded on page load, zero-latency playback
- **Mobile Support**: Audio unlocked on first user interaction
- **File Size**: ~10KB (WebM) / ~15KB (MP3)

## 🔍 Debug Utilities

Diagnostic commands are accessible via the browser console in development builds.

### Quick Start
```javascript
// Show all available debug commands
showDebugCommands()

// Common troubleshooting
autoRecoverPieces()           // Fix stuck pieces
debugLostPieces()            // Diagnose interaction issues
fixMispositionedPieces()     // Fix mispositioned pieces
testInteractionSystem()       // Run system diagnostics
```

`debug-utils.js` is loaded only when `import.meta.env.DEV` is true (via `app.js`).


## Future Development

### **Save option** — Save in-progress piece positions within a level; optional random seed to regenerate the exact same layout

### **Enhanced visual piece handling feedback** — Additional hover/drag indicators beyond current outlines and glows

### **Phase 2: Medium-Risk Resource Management (Planned)**
- **Texture Memory Management**: Dispose of unused textures and geometries
- **Geometry Caching & Cleanup**: Cache and reuse geometries, dispose unused ones
- **Performance Monitoring**: Add memory and performance tracking with automatic cleanup triggers

### **Phase 3: High-Risk Resource Management (Future Consideration)**
- **Aggressive Resource Limits**: Implement strict limits on resources with automatic piece cleanup
- **Dynamic Quality Adjustment**: Reduce quality under memory pressure
- **Memory Pressure Detection**: Automatic quality reduction when system is under stress

### **Current Resource Management Features**
- **Event Listener Cleanup**: Proper cleanup of all event listeners
- **Object Reference Nullification**: Explicit nullification of object references
- **Animation Loop Cleanup**: Proper cancellation of animation loops
- **WebGL Resource Disposal**: Complete cleanup of Three.js objects and textures

### **Audio System** (implemented)
- **Snap Sound**: WebM (Opus) with MP3 fallback, preloaded for zero-latency playback
- **Future**: Pickup/hover sounds, volume controls, puzzle-complete fanfare

### **Recently implemented**
- **Unsolved start** with staged piece release (+ button) and ghost slot outlines
- **Level progression** with unlock-on-solve, automatic crossfade transitions, and **done** completion screen
- **Manifest-driven levels** (`js/levels.config.js`)
- **Dev panel gating** via `VITE_DEV_PANEL`
- **Responsive 1:1 square stage** (450×450 assets, scales to viewport)