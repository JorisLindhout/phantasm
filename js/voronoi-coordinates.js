/**
 * Voronoi seed coordinate alignment with the WebGL render canvas.
 *
 * ── CANVAS SIZE INVARIANT (do not break — has regressed multiple times) ──
 *
 * Voronoi seeds are generated from this.canvas (hidden 2D canvas). The WebGL renderer
 * creates its own canvas sized to the puzzle container (often smaller, e.g. 626×400 vs
 * 800×450). If generateVoronoi() runs before aligning dimensions, seed points land
 * outside the WebGL canvas — pieces appear off-screen or vanish when dragged.
 *
 * Always call alignCanvasDimensions() before super.generateVoronoi() in WebGLRenderer.
 * Always call syncWebGLPositionData() after setupDragAndDrop() so the position
 * manager receives the final seed array (not an empty pre-setupDragAndDrop copy).
 *
 * Tests: tests/voronoi-coordinates.test.js
 */

/**
 * @param {{ width: number, height: number }} sourceCanvas
 * @param {{ width: number, height: number }} targetCanvas
 * @returns {{ width: number, height: number }}
 */
export function alignCanvasDimensions(sourceCanvas, targetCanvas) {
    sourceCanvas.width = targetCanvas.width;
    sourceCanvas.height = targetCanvas.height;

    return {
        width: sourceCanvas.width,
        height: sourceCanvas.height,
    };
}

/**
 * @param {Array<[number, number]>} points
 * @param {number} width
 * @param {number} height
 * @returns {number}
 */
export function countPointsOutsideCanvas(points, width, height) {
    return points.filter(([x, y]) => x < 0 || y < 0 || x > width || y > height).length;
}

/**
 * Resolve the puzzle points array used by the position manager.
 * @returns {Array<[number, number]> | null}
 */
export function resolvePuzzlePoints() {
    const puzzle = typeof window !== 'undefined' ? window.voronoiPuzzle : null;
    if (!puzzle) return null;

    if (puzzle.currentRenderer?.points?.length) {
        return puzzle.currentRenderer.points;
    }

    if (puzzle.points?.length) {
        return puzzle.points;
    }

    return null;
}
