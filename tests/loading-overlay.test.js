import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    LOADING_MIN_MS,
    LOADING_MIN_MS_REDUCED,
    getLoadingMinDuration,
    hideLoadingOverlay,
    showLoadingOverlay,
} from '../js/loading-overlay.js';

vi.mock('../js/accessibility.js', () => ({
    announce: vi.fn(),
    prefersReducedMotion: vi.fn(() => false),
}));

import { announce, prefersReducedMotion } from '../js/accessibility.js';

describe('loading overlay', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <a class="skip-link" href="#voronoiCanvas">Skip to puzzle</a>
            <div id="a11yLiveRegion"></div>
            <div id="loadingOverlay" class="loading-overlay">
                <div class="loading-gradient-zoom">
                    <svg class="loading-gradient-heartbeat"></svg>
                </div>
            </div>
            <div class="container">
                <canvas id="voronoiCanvas" tabindex="0"></canvas>
            </div>
        `;
        vi.mocked(prefersReducedMotion).mockReturnValue(false);
        vi.mocked(announce).mockClear();
        vi.useFakeTimers();
        let now = 1000;
        vi.spyOn(performance, 'now').mockImplementation(() => now);
        global.advanceNow = (ms) => {
            now += ms;
        };
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('shows the overlay and marks the app busy', () => {
        showLoadingOverlay();

        const overlay = document.getElementById('loadingOverlay');
        expect(overlay.classList.contains('visible')).toBe(true);
        expect(overlay.getAttribute('aria-busy')).toBe('true');
        expect(document.body.getAttribute('aria-busy')).toBe('true');
        expect(document.querySelector('.container').getAttribute('aria-busy')).toBe('true');
        expect(announce).toHaveBeenCalledWith('Loading Phantasm');
    });

    it('announces custom loading messages', () => {
        showLoadingOverlay({ message: 'Loading Level 2' });

        expect(announce).toHaveBeenCalledWith('Loading Level 2');
    });

    it('disables the skip link while loading', () => {
        showLoadingOverlay();

        const skipLink = document.querySelector('.skip-link');
        expect(skipLink.getAttribute('aria-hidden')).toBe('true');
        expect(skipLink.getAttribute('tabindex')).toBe('-1');
    });

    it('waits for the minimum duration before hiding', async () => {
        showLoadingOverlay();

        const hidePromise = hideLoadingOverlay({ announceLoaded: false });
        const overlay = document.getElementById('loadingOverlay');
        expect(overlay.classList.contains('visible')).toBe(true);

        global.advanceNow(LOADING_MIN_MS - 1);
        await vi.advanceTimersByTimeAsync(LOADING_MIN_MS - 1);
        expect(overlay.classList.contains('visible')).toBe(true);

        global.advanceNow(1);
        await vi.advanceTimersByTimeAsync(1);
        await hidePromise;

        expect(overlay.classList.contains('visible')).toBe(false);
        expect(overlay.getAttribute('aria-busy')).toBe('false');
    });

    it('uses a shorter minimum duration when reduced motion is preferred', async () => {
        vi.mocked(prefersReducedMotion).mockReturnValue(true);
        expect(getLoadingMinDuration()).toBe(LOADING_MIN_MS_REDUCED);

        showLoadingOverlay();
        const hidePromise = hideLoadingOverlay({ announceLoaded: false });

        global.advanceNow(LOADING_MIN_MS_REDUCED - 1);
        await vi.advanceTimersByTimeAsync(LOADING_MIN_MS_REDUCED - 1);
        expect(document.getElementById('loadingOverlay').classList.contains('visible')).toBe(true);

        global.advanceNow(1);
        await vi.advanceTimersByTimeAsync(1);
        await hidePromise;

        expect(document.getElementById('loadingOverlay').classList.contains('visible')).toBe(false);
    });

    it('reveals the app, restores skip link, and focuses the puzzle on initial hide', async () => {
        document.body.classList.add('is-app-loading');
        const canvas = document.getElementById('voronoiCanvas');
        const focusSpy = vi.spyOn(canvas, 'focus');

        showLoadingOverlay({ announce: false });
        global.advanceNow(LOADING_MIN_MS);

        await hideLoadingOverlay({ announceLoaded: 'Phantasm puzzle loaded.' });

        expect(document.body.classList.contains('is-app-loading')).toBe(false);
        expect(document.body.getAttribute('aria-busy')).toBe('false');
        expect(document.querySelector('.skip-link').hasAttribute('aria-hidden')).toBe(false);
        expect(focusSpy).toHaveBeenCalled();
        expect(announce).toHaveBeenCalledWith('Phantasm puzzle loaded.');
    });
});
