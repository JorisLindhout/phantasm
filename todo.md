# FluidLock Development Todo List

## Project Overview
FluidLock is a web application that creates a responsive canvas with draggable pieces that inherit wavy shapes from a template canvas. The system allows for seamless piece fitting with organic, flowing boundaries.

## Development Phases

### ✅ Phase 1: Foundation - Template Canvas System
**Status: COMPLETED**

#### Step 1.1: Template Canvas Setup ✅
- Added template canvas to HTML structure
- Added CSS styles for template canvas and grid overlay
- Updated JavaScript to include template canvas functionality
- Added `setupTemplateCanvas()` method that copies main canvas content

#### Step 1.2: Basic Template Grid ✅
- Created `createTemplateGrid()` method
- Added template grid lines and labels
- Template grid overlays the template canvas with visual grid

#### Step 1.3: Template-Piece Connection ✅
- Added template canvas reference to pieces
- Created `updateTemplateCanvas()` method for future template changes
- Established foundation for template-based piece inheritance

### ✅ Phase 2: Wavy Template Grid
**Status: PENDING**

#### Step 2.1: Simple Wavy Lines ✅
- Added wavy grid configuration to `config.js`
- Implemented `drawWavyGrid()` method to draw wavy lines on template canvas
- Added `drawWavyLine()` method for individual wavy line drawing
- Wavy lines are drawn with configurable amplitude, frequency, and phase

#### Step 2.2: Extract Wavy Boundaries ✅
- Implemented `extractWavyBoundaries()` method to get boundaries for each grid cell
- Added `getWavyBoundary()` method to extract specific boundary sides
- Each piece now stores its wavy boundaries for clipping

#### Step 2.3: Apply Wavy Clipping ✅
- Added `applyWavyClipping()` method to apply wavy clipping to pieces
- Implemented `drawPieceContent()` method to draw content within clipped area
- Updated `updatePieces()` to use wavy clipping when enabled
- Pieces now inherit wavy shapes from the template canvas

### 🔄 Phase 3: Simple Snapping System
**Status: PENDING**

#### Step 3.1: Center-Based Snapping
- Implement center-based snapping for wavy pieces
- Calculate piece centers and snap to grid slot centers
- Handle wavy shape considerations in snapping logic

#### Step 3.2: Visual Feedback
- Add visual feedback for snap zones
- Highlight valid snap positions
- Show snapping preview during drag operations

#### Step 3.3: Basic Snapping Logic
- Implement basic snapping threshold logic
- Handle snap-to-grid functionality
- Ensure pieces snap to correct positions

### 🔄 Phase 4: Enhanced Snapping
**Status: PENDING**

#### Step 4.1: Corner-Based Snapping
- Implement corner-based snapping for more precise alignment
- Calculate piece corners and snap to grid slot corners
- Handle wavy edge considerations

#### Step 4.2: Edge Intersection
- Implement edge intersection detection for wavy shapes
- Calculate overlap between wavy boundaries
- Handle complex shape intersections

#### Step 4.3: Multi-Factor Snapping
- Combine center, corner, and edge-based snapping
- Implement weighted snapping system
- Handle multiple snap criteria simultaneously

### 🔄 Phase 5: Animation System
**Status: PENDING**

#### Step 5.1: Animated Template Grid
- Implement animated wavy grid lines
- Add smooth transitions for grid changes
- Handle real-time grid updates

#### Step 5.2: Smooth Piece Updates
- Implement smooth piece shape updates
- Add transitions when template changes
- Handle piece morphing animations

#### Step 5.3: Performance Optimization
- Optimize animation performance
- Implement efficient rendering
- Handle large numbers of animated pieces

### 🔄 Phase 6: Advanced Features
**Status: PENDING**

#### Step 6.1: Custom Wave Patterns
- Implement custom wave pattern support
- Add pattern configuration options
- Handle different wave types

#### Step 6.2: Per-Cell Wave Control
- Implement individual cell wave control
- Add per-cell wave parameters
- Handle cell-specific wave customization

#### Step 6.3: Interactive Wave Control
- Add interactive wave editing
- Implement real-time wave manipulation
- Handle user-driven wave changes

## Current Issues & Fixes

### ✅ Completed Fixes
- **Duplicate Grid Overlay**: Removed duplicate HTML grid overlay from template canvas
- **Rounded Corners**: Changed canvas containers to have square corners
- **Grid Line Color**: Made grid lines bright orange and more visible
- **Canvas Coordinate System**: Fixed to use actual canvas dimensions
- **Wavy Boundary Calculation**: Fixed boundary calculation for each grid cell
- **Piece Content Display**: Fixed pieces to show image content
- **Grid Size**: Fixed wavy grid to show all 16 grid lines

### 🔄 Current Issues
- **Grid Display**: Template canvas still showing only 4 parts instead of 16
- **Piece Content**: Second canvas showing wrong content (only B2, B3, C2, C3)
- **Grid Mismatch**: Pieces don't match the template canvas
- **Wavy Clipping**: Wavy clipping temporarily disabled for debugging

## Configuration

### Wavy Grid Settings
```javascript
WAVY: {
    ENABLED: true,
    AMPLITUDE: 30,        // Wave amplitude in pixels
    FREQUENCY: 0.3,        // Wave frequency (higher = more waves)
    PHASE: 0,             // Wave phase offset
    ANIMATION: {
        ENABLED: false,   // Enable wave animation
        SPEED: 0.02,      // Animation speed
        DIRECTION: 1      // 1 for forward, -1 for backward
    }
}
```

### Snap Settings
```javascript
SNAP_THRESHOLD: 85,  // Percentage overlap required for snapping (0-100)
```

## File Structure
```
/Users/jorislindhout/Local Sites/FluidLock/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and variables
├── app.js             # Main JavaScript application
├── config.js          # Configuration variables
├── assets/
│   └── base-image-cube.svg  # SVG image file
└── todo.md            # This todo list
```

## Next Steps
1. **Fix Grid Display**: Ensure template canvas shows proper 4x4 grid with all 16 cells
2. **Fix Piece Content**: Ensure all 16 pieces show correct image content
3. **Re-enable Wavy Clipping**: Restore wavy clipping once basic functionality works
4. **Implement Phase 3**: Begin simple snapping system implementation

## Development Notes
- All phases are designed to be testable and troubleshootable
- Each step builds upon the previous ones
- Debug logging is available for troubleshooting
- Configuration is centralized in `config.js`
- CSS variables allow for easy customization
