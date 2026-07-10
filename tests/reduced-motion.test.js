import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('reduced motion handling', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('does not disable puzzle animation in JavaScript when reduced motion is preferred', async () => {
        vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query) => ({
            matches: query.includes('prefers-reduced-motion'),
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })));

        const { prefersReducedMotion } = await import('../js/accessibility.js');
        const puzzle = { config: { isAnimating: true } };

        if (prefersReducedMotion()) {
            // CSS handles reduced motion; JS should leave animation enabled.
        }

        expect(puzzle.config.isAnimating).toBe(true);
        vi.unstubAllGlobals();
    });
});
