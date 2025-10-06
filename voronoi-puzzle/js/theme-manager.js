/**
 * Theme Manager - Handles dynamic theme switching
 * Updates both CSS variables and WebGL renderer colors
 */

import { THEMES, DEFAULT_THEME, ThemeUtils } from './theme.js';

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
        SmartLogger.log('theme-changes', `🎨 Theme Manager initialized with theme: ${this.currentTheme.name}`);
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
                console.error('Theme subscriber error:', error);
            }
        });
    }

    /**
     * Apply theme by name
     */
    applyTheme(themeName) {
        const theme = ThemeUtils.getTheme(themeName);
        if (!theme) {
            console.error(`Theme "${themeName}" not found`);
            return false;
        }

        // KEEP: User-facing theme change message
        console.log(`🎨 Applying theme: ${theme.name}`);
        
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
        root.style.setProperty('--canvas-background', '#1a1a1a');
        root.style.setProperty('--text-color', '#ffffff');
        root.style.setProperty('--text-muted', '#888888');
        
        // Control colors (consistent across all themes)
        root.style.setProperty('--control-hover', '#00B8E6');
        root.style.setProperty('--control-bg', 'rgba(17, 17, 17, 0.95)');

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
        

        // Effects
        root.style.setProperty('--transition-speed', `${effects.animationSpeed}s`);
        
        // Border radius (consistent across all themes)
        root.style.setProperty('--border-radius', '12px');
        root.style.setProperty('--border-radius-small', '4px');
        root.style.setProperty('--pulse-duration', `${effects.pulseSpeed}s`);

        SmartLogger.log('theme-changes', `✅ Updated CSS variables for theme: ${theme.name}`);
    }

    /**
     * Update WebGL renderer colors if available
     */
    updateWebGLColors(theme) {
        if (!this.webglRenderer || typeof this.webglRenderer.updateTheme !== 'function') {
            // KEEP: User-facing warning message
            console.log('⚠️ WebGL renderer not available or doesn\'t support theming');
            return;
        }

        try {
            this.webglRenderer.updateTheme(theme);
            SmartLogger.log('theme-changes', `✅ Updated WebGL colors for theme: ${theme.name}`);
        } catch (error) {
            console.error('Error updating WebGL theme:', error);
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
            console.warn('Could not save theme preference:', error);
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
            console.warn('Could not load theme preference:', error);
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
