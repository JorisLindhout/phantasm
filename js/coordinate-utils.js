/**
 * Pointer → canvas coordinate helpers.
 *
 * Puzzle logic and meshes use the same screen-space axes as the canvas
 * (Y increases downward). Mouse events are scaled from CSS pixels to the
 * canvas's internal resolution; no Y-flip is applied.
 */

export class CoordinateUtils {
    /**
     * Normalize a mouse/pointer event to canvas-internal coordinates.
     * @param {MouseEvent|PointerEvent} mouseEvent
     * @param {HTMLCanvasElement} canvas
     * @returns {{ x: number, y: number }}
     */
    static normalizeMouseCoordinates(mouseEvent, canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (mouseEvent.clientX - rect.left) * scaleX,
            y: (mouseEvent.clientY - rect.top) * scaleY,
        };
    }
}
