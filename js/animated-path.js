/**
 * Animated polygon path utilities (pure functions, testable without WebGL)
 */

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
 * @returns {{ cellCount: number, animationSpeed: number, noiseAmplitude: number }}
 */
export function resolveLevelConfig(levelConfig) {
    const config = levelConfig?.config ?? levelConfig?.difficulty ?? levelConfig;
    return {
        cellCount: config.cellCount,
        animationSpeed: config.animationSpeed,
        noiseAmplitude: config.noiseAmplitude,
    };
}
