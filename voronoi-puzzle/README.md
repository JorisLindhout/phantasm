# Voronoi Puzzle 3D - WebGL Version

A high-performance web-based puzzle prototype featuring animated Voronoi cells with WebGL 3D rendering, advanced visual effects, and a unified theming system.

## Features

### 🧩 **Interactive Puzzle Gameplay**
- **Drag & Drop**: Move individual puzzle pieces around the canvas
- **Smart Snapping**: Pieces automatically snap to their correct positions
- **Visual Feedback**: Hover effects, drag glows, and snap confirmations
- **Z-Index Management**: Clicked pieces always appear on top
- **Hit Detection**: Accurate piece selection with expanded interaction areas

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
- **Multiple Themes**: FluidLock (default), Cyberpunk, and Pastel color schemes
- **Dev Tools Integration**: Console-based theme switching for development
- **Dynamic Color Updates**: Real-time theme changes across both renderers
- **Persistent Preferences**: Theme choices saved between sessions

## Architecture

### 🏗️ **Modular Structure**
```
js/
├── shared/           # Shared utilities and systems
│   ├── voronoi-utils.js      # Voronoi diagram utilities
│   ├── voronoi-base.js       # Base puzzle logic
│   ├── theme.js              # Theme definitions and utilities
│   └── theme-manager.js      # Dynamic theme management
├── 3d/               # WebGL 3D specific code
│   └── webgl-renderer.js     # 3D rendering with Three.js
└── voronoi-puzzle-hybrid.js  # Unified interface
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
- **Responsive Design**: Full-screen layout that adapts to any screen size

## File Structure

```
voronoi-puzzle/
├── index.html                    # Main HTML entry point
├── styles.css                    # Main CSS (imports modular styles)
├── noise.js                      # Perlin noise implementation
├── voronoi-puzzle.js             # Main application entry point
├── base-image-cube.svg           # Default puzzle background image
├── css/                          # Modular CSS architecture
│   ├── shared/                   # Shared styles
│   │   ├── base.css              # Base colors and layout
│   │   ├── controls.css          # UI controls styling
│   │   └── responsive.css        # Responsive design
│   └── 3d/
│       └── webgl.css             # WebGL 3D specific styles
├── js/                           # JavaScript modules
│   ├── shared/                   # Shared utilities
│   │   ├── voronoi-utils.js      # Voronoi diagram helpers
│   │   ├── voronoi-base.js       # Core puzzle logic
│   │   ├── theme.js              # Theme system definitions
│   │   └── theme-manager.js      # Dynamic theme management
│   ├── 3d/
│   │   └── webgl-renderer.js     # WebGL 3D renderer (Three.js)
│   └── voronoi-puzzle-hybrid.js  # Unified renderer interface
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

### 🎨 **Theme Development (Console Commands)**
```javascript
// Switch between available themes
themeManager.setTheme('fluidlock')   // Default cyan/green theme
themeManager.setTheme('cyberpunk')   // Neon pink/green theme
themeManager.setTheme('pastel')      // Soft blue/pink theme

// Theme information
themeManager.getAvailableThemes()    // List all available themes
themeManager.getCurrentTheme()       // Get current theme details

// Direct theme access for customization
themeManager.currentTheme.colors     // Access all color definitions
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
