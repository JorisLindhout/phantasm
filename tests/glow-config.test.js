import { describe, it, expect } from 'vitest';
import { GLOW_LAYER_CONFIGS } from '../js/constants.js';

describe('neon glow configuration', () => {
    it('matches the original 10-layer drag glow from main', () => {
        expect(GLOW_LAYER_CONFIGS).toHaveLength(10);
        expect(GLOW_LAYER_CONFIGS[0]).toEqual({ scale: 1.0, opacity: 1.0, zOffset: 0.01 });
        expect(GLOW_LAYER_CONFIGS[9]).toEqual({ scale: 1.18, opacity: 0.05, zOffset: 0.10 });
    });

    it('uses progressively wider scales for outer glow layers', () => {
        for (let i = 1; i < GLOW_LAYER_CONFIGS.length; i++) {
            expect(GLOW_LAYER_CONFIGS[i].scale).toBeGreaterThan(GLOW_LAYER_CONFIGS[i - 1].scale);
        }
    });
});
