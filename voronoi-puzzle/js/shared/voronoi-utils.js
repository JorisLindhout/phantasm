/**
 * Shared Utility Functions for Voronoi Puzzle
 * Contains helper functions used by both 2D and 3D renderers
 */

// Global control functions
function updateCellCount() {
    if (window.voronoiPuzzle && window.voronoiPuzzle.config) {
        window.voronoiPuzzle.config.cellCount = parseInt(document.getElementById('cellCount').value);
        window.voronoiPuzzle.generateVoronoi();
    }
}

function updateAnimationSpeed() {
    if (window.voronoiPuzzle && window.voronoiPuzzle.config) {
        window.voronoiPuzzle.config.animationSpeed = parseFloat(document.getElementById('animationSpeed').value);
    }
}

function updateNoiseAmplitude() {
    if (window.voronoiPuzzle && window.voronoiPuzzle.config) {
        window.voronoiPuzzle.config.noiseAmplitude = parseInt(document.getElementById('noiseAmplitude').value);
    }
}

function regeneratePuzzle() {
    if (window.voronoiPuzzle) {
        window.voronoiPuzzle.regeneratePuzzle();
    }
}

function toggleAnimation() {
    if (window.voronoiPuzzle) {
        window.voronoiPuzzle.toggleAnimation();
    }
}

// Utility functions for coordinate calculations
class VoronoiUtils {
    static getCanvasCoordinates(event, canvas) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    static calculateDistance(point1, point2) {
        return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
    }

    static calculatePolygonCenter(polygon) {
        const centerX = polygon.reduce((sum, point) => sum + point[0], 0) / polygon.length;
        const centerY = polygon.reduce((sum, point) => sum + point[1], 0) / polygon.length;
        return { x: centerX, y: centerY };
    }

    static pointInPolygon(x, y, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (((polygon[i][1] > y) !== (polygon[j][1] > y)) &&
                (x < (polygon[j][0] - polygon[i][0]) * (y - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0])) {
                inside = !inside;
            }
        }
        return inside;
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Export utility class
window.VoronoiUtils = VoronoiUtils;
