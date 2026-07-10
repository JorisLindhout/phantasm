import { describe, it, expect } from 'vitest';
import { OUTLINE_OPACITY } from '../js/constants.js';

describe('outline opacity configuration', () => {
    it('matches the effective main-branch outline opacities', () => {
        expect(OUTLINE_OPACITY).toEqual({
            normal: 0.8,
            hover: 1.0,
            dragging: 1.0,
            snapped: 1.0,
        });
    });
});
