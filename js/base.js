/**
 * Shared Base Classes and Utilities for Phantasm
 * Contains functionality used by both 2D and 3D renderers
 */

// Base configuration for Phantasm
class VoronoiConfig {
    constructor() {
        this.cellCount = 40;
        this.animationSpeed = 1.0;
        this.noiseAmplitude = 10;
        this.isAnimating = true;
        this.time = 0;
    }
}

// Base Phantasm puzzle class with shared functionality
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
        
        
        
        // Z-index and visual feedback
        this.pieceZIndex = []; // Track z-index for each piece
        this.snappedPieces = new Set(); // Track which pieces are snapped
        this.snapAnimationTime = 0; // Animation time for snap feedback
        this.hoveredPiece = -1; // Track which piece is being hovered
        
        // Solved state tracking
        this.isSolved = false;
        this.solveThreshold = 10; // pixels - how close pieces need to be to be considered "solved"
        
        // Event listener tracking for cleanup
        this.eventListeners = [];
    }

    async loadBackgroundImage() {
        // Use the same background image as the main FluidLock project
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.backgroundImage = img;
                resolve();
            };
            img.onerror = reject;
            // Use the base image from the current theme
            img.src = window.themeManager ? window.themeManager.getCurrentBaseImage() : './assets/Level-1.svg';
        });
    }

    setupCanvas() {
        // Use responsive canvas system if available
        if (window.responsiveCanvas) {
            window.responsiveCanvas.setupResponsiveCanvas(this.canvas);
        } else {
            // Fallback to fixed size
            this.setupFixedCanvas();
        }
        
        // Set canvas styling
        this.canvas.style.display = 'block';
        this.canvas.style.cursor = 'grab';
    }
    
    setupFixedCanvas() {
        // Set fixed canvas size based on 16:9 aspect ratio
        const baseWidth = 1200; // Fixed width
        const baseHeight = 675; // 16:9 aspect ratio (1200 / 1.777...)
        
        // Set canvas size - truly fixed
        this.canvas.width = baseWidth;
        this.canvas.height = baseHeight;
        this.canvas.style.width = baseWidth + 'px';
        this.canvas.style.height = baseHeight + 'px';
        
        // Make canvas truly fixed size
        this.canvas.style.margin = '0 auto';
        this.canvas.style.maxWidth = 'none';
        this.canvas.style.maxHeight = 'none';
        this.canvas.style.minWidth = baseWidth + 'px';
        this.canvas.style.minHeight = baseHeight + 'px';
        this.canvas.style.flexShrink = '0';
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
            this.voronoi = d3.Delaunay.from(this.points).voronoi([0, 0, width, height]);
        } else if (typeof Delaunay !== 'undefined') {
            this.voronoi = Delaunay.from(this.points).voronoi([0, 0, width, height]);
        } else {
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
                
                // Update WebGL renderer if available
                if (this.webglRenderer && this.webglRenderer.updateConfig) {
                    this.webglRenderer.updateConfig({ noiseAmplitude: this.config.noiseAmplitude });
                }
            });
        }
    }

    setupDragAndDrop() {
        // Store original points for snap-back functionality
        this.originalPoints = [...this.points];

        // Initialize piece offsets for separate pieces mode
        if (this.separatePieces) {
            // Only initialize z-index if not already set
            if (!this.pieceZIndex || this.pieceZIndex.length !== this.points.length) {
                this.pieceZIndex = new Array(this.points.length).fill(0);
            }
        }
        
        // Initialize solved state (puzzle starts solved since all pieces are in place)
        this.isSolved = true;
        this.onSolvedStateChanged(true);
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

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
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
        
        // CRITICAL FIX: Normalize z-indices more aggressively to prevent precision issues
        if (maxZIndex > 25) { // Reduced from 100 to 25 to prevent interaction issues
            this.normalizeZIndices();
        }
        
    }
    
    normalizeZIndices() {
        // Find the current maximum z-index
        const maxZ = Math.max(...this.pieceZIndex, 0);
        
        // If z-indices are getting too large, normalize them
        if (maxZ > 100) {
            // Create a mapping of current z-indices to new normalized values
            const sortedIndices = this.pieceZIndex
                .map((z, index) => ({ z, index }))
                .sort((a, b) => b.z - a.z); // Sort by z-index descending
            
            // Assign new normalized z-indices (0, 1, 2, 3, ...)
            sortedIndices.forEach((item, newZ) => {
                this.pieceZIndex[item.index] = newZ;
            });

            // Update WebGL renderer if available
            if (this.webglRenderer && this.webglRenderer.updatePieceZIndex) {
                for (let i = 0; i < this.pieceZIndex.length; i++) {
                    this.webglRenderer.updatePieceZIndex(i, this.pieceZIndex[i]);
                }
            }
        }
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
            // Reinitialize snappedPieces if it was disposed
            if (!this.snappedPieces) {
                this.snappedPieces = new Set();
            } else {
                this.snappedPieces.clear();
            }
        }
        
        // Reset solved state and check
        this.isSolved = true;
        this.onSolvedStateChanged(true);
    }

    toggleAnimation() {
        this.config.isAnimating = !this.config.isAnimating;
        const button = event.target;
        button.textContent = this.config.isAnimating ? 'Pause Animation' : 'Start Animation';
    }
    
    // Check if the puzzle is solved (all pieces are in correct positions)
    checkSolvedState() {
        // This method is overridden by webgl-renderer.js
        // Base implementation for compatibility
        return this.isSolved || false;
    }
    
    // Called when solved state changes
    onSolvedStateChanged(isSolved) {
        // KEEP: User-facing success message
        console.log(`🎉 Puzzle ${isSolved ? 'SOLVED' : 'UNSOLVED'}!`);
        
        // Add/remove solved class to canvas container
        const container = this.canvas.parentElement;
        if (container) {
            if (isSolved) {
                container.classList.add('puzzle-solved');
            } else {
                container.classList.remove('puzzle-solved');
            }
        }
        
        // Update canvas outline
        this.updateCanvasOutline(isSolved);
    }
    
    // Update canvas outline based on solved state
    updateCanvasOutline(isSolved) {
        if (isSolved) {
            this.canvas.style.border = '1px solid var(--solved-color, #00ff00)'; // Theme solved color
            this.canvas.style.boxShadow = '0 0 20px var(--solved-glow, rgba(0, 255, 0, 0.5))'; // Theme solved glow
        } else {
            this.canvas.style.border = 'none';
            this.canvas.style.boxShadow = 'none';
        }
    }


    // Helper method to track event listeners for cleanup
    addEventListener(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        this.eventListeners.push({ element, event, handler, options });
    }
    
    // Clean up all tracked event listeners
    removeAllEventListeners() {
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.eventListeners = [];
    }
    
    // Enhanced dispose method for proper cleanup
    dispose() {
        // Cancel animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Remove all event listeners
        this.removeAllEventListeners();
        
        // Nullify object references
        this.pieces = null;
        this.slots = null;
        this.pieceZIndex = null;
        this.snappedPieces = null;
        this.backgroundImage = null;
        this.voronoi = null;
        this.points = null;
        this.originalPoints = null;
        
        // KEEP: User-facing success message
        console.log('✅ Base class disposed and cleaned up');
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
