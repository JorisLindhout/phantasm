# Phantasm - WebGL Version

A high-performance web-based puzzle prototype featuring animated Voronoi cells with WebGL 3D rendering, advanced visual effects, and a unified theming system.

## TODO
- [] **Fix unreachable pieces issue** - Some pieces become unresponsive to interaction - this seems fixed, but leaving here since we might need to do some more rigorous testing
- [] **Clean up SmartLogger calls** - Remove 219+ SmartLogger.log() calls using regex pattern `SmartLogger\.log\([^;]*\);` (low priority - no-ops are harmless)

## 🐛 Debugging & Error Reporting

The project uses a simple, reliable debugging approach based on standard JavaScript console logging.

### 🚀 Debugging Approach
- **Console.log** - Standard JavaScript debugging with simple prefixes
- **Error Handling** - Critical errors are logged to console.error()
- **Production Safe** - Debug statements can be easily added/removed as needed
- **No Dependencies** - No complex debug infrastructure to maintain

### 🎯 Current Status
- **Debug System** - Disabled (was causing game initialization issues)
- **SmartLogger** - Fallback mode (no-ops for compatibility)
- **Error Reporting** - Standard console.error() for critical issues
- **Performance** - Zero overhead from debug infrastructure


## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Usage & Controls](#usage--controls)
- [Development](#development)
- [Documentation](#documentation)
- [Known Issues](#known-issues)
- [Browser Compatibility](#browser-compatibility)
- [Performance](#performance)
- [Dependencies](#dependencies)
- [Future Development](#future-development)

## Features

### 🧩 Interactive Puzzle Gameplay
- **Drag & Drop**: Move individual puzzle pieces around the canvas
- **Smart Snapping**: Pieces automatically snap to their correct positions when within 25px threshold
- **Visual Feedback**: Hover effects, drag glows, and snap confirmations
- **Z-Index Management**: Clicked pieces always appear on top
- **Hit Detection**: Accurate piece selection with expanded interaction areas
- **Auto-Recovery System**: Automatically detects and restores unreachable pieces
- **Fixed Canvas Size**: Always 1200x675 pixels (16:9 aspect ratio) regardless of screen size - may cause horizontal scrolling on narrow screens

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
- **FluidLock Theme**: Default cyan/green color scheme optimized for the puzzle
- **Dev Tools Integration**: Console-based theme switching for development
- **Dynamic Color Updates**: Real-time theme changes across both renderers
- **Persistent Preferences**: Theme choices saved between sessions

## Quick Start

1. **Clone/Download** the project
2. **Start a local server:**
   ```bash
   # Python 3
   python3 -m http.server 8080
   
   # Python 2
   python -m SimpleHTTPServer 8080
   
   # Node.js (if you have it)
   npx http-server -p 8080
   ```
3. **Open browser** to `http://localhost:8080`
4. **Interact** with puzzle pieces by clicking and dragging
5. **Adjust settings** using the control panel (click the caret icon)

## Architecture

### 🏗️ Clean Modular Structure
```
js/
├── utils.js          # Voronoi diagram utilities
├── base.js           # Base puzzle logic
├── theme.js          # Theme definitions and utilities
├── theme-manager.js  # Dynamic theme management
├── webgl-renderer.js # WebGL 3D renderer (Three.js)
└── main.js           # Main application controller
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
├── js/
│   ├── noise.js                 # Perlin noise implementation
├── package.json                  # Project dependencies
├── assets/                       # Game assets and images
│   └── base-image-cube.svg       # Default puzzle background image (16:9 aspect ratio)
├── css/                          # Modular CSS architecture
│   ├── base.css                  # Base colors and layout
│   ├── controls.css              # UI controls styling
│   ├── responsive.css             # Responsive design
│   └── webgl.css                 # WebGL 3D specific styles
├── js/                           # JavaScript modules
│   ├── utils.js                  # Voronoi diagram utilities
│   ├── base.js                   # Core puzzle logic
│   ├── theme.js                  # Theme system definitions
│   ├── theme-manager.js          # Dynamic theme management
│   ├── coordinate-utils.js       # Coordinate system conversion utilities
│   ├── position-manager.js       # Centralized position management
│   ├── webgl-renderer.js         # WebGL 3D renderer (Three.js)
│   └── main.js                   # Main application controller
├── debug-tools/                  # Debug tools (disabled - kept for reference)
│   ├── index.js                  # Central debug tools loader
│   ├── simple-precision-test.js  # Raycaster precision testing
│   ├── scene-state-diagnostic.js # Scene management diagnostics
│   └── [other debug tools...]    # Additional diagnostic tools
├── docs/                         # Project documentation
│   └── debug/                    # Debug system documentation (legacy)
│       ├── DEBUG_SYSTEM_GUIDE.md # Complete debug system guide
│       ├── DEBUG_QUICK_REFERENCE.md # Quick reference card
│       └── debug-tools.md        # Debug tools documentation
└── README.md                     # This documentation
```

## Usage & Controls

### 🎮 Basic Controls
1. **Click and drag** any piece to move it around
2. **Hover** over pieces or slots for visual feedback
3. **Auto-snap** occurs when pieces are within 25px of their correct position

### 🎛️ Control Panel
Access the control panel by clicking the caret icon (^) in the top-right corner:

- **Cell Count**: Number of Voronoi pieces (5-50)
- **Animation Speed**: Speed of boundary animation (0.1-2.0x)
- **Noise Amplitude**: Intensity of boundary deformation (0-50)
- **Regenerate Puzzle**: Create a new puzzle layout
- **Toggle Animation**: Enable/disable boundary animation
- **Toggle Grid Outlines**: Show/hide piece outlines

### 🎨 Theme Development (Console Commands)
```javascript
// Switch to available theme
themeManager.setTheme('fluidlock')   // Default cyan/green theme

// Theme information
themeManager.getAvailableThemes()    // List all available themes
themeManager.getCurrentTheme()       // Get current theme details

// Direct theme access for customization
themeManager.currentTheme.colors     // Access all color definitions
```

## Development

### 🛠️ Development Tools
- **Theme System**: Use browser console for theme switching
- **Debug Logging**: Standard console.log() statements for debugging
- **Hot Reload**: No build step - just refresh browser after changes
- **Modular Architecture**: Easy to modify individual components

### 🔧 Debug System (Console Commands)
```javascript
// Note: Debug system has been disabled. Use standard console.log() for debugging.

// Basic debugging
console.log('[DEBUG]', 'Your debug message here');
console.log('Game state:', window.voronoiPuzzle);

// Check for errors
console.error('Error message here');

// Theme system (still available)
themeManager.setTheme('fluidlock');
themeManager.getCurrentTheme();
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

## Documentation

### 📁 Documentation Structure

All project documentation is organized in the `docs/` folder:

```
docs/
└── debug/                          # Debug system documentation (legacy)
    ├── DEBUG_SYSTEM_GUIDE.md       # Complete debug system usage guide
    ├── DEBUG_QUICK_REFERENCE.md    # Quick reference for debug commands
    └── debug-tools.md              # Debug tools documentation
```

### 📚 Available Documentation

- **[Debug System Guide](docs/debug/DEBUG_SYSTEM_GUIDE.md)** - Legacy debug system documentation (system disabled)
- **[Debug Quick Reference](docs/debug/DEBUG_QUICK_REFERENCE.md)** - Legacy debug commands (system disabled)
- **[Debug Tools Documentation](docs/debug/debug-tools.md)** - Legacy debug tools documentation (system disabled)

**Note:** The debug system has been disabled due to initialization issues. Current debugging uses standard `console.log()` statements.

### 🎯 Quick Access

For immediate debugging needs:
```javascript
// Check browser console for errors
console.log('Debug info here');

// Add temporary debug statements
console.log('[DEBUG]', variableName);

// Check game state
console.log('Game state:', window.voronoiPuzzle);
```

## Known Issues

### 🔧 "Lost Pieces" / "Unresponsive Pieces" Problem

The puzzle can experience pieces that become **visually present and animating** but **not responding to hover/click/drag**. This is a complex interaction desynchronization issue with multiple potential causes:

#### Root Causes Identified:
1. **Scene Graph Desynchronization**: Pieces exist in the object system but are not properly positioned in the Three.js scene
2. **Interaction State Desynchronization**: Pieces lose their event handling capabilities due to state management issues
3. **Z-Index Accumulation**: `bringPieceToFront()` can cause z-indices to grow unbounded
4. **Waterfall Effect**: One lost piece can trigger a cascade of other pieces becoming unresponsive

#### Detection & Recovery Systems:
- **Auto-Recovery System**: `autoRecoverPieces()` - Automatically detects and restores unreachable pieces
- **Scene Synchronization**: `fixMispositionedPieces()` - Ensures pieces are properly positioned in 3D scene
- **Interaction Debugging**: `toggleInteractionDebug()` - Detailed logging of interaction state
- **Manual Recovery**: Console commands for manual piece restoration

#### Advanced Diagnostic Tools:
- **Raycaster Precision Testing**: `runPrecisionTests()` - Tests if raycaster precision degrades with large coordinates
- **Scene State Diagnostics**: `diagnoseSceneState()` - Comprehensive analysis of scene management issues
- **Auto-Fix Tools**: `autoFixSceneIssues()` - Automatically repairs detected scene problems

#### Prevention Strategies:
- **Object-Based Architecture**: Clean, maintainable code structure
- **Enhanced State Management**: Better tracking of piece states and relationships
- **Robust Hit Detection**: Multiple fallback methods for piece selection
- **Z-Index Management**: Automatic normalization to prevent accumulation
- **Comprehensive Logging**: Controllable debug output for troubleshooting

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
- **Local Storage**: Theme preference persistence
- **Modern JavaScript**: ES6+ features for optimal performance

## 🔍 Diagnostic Tools

**Note:** The diagnostic tools system has been disabled due to initialization issues. For debugging, use standard browser console tools.

### Quick Start
```javascript
// Basic debugging
console.log('[DEBUG]', 'Your debug message here');
console.log('Game state:', window.voronoiPuzzle);

// Check for errors
console.error('Error message here');
```


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

### **Start puzle from unsolved state** - Start the puzzle with it being completely apart. Find a way to give the user an 'inventory' and 'workspace', similar to how you would solve an analogue jigsaw. Perhaps pieces in the inventory are smaller?

### **Add levels** - Each level has its own image, levels are increasingly diffifult

### **Current Resource Management Features**
- **Event Listener Cleanup**: Proper cleanup of all event listeners
- **Object Reference Nullification**: Explicit nullification of object references
- **Animation Loop Cleanup**: Proper cancellation of animation loops
- **WebGL Resource Disposal**: Complete cleanup of Three.js objects and textures
- **Memory Leak Prevention**: Comprehensive disposal system prevents memory leaks

### **Audio** - Investigate adding audio

### **Save option** - Save progress within a level. Use Random Seed value to be able to regenerate the exact same puzzle