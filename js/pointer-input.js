/**
 * Unified pointer / touch input helpers for puzzle interaction.
 *
 * Production touch requirements:
 * - Prefer Pointer Events (mouse + pen + touch in one path, pointer capture, cancel).
 * - Track a single active pointer / touch id (ignore multi-touch).
 * - Use changedTouches on touchend / touchcancel for the final release position.
 * - Fall back to mouse + touch listeners when Pointer Events are unavailable.
 */

/** @returns {boolean} */
export function supportsPointerEvents() {
    return typeof window !== 'undefined' && 'PointerEvent' in window;
}

/**
 * Tracks the pointer id that owns the current gesture.
 */
export class ActivePointerTracker {
    constructor() {
        /** @type {number | null} */
        this.id = null;
    }

    /** @param {number} pointerId */
    claim(pointerId) {
        this.id = pointerId;
    }

    release() {
        this.id = null;
    }

    /**
     * @param {{ pointerId: number }} event
     * @returns {boolean}
     */
    shouldHandle(event) {
        return this.id === null || event.pointerId === this.id;
    }

    /**
     * @param {{ pointerId: number }} event
     * @returns {boolean}
     */
    isOwner(event) {
        return this.id !== null && event.pointerId === this.id;
    }
}

/**
 * Tracks the touch identifier for legacy touch listeners.
 */
export class ActiveTouchTracker {
    constructor() {
        /** @type {number | null} */
        this.identifier = null;
    }

    /** @param {number} identifier */
    claim(identifier) {
        this.identifier = identifier;
    }

    release() {
        this.identifier = null;
    }

    /**
     * @param {TouchList} touches
     * @returns {Touch | null}
     */
    findTouch(touches) {
        if (this.identifier === null) {
            return touches.length > 0 ? touches[0] : null;
        }

        for (let i = 0; i < touches.length; i++) {
            if (touches[i].identifier === this.identifier) {
                return touches[i];
            }
        }

        return null;
    }

    /**
     * @param {TouchList} changedTouches
     * @returns {Touch | null}
     */
    findChangedTouch(changedTouches) {
        if (this.identifier === null) {
            return changedTouches.length > 0 ? changedTouches[0] : null;
        }

        for (let i = 0; i < changedTouches.length; i++) {
            if (changedTouches[i].identifier === this.identifier) {
                return changedTouches[i];
            }
        }

        return null;
    }
}

/**
 * @param {PointerEvent} event
 * @returns {boolean}
 */
export function isPrimaryMouseButton(event) {
    return event.pointerType !== 'mouse' || event.button === 0;
}

/**
 * @param {TouchEvent} event
 * @param {ActiveTouchTracker} tracker
 * @returns {Touch | null}
 */
export function getTouchMovePoint(event, tracker) {
    return tracker.findTouch(event.touches);
}

/**
 * @param {TouchEvent} event
 * @param {ActiveTouchTracker} tracker
 * @returns {Touch | null}
 */
export function getTouchEndPoint(event, tracker) {
    return tracker.findChangedTouch(event.changedTouches);
}

/**
 * Copy accessibility attributes from the hidden 2D canvas to the WebGL interaction surface.
 * @param {HTMLCanvasElement} sourceCanvas
 * @param {HTMLCanvasElement} targetCanvas
 */
export function configureInteractionSurface(sourceCanvas, targetCanvas) {
    if (!sourceCanvas || !targetCanvas) return;

    const label = sourceCanvas.getAttribute('aria-label');
    if (label) {
        targetCanvas.setAttribute('aria-label', label);
    }

    if (sourceCanvas.hasAttribute('tabindex')) {
        targetCanvas.setAttribute('tabindex', sourceCanvas.getAttribute('tabindex') || '0');
    } else {
        targetCanvas.setAttribute('tabindex', '0');
    }

    targetCanvas.setAttribute('role', sourceCanvas.getAttribute('role') || 'img');
    targetCanvas.id = 'puzzleCanvas';

    sourceCanvas.setAttribute('aria-hidden', 'true');
    sourceCanvas.setAttribute('tabindex', '-1');
}
