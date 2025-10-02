/**
 * Shared Base Classes and Utilities for Voronoi Puzzle
 * Contains functionality used by both 2D and 3D renderers
 */

// Base configuration for Voronoi puzzle
class VoronoiConfig {
    constructor() {
        this.cellCount = 40;
        this.animationSpeed = 1.0;
        this.noiseAmplitude = 10;
        this.isAnimating = true;
        this.time = 0;
    }
}

// Base Voronoi puzzle class with shared functionality
class VoronoiPuzzleBase {
    constructor() {
        this.canvas = document.getElementById('voronoiCanvas');
        this.config = new VoronoiConfig();
        
        // State
        this.voronoi = null;
        this.points = [];
        this.backgroundImage = null;
        this.animationId = null;
        
        // Drag and drop state
        this.isDragging = false;
        this.draggedCellIndex = -1;
        this.dragOffset = { x: 0, y: 0 };
        this.originalPoints = [];
        this.snapThreshold = 30; // pixels
        this.scaleFactor = 1.1; // Scale content slightly to minimize gaps
        
        // Separate pieces mode
        this.separatePieces = true; // Set to true for jigsaw-style separate pieces
        this.piecePositions = []; // Track individual piece positions
        this.pieceOffsets = []; // Track piece offsets from original positions
        
        // Z-index and visual feedback
        this.pieceZIndex = []; // Track z-index for each piece
        this.snappedPieces = new Set(); // Track which pieces are snapped
        this.snapAnimationTime = 0; // Animation time for snap feedback
        this.hoveredPiece = -1; // Track which piece is being hovered
    }

    async loadBackgroundImage() {
        // Use the same background image as the main FluidLock project
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log('✅ Background image loaded successfully:', img.src);
                this.backgroundImage = img;
                resolve();
            };
            img.onerror = (error) => {
                console.error('❌ Failed to load background image:', img.src, error);
                reject(error);
            };
            // Use the same SVG from the main project
            img.src = './base-image-cube.svg';
            console.log('🖼️ Loading background image:', img.src);
        });
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Set canvas size to fill the container
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;
        this.canvas.style.width = containerWidth + 'px';
        this.canvas.style.height = containerHeight + 'px';
        
        console.log('🎨 Canvas setup:', containerWidth, 'x', containerHeight);
        this.canvas.style.cursor = 'grab';
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.generateVoronoi();
        });
    }

    generateVoronoi() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Generate random points for Voronoi cells
        this.points = [];
        for (let i = 0; i < this.config.cellCount; i++) {
            this.points.push([
                Math.random() * width,
                Math.random() * height
            ]);
        }
        
        // Create Voronoi diagram using d3-delaunay
        if (typeof d3 !== 'undefined' && d3.Delaunay) {
            console.log('Using npm d3-delaunay');
            this.voronoi = d3.Delaunay.from(this.points).voronoi([0, 0, width, height]);
        } else if (typeof Delaunay !== 'undefined') {
            console.log('Using direct Delaunay');
            this.voronoi = Delaunay.from(this.points).voronoi([0, 0, width, height]);
        } else {
            console.log('Delaunay not available, using fallback');
            this.voronoi = this.createFallbackVoronoi();
        }
    }

    createFallbackVoronoi() {
        // Simple fallback: create regular grid cells if d3-delaunay fails
        const width = this.canvas.width;
        const height = this.canvas.height;
        const cellCount = this.config.cellCount;
        const cols = Math.ceil(Math.sqrt(cellCount));
        const rows = Math.ceil(cellCount / cols);
        
        const cellWidth = width / cols;
        const cellHeight = height / rows;
        
        const cells = [];
        for (let i = 0; i < cellCount; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = col * cellWidth;
            const y = row * cellHeight;
            
            cells.push({
                polygon: [
                    [x, y],
                    [x + cellWidth, y],
                    [x + cellWidth, y + cellHeight],
                    [x, y + cellHeight]
                ]
            });
        }
        
        return {
            cellPolygons: () => cells.map(cell => cell.polygon)
        };
    }

    setupControls() {
        // Cell count control
        const cellCountSlider = document.getElementById('cellCount');
        const cellCountValue = document.getElementById('cellCountValue');
        if (cellCountSlider && cellCountValue) {
            cellCountSlider.addEventListener('input', (e) => {
                this.config.cellCount = parseInt(e.target.value);
                cellCountValue.textContent = e.target.value;
                // Regenerate Voronoi when cell count changes
                this.generateVoronoi();
            });
        }

        // Animation speed control
        const animationSpeedSlider = document.getElementById('animationSpeed');
        const animationSpeedValue = document.getElementById('animationSpeedValue');
        if (animationSpeedSlider && animationSpeedValue) {
            animationSpeedSlider.addEventListener('input', (e) => {
                this.config.animationSpeed = parseFloat(e.target.value);
                animationSpeedValue.textContent = e.target.value;
            });
        }

        // Noise amplitude control
        const noiseAmplitudeSlider = document.getElementById('noiseAmplitude');
        const noiseAmplitudeValue = document.getElementById('noiseAmplitudeValue');
        if (noiseAmplitudeSlider && noiseAmplitudeValue) {
            noiseAmplitudeSlider.addEventListener('input', (e) => {
                this.config.noiseAmplitude = parseInt(e.target.value);
                noiseAmplitudeValue.textContent = e.target.value;
            });
        }
    }

    setupDragAndDrop() {
        // Store original points for snap-back functionality
        this.originalPoints = [...this.points];
        
        // Initialize piece offsets for separate pieces mode
        if (this.separatePieces) {
            this.pieceOffsets = new Array(this.points.length).fill(null).map(() => ({ x: 0, y: 0 }));
            // Only initialize z-index if not already set
            if (!this.pieceZIndex || this.pieceZIndex.length !== this.points.length) {
                this.pieceZIndex = new Array(this.points.length).fill(0);
            }
        }
    }

    startAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const animate = () => {
            if (this.config.isAnimating) {
                this.render();
                this.config.time += 0.01 * this.config.animationSpeed;
                this.snapAnimationTime += 0.02; // Update snap animation time
            }
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }

    createAnimatedPath(originalPolygon, offset = { x: 0, y: 0 }) {
        const animatedPath = [];
        const time = this.config.time;
        const amplitude = this.config.noiseAmplitude;
        
        for (let i = 0; i < originalPolygon.length; i++) {
            const [x, y] = originalPolygon[i];
            
            // Calculate noise-based offset
            const noiseX = this.noise.animatedNoise(x, y, time, 0.01, amplitude);
            const noiseY = this.noise.animatedNoise(x + 100, y + 100, time, 0.01, amplitude);
            
            // Apply only noise offset (not piece offset - that's applied during rendering)
            const animatedX = x + noiseX;
            const animatedY = y + noiseY;
            
            animatedPath.push([animatedX, animatedY]);
        }
        
        return animatedPath;
    }

    checkSnapToLocation(cellIndex) {
        const currentPoint = this.points[cellIndex];
        const originalPoint = this.originalPoints[cellIndex];
        
        // Check if close enough to original position to snap back
        const distance = Math.sqrt(
            (currentPoint[0] - originalPoint[0]) ** 2 + 
            (currentPoint[1] - originalPoint[1]) ** 2
        );
        
        if (distance < this.snapThreshold) {
            return {
                snapped: true,
                targetPosition: originalPoint
            };
        }
        
        return { snapped: false };
    }

    regenerateVoronoi() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Create new Voronoi diagram with updated points
        if (typeof d3 !== 'undefined' && d3.Delaunay) {
            this.voronoi = d3.Delaunay.from(this.points).voronoi([0, 0, width, height]);
        } else if (typeof Delaunay !== 'undefined') {
            this.voronoi = Delaunay.from(this.points).voronoi([0, 0, width, height]);
        } else {
            this.voronoi = this.createFallbackVoronoi();
        }
    }

    bringPieceToFront(cellIndex) {
        // Find the highest current z-index
        const maxZIndex = Math.max(...this.pieceZIndex, 0);
        
        // Set this piece to the front
        this.pieceZIndex[cellIndex] = maxZIndex + 1;
        
        // Log only the clicked piece's z-index (once per click)
        console.log(`🖱️  Piece ${cellIndex} → z:${this.pieceZIndex[cellIndex]}`);
    }

    regeneratePuzzle() {
        this.generateVoronoi();
        this.originalPoints = [...this.points];
        
        // Reset snap feedback but preserve z-index
        if (this.separatePieces) {
            // Only reset z-index if the number of pieces changed
            if (!this.pieceZIndex || this.pieceZIndex.length !== this.points.length) {
                this.pieceZIndex = new Array(this.points.length).fill(0);
            }
            this.snappedPieces.clear();
        }
    }

    toggleAnimation() {
        this.config.isAnimating = !this.config.isAnimating;
        const button = event.target;
        button.textContent = this.config.isAnimating ? 'Pause Animation' : 'Start Animation';
    }

    // Abstract methods to be implemented by subclasses
    render() {
        throw new Error('render() method must be implemented by subclass');
    }

    findCellAtPosition(x, y) {
        throw new Error('findCellAtPosition() method must be implemented by subclass');
    }

    handleMouseDown(e) {
        throw new Error('handleMouseDown() method must be implemented by subclass');
    }

    handleMouseMove(e) {
        throw new Error('handleMouseMove() method must be implemented by subclass');
    }

    handleMouseUp(e) {
        throw new Error('handleMouseUp() method must be implemented by subclass');
    }

    handleMouseLeave(e) {
        throw new Error('handleMouseLeave() method must be implemented by subclass');
    }
}

// Export classes
window.VoronoiConfig = VoronoiConfig;
window.VoronoiPuzzleBase = VoronoiPuzzleBase;
