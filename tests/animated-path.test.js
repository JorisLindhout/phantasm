import { describe, it, expect } from 'vitest';
import {
    createAnimatedPolygon,
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
            config: { cellCount: 60, animationSpeed: 0.8, noiseAmplitude: 15 },
        });

        expect(resolved).toEqual({
            cellCount: 60,
            animationSpeed: 0.8,
            noiseAmplitude: 15,
        });
    });

    it('does not return undefined when config is nested correctly', () => {
        const resolved = resolveLevelConfig({
            config: { cellCount: 40, animationSpeed: 1.0, noiseAmplitude: 10 },
        });

        expect(resolved.cellCount).toBe(40);
        expect(resolved.animationSpeed).toBe(1.0);
        expect(resolved.noiseAmplitude).toBe(10);
    });
});
