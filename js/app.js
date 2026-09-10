/**
 * Phantasm application entry point (Vite bundle)
 */
import * as THREE from 'three';
import { Delaunay } from 'd3-delaunay';

import { themeManager } from './theme-manager.js';
import { levelManager } from './level-manager.js';
import { pieceReleaseManager } from './piece-release-manager.js';
import { levelTransitionManager } from './level-transition.js';
import { isDevPanelEnabled, applyDevPanelVisibility } from './dev-panel.js';
import { prefersReducedMotion, announce, updateRangeAriaValue, setDrawerExpanded } from './accessibility.js';
import { configureLegacyColorPipeline } from './three-config.js';
import { createLogger } from './logger.js';
import { showLoadingOverlay, hideLoadingOverlay } from './loading-overlay.js';
import { unlockAndStartBed } from './drone-sound.js';

const log = createLogger('app');

configureLegacyColorPipeline();

import './utils.js';
import './base.js';
import './responsive-canvas.js';
import './webgl-renderer.js';
import { VoronoiPuzzle } from './main.js';

window.THREE = THREE;
window.Delaunay = Delaunay;
window.d3 = { Delaunay: { from: Delaunay.from.bind(Delaunay) } };

function updateAnimationButtonLabel(isAnimating) {
    const button = document.querySelector('[data-action="toggle-animation"]');
    if (button) {
        button.textContent = isAnimating ? 'Pause Animation' : 'Start Animation';
    }
}

function debounce(fn, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
    };
}

function setupControlHandlers() {
    if (!isDevPanelEnabled()) {
        return;
    }

    document.querySelector('[data-action="regenerate"]')?.addEventListener('click', () => {
        window.voronoiPuzzle?.regeneratePuzzle();
    });

    document.querySelector('[data-action="toggle-animation"]')?.addEventListener('click', () => {
        window.voronoiPuzzle?.toggleAnimation();
        updateAnimationButtonLabel(window.voronoiPuzzle?.config?.isAnimating ?? true);
    });

    document.querySelector('[data-action="toggle-grid-outlines"]')?.addEventListener('click', () => {
        const renderer = window.voronoiPuzzle?.webglRenderer;
        if (renderer?.toggleGridOutlines) {
            renderer.toggleGridOutlines();
        }
    });

    document.getElementById('drawerToggle')?.addEventListener('click', toggleDrawer);

    document.getElementById('levelSelector')?.addEventListener('change', async (event) => {
        const selectedLevel = event.target.value;
        if (window.levelManager) {
            await window.levelManager.setLevel(selectedLevel);
        }
    });
}

function setupViewportHandlers() {
    const handleStageResize = debounce(() => {
        const canvas = document.getElementById('voronoiCanvas');
        window.responsiveCanvas?.handleViewportResize(canvas);
    }, 150);

    window.addEventListener('resize', handleStageResize);
}

function toggleDrawer() {
    const drawer = document.getElementById('controlsDrawer');
    const toggle = document.getElementById('drawerToggle');
    const caret = toggle?.querySelector('.caret-icon');
    if (!drawer || !toggle) return;

    const isOpen = drawer.classList.toggle('open');
    setDrawerExpanded(drawer, toggle, isOpen);

    if (caret) {
        caret.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    }

    if (isOpen) {
        toggle.focus();
    }
}

function bindRangeAccessibility() {
    if (!isDevPanelEnabled()) {
        return;
    }

    const bindings = [
        ['cellCount', 'cellCountValue'],
        ['animationSpeed', 'animationSpeedValue'],
        ['noiseAmplitude', 'noiseAmplitudeValue'],
        ['morphInterval', 'morphIntervalValue'],
        ['morphCornerCount', 'morphCornerCountValue'],
    ];

    bindings.forEach(([inputId, valueId]) => {
        const input = document.getElementById(inputId);
        const valueEl = document.getElementById(valueId);
        if (!input || !valueEl) return;

        const sync = () => updateRangeAriaValue(input, valueEl.textContent);
        input.addEventListener('input', sync);
        sync();
    });
}

async function initializeApp() {
    applyDevPanelVisibility();

    if (import.meta.env.DEV) {
        await import('./debug-utils.js');
    }

    if (typeof VoronoiPuzzle === 'undefined') {
        log.error('VoronoiPuzzle class not found.');
        await hideLoadingOverlay({
            announceLoaded: { message: 'Failed to load puzzle.', priority: 'assertive' },
            focusPuzzle: false,
        });
        return;
    }

    try {
        window.themeManager = themeManager;
        themeManager.init(null);

        window.levelManager = levelManager;
        levelManager.prepareForStartup();

        window.levelTransitionManager = levelTransitionManager;
        levelTransitionManager.init();

        window.pieceReleaseManager = pieceReleaseManager;
        pieceReleaseManager.bindButton();

        window.voronoiPuzzle = new VoronoiPuzzle();
        await window.voronoiPuzzle.start();

        if (prefersReducedMotion()) {
            announce('Animations reduced based on your system settings.');
        }

        themeManager.setWebGLRenderer(window.voronoiPuzzle?.webglRenderer);
        levelManager.init(window.voronoiPuzzle);

        bindRangeAccessibility();
        setupControlHandlers();
        setupViewportHandlers();
        updateAnimationButtonLabel(window.voronoiPuzzle.config.isAnimating);

        await hideLoadingOverlay({ announceLoaded: 'Phantasm puzzle loaded.' });

        const armBed = () => unlockAndStartBed();
        window.addEventListener('pointerdown', armBed, { once: true });
        window.addEventListener('keydown', armBed, { once: true });
    } catch (error) {
        log.error('Failed to initialize Phantasm:', error);
        await hideLoadingOverlay({
            announceLoaded: { message: 'Failed to load puzzle.', priority: 'assertive' },
            focusPuzzle: false,
        });
    }
}

function boot() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }
}

boot();

export {
    VoronoiPuzzle,
    themeManager,
    levelManager,
    levelTransitionManager,
    toggleDrawer,
};
