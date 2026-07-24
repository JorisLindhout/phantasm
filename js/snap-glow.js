/**
 * Pure helpers for snap-in-place edge glow (level-gradient colored flash).
 */

/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns {number}
 */
export function lerpChannel(a, b, t) {
    return Math.round(a + (b - a) * t);
}

/**
 * Linearly interpolate two 0xRRGGBB hex colors.
 * @param {number} hexA
 * @param {number} hexB
 * @param {number} t - 0..1
 * @returns {number}
 */
export function lerpHex(hexA, hexB, t) {
    const clamped = Math.min(1, Math.max(0, t));
    const ar = (hexA >> 16) & 0xff;
    const ag = (hexA >> 8) & 0xff;
    const ab = hexA & 0xff;
    const br = (hexB >> 16) & 0xff;
    const bg = (hexB >> 8) & 0xff;
    const bb = hexB & 0xff;
    const r = lerpChannel(ar, br, clamped);
    const g = lerpChannel(ag, bg, clamped);
    const b = lerpChannel(ab, bb, clamped);
    return (r << 16) | (g << 8) | b;
}

/**
 * Map a glow layer index onto the level gradient (inner = start, outer = end).
 * @param {number} startHex
 * @param {number} endHex
 * @param {number} layerIndex
 * @param {number} layerCount
 * @returns {number}
 */
export function snapGlowLayerHex(startHex, endHex, layerIndex, layerCount) {
    const t = layerCount <= 1 ? 0 : layerIndex / (layerCount - 1);
    return lerpHex(startHex, endHex, t);
}

/**
 * Ease-out fade factor for snap glow opacity (1 → 0 over duration).
 * @param {number} elapsedMs
 * @param {number} durationMs
 * @returns {number}
 */
export function snapGlowFadeFactor(elapsedMs, durationMs) {
    if (durationMs <= 0) return 0;
    const t = Math.min(1, Math.max(0, elapsedMs / durationMs));
    return 1 - t * t;
}
