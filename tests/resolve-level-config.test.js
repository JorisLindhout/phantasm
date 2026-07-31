import { describe, it, expect } from 'vitest';
import { resolveLevelConfig } from '../js/levels.config.js';

describe('resolveLevelConfig', () => {
    it('reads difficulty from a level config object', () => {
        const resolved = resolveLevelConfig({
            difficulty: {
                cellCount: 40,
                animationSpeed: 1.0,
                noiseAmplitude: 10,
                morphIntervalMs: 2800,
                morphCornerCount: 5,
                birthOffsetPx: 16,
            },
        });

        expect(resolved).toEqual({
            cellCount: 40,
            animationSpeed: 1.0,
            noiseAmplitude: 10,
            morphIntervalMs: 2800,
            morphCornerCount: 5,
            birthOffsetPx: 16,
        });
    });

    it('defaults morph fields when omitted', () => {
        const resolved = resolveLevelConfig({
            cellCount: 20,
            animationSpeed: 1.2,
            noiseAmplitude: 5,
        });

        expect(resolved.morphIntervalMs).toBe(3500);
        expect(resolved.morphCornerCount).toBe(3);
        expect(resolved.birthOffsetPx).toBe(18);
    });
});
