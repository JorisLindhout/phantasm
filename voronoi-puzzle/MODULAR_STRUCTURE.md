# Voronoi Puzzle - Modular Structure

This document explains the new modular architecture that separates concerns between 2D Canvas rendering, 3D WebGL rendering, and shared functionality.

## File Structure

```
voronoi-puzzle/
├── js/
│   ├── shared/
│   │   ├── voronoi-base.js      # Base classes and shared functionality
│   │   └── voronoi-utils.js     # Utility functions and helpers
│   ├── 2d/
│   │   └── canvas-renderer.js   # Canvas 2D specific rendering
│   ├── 3d/
│   │   └── webgl-renderer.js    # WebGL/Three.js specific rendering
│   └── voronoi-puzzle-hybrid.js # Hybrid renderer that manages 2D/3D switching
├── css/
│   ├── shared/
│   │   ├── base.css             # Base styles (layout, colors, typography)
│   │   ├── controls.css         # Control panel styling
│   │   └── responsive.css       # Responsive design rules
│   ├── 2d/
│   │   └── canvas.css           # Canvas 2D specific styles
│   └── 3d/
│       └── webgl.css            # WebGL/3D specific styles
├── voronoi-puzzle.js            # Main entry point (now extends hybrid)
├── styles.css                   # Main stylesheet (imports modular CSS)
├── index.html                   # Updated to load modular files
└── [other existing files...]
```

## Architecture Overview

### Shared Components (`js/shared/`)

**`voronoi-base.js`**
- `VoronoiConfig`: Configuration class for puzzle settings
- `VoronoiPuzzleBase`: Abstract base class with shared functionality
  - Voronoi generation and fallback logic
  - Background image loading
  - Canvas setup and resize handling
  - Control setup and event binding
  - Animation loop management
  - Drag and drop state management
  - Piece positioning and z-index management

**`voronoi-utils.js`**
- Global control functions (updateCellCount, toggleAnimation, etc.)
- `VoronoiUtils`: Utility class with helper methods
  - Coordinate calculations
  - Distance and polygon center calculations
  - Point-in-polygon testing
  - Math utilities (clamp, lerp, debounce)

### 2D Canvas Renderer (`js/2d/`)

**`canvas-renderer.js`**
- `Canvas2DRenderer`: Extends `VoronoiPuzzleBase`
- Canvas 2D specific functionality:
  - Piece image capturing and caching
  - 2D rendering with clipping paths
  - Separate pieces rendering with z-index sorting
  - Connected Voronoi rendering
  - Canvas 2D hit detection
  - Mouse/touch event handling for Canvas 2D

### 3D WebGL Renderer (`js/3d/`)

**`webgl-renderer.js`**
- `WebGLVoronoiRenderer`: Three.js-based WebGL renderer
- WebGL specific functionality:
  - Three.js scene management
  - Mesh creation and geometry handling
  - Texture loading and UV mapping
  - True 3D z-index layering
  - WebGL hit detection with raycasting
  - Separate piece mesh management
  - Visual state updates (hover, dragging, snapped)

### Hybrid Management (`js/`)

**`voronoi-puzzle-hybrid.js`**
- `VoronoiPuzzleHybrid`: Manages switching between renderers
- `WebGLHybridRenderer`: Extends `VoronoiPuzzleBase` for WebGL integration
- Features:
  - Automatic renderer selection based on WebGL support
  - Runtime renderer switching
  - Unified API for both rendering modes
  - Graceful fallback to Canvas 2D

### CSS Architecture

**Shared Styles (`css/shared/`)**
- `base.css`: CSS variables, reset, layout, typography
- `controls.css`: Control panel styling (sliders, buttons)
- `responsive.css`: Media queries and responsive design

**Renderer-Specific Styles**
- `css/2d/canvas.css`: Canvas 2D specific styling
- `css/3d/webgl.css`: WebGL canvas positioning and z-index management

## Benefits of Modular Architecture

### 1. **Separation of Concerns**
- 2D and 3D rendering logic are completely separate
- Shared functionality is reusable across both renderers
- CSS is organized by purpose and renderer type

### 2. **Maintainability**
- Each module has a single responsibility
- Easier to debug and modify specific renderer features
- Clear dependency structure

### 3. **Extensibility**
- Easy to add new renderer types (e.g., SVG, Canvas with OffscreenCanvas)
- Shared base classes provide consistent API
- Modular CSS allows for easy theming and customization

### 4. **Performance**
- Only load renderer-specific code when needed
- Shared utilities reduce code duplication
- CSS imports allow for selective loading

### 5. **Testing**
- Individual modules can be tested in isolation
- Shared utilities can be unit tested separately
- Renderer-specific functionality can be tested independently

## Usage

The modular structure is transparent to end users. The main `VoronoiPuzzle` class now extends `VoronoiPuzzleHybrid` and automatically:

1. Detects WebGL support
2. Initializes the appropriate renderer
3. Provides seamless switching between 2D and 3D modes
4. Maintains the same public API as before

### Control Functions
- `toggleRenderer()`: Switch between WebGL and Canvas 2D
- `forceCanvas2D()`: Force Canvas 2D mode (useful for testing)
- `regeneratePuzzle()`: Generate new puzzle layout
- `toggleAnimation()`: Start/stop animation

## Migration Notes

- All existing functionality is preserved
- Public API remains the same
- Performance improvements due to better code organization
- Enhanced WebGL support with proper fallback handling
- Better mobile compatibility through modular touch handling

## Future Enhancements

The modular structure makes it easy to add:
- Additional renderer types (SVG, WebGPU)
- New interaction modes (VR/AR support)
- Advanced visual effects (shaders, post-processing)
- Different puzzle types (hexagonal, triangular grids)
- Plugin system for custom renderers
