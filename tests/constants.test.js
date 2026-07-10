import { describe, it, expect } from 'vitest';
import {
    SNAP_THRESHOLD,
    SOLVE_THRESHOLD,
    MAX_CELL_COUNT,
    GLOW_LAYER_CONFIGS,
    WEBGL_SNAP_THRESHOLD,
} from '../js/constants.js';

describe('constants', () => {
    it('uses a consistent snap threshold', () => {
        expect(SNAP_THRESHOLD).toBe(30);
        expect(SOLVE_THRESHOLD).toBeLessThanOrEqual(SNAP_THRESHOLD);
    });

    it('supports level 2 cell count in slider range', () => {
        expect(MAX_CELL_COUNT).toBeGreaterThanOrEqual(60);
    });

    it('restores the original 10-layer neon glow configuration', () => {
        expect(GLOW_LAYER_CONFIGS.length).toBe(10);
    });

    it('keeps the original webgl snap threshold separate from base snap threshold', () => {
        expect(WEBGL_SNAP_THRESHOLD).toBe(25);
        expect(SNAP_THRESHOLD).toBe(30);
    });
});
