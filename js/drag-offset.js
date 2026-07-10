/**
 * Drag offset and separate-piece positioning.
 *
 * ── COORDINATE INVARIANTS (do not break — these bugs have regressed multiple times) ──
 *
 * 1. SEPARATE-PIECE GEOMETRY IS ABSOLUTE
 *    ShapeGeometry for dragged pieces is built from Voronoi polygon vertices in canvas
 *    space (see separate-piece-geometry.js). Vertices already contain the seed position.
 *
 * 2. MESH POSITION = DISPLACEMENT ONLY
 *    For separate pieces: mesh.position = offset (NOT originalPoint + offset).
 *    Adding the seed point again double-translates the piece off-screen (down/right).
 *    Use getSeparatePieceMeshPosition() everywhere a separate mesh is placed or synced.
 *
 * 3. PIECE.offset = DISPLACEMENT FROM HOME SLOT
 *    Stored as { dx, dy } from the piece's original seed. Never store absolute pointer
 *    coordinates in offset — that was an earlier bug that made pieces disappear.
 *
 * 4. DRAG TRACKING = POINTER DELTA
 *    Do not derive offset from pointer minus dragOffset using seed math. Track
 *    dragPointerStart + dragOffsetStart and apply computePieceOffsetFromDragDelta().
 *
 * 5. positionManager.getMeshPosition() IS NOT FOR SEPARATE MESHES
 *    It returns originalPoint + offset (correct for slot/snap logic only). Never use it
 *    to set separate-piece mesh.position or hit-detection repositioning.
 *
 * Tests: tests/drag-offset.test.js
 */

/**
 * Mesh position for separate pieces whose geometry is already in canvas space.
 * @param {{ x: number, y: number }} offset
 * @returns {{ x: number, y: number }}
 */
export function getSeparatePieceMeshPosition(offset) {
    return {
        x: offset.x,
        y: offset.y,
    };
}

/**
 * Compute piece displacement from pointer delta since drag started.
 * @param {{ x: number, y: number }} pointer
 * @param {{ x: number, y: number }} dragStartPointer
 * @param {{ x: number, y: number }} dragStartOffset
 * @returns {{ x: number, y: number }}
 */
export function computePieceOffsetFromDragDelta(pointer, dragStartPointer, dragStartOffset) {
    return {
        x: dragStartOffset.x + (pointer.x - dragStartPointer.x),
        y: dragStartOffset.y + (pointer.y - dragStartPointer.y),
    };
}

/**
 * @param {{ x: number, y: number }} offset
 * @returns {number}
 */
export function offsetDistance(offset) {
    return Math.sqrt(offset.x * offset.x + offset.y * offset.y);
}

/**
 * Detect mesh positioning that adds seed coordinates on top of absolute geometry.
 * Used in tests to guard against the double-seed regression.
 * @param {{ x: number, y: number }} meshPosition
 * @param {{ x: number, y: number }} offset
 * @param {[number, number]} originalPoint
 * @returns {boolean}
 */
export function looksLikeDoubleAppliedSeedPosition(meshPosition, offset, originalPoint) {
    return (
        Math.abs(meshPosition.x - (originalPoint[0] + offset.x)) < 1 &&
        Math.abs(meshPosition.y - (originalPoint[1] + offset.y)) < 1 &&
        (Math.abs(originalPoint[0]) > 50 || Math.abs(originalPoint[1]) > 50)
    );
}
