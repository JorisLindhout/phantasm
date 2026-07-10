/**
 * Phantasm application entry point (Vite bundle)
 */
import * as THREE from 'three';
import { Delaunay } from 'd3-delaunay';

import { themeManager } from './theme-manager.js';
import { levelManager } from './level-manager.js';
import { prefersReducedMotion, announce, updateRangeAriaValue, setDrawerExpanded } from './accessibility.js';
import { configureLegacyColorPipeline } from './three-config.js';

configureLegacyColorPipeline();

import './noise.js';
import './utils.js';
import './base.js';
import './coordinate-utils.js';
import './position-manager.js';
import './responsive-canvas.js';
import './webgl-renderer.js';
import { VoronoiPuzzle } from './main.js';

window.THREE = THREE;
window.Delaunay = Delaunay;
window.d3 = { Delaunay: { from: Delaunay.from.bind(Delaunay) } };

function showLoadingOverlay() {
    document.getElementById('loadingOverlay')?.classList.add('visible');
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay')?.classList.remove('visible');
}

function updateAnimationButtonLabel(isAnimating) {
    const button = document.querySelector('[data-action="toggle-animation"]');
    if (button) {
        button.textContent = isAnimating ? 'Pause Animation' : 'Start Animation';
    }
}

function setupControlHandlers() {
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

    document.querySelector('[data-action="toggle-responsive-canvas"]')?.addEventListener('click', () => {
        if (window.responsiveCanvas && window.voronoiPuzzle) {
            const currentMode = window.responsiveCanvas.isResponsive;
            window.responsiveCanvas.setResponsiveMode(!currentMode);
            window.voronoiPuzzle.currentRenderer?.setupCanvas();
            window.voronoiPuzzle.regeneratePuzzle();
        }
    });

    document.getElementById('drawerToggle')?.addEventListener('click', toggleDrawer);

    document.getElementById('levelSelector')?.addEventListener('change', async (event) => {
        const selectedLevel = event.target.value;
        if (window.levelManager) {
            await window.levelManager.setLevel(selectedLevel);
        }
    });

    window.addEventListener('resize', () => {
        window.responsiveCanvas?.handleViewportResize();
    });
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
    const bindings = [
        ['cellCount', 'cellCountValue'],
        ['animationSpeed', 'animationSpeedValue'],
        ['noiseAmplitude', 'noiseAmplitudeValue'],
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
    if (import.meta.env.DEV) {
        await import('./debug-utils.js');
    }

    showLoadingOverlay();

    if (typeof VoronoiPuzzle === 'undefined') {
        console.error('VoronoiPuzzle class not found.');
        hideLoadingOverlay();
        return;
    }

    try {
        window.voronoiPuzzle = new VoronoiPuzzle();
        await window.voronoiPuzzle.start();

        if (prefersReducedMotion()) {
            announce('Animations reduced based on your system settings.');
        }

        themeManager.init(window.voronoiPuzzle?.webglRenderer);
        themeManager.loadThemePreference();
        window.themeManager = themeManager;

        levelManager.init(window.voronoiPuzzle);
        window.levelManager = levelManager;

        bindRangeAccessibility();
        setupControlHandlers();
        updateAnimationButtonLabel(window.voronoiPuzzle.config.isAnimating);

        window.voronoiPuzzle.hideLoadingScreen?.();
        announce('Phantasm puzzle loaded.');
    } catch (error) {
        console.error('Failed to initialize Phantasm:', error);
        hideLoadingOverlay();
        announce('Failed to load puzzle.', 'assertive');
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
    toggleDrawer,
};
