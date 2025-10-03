/**
 * Unified Theme System for Voronoi Puzzle
 * Single source of truth for colors, effects, and visual properties
 * Used by both CSS (via CSS variables) and JavaScript (WebGL materials)
 */

// Base color palette
const COLORS = {
    // Primary FluidLock colors
    fluidBlue: { hex: 0x00DDFF, css: '#00DDFF', rgba: 'rgba(0, 221, 255, 1)' },
    fluidGreen: { hex: 0x00FF64, css: '#00FF64', rgba: 'rgba(0, 255, 100, 1)' },
    fluidOrange: { hex: 0xFF6600, css: '#FF6600', rgba: 'rgba(255, 102, 0, 1)' },
    fluidRed: { hex: 0xFF4444, css: '#FF4444', rgba: 'rgba(255, 68, 68, 1)' },
    
    // Neutral colors
    darkBg: { hex: 0x000000, css: '#000000', rgba: 'rgba(0, 0, 0, 1)' },
    mediumBg: { hex: 0x1a1a1a, css: '#1a1a1a', rgba: 'rgba(26, 26, 26, 1)' },
    lightBg: { hex: 0x2a2a2a, css: '#2a2a2a', rgba: 'rgba(42, 42, 42, 1)' },
    white: { hex: 0xffffff, css: '#ffffff', rgba: 'rgba(255, 255, 255, 1)' },
    gray: { hex: 0x888888, css: '#888888', rgba: 'rgba(136, 136, 136, 1)' },
    
    // Tinted variations for effects
    fluidBlueLight: { hex: 0x88DDFF, css: '#88DDFF', rgba: 'rgba(136, 221, 255, 1)' },
    fluidBlueLightTransparent: { hex: 0x2A7A9F, css: '#2A7A9F', rgba: 'rgb(42, 122, 159)' },
    fluidBlueDark: { hex: 0x0099BB, css: '#0099BB', rgba: 'rgba(0, 153, 187, 1)' },
    fluidGreenLight: { hex: 0x44FF88, css: '#44FF88', rgba: 'rgba(68, 255, 136, 1)' },
    fluidOrangeLight: { hex: 0xFFCC80, css: '#FFCC80', rgba: 'rgba(255, 204, 128, 1)' },
};

// Debug settings
export const DEBUG_SETTINGS = {
    showHitDetection: false, // Show hit detection debug logs (reduced noise)
    showPieceStates: false,  // Show piece state debug logs (reduced noise)
    showGlowEffects: false, // Show glow effect creation/updates
    showAnimation: false,   // Show animation updates
    showVisualStates: false, // Show visual state changes
    showCreation: false,    // Show piece creation/removal logs
    quietMode: true,        // Reduce general logging noise
    showInteractionDebug: true,  // Show interaction system debugging
    showMaterialUpdates: false,  // Show material color/opacity updates
    showHoverEffects: false,     // Show hover effect logs
    showNeonGlow: false,         // Show neon glow visibility logs
    showStyling: false,          // Show all styling-related logs
    showInitialization: false,   // Show WebGL initialization logs
    showCoordinates: false,      // Show coordinate transformation logs
    showRendererSwitching: false, // Show renderer switching logs
    showCanvasSetup: false       // Show canvas setup logs
};

// Theme definitions
export const THEMES = {
    // Default FluidLock theme
    fluidlock: {
        name: 'FluidLock',
        colors: {
            // Functional colors
            primary: COLORS.fluidBlue,
            secondary: COLORS.fluidGreen,
            accent: COLORS.fluidOrange,
            danger: COLORS.fluidRed,
            
            // UI colors
            background: COLORS.darkBg,
            surface: COLORS.mediumBg,
            text: COLORS.white,
            textMuted: COLORS.gray,
            
            // Piece states
            pieceNormal: COLORS.fluidBlue,
            pieceHover: COLORS.fluidBlueLight,
            pieceDragging: COLORS.fluidBlueLight, // Brighter blue for better glow visibility
            pieceSnapped: COLORS.fluidGreen,
            
            // Slot states
            slotHover: COLORS.fluidBlueLightTransparent,
            slotOutline: COLORS.fluidOrangeLight,
            
            // Outline states
            outlineNormal: COLORS.fluidBlue,
            outlineHover: COLORS.fluidBlueLight, // Brighter blue for hover outline
            outlineDragging: COLORS.fluidBlueLight, // Brighter blue for dragging outline
            outlineSnapped: COLORS.fluidGreen
        },
        effects: {
            glowIntensity: 0.8,
            animationSpeed: 0.2,
            pulseSpeed: 1.0,
            scaleHover: 1.02,
            scaleDragging: 1.1,
            opacityNormal: 1.0,
            opacityHover: 0.8,
            opacityDragging: 0.9,
            opacitySnapped: 1.0
        }
    }
};

// Default theme
export const DEFAULT_THEME = THEMES.fluidlock;

// Visual state definitions
export const VISUAL_STATES = {
    NORMAL: 'normal',
    HOVER: 'hover',
    DRAGGING: 'dragging',
    SNAPPED: 'snapped',
    DISABLED: 'disabled'
};

// Utility functions
export const ThemeUtils = {
    /**
     * Get color with alpha applied
     */
    getColorWithAlpha(colorConfig, alpha = 1.0) {
        const r = (colorConfig.hex >> 16) & 0xFF;
        const g = (colorConfig.hex >> 8) & 0xFF;
        const b = colorConfig.hex & 0xFF;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },
    
    /**
     * Convert hex to Three.js Color
     */
    hexToThreeColor(hex) {
        return new THREE.Color(hex);
    },
    
    /**
     * Get all available theme names
     */
    getThemeNames() {
        return Object.keys(THEMES);
    },
    
    /**
     * Get theme by name
     */
    getTheme(name) {
        return THEMES[name] || DEFAULT_THEME;
    },
    
    /**
     * Debug settings management
     */
    debug: {
        /**
         * Get current debug settings
         */
        getSettings() {
            return { ...DEBUG_SETTINGS };
        },
        
        /**
         * Update debug settings
         */
        updateSettings(newSettings) {
            Object.assign(DEBUG_SETTINGS, newSettings);
            console.log('🔧 Debug settings updated:', DEBUG_SETTINGS);
        },
        
        
        /**
         * Toggle hit detection logs
         */
        toggleHitDetection() {
            DEBUG_SETTINGS.showHitDetection = !DEBUG_SETTINGS.showHitDetection;
            console.log(`🎯 Hit detection logs ${DEBUG_SETTINGS.showHitDetection ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.showHitDetection;
        },
        
        /**
         * Toggle piece state logs
         */
        togglePieceStates() {
            DEBUG_SETTINGS.showPieceStates = !DEBUG_SETTINGS.showPieceStates;
            console.log(`📊 Piece state logs ${DEBUG_SETTINGS.showPieceStates ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.showPieceStates;
        },
        
        /**
         * Toggle interaction debug logs
         */
        toggleInteractionDebug() {
            DEBUG_SETTINGS.showInteractionDebug = !DEBUG_SETTINGS.showInteractionDebug;
            console.log(`🖱️ Interaction debug logs ${DEBUG_SETTINGS.showInteractionDebug ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.showInteractionDebug;
        },
        
        /**
         * Toggle material update logs
         */
        toggleMaterialUpdates() {
            DEBUG_SETTINGS.showMaterialUpdates = !DEBUG_SETTINGS.showMaterialUpdates;
            console.log(`🎨 Material update logs ${DEBUG_SETTINGS.showMaterialUpdates ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.showMaterialUpdates;
        },
        
        /**
         * Toggle hover effect logs
         */
        toggleHoverEffects() {
            DEBUG_SETTINGS.showHoverEffects = !DEBUG_SETTINGS.showHoverEffects;
            console.log(`✨ Hover effect logs ${DEBUG_SETTINGS.showHoverEffects ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.showHoverEffects;
        },
        
        /**
         * Toggle neon glow logs
         */
        toggleNeonGlow() {
            DEBUG_SETTINGS.showNeonGlow = !DEBUG_SETTINGS.showNeonGlow;
            console.log(`🌟 Neon glow logs ${DEBUG_SETTINGS.showNeonGlow ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.showNeonGlow;
        },
        
        /**
         * Toggle all styling logs
         */
        toggleStyling() {
            DEBUG_SETTINGS.showStyling = !DEBUG_SETTINGS.showStyling;
            console.log(`🎨 Styling logs ${DEBUG_SETTINGS.showStyling ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.showStyling;
        },
        
        /**
         * Toggle initialization logs
         */
        toggleInitialization() {
            DEBUG_SETTINGS.showInitialization = !DEBUG_SETTINGS.showInitialization;
            console.log(`🔍 Initialization logs ${DEBUG_SETTINGS.showInitialization ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.showInitialization;
        },
        
        /**
         * Toggle coordinate transformation logs
         */
        toggleCoordinates() {
            DEBUG_SETTINGS.showCoordinates = !DEBUG_SETTINGS.showCoordinates;
            console.log(`🎯 Coordinate logs ${DEBUG_SETTINGS.showCoordinates ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.showCoordinates;
        },
        
        /**
         * Toggle renderer switching logs
         */
        toggleRendererSwitching() {
            DEBUG_SETTINGS.showRendererSwitching = !DEBUG_SETTINGS.showRendererSwitching;
            console.log(`🔄 Renderer switching logs ${DEBUG_SETTINGS.showRendererSwitching ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.showRendererSwitching;
        },
        
        /**
         * Toggle canvas setup logs
         */
        toggleCanvasSetup() {
            DEBUG_SETTINGS.showCanvasSetup = !DEBUG_SETTINGS.showCanvasSetup;
            console.log(`🎨 Canvas setup logs ${DEBUG_SETTINGS.showCanvasSetup ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.showCanvasSetup;
        },
        
        /**
         * Toggle glow effect logs
         */
        toggleGlowEffects() {
            DEBUG_SETTINGS.showGlowEffects = !DEBUG_SETTINGS.showGlowEffects;
            console.log(`✨ Glow effect logs ${DEBUG_SETTINGS.showGlowEffects ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.showGlowEffects;
        },
        
        /**
         * Toggle animation logs
         */
        toggleAnimation() {
            DEBUG_SETTINGS.showAnimation = !DEBUG_SETTINGS.showAnimation;
            console.log(`🎬 Animation logs ${DEBUG_SETTINGS.showAnimation ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.showAnimation;
        },
        
        /**
         * Toggle visual state logs
         */
        toggleVisualStates() {
            DEBUG_SETTINGS.showVisualStates = !DEBUG_SETTINGS.showVisualStates;
            console.log(`🎨 Visual state logs ${DEBUG_SETTINGS.showVisualStates ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.showVisualStates;
        },
        
        /**
         * Toggle creation logs
         */
        toggleCreation() {
            DEBUG_SETTINGS.showCreation = !DEBUG_SETTINGS.showCreation;
            console.log(`🏗️ Creation logs ${DEBUG_SETTINGS.showCreation ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.showCreation;
        },
        
        /**
         * Enable all debug logs
         */
        enableAllDebug() {
            DEBUG_SETTINGS.showPieceLabels = true;
            DEBUG_SETTINGS.showHitDetection = true;
            DEBUG_SETTINGS.showPieceStates = true;
            DEBUG_SETTINGS.showGlowEffects = true;
            DEBUG_SETTINGS.showAnimation = true;
            DEBUG_SETTINGS.showVisualStates = true;
            DEBUG_SETTINGS.showCreation = true;
            console.log('🔧 All debug logs ENABLED');
        },
        
        /**
         * Disable all debug logs
         */
        disableAllDebug() {
            DEBUG_SETTINGS.showPieceLabels = false;
            DEBUG_SETTINGS.showHitDetection = false;
            DEBUG_SETTINGS.showPieceStates = false;
            DEBUG_SETTINGS.showGlowEffects = false;
            DEBUG_SETTINGS.showAnimation = false;
            DEBUG_SETTINGS.showVisualStates = false;
            DEBUG_SETTINGS.showCreation = false;
            console.log('🔧 All debug logs DISABLED');
        },
        
        /**
         * Toggle quiet mode
         */
        toggleQuietMode() {
            DEBUG_SETTINGS.quietMode = !DEBUG_SETTINGS.quietMode;
            console.log(`🔇 Quiet mode ${DEBUG_SETTINGS.quietMode ? 'ENABLED' : 'DISABLED'}`);
            return DEBUG_SETTINGS.quietMode;
        },
        
        /**
         * Enable quiet mode
         */
        enableQuietMode() {
            DEBUG_SETTINGS.quietMode = true;
            console.log('🔇 Quiet mode ENABLED - reduced logging');
        },
        
        /**
         * Disable quiet mode
         */
        disableQuietMode() {
            DEBUG_SETTINGS.quietMode = false;
            console.log('🔇 Quiet mode DISABLED - full logging');
        }
    }
};
