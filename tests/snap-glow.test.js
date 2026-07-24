import { describe, it, expect } from 'vitest';
import {
    lerpHex,
    snapGlowLayerHex,
    snapGlowFadeFactor,
} from '../js/snap-glow.js';
import { SNAP_GLOW_DURATION_MS, GLOW_LAYER_CONFIGS } from '../js/constants.js';

describe('snap glow helpers', () => {
    it('lerps between two hex colors', () => {
        expect(lerpHex(0x000000, 0xffffff, 0)).toBe(0x000000);
        expect(lerpHex(0x000000, 0xffffff, 1)).toBe(0xffffff);
        expect(lerpHex(0x000000, 0xffffff, 0.5)).toBe(0x808080);
    });

    it('maps inner glow layers to gradient start and outer to end', () => {
        const start = 0x0dad9e;
        const end = 0x3768fe;
        const count = GLOW_LAYER_CONFIGS.length;

        expect(snapGlowLayerHex(start, end, 0, count)).toBe(start);
        expect(snapGlowLayerHex(start, end, count - 1, count)).toBe(end);
    });

    it('eases snap glow opacity from 1 to 0 over the duration', () => {
        expect(snapGlowFadeFactor(0, SNAP_GLOW_DURATION_MS)).toBe(1);
        expect(snapGlowFadeFactor(SNAP_GLOW_DURATION_MS, SNAP_GLOW_DURATION_MS)).toBe(0);
        expect(snapGlowFadeFactor(SNAP_GLOW_DURATION_MS / 2, SNAP_GLOW_DURATION_MS)).toBeCloseTo(0.75);
    });
});
