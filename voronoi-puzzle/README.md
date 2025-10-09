# Phantasm - WebGL Version

A high-performance web-based puzzle prototype featuring animated Voronoi cells with WebGL 3D rendering, advanced visual effects, and a unified theming system.

## TODO
- [] **Fix unreachable pieces issue** - Some pieces become unresponsive to interaction - this seems fixed, but leaving here since we might need to do some more rigorous testing
- [] **Remove array system leftovers** - Remove `separateGlowOutlines[]` (22 uses) and `pieceZIndices[]` (23 uses) arrays in webgl-renderer.js and convert all references to use object-based system only (`this.pieces[index].glowOutline` and `this.pieces[index].zIndex`). Comment on line 39 says "Array backup system removed" but arrays are still being used with fallback logic.

## 🐛 Debugging & Error Reporting

The project uses a simple, reliable debugging approach based on standard JavaScript console logging.

### 🚀 Debugging Approach
- **Console Commands** - Global debug functions accessible via browser console
- **Error Handling** - Critical errors are logged to console.error()
- **Debug Utilities** - Separate debug-utils.js file with diagnostic tools
- **Production Safe** - Debug code is isolated and easy to exclude from production builds
- **No Dependencies** - Simple, lightweight debugging tools

### 🎯 Available Debug Commands
Run `showDebugCommands()` in the console to see all available debugging utilities including:
- `autoRecoverPieces()` - Auto-fix stuck/unreachable pieces
- `debugLostPieces()` - Diagnose piece interaction issues
- `checkGhostPieces()` - Detect invisible unresponsive pieces
- `toggleInteractionDebug()` - Enable detailed interaction logging
- And 10+ more diagnostic functions


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
- **Drag & Drop**: Move individual puzzle pieces around the canvas
- **Smart Snapping**: Pieces automatically snap to their correct positions when within 25px threshold
- **Audio Feedback**: Satisfying snap sound plays instantly when pieces lock into place (WebM Opus with MP3 fallback)
- **Visual Feedback**: Hover effects, drag glows, and snap confirmations
- **Z-Index Management**: Clicked pieces always appear on top
- **Hit Detection**: Accurate piece selection with expanded interaction areas
- **Auto-Recovery System**: Automatically detects and restores unreachable pieces
- **Responsive Canvas**: Optional responsive mode adapts to screen width while maintaining 16:9 aspect ratio, or fixed 1200x675 pixels mode

### 🎨 WebGL 3D Rendering
- **Hardware Acceleration**: GPU-accelerated rendering with Three.js
- **True Z-Layering**: Proper depth testing for accurate piece stacking
- **Advanced Materials**: Dynamic textures and lighting effects
- **High Performance**: Optimized for 30+ pieces with smooth animation

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
- **Persistent Preferences**: Theme and level choices saved between sessions

### 🎮 Level System
- **Multiple Levels**: Two distinct levels with increasing difficulty
- **Dynamic Difficulty**: Different cell counts, animation speeds, and noise amplitudes per level
- **Theme Integration**: Each level has its own visual theme and background image
- **Complete Reinitialization**: Clean state management with loading screen during transitions
- **Persistent Progress**: Level preferences saved in localStorage (`phantasm-level`)
- **Loading Screen**: Visual feedback during level transitions

#### Level Configurations
- **Level 1**: 40 pieces, normal speed (1.0x), moderate noise (10px)
- **Level 2**: 60 pieces, faster speed (0.8x), higher noise (15px)

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
6. **Adjust settings** using the control panel (click the caret icon)
7. **Switch levels** using the level selector in the controls panel

### Building for Production
```bash
npm run build        # Build optimized version to dist/
npm run preview      # Preview production build locally
```

## Architecture

### 🏗️ Clean Modular Structure
```
js/
├── utils.js              # Voronoi diagram utilities
├── noise.js              # Perlin noise implementation
├── base.js               # Base puzzle logic
├── coordinate-utils.js   # Coordinate system utilities
├── position-manager.js   # Position and coordinate management
├── responsive-canvas.js  # Responsive canvas system
├── theme.js              # Theme definitions and utilities
├── theme-manager.js      # Dynamic theme management
├── level-manager.js      # Level switching and configuration
├── webgl-renderer.js     # WebGL 3D renderer (Three.js)
├── debug-utils.js        # Debug utilities and console commands
└── main.js               # Main application controller
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
voronoi-puzzle/
├── index.html                    # Main HTML entry point
├── styles.css                    # Main CSS (imports modular styles)
├── package.json                  # Project dependencies
├── vite.config.js                # Vite configuration for development server
├── assets/                       # Game assets and images
│   ├── Level-1.svg               # Level 1 background image
│   ├── Level-2.svg               # Level 2 background image
│   ├── Phantasm.svg              # Additional background image
│   └── sounds/                   # Audio assets
│       ├── snap.webm             # Snap sound (WebM Opus format, ~10KB)
│       └── snap.mp3              # Snap sound fallback (MP3 format, ~15KB)
├── css/                          # Modular CSS architecture
│   ├── base.css                  # Base colors and layout
│   ├── controls.css              # UI controls styling
│   ├── responsive.css            # Responsive design
│   └── webgl.css                 # WebGL 3D specific styles
├── js/                           # JavaScript modules
│   ├── utils.js                  # Voronoi diagram utilities
│   ├── noise.js                  # Perlin noise implementation
│   ├── base.js                   # Core puzzle logic
│   ├── coordinate-utils.js       # Coordinate system conversion utilities
│   ├── position-manager.js       # Centralized position management
│   ├── responsive-canvas.js      # Responsive canvas system
│   ├── theme.js                  # Theme system definitions
│   ├── theme-manager.js          # Dynamic theme management
│   ├── level-manager.js          # Level switching and configuration
│   ├── webgl-renderer.js         # WebGL 3D renderer (Three.js)
│   ├── debug-utils.js            # Debug utilities and console commands
│   └── main.js                   # Main application controller
└── README.md                     # This documentation
```

## Usage & Controls

### 🎮 Basic Controls
1. **Click and drag** any piece to move it around
2. **Hover** over pieces or slots for visual feedback
3. **Auto-snap** occurs when pieces are within 25px of their correct position

### 🎛️ Control Panel
Access the control panel by clicking the caret icon (^) in the top-right corner:

- **Level**: Select between Level 1 and Level 2 (auto-adjusts cell count, animation speed, and noise amplitude)
- **Cell Count**: Number of Voronoi pieces (5-50) - overridden by level selection
- **Animation Speed**: Speed of boundary animation (0.1-2.0x) - overridden by level selection
- **Noise Amplitude**: Intensity of boundary deformation (0-50) - overridden by level selection
- **Regenerate Puzzle**: Create a new puzzle layout
- **Toggle Animation**: Enable/disable boundary animation
- **Toggle Grid Outlines**: Show/hide piece outlines

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

### 🛠️ Development Tools
- **Theme System**: Use browser console for theme switching
- **Debug Utilities**: Global functions for troubleshooting (see `debug-utils.js`)
- **Hot Reload**: No build step - just refresh browser after changes
- **Modular Architecture**: Easy to modify individual components
- **Vite Dev Server**: Fast development server with hot module replacement

### 🔧 Debug Utilities (Console Commands)
```javascript
// Show all available debug commands
showDebugCommands()

// Common debugging commands
autoRecoverPieces()           // Fix stuck/unreachable pieces
debugLostPieces()            // Diagnose piece issues
checkGhostPieces()           // Find invisible pieces
testInteractionSystem()       // Run diagnostic tests

// Toggle verbose logging
toggleInteractionDebug()      // Mouse/click logging
toggleMaterialUpdates()       // Visual update logging
toggleNeonGlow()             // Glow effect logging

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
- **Debug Logging**: `toggleInteractionDebug()` - Enable detailed interaction logging

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
- **16GB+ RAM** for larger puzzle sizes (50+ pieces)

## Performance

- **WebGL Rendering**: Optimized for 30+ pieces with excellent performance
- **Hardware Acceleration**: GPU-accelerated rendering for smooth animations
- **Animation**: Can be toggled off for better performance on slower devices
- **Fixed Canvas Size**: 1200x675 pixel canvas prevents memory bloat from resizing
- **Resource Management**: Enhanced cleanup and disposal system for better memory management

## Dependencies

### 📦 Core Libraries
- **d3-delaunay** `^5.3.0`: Efficient Voronoi diagram generation
- **Three.js** `r128`: WebGL 3D graphics library
- **Custom Perlin Noise**: Smooth boundary animation implementation

### 🌐 Browser APIs
- **WebGL**: Hardware-accelerated 3D graphics
- **Web Audio API**: Low-latency audio playback for snap sounds
- **HTML5 Audio**: Audio element with preloading for instant playback
- **Local Storage**: Theme preference persistence
- **Modern JavaScript**: ES6+ features for optimal performance

### 🔊 Audio System
- **Format**: WebM (Opus codec) primary, MP3 fallback
- **Trigger**: Plays instantly when piece snaps into place (magnetic snap)
- **Performance**: Preloaded on page load, zero-latency playback
- **Mobile Support**: Audio unlocked on first user interaction
- **File Size**: ~10KB (WebM) / ~15KB (MP3)

## 🔍 Debug Utilities

The project includes a comprehensive set of debugging tools accessible via the browser console.

### Quick Start
```javascript
// Show all available debug commands
showDebugCommands()

// Common troubleshooting
autoRecoverPieces()           // Fix stuck pieces
debugLostPieces()            // Diagnose interaction issues
testInteractionSystem()       // Run system diagnostics

// Enable verbose logging for specific systems
toggleInteractionDebug()      // Mouse/click events
toggleMaterialUpdates()       // Visual updates
```

All debug utilities are defined in `js/debug-utils.js` and are automatically loaded with the application.


## Future Development

### **Enhanced visual piece handling feedback** - Add improved visual feedback for piece interactions (hover effects, drag indicators, etc.)

### **Phase 1: Responsive Design (Planned)**
- **Responsive Canvas on Load**: Implement canvas sizing that adapts to screen width while maintaining 16:9 aspect ratio on initial load
- **Mobile Optimization**: Ensure game is playable on tablets and mobile devices without horizontal scrolling
- **Viewport Adaptation**: Canvas should scale appropriately for different screen sizes while preserving gameplay experience

### **Phase 2: Medium-Risk Resource Management (Planned)**
- **Texture Memory Management**: Dispose of unused textures and geometries
- **Geometry Caching & Cleanup**: Cache and reuse geometries, dispose unused ones
- **Performance Monitoring**: Add memory and performance tracking with automatic cleanup triggers
- **Risk Level**: Medium - Requires testing to ensure no visual glitches

### **Phase 3: High-Risk Resource Management (Future Consideration)**
- **Aggressive Resource Limits**: Implement strict limits on resources with automatic piece cleanup
- **Dynamic Quality Adjustment**: Reduce quality under memory pressure (texture resolution, geometry complexity)
- **Memory Pressure Detection**: Automatic quality reduction when system is under stress
- **Risk Level**: High - Could cause visual degradation or unexpected behavior

### **Start puzle from unsolved state** - Start the puzzle with it being completely apart. Find a way to give the user an 'inventory' and 'workspace', similar to how you would solve an analogue jigsaw. Perhaps pieces in the inventory are smaller? Progressive reveal: reveal a few images at the start (3) and once one of those is solved, show another. Newly shown pieces have a different outline that only disappears after they have been dragged (so the dark pieces are recognizible on dark bg). How many pieces are shown at once is a level feature: a higher number is making the puzzle more difficult.


### **Current Resource Management Features**
- **Event Listener Cleanup**: Proper cleanup of all event listeners
- **Object Reference Nullification**: Explicit nullification of object references
- **Animation Loop Cleanup**: Proper cancellation of animation loops
- **WebGL Resource Disposal**: Complete cleanup of Three.js objects and textures
- **Memory Leak Prevention**: Comprehensive disposal system prevents memory leaks

### **Audio System** ✅ **IMPLEMENTED**
- **Snap Sound**: Satisfying audio feedback when pieces lock into place
- **Format**: WebM (Opus) with MP3 fallback for universal browser support
- **Performance**: Preloaded, zero-latency playback
- **Mobile Compatible**: Automatic audio unlock on first user interaction
- **Future Enhancements**: 
  - Additional sounds (pickup, hover, puzzle complete)
  - Volume controls
  - Spatial audio based on piece position

### **Save option** - Save progress within a level. Use Random Seed value to be able to regenerate the exact same puzzle