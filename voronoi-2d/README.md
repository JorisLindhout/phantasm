# Voronoi Puzzle 2D - Canvas Version

A lightweight, standalone web-based puzzle prototype featuring animated Voronoi cells with Canvas 2D rendering. Optimized for broad browser compatibility and minimal bundle size.

## Features

### 🧩 **Interactive Puzzle Gameplay**
- **Drag & Drop**: Move individual puzzle pieces around the canvas
- **Smart Snapping**: Pieces automatically snap to their correct positions
- **Visual Feedback**: Hover effects, drag glows, and snap confirmations
- **Z-Index Management**: Clicked pieces always appear on top
- **Hit Detection**: Accurate piece selection with expanded interaction areas

### ✨ **Canvas 2D Visual Effects**
- **Animated Boundaries**: Smooth Perlin noise animation of cell edges
- **State-Based Rendering**: Different visual states for pieces (normal, hover, dragging, snapped)
- **Piece Scaling**: Smooth scaling animations for interactive feedback
- **Smart Image Caching**: Efficient piece image capture and reuse

### 🎯 **Optimized Performance**
- **Lightweight Bundle**: ~150KB total (vs 500KB+ for 3D version)
- **Broad Compatibility**: Works on any browser with Canvas 2D support
- **Efficient Rendering**: Optimized for 5-30 pieces
- **No Dependencies**: Only requires d3-delaunay library

## Architecture

### 📁 **File Structure**
```
voronoi-2d/
├── index.html                    # Main HTML entry point
├── styles.css                    # All-in-one CSS (no modular imports)
├── noise.js                      # Perlin noise implementation
├── voronoi-puzzle-2d.js          # Main application entry point
├── base-image-cube.svg           # Default puzzle background image
├── js/                           # JavaScript modules
│   ├── shared/                   # Shared utilities
│   │   ├── voronoi-utils.js      # Control functions and utilities
│   │   └── voronoi-base.js       # Base puzzle logic and drag/drop
│   └── 2d/
│       └── canvas-renderer.js     # Canvas 2D renderer
└── README.md                     # This documentation
```

### 🔧 **Core Technologies**
1. **Canvas 2D API**: Traditional 2D rendering with broad compatibility
2. **d3-delaunay**: Efficient Voronoi diagram generation
3. **Custom Perlin Noise**: Smooth boundary animation
4. **Smart Caching**: Piece image capture and reuse system

## Usage

### 🚀 **Quick Start**
1. **Open** `index.html` in any modern web browser
2. **Interact** with puzzle pieces by clicking and dragging
3. **Adjust settings** using the control panel:
   - **Cell Count**: Number of Voronoi pieces (5-50)
   - **Animation Speed**: Speed of boundary animation (0.1-2.0x)
   - **Noise Amplitude**: Intensity of boundary deformation (0-50)
4. **Regenerate** the puzzle with new random pieces

### 🧩 **Gameplay Features**
- **Drag & Drop**: Click and drag any piece to move it around
- **Smart Snapping**: Pieces automatically snap when near their correct position
- **Visual Feedback**: 
  - Hover effects when mouse is over pieces
  - Glow effects while dragging pieces
  - Green outlines when pieces are correctly placed
- **Z-Index**: Clicked pieces automatically move to the front

## Dependencies

### 📦 **Core Libraries**
- **d3-delaunay** `^6.0.0`: Efficient Voronoi diagram generation
- **Custom Perlin Noise**: Smooth boundary animation implementation

### 🌐 **Browser APIs**
- **Canvas 2D API**: Traditional 2D rendering
- **Local Storage**: Optional preference persistence

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

### 🛠️ **Development Features**
- **Hot Reload**: No build step - just refresh browser after changes
- **Modular Architecture**: Easy to modify individual components
- **Debug Logging**: Configurable console output for different components

## Browser Compatibility

### ✅ **Fully Supported**
- **Chrome/Edge** 60+ (Canvas 2D)
- **Firefox** 55+ (Canvas 2D)
- **Safari** 10+ (Canvas 2D)
- **Mobile browsers**: Touch interactions supported

### 🎯 **Recommended**
- **Desktop browsers** for best performance
- **8GB+ RAM** for larger puzzle sizes (30+ pieces)
- **Hardware acceleration** enabled for smooth rendering

## Performance Notes

- **Optimized for 5-30 pieces**: Best performance in this range
- **Smart Caching**: Piece images cached for moved pieces
- **Efficient Rendering**: Only updates what's necessary each frame
- **Responsive**: Automatically adjusts to screen size

## Key Differences from 3D Version

### ✅ **Advantages**
- **Smaller Bundle**: ~150KB vs 500KB+ for 3D version
- **Broader Compatibility**: Works on older browsers
- **Simpler Architecture**: No WebGL complexity
- **Faster Loading**: No Three.js dependency

### ⚠️ **Limitations**
- **No True Z-Layering**: Uses render order instead of depth testing
- **Performance Ceiling**: Best for <30 pieces
- **Limited Visual Effects**: No advanced 3D materials or lighting

## When to Use This Version

**Choose 2D Canvas when:**
- You need broad browser compatibility
- Bundle size is a concern
- Working with smaller puzzles (<30 pieces)
- You want simple, reliable performance
- Supporting older devices or browsers

**Choose 3D WebGL when:**
- You need advanced visual effects
- Working with larger puzzles (30+ pieces)
- You want true z-layering and depth
- You're targeting modern browsers only
- Performance is critical for complex scenes