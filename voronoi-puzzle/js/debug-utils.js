/**
 * Debug Utilities for Phantasm
 * Console-accessible debugging and diagnostic tools
 * 
 * Load this file after webgl-renderer.js to enable debug commands
 */

// Global function to validate object-array sync
window.validateObjectArraySync = function() {
    if (window.webglRenderer && window.webglRenderer.validateObjectArraySync) {
        window.webglRenderer.validateObjectArraySync();
    } else {
        console.log('⚠️ WebGL renderer not available for validation');
    }
};

// Global function to manually recover unreachable pieces
window.autoRecoverPieces = function() {
    if (window.webglRenderer && window.webglRenderer.autoRecoverUnreachablePieces) {
        const recoveredCount = window.webglRenderer.autoRecoverUnreachablePieces();
        console.log(`🔄 Manually recovered ${recoveredCount} unreachable pieces`);
        return recoveredCount;
    } else {
        console.log('⚠️ WebGL renderer not available for auto-recovery');
        return 0;
    }
};

// Global function to toggle interaction debugging
window.toggleInteractionDebug = function() {
    if (window.webglRenderer && window.webglRenderer.debugLogging) {
        window.webglRenderer.debugLogging.interactionDebug = !window.webglRenderer.debugLogging.interactionDebug;
        console.log(`🖱️ Interaction debug: ${window.webglRenderer.debugLogging.interactionDebug ? 'ON' : 'OFF'}`);
        return window.webglRenderer.debugLogging.interactionDebug;
    } else {
        console.log('⚠️ WebGL renderer not available for interaction debug toggle');
        return false;
    }
};

// Global function to toggle material update logs
window.toggleMaterialUpdates = function() {
    if (window.webglRenderer && window.webglRenderer.debugLogging) {
        window.webglRenderer.debugLogging.materialUpdates = !window.webglRenderer.debugLogging.materialUpdates;
        console.log(`🎨 Material updates: ${window.webglRenderer.debugLogging.materialUpdates ? 'ON' : 'OFF'}`);
        return window.webglRenderer.debugLogging.materialUpdates;
    } else {
        console.log('⚠️ WebGL renderer not available for material updates toggle');
        return false;
    }
};

// Global function to toggle hover effect logs
window.toggleHoverEffects = function() {
    if (window.webglRenderer && window.webglRenderer.debugLogging) {
        window.webglRenderer.debugLogging.hoverEffects = !window.webglRenderer.debugLogging.hoverEffects;
        console.log(`✨ Hover effects: ${window.webglRenderer.debugLogging.hoverEffects ? 'ON' : 'OFF'}`);
        return window.webglRenderer.debugLogging.hoverEffects;
    } else {
        console.log('⚠️ WebGL renderer not available for hover effects toggle');
        return false;
    }
};

// Global function to toggle neon glow logs
window.toggleNeonGlow = function() {
    if (window.webglRenderer && window.webglRenderer.debugLogging) {
        window.webglRenderer.debugLogging.neonGlow = !window.webglRenderer.debugLogging.neonGlow;
        console.log(`🌟 Neon glow: ${window.webglRenderer.debugLogging.neonGlow ? 'ON' : 'OFF'}`);
        return window.webglRenderer.debugLogging.neonGlow;
    } else {
        console.log('⚠️ WebGL renderer not available for neon glow toggle');
        return false;
    }
};

// Global function to toggle initialization logs
window.toggleInitialization = function() {
    if (window.webglRenderer && window.webglRenderer.debugLogging) {
        window.webglRenderer.debugLogging.initialization = !window.webglRenderer.debugLogging.initialization;
        console.log(`🔍 Initialization: ${window.webglRenderer.debugLogging.initialization ? 'ON' : 'OFF'}`);
        return window.webglRenderer.debugLogging.initialization;
    } else {
        console.log('⚠️ WebGL renderer not available for initialization toggle');
        return false;
    }
};

// Global function to toggle coordinate logs
window.toggleCoordinates = function() {
    if (window.webglRenderer && window.webglRenderer.debugLogging) {
        window.webglRenderer.debugLogging.coordinates = !window.webglRenderer.debugLogging.coordinates;
        console.log(`🎯 Coordinates: ${window.webglRenderer.debugLogging.coordinates ? 'ON' : 'OFF'}`);
        return window.webglRenderer.debugLogging.coordinates;
    } else {
        console.log('⚠️ WebGL renderer not available for coordinates toggle');
        return false;
    }
};

// Global function to toggle renderer switching logs
window.toggleRendererSwitching = function() {
    if (window.webglRenderer && window.webglRenderer.debugLogging) {
        window.webglRenderer.debugLogging.rendererSwitching = !window.webglRenderer.debugLogging.rendererSwitching;
        console.log(`🔄 Renderer switching: ${window.webglRenderer.debugLogging.rendererSwitching ? 'ON' : 'OFF'}`);
        return window.webglRenderer.debugLogging.rendererSwitching;
    } else {
        console.log('⚠️ WebGL renderer not available for renderer switching toggle');
        return false;
    }
};

// Global function to toggle canvas setup logs
window.toggleCanvasSetup = function() {
    if (window.webglRenderer && window.webglRenderer.debugLogging) {
        window.webglRenderer.debugLogging.canvasSetup = !window.webglRenderer.debugLogging.canvasSetup;
        console.log(`🎨 Canvas setup: ${window.webglRenderer.debugLogging.canvasSetup ? 'ON' : 'OFF'}`);
        return window.webglRenderer.debugLogging.canvasSetup;
    } else {
        console.log('⚠️ WebGL renderer not available for canvas setup toggle');
        return false;
    }
};

// Global function to check for ghost pieces
window.checkGhostPieces = function() {
    if (window.webglRenderer && window.webglRenderer.checkForGhostPieces) {
        const ghostCount = window.webglRenderer.checkForGhostPieces();
        console.log(`👻 Found ${ghostCount} ghost pieces`);
        return ghostCount;
    } else {
        console.log('⚠️ WebGL renderer not available for ghost piece detection');
        return 0;
    }
};

// Global function to manually trigger auto-snap for a piece
window.autoSnapPiece = function(pieceIndex) {
    if (window.webglRenderer && window.webglRenderer.autoSnapPieceToSlot) {
        console.log(`🎯 Manually triggering auto-snap for piece ${pieceIndex}...`);
        window.webglRenderer.autoSnapPieceToSlot(pieceIndex);
        return true;
    } else {
        console.log('⚠️ WebGL renderer not available for auto-snap');
        return false;
    }
};

// Global function to debug lost pieces
window.debugLostPieces = function() {
    if (window.webglRenderer) {
        console.log('🔍 Debugging lost pieces...');
        const renderer = window.webglRenderer;
        
        // Check for pieces that are unsolved but have no separate mesh
        let lostPieces = [];
        for (let i = 0; i < renderer.pieces.length; i++) {
            const piece = renderer.pieces[i];
            const slot = renderer.slots[i];
            
            if (piece.state === 'unsolved' && !piece.mesh) {
                lostPieces.push({
                    index: i,
                    state: piece.state,
                    isInSlot: piece.isInSlot,
                    hasMesh: !!piece.mesh,
                    offset: piece.offset,
                    slotState: slot.state,
                    slotCorrect: slot.isCorrect
                });
            }
        }
        
        if (lostPieces.length > 0) {
            console.log(`🔍 Found ${lostPieces.length} potentially lost pieces:`, lostPieces);
            return lostPieces;
        } else {
            console.log('✅ No lost pieces found');
            return [];
        }
    } else {
        console.log('⚠️ WebGL renderer not available');
        return [];
    }
};

// Global function to show all available debug commands
window.showDebugCommands = function() {
    console.log('🛠️ Available Debug Commands:');
    console.log('  toggleInteractionDebug() - Toggle interaction debugging');
    console.log('  toggleMaterialUpdates() - Toggle material update logs');
    console.log('  toggleHoverEffects() - Toggle hover effect logs');
    console.log('  toggleNeonGlow() - Toggle neon glow logs');
    console.log('  toggleStyling() - Toggle all styling logs');
    console.log('  toggleInitialization() - Toggle WebGL initialization logs');
    console.log('  toggleCoordinates() - Toggle coordinate transformation logs');
    console.log('  toggleRendererSwitching() - Toggle renderer switching logs');
    console.log('  toggleCanvasSetup() - Toggle canvas setup logs');
    console.log('  fixMispositionedPieces() - Fix pieces positioned at origin');
    console.log('  autoRecoverPieces() - Manually recover unreachable pieces');
    console.log('  checkGhostPieces() - Check for ghost pieces');
    console.log('  debugLostPieces() - Debug lost pieces');
    console.log('  autoSnapPiece(pieceIndex) - Manually snap a piece to its slot');
    console.log('  validateObjectArraySync() - Validate object-array synchronization');
    console.log('  runObjectSystemTests() - Run comprehensive test suite');
    console.log('  testInteractionSystem() - Test interaction system with multiple pieces');
    console.log('  showDebugCommands() - Show this help');
};

// Global function to fix mispositioned pieces
window.fixMispositionedPieces = function() {
    if (window.webglRenderer) {
        console.log('🔧 Fixing mispositioned pieces...');
        let fixedCount = 0;
        
        window.webglRenderer.pieces.forEach((piece, index) => {
            if (piece.mesh && window.webglRenderer.scene.children.includes(piece.mesh)) {
                const pos = piece.mesh.position;
                if (pos.x === 0 && pos.y === 0 && piece.offset && (piece.offset.x !== 0 || piece.offset.y !== 0)) {
                    console.log(`🔧 Fixing piece ${index}: moving from (${pos.x}, ${pos.y}) to (${piece.offset.x}, ${piece.offset.y})`);
                    piece.mesh.position.set(piece.offset.x, piece.offset.y, pos.z);
                    fixedCount++;
                }
            }
        });
        
        console.log(`✅ Fixed ${fixedCount} mispositioned pieces`);
        return fixedCount;
    } else {
        console.log('⚠️ WebGL renderer not available');
        return 0;
    }
};

// Global function to test the interaction system
window.testInteractionSystem = function() {
    if (window.webglRenderer) {
        console.log('🧪 Testing Interaction System...');
        const renderer = window.webglRenderer;
        
        // Test 1: Check scene synchronization
        const piecesWithMeshes = renderer.pieces.filter(p => p.mesh !== null);
        const piecesInScene = piecesWithMeshes.filter(p => renderer.scene.children.includes(p.mesh));
        
        console.log(`🧪 Test 1 - Scene Sync: ${piecesInScene.length}/${piecesWithMeshes.length} pieces in scene`);
        
        if (piecesInScene.length !== piecesWithMeshes.length) {
            console.log(`🧪 Test 1 FAILED: ${piecesWithMeshes.length - piecesInScene.length} pieces not in scene!`);
            return false;
        }
        
        // Test 2: Check z-index consistency
        const zIndexIssues = renderer.pieces.filter((piece, index) => {
            const objZ = piece.zIndex || 0;
            const arrZ = renderer.pieceZIndices[index] || 0;
            return Math.abs(objZ - arrZ) > 0.1; // Allow small floating point differences
        });
        
        console.log(`🧪 Test 2 - Z-Index Sync: ${zIndexIssues.length} inconsistencies found`);
        
        if (zIndexIssues.length > 0) {
            console.log(`🧪 Test 2 FAILED: ${zIndexIssues.length} z-index inconsistencies!`);
            return false;
        }
        
        // Test 3: Check piece states (object system only)
        const invalidStates = renderer.pieces.filter(piece => 
            !piece.state || (piece.state !== 'solved' && piece.state !== 'unsolved')
        );
        
        console.log(`🧪 Test 3 - State Validity: ${invalidStates.length} invalid states found`);
        
        if (invalidStates.length > 0) {
            console.log(`🧪 Test 3 FAILED: ${invalidStates.length} pieces with invalid states!`);
            return false;
        }
        
        console.log('✅ All interaction system tests PASSED!');
        return true;
    } else {
        console.log('⚠️ WebGL renderer not available for testing');
        return false;
    }
};

console.log('🛠️ Debug utilities loaded - type showDebugCommands() for help');

