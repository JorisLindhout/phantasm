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
        const recoveredCount = renderer.repairAllReleasedPieces?.() ?? 0;
        console.log(`🔄 Repaired ${recoveredCount} released piece issues (layout + interaction)`);
        return recoveredCount;
    }, 'WebGL renderer not available for recovery') ?? 0;
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
    console.log('  autoRecoverPieces() - Layout + interaction repair for released pieces');
    console.log('  debugLostPieces() - Debug lost pieces');
    console.log('  autoSnapPiece(pieceIndex) - Manually snap a piece to its slot');
    console.log('  fixMispositionedPieces() - Repair released loose piece meshes');
    console.log('  testInteractionSystem() - Test interaction system with multiple pieces');
};

window.fixMispositionedPieces = function() {
    return withRenderer((renderer) => {
        let fixedCount = 0;

        renderer.pieces.forEach((piece, index) => {
            if (renderer.repairSeparatePiece?.(index)) {
                fixedCount++;
            }
        });

        console.log(`✅ Repaired ${fixedCount} separate pieces`);
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
