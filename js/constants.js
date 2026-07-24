/** Shared application constants */

export const SNAP_THRESHOLD = 30;
export const WEBGL_SNAP_THRESHOLD = 25;
export const SOLVE_THRESHOLD = 10;
export const MAX_CELL_COUNT = 80;
export const MIN_CELL_COUNT = 5;
export const DEFAULT_CELL_COUNT = 40;

export const GLOW_LAYER_CONFIGS = [
    { scale: 1.0, opacity: 1.0, zOffset: 0.01 },
    { scale: 1.01, opacity: 0.8, zOffset: 0.02 },
    { scale: 1.02, opacity: 0.6, zOffset: 0.03 },
    { scale: 1.04, opacity: 0.4, zOffset: 0.04 },
    { scale: 1.06, opacity: 0.3, zOffset: 0.05 },
    { scale: 1.08, opacity: 0.25, zOffset: 0.06 },
    { scale: 1.10, opacity: 0.2, zOffset: 0.07 },
    { scale: 1.12, opacity: 0.15, zOffset: 0.08 },
    { scale: 1.15, opacity: 0.1, zOffset: 0.09 },
    { scale: 1.18, opacity: 0.05, zOffset: 0.10 },
];

/** Duration of the snap-in-place edge glow flash (ms). */
export const SNAP_GLOW_DURATION_MS = 400;

export const OUTLINE_OPACITY = {
    normal: 0.8,
    hover: 1.0,
    dragging: 1.0,
    snapped: 1.0,
};
