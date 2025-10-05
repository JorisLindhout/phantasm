/**
 * Debug Tools Index
 * Central loader for all diagnostic and testing tools
 */

SmartLogger.log('debug-tools', '🔧 Loading Debug Tools...');

// Load all debug tools
const debugTools = {
    // Raycaster precision testing
    raycaster: {
        runPrecisionTests: window.runPrecisionTests,
        testRaycasterPrecision: window.testRaycasterPrecision,
        testUnresponsivePieces: window.testUnresponsivePieces
    },
    
    // Scene state diagnostics
    scene: {
        diagnoseSceneState: window.diagnoseSceneState,
        autoFixSceneIssues: window.autoFixSceneIssues
    },
    
    // Drag coordinate diagnostics
    drag: {
        enableDragMonitoring: window.enableDragMonitoring,
        disableDragMonitoring: window.disableDragMonitoring,
        analyzeDragIssues: window.analyzeDragIssues,
        clearDragData: window.clearDragData
    },
    
    // Position shift diagnostics
    positionShift: {
        enablePositionShiftMonitoring: window.enablePositionShiftMonitoring,
        disablePositionShiftMonitoring: window.disablePositionShiftMonitoring,
        analyzePositionShifts: window.analyzePositionShifts,
        clearPositionShiftData: window.clearPositionShiftData
    },
    
    // Mouse movement correlation diagnostics
    mouseCorrelation: {
        enableMouseMovementMonitoring: window.enableMouseMovementMonitoring,
        disableMouseMovementMonitoring: window.disableMouseMovementMonitoring,
        analyzeMouseCorrelations: window.analyzeMouseCorrelations,
        clearMouseCorrelationData: window.clearMouseCorrelationData
    },
    
    // Coordinate system diagnostics
    coordinateSystem: {
        enableCoordinateMonitoring: window.enableCoordinateMonitoring,
        disableCoordinateMonitoring: window.disableCoordinateMonitoring,
        analyzeCoordinateSystem: window.analyzeCoordinateSystem,
        clearCoordinateData: window.clearCoordinateData
    },
    
    // Visual debug overlay
    visualDebug: {
        showDebugOverlay: window.showDebugOverlay,
        hideDebugOverlay: window.hideDebugOverlay,
        toggleDebugOverlay: window.toggleDebugOverlay,
        trackDebugPiece: window.trackDebugPiece,
        makeDebugOverlayInteractive: window.makeDebugOverlayInteractive
    },
    
    // Legacy debug commands (from webgl-renderer.js)
    legacy: {
        debugLostPieces: window.debugLostPieces,
        fixMispositionedPieces: window.fixMispositionedPieces,
        validateObjectArraySync: window.validateObjectArraySync,
        runObjectSystemTests: window.runObjectSystemTests,
        testInteractionSystem: window.testInteractionSystem,
        autoRecoverUnreachablePieces: window.autoRecoverUnreachablePieces,
        toggleInteractionDebug: window.toggleInteractionDebug,
        showDebugCommands: window.showDebugCommands
    }
};

// Global debug tools object
window.debugTools = debugTools;

// Enhanced showDebugCommands function
window.showDebugCommands = function() {
    console.log('🔧 AVAILABLE DEBUG COMMANDS');
    console.log('===========================');
    
    console.log('\n🎯 Raycaster Precision Testing:');
    console.log('  runPrecisionTests() - Run complete precision test suite');
    console.log('  testRaycasterPrecision() - Test synthetic meshes at various distances');
    console.log('  testUnresponsivePieces() - Test actual puzzle pieces');
    
    console.log('\n🔍 Scene State Diagnostics:');
    console.log('  diagnoseSceneState() - Comprehensive scene analysis');
    console.log('  autoFixSceneIssues() - Auto-fix detected scene problems');
    
    console.log('\n🎯 Drag Coordinate Diagnostics:');
    console.log('  enableDragMonitoring() - Monitor drag coordinate issues');
    console.log('  disableDragMonitoring() - Disable drag monitoring');
    console.log('  analyzeDragIssues() - Analyze detected drag coordinate issues');
    console.log('  clearDragData() - Clear drag diagnostic data');
    
    console.log('\n🔄 Position Shift Diagnostics:');
    console.log('  enablePositionShiftMonitoring() - Monitor position shifts after release');
    console.log('  disablePositionShiftMonitoring() - Disable position shift monitoring');
    console.log('  analyzePositionShifts() - Analyze detected position shifts');
    console.log('  clearPositionShiftData() - Clear position shift diagnostic data');
    
    console.log('\n🖱️ Mouse Movement Correlation Diagnostics:');
    console.log('  enableMouseMovementMonitoring() - Monitor mouse movement correlations');
    console.log('  disableMouseMovementMonitoring() - Disable mouse movement monitoring');
    console.log('  analyzeMouseCorrelations() - Analyze mouse movement correlations');
    console.log('  clearMouseCorrelationData() - Clear mouse correlation data');
    
    console.log('\n🎯 Coordinate System Diagnostics:');
    console.log('  enableCoordinateMonitoring() - Monitor coordinate system issues');
    console.log('  disableCoordinateMonitoring() - Disable coordinate monitoring');
    console.log('  analyzeCoordinateSystem() - Analyze coordinate system correlations');
    console.log('  clearCoordinateData() - Clear coordinate diagnostic data');
    
    console.log('\n👁️ Visual Debug Overlay:');
    console.log('  showDebugOverlay() - Show real-time debug overlay');
    console.log('  hideDebugOverlay() - Hide debug overlay');
    console.log('  toggleDebugOverlay() - Toggle overlay visibility');
    console.log('  trackDebugPiece(pieceIndex) - Track specific piece in detail');
    console.log('  makeDebugOverlayInteractive() - Make overlay clickable');
    
    console.log('\n🛠️ Legacy Debug Commands:');
    console.log('  debugLostPieces() - Debug lost pieces');
    console.log('  fixMispositionedPieces() - Fix mispositioned pieces');
    console.log('  validateObjectArraySync() - Validate object-array sync');
    console.log('  runObjectSystemTests() - Run comprehensive test suite');
    console.log('  testInteractionSystem() - Test interaction system');
    console.log('  autoRecoverUnreachablePieces() - Auto-recover unreachable pieces');
    console.log('  toggleInteractionDebug() - Toggle interaction debugging');
    
    console.log('\n📋 Quick Access:');
    console.log('  debugTools - Access all tools via object');
    console.log('  showDebugCommands() - Show this help');
    
    console.log('\n🚀 Quick Start:');
    console.log('  1. diagnoseSceneState() - Check for issues');
    console.log('  2. autoFixSceneIssues() - Fix detected problems');
    console.log('  3. runPrecisionTests() - Test raycaster precision');
};

// Quick diagnostic function
window.quickDiagnostic = function() {
    SmartLogger.log('debug-tools', '🚀 Running Quick Diagnostic...');
    
    // Check if renderer exists
    if (!window.webglRenderer) {
        console.warn('⚠️ WebGL renderer not available');
        return false;
    }
    
    // Run basic checks
    const totalPieces = window.webglRenderer.pieces.length;
    const unsolvedPieces = window.webglRenderer.pieces.filter(p => p.state === 'unsolved').length;
    const piecesWithMeshes = window.webglRenderer.pieces.filter(p => p.mesh !== null).length;
    
    SmartLogger.log('debug-tools', `📊 Basic Stats: ${totalPieces} total, ${unsolvedPieces} unsolved, ${piecesWithMeshes} with meshes`);
    
    // Run scene diagnostics
    SmartLogger.log('debug-tools', '\n🔍 Running Scene Diagnostics...');
    const sceneResults = window.diagnoseSceneState();
    
    if (sceneResults) {
        const totalIssues = sceneResults.reduce((sum, result) => sum + (result.totalIssues || 0), 0);
        
        if (totalIssues > 0) {
            SmartLogger.log('debug-tools', `\n⚠️ Found ${totalIssues} issues - running auto-fix...`);
            const fixedCount = window.autoFixSceneIssues();
            SmartLogger.log('debug-tools', `✅ Auto-fixed ${fixedCount} issues`);
        } else {
            SmartLogger.log('debug-tools', '✅ No scene issues detected');
        }
    }
    
    return true;
};

// Comprehensive test suite
window.runAllTests = function() {
    SmartLogger.log('debug-tools', '🧪 Running Complete Test Suite...');
    SmartLogger.log('debug-tools', '=================================');
    
    if (!window.webglRenderer) {
        console.warn('⚠️ WebGL renderer not available');
        return false;
    }
    
    // 1. Quick diagnostic
    SmartLogger.log('debug-tools', '\n1️⃣ Quick Diagnostic:');
    window.quickDiagnostic();
    
    // 2. Raycaster precision tests
    SmartLogger.log('debug-tools', '\n2️⃣ Raycaster Precision Tests:');
    const precisionResults = window.runPrecisionTests();
    
    // 3. Scene state diagnostics
    SmartLogger.log('debug-tools', '\n3️⃣ Scene State Diagnostics:');
    const sceneResults = window.diagnoseSceneState();
    
    // 4. Legacy tests
    SmartLogger.log('debug-tools', '\n4️⃣ Legacy System Tests:');
    if (window.runObjectSystemTests) {
        window.runObjectSystemTests();
    }
    
    // Summary
    SmartLogger.log('debug-tools', '\n📋 TEST SUITE SUMMARY:');
    SmartLogger.log('debug-tools', '======================');
    
    if (precisionResults) {
        const syntheticIssues = precisionResults.syntheticResults?.filter(r => !r.isDetectable).length || 0;
        const unresponsivePieces = precisionResults.unresponsivePieces?.length || 0;
        SmartLogger.log('debug-tools', `Raycaster Precision: ${syntheticIssues === 0 ? '✅ PASS' : '❌ FAIL'} (${syntheticIssues} synthetic issues)`);
        SmartLogger.log('debug-tools', `Unresponsive Pieces: ${unresponsivePieces} found`);
    }
    
    if (sceneResults) {
        const totalSceneIssues = sceneResults.reduce((sum, result) => sum + (result.totalIssues || 0), 0);
        SmartLogger.log('debug-tools', `Scene State: ${totalSceneIssues === 0 ? '✅ PASS' : '⚠️ ISSUES'} (${totalSceneIssues} issues)`);
    }
    
    SmartLogger.log('debug-tools', '\n🎯 RECOMMENDATIONS:');
    if (sceneResults && sceneResults.some(r => r.totalIssues > 0)) {
        SmartLogger.log('debug-tools', '  - Run autoFixSceneIssues() to fix detected problems');
    }
    if (precisionResults && precisionResults.unresponsivePieces?.length > 0) {
        SmartLogger.log('debug-tools', '  - Investigate unresponsive pieces with diagnoseSceneState()');
    }
    
    return {
        precision: precisionResults,
        scene: sceneResults
    };
};

SmartLogger.log('debug-tools', '✅ Debug Tools loaded successfully!');
SmartLogger.log('debug-tools', '📋 Run showDebugCommands() to see all available tools');
SmartLogger.log('debug-tools', '🚀 Run quickDiagnostic() for a quick health check');
SmartLogger.log('debug-tools', '🧪 Run runAllTests() for comprehensive testing');
