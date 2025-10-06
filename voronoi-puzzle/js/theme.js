/**
 * Unified Theme System for Phantasm
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
    
    
    // Tinted variations for effects
    fluidBlueLight: { hex: 0x88DDFF, css: '#88DDFF', rgba: 'rgba(136, 221, 255, 1)' },
    fluidBlueLightTransparent: { hex: 0x2A7A9F, css: '#2A7A9F', rgba: 'rgb(42, 122, 159)' },
    fluidGreenLight: { hex: 0x44FF88, css: '#44FF88', rgba: 'rgba(68, 255, 136, 1)' },
    fluidOrangeLight: { hex: 0xFFCC80, css: '#FFCC80', rgba: 'rgba(255, 204, 128, 1)' },
    
    // Game state colors
    solvedGreen: { hex: 0x00FF00, css: '#00FF00', rgba: 'rgba(0, 255, 0, 1)' },
    solvedGlow: { hex: 0x00FF00, css: '#00FF00', rgba: 'rgba(0, 255, 0, 0.6)' },
};

// Level 1 color palette
const LEVEL1_COLORS = {
    pennBlue: { hex: 0x081546, css: '#081546', rgba: 'rgba(8, 21, 70, 1)' },
    forestGreen: { hex: 0x4d983c, css: '#4d983c', rgba: 'rgba(77, 152, 60, 1)' },
    midnightGreen: { hex: 0x1e546a, css: '#1e546a', rgba: 'rgba(30, 84, 106, 1)' },
    neonBlue: { hex: 0x3768fe, css: '#3768fe', rgba: 'rgba(55, 104, 254, 1)' },
    keppel: { hex: 0x0dad9e, css: '#0dad9e', rgba: 'rgba(13, 173, 158, 1)' },
    oldGold: { hex: 0xcfb73e, css: '#cfb73e', rgba: 'rgba(207, 183, 62, 1)' },
    
    // Light variations for effects
    pennBlueLight: { hex: 0x2a3a6b, css: '#2a3a6b', rgba: 'rgba(42, 58, 107, 1)' },
    forestGreenLight: { hex: 0x6bb85a, css: '#6bb85a', rgba: 'rgba(107, 184, 90, 1)' },
    neonBlueLight: { hex: 0x5a7cfe, css: '#5a7cfe', rgba: 'rgba(90, 124, 254, 1)' },
    keppelLight: { hex: 0x2dd1c1, css: '#2dd1c1', rgba: 'rgba(45, 209, 193, 1)' },
    oldGoldLight: { hex: 0xe6d166, css: '#e6d166', rgba: 'rgba(230, 209, 102, 1)' },
};

/*
Level 2 colors:
--old-gold: #c2b34fff;
--persian-indigo: #431b75ff;
--cornflower-blue: #659be9ff;
--majorelle-blue: #7a4edfff;
--marian-blue: #334395ff;
--dark-purple: #180a29ff;
*/

// Theme definitions
export const THEMES = {
    // Default Level One theme
    levelOne: {
        name: 'Level 1',
        baseImage: './assets/Level-1.svg',
        colors: {
            // Functional colors
            primary: LEVEL1_COLORS.pennBlue,
            //secondary: COLORS.fluidGreen,
            //accent: COLORS.fluidOrange,
            //danger: COLORS.fluidRed,
            
            // Piece states
            pieceNormal: LEVEL1_COLORS.neonBlue,
            pieceHover: LEVEL1_COLORS.neonBlueLight,
            pieceDragging: LEVEL1_COLORS.neonBlueLight, // Brighter blue for better glow visibility
            pieceSnapped: LEVEL1_COLORS.forestGreen,
            
            // Slot states
            slotHover: LEVEL1_COLORS.keppel,
            slotOutline: LEVEL1_COLORS.oldGold,
            
            // Outline states
            outlineNormal: LEVEL1_COLORS.neonBlue,
            outlineHover: LEVEL1_COLORS.neonBlueLight, // Brighter blue for hover outline
            outlineDragging: LEVEL1_COLORS.neonBlueLight, // Brighter blue for dragging outline
            outlineSnapped: LEVEL1_COLORS.forestGreen,
            
            // Game state colors
            solved: LEVEL1_COLORS.midnightGreen, // Use midnightGreen for solved state
            solvedGlow: LEVEL1_COLORS.forestGreen
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
export const DEFAULT_THEME = THEMES.levelOne;

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

};
