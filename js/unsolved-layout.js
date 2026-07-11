/**
 * Unsolved puzzle layout — batch sizing and collision-aware piece scatter.
 */

import { WEBGL_SNAP_THRESHOLD } from './constants.js';
import { polygonCenter } from './polygon-geometry.js';
import { STAGE_GLOW_PADDING } from './stage-constants.js';

/** Minimum offset magnitude so pieces stay outside auto-snap range. */
export const SCATTER_MIN_DISTANCE = WEBGL_SNAP_THRESHOLD + 35;

/** Minimum center-to-center distance between scattered pieces. */
export const SCATTER_MIN_SEPARATION = 40;

// Shared slot edges can overlap, so visual opacity reads higher on internal grid lines.
export const SLOT_GHOST_OPACITY = 0.0875;

/** Separate loose pieces render above the connected mesh (z=0). */
export const LOOSE_PIECE_Z_BASE = 5;

const MAX_SCATTER_ATTEMPTS = 48;

/**
 * Responsive batch size from stage display width (never shown in UI).
 * @param {number} stageDisplayWidth
 * @param {{ phone?: number, tablet?: number, desktop?: number, large?: number } | null | undefined} [releaseConfig]
 * @returns {number}
 */
export function calculateReleaseBatchSize(stageDisplayWidth, releaseConfig = null) {
    if (releaseConfig) {
        if (stageDisplayWidth < 400) return releaseConfig.phone ?? 3;
        if (stageDisplayWidth < 768) return releaseConfig.tablet ?? 5;
        if (stageDisplayWidth < 1200) return releaseConfig.desktop ?? 8;
        return releaseConfig.large ?? 12;
    }

    if (stageDisplayWidth < 400) return 3;
    if (stageDisplayWidth < 768) return 5;
    if (stageDisplayWidth < 1200) return 8;
    return 12;
}

/**
 * @param {Array<[number, number]>} polygon
 * @returns {number}
 */
export function polygonRadius(polygon) {
    const { centerX, centerY } = polygonCenter(polygon);
    let maxRadius = 0;

    for (const [x, y] of polygon) {
        const distance = Math.hypot(x - centerX, y - centerY);
        if (distance > maxRadius) {
            maxRadius = distance;
        }
    }

    return maxRadius;
}

/**
 * @param {{ width: number, height: number }} stageSize
 * @returns {{ minX: number, maxX: number, minY: number, maxY: number, padding: number }}
 */
export function computeScatterBounds(stageSize) {
    const padding = STAGE_GLOW_PADDING;

    return {
        padding,
        minX: padding,
        maxX: Math.max(padding, stageSize.width - padding),
        minY: padding,
        maxY: Math.max(padding, stageSize.height - padding),
    };
}

/**
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 * @param {{ minX: number, maxX: number, minY: number, maxY: number }} bounds
 * @returns {boolean}
 */
export function isCenterWithinBounds(centerX, centerY, radius, bounds) {
    return (
        centerX - radius >= bounds.minX &&
        centerX + radius <= bounds.maxX &&
        centerY - radius >= bounds.minY &&
        centerY + radius <= bounds.maxY
    );
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} radius
 * @param {Array<{ x: number, y: number, radius: number }>} existingPlacements
 * @returns {boolean}
 */
export function hasPlacementCollision(x, y, radius, existingPlacements) {
    for (const placement of existingPlacements) {
        const separation = radius + placement.radius + SCATTER_MIN_SEPARATION;
        const distance = Math.hypot(x - placement.x, y - placement.y);

        if (distance < separation) {
            return true;
        }
    }

    return false;
}

/**
 * @param {Array<[number, number]>} polygon
 * @param {{ x: number, y: number }} offset
 * @param {{ width: number, height: number }} stageSize
 * @returns {boolean}
 */
export function isPolygonWithinStage(polygon, offset, stageSize) {
    for (const [x, y] of polygon) {
        const vertexX = x + offset.x;
        const vertexY = y + offset.y;

        if (
            vertexX < 0 ||
            vertexX > stageSize.width ||
            vertexY < 0 ||
            vertexY > stageSize.height
        ) {
            return false;
        }
    }

    return true;
}

/**
 * Pick a scatter offset for one piece, avoiding snap threshold and overlaps.
 * @param {object} options
 * @param {Array<[number, number]>} options.polygon
 * @param {{ width: number, height: number }} options.stageSize
 * @param {Array<{ x: number, y: number, radius: number }>} [options.existingPlacements]
 * @returns {{ x: number, y: number }}
 */
export function scatterPiece({ polygon, stageSize, existingPlacements = [] }) {
    const { centerX, centerY } = polygonCenter(polygon);
    const radius = polygonRadius(polygon);
    const bounds = computeScatterBounds(stageSize);
    const maxDistance = Math.min(stageSize.width, stageSize.height) * 0.38;

    for (let attempt = 0; attempt < MAX_SCATTER_ATTEMPTS; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const distance =
            SCATTER_MIN_DISTANCE + Math.random() * Math.max(0, maxDistance - SCATTER_MIN_DISTANCE);

        const targetX = centerX + Math.cos(angle) * distance;
        const targetY = centerY + Math.sin(angle) * distance;

        if (!isCenterWithinBounds(targetX, targetY, radius, bounds)) {
            continue;
        }

        if (hasPlacementCollision(targetX, targetY, radius, existingPlacements)) {
            continue;
        }

        const offset = {
            x: targetX - centerX,
            y: targetY - centerY,
        };

        if (!isPolygonWithinStage(polygon, offset, stageSize)) {
            continue;
        }

        return offset;
    }

    // Fallback: scan angles/distances for any in-bounds placement.
    const fallbackDistances = [
        SCATTER_MIN_DISTANCE + 20,
        SCATTER_MIN_DISTANCE + 40,
        SCATTER_MIN_DISTANCE + 60,
    ];

    for (let step = 0; step < 24; step++) {
        const angle = (step / 24) * Math.PI * 2;

        for (const distance of fallbackDistances) {
            const offset = {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
            };

            const targetX = centerX + offset.x;
            const targetY = centerY + offset.y;

            if (!isCenterWithinBounds(targetX, targetY, radius, bounds)) {
                continue;
            }

            if (hasPlacementCollision(targetX, targetY, radius, existingPlacements)) {
                continue;
            }

            if (!isPolygonWithinStage(polygon, offset, stageSize)) {
                continue;
            }

            return offset;
        }
    }

    // Last resort: clamp toward stage center from home.
    const stageCenterX = stageSize.width / 2;
    const stageCenterY = stageSize.height / 2;
    const towardCenterX = stageCenterX - centerX;
    const towardCenterY = stageCenterY - centerY;
    const towardCenterLength = Math.hypot(towardCenterX, towardCenterY) || 1;
    const distance = SCATTER_MIN_DISTANCE + 20;

    return {
        x: (towardCenterX / towardCenterLength) * distance,
        y: (towardCenterY / towardCenterLength) * distance,
    };
}

/**
 * Fisher–Yates shuffle (returns new array).
 * @param {number[]} indices
 * @returns {number[]}
 */
export function shuffleIndices(indices) {
    const result = [...indices];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}
