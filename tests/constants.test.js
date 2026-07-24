import { describe, it, expect } from 'vitest';
import {
    SNAP_THRESHOLD,
    SOLVE_THRESHOLD,
    MAX_CELL_COUNT,
    MIN_CELL_COUNT,
    DEFAULT_CELL_COUNT,
    GLOW_LAYER_CONFIGS,
    SNAP_GLOW_DURATION_MS,
} from '../js/constants.js';

describe('constants', () => {
    it('uses a single snap threshold for auto-snap and mouse-up', () => {
        expect(SNAP_THRESHOLD).toBe(25);
        expect(SOLVE_THRESHOLD).toBeLessThanOrEqual(SNAP_THRESHOLD);
    });

    it('supports level 4 cell count in slider range', () => {
        expect(MIN_CELL_COUNT).toBe(5);
        expect(DEFAULT_CELL_COUNT).toBe(40);
        expect(MAX_CELL_COUNT).toBeGreaterThanOrEqual(80);
    });

    it('restores the original 10-layer neon glow configuration', () => {
        expect(GLOW_LAYER_CONFIGS.length).toBe(10);
    });

    it('keeps snap glow flash short and noticeable', () => {
        expect(SNAP_GLOW_DURATION_MS).toBeGreaterThanOrEqual(250);
        expect(SNAP_GLOW_DURATION_MS).toBeLessThanOrEqual(600);
    });

    it('lets the snap glow finish before the solved hold freezes', () => {
        // Level transition waits this long after final snap so fade completes on-screen
        expect(SNAP_GLOW_DURATION_MS).toBe(400);
    });
});
