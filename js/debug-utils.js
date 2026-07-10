/**
 * Debug Utilities for Phantasm
 * Console-accessible debugging and diagnostic tools
 *
 * Loaded only in development via app.js
 */

import { getWebGLRenderer } from './accessibility.js';

function withRenderer(callback, fallbackMessage = 'WebGL renderer not available') {
    const renderer = getWebGLRenderer();
    if (renderer) {
        return callback(renderer);
    }
    console.log(`⚠️ ${fallbackMessage}`);
    return null;
}

window.validateObjectArraySync = function() {
    withRenderer((renderer) => renderer.validateObjectArraySync?.());
};

window.autoRecoverPieces = function() {
    return withRenderer((renderer) => {
        const recoveredCount = renderer.autoRecoverUnreachablePieces?.() ?? 0;
        console.log(`🔄 Manually recovered ${recoveredCount} unreachable pieces`);
        return recoveredCount;
    }, 'WebGL renderer not available for auto-recovery') ?? 0;
};

window.toggleInteractionDebug = function() {
    return withRenderer((renderer) => {
        renderer.debugLogging.interactionDebug = !renderer.debugLogging.interactionDebug;
        console.log(`🖱️ Interaction debug: ${renderer.debugLogging.interactionDebug ? 'ON' : 'OFF'}`);
        return renderer.debugLogging.interactionDebug;
    }, 'WebGL renderer not available for interaction debug toggle') ?? false;
};

window.toggleMaterialUpdates = function() {
    return withRenderer((renderer) => {
        renderer.debugLogging.materialUpdates = !renderer.debugLogging.materialUpdates;
        console.log(`🎨 Material updates: ${renderer.debugLogging.materialUpdates ? 'ON' : 'OFF'}`);
        return renderer.debugLogging.materialUpdates;
    }, 'WebGL renderer not available for material updates toggle') ?? false;
};

window.toggleHoverEffects = function() {
    return withRenderer((renderer) => {
        renderer.debugLogging.hoverEffects = !renderer.debugLogging.hoverEffects;
        console.log(`✨ Hover effects: ${renderer.debugLogging.hoverEffects ? 'ON' : 'OFF'}`);
        return renderer.debugLogging.hoverEffects;
    }, 'WebGL renderer not available for hover effects toggle') ?? false;
};

window.toggleNeonGlow = function() {
    return withRenderer((renderer) => {
        renderer.debugLogging.neonGlow = !renderer.debugLogging.neonGlow;
        console.log(`🌟 Neon glow: ${renderer.debugLogging.neonGlow ? 'ON' : 'OFF'}`);
        return renderer.debugLogging.neonGlow;
    }, 'WebGL renderer not available for neon glow toggle') ?? false;
};

window.toggleInitialization = function() {
    return withRenderer((renderer) => {
        renderer.debugLogging.initialization = !renderer.debugLogging.initialization;
        console.log(`🔍 Initialization: ${renderer.debugLogging.initialization ? 'ON' : 'OFF'}`);
        return renderer.debugLogging.initialization;
    }, 'WebGL renderer not available for initialization toggle') ?? false;
};

window.toggleCoordinates = function() {
    return withRenderer((renderer) => {
        renderer.debugLogging.coordinates = !renderer.debugLogging.coordinates;
        console.log(`🎯 Coordinates: ${renderer.debugLogging.coordinates ? 'ON' : 'OFF'}`);
        return renderer.debugLogging.coordinates;
    }, 'WebGL renderer not available for coordinates toggle') ?? false;
};

window.toggleRendererSwitching = function() {
    return withRenderer((renderer) => {
        renderer.debugLogging.rendererSwitching = !renderer.debugLogging.rendererSwitching;
        console.log(`🔄 Renderer switching: ${renderer.debugLogging.rendererSwitching ? 'ON' : 'OFF'}`);
        return renderer.debugLogging.rendererSwitching;
    }, 'WebGL renderer not available for renderer switching toggle') ?? false;
};

window.toggleCanvasSetup = function() {
    return withRenderer((renderer) => {
        renderer.debugLogging.canvasSetup = !renderer.debugLogging.canvasSetup;
        console.log(`🎨 Canvas setup: ${renderer.debugLogging.canvasSetup ? 'ON' : 'OFF'}`);
        return renderer.debugLogging.canvasSetup;
    }, 'WebGL renderer not available for canvas setup toggle') ?? false;
};

window.checkGhostPieces = function() {
    return withRenderer((renderer) => {
        const ghostCount = renderer.checkForGhostPieces?.() ?? 0;
        console.log(`👻 Found ${ghostCount} ghost pieces`);
        return ghostCount;
    }, 'WebGL renderer not available for ghost piece detection') ?? 0;
};

window.autoSnapPiece = function(pieceIndex) {
    return withRenderer((renderer) => {
        console.log(`🎯 Manually triggering auto-snap for piece ${pieceIndex}...`);
        renderer.autoSnapPieceToSlot?.(pieceIndex);
        return true;
    }, 'WebGL renderer not available for auto-snap') ?? false;
};

window.debugLostPieces = function() {
    return withRenderer((renderer) => {
        const lostPieces = renderer.pieces
            .map((piece, index) => ({ piece, index, slot: renderer.slots[index] }))
            .filter(({ piece }) => piece.state === 'unsolved' && !piece.mesh)
            .map(({ piece, index, slot }) => ({
                index,
                state: piece.state,
                isInSlot: piece.isInSlot,
                hasMesh: !!piece.mesh,
                offset: piece.offset,
                slotState: slot.state,
                slotCorrect: slot.isCorrect,
            }));

        if (lostPieces.length > 0) {
            console.log(`🔍 Found ${lostPieces.length} potentially lost pieces:`, lostPieces);
        } else {
            console.log('✅ No lost pieces found');
        }

        return lostPieces;
    }, 'WebGL renderer not available') ?? [];
};

window.showDebugCommands = function() {
    console.log('🛠️ Available Debug Commands:');
    console.log('  toggleInteractionDebug() - Toggle interaction debugging');
    console.log('  toggleMaterialUpdates() - Toggle material update logs');
    console.log('  toggleHoverEffects() - Toggle hover effect logs');
    console.log('  toggleNeonGlow() - Toggle neon glow logs');
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
    console.log('  testInteractionSystem() - Test interaction system with multiple pieces');
    console.log('  showDebugCommands() - Show this help');
};

window.fixMispositionedPieces = function() {
    return withRenderer((renderer) => {
        let fixedCount = 0;

        renderer.pieces.forEach((piece) => {
            if (piece.mesh && renderer.scene.children.includes(piece.mesh)) {
                const pos = piece.mesh.position;
                if (pos.x === 0 && pos.y === 0 && piece.offset && (piece.offset.x !== 0 || piece.offset.y !== 0)) {
                    piece.mesh.position.set(piece.offset.x, piece.offset.y, pos.z);
                    fixedCount++;
                }
            }
        });

        console.log(`✅ Fixed ${fixedCount} mispositioned pieces`);
        return fixedCount;
    }, 'WebGL renderer not available') ?? 0;
};

window.testInteractionSystem = function() {
    return withRenderer((renderer) => {
        const piecesWithMeshes = renderer.pieces.filter((piece) => piece.mesh !== null);
        const piecesInScene = piecesWithMeshes.filter((piece) => renderer.scene.children.includes(piece.mesh));

        if (piecesInScene.length !== piecesWithMeshes.length) {
            console.log(`🧪 Scene sync FAILED: ${piecesWithMeshes.length - piecesInScene.length} pieces not in scene`);
            return false;
        }

        const invalidStates = renderer.pieces.filter(
            (piece) => !piece.state || (piece.state !== 'solved' && piece.state !== 'unsolved')
        );

        if (invalidStates.length > 0) {
            console.log(`🧪 State validity FAILED: ${invalidStates.length} invalid states`);
            return false;
        }

        console.log('✅ All interaction system tests PASSED!');
        return true;
    }, 'WebGL renderer not available for testing') ?? false;
};

console.log('🛠️ Debug utilities loaded - type showDebugCommands() for help');
