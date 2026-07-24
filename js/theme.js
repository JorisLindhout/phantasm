/**
 * Unified Theme System for Phantasm
 * Single source of truth for colors, effects, and visual properties
 * Used by both CSS (via CSS variables) and JavaScript (WebGL materials)
 */

// Base color palette
const COLORS = {
    // Primary Phantasm colors
    fluidBlue: { hex: 0x00DDFF, css: '#00DDFF', rgba: 'rgba(0, 221, 255, 1)' },
    fluidGreen: { hex: 0x00FF64, css: '#00FF64', rgba: 'rgba(0, 255, 100, 1)' },
    fluidOrange: { hex: 0xFF6600, css: '#FF6600', rgba: 'rgba(255, 102, 0, 1)' },
    
    
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

// Level 2 color palette
const LEVEL2_COLORS = {
    oldGold: { hex: 0xc2b34f, css: '#c2b34f', rgba: 'rgba(194, 179, 79, 1)' },
    persianIndigo: { hex: 0x431b75, css: '#431b75', rgba: 'rgba(67, 27, 117, 1)' },
    cornflowerBlue: { hex: 0x659be9, css: '#659be9', rgba: 'rgba(101, 155, 233, 1)' },
    majorelleBlue: { hex: 0x7a4edf, css: '#7a4edf', rgba: 'rgba(122, 78, 223, 1)' },
    marianBlue: { hex: 0x334395, css: '#334395', rgba: 'rgba(51, 67, 149, 1)' },
    darkPurple: { hex: 0x180a29, css: '#180a29', rgba: 'rgba(24, 10, 41, 1)' },
    
    // Light variations for effects
    oldGoldLight: { hex: 0xd4c766, css: '#d4c766', rgba: 'rgba(212, 199, 102, 1)' },
    persianIndigoLight: { hex: 0x5d2a9e, css: '#5d2a9e', rgba: 'rgba(93, 42, 158, 1)' },
    cornflowerBlueLight: { hex: 0x7fb0ed, css: '#7fb0ed', rgba: 'rgba(127, 176, 237, 1)' },
    majorelleBlueLight: { hex: 0x8f5ef0, css: '#8f5ef0', rgba: 'rgba(143, 94, 240, 1)' },
    marianBlueLight: { hex: 0x4a5ba8, css: '#4a5ba8', rgba: 'rgba(74, 91, 168, 1)' },
};

// Level 3 color palette — gradient bases #D10700 → #F94EC0
const LEVEL3_COLORS = {
    rossoCorsa: { hex: 0xd10700, css: '#d10700', rgba: 'rgba(209, 7, 0, 1)' },
    brilliantRose: { hex: 0xf94ec0, css: '#f94ec0', rgba: 'rgba(249, 78, 192, 1)' },
    darkMaroon: { hex: 0x1a0508, css: '#1a0508', rgba: 'rgba(26, 5, 8, 1)' },
    deepWine: { hex: 0x6b1028, css: '#6b1028', rgba: 'rgba(107, 16, 40, 1)' },
    burgundy: { hex: 0x8b2240, css: '#8b2240', rgba: 'rgba(139, 34, 64, 1)' },
    antiqueGold: { hex: 0xd4b84a, css: '#d4b84a', rgba: 'rgba(212, 184, 74, 1)' },

    // Light variations for effects
    rossoCorsaLight: { hex: 0xe03a33, css: '#e03a33', rgba: 'rgba(224, 58, 51, 1)' },
    brilliantRoseLight: { hex: 0xfa72ce, css: '#fa72ce', rgba: 'rgba(250, 114, 206, 1)' },
    deepWineLight: { hex: 0x8a2440, css: '#8a2440', rgba: 'rgba(138, 36, 64, 1)' },
    burgundyLight: { hex: 0xa53a58, css: '#a53a58', rgba: 'rgba(165, 58, 88, 1)' },
    antiqueGoldLight: { hex: 0xe0ca66, css: '#e0ca66', rgba: 'rgba(224, 202, 102, 1)' },
};

// Level 4 color palette — gradient bases #2BAB08 → #BB9B08
const LEVEL4_COLORS = {
    kellyGreen: { hex: 0x2bab08, css: '#2bab08', rgba: 'rgba(43, 171, 8, 1)' },
    oliveGold: { hex: 0xbb9b08, css: '#bb9b08', rgba: 'rgba(187, 155, 8, 1)' },
    darkMoss: { hex: 0x0f1a02, css: '#0f1a02', rgba: 'rgba(15, 26, 2, 1)' },
    deepForest: { hex: 0x1a4a0a, css: '#1a4a0a', rgba: 'rgba(26, 74, 10, 1)' },
    fern: { hex: 0x3d6b1a, css: '#3d6b1a', rgba: 'rgba(61, 107, 26, 1)' },
    amber: { hex: 0xd4b42a, css: '#d4b42a', rgba: 'rgba(212, 180, 42, 1)' },

    // Light variations for effects
    kellyGreenLight: { hex: 0x4fc02e, css: '#4fc02e', rgba: 'rgba(79, 192, 46, 1)' },
    oliveGoldLight: { hex: 0xccb035, css: '#ccb035', rgba: 'rgba(204, 176, 53, 1)' },
    deepForestLight: { hex: 0x2e6a18, css: '#2e6a18', rgba: 'rgba(46, 106, 24, 1)' },
    fernLight: { hex: 0x558530, css: '#558530', rgba: 'rgba(85, 133, 48, 1)' },
    amberLight: { hex: 0xe0c64a, css: '#e0c64a', rgba: 'rgba(224, 198, 74, 1)' },
};

// Theme definitions
export const THEMES = {
    // Base Phantasm theme
    phantasm: {
        name: 'Phantasm',
        baseImage: './assets/Phantasm.svg',
        colors: {
            // Functional colors
            primary: COLORS.fluidBlue,
            
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
            outlineSnapped: COLORS.fluidGreen,
            
            // Game state colors
            solved: COLORS.fluidGreenLight, // Use fluidGreenLight for solved state
            solvedGlow: COLORS.solvedGlow
        },
        effects: {
            animationSpeed: 0.2,
            opacityDragging: 0.9,
        },
        levelGradient: {
            gradientStart: COLORS.fluidBlue,
            gradientEnd: COLORS.fluidGreen,
            angle: '135deg',
        },
    },
    levelOne: {
        name: 'Level 1',
        baseImage: './assets/Level-1.svg',
        colors: {
            // Functional colors
            primary: LEVEL1_COLORS.pennBlue,
            
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
            animationSpeed: 0.2,
            opacityDragging: 0.9,
        },
        levelGradient: {
            gradientStart: LEVEL1_COLORS.keppel,
            gradientEnd: LEVEL1_COLORS.neonBlue,
            angle: '135deg',
        },
    },

    // Level Two theme
    levelTwo: {
        name: 'Level 2',
        baseImage: './assets/Level-2.svg',
        colors: {
            // Functional colors
            primary: LEVEL2_COLORS.darkPurple,
            
            // Piece states
            pieceNormal: LEVEL2_COLORS.majorelleBlue,
            pieceHover: LEVEL2_COLORS.majorelleBlueLight,
            pieceDragging: LEVEL2_COLORS.majorelleBlueLight, // Brighter blue for better glow visibility
            pieceSnapped: LEVEL2_COLORS.cornflowerBlue,
            
            // Slot states
            slotHover: LEVEL2_COLORS.persianIndigo,
            slotOutline: LEVEL2_COLORS.oldGold,
            
            // Outline states
            outlineNormal: LEVEL2_COLORS.majorelleBlue,
            outlineHover: LEVEL2_COLORS.majorelleBlueLight, // Brighter blue for hover outline
            outlineDragging: LEVEL2_COLORS.majorelleBlueLight, // Brighter blue for dragging outline
            outlineSnapped: LEVEL2_COLORS.cornflowerBlue,
            
            // Game state colors
            solved: LEVEL2_COLORS.marianBlue, // Use marianBlue for solved state
            solvedGlow: LEVEL2_COLORS.cornflowerBlue
        },
        effects: {
            animationSpeed: 0.2,
            opacityDragging: 0.9,
        },
        levelGradient: {
            gradientStart: LEVEL2_COLORS.cornflowerBlue,
            gradientEnd: LEVEL2_COLORS.majorelleBlue,
            angle: '135deg',
        },
    },

    // Level Three theme
    levelThree: {
        name: 'Level 3',
        baseImage: './assets/Level-3.svg',
        colors: {
            // Functional colors
            primary: LEVEL3_COLORS.darkMaroon,

            // Piece states
            pieceNormal: LEVEL3_COLORS.brilliantRose,
            pieceHover: LEVEL3_COLORS.brilliantRoseLight,
            pieceDragging: LEVEL3_COLORS.brilliantRoseLight,
            pieceSnapped: LEVEL3_COLORS.rossoCorsa,

            // Slot states
            slotHover: LEVEL3_COLORS.deepWine,
            slotOutline: LEVEL3_COLORS.antiqueGold,

            // Outline states
            outlineNormal: LEVEL3_COLORS.brilliantRose,
            outlineHover: LEVEL3_COLORS.brilliantRoseLight,
            outlineDragging: LEVEL3_COLORS.brilliantRoseLight,
            outlineSnapped: LEVEL3_COLORS.rossoCorsa,

            // Game state colors
            solved: LEVEL3_COLORS.burgundy,
            solvedGlow: LEVEL3_COLORS.rossoCorsa,
        },
        effects: {
            animationSpeed: 0.2,
            opacityDragging: 0.9,
        },
        levelGradient: {
            gradientStart: LEVEL3_COLORS.rossoCorsa,
            gradientEnd: LEVEL3_COLORS.brilliantRose,
            angle: '135deg',
        },
    },

    // Level Four theme
    levelFour: {
        name: 'Level 4',
        baseImage: './assets/Level-4.svg',
        colors: {
            // Functional colors
            primary: LEVEL4_COLORS.darkMoss,

            // Piece states
            pieceNormal: LEVEL4_COLORS.oliveGold,
            pieceHover: LEVEL4_COLORS.oliveGoldLight,
            pieceDragging: LEVEL4_COLORS.oliveGoldLight,
            pieceSnapped: LEVEL4_COLORS.kellyGreen,

            // Slot states
            slotHover: LEVEL4_COLORS.deepForest,
            slotOutline: LEVEL4_COLORS.amber,

            // Outline states
            outlineNormal: LEVEL4_COLORS.oliveGold,
            outlineHover: LEVEL4_COLORS.oliveGoldLight,
            outlineDragging: LEVEL4_COLORS.oliveGoldLight,
            outlineSnapped: LEVEL4_COLORS.kellyGreen,

            // Game state colors
            solved: LEVEL4_COLORS.fern,
            solvedGlow: LEVEL4_COLORS.kellyGreen,
        },
        effects: {
            animationSpeed: 0.2,
            opacityDragging: 0.9,
        },
        levelGradient: {
            gradientStart: LEVEL4_COLORS.kellyGreen,
            gradientEnd: LEVEL4_COLORS.oliveGold,
            angle: '135deg',
        },
    },
};

// Default theme
export const DEFAULT_THEME = THEMES.levelOne;

/** Global stage frame glow while the puzzle is unsolved (all levels). */
export const UNSOLVED_STAGE_GLOW = COLORS.fluidOrange;

/** Alpha for the unsolved stage halo on #111 background. */
export const UNSOLVED_STAGE_GLOW_ALPHA = 0.45;

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
