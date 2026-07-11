/**
 * Initial load and level-switch loading overlay.
 * Enforces a minimum visible duration so the zoom + heartbeat animation is perceptible.
 */

import { announce, prefersReducedMotion } from './accessibility.js';

/** Minimum time the overlay stays up once shown (ms). */
export const LOADING_MIN_MS = 1500;

/** Shorter minimum when reduced motion is preferred (ms). */
export const LOADING_MIN_MS_REDUCED = 400;

/** Duration of the zoom-in animation (ms); should be ≤ LOADING_MIN_MS. */
export const LOADING_ZOOM_MS = 1400;

/** One heartbeat cycle at 60 bpm (ms). */
export const HEARTBEAT_CYCLE_MS = 1000;

/** Time to ease the pulse back to rest before fading (ms). */
export const HEARTBEAT_SETTLE_MS = 400;

let loadingShownAt = typeof window !== 'undefined' && window.__phantasmLoadingStart
    ? window.__phantasmLoadingStart
    : 0;
let hideTimer = null;
let zoomCompleteTimer = null;
let bootAnnounced = false;

/**
 * @returns {number}
 */
export function getLoadingMinDuration() {
    return prefersReducedMotion() ? LOADING_MIN_MS_REDUCED : LOADING_MIN_MS;
}

function getSkipLink() {
    return document.querySelector('.skip-link');
}

function setAppBusy(busy) {
    const value = String(busy);
    document.body.setAttribute('aria-busy', value);

    const container = document.querySelector('.container');
    if (container) {
        container.setAttribute('aria-busy', value);
    }
}

function disableSkipLink() {
    const skipLink = getSkipLink();
    if (!skipLink) return;

    skipLink.setAttribute('aria-hidden', 'true');
    skipLink.setAttribute('tabindex', '-1');
}

function enableSkipLink() {
    const skipLink = getSkipLink();
    if (!skipLink) return;

    skipLink.removeAttribute('aria-hidden');
    skipLink.removeAttribute('tabindex');
}

function focusPuzzleCanvas() {
    const canvas = document.getElementById('voronoiCanvas');
    if (canvas && typeof canvas.focus === 'function') {
        canvas.focus();
    }
}

function restartLoadingAnimation(overlay) {
    resetOverlayForShow(overlay);

    const zoom = overlay.querySelector('.loading-gradient-zoom');
    const heartbeat = overlay.querySelector('.loading-gradient-heartbeat');

    for (const el of [zoom, heartbeat]) {
        if (!el) continue;
        el.style.animation = 'none';
        el.style.transform = '';
        el.style.opacity = '';
        void el.offsetWidth;
        el.style.animation = '';
    }

    scheduleZoomComplete(overlay);
}

function resetZoomComplete(overlay) {
    if (zoomCompleteTimer) {
        clearTimeout(zoomCompleteTimer);
        zoomCompleteTimer = null;
    }
    overlay.classList.remove('zoom-complete');
}

function resetOverlayForShow(overlay) {
    resetZoomComplete(overlay);
    overlay.classList.remove('is-settling', 'is-fading-out');
}

function scheduleZoomComplete(overlay) {
    if (zoomCompleteTimer) {
        clearTimeout(zoomCompleteTimer);
        zoomCompleteTimer = null;
    }

    if (prefersReducedMotion()) {
        overlay.classList.add('zoom-complete');
        return;
    }

    const elapsed = performance.now() - loadingShownAt;
    const remaining = Math.max(0, LOADING_ZOOM_MS - elapsed);

    zoomCompleteTimer = setTimeout(() => {
        zoomCompleteTimer = null;
        overlay.classList.add('zoom-complete');
    }, remaining);
}

function waitForHeartbeatRest() {
    const restStart = HEARTBEAT_CYCLE_MS * 0.56;
    const phase = (performance.now() - loadingShownAt) % HEARTBEAT_CYCLE_MS;

    if (phase >= restStart) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        setTimeout(resolve, restStart - phase);
    });
}

async function settleHeartbeat(overlay) {
    const heartbeat = overlay.querySelector('.loading-gradient-heartbeat');
    if (!heartbeat) return;

    heartbeat.getAnimations?.().forEach((animation) => animation.cancel());

    if (typeof heartbeat.animate !== 'function') {
        heartbeat.style.animation = 'none';
        heartbeat.style.transform = 'scale(1)';
        heartbeat.style.opacity = '0.82';
        return;
    }

    const style = getComputedStyle(heartbeat);
    const fromOpacity = Number.parseFloat(style.opacity) || 0.82;
    const fromTransform = style.transform === 'none' ? 'scale(1)' : style.transform;

    overlay.classList.add('is-settling');

    try {
        await heartbeat.animate(
            [
                { transform: fromTransform, opacity: fromOpacity },
                { transform: 'scale(1)', opacity: 0.82 },
            ],
            { duration: HEARTBEAT_SETTLE_MS, easing: 'ease-out', fill: 'forwards' },
        ).finished;
    } catch {
        // Animation interrupted — fall through to rest state below.
    }

    heartbeat.style.animation = 'none';
    heartbeat.style.transform = 'scale(1)';
    heartbeat.style.opacity = '0.82';
}

/**
 * @param {{ message?: string, announce?: boolean }} [options]
 */
export function showLoadingOverlay(options = {}) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;

    const {
        message = 'Loading Phantasm',
        announce: shouldAnnounce = true,
    } = options;

    if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }

    loadingShownAt = performance.now();
    overlay.classList.remove('is-fading-out', 'is-settling');
    overlay.classList.add('visible');
    overlay.setAttribute('aria-busy', 'true');
    setAppBusy(true);
    disableSkipLink();
    restartLoadingAnimation(overlay);

    if (shouldAnnounce) {
        announce(message);
    }
}

/**
 * Hide the loading overlay after the minimum display time has elapsed.
 * @param {{ announceLoaded?: string | false, focusPuzzle?: boolean }} [options]
 * @returns {Promise<void>}
 */
export function hideLoadingOverlay(options = {}) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return Promise.resolve();

    const minDuration = getLoadingMinDuration();
    const elapsed = performance.now() - loadingShownAt;
    const remaining = Math.max(0, minDuration - elapsed);

    if (remaining > 0) {
        return new Promise((resolve) => {
            hideTimer = setTimeout(() => {
                hideTimer = null;
                finishHide(overlay, options).then(resolve);
            }, remaining);
        });
    }

    return finishHide(overlay, options);
}

/**
 * @param {HTMLElement} overlay
 * @param {{ announceLoaded?: string | false, focusPuzzle?: boolean }} options
 * @returns {Promise<void>}
 */
async function finishHide(overlay, options = {}) {
    const wasInitialLoad = document.body.classList.contains('is-app-loading');

    if (!prefersReducedMotion()) {
        await waitForHeartbeatRest();
        await settleHeartbeat(overlay);
    }

    resetZoomComplete(overlay);
    overlay.classList.remove('is-settling');
    overlay.classList.add('is-fading-out');
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-busy', 'false');
    document.body.classList.remove('is-app-loading');
    setAppBusy(false);
    enableSkipLink();

    if (options.focusPuzzle ?? wasInitialLoad) {
        focusPuzzleCanvas();
    }

    if (options.announceLoaded !== false) {
        const loaded = options.announceLoaded;
        if (typeof loaded === 'string') {
            announce(loaded);
        } else if (loaded && typeof loaded === 'object' && loaded.message) {
            announce(loaded.message, loaded.priority ?? 'polite');
        }
    }
}

function initBootAccessibility() {
    if (!document.body.classList.contains('is-app-loading')) {
        return;
    }

    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;

    setAppBusy(true);
    disableSkipLink();
    scheduleZoomComplete(overlay);

    if (!bootAnnounced) {
        bootAnnounced = true;
        announce('Loading Phantasm');
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBootAccessibility);
    } else {
        initBootAccessibility();
    }
}
