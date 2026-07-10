/**
 * Responsive stage sizing for the puzzle canvas.
 *
 * - Display size scales to fit the viewport (fixed 1:1 level aspect ratio, max width).
 * - Logical canvas pixels are locked for the session so mid-game resize preserves state.
 * - Pointer input maps through CSS scale via CoordinateUtils.normalizeMouseCoordinates.
 */

import {
    LEVEL_ASPECT_RATIO,
    STAGE_GLOW_PADDING,
    STAGE_HORIZONTAL_PADDING,
    STAGE_MAX_WIDTH,
    STAGE_MIN_HEIGHT,
    STAGE_MIN_WIDTH,
    STAGE_VERTICAL_CHROME,
} from './stage-constants.js';

/**
 * @param {{ width: number, height: number }} viewport
 * @param {object} [options]
 * @returns {{ width: number, height: number }}
 */
export function calculateDisplaySize(viewport, options = {}) {
    const aspectRatio = options.aspectRatio ?? LEVEL_ASPECT_RATIO;
    const maxWidth = options.maxWidth ?? STAGE_MAX_WIDTH;
    const minWidth = options.minWidth ?? STAGE_MIN_WIDTH;
    const minHeight = options.minHeight ?? STAGE_MIN_HEIGHT;
    const horizontalPadding = options.horizontalPadding ?? STAGE_HORIZONTAL_PADDING;
    const verticalChrome = options.verticalChrome ?? STAGE_VERTICAL_CHROME;

    const availableWidth = Math.max(
        0,
        options.availableWidth ?? viewport.width - horizontalPadding,
    );
    const availableHeight = Math.max(
        0,
        options.availableHeight ?? viewport.height - verticalChrome,
    );

    let width = Math.min(availableWidth, maxWidth);
    let height = width / aspectRatio;

    if (height > availableHeight) {
        height = availableHeight;
        width = height * aspectRatio;
    }

    if (width < minWidth && availableWidth >= minWidth) {
        width = minWidth;
        height = width / aspectRatio;
        if (height > availableHeight) {
            height = Math.max(minHeight, availableHeight);
            width = height * aspectRatio;
        }
    }

    width = Math.floor(Math.max(1, Math.min(width, availableWidth || width)));
    height = Math.floor(Math.max(1, width / aspectRatio));

    return { width, height };
}

/**
 * @returns {{ width: number, height: number }}
 */
export function getViewportSize() {
    if (typeof window === 'undefined') {
        return { width: 1024, height: 768 };
    }

    return {
        width: window.innerWidth,
        height: window.innerHeight,
    };
}

class ResponsiveCanvas {
    constructor() {
        /** @type {{ width: number, height: number } | null} */
        this.logicalSize = null;
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @returns {HTMLElement | null}
     */
    getStageElement(canvas) {
        return canvas?.closest('.stage') ?? null;
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @returns {{ width: number, height: number }}
     */
    getAvailableBounds(canvas) {
        const glowInset = STAGE_GLOW_PADDING * 2;
        const container = canvas?.closest('.puzzle-container');
        if (container) {
            const rect = container.getBoundingClientRect();
            return {
                width: Math.max(0, Math.floor(rect.width) - glowInset),
                height: Math.max(0, Math.floor(rect.height) - glowInset),
            };
        }

        const viewport = getViewportSize();
        return {
            width: Math.max(0, viewport.width - STAGE_HORIZONTAL_PADDING - glowInset),
            height: Math.max(0, viewport.height - STAGE_VERTICAL_CHROME - glowInset),
        };
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @returns {{ width: number, height: number }}
     */
    computeDisplaySize(canvas) {
        const bounds = this.getAvailableBounds(canvas);
        return calculateDisplaySize(getViewportSize(), {
            availableWidth: bounds.width,
            availableHeight: bounds.height,
        });
    }

    /**
     * Lock logical resolution and apply display sizing.
     * @param {HTMLCanvasElement} canvas
     * @param {{ resetLogical?: boolean }} [options]
     * @returns {{ logical: { width: number, height: number }, display: { width: number, height: number } }}
     */
    setupStage(canvas, options = {}) {
        const displaySize = this.computeDisplaySize(canvas);

        if (options.resetLogical || !this.logicalSize) {
            this.logicalSize = { ...displaySize };
        }

        canvas.width = this.logicalSize.width;
        canvas.height = this.logicalSize.height;

        this.applyDisplaySize(canvas, displaySize);

        return {
            logical: { ...this.logicalSize },
            display: { ...displaySize },
        };
    }

    /**
     * @param {HTMLCanvasElement} canvas
     */
    setupResponsiveCanvas(canvas, options = {}) {
        return this.setupStage(canvas, options);
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {{ width: number, height: number }} displaySize
     */
    applyDisplaySize(canvas, displaySize) {
        const stage = this.getStageElement(canvas);
        if (stage) {
            stage.style.width = `${displaySize.width}px`;
            stage.style.height = `${displaySize.height}px`;
        }
    }

    /**
     * Update display size on viewport change without touching logical coordinates.
     * @param {HTMLCanvasElement} canvas
     */
    handleViewportResize(canvas) {
        if (!canvas) return;

        const displaySize = this.computeDisplaySize(canvas);
        this.applyDisplaySize(canvas, displaySize);
    }

    resetLogicalSize() {
        this.logicalSize = null;
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @returns {{ width: number, height: number }}
     */
    getCanvasSize(canvas) {
        return {
            width: canvas.width,
            height: canvas.height,
        };
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @returns {{ scaleX: number, scaleY: number }}
     */
    getCanvasScale(canvas) {
        const rect = canvas.getBoundingClientRect();
        return {
            scaleX: canvas.width / rect.width,
            scaleY: canvas.height / rect.height,
        };
    }
}

const responsiveCanvas = new ResponsiveCanvas();

window.responsiveCanvas = responsiveCanvas;
window.ResponsiveCanvas = ResponsiveCanvas;

export { ResponsiveCanvas, responsiveCanvas };
