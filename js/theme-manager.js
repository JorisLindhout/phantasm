/**
 * Theme Manager - Handles dynamic theme switching
 * Updates both CSS variables and WebGL renderer colors
 */

import { THEMES, DEFAULT_THEME, ThemeUtils, UNSOLVED_STAGE_GLOW, UNSOLVED_STAGE_GLOW_ALPHA } from './theme.js';
import { createLogger } from './logger.js';

const log = createLogger('theme');

class ThemeManager {
    constructor() {
        this.currentTheme = DEFAULT_THEME;
        this.webglRenderer = null;
        this.subscribers = new Set();
    }

    /**
     * Initialize theme manager with WebGL renderer reference
     */
    init(webglRenderer = null) {
        this.webglRenderer = webglRenderer;
        this.applyTheme(DEFAULT_THEME.name);
    }

    /**
     * Attach a WebGL renderer without resetting the active theme.
     */
    setWebGLRenderer(webglRenderer) {
        this.webglRenderer = webglRenderer;
        this.syncRendererTheme(webglRenderer);
    }

    /**
     * Push the active theme onto a WebGL renderer before outlines/meshes are built.
     * @param {import('./webgl-renderer.js').WebGLVoronoiRenderer | null} [renderer]
     */
    syncRendererTheme(renderer = this.webglRenderer) {
        if (!renderer?.updateTheme || !this.currentTheme) {
            return;
        }

        renderer.updateTheme(this.currentTheme);
    }

    /**
     * Subscribe to theme changes
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    /**
     * Notify all subscribers of theme change
     */
    notifySubscribers(theme) {
        this.subscribers.forEach(callback => {
            try {
                callback(theme);
            } catch (error) {
                log.error('Theme subscriber error:', error);
            }
        });
    }

    /**
     * Apply theme by name
     */
    applyTheme(themeName) {
        const theme = ThemeUtils.getTheme(themeName);
        if (!theme) {
            log.error(`Theme "${themeName}" not found`);
            return false;
        }

        this.currentTheme = theme;
        this.updateCSSVariables(theme);
        this.updateWebGLColors(theme);
        this.notifySubscribers(theme);
        
        return true;
    }

    /**
     * Update CSS custom properties
     */
    updateCSSVariables(theme) {
        const root = document.documentElement;
        const colors = theme.colors;
        const effects = theme.effects;

        // Core colors
        root.style.setProperty('--primary-color', colors.primary.css);

        // UI colors (consistent across all themes)
        root.style.setProperty('--background-color', '#111111');
        root.style.setProperty('--canvas-background', '#111111');
        root.style.setProperty('--text-color', '#ffffff');
        root.style.setProperty('--text-muted', '#888888');
        
        // Control colors (consistent across all themes)
        root.style.setProperty('--control-hover', '#00B8E6');
        root.style.setProperty('--control-bg', 'rgba(17, 17, 17, 0.95)');
        
        // Controls-drawer specific colors (always use phantasm theme)
        const phantasmTheme = THEMES.phantasm;
        root.style.setProperty('--controls-primary-color', phantasmTheme.colors.primary.css);
        root.style.setProperty('--controls-piece-hover', phantasmTheme.colors.pieceHover.css);
        root.style.setProperty('--controls-piece-border-hover', ThemeUtils.getColorWithAlpha(phantasmTheme.colors.pieceHover, 0.6));

        // Cell border (dev panel / controls)
        root.style.setProperty('--cell-border', ThemeUtils.getColorWithAlpha(colors.pieceNormal, 0.2));

        // Solved state colors
        root.style.setProperty('--solved-color', colors.solved.css);
        root.style.setProperty('--solved-glow', colors.solvedGlow.rgba);

        // Unsolved stage frame (global, not per-level)
        root.style.setProperty(
            '--stage-glow',
            ThemeUtils.getColorWithAlpha(UNSOLVED_STAGE_GLOW, UNSOLVED_STAGE_GLOW_ALPHA),
        );

        if (theme.levelGradient) {
            const { gradientStart, gradientEnd, angle } = theme.levelGradient;
            root.style.setProperty('--level-gradient-angle', angle);
            root.style.setProperty('--level-gradient-start', gradientStart.css);
            root.style.setProperty('--level-gradient-end', gradientEnd.css);
            root.style.setProperty(
                '--level-gradient',
                `linear-gradient(${angle}, ${gradientStart.css}, ${gradientEnd.css})`,
            );
        }

        // Effects
        root.style.setProperty('--transition-speed', `${effects.animationSpeed}s`);

        // Border radius (consistent across all themes)
        root.style.setProperty('--border-radius', '12px');
        root.style.setProperty('--border-radius-small', '4px');
    }

    /**
     * Update WebGL renderer colors if available
     */
    updateWebGLColors(theme) {
        if (!this.webglRenderer || typeof this.webglRenderer.updateTheme !== 'function') {
            return;
        }

        try {
            if (this.webglRenderer && typeof this.webglRenderer.updateTheme === 'function') {
                this.webglRenderer.updateTheme(theme);
            }
        } catch (error) {
            log.error('Error updating WebGL theme:', error);
        }
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Get current theme's base image
     */
    getCurrentBaseImage() {
        return this.currentTheme.baseImage || null;
    }

    /**
     * Get available themes
     */
    getAvailableThemes() {
        return ThemeUtils.getThemeNames().map(name => ({
            name,
            displayName: THEMES[name].name
        }));
    }

    /**
     * Create theme selector UI element - REMOVED (dev tools only)
     * Use console: themeManager.setTheme('themeName') instead
     */

    /**
     * Apply theme by name (console / level switching).
     * Themes are driven by levels; no separate theme preference is persisted.
     */
    setTheme(themeName) {
        this.applyTheme(themeName);
    }
}

// Export singleton instance
export const themeManager = new ThemeManager();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.themeManager = themeManager;
}
