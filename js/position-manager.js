/**
 * Position Manager
 *
 * Converts seed-point + offset into a world position for slot/snap logic.
 * Returns: { x: originalPoint[x] + offset.x, y: originalPoint[y] + offset.y }
 *
 * NOT for separate-piece mesh positioning — separate ShapeGeometry is absolute
 * (see drag-offset.js). Using seed+offset for separate meshes double-applies
 * the seed and has caused repeated off-screen / cursor-mismatch regressions.
 */

import { resolvePuzzlePoints } from './voronoi-coordinates.js';

export class PositionManager {
    constructor(originalPoints, canvasHeight) {
        this.originalPoints = originalPoints;
        this.canvasHeight = canvasHeight;
    }

    /**
     * Get piece position for slot/snap logic (seed + offset).
     * @param {number} pieceIndex
     * @param {{ x: number, y: number }} offset
     * @returns {{ x: number, y: number }}
     */
    getPiecePosition(pieceIndex, offset) {
        let points = this.originalPoints;
        if (!points || points.length === 0) {
            points = resolvePuzzlePoints();
        }

        const original = points && points[pieceIndex] ? points[pieceIndex] : null;
        if (!original) {
            return { x: offset.x, y: offset.y };
        }

        return {
            x: original[0] + offset.x,
            y: original[1] + offset.y,
        };
    }

    /**
     * Update the original points (called when puzzle is regenerated).
     * @param {Array<[number, number]>} newOriginalPoints
     */
    updateOriginalPoints(newOriginalPoints) {
        this.originalPoints = newOriginalPoints;
    }
}
