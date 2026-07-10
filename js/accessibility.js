/**
 * Accessibility helpers
 */

/**
 * @returns {boolean}
 */
export function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Announce a message to screen readers via the live region.
 * @param {string} message
 * @param {'polite' | 'assertive'} [priority='polite']
 */
export function announce(message, priority = 'polite') {
    const region = document.getElementById('a11yLiveRegion');
    if (!region) return;

    region.setAttribute('aria-live', priority);
    region.textContent = '';

    // Force screen readers to notice the change
    requestAnimationFrame(() => {
        region.textContent = message;
    });
}

/**
 * Update aria-valuetext on range inputs when values change.
 * @param {HTMLInputElement} input
 * @param {string} valueText
 */
export function updateRangeAriaValue(input, valueText) {
    if (!input) return;
    input.setAttribute('aria-valuetext', valueText);
}

/**
 * @param {HTMLElement} drawer
 * @param {HTMLElement} toggle
 */
export function setDrawerExpanded(drawer, toggle, isOpen) {
    toggle.setAttribute('aria-expanded', String(isOpen));
    drawer.setAttribute('aria-hidden', String(!isOpen));
}

/**
 * Returns renderer reference for debug utilities.
 * @returns {object|null}
 */
export function getWebGLRenderer() {
    return window.voronoiPuzzle?.webglRenderer ?? null;
}

if (typeof window !== 'undefined') {
    window.prefersReducedMotion = prefersReducedMotion;
    window.announce = announce;
    window.getWebGLRenderer = getWebGLRenderer;
}
