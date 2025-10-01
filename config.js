// FluidLock Configuration
// Update these variables to customize the application

const CONFIG = {
    // Snap Settings
    SNAP_THRESHOLD: 85, // Percentage overlap required for snapping (0-100)
    
    // Colors (can be overridden with CSS variables)
    COLORS: {
        PRIMARY: '#00DDFF',
        BACKGROUND: '#1a1a1a',
        CANVAS_BACKGROUND: '#111111',
        TEXT: '#ffffff',
        TEXT_MUTED: '#888',
        SNAP_HIGHLIGHT_BG: 'rgba(0, 255, 100, 0.3)',
        SNAP_HIGHLIGHT_BORDER: '#00FF64',
        PIECE_BORDER: 'rgba(0, 221, 255, 0.2)',
        PIECE_BORDER_HOVER: 'rgba(0, 221, 255, 0.6)',
        PIECE_SHADOW_HOVER: '0 0 10px rgba(0, 221, 255, 0.3)',
        PIECE_SHADOW_DRAG: '0 10px 30px rgba(0, 221, 255, 0.5)'
    },
    
    // Grid Settings
    GRID: {
        SIZE: 4, // 4x4 grid
        GAP: 2 // Gap between pieces in pixels
    },
    
    // Canvas Settings
    CANVAS: {
        ORIGINAL_WIDTH: 850,
        ORIGINAL_HEIGHT: 478,
        SCALE: 2 // Display at 2x size
    },
    
    // Animation Settings
    ANIMATION: {
        TRANSITION_SPEED: '0.2s',
        PULSE_DURATION: '1s',
        DRAG_SCALE: 1.05,
        HOVER_SCALE: 1.0
    },
    
    // Z-Index Management
    Z_INDEX: {
        BASE: 1000,
        GRID_OVERLAY: 10,
        PIECE_DRAGGING: 1000,
        SNAP_HIGHLIGHT: 999,
        PIECE_LABEL: 10,
        DRAG_HANDLE: 5
    },
    
    // Responsive Breakpoints
    BREAKPOINTS: {
        TABLET: 768,
        MOBILE: 480
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
