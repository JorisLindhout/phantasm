/**
 * Stage layout constants derived from level SVG assets (450×450).
 */

export const LEVEL_WIDTH = 450;
export const LEVEL_HEIGHT = 450;
export const LEVEL_ASPECT_RATIO = LEVEL_WIDTH / LEVEL_HEIGHT;

/** Maximum display width for the puzzle stage (logical pixels cap at init). */
export const STAGE_MAX_WIDTH = 1200;

/** Smallest playable display width on narrow viewports. */
export const STAGE_MIN_WIDTH = 280;

export const STAGE_MIN_HEIGHT = Math.floor(STAGE_MIN_WIDTH / LEVEL_ASPECT_RATIO);

/** Horizontal padding budget when fitting the stage to the viewport. */
export const STAGE_HORIZONTAL_PADDING = 40;

/** Vertical chrome (drawer toggle, safe area) subtracted from viewport height. */
export const STAGE_VERTICAL_CHROME = 80;

/**
 * Inset around the stage so the solved-state glow (up to 40px blur) is never clipped.
 * Applied on all sides when fitting the stage inside the puzzle container.
 */
export const STAGE_GLOW_PADDING = 48;

/** Viewports below this width use tighter layout padding (iPhone 8 portrait = 375). */
export const NARROW_VIEWPORT_BREAKPOINT = 400;

/** Horizontal padding budget on narrow viewports. */
export const STAGE_HORIZONTAL_PADDING_NARROW = 24;

/** Glow inset on narrow viewports (still clears 40px solved-state blur). */
export const STAGE_GLOW_PADDING_NARROW = 32;

/**
 * @param {number} viewportWidth
 * @returns {boolean}
 */
export function isNarrowViewport(viewportWidth) {
    return viewportWidth < NARROW_VIEWPORT_BREAKPOINT;
}

/**
 * @param {number} viewportWidth
 * @returns {number}
 */
export function getStageHorizontalPadding(viewportWidth) {
    return isNarrowViewport(viewportWidth)
        ? STAGE_HORIZONTAL_PADDING_NARROW
        : STAGE_HORIZONTAL_PADDING;
}

/**
 * @param {number} viewportWidth
 * @returns {number}
 */
export function getStageGlowPadding(viewportWidth) {
    return isNarrowViewport(viewportWidth) ? STAGE_GLOW_PADDING_NARROW : STAGE_GLOW_PADDING;
}
