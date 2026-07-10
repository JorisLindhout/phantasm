import { describe, it, expect } from 'vitest';
import {
    SNAP_THRESHOLD,
    SOLVE_THRESHOLD,
    MAX_CELL_COUNT,
    GLOW_LAYER_CONFIGS,
} from '../js/constants.js';

describe('constants', () => {
    it('uses a consistent snap threshold', () => {
        expect(SNAP_THRESHOLD).toBe(30);
        expect(SOLVE_THRESHOLD).toBeLessThanOrEqual(SNAP_THRESHOLD);
    });

    it('supports level 2 cell count in slider range', () => {
        expect(MAX_CELL_COUNT).toBeGreaterThanOrEqual(60);
    });

    it('limits neon glow layers for performance', () => {
        expect(GLOW_LAYER_CONFIGS.length).toBeLessThanOrEqual(4);
    });
});
