import { describe, expect, it } from 'vitest';
import { ThemeUtils, UNSOLVED_STAGE_GLOW, UNSOLVED_STAGE_GLOW_ALPHA } from '../js/theme.js';

describe('unsolved stage glow', () => {
    it('uses global fluidOrange for unsolved stage frame', () => {
        expect(UNSOLVED_STAGE_GLOW.css).toBe('#FF6600');
    });

    it('exposes a visible rgba halo for CSS', () => {
        const glow = ThemeUtils.getColorWithAlpha(UNSOLVED_STAGE_GLOW, UNSOLVED_STAGE_GLOW_ALPHA);
        expect(glow).toBe('rgba(255, 102, 0, 0.45)');
    });
});
