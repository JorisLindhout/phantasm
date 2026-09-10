# Phantasm - WebGL Version

A web-based Voronoi puzzle with WebGL 3D rendering, staged piece release, level progression, and a unified theming system. Players start each level unsolved, release pieces in batches, and advance through levels by completing the puzzle.

## 🐛 Debugging & Error Reporting

The project uses a lightweight `js/logger.js` for app logging and console commands for manual diagnostics.

### 🚀 Debugging Approach
- **Console Commands** — Global debug functions accessible via browser console (dev only)
- **Logger** — `logger.error()` always logs; `logger.warn()` is dev-only
- **Debug Utilities** — `debug-utils.js` with diagnostic commands (loaded in dev only)
- **Production** — Only errors surface in the console; debug commands are not bundled

### 🎯 Available Debug Commands
Run `showDebugCommands()` in the console to see all available debugging utilities:
- `autoSnapPiece(pieceIndex)` — Manually snap a piece to its slot
- `autoRecoverPieces()` — Layout + interaction repair for released loose pieces
- `debugLostPieces()` — Diagnose released pieces missing a mesh
- `fixMispositionedPieces()` — Repair separate-piece mesh visibility/position
- `testInteractionSystem()` — Run interaction diagnostics


## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Usage & Controls](#usage--controls)
- [Development](#development)
- [Deployment](#deployment-cloudflare)
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
- **Visual Feedback**: Hover effects, drag glows, loose-piece outlines, and snap confirmations
- **Z-Index Management**: Clicked pieces always appear on top
- **Hit Detection**: Accurate piece selection with expanded interaction areas
- **Auto-Recovery System**: Automatically detects and restores unreachable or off-screen pieces
- **Responsive Stage**: 1:1 square stage; logical canvas locked to 450×450 (level artwork size), display scales to viewport (min display ~280px, min viewport 375px; tighter padding below 400px)

### 🎨 WebGL 3D Rendering
- **Hardware Acceleration**: GPU-accelerated rendering with Three.js
- **True Z-Layering**: Proper depth testing for accurate piece stacking
- **Advanced Materials**: Dynamic textures and lighting effects
- **High Performance**: Optimized for 40–60 pieces with smooth animation

### ✨ Advanced Visual Effects
- **Animated Boundaries**: Shared topology morph — a fixed count of morph corners (seeded per level) that relocate via paired birth/death so pieces and slots stay flush without growing complexity; plus organic edge noise
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
- **Manifest-Driven Levels**: Ordered level list in `js/levels.config.js` (theme, SVG, difficulty, release batches, drone)
- **Unlock on Solve**: The next level unlocks when the current one is completed; progress saved in `phantasm-unlocked-levels`
- **Automatic Level Transition**: Solved puzzle holds 2s, then crossfades into the next level's grid
- **Completion Screen**: After the final level, a **done** screen with **Play again**
- **Always Starts at Level 1**: Cold start loads Level 1 regardless of saved preferences
- **Per-Level Difficulty**: Cell count, animation speed, noise amplitude, morph corner count, morph interval, birth offset, and drone timbre defined per level
- **Per-Level Release Batches**: Fewer pieces released per tap on harder levels and smaller screens

### 🔊 Synthesized Audio
- **No audio files**: Snap clicks, the piece-release cue, and the looping drone are Web Audio graphs — nothing under `public/assets/`
- **Shared mixer**: One `AudioContext` with master / drone / sfx buses; the drone is the loudness reference so one-shots stay matched
- **Per-level drone**: Pitch, filter, and motion rise across levels via optional `drone` knobs on `LEVEL_MANIFEST` (omitted keys inherit the engine default; leave `toneGain` off the row)
- **When it plays**: Drone starts with the puzzle (first tap on iPhone/iPad); snap plays when a piece locks; the release cue plays only when you tap **+**, not on load
- **Mute**: Speaker button next to **+** (sound on by default)
- **Level changes**: The bed ramps into the next recipe during the bloom; completion fades it out; Play again restores Level 1

#### Level Configurations
| Level | Pieces | Speed | Noise | Morph corners | Morph interval | Birth offset | Release (phone / desktop) |
|-------|--------|-------|-------|---------------|----------------|--------------|-------------------------|
| Level 1 | 20 | 1.2× | 5px | 3 | 4000ms | 14px | 4 / 15 |
| Level 2 | 40 | 1.0× | 10px | 5 | 3200ms | 16px | 3 / 12 |
| Level 3 | 60 | 0.8× | 15px | 8 | 2400ms | 18px | 2 / 10 |
| Level 4 | 80 | 0.6× | 20px | 12 | 1800ms | 20px | 1 / 7 |

#### Adding a New Level
1. Add `public/assets/Level-N.svg`
2. Add a theme block in `js/theme.js` (palette + `baseImage` pointing at `./assets/Level-N.svg`)
3. Append one entry to `LEVEL_MANIFEST` in `js/levels.config.js` (`drone` optional; omitted knobs inherit the default bed)

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
6. **Release more pieces** with the **+** button (top-right); mute with the speaker beside it
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

### Deployment (Cloudflare)

Production builds are static files in `dist/`. Game images must live in `public/assets/` so Vite copies them into `dist/assets/` — runtime paths like `./assets/Level-1.svg` resolve from there. Audio is synthesized at runtime (no sound files to copy).

The repo includes `wrangler.jsonc` for Cloudflare Workers static assets:

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Output directory | `dist` |
| Deploy command | `npx wrangler deploy` |

`wrangler.jsonc` serves `dist/` as static assets with SPA fallback for unknown routes. Live site: [phantasm.joris.wtf](https://phantasm.joris.wtf/).

## Architecture

### 🏗️ Clean Modular Structure
```
js/
├── app.js                # Vite entry point, bootstrapping, dev panel gating
├── main.js               # VoronoiPuzzle + WebGLRenderer controller
├── base.js               # Base puzzle logic
├── webgl-renderer.js     # WebGL 3D renderer (Three.js)
├── levels.config.js      # Level manifest (order, difficulty, release batches, drone)
├── level-manager.js      # Level switching, unlock, progression
├── level-transition.js   # Phantasm Bloom transitions + completion screen
├── piece-release-manager.js  # Staged piece release (+ button)
├── game-audio.js         # Shared AudioContext, mix buses, mute, iOS unlock
├── drone-sound.js        # Looping bed; per-level params from the manifest
├── snap-sound.js         # Synthesized snap + piece-release clicks
├── audio-toggle.js       # Stage-corner mute button
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
├── voronoi-topology-morph.js # Shared corner birth/death across the tiling
├── accessibility.js      # Screen reader + reduced motion helpers
├── constants.js          # Snap/solve thresholds
├── utils.js              # pointInPolygon helper
├── logger.js             # App error/warn logger
└── debug-utils.js        # Debug utilities (dev only)
```

### 🔧 Core Technologies
1. **Voronoi Generation**: d3-delaunay library for efficient diagram generation
2. **3D Rendering**: Three.js for WebGL-accelerated graphics
3. **Animation**: Shared Voronoi topology morph (fixed morph-corner count via seed + paired birth/death so the tiling stays flush) plus edge noise; world-space UVs so the mural stays undistorted while silhouettes morph
4. **State Management**: Comprehensive piece and slot state tracking

### ⚡ Technical Highlights
- **WebGL Rendering**: Hardware-accelerated 3D graphics with Three.js
- **True Z-Layering**: WebGL depth testing for proper piece stacking
- **Dynamic Geometry**: Real-time mesh updates for animated boundaries
- **Smart Caching**: Efficient piece image capture and reuse
- **Edge Deduplication**: Optimized outline rendering to prevent overdraw
- **Object-Based Architecture**: Eliminates array synchronization issues

### 🎯 Coordinate System
Pointer input is scaled from CSS pixels to the canvas's internal resolution. Puzzle logic and meshes share the same screen-space axes (Y increases downward) — no Y-flip between mouse and seed coordinates.

## File Structure

```
phantasm/
├── index.html                    # Main HTML entry point
├── styles.css                    # Main CSS (imports modular styles)
├── package.json                  # Project dependencies
├── vite.config.js                # Vite configuration for development server
├── wrangler.jsonc                # Cloudflare static assets deploy config
├── public/                       # Static assets (copied to dist root as-is)
│   ├── favicon.svg
│   ├── favicon-96x96.png
│   ├── apple-touch-icon.png
│   ├── web-app-manifest-192x192.png
│   ├── web-app-manifest-512x512.png
│   ├── site.webmanifest          # PWA manifest
│   └── assets/                   # Game images (served at /assets/…)
│       ├── Level-1.svg           # Level 1 background (450×450)
│       ├── Level-2.svg           # Level 2 background (450×450)
│       ├── Level-3.svg           # Level 3 background (450×450)
│       ├── Level-4.svg           # Level 4 background (450×450)
│       └── Phantasm.svg          # Controls-drawer / console theme asset
├── .env.example                  # Documented environment variables
├── .env.development              # Local dev env (VITE_DEV_PANEL=true)
├── css/
│   ├── base.css                  # Base colors, stage glow, loading overlay
│   ├── controls.css              # UI controls, release button, audio toggle
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
3. **Mute / unmute** with the speaker button next to **+**
4. **Auto-snap** when a piece is within 25px of its slot
5. **Complete a level** — solved image holds briefly, then crossfades into the next level automatically
6. **Complete all levels** → **done** screen → **Play again**

Ghost slot outlines show where pieces belong. Loose pieces show a default outline so they remain visible on the dark background.

### Dev Tuning Panel (`VITE_DEV_PANEL=true` only)
Access by clicking the caret at the bottom of the screen:

- **Level**: Jump between levels (all levels selectable in dev; locked levels disabled in production builds with panel enabled)
- **Cell Count**: Number of Voronoi pieces (5–80)
- **Animation Speed**: Boundary animation speed (0.1–2.0×)
- **Noise Amplitude**: Boundary deformation intensity (0–50)
- **Morph Interval (ms)**: Time between paired corner relocate events (500–8000; shorter = harder)
- **Morph Corners**: How many morph corners are seeded for the level (0–20; applies on regenerate / level load)
- **Regenerate Puzzle**: Create a new layout (returns to unsolved start)
- **Toggle Animation** / **Toggle Grid Outlines**

### 🎨 Theme Development (Console Commands)
```javascript
// Switch theme (levels normally own themes; console override for development)
themeManager.setTheme('levelOne')   // Or levelTwo / levelThree / levelFour / phantasm

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

Tests cover level manifest validation, unlock/progression logic, unsolved layout batch sizing, synthesized audio mix and drone unlock, responsive stage layout, reduced-motion behavior, and core geometry/coordinate invariants.

### ♿ Accessibility
- Screen reader announcements for level completion and game completion (`js/accessibility.js`)
- Reduced motion: level transitions skip the 2s hold and use a shorter crossfade; the drone ramps faster
- Mute control is a real button (`aria-pressed`, “Mute sound” / “Unmute sound”)

### 🛠️ Development Tools
- **Dev Panel**: Enable with `VITE_DEV_PANEL=true` in `.env.development`
- **Theme System**: Browser console theme switching via `themeManager`
- **Debug Utilities**: Global functions in `debug-utils.js` (loaded in dev only)
- **Hot Reload**: Vite dev server with HMR
- **Sound lab**: local gitignored `sound-lab.html` (served at `/sound-lab.html`) for hunting drone/snap recipes by ear, then paste knobs into `LEVEL_MANIFEST` / `js/snap-sound.js`

### 🔧 Debug Utilities (Console Commands)
```javascript
// Show all available debug commands
showDebugCommands()

// Common debugging commands
autoRecoverPieces()           // Layout + interaction repair (released pieces)
debugLostPieces()            // Diagnose released pieces missing meshes
fixMispositionedPieces()     // Repair separate-piece meshes
testInteractionSystem()       // Run diagnostic tests

// Theme system
themeManager.setTheme('levelOne')
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

### Piece recovery (two policies)

Automatic recovery uses two separate policies in [`js/webgl-renderer.js`](js/webgl-renderer.js):

1. **Layout recovery** — `recoverOffscreenLoosePieces()` runs at piece-release boundaries. Re-scatters released loose pieces that have no mesh or are off-stage. Does not mark pieces solved.

2. **Interaction repair** — `repairSeparatePiece()` runs only on click (`allowRepair: true` in hit detection). Restores mesh visibility, scene membership, and position for released loose pieces. Does not mark pieces solved.

Only player snap / `autoSnapPieceToSlot()` promotes a piece to solved. Hover does not run repair or mutate piece state.

#### Detection & Recovery Tools:
Run `showDebugCommands()` in the console to see all available tools, including:
- **Manual recovery**: `autoRecoverPieces()` — runs layout recovery + interaction repair for all released pieces
- **Lost piece diagnosis**: `debugLostPieces()` — lists released unsolved pieces with no mesh
- **Mesh repair**: `fixMispositionedPieces()` — calls `repairSeparatePiece()` on each piece
- **System tests**: `testInteractionSystem()` — scene sync and state validity checks

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
- **Safari** 13+ (WebGL). On iPhone/iPad, Web Audio starts on the first tap so the bed reaches the speaker (a load-time context over LAN HTTP stays silent).

### ⚠️ Limited Support
- **Older browsers**: WebGL required for functionality
- **Mobile browsers**: Touch interactions supported, performance may vary

### 🎯 Recommended
- **Desktop browsers** with WebGL support for best performance
- **Hardware acceleration** enabled for smooth 3D rendering
- **16GB+ RAM** recommended for development with larger cell counts (60 pieces)

## Performance

- **WebGL Rendering**: Optimized for 40–60 pieces with smooth animation
- **Staged Release**: Initial batch keeps separate-mesh count low on load
- **Hardware Acceleration**: GPU-accelerated rendering
- **Responsive Stage**: Logical resolution locked at init; display size updates on resize without resetting puzzle state
- **Resource Management**: WebGL disposal on level switch and regenerate; event listener, animation loop, and object reference cleanup on teardown

## Dependencies

### 📦 Core Libraries
- **d3-delaunay** `^5.3.0`: Efficient Voronoi diagram generation
- **Three.js** `^0.185`: WebGL 3D graphics library

### 🌐 Browser APIs
- **WebGL**: Hardware-accelerated 3D graphics
- **Web Audio**: Synthesized snap, piece-release, and looping drone (`js/game-audio.js`, `js/drone-sound.js`, `js/snap-sound.js`); no HTML5 `<audio>` files
- **Local Storage**: Unlock progress (`phantasm-unlocked-levels`); level preference on manual switch (`phantasm-level`)
- **Modern JavaScript**: ES modules (Vite bundle)

## 🔍 Debug Utilities

Diagnostic commands are accessible via the browser console in development builds.

### Quick Start
```javascript
// Show all available debug commands
showDebugCommands()

// Common troubleshooting
autoRecoverPieces()           // Layout + interaction repair
debugLostPieces()            // Diagnose missing meshes
fixMispositionedPieces()     // Repair separate-piece meshes
testInteractionSystem()       // Run system diagnostics
```

Only snap / player placement marks a piece solved — recovery never auto-completes the puzzle.

`debug-utils.js` is loaded only when `import.meta.env.DEV` is true (via `app.js`).


## Future Development

### Gameplay & content
- **Level development** — new artwork and manifest entries (see [Adding a New Level](#adding-a-new-level))


### Audio
- Pickup / hover cues and a puzzle-complete fanfare (mute and the per-level drone bed are already in)

### UX & polish
- **Completion screen** — design a fitting ending screen after the final level (replacing the current minimal **done** + Play again)
- **Enhanced visual piece handling feedback** — additional hover/drag indicators beyond current outlines and glows

### Technical (when needed)
- **Profiling & geometry reuse** — extend the existing dispose path with caching and runtime memory/FPS monitoring if piece counts or level count grow

### Deferred (scale only)
- Dynamic quality reduction and aggressive resource limits — only worth revisiting for much larger puzzles or long sessions on low-end devices
