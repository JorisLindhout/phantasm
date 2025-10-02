// Voronoi Puzzle 2D - Standalone Version
// Animated Voronoi cells with Canvas 2D rendering
// No 3D dependencies, optimized for broad compatibility

class VoronoiPuzzle2D extends Canvas2DRenderer {
    constructor() {
        super();
        console.log('🎮 Initialized 2D-only Voronoi Puzzle');
        // Initialize the puzzle after construction
        this.init();
    }
}

// Global functions for controls
function regeneratePuzzle() {
    window.voronoiPuzzle?.regeneratePuzzle();
}

function toggleAnimation() {
    window.voronoiPuzzle?.toggleAnimation();
}

function updateCellCount() {
    if (window.voronoiPuzzle && window.voronoiPuzzle.config) {
        window.voronoiPuzzle.config.cellCount = parseInt(document.getElementById('cellCount').value);
        window.voronoiPuzzle.generateVoronoi();
    }
}

function updateAnimationSpeed() {
    if (window.voronoiPuzzle && window.voronoiPuzzle.config) {
        window.voronoiPuzzle.config.animationSpeed = parseFloat(document.getElementById('animationSpeed').value);
    }
}

function updateNoiseAmplitude() {
    if (window.voronoiPuzzle && window.voronoiPuzzle.config) {
        window.voronoiPuzzle.config.noiseAmplitude = parseInt(document.getElementById('noiseAmplitude').value);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing 2D Voronoi Puzzle...');
    console.log('Delaunay available:', typeof Delaunay !== 'undefined');
    console.log('d3 available:', typeof d3 !== 'undefined');
    if (typeof d3 !== 'undefined') {
        console.log('d3.Delaunay available:', typeof d3.Delaunay !== 'undefined');
    }
    
    // Small delay to ensure layout is complete
    setTimeout(() => {
        window.voronoiPuzzle = new VoronoiPuzzle2D();
    }, 100);
});
