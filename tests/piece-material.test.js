import { describe, expect, it } from 'vitest';
import {
    ensureUnsolvedPieceBackground,
    hasBackgroundTexture,
} from '../js/piece-material.js';

describe('piece-material', () => {
    it('restores background texture for unsolved separate pieces', () => {
        const texture = { isTexture: true };
        const material = {
            map: null,
            originalMap: texture,
            color: { setHex() {} },
            originalColor: { setHex() {} },
            opacity: 0.3,
            originalOpacity: undefined,
        };

        ensureUnsolvedPieceBackground(material, texture);

        expect(material.map).toBe(texture);
        expect(material.originalMap).toBeNull();
        expect(material.opacity).toBe(1);
        expect(hasBackgroundTexture(material)).toBe(true);
    });
});
