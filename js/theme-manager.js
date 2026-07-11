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

        // Piece colors
        root.style.setProperty('--piece-border', ThemeUtils.getColorWithAlpha(colors.pieceNormal, 0.3));
        root.style.setProperty('--piece-border-hover', ThemeUtils.getColorWithAlpha(colors.pieceHover, 0.6));
        root.style.setProperty('--piece-shadow-hover', `0 0 10px ${ThemeUtils.getColorWithAlpha(colors.pieceHover, 0.3)}`);
        root.style.setProperty('--piece-shadow-drag', `0 10px 30px ${ThemeUtils.getColorWithAlpha(colors.pieceDragging, 0.5)}`);
        
        // Cell border colors
        root.style.setProperty('--cell-border', ThemeUtils.getColorWithAlpha(colors.pieceNormal, 0.2));
        root.style.setProperty('--cell-border-animated', ThemeUtils.getColorWithAlpha(colors.pieceHover, 0.4));

        // Snap colors
        root.style.setProperty('--snap-highlight-bg', ThemeUtils.getColorWithAlpha(colors.pieceSnapped, 0.3));
        root.style.setProperty('--snap-highlight-border', colors.pieceSnapped.css);
        
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
        root.style.setProperty('--pulse-duration', `${effects.pulseSpeed}s`);

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
     * Save theme preference to localStorage
     */
    saveThemePreference(themeName) {
        try {
            localStorage.setItem('phantasm-theme', themeName);
        } catch (error) {
            log.warn('Could not save theme preference:', error);
        }
    }

    /**
     * Load theme preference from localStorage
     */
    loadThemePreference() {
        try {
            const saved = localStorage.getItem('phantasm-theme');
            if (saved && THEMES[saved]) {
                this.applyTheme(saved);
                return saved;
            }
        } catch (error) {
            log.warn('Could not load theme preference:', error);
        }
        return this.currentTheme.name;
    }

    /**
     * Apply theme and save preference
     */
    setTheme(themeName) {
        if (this.applyTheme(themeName)) {
            this.saveThemePreference(themeName);
        }
    }
}

// Export singleton instance
export const themeManager = new ThemeManager();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.themeManager = themeManager;
}
