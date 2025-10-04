/**
 * Debug Tools Index
 * Central loader for all diagnostic and testing tools
 */

console.log('🔧 Loading Debug Tools...');

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
    console.log('🚀 Running Quick Diagnostic...');
    
    // Check if renderer exists
    if (!window.webglRenderer) {
        console.warn('⚠️ WebGL renderer not available');
        return false;
    }
    
    // Run basic checks
    const totalPieces = window.webglRenderer.pieces.length;
    const unsolvedPieces = window.webglRenderer.pieces.filter(p => p.state === 'unsolved').length;
    const piecesWithMeshes = window.webglRenderer.pieces.filter(p => p.mesh !== null).length;
    
    console.log(`📊 Basic Stats: ${totalPieces} total, ${unsolvedPieces} unsolved, ${piecesWithMeshes} with meshes`);
    
    // Run scene diagnostics
    console.log('\n🔍 Running Scene Diagnostics...');
    const sceneResults = window.diagnoseSceneState();
    
    if (sceneResults) {
        const totalIssues = sceneResults.reduce((sum, result) => sum + (result.totalIssues || 0), 0);
        
        if (totalIssues > 0) {
            console.log(`\n⚠️ Found ${totalIssues} issues - running auto-fix...`);
            const fixedCount = window.autoFixSceneIssues();
            console.log(`✅ Auto-fixed ${fixedCount} issues`);
        } else {
            console.log('✅ No scene issues detected');
        }
    }
    
    return true;
};

// Comprehensive test suite
window.runAllTests = function() {
    console.log('🧪 Running Complete Test Suite...');
    console.log('=================================');
    
    if (!window.webglRenderer) {
        console.warn('⚠️ WebGL renderer not available');
        return false;
    }
    
    // 1. Quick diagnostic
    console.log('\n1️⃣ Quick Diagnostic:');
    window.quickDiagnostic();
    
    // 2. Raycaster precision tests
    console.log('\n2️⃣ Raycaster Precision Tests:');
    const precisionResults = window.runPrecisionTests();
    
    // 3. Scene state diagnostics
    console.log('\n3️⃣ Scene State Diagnostics:');
    const sceneResults = window.diagnoseSceneState();
    
    // 4. Legacy tests
    console.log('\n4️⃣ Legacy System Tests:');
    if (window.runObjectSystemTests) {
        window.runObjectSystemTests();
    }
    
    // Summary
    console.log('\n📋 TEST SUITE SUMMARY:');
    console.log('======================');
    
    if (precisionResults) {
        const syntheticIssues = precisionResults.syntheticResults?.filter(r => !r.isDetectable).length || 0;
        const unresponsivePieces = precisionResults.unresponsivePieces?.length || 0;
        console.log(`Raycaster Precision: ${syntheticIssues === 0 ? '✅ PASS' : '❌ FAIL'} (${syntheticIssues} synthetic issues)`);
        console.log(`Unresponsive Pieces: ${unresponsivePieces} found`);
    }
    
    if (sceneResults) {
        const totalSceneIssues = sceneResults.reduce((sum, result) => sum + (result.totalIssues || 0), 0);
        console.log(`Scene State: ${totalSceneIssues === 0 ? '✅ PASS' : '⚠️ ISSUES'} (${totalSceneIssues} issues)`);
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (sceneResults && sceneResults.some(r => r.totalIssues > 0)) {
        console.log('  - Run autoFixSceneIssues() to fix detected problems');
    }
    if (precisionResults && precisionResults.unresponsivePieces?.length > 0) {
        console.log('  - Investigate unresponsive pieces with diagnoseSceneState()');
    }
    
    return {
        precision: precisionResults,
        scene: sceneResults
    };
};

console.log('✅ Debug Tools loaded successfully!');
console.log('📋 Run showDebugCommands() to see all available tools');
console.log('🚀 Run quickDiagnostic() for a quick health check');
console.log('🧪 Run runAllTests() for comprehensive testing');
