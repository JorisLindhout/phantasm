# Object-Based System Design

## Current Array System Problems
- 6+ arrays that must stay synchronized by index
- Easy to get out of sync (piece 5 data in wrong array)
- Hard to debug when arrays get misaligned
- Race conditions between array updates

## New Object-Based Structure

### Piece Object Structure
```javascript
pieces[index] = {
  // Core identification
  id: index,                    // Unique identifier (0-39)
  
  // Geometric data
  polygon: [...],              // Voronoi polygon shape data
  position: { x: 0, y: 0 },    // Current position
  offset: { x: 0, y: 0 },      // Offset from original position
  
  // 3D rendering
  mesh: null,                  // THREE.Mesh object (or null if connected)
  outline: null,               // THREE.Line outline mesh
  glowOutline: null,           // THREE.Line neon glow mesh
  
  // State management
  state: 'solved',             // 'solved' or 'unsolved'
  slotState: 'filled',         // 'filled' or 'empty'
  zIndex: 0,                   // Z-depth for rendering order
  
  // Visual state
  visible: true,               // Is piece visible
  hovered: false,              // Is piece being hovered
  dragging: false,             // Is piece being dragged
  
  // Slot relationship
  slotId: index,               // Which slot this piece belongs to
  isInSlot: true,              // Is piece in its correct slot
  
  // Animation
  animationTime: 0,            // Current animation time
  animationOffset: { x: 0, y: 0 }, // Animation position offset
}
```

### Slot Object Structure
```javascript
slots[index] = {
  // Core identification
  id: index,                   // Unique identifier (0-39)
  
  // Geometric data
  polygon: [...],              // Voronoi polygon shape data
  position: { x: 0, y: 0 },    // Slot center position
  
  // State management
  state: 'filled',             // 'filled' or 'empty'
  pieceId: index,              // Which piece is in this slot (or null)
  
  // Visual state
  hovered: false,              // Is slot being hovered
  showBackground: true,        // Should show background image
  
  // Relationship
  correctPieceId: index,       // Which piece should be in this slot
  isCorrect: true,             // Is the correct piece in this slot
}
```

## Benefits of Object System

### 1. No Sync Issues
- All data for piece 5 is in `pieces[5]`
- Can't accidentally update wrong index
- Atomic updates - all data changes together

### 2. Better Debugging
- `console.log(pieces[5])` shows everything about piece 5
- Clear relationships between pieces and slots
- Easy to validate object integrity

### 3. Cleaner Code
- `piece.mesh` instead of `separatePieces[index]`
- `piece.state` instead of `pieceStates[index]`
- `slot.pieceId` shows which piece is where

### 4. Easier Level Management
- Create/destroy objects instead of managing arrays
- Simple to add/remove pieces for different levels
- Clear object lifecycle

### 5. Better Performance
- Object property access is fast
- No array synchronization overhead
- Easier to optimize specific operations

## Migration Strategy

### Phase 1: Create Object Structure
- Add `pieces` and `slots` arrays alongside existing arrays
- Populate objects from existing array data
- Keep both systems running in parallel

### Phase 2: Update Core Functions
- Modify hit detection to use objects
- Update animation system to use objects
- Change state management to use objects

### Phase 3: Remove Array System
- Remove old array-based code
- Clean up unused variables
- Update all references to use objects

### Phase 4: Testing & Validation
- Comprehensive testing of all interactions
- Performance validation
- Edge case testing

## Implementation Notes

### Object Creation
```javascript
// Initialize all pieces
for (let i = 0; i < 40; i++) {
  pieces[i] = {
    id: i,
    polygon: voronoiPolygons[i],
    position: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    mesh: null,
    outline: null,
    glowOutline: null,
    state: 'solved',
    slotState: 'filled',
    zIndex: 0,
    visible: true,
    hovered: false,
    dragging: false,
    slotId: i,
    isInSlot: true,
    animationTime: 0,
    animationOffset: { x: 0, y: 0 }
  };
}
```

### Object Updates
```javascript
// Move piece 5
pieces[5].offset = { x: 100, y: 50 };
pieces[5].state = 'unsolved';
pieces[5].slotState = 'empty';
pieces[5].isInSlot = false;

// Update corresponding slot
slots[5].state = 'empty';
slots[5].pieceId = null;
slots[5].isCorrect = false;
```

This design eliminates the sync issues that cause "unreachable" pieces while maintaining all current functionality.
