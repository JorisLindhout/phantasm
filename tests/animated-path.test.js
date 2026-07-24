import { describe, it, expect } from 'vitest';
import {
    createAnimatedPolygon,
    mapPointToHomePolygon,
    isWithinSnapThreshold,
    resolveLevelConfig,
} from '../js/animated-path.js';
import { SNAP_THRESHOLD } from '../js/constants.js';

describe('createAnimatedPolygon', () => {
    const square = [[0, 0], [100, 0], [100, 100], [0, 100]];

    it('returns the same vertex count as the input polygon', () => {
        const animated = createAnimatedPolygon(square, 1000, 10);
        expect(animated).toHaveLength(square.length);
    });

    it('returns the original polygon when amplitude is zero', () => {
        const animated = createAnimatedPolygon(square, 5000, 0);
        expect(animated).toEqual(square);
    });

    it('produces different coordinates when amplitude is non-zero', () => {
        const animated = createAnimatedPolygon(square, 12345, 20);
        expect(animated.some(([x, y], i) => x !== square[i][0] || y !== square[i][1])).toBe(true);
    });
});

describe('mapPointToHomePolygon', () => {
    const square = [[0, 0], [100, 0], [100, 100], [0, 100]];

    it('maps the centroid to itself', () => {
        const [x, y] = mapPointToHomePolygon(50, 50, square);
        expect(x).toBeCloseTo(50, 5);
        expect(y).toBeCloseTo(50, 5);
    });

    it('projects an outside point onto the home boundary', () => {
        const [x, y] = mapPointToHomePolygon(200, 50, square);
        expect(x).toBeCloseTo(100, 1);
        expect(y).toBeCloseTo(50, 1);
    });
});

describe('isWithinSnapThreshold', () => {
    it('returns true when within threshold', () => {
        expect(isWithinSnapThreshold({ x: 10, y: 10 }, SNAP_THRESHOLD)).toBe(true);
    });

    it('returns false when outside threshold', () => {
        expect(isWithinSnapThreshold({ x: 100, y: 0 }, SNAP_THRESHOLD)).toBe(false);
    });
});

describe('resolveLevelConfig', () => {
    it('reads nested config values used by level manager', () => {
        const resolved = resolveLevelConfig({
            id: 'level-2',
            config: { cellCount: 60, animationSpeed: 0.8, noiseAmplitude: 15, morphIntervalMs: 2100 },
        });

        expect(resolved).toEqual({
            cellCount: 60,
            animationSpeed: 0.8,
            noiseAmplitude: 15,
            morphIntervalMs: 2100,
        });
    });

    it('defaults morphIntervalMs when omitted', () => {
        const resolved = resolveLevelConfig({
            config: { cellCount: 40, animationSpeed: 1.0, noiseAmplitude: 10 },
        });

        expect(resolved.morphIntervalMs).toBe(3500);
    });
});
