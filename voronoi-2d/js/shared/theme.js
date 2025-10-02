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
    darkBg: { hex: 0x111111, css: '#111111', rgba: 'rgba(17, 17, 17, 1)' },
    mediumBg: { hex: 0x1a1a1a, css: '#1a1a1a', rgba: 'rgba(26, 26, 26, 1)' },
    lightBg: { hex: 0x2a2a2a, css: '#2a2a2a', rgba: 'rgba(42, 42, 42, 1)' },
    white: { hex: 0xffffff, css: '#ffffff', rgba: 'rgba(255, 255, 255, 1)' },
    gray: { hex: 0x888888, css: '#888888', rgba: 'rgba(136, 136, 136, 1)' },
    
    // Tinted variations for effects
    fluidBlueLight: { hex: 0x88DDFF, css: '#88DDFF', rgba: 'rgba(136, 221, 255, 1)' },
    fluidBlueDark: { hex: 0x0099BB, css: '#0099BB', rgba: 'rgba(0, 153, 187, 1)' },
    fluidGreenLight: { hex: 0x44FF88, css: '#44FF88', rgba: 'rgba(68, 255, 136, 1)' },
    slotOrange: { hex: 0xFFCC80, css: '#FFCC80', rgba: 'rgba(255, 204, 128, 1)' }
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
            pieceDragging: COLORS.fluidBlue,
            pieceSnapped: COLORS.fluidGreen,
            
            // Slot states
            slotHover: COLORS.slotOrange,
            
            // Outline states
            outlineNormal: COLORS.fluidBlue,
            outlineHover: COLORS.fluidBlueLight, // Brighter blue for hover outline
            outlineDragging: COLORS.fluidBlue,
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
    },
    
    // Neon cyberpunk theme
    cyberpunk: {
        name: 'Cyberpunk',
        colors: {
            primary: { hex: 0xFF0080, css: '#FF0080', rgba: 'rgba(255, 0, 128, 1)' },
            secondary: { hex: 0x00FF80, css: '#00FF80', rgba: 'rgba(0, 255, 128, 1)' },
            accent: { hex: 0x8000FF, css: '#8000FF', rgba: 'rgba(128, 0, 255, 1)' },
            danger: { hex: 0xFF4000, css: '#FF4000', rgba: 'rgba(255, 64, 0, 1)' },
            
            background: COLORS.darkBg,
            surface: COLORS.mediumBg,
            text: COLORS.white,
            textMuted: COLORS.gray,
            
            pieceNormal: { hex: 0xFF0080, css: '#FF0080', rgba: 'rgba(255, 0, 128, 1)' },
            pieceHover: { hex: 0xFF4099, css: '#FF4099', rgba: 'rgba(255, 64, 153, 1)' },
            pieceDragging: { hex: 0xFF0080, css: '#FF0080', rgba: 'rgba(255, 0, 128, 1)' },
            pieceSnapped: { hex: 0x00FF80, css: '#00FF80', rgba: 'rgba(0, 255, 128, 1)' },
            
            slotHover: { hex: 0x8000FF, css: '#8000FF', rgba: 'rgba(128, 0, 255, 1)' },
            
            outlineNormal: { hex: 0xFF0080, css: '#FF0080', rgba: 'rgba(255, 0, 128, 1)' },
            outlineHover: { hex: 0xFF4099, css: '#FF4099', rgba: 'rgba(255, 64, 153, 1)' }, // Brighter pink for hover
            outlineDragging: { hex: 0xFF0080, css: '#FF0080', rgba: 'rgba(255, 0, 128, 1)' },
            outlineSnapped: { hex: 0x00FF80, css: '#00FF80', rgba: 'rgba(0, 255, 128, 1)' }
        },
        effects: {
            glowIntensity: 1.2,
            animationSpeed: 0.15,
            pulseSpeed: 0.8,
            scaleHover: 1.05,
            scaleDragging: 1.15,
            opacityNormal: 1.0,
            opacityHover: 0.9,
            opacityDragging: 1.0,
            opacitySnapped: 1.0
        }
    },
    
    // Soft pastel theme
    pastel: {
        name: 'Pastel',
        colors: {
            primary: { hex: 0x87CEEB, css: '#87CEEB', rgba: 'rgba(135, 206, 235, 1)' },
            secondary: { hex: 0x98FB98, css: '#98FB98', rgba: 'rgba(152, 251, 152, 1)' },
            accent: { hex: 0xFFB6C1, css: '#FFB6C1', rgba: 'rgba(255, 182, 193, 1)' },
            danger: { hex: 0xFFA07A, css: '#FFA07A', rgba: 'rgba(255, 160, 122, 1)' },
            
            background: { hex: 0x2F2F2F, css: '#2F2F2F', rgba: 'rgba(47, 47, 47, 1)' },
            surface: { hex: 0x3A3A3A, css: '#3A3A3A', rgba: 'rgba(58, 58, 58, 1)' },
            text: COLORS.white,
            textMuted: COLORS.gray,
            
            pieceNormal: { hex: 0x87CEEB, css: '#87CEEB', rgba: 'rgba(135, 206, 235, 1)' },
            pieceHover: { hex: 0xB0E0E6, css: '#B0E0E6', rgba: 'rgba(176, 224, 230, 1)' },
            pieceDragging: { hex: 0x87CEEB, css: '#87CEEB', rgba: 'rgba(135, 206, 235, 1)' },
            pieceSnapped: { hex: 0x98FB98, css: '#98FB98', rgba: 'rgba(152, 251, 152, 1)' },
            
            slotHover: { hex: 0xFFB6C1, css: '#FFB6C1', rgba: 'rgba(255, 182, 193, 1)' },
            
            outlineNormal: { hex: 0x87CEEB, css: '#87CEEB', rgba: 'rgba(135, 206, 235, 1)' },
            outlineHover: { hex: 0xB0E0E6, css: '#B0E0E6', rgba: 'rgba(176, 224, 230, 1)' }, // Brighter sky blue for hover
            outlineDragging: { hex: 0x87CEEB, css: '#87CEEB', rgba: 'rgba(135, 206, 235, 1)' },
            outlineSnapped: { hex: 0x98FB98, css: '#98FB98', rgba: 'rgba(152, 251, 152, 1)' }
        },
        effects: {
            glowIntensity: 0.5,
            animationSpeed: 0.3,
            pulseSpeed: 1.5,
            scaleHover: 1.01,
            scaleDragging: 1.05,
            opacityNormal: 0.9,
            opacityHover: 0.7,
            opacityDragging: 0.8,
            opacitySnapped: 0.9
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
    }
};
