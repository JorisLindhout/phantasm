/**
 * Material helpers for separate (disconnected) puzzle pieces.
 *
 * ── TEXTURE INVARIANT (do not break — has regressed multiple times) ──
 *
 * Unsolved separate pieces MUST keep backgroundTexture on material.map at all times
 * (normal, hover, and dragging). The connected mesh hides the slot (alpha = 0); the
 * separate mesh is the only surface showing the image skin for that piece.
 *
 * Do NOT set material.map = null for unsolved pieces to achieve a drag glow — use a
 * color tint while keeping the map. Removing the map and restoring via originalMap
 * fails when hover/normal cycles run before restore, leaving pieces looking blank.
 *
 * Always route unsolved material changes through ensureUnsolvedPieceBackground().
 *
 * Tests: tests/piece-material.test.js
 */

/**
 * Ensure an unsolved separate piece renders with the puzzle background texture.
 * @param {import('three').MeshBasicMaterial} material
 * @param {import('three').Texture | null | undefined} backgroundTexture
 */
export function ensureUnsolvedPieceBackground(material, backgroundTexture) {
    if (!material || !backgroundTexture) return;

    material.map = backgroundTexture;
    material.originalMap = null;

    if (material.originalOpacity == null) {
        material.originalOpacity = 1;
    }

    material.opacity = material.originalOpacity;
    material.color.setHex(0xffffff);

    if (material.originalColor) {
        material.originalColor.setHex(0xffffff);
    }
}

/**
 * @param {import('three').MeshBasicMaterial} material
 * @returns {boolean}
 */
export function hasBackgroundTexture(material) {
    return Boolean(material?.map);
}
