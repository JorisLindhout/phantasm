import { describe, expect, it } from 'vitest';
import {
    LEVEL_ASPECT_RATIO,
    STAGE_GLOW_PADDING,
    STAGE_MAX_WIDTH,
} from '../js/stage-constants.js';
import { calculateDisplaySize } from '../js/responsive-canvas.js';

describe('stage-constants', () => {
    it('uses the level SVG aspect ratio', () => {
        expect(LEVEL_ASPECT_RATIO).toBe(1);
    });

    it('reserves enough glow padding for solved-state box shadow', () => {
        // solvedGlow animation peaks at 40px blur
        expect(STAGE_GLOW_PADDING).toBeGreaterThanOrEqual(40);
    });
});

describe('responsive-canvas calculateDisplaySize', () => {
    it('fits wide viewports up to max width or available height', () => {
        const size = calculateDisplaySize({ width: 1920, height: 1080 });

        // 1:1 stage: height-limited on 1080p (1000px available height after chrome)
        expect(size.width).toBe(1000);
        expect(size.height).toBe(1000);
    });

    it('uses max width when vertical space allows', () => {
        const size = calculateDisplaySize({ width: 1920, height: 1400 });

        expect(size.width).toBe(STAGE_MAX_WIDTH);
        expect(size.height).toBe(STAGE_MAX_WIDTH);
    });

    it('shrinks to available width on narrow viewports', () => {
        const size = calculateDisplaySize(
            { width: 400, height: 800 },
            { horizontalPadding: 40, verticalChrome: 80 },
        );

        expect(size.width).toBe(360);
        expect(size.height).toBe(Math.floor(360 / LEVEL_ASPECT_RATIO));
    });

    it('limits height when vertical space is tight', () => {
        const size = calculateDisplaySize(
            { width: 1200, height: 500 },
            { horizontalPadding: 40, verticalChrome: 80 },
        );

        expect(size.height).toBeLessThanOrEqual(420);
        expect(size.height).toBe(Math.floor(size.width / LEVEL_ASPECT_RATIO));
    });

    it('preserves aspect ratio within integer rounding', () => {
        const viewports = [
            { width: 320, height: 568 },
            { width: 768, height: 1024 },
            { width: 1440, height: 900 },
        ];

        viewports.forEach((viewport) => {
            const size = calculateDisplaySize(viewport);
            expect(size.height).toBe(Math.floor(size.width / LEVEL_ASPECT_RATIO));
            expect(size.width / size.height).toBeCloseTo(LEVEL_ASPECT_RATIO, 1);
        });
    });

    it('fits within explicit container bounds', () => {
        const size = calculateDisplaySize(
            { width: 1920, height: 1080 },
            { availableWidth: 626, availableHeight: 379 },
        );

        expect(size.width).toBe(379);
        expect(size.height).toBe(379);
    });
});
