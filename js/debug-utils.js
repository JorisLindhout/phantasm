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

window.autoRecoverPieces = function() {
    return withRenderer((renderer) => {
        const recoveredCount = renderer.autoRecoverUnreachablePieces?.() ?? 0;
        console.log(`🔄 Manually recovered ${recoveredCount} unreachable pieces`);
        return recoveredCount;
    }, 'WebGL renderer not available for auto-recovery') ?? 0;
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
    console.log('  showDebugCommands() - Show this help');
    console.log('  autoRecoverPieces() - Manually recover unreachable pieces');
    console.log('  debugLostPieces() - Debug lost pieces');
    console.log('  checkGhostPieces() - Check for ghost pieces');
    console.log('  autoSnapPiece(pieceIndex) - Manually snap a piece to its slot');
    console.log('  fixMispositionedPieces() - Fix pieces positioned at origin');
    console.log('  testInteractionSystem() - Test interaction system with multiple pieces');
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
