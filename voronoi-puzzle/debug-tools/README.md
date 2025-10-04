# Debug Tools

This folder contains comprehensive diagnostic and testing tools for the Voronoi Puzzle WebGL implementation.

## 🚀 Quick Start

```javascript
// Load all debug tools
// (Automatically loaded when included in HTML)

// Quick health check
quickDiagnostic()

// Run comprehensive test suite
runAllTests()

// Show all available commands
showDebugCommands()
```

## 📁 Files

### Core Tools
- **`index.js`** - Central loader and enhanced debug command interface
- **`simple-precision-test.js`** - Raycaster precision testing (proven raycaster precision is NOT the issue)
- **`scene-state-diagnostic.js`** - Comprehensive scene management diagnostics
- **`raycaster-precision-test.js`** - Advanced raycaster precision testing suite

## 🔧 Available Commands

### Quick Diagnostics
```javascript
quickDiagnostic()           // Quick health check
runAllTests()              // Complete test suite
showDebugCommands()        // Show all available commands
```

### Raycaster Precision Testing
```javascript
runPrecisionTests()        // Complete precision test suite
testRaycasterPrecision()   // Test synthetic meshes at various distances
testUnresponsivePieces()   // Test actual puzzle pieces
```

### Scene State Diagnostics
```javascript
diagnoseSceneState()       // Comprehensive scene analysis
autoFixSceneIssues()       // Auto-fix detected scene problems
```

### Legacy Debug Commands
```javascript
debugLostPieces()                    // Debug lost pieces
fixMispositionedPieces()            // Fix mispositioned pieces
validateObjectArraySync()           // Validate object-array sync
runObjectSystemTests()              // Run comprehensive test suite
testInteractionSystem()             // Test interaction system
autoRecoverUnreachablePieces()      // Auto-recover unreachable pieces
toggleInteractionDebug()            // Toggle interaction debugging
```

## 🎯 Problem-Specific Workflows

### Unresponsive Pieces
```javascript
// 1. Quick diagnostic
quickDiagnostic()

// 2. Detailed scene analysis
diagnoseSceneState()

// 3. Auto-fix if issues found
autoFixSceneIssues()

// 4. Test precision (if needed)
runPrecisionTests()
```

### Drag Release Issues (NEW)
```javascript
// 1. Enable drag monitoring
enableDragMonitoring()

// 2. Drag pieces around to trigger issues
// (Move pieces far from slots and release them)

// 3. Analyze detected coordinate issues
analyzeDragIssues()

// 4. Disable monitoring when done
disableDragMonitoring()
```

### Performance Issues
```javascript
// 1. Run all tests
runAllTests()

// 2. Check for scene issues
diagnoseSceneState()

// 3. Validate system integrity
runObjectSystemTests()
```

### Development/Debugging
```javascript
// 1. Enable interaction debugging
toggleInteractionDebug()

// 2. Run comprehensive tests
runAllTests()

// 3. Check specific systems
testInteractionSystem()
validateObjectArraySync()
```

## 📊 Test Results Interpretation

### Raycaster Precision Tests
- **✅ PASS**: All test meshes detectable at all distances (expected result)
- **❌ FAIL**: Raycaster precision degrades with distance (unexpected)

### Scene State Diagnostics
- **Scene Membership**: Pieces should be in Three.js scene
- **Geometry Validity**: Pieces should have valid collision geometry
- **Raycaster Targets**: Pieces should be in raycaster's target list
- **State Synchronization**: Piece and slot states should be consistent
- **Z-Index Layering**: No conflicts or negative z-indices

### Auto-Fix Results
- **0 fixed**: No issues detected or all issues resolved
- **>0 fixed**: Issues were found and automatically resolved

## 🔍 Known Issues

### Raycaster Precision (RESOLVED)
- **Hypothesis**: Raycaster precision degrades with large coordinates
- **Test Result**: ❌ REJECTED - All test meshes detectable even at extreme distances (100,000+ units)
- **Conclusion**: Coordinate precision is NOT the cause of unresponsive pieces

### Scene Management (RESOLVED)
- **Hypothesis**: Scene membership, geometry corruption, or state synchronization issues
- **Test Result**: ✅ CONFIRMED - All pieces are in correct scene state
- **Conclusion**: Scene management is NOT the cause of unresponsive pieces

### Drag Release Coordinates (ACTIVE INVESTIGATION)
- **Hypothesis**: Coordinate inconsistencies during drag release cause pieces to shift or stick
- **Current Status**: New diagnostic tool created to monitor drag behavior
- **Expected Causes**: Drag offset calculation errors, mouse coordinate rounding, timing issues

## 🛠️ Adding New Tools

To add new debug tools:

1. Create your tool file in this directory
2. Add global functions to make them accessible
3. Update `index.js` to include your tool in the `debugTools` object
4. Add documentation to this README
5. Update the `showDebugCommands()` function

## 📝 Usage Notes

- Tools require the WebGL renderer to be loaded (`window.webglRenderer`)
- Some tools may modify the scene state (auto-fix tools)
- Run diagnostics before and after making changes to verify fixes
- Use `quickDiagnostic()` for regular health checks during development
