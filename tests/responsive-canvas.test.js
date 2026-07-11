import { describe, expect, it } from 'vitest';
import {
    LEVEL_ASPECT_RATIO,
    LEVEL_WIDTH,
    NARROW_VIEWPORT_BREAKPOINT,
    STAGE_GLOW_PADDING,
    STAGE_GLOW_PADDING_NARROW,
    STAGE_HORIZONTAL_PADDING,
    STAGE_HORIZONTAL_PADDING_NARROW,
    STAGE_MAX_WIDTH,
    getStageGlowPadding,
    getStageHorizontalPadding,
    isNarrowViewport,
} from '../js/stage-constants.js';
import {
    ResponsiveCanvas,
    STAGE_LOGICAL_SIZE,
    calculateDisplaySize,
} from '../js/responsive-canvas.js';

describe('stage-constants', () => {
    it('uses the level SVG aspect ratio', () => {
        expect(LEVEL_ASPECT_RATIO).toBe(1);
    });

    it('reserves enough glow padding for solved-state box shadow', () => {
        // solvedGlow animation peaks at 40px blur
        expect(STAGE_GLOW_PADDING).toBeGreaterThanOrEqual(40);
    });

    it('uses tighter layout padding below the narrow viewport breakpoint', () => {
        expect(NARROW_VIEWPORT_BREAKPOINT).toBe(400);
        expect(isNarrowViewport(375)).toBe(true);
        expect(isNarrowViewport(400)).toBe(false);
        expect(getStageHorizontalPadding(375)).toBe(STAGE_HORIZONTAL_PADDING_NARROW);
        expect(getStageHorizontalPadding(400)).toBe(STAGE_HORIZONTAL_PADDING);
        expect(getStageGlowPadding(375)).toBe(STAGE_GLOW_PADDING_NARROW);
        expect(getStageGlowPadding(400)).toBe(STAGE_GLOW_PADDING);
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

    it('uses tighter padding on iPhone 8 portrait width', () => {
        const narrow = calculateDisplaySize(
            { width: 375, height: 667 },
            {
                horizontalPadding: STAGE_HORIZONTAL_PADDING_NARROW,
                verticalChrome: 80,
            },
        );
        const wide = calculateDisplaySize(
            { width: 375, height: 667 },
            {
                horizontalPadding: STAGE_HORIZONTAL_PADDING,
                verticalChrome: 80,
            },
        );

        expect(narrow.width).toBeGreaterThan(wide.width);
        expect(narrow.width).toBe(351);
    });
});

describe('ResponsiveCanvas setupStage', () => {
    it('locks logical canvas to level artwork size while display scales down', () => {
        document.body.innerHTML = `
            <div class="puzzle-container" style="width: 355px; height: 500px;">
                <div class="stage"><canvas id="voronoiCanvas"></canvas></div>
            </div>
        `;

        const canvas = document.getElementById('voronoiCanvas');
        const container = canvas.closest('.puzzle-container');
        container.getBoundingClientRect = () => ({
            x: 0,
            y: 0,
            width: 355,
            height: 500,
            top: 0,
            left: 0,
            right: 355,
            bottom: 500,
            toJSON: () => ({}),
        });

        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: 667 });

        const responsive = new ResponsiveCanvas();
        const { logical, display } = responsive.setupStage(canvas, { resetLogical: true });

        expect(logical).toEqual(STAGE_LOGICAL_SIZE);
        expect(logical.width).toBe(LEVEL_WIDTH);
        expect(logical.height).toBe(LEVEL_WIDTH);
        expect(canvas.width).toBe(LEVEL_WIDTH);
        expect(canvas.height).toBe(LEVEL_WIDTH);
        expect(display.width).toBeLessThan(LEVEL_WIDTH);
        expect(display.width).toBe(291);
    });
});
