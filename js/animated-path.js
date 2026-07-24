/**
 * Animated polygon path utilities (pure functions, testable without WebGL)
 */

import { polygonCenter } from './polygon-geometry.js';

const TIME_SCALE = 0.002;
const SPATIAL_SCALE = 0.015;

/**
 * Create an animated polygon by applying sinusoidal noise offsets to each vertex.
 * @param {Array<[number, number]>} originalPolygon
 * @param {number} time
 * @param {number} noiseAmplitude
 * @returns {Array<[number, number]>}
 */
export function createAnimatedPolygon(originalPolygon, time, noiseAmplitude) {
    const animatedPath = [];

    for (let i = 0; i < originalPolygon.length; i++) {
        const [x, y] = originalPolygon[i];

        const noiseX = Math.sin(time * TIME_SCALE + x * SPATIAL_SCALE + y * SPATIAL_SCALE * 0.7) * noiseAmplitude * 0.8;
        const noiseY = Math.cos(time * TIME_SCALE * 1.3 + x * SPATIAL_SCALE * 0.8 + y * SPATIAL_SCALE) * noiseAmplitude * 0.8;

        animatedPath.push([x + noiseX, y + noiseY]);
    }

    return animatedPath;
}

/**
 * Map a display point back onto the home polygon boundary via radial projection
 * from the home centroid (for rest-pose UV lock).
 * @param {number} x
 * @param {number} y
 * @param {Array<[number, number]>} homePolygon
 * @returns {[number, number]}
 */
export function mapPointToHomePolygon(x, y, homePolygon) {
    if (!homePolygon || homePolygon.length < 3) {
        return [x, y];
    }

    const { centerX, centerY } = polygonCenter(homePolygon);
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist < 1e-6) {
        return [centerX, centerY];
    }

    const dirX = dx / dist;
    const dirY = dy / dist;
    let bestT = Infinity;

    for (let i = 0; i < homePolygon.length; i++) {
        const [ax, ay] = homePolygon[i];
        const [bx, by] = homePolygon[(i + 1) % homePolygon.length];
        const ex = bx - ax;
        const ey = by - ay;

        // Ray (center + t * dir) vs segment (a + u * edge), t >= 0, u in [0,1]
        const det = dirX * ey - dirY * ex;
        if (Math.abs(det) < 1e-8) continue;

        const fx = ax - centerX;
        const fy = ay - centerY;
        const t = (fx * ey - fy * ex) / det;
        const u = (fx * dirY - fy * dirX) / det;

        if (t >= 0 && u >= 0 && u <= 1 && t < bestT) {
            bestT = t;
        }
    }

    if (!Number.isFinite(bestT) || bestT === Infinity) {
        let nearest = homePolygon[0];
        let nearestDist = Infinity;
        for (let i = 0; i < homePolygon.length; i++) {
            const d = Math.hypot(homePolygon[i][0] - x, homePolygon[i][1] - y);
            if (d < nearestDist) {
                nearestDist = d;
                nearest = homePolygon[i];
            }
        }
        return [nearest[0], nearest[1]];
    }

    return [centerX + dirX * bestT, centerY + dirY * bestT];
}

/**
 * @param {{ x: number, y: number }} offset
 * @param {number} threshold
 * @returns {boolean}
 */
export function isWithinSnapThreshold(offset, threshold) {
    const distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y);
    return distance <= threshold;
}

/**
 * Resolve level config values from a level configuration object.
 * @param {object} levelConfig
 * @returns {{ cellCount: number, animationSpeed: number, noiseAmplitude: number, morphIntervalMs: number }}
 */
export function resolveLevelConfig(levelConfig) {
    const config = levelConfig?.config ?? levelConfig?.difficulty ?? levelConfig;
    return {
        cellCount: config.cellCount,
        animationSpeed: config.animationSpeed,
        noiseAmplitude: config.noiseAmplitude,
        morphIntervalMs: config.morphIntervalMs ?? 3500,
    };
}
