# Migration Plan: Array to Object System

## Overview
Convert from 6 synchronized arrays to self-contained piece and slot objects to eliminate sync issues.

## Current Arrays → Object Properties Mapping

### Array: `voronoiPolygons[index]` → Object: `pieces[index].polygon`
```javascript
// OLD: this.voronoiPolygons[5]
// NEW: this.pieces[5].polygon
```

### Array: `separatePieces[index]` → Object: `pieces[index].mesh`
```javascript
// OLD: this.separatePieces[5] = mesh;
// NEW: this.pieces[5].mesh = mesh;
```

### Array: `pieceStates[index]` → Object: `pieces[index].state`
```javascript
// OLD: this.pieceStates[5] = 'unsolved';
// NEW: this.pieces[5].state = 'unsolved';
```

### Array: `slotStates[index]` → Object: `slots[index].state`
```javascript
// OLD: this.slotStates[5] = 'empty';
// NEW: this.slots[5].state = 'empty';
```

### Array: `pieceZIndices[index]` → Object: `pieces[index].zIndex`
```javascript
// OLD: this.pieceZIndices[5] = 2;
// NEW: this.pieces[5].zIndex = 2;
```

### Array: `pieceOffsets[index]` → Object: `pieces[index].offset`
```javascript
// OLD: this.pieceOffsets[5] = {x: 100, y: 50};
// NEW: this.pieces[5].offset = {x: 100, y: 50};
```

## Step-by-Step Migration

### Step 1: Add Object Arrays (Parallel System)
```javascript
// In webgl-renderer.js constructor
this.pieces = [];     // New object-based pieces
this.slots = [];      // New object-based slots

// Keep existing arrays for now
this.voronoiPolygons = [];
this.separatePieces = [];
// ... etc
```

### Step 2: Initialize Objects from Arrays
```javascript
// In initializeVoronoi()
initializeVoronoi(polygons) {
  // Keep existing array initialization
  this.voronoiPolygons = polygons.map(polygon => [...polygon]);
  this.pieceStates = new Array(polygons.length).fill('solved');
  // ... etc
  
  // NEW: Initialize objects from arrays
  this.pieces = [];
  this.slots = [];
  
  for (let i = 0; i < polygons.length; i++) {
    // Create piece object
    this.pieces[i] = {
      id: i,
      polygon: this.voronoiPolygons[i],
      mesh: null,
      state: this.pieceStates[i],
      zIndex: this.pieceZIndices[i] || 0,
      offset: this.pieceOffsets[i] || { x: 0, y: 0 },
      visible: true,
      hovered: false,
      dragging: false,
      slotId: i,
      isInSlot: true
    };
    
    // Create slot object
    this.slots[i] = {
      id: i,
      polygon: this.voronoiPolygons[i],
      state: this.slotStates[i],
      pieceId: i,
      correctPieceId: i,
      isCorrect: true,
      hovered: false,
      showBackground: true
    };
  }
}
```

### Step 3: Update Core Functions (One at a Time)

#### A. Update `updatePiecePosition()`
```javascript
// OLD:
updatePiecePosition(index, offset) {
  this.pieceOffsets[index] = offset;
  this.pieceStates[index] = 'unsolved';
  this.slotStates[index] = 'empty';
}

// NEW:
updatePiecePosition(index, offset) {
  // Update object
  this.pieces[index].offset = offset;
  this.pieces[index].state = 'unsolved';
  this.pieces[index].isInSlot = false;
  
  // Update corresponding slot
  this.slots[index].state = 'empty';
  this.slots[index].pieceId = null;
  this.slots[index].isCorrect = false;
  
  // Keep array sync for now
  this.pieceOffsets[index] = offset;
  this.pieceStates[index] = 'unsolved';
  this.slotStates[index] = 'empty';
}
```

#### B. Update `createSeparatePiece()`
```javascript
// OLD:
createSeparatePiece(index, offset) {
  const polygon = this.voronoiPolygons[index];
  // ... create mesh
  this.separatePieces[index] = mesh;
}

// NEW:
createSeparatePiece(index, offset) {
  const piece = this.pieces[index];
  const polygon = piece.polygon;
  // ... create mesh
  piece.mesh = mesh;
  
  // Keep array sync for now
  this.separatePieces[index] = mesh;
}
```

#### C. Update Hit Detection
```javascript
// OLD:
findPieceAtPosition(x, y) {
  for (let i = 0; i < this.separatePieces.length; i++) {
    const piece = this.separatePieces[i];
    if (piece && this.isPointInPiece(x, y, piece)) {
      return i;
    }
  }
}

// NEW:
findPieceAtPosition(x, y) {
  for (let i = 0; i < this.pieces.length; i++) {
    const piece = this.pieces[i];
    if (piece.mesh && this.isPointInPiece(x, y, piece.mesh)) {
      return i;
    }
  }
}
```

### Step 4: Remove Array Dependencies
Once all functions use objects, remove array references:

```javascript
// Remove these lines:
// this.voronoiPolygons = [];
// this.separatePieces = [];
// this.pieceStates = [];
// this.slotStates = [];
// this.pieceZIndices = [];
// this.pieceOffsets = [];
```

### Step 5: Update All References
Search and replace all array access patterns:

```javascript
// Find: this.voronoiPolygons[index]
// Replace: this.pieces[index].polygon

// Find: this.separatePieces[index]
// Replace: this.pieces[index].mesh

// Find: this.pieceStates[index]
// Replace: this.pieces[index].state

// Find: this.slotStates[index]
// Replace: this.slots[index].state

// Find: this.pieceZIndices[index]
// Replace: this.pieces[index].zIndex

// Find: this.pieceOffsets[index]
// Replace: this.pieces[index].offset
```

## Testing Strategy

### Phase 1: Parallel System Test
- Run both array and object systems
- Compare results to ensure they match
- Log any discrepancies

### Phase 2: Object-Only Test
- Remove array system
- Test all interactions with objects only
- Verify no functionality is lost

### Phase 3: Performance Test
- Measure performance before/after
- Ensure no regressions
- Optimize if needed

## Risk Mitigation

### Rollback Plan
- Keep array system as backup
- Easy to revert if issues arise
- Gradual migration allows testing

### Validation
- Comprehensive testing at each step
- Performance monitoring
- User interaction testing

## Expected Benefits

1. **Eliminate Sync Issues**: No more array synchronization problems
2. **Better Debugging**: Clear object structure for troubleshooting
3. **Cleaner Code**: More readable and maintainable
4. **Easier Level Management**: Simple object creation/destruction
5. **Future-Proof**: Better foundation for advanced features

This migration will solve the "unreachable pieces" issue by eliminating the fundamental sync problem between multiple arrays.
