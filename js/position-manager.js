/**
 * Position Manager
 *
 * Converts seed-point + offset into a world position for slot/snap logic.
 * Returns: { x: originalPoint[x] + offset.x, y: originalPoint[y] + offset.y }
 *
 * NOT for separate-piece mesh positioning — separate ShapeGeometry is absolute
 * (see drag-offset.js). Using getMeshPosition() for separate meshes double-applies
 * the seed and has caused repeated off-screen / cursor-mismatch regressions.
 */

import { resolvePuzzlePoints } from './voronoi-coordinates.js';

class PositionManager {
    constructor(originalPoints, canvasHeight) {
        this.originalPoints = originalPoints;
        this.canvasHeight = canvasHeight;
        this.debugLogging = false; // Debug logging disabled
    }
    
    /**
     * Enable or disable debug logging for position calculations
     * 
     * @param {boolean} enabled - Whether to enable debug logging
     */
    setDebugLogging(enabled) {
        this.debugLogging = enabled;
    }
    
    /**
     * Get piece position in WebGL coordinates
     * No Y-flip needed since we're using WebGL coordinates throughout
     * 
     * @param {number} pieceIndex - Index of the piece
     * @param {Object} offset - Offset in WebGL coordinates {x, y}
     * @returns {Object} Position in WebGL coordinates {x, y}
     */
    getPiecePosition(pieceIndex, offset) {
        let points = this.originalPoints;
        if (!points || points.length === 0) {
            points = resolvePuzzlePoints();
        }
        
        const original = points && points[pieceIndex] ? points[pieceIndex] : null;
        if (!original) {
            return { x: offset.x, y: offset.y }; // Return just the offset as fallback
        }
        
        // Use original point coordinates directly (both mouse and points are in screen coordinates)
        const webglOriginal = {
            x: original[0],
            y: original[1]  // No Y-flip needed - both mouse and points use screen coordinates
        };
        
        const position = {
            x: webglOriginal.x + offset.x,
            y: webglOriginal.y + offset.y  // Now both are in screen coordinates
        };
        
        return position;
    }
    
    /**
     * Get mesh position in WebGL coordinates
     * Same as piece position since we're using WebGL coordinates
     * 
     * @param {number} pieceIndex - Index of the piece
     * @param {Object} offset - Offset in WebGL coordinates {x, y}
     * @returns {Object} Position in WebGL coordinates {x, y}
     */
    getMeshPosition(pieceIndex, offset) {
        return this.getPiecePosition(pieceIndex, offset);
    }
    
    /**
     * Convert mouse offset to WebGL offset
     * Mouse coordinates need Y-flip conversion to WebGL coordinates
     * 
     * @param {Object} mouseOffset - Offset in screen coordinates {x, y}
     * @returns {Object} Offset in WebGL coordinates {x, y}
     */
    mouseOffsetToWebGL(mouseOffset) {
        const webglOffset = {
            x: mouseOffset.x,
            y: -mouseOffset.y  // Flip Y for WebGL coordinates
        };

        return webglOffset;
    }
    
    /**
     * Convert WebGL offset to mouse offset
     * WebGL coordinates need Y-flip conversion to screen coordinates
     * 
     * @param {Object} webglOffset - Offset in WebGL coordinates {x, y}
     * @returns {Object} Offset in screen coordinates {x, y}
     */
    webGLOffsetToMouse(webglOffset) {
        const mouseOffset = {
            x: webglOffset.x,
            y: -webglOffset.y  // Flip Y for screen coordinates
        };

        return mouseOffset;
    }
    
    /**
     * Calculate distance between two positions in WebGL coordinates
     * 
     * @param {Object} pos1 - First position {x, y}
     * @param {Object} pos2 - Second position {x, y}
     * @returns {number} Distance between the positions
     */
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Check if a piece is within snapping distance of its original position
     * 
     * @param {number} pieceIndex - Index of the piece
     * @param {Object} offset - Current offset in WebGL coordinates {x, y}
     * @param {number} threshold - Snapping threshold in pixels
     * @returns {boolean} True if piece is within snapping distance
     */
    isWithinSnappingDistance(pieceIndex, offset, threshold = 30) {
        const distance = this.calculateDistance(
            { x: 0, y: 0 },  // Original position (no offset)
            offset
        );

        return distance <= threshold;
    }
    
    /**
     * Get the original position of a piece in WebGL coordinates
     * 
     * @param {number} pieceIndex - Index of the piece
     * @returns {Object} Original position in WebGL coordinates {x, y}
     */
    getOriginalPosition(pieceIndex) {
        let points = this.originalPoints;
        if (!points || points.length === 0) {
            points = resolvePuzzlePoints();
        }
        
        const original = points && points[pieceIndex] ? points[pieceIndex] : null;
        if (!original) {
            return { x: 0, y: 0 };
        }
        
        // Use original point coordinates directly (both mouse and points are in screen coordinates)
        return {
            x: original[0],
            y: original[1]  // No Y-flip needed - both mouse and points use screen coordinates
        };
    }
    
    /**
     * Validate that a position is within canvas bounds
     * 
     * @param {Object} position - Position in WebGL coordinates {x, y}
     * @param {number} canvasWidth - Width of the canvas
     * @param {number} canvasHeight - Height of the canvas
     * @returns {boolean} True if position is within bounds
     */
    isPositionWithinBounds(position, canvasWidth, canvasHeight) {
        return position.x >= 0 && position.x <= canvasWidth && 
               position.y >= 0 && position.y <= canvasHeight;
    }
    
    /**
     * Clamp a position to canvas bounds
     * 
     * @param {Object} position - Position in WebGL coordinates {x, y}
     * @param {number} canvasWidth - Width of the canvas
     * @param {number} canvasHeight - Height of the canvas
     * @returns {Object} Clamped position in WebGL coordinates {x, y}
     */
    clampPositionToBounds(position, canvasWidth, canvasHeight) {
        return {
            x: Math.max(0, Math.min(canvasWidth, position.x)),
            y: Math.max(0, Math.min(canvasHeight, position.y))
        };
    }
    
    /**
     * Update the original points (called when puzzle is regenerated)
     * 
     * @param {Array} newOriginalPoints - New array of original points
     */
    updateOriginalPoints(newOriginalPoints) {
        this.originalPoints = newOriginalPoints;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PositionManager;
} else {
    window.PositionManager = PositionManager;
}
