# Voronoi Puzzle 3D - WebGL Version

A high-performance web-based puzzle prototype featuring animated Voronoi cells with WebGL 3D rendering, advanced visual effects, and a unified theming system.

## Features

### 🧩 **Interactive Puzzle Gameplay**
- **Drag & Drop**: Move individual puzzle pieces around the canvas
- **Smart Snapping**: Pieces automatically snap to their correct positions
- **Visual Feedback**: Hover effects, drag glows, and snap confirmations
- **Z-Index Management**: Clicked pieces always appear on top
- **Hit Detection**: Accurate piece selection with expanded interaction areas
- **Auto-Recovery System**: Automatically detects and restores unreachable pieces
- **Threshold-Based Separation**: Pieces become separate when moved beyond 25px threshold
- **Fixed Canvas Size**: 1200x675 pixel canvas maintains consistent 16:9 aspect ratio
- **Window Resize Handling**: Canvas size is fixed - window resizing shows scrollbars or extra space

### 🎨 **WebGL 3D Rendering**
- **Hardware Acceleration**: GPU-accelerated rendering with Three.js
- **True Z-Layering**: Proper depth testing for accurate piece stacking
- **Advanced Materials**: Dynamic textures and lighting effects
- **High Performance**: Optimized for 30+ pieces with smooth animation

### ✨ **Advanced Visual Effects**
- **Animated Boundaries**: Smooth Perlin noise animation of cell edges
- **State-Based Rendering**: Different visual states for pieces (normal, hover, dragging, snapped)
- **Neon Glow Effects**: Dynamic glowing outlines while dragging pieces
- **Piece Scaling**: Smooth scaling animations for interactive feedback
- **Slot Hover System**: Visual feedback when hovering over placement areas

### 🎨 **Unified Theme System**
- **FluidLock Theme**: Default cyan/green color scheme optimized for the puzzle
- **Dev Tools Integration**: Console-based theme switching for development
- **Dynamic Color Updates**: Real-time theme changes across both renderers
- **Persistent Preferences**: Theme choices saved between sessions

## Architecture

### 🏗️ **Clean Modular Structure**
```
js/
├── utils.js          # Voronoi diagram utilities
├── base.js           # Base puzzle logic
├── theme.js          # Theme definitions and utilities
├── theme-manager.js  # Dynamic theme management
├── webgl-renderer.js # WebGL 3D renderer (Three.js)
└── main.js           # Main application controller
```

### 🔧 **Core Technologies**

1. **Voronoi Generation**: d3-delaunay library for efficient diagram generation
2. **3D Rendering**: Three.js for WebGL-accelerated graphics
3. **WebGL Focus**: Optimized for WebGL 3D rendering
4. **Animation**: Perlin noise for organic boundary movement
5. **State Management**: Comprehensive piece and slot state tracking

### ⚡ **Technical Highlights**

- **WebGL Rendering**: Hardware-accelerated 3D graphics with Three.js
- **True Z-Layering**: WebGL depth testing for proper piece stacking
- **Dynamic Geometry**: Real-time mesh updates for animated boundaries
- **Smart Caching**: Efficient piece image capture and reuse
- **Edge Deduplication**: Optimized outline rendering to prevent overdraw
- **Fixed Canvas Size**: 1200x675 pixel canvas with 16:9 aspect ratio
- **Automatic Scrollbars**: Container shows scrollbars when window is smaller than canvas

## File Structure

```
voronoi-puzzle/
├── index.html                    # Main HTML entry point
├── styles.css                    # Main CSS (imports modular styles)
├── noise.js                      # Perlin noise implementation
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
│   ├── webgl-renderer.js         # WebGL 3D renderer (Three.js)
│   └── main.js                   # Main application controller
└── README.md                     # This documentation
```

## Usage

### 🎮 **Basic Controls**
1. **Open** `index.html` in a modern web browser
2. **Interact** with puzzle pieces by clicking and dragging
3. **Adjust settings** using the control panel:
   - **Cell Count**: Number of Voronoi pieces (5-50)
   - **Animation Speed**: Speed of boundary animation (0.1-2.0x)
   - **Noise Amplitude**: Intensity of boundary deformation (0-50)
4. **WebGL rendering** with hardware acceleration
5. **Toggle features** like animation and grid outlines

## ⚠️ **Known Issues & Limitations**

### 🔧 **"Lost Pieces" / "Unresponsive Pieces" Problem**

The puzzle can experience pieces that become **visually present and animating** but **not responding to hover/click/drag**. This is a complex interaction desynchronization issue with multiple potential causes:

#### **Root Causes Identified:**

1. **Scene Graph Desynchronization**
   - **Problem**: Pieces exist in the object system but are not properly positioned in the Three.js scene
   - **Symptom**: Pieces are visible but hit detection fails
   - **Fix**: Enhanced scene synchronization with `fixMispositionedPieces()` function

2. **Interaction State Desynchronization** 
   - **Problem**: Pieces lose their event handling capabilities due to state management issues
   - **Symptom**: Pieces don't respond to mouse events despite being visible
   - **Fix**: State consistency checks and interaction system validation

3. **Z-Index Accumulation**
   - **Problem**: `bringPieceToFront()` can cause z-indices to grow unbounded
   - **Symptom**: Pieces become unreachable due to incorrect depth sorting
   - **Fix**: Z-index normalization system with `normalizeZIndices()`

4. **Waterfall Effect**
   - **Problem**: One lost piece can trigger a cascade of other pieces becoming unresponsive
   - **Symptom**: Multiple pieces become unresponsive after interacting with one
   - **Fix**: Enhanced debugging and state isolation

#### **Detection & Recovery Systems:**

- **Auto-Recovery System**: `autoRecoverPieces()` - Automatically detects and restores unreachable pieces
- **Scene Synchronization**: `fixMispositionedPieces()` - Ensures pieces are properly positioned in 3D scene
- **Interaction Debugging**: `toggleInteractionDebug()` - Detailed logging of interaction state
- **Manual Recovery**: Console commands for manual piece restoration

#### **Prevention Strategies:**

- **Object-Based Architecture**: Eliminates array synchronization issues
- **Enhanced State Management**: Better tracking of piece states and relationships
- **Robust Hit Detection**: Multiple fallback methods for piece selection
- **Z-Index Management**: Automatic normalization to prevent accumulation
- **Comprehensive Logging**: Controllable debug output for troubleshooting

#### **Debug Commands:**
```javascript
// Show all available debug commands
showDebugCommands()

// Auto-recovery system
autoRecoverPieces()                  // Manually recover unreachable pieces
fixMispositionedPieces()             // Fix pieces not properly positioned in scene

// Interaction debugging
toggleInteractionDebug()           // Toggle detailed interaction logging
testInteractionSystem()            // Test interaction system health

// State validation
validateObjectArraySync()          // Validate object system integrity
```

### 🎨 **Theme Development (Console Commands)**
```javascript
// Switch to available theme
themeManager.setTheme('fluidlock')   // Default cyan/green theme

// Theme information
themeManager.getAvailableThemes()    // List all available themes
themeManager.getCurrentTheme()       // Get current theme details

// Direct theme access for customization
themeManager.currentTheme.colors     // Access all color definitions
```

### 🔧 **Debug System (Console Commands)**
```javascript
// Show all available debug commands
showDebugCommands()

// Auto-recovery system
autoRecoverPieces()                  // Manually recover unreachable pieces
fixMispositionedPieces()            // Fix pieces not properly positioned in scene

// Interaction debugging
toggleInteractionDebug()           // Toggle detailed interaction logging
testInteractionSystem()            // Test interaction system health

// State validation
validateObjectArraySync()          // Validate object system integrity

// Debug logging controls
toggleHitDetection()                // Toggle hit detection logs
togglePieceStates()                 // Toggle piece state logs
toggleAnimation()                   // Toggle animation logs
toggleVisualStates()                // Toggle visual state logs
toggleCreation()                    // Toggle creation/removal logs
toggleInteractionDebug()           // Toggle interaction debugging
toggleMaterialUpdates()            // Toggle material update logs
toggleHoverEffects()               // Toggle hover effect logs
toggleNeonGlow()                   // Toggle neon glow logs
toggleStyling()                    // Toggle styling logs
toggleInitialization()             // Toggle initialization logs
toggleCoordinates()                // Toggle coordinate transformation logs
toggleRendererSwitching()          // Toggle renderer switching logs
toggleCanvasSetup()                // Toggle canvas setup logs

// Logging control
enableAllDebug()                    // Enable all debug logs
disableAllDebug()                   // Disable all debug logs
toggleQuietMode()                   // Toggle quiet mode (reduce noise)
```

### 🧩 **Gameplay Features**
- **Drag & Drop**: Click and drag any piece to move it around
- **Smart Snapping**: Pieces automatically snap when near their correct position
- **Visual Feedback**: 
  - Hover effects when mouse is over pieces/slots
  - Glow effects while dragging pieces
  - Green outlines when pieces are correctly placed
- **Z-Index**: Clicked pieces automatically move to the front

## Advanced Features

### 🔧 **WebGL Rendering**
- **Hardware Acceleration**: GPU-accelerated 3D rendering with true depth layering
- **Three.js Integration**: Modern WebGL graphics with optimized performance
- **Automatic Detection**: Graceful fallback if WebGL is unavailable
- **Dynamic Geometry**: Real-time mesh updates for smooth animations

### 🎯 **Performance Optimizations**
- **Smart Rendering**: Only updates what's necessary each frame
- **Piece Caching**: Efficiently stores piece images for moved pieces
- **Edge Deduplication**: Prevents drawing shared borders multiple times
- **State-Based Updates**: Only renders changes when pieces move or change state

### 🔄 **Auto-Recovery System**
- **Automatic Detection**: Monitors pieces for unreachable states
- **Smart Recovery**: Resets pieces to connected state when stuck
- **Conservative Approach**: Does not auto-recover pieces in wrong slots (prevents puzzle from "solving itself")
- **Rate Limiting**: Prevents auto-recovery from running too frequently (max once every 2 seconds)
- **Detailed Logging**: Tracks which pieces are restored and their previous state
- **Manual Override**: `autoRecoverPieces()` console command for manual intervention
- **State Synchronization**: Ensures both object and array systems stay in sync

### 🎯 **Auto-Snap System**
- **Automatic Snapping**: Pieces automatically snap to their slots when within 25px threshold
- **Prevents Rapid Cycling**: Eliminates create/remove cycles that cause unresponsive pieces
- **Smart Detection**: Only snaps pieces that are in 'unsolved' state and close to their slot
- **Timeout Protection**: 100ms delay prevents rapid cycling during dragging
- **Manual Override**: `autoSnapPiece(pieceIndex)` console command for manual testing
- **Visual Feedback**: Logs snap events for debugging and user feedback

### 🏗️ **Object-Based Architecture**
The system uses a fully object-based architecture to eliminate synchronization issues:

#### **Piece Objects**
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

#### **Slot Objects**
```javascript
slots[index] = {
  id: index,                   // Unique identifier
  polygon: [...],              // Voronoi shape data
  state: 'filled'|'empty',    // Slot state
  pieceId: index,             // Which piece is in this slot
  isCorrect: true,            // Whether correct piece is in slot
  // ... additional properties
}
```

#### **Benefits of Object System**
- **No Sync Issues**: All piece data in one object
- **Better Debugging**: Clear object structure for troubleshooting
- **Atomic Updates**: All data changes together
- **Future-Proof**: Easy to extend with new properties
- **Performance**: Object property access is fast and reliable

#### **Complete Object Structure**

**Piece Object Properties:**
```javascript
{
  // Core identification
  id: number,                    // Unique identifier (0-39)
  
  // Geometric data
  polygon: Array<[number, number]>, // Voronoi polygon vertices
  position: {x: number, y: number},  // Current world position
  offset: {x: number, y: number},    // Offset from original position
  
  // 3D rendering objects
  mesh: THREE.Mesh|null,         // 3D mesh (null if connected)
  outline: THREE.Line|null,      // Outline mesh (null if connected)
  glowOutline: Array|null,       // Neon glow layers (null if connected)
  
  // State management
  state: 'solved'|'unsolved',   // Current piece state
  slotState: 'filled'|'empty',  // Slot occupancy state
  zIndex: number,               // Rendering depth (0-100)
  
  // Visual state
  visible: boolean,             // Is piece visible
  hovered: boolean,             // Is piece being hovered
  dragging: boolean,            // Is piece being dragged
  
  // Slot relationship
  slotId: number,               // Which slot this piece belongs to
  isInSlot: boolean,            // Is piece in its correct slot
  
  // Animation
  animationTime: number,        // Current animation time
  animationOffset: {x: number, y: number} // Animation position offset
}
```

**Slot Object Properties:**
```javascript
{
  // Core identification
  id: number,                   // Unique identifier (0-39)
  
  // Geometric data
  polygon: Array<[number, number]>, // Voronoi polygon vertices
  position: {x: number, y: number},  // Slot center position
  
  // State management
  state: 'filled'|'empty',      // Slot occupancy state
  pieceId: number|null,         // Which piece is in this slot
  correctPieceId: number,       // Which piece should be in this slot
  isCorrect: boolean,           // Is the correct piece in this slot
  
  // Visual state
  hovered: boolean,             // Is slot being hovered
  showBackground: boolean       // Should show background image
}
```

## 🛠️ **Development Notes**

### **Object-Based Architecture Benefits**

The migration from array-based to object-based architecture provides significant improvements:

#### **Problem Solved: Array Synchronization Issues**
- **Before**: 6+ arrays that had to stay synchronized by index
- **After**: Self-contained objects with all data in one place
- **Result**: Eliminates "unreachable pieces" caused by sync issues

#### **Enhanced Debugging Capabilities**
- **Object Inspection**: `console.log(pieces[5])` shows all piece data
- **State Tracking**: Clear visibility into piece and slot relationships
- **Recovery Logging**: Detailed logs of which pieces are restored and why

#### **Performance Improvements**
- **Atomic Updates**: All piece data changes together
- **Reduced Complexity**: No need to maintain multiple synchronized arrays
- **Better Memory Management**: Objects can be garbage collected independently

#### **Future-Proof Design**
- **Easy Extension**: Add new properties without breaking existing code
- **Type Safety**: Clear object structure for better IDE support
- **Maintainability**: Self-documenting code with clear relationships

### **Object-Only Architecture**
The system now uses a **fully object-based approach**:
- **Object System**: Primary and only data source for all operations
- **No Array Backup**: Array system has been completely removed
- **Simplified Architecture**: Single source of truth for all piece data
- **Better Performance**: No synchronization overhead between systems

### **Testing Strategy**
- **Debug Commands**: `autoRecoverPieces()` and `showDebugCommands()`
- **Enhanced Logging**: Object-based debug information with controllable log levels
- **Recovery Testing**: Automatic detection and restoration of stuck pieces
- **Performance Monitoring**: Object property access for optimal performance

## Dependencies

### 📦 **Core Libraries**
- **d3-delaunay** `^6.0.0`: Efficient Voronoi diagram generation
- **Three.js** `r128`: WebGL 3D graphics library
- **Custom Perlin Noise**: Smooth boundary animation implementation

### 🌐 **Browser APIs**
- **WebGL**: Hardware-accelerated 3D graphics
- **Local Storage**: Theme preference persistence
- **Modern JavaScript**: ES6+ features for optimal performance

## Development Setup

### 🚀 **Quick Start**
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

### 🛠️ **Development Tools**
- **Theme System**: Use browser console for theme switching
- **Debug Logging**: Configurable console output for different components
- **Hot Reload**: No build step - just refresh browser after changes
- **Modular Architecture**: Easy to modify individual components

## Browser Compatibility

### ✅ **Fully Supported**
- **Chrome/Edge** 80+ (WebGL)
- **Firefox** 75+ (WebGL)
- **Safari** 13+ (WebGL)

### ⚠️ **Limited Support**
- **Older browsers**: WebGL required for functionality
- **Mobile browsers**: Touch interactions supported, performance may vary
- **IE11**: Not supported (requires ES6+ features)

### 🎯 **Recommended**
- **Desktop browsers** with WebGL support for best performance
- **Hardware acceleration** enabled for smooth 3D rendering
- **16GB+ RAM** for larger puzzle sizes (50+ pieces)

## Performance Notes

- **WebGL Rendering**: Optimized for 30+ pieces with excellent performance
- **Hardware Acceleration**: GPU-accelerated rendering for smooth animations
- **Animation**: Can be toggled off for better performance on slower devices
- **Responsive**: Automatically adjusts to screen size and capabilities
