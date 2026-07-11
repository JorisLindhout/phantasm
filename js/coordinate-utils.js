/**
 * Coordinate System Utilities
 * 
 * This module provides utilities for converting between different coordinate systems:
 * - Screen coordinates: Y increases downward (0 at top, height at bottom)
 * - WebGL coordinates: Y increases upward (0 at bottom, height at top)
 * 
 * The refactored system uses WebGL coordinates as the global standard,
 * with conversions happening only at the boundaries (mouse input and display output).
 */

export class CoordinateUtils {
    /**
     * Convert screen coordinates (mouse) to WebGL coordinates
     * Screen: Y increases downward (0 at top, height at bottom)
     * WebGL: Y increases upward (0 at bottom, height at top)
     * 
     * @param {number} screenX - X coordinate in screen space
     * @param {number} screenY - Y coordinate in screen space
     * @returns {Object} Object with x, y in WebGL coordinates
     */
    static screenToWebGL(screenX, screenY) {
        return {
            x: screenX,
            y: screenY 
        };
    }
    
    /**
     * Convert WebGL coordinates to screen coordinates
     * WebGL: Y increases upward (0 at bottom, height at top)
     * Screen: Y increases downward (0 at top, height at bottom)
     * 
     * @param {number} webglX - X coordinate in WebGL space
     * @param {number} webglY - Y coordinate in WebGL space
     * @param {number} canvasHeight - Height of the canvas
     * @returns {Object} Object with x, y in screen coordinates
     */
    static webGLToScreen(webglX, webglY, canvasHeight) {
        return {
            x: webglX,
            y: canvasHeight - webglY  // Flip Y-axis
        };
    }
    
    /**
     * Normalize mouse event coordinates to WebGL coordinates
     * Handles canvas positioning correctly by using getBoundingClientRect()
     * 
     * @param {MouseEvent} mouseEvent - The mouse event
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @returns {Object} Object with x, y in WebGL coordinates
     */
    static normalizeMouseCoordinates(mouseEvent, canvas) {
        const rect = canvas.getBoundingClientRect();
        
        // Calculate coordinates relative to canvas position
        const screenX = mouseEvent.clientX - rect.left;
        const screenY = mouseEvent.clientY - rect.top;
        
        // Scale coordinates to match canvas internal resolution
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const scaledX = screenX * scaleX;
        const scaledY = screenY * scaleY;
        
        return this.screenToWebGL(scaledX, scaledY, canvas.height);
    }
    
    /**
     * Convert WebGL world position to screen coordinates for display
     * This replaces the current worldToScreen method and handles the Y-axis conversion
     * 
     * @param {THREE.Vector3|Object} worldPosition - Position in WebGL world space
     * @param {THREE.Camera} camera - The camera used for projection
     * @param {number} canvasWidth - Width of the canvas
     * @param {number} canvasHeight - Height of the canvas
     * @returns {Object} Object with x, y in screen coordinates
     */
    static webGLWorldToScreen(worldPosition, camera, canvasWidth, canvasHeight) {
        const vector = new THREE.Vector3(worldPosition.x, worldPosition.y, worldPosition.z);
        vector.project(camera);
        
        // Convert from normalized device coordinates to screen coordinates
        const x = (vector.x * 0.5 + 0.5) * canvasWidth;
        const y = (vector.y * -0.5 + 0.5) * canvasHeight;  // Y-flip for screen coordinates
        
        return { x, y };
    }
    
    /**
     * Convert mouse offset to WebGL offset
     * Mouse coordinates need Y-flip conversion to WebGL coordinates
     * 
     * @param {Object} mouseOffset - Offset in screen coordinates {x, y}
     * @returns {Object} Offset in WebGL coordinates {x, y}
     */
    static mouseOffsetToWebGL(mouseOffset) {
        return {
            x: mouseOffset.x,
            y: -mouseOffset.y  // Flip Y for WebGL coordinates
        };
    }
    
    /**
     * Convert WebGL offset to mouse offset
     * WebGL coordinates need Y-flip conversion to screen coordinates
     * 
     * @param {Object} webglOffset - Offset in WebGL coordinates {x, y}
     * @returns {Object} Offset in screen coordinates {x, y}
     */
    static webGLOffsetToMouse(webglOffset) {
        return {
            x: webglOffset.x,
            y: -webglOffset.y  // Flip Y for screen coordinates
        };
    }
    
    /**
     * Validate that coordinates are within canvas bounds
     * 
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} canvasWidth - Width of the canvas
     * @param {number} canvasHeight - Height of the canvas
     * @returns {boolean} True if coordinates are within bounds
     */
    static isWithinBounds(x, y, canvasWidth, canvasHeight) {
        return x >= 0 && x <= canvasWidth && y >= 0 && y <= canvasHeight;
    }
    
}
