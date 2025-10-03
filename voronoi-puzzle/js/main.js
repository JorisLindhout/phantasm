/**
 * Voronoi Puzzle Main Controller
 */

class VoronoiPuzzle extends VoronoiPuzzleBase {
    constructor() {
        super();
        this.currentRenderer = null;
        this.useWebGL = true; // WebGL rendering enabled
        this.noise = new Noise(); // Shared noise instance
        
        this.init();
    }

    updateRendererStatus(status) {
        const statusElement = document.getElementById('rendererStatus');
        if (statusElement) {
            statusElement.textContent = `Renderer: ${status}`;
        }
    }

    async init() {
        try {
            // Initialize with the appropriate renderer
            await this.initializeRenderer();
        } catch (error) {
            console.error('Error initializing Voronoi puzzle:', error);
        }
    }

    async initializeRenderer() {
        // Clean up existing renderer
        if (this.currentRenderer) {
            if (this.currentRenderer.dispose) {
                this.currentRenderer.dispose();
            }
            this.currentRenderer = null;
        }

        // Use WebGL renderer for 3D puzzle rendering
        if (typeof WebGLRenderer !== 'undefined' && typeof isWebGLSupported !== 'undefined') {
            if (isWebGLSupported()) {
                try {
                    // Create WebGL renderer
                    this.currentRenderer = new WebGLRenderer();
                    await this.currentRenderer.init();
                    
                    // WebGL renderer is accessible via getter
                    
                    if (this.webglRenderer && this.webglRenderer.debugLogging && this.webglRenderer.debugLogging.rendererSwitching) {
                        console.log('✅ Using WebGL renderer for proper z-index layering');
                        console.log('🔍 Current renderer type:', this.currentRenderer.constructor.name);
                        console.log('🔍 WebGL renderer type:', this.webglRenderer ? this.webglRenderer.constructor.name : 'undefined');
                    }
                    this.updateRendererStatus('WebGL (with true z-index layering)');
                    
                    // Add WebGL mode class to container
                    const container = document.querySelector('.puzzle-container');
                    if (container) {
                        container.classList.add('webgl-mode');
                    }
                } catch (error) {
                    console.error('❌ WebGL initialization failed:', error.message);
                    throw new Error('WebGL is required for this puzzle. Please use a modern browser with WebGL support.');
                }
            } else {
                throw new Error('WebGL is not supported by this browser. Please use a modern browser with WebGL support.');
            }
        } else {
            throw new Error('WebGL components are not available. Please ensure all WebGL files are loaded.');
        }
    }


    // Control functions


    // Getter for WebGL renderer access
    get webglRenderer() {
        return this.currentRenderer && this.currentRenderer.webglRenderer ? this.currentRenderer.webglRenderer : null;
    }

    // Override base class methods to work with WebGL renderer
    regeneratePuzzle() {
        // Use base class method
        super.regeneratePuzzle();
        
        // Also regenerate WebGL renderer if available
        if (this.currentRenderer && this.currentRenderer.regeneratePuzzle) {
            this.currentRenderer.regeneratePuzzle();
        }
    }

    toggleAnimation() {
        // Use base class method
        super.toggleAnimation();
        
        // Also toggle WebGL renderer if available
        if (this.currentRenderer && this.currentRenderer.toggleAnimation) {
            this.currentRenderer.toggleAnimation();
        }
    }

    // Getters for accessing renderer properties
    get webglConfig() {
        return this.currentRenderer ? this.currentRenderer.config : null;
    }

    generateVoronoi() {
        // Use base class method
        super.generateVoronoi();
        
        // Also generate WebGL renderer if available
        if (this.currentRenderer && this.currentRenderer.generateVoronoi) {
            this.currentRenderer.generateVoronoi();
        }
    }

    render() {
        // Delegate to WebGL renderer if available
        if (this.currentRenderer && this.currentRenderer.render) {
            this.currentRenderer.render();
        }
    }
}

/**
 * WebGL Renderer that combines WebGL rendering with base class functionality
 */
class WebGLRenderer extends VoronoiPuzzleBase {
    constructor() {
        super();
        this.webglRenderer = null;
        this.noise = new Noise();
    }

    async init() {
        try {
            await this.loadBackgroundImage();
            this.setupCanvas();
            
            // Initialize WebGL renderer with config
            this.webglRenderer = new WebGLVoronoiRenderer(this.canvas, this.config);
            await this.webglRenderer.loadBackgroundTexture('./assets/base-image-cube.svg');
            
            this.generateVoronoi();
            this.setupControls();
            this.setupDragAndDrop();
            this.startAnimation();
        } catch (error) {
            console.error('Error initializing WebGL hybrid renderer:', error);
            throw error;
        }
    }

    setupDragAndDrop() {
        super.setupDragAndDrop();
        
        // Use WebGL canvas for events
        const eventCanvas = this.webglRenderer.canvas;
        
        // Mouse event handlers
        eventCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        eventCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        eventCanvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        eventCanvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
        
        // Touch event handlers for mobile
        eventCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleMouseDown(e.touches[0]);
        });
        eventCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMouseMove(e.touches[0]);
        });
        eventCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp(e);
        });
    }

    generateVoronoi() {
        super.generateVoronoi();
        
        // Create WebGL pieces
        if (this.webglRenderer) {
            this.createWebGLPieces();
        }
    }

    createWebGLPieces() {
        if (!this.voronoi || !this.webglRenderer) return;
        
        console.log('Initializing WebGL Voronoi...');
        
        // Get polygons from Voronoi diagram
        const polygonGenerator = this.voronoi.cellPolygons();
        const polygons = Array.from(polygonGenerator);
        
        // Initialize the connected Voronoi system
        this.webglRenderer.initializeVoronoi(polygons);
        
        console.log(`✅ Initialized WebGL Voronoi with ${polygons.length} pieces`);
    }

    render() {
        if (!this.voronoi || !this.backgroundImage) return;
        
        // Hide Canvas 2D and use WebGL renderer
        this.canvas.style.display = 'none';
        if (this.webglRenderer) {
            this.webglRenderer.render();
        }
    }

    findCellAtPosition(x, y) {
        // Use WebGL hit detection
        if (this.webglRenderer) {
            return this.webglRenderer.findPieceAtPosition(x, y);
        }
        return -1;
    }
    
    findCellAtPositionImproved(x, y) {
        // Use WebGL renderer's hit detection if available (for better slot detection)
        if (this.webglRenderer) {
            // Skip the dragged piece when looking for slots during drag
            const skipDraggedPiece = this.isDragging;
            const webglResult = this.webglRenderer.findPieceAtPosition(x, y, skipDraggedPiece);
            if (webglResult !== -1) {
                console.log(`🎯 WebGL hit detection result:`, webglResult);
                return webglResult;
            }
        }
        
        // Fallback to standard hit detection
        let cellIndex = this.findCellAtPosition(x, y);
        
        if (cellIndex !== -1) {
            console.log(`🎯 Standard hit detection found piece ${cellIndex}`);
            return cellIndex;
        }
        
        // If that fails, try expanded hit detection with larger tolerance
        const tolerance = 20; // pixels
        const searchPoints = [
            [x, y], // Original point
            [x - tolerance, y], [x + tolerance, y], // Left/right
            [x, y - tolerance], [x, y + tolerance], // Up/down
            [x - tolerance/2, y - tolerance/2], [x + tolerance/2, y - tolerance/2], // Diagonals
            [x - tolerance/2, y + tolerance/2], [x + tolerance/2, y + tolerance/2]
        ];
        
        for (const [testX, testY] of searchPoints) {
            cellIndex = this.findCellAtPosition(testX, testY);
            if (cellIndex !== -1) {
                console.log(`🎯 Expanded hit detection found piece ${cellIndex} at offset (${testX-x}, ${testY-y})`);
                return cellIndex;
            }
        }
        
        console.log(`🎯 No piece found at (${x}, ${y}) even with expanded search`);
        return -1;
    }

    handleMouseDown(e) {
        // Only reset interaction state if we're already dragging
        if (this.isDragging) {
            this.resetInteractionState();
        }
        
        const coords = VoronoiUtils.getCanvasCoordinates(e, this.webglRenderer.canvas);
        const x = coords.x;
        const y = coords.y;
        
        console.log(`🖱️ Mouse down at (${x}, ${y})`);
        
        // Find which cell was clicked with improved hit detection
        const hitResult = this.findCellAtPositionImproved(x, y);
        console.log(`🎯 Hit detection result:`, hitResult);
        
        // Only activate if we hit a piece (not a slot)
        const isSlot = hitResult && typeof hitResult === 'object' && hitResult.type === 'slot';
        const cellIndex = isSlot ? -1 : hitResult;
        
        if (cellIndex !== -1) {
            console.log(`✅ Activating piece ${cellIndex}`);
            // Clear any existing slot hover when starting to drag a piece
            if (this.hoveredSlot !== undefined && this.webglRenderer) {
                this.webglRenderer.updateSlotHover(this.hoveredSlot, false, false);
                this.hoveredSlot = undefined;
            }
            // Activate the piece
            this.activatePiece(cellIndex, x, y);
        } else if (isSlot) {
            console.log(`🎰 Clicked on slot ${hitResult.index}, not activating`);
        } else {
            console.log(`❌ No piece found at click position`);
        }
    }
    
    activatePiece(cellIndex, x, y) {
        console.log(`✨ Activating piece ${cellIndex}`);
        console.log(`🔍 Debug: this.points:`, this.points);
        console.log(`🔍 Debug: this.originalPoints:`, this.originalPoints);
        console.log(`🔍 Debug: cellIndex:`, cellIndex, 'points.length:', this.points?.length);
        
        // Safety check: ensure points array exists and has the right index
        if (!this.points || !this.points[cellIndex]) {
            console.error(`❌ Cannot activate piece ${cellIndex}: points array not properly initialized`);
            console.error(`❌ this.points:`, this.points);
            return;
        }
        
        // Bring clicked piece to front (highest z-index)
        this.bringPieceToFront(cellIndex);
        
        // Set drag state
        this.isDragging = true;
        this.draggedCellIndex = cellIndex;
        
        // Calculate current piece position (original + any existing offset)
        const currentOffset = this.pieceOffsets[cellIndex] || { x: 0, y: 0 };
        const currentPieceX = this.points[cellIndex][0] + currentOffset.x;
        const currentPieceY = this.points[cellIndex][1] + currentOffset.y;
        
        // Calculate drag offset from current position, not original position
        this.dragOffset.x = x - currentPieceX;
        this.dragOffset.y = y - currentPieceY;
        
        console.log(`🎯 Piece ${cellIndex} drag offset calculation:`);
        console.log(`   Original position: (${this.points[cellIndex][0]}, ${this.points[cellIndex][1]})`);
        console.log(`   Current offset: (${currentOffset.x}, ${currentOffset.y})`);
        console.log(`   Current position: (${currentPieceX}, ${currentPieceY})`);
        console.log(`   Mouse position: (${x}, ${y})`);
        console.log(`   Drag offset: (${this.dragOffset.x}, ${this.dragOffset.y})`);
        
        // Notify WebGL renderer about dragging state
        if (this.webglRenderer && this.webglRenderer.setDraggingState) {
            this.webglRenderer.setDraggingState(true, cellIndex);
        }
        
        // Store original position for snap-back
        if (!this.originalPoints) {
            this.originalPoints = [];
        }
        this.originalPoints[cellIndex] = [...this.points[cellIndex]];
        
        // Update visual state to dragging
        if (this.webglRenderer) {
            this.webglRenderer.updatePieceVisualState(cellIndex, 'dragging');
            this.webglRenderer.canvas.style.cursor = 'grabbing';
        }
        
        console.log(`🎮 Piece ${cellIndex} activated for dragging`);
    }
    
    resetInteractionState() {
        if (this.isDragging && this.draggedCellIndex !== -1) {
            console.log(`🔄 Resetting interaction state for piece ${this.draggedCellIndex}`);
            
            // Reset visual state
            if (this.webglRenderer) {
                this.webglRenderer.updatePieceVisualState(this.draggedCellIndex, 'normal');
            }
        }
        
        // Reset drag slot hover state
        if (this.dragHoveredSlot !== undefined && this.webglRenderer) {
            this.webglRenderer.updateSlotHover(this.dragHoveredSlot, false, false);
            this.dragHoveredSlot = undefined;
        }
        
        // Clear all interaction state
        this.isDragging = false;
        this.draggedCellIndex = -1;
        this.dragOffset = { x: 0, y: 0 };
        
        // Notify WebGL renderer about stopping drag
        if (this.webglRenderer && this.webglRenderer.setDraggingState) {
            this.webglRenderer.setDraggingState(false, -1);
        }
        
        // Reset cursor
        if (this.webglRenderer) {
            this.webglRenderer.canvas.style.cursor = 'default';
        }
    }

    handleMouseMove(e) {
        const coords = VoronoiUtils.getCanvasCoordinates(e, this.webglRenderer.canvas);
        const x = coords.x;
        const y = coords.y;
        
        // Handle hover effects when not dragging
        if (!this.isDragging) {
            const hoveredResult = this.findCellAtPositionImproved(x, y);
            
            // Check if we got a slot or piece result
            const isSlot = hoveredResult && typeof hoveredResult === 'object' && hoveredResult.type === 'slot';
            const hoveredPiece = isSlot ? -1 : hoveredResult;
            const hoveredSlot = isSlot ? hoveredResult.index : -1;
            
            // Handle piece hover changes
            if (hoveredPiece !== this.hoveredPiece) {
                console.log(`🖱️ Piece hover change: ${this.hoveredPiece} → ${hoveredPiece}`);
                
                // Reset previous hovered piece
                if (this.hoveredPiece !== -1 && this.webglRenderer) {
                    this.webglRenderer.updatePieceVisualState(this.hoveredPiece, 'normal');
                }
                
                this.hoveredPiece = hoveredPiece;
                
                // Update new hovered piece
                if (hoveredPiece !== -1 && this.webglRenderer) {
                    console.log(`✨ Setting hover effect for piece ${hoveredPiece}`);
                    this.webglRenderer.updatePieceVisualState(hoveredPiece, 'hover');
                    this.webglRenderer.canvas.style.cursor = 'grab';
                }
            }
            
            // Handle slot hover changes (only during normal hover, not dragging)
            if (hoveredSlot !== (this.hoveredSlot || -1)) {
                console.log(`🎰 Slot hover change: ${this.hoveredSlot || -1} → ${hoveredSlot}`);
                
                // Reset previous hovered slot
                if ((this.hoveredSlot || -1) !== -1 && this.webglRenderer) {
                    this.webglRenderer.updateSlotHover(this.hoveredSlot, false, false);
                }
                
                this.hoveredSlot = hoveredSlot === -1 ? undefined : hoveredSlot;
                
                // Update new hovered slot (only show outline, not background during normal hover)
                if (hoveredSlot !== -1 && this.webglRenderer) {
                    console.log(`✨ Setting hover effect for slot ${hoveredSlot}`);
                    // Only show outline hover during normal hover, not background fill
                    this.webglRenderer.updateSlotHover(hoveredSlot, true, false); // false = not drag hover
                    this.webglRenderer.canvas.style.cursor = 'grab';
                }
            }
            
            // Set cursor based on what's hovered
            if (hoveredPiece === -1 && hoveredSlot === -1 && this.webglRenderer) {
                this.webglRenderer.canvas.style.cursor = 'default';
            }
            
            return;
        }
        
        // Handle dragging
        if (this.draggedCellIndex === -1) return;
        
        // Safety check: ensure original points exist
        if (!this.originalPoints || !this.originalPoints[this.draggedCellIndex]) {
            console.error(`❌ Cannot move piece ${this.draggedCellIndex}: originalPoints not initialized`);
            return;
        }
        
        // Update piece offset for separate pieces
        this.pieceOffsets[this.draggedCellIndex] = {
            x: x - this.dragOffset.x - this.originalPoints[this.draggedCellIndex][0],
            y: y - this.dragOffset.y - this.originalPoints[this.draggedCellIndex][1]
        };
        
        // Update WebGL piece position
        if (this.webglRenderer) {
            this.webglRenderer.updatePiecePosition(this.draggedCellIndex, this.pieceOffsets[this.draggedCellIndex]);
        }
        
        // Handle slot hover while dragging (show which slot the piece would drop into)
        this.handleDragSlotHover(x, y);
        
        // Remove from snapped pieces if moved away from original position
        const currentOffset = this.pieceOffsets[this.draggedCellIndex];
        const distance = Math.sqrt(currentOffset.x * currentOffset.x + currentOffset.y * currentOffset.y);
        if (distance > this.snapThreshold) {
            this.snappedPieces.delete(this.draggedCellIndex);
        }
    }

    handleMouseUp(e) {
        console.log(`🖱️ Mouse up - isDragging: ${this.isDragging}, draggedCellIndex: ${this.draggedCellIndex}`);
        
        if (!this.isDragging || this.draggedCellIndex === -1) {
            // Even if no piece was being dragged, ensure clean state
            this.resetInteractionState();
            return;
        }
        
        const draggedIndex = this.draggedCellIndex;
        
        // For separate pieces, check if close to original position
        const currentOffset = this.pieceOffsets[draggedIndex] || { x: 0, y: 0 };
        const distance = Math.sqrt(currentOffset.x ** 2 + currentOffset.y ** 2);
        
        console.log(`📏 Piece ${draggedIndex} distance from origin: ${distance.toFixed(1)}px (threshold: ${this.snapThreshold}px)`);
        
        if (distance < this.snapThreshold) {
            console.log(`📌 Piece ${draggedIndex} snapping back to original position`);
            
            // Snap back to original position
            this.pieceOffsets[draggedIndex] = { x: 0, y: 0 };
            
            // Add visual feedback for snap
            this.snappedPieces.add(draggedIndex);
            this.snapAnimationTime = 0; // Reset animation
            
            // Update visual state to snapped
            if (this.webglRenderer) {
                this.webglRenderer.updatePieceVisualState(draggedIndex, 'snapped');
                this.webglRenderer.updatePiecePosition(draggedIndex, { x: 0, y: 0 });
            }
            
            // Reset snapped state after animation
            setTimeout(() => {
                this.snappedPieces.delete(draggedIndex);
                if (this.webglRenderer) {
                    this.webglRenderer.updatePieceVisualState(draggedIndex, 'normal');
                }
                console.log(`✨ Piece ${draggedIndex} snap animation completed`);
            }, 2000);
        } else {
            console.log(`🎯 Piece ${draggedIndex} remains at offset position`);
            
            // Update visual state to normal (not snapped)
            if (this.webglRenderer) {
                this.webglRenderer.updatePieceVisualState(draggedIndex, 'normal');
            }
        }
        
        // Always reset interaction state after handling the drop
        this.resetInteractionState();
        
        // Check if puzzle is solved after piece movement
        if (this.webglRenderer && this.webglRenderer.checkSolvedState) {
            this.webglRenderer.checkSolvedState();
        }
        
        console.log(`🏁 Mouse up completed for piece ${draggedIndex}`);
    }
    
    handleDragSlotHover(x, y) {
        // During dragging, check for slot hover to show drop target feedback
        const hoveredResult = this.findCellAtPositionImproved(x, y);
        
        // During dragging, we want to show slot hover only for the specific slot being hovered
        let dragSlot = -1;
        
        if (hoveredResult !== -1) {
            if (typeof hoveredResult === 'object' && hoveredResult.type === 'slot') {
                // Hit an empty slot - show hover for this slot
                dragSlot = hoveredResult.index;
            } else if (typeof hoveredResult === 'number') {
                // Hit a piece - only show hover if it's NOT the piece being dragged
                // (we don't want to show hover for the dragged piece's original slot)
                if (hoveredResult !== this.draggedCellIndex) {
                    dragSlot = hoveredResult;
                }
            }
        }
        
        // Handle slot hover changes during drag
        if (dragSlot !== (this.dragHoveredSlot || -1)) {
            
            // Reset previous drag hovered slot
            if ((this.dragHoveredSlot || -1) !== -1 && this.webglRenderer) {
                this.webglRenderer.updateSlotHover(this.dragHoveredSlot, false, false);
            }
            
            this.dragHoveredSlot = dragSlot === -1 ? undefined : dragSlot;
            
            // Update new drag hovered slot (only for empty slots)
            if (dragSlot !== -1 && this.webglRenderer) {
                // Check if the slot is empty before showing hover effect
                if (this.webglRenderer.slotStates && this.webglRenderer.slotStates[dragSlot] === 'empty') {
                    this.webglRenderer.updateSlotHover(dragSlot, true, true); // true = isDragHover
                }
            }
        }
    }

    handleMouseLeave(e) {
        // Reset hover state when mouse leaves canvas
        // Reset piece hover visual state
        if (this.hoveredPiece !== -1 && this.webglRenderer) {
            this.webglRenderer.updatePieceVisualState(this.hoveredPiece, 'normal');
        }
        this.hoveredPiece = -1;
        
        // Reset slot hover state
        if (this.hoveredSlot !== undefined && this.webglRenderer) {
            this.webglRenderer.updateSlotHover(this.hoveredSlot, false);
            this.hoveredSlot = undefined;
        }
        
        // Reset drag slot hover state
        if (this.dragHoveredSlot !== undefined && this.webglRenderer) {
            this.webglRenderer.updateSlotHover(this.dragHoveredSlot, false, false);
            this.dragHoveredSlot = undefined;
        }
        
        if (this.webglRenderer) {
            this.webglRenderer.canvas.style.cursor = 'default';
        }
    }

    bringPieceToFront(cellIndex) {
        super.bringPieceToFront(cellIndex);
        
        // Update WebGL piece z-index
        if (this.webglRenderer) {
            this.webglRenderer.updatePieceZIndex(cellIndex, this.pieceZIndex[cellIndex]);
        }
    }

    dispose() {
        if (this.webglRenderer) {
            this.webglRenderer.dispose();
            this.webglRenderer = null;
        }
    }
}

/**
 * WebGL Renderer for 3D Voronoi puzzle rendering
 */
// WebGL renderer is now handled by the WebGLVoronoiRenderer class in webgl-renderer.js
/*
class WebGLRenderer extends VoronoiPuzzleBase {
    constructor() {
        super();
        this.webglRenderer = null;
        this.noise = new Noise();
    }

    async init() {
        try {
            await this.loadBackgroundImage();
            this.setupCanvas();
            
            // Initialize WebGL renderer with config
            this.webglRenderer = new WebGLVoronoiRenderer(this.canvas, this.config);
            await this.webglRenderer.loadBackgroundTexture('./assets/base-image-cube.svg');
            
            this.generateVoronoi();
            this.setupControls();
            this.setupDragAndDrop();
            this.startAnimation();
        } catch (error) {
            console.error('Error initializing WebGL renderer:', error);
            throw error;
        }
    }

    setupDragAndDrop() {
        super.setupDragAndDrop();
        
        // Use WebGL canvas for events
        const eventCanvas = this.webglRenderer.canvas;
        
        // Mouse event handlers
        eventCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        eventCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        eventCanvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        eventCanvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
        
        // Touch event handlers for mobile
        eventCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleMouseDown(e.touches[0]);
        });
        eventCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMouseMove(e.touches[0]);
        });
        eventCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp(e);
        });
    }

    generateVoronoi() {
        super.generateVoronoi();
        
        // Create WebGL pieces
        if (this.webglRenderer) {
            this.createWebGLPieces();
        }
    }

    createWebGLPieces() {
        if (!this.voronoi || !this.webglRenderer) return;
        
        console.log('Initializing WebGL Voronoi...');
        
        // Get polygons from Voronoi diagram
        const polygonGenerator = this.voronoi.cellPolygons();
        const polygons = Array.from(polygonGenerator);
        
        // Initialize the connected Voronoi system
        this.webglRenderer.initializeVoronoi(polygons);
        
        console.log(`✅ Initialized WebGL Voronoi with ${polygons.length} pieces`);
    }

    render() {
        if (!this.voronoi || !this.backgroundImage) return;
        
        // Hide Canvas 2D and use WebGL renderer
        this.canvas.style.display = 'none';
        if (this.webglRenderer) {
            this.webglRenderer.render();
        }
    }

    findCellAtPosition(x, y) {
        // Use WebGL hit detection
        if (this.webglRenderer) {
            return this.webglRenderer.findPieceAtPosition(x, y);
        }
        return -1;
    }
    
    findCellAtPositionImproved(x, y) {
        // Use WebGL renderer's hit detection if available (for better slot detection)
        if (this.webglRenderer) {
            // Skip the dragged piece when looking for slots during drag
            const skipDraggedPiece = this.isDragging;
            const webglResult = this.webglRenderer.findPieceAtPosition(x, y, skipDraggedPiece);
            if (webglResult !== -1) {
                console.log(`🎯 WebGL hit detection result:`, webglResult);
                return webglResult;
            }
        }
        
        // Fallback to standard hit detection
        let cellIndex = this.findCellAtPosition(x, y);
        
        if (cellIndex !== -1) {
            console.log(`🎯 Standard hit detection found piece ${cellIndex}`);
            return cellIndex;
        }
        
        // If that fails, try expanded hit detection with larger tolerance
        const tolerance = 20; // pixels
        const searchPoints = [
            [x, y], // Original point
            [x - tolerance, y], [x + tolerance, y], // Left/right
            [x, y - tolerance], [x, y + tolerance], // Up/down
            [x - tolerance/2, y - tolerance/2], [x + tolerance/2, y - tolerance/2], // Diagonals
            [x - tolerance/2, y + tolerance/2], [x + tolerance/2, y + tolerance/2]
        ];
        
        for (const [testX, testY] of searchPoints) {
            cellIndex = this.findCellAtPosition(testX, testY);
            if (cellIndex !== -1) {
                console.log(`🎯 Expanded hit detection found piece ${cellIndex} at offset (${testX-x}, ${testY-y})`);
                return cellIndex;
            }
        }
        
        console.log(`🎯 No piece found at (${x}, ${y}) even with expanded search`);
        return -1;
    }

    handleMouseDown(e) {
        // Only reset interaction state if we're already dragging
        if (this.isDragging) {
            this.resetInteractionState();
        }
        
        const coords = VoronoiUtils.getCanvasCoordinates(e, this.webglRenderer.canvas);
        const x = coords.x;
        const y = coords.y;
        
        console.log(`🖱️ Mouse down at (${x}, ${y})`);
        
        // Find which cell was clicked with improved hit detection
        const hitResult = this.findCellAtPositionImproved(x, y);
        console.log(`🎯 Hit detection result:`, hitResult);
        
        // Only activate if we hit a piece (not a slot)
        const isSlot = hitResult && typeof hitResult === 'object' && hitResult.type === 'slot';
        const cellIndex = isSlot ? -1 : hitResult;
        
        if (cellIndex !== -1) {
            console.log(`✅ Activating piece ${cellIndex}`);
            // Clear any existing slot hover when starting to drag a piece
            if (this.hoveredSlot !== undefined && this.webglRenderer) {
                this.webglRenderer.updateSlotHover(this.hoveredSlot, false, false);
                this.hoveredSlot = undefined;
            }
            // Activate the piece
            this.activatePiece(cellIndex, x, y);
        } else if (isSlot) {
            console.log(`🎰 Clicked on slot ${hitResult.index}, not activating`);
        } else {
            console.log(`❌ No piece found at click position`);
        }
    }
    
    activatePiece(cellIndex, x, y) {
        console.log(`✨ Activating piece ${cellIndex}`);
        console.log(`🔍 Debug: this.points:`, this.points);
        console.log(`🔍 Debug: this.originalPoints:`, this.originalPoints);
        console.log(`🔍 Debug: cellIndex:`, cellIndex, 'points.length:', this.points?.length);
        
        // Safety check: ensure points array exists and has the right index
        if (!this.points || !this.points[cellIndex]) {
            console.error(`❌ Cannot activate piece ${cellIndex}: points array not properly initialized`);
            console.error(`❌ this.points:`, this.points);
            return;
        }
        
        // Bring clicked piece to front (highest z-index)
        this.bringPieceToFront(cellIndex);
        
        // Set drag state
        this.isDragging = true;
        this.draggedCellIndex = cellIndex;
        
        // Calculate current piece position (original + any existing offset)
        const currentOffset = this.pieceOffsets[cellIndex] || { x: 0, y: 0 };
        const currentPieceX = this.points[cellIndex][0] + currentOffset.x;
        const currentPieceY = this.points[cellIndex][1] + currentOffset.y;
        
        // Calculate drag offset from current position, not original position
        this.dragOffset.x = x - currentPieceX;
        this.dragOffset.y = y - currentPieceY;
        
        console.log(`🎯 Piece ${cellIndex} drag offset calculation:`);
        console.log(`   Original position: (${this.points[cellIndex][0]}, ${this.points[cellIndex][1]})`);
        console.log(`   Current offset: (${currentOffset.x}, ${currentOffset.y})`);
        console.log(`   Current position: (${currentPieceX}, ${currentPieceY})`);
        console.log(`   Mouse position: (${x}, ${y})`);
        console.log(`   Drag offset: (${this.dragOffset.x}, ${this.dragOffset.y})`);
        
        // Notify WebGL renderer about dragging state
        if (this.webglRenderer && this.webglRenderer.setDraggingState) {
            this.webglRenderer.setDraggingState(true, cellIndex);
        }
        
        // Store original position for snap-back
        if (!this.originalPoints) {
            this.originalPoints = [];
        }
        this.originalPoints[cellIndex] = [...this.points[cellIndex]];
        
        // Update visual state to dragging
        if (this.webglRenderer) {
            this.webglRenderer.updatePieceVisualState(cellIndex, 'dragging');
            this.webglRenderer.canvas.style.cursor = 'grabbing';
        }
        
        console.log(`🎮 Piece ${cellIndex} activated for dragging`);
    }
    
    resetInteractionState() {
        if (this.isDragging && this.draggedCellIndex !== -1) {
            console.log(`🔄 Resetting interaction state for piece ${this.draggedCellIndex}`);
            
            // Reset visual state
            if (this.webglRenderer) {
                this.webglRenderer.updatePieceVisualState(this.draggedCellIndex, 'normal');
            }
        }
        
        // Reset drag slot hover state
        if (this.dragHoveredSlot !== undefined && this.webglRenderer) {
            this.webglRenderer.updateSlotHover(this.dragHoveredSlot, false, false);
            this.dragHoveredSlot = undefined;
        }
        
        // Clear all interaction state
        this.isDragging = false;
        this.draggedCellIndex = -1;
        this.dragOffset = { x: 0, y: 0 };
        
        // Notify WebGL renderer about stopping drag
        if (this.webglRenderer && this.webglRenderer.setDraggingState) {
            this.webglRenderer.setDraggingState(false, -1);
        }
        
        // Reset cursor
        if (this.webglRenderer) {
            this.webglRenderer.canvas.style.cursor = 'default';
        }
    }

    handleMouseMove(e) {
        const coords = VoronoiUtils.getCanvasCoordinates(e, this.webglRenderer.canvas);
        const x = coords.x;
        const y = coords.y;
        
        // Handle hover effects when not dragging
        if (!this.isDragging) {
            const hoveredResult = this.findCellAtPositionImproved(x, y);
            
            // Check if we got a slot or piece result
            const isSlot = hoveredResult && typeof hoveredResult === 'object' && hoveredResult.type === 'slot';
            const hoveredPiece = isSlot ? -1 : hoveredResult;
            const hoveredSlot = isSlot ? hoveredResult.index : -1;
            
            // Handle piece hover changes
            if (hoveredPiece !== this.hoveredPiece) {
                console.log(`🖱️ Piece hover change: ${this.hoveredPiece} → ${hoveredPiece}`);
                
                // Reset previous hovered piece
                if (this.hoveredPiece !== -1 && this.webglRenderer) {
                    this.webglRenderer.updatePieceVisualState(this.hoveredPiece, 'normal');
                }
                
                this.hoveredPiece = hoveredPiece;
                
                // Update new hovered piece
                if (hoveredPiece !== -1 && this.webglRenderer) {
                    if (this.webglRenderer.debugLogging.hoverEffects) {
                        console.log(`✨ Setting hover effect for piece ${hoveredPiece}`);
                    }
                    this.webglRenderer.updatePieceVisualState(hoveredPiece, 'hover');
                    this.webglRenderer.canvas.style.cursor = 'grab';
                }
            }
            
            // Handle slot hover changes (only during normal hover, not dragging)
            if (hoveredSlot !== (this.hoveredSlot || -1)) {
                console.log(`🎰 Slot hover change: ${this.hoveredSlot || -1} → ${hoveredSlot}`);
                
                // Reset previous hovered slot
                if ((this.hoveredSlot || -1) !== -1 && this.webglRenderer) {
                    this.webglRenderer.updateSlotHover(this.hoveredSlot, false, false);
                }
                
                this.hoveredSlot = hoveredSlot === -1 ? undefined : hoveredSlot;
                
                // Update new hovered slot (only show outline, not background during normal hover)
                if (hoveredSlot !== -1 && this.webglRenderer) {
                    if (this.webglRenderer.debugLogging.hoverEffects) {
                        console.log(`✨ Setting hover effect for slot ${hoveredSlot}`);
                    }
                    // Only show outline hover during normal hover, not background fill
                    this.webglRenderer.updateSlotHover(hoveredSlot, true, false); // false = not drag hover
                    this.webglRenderer.canvas.style.cursor = 'grab';
                }
            }
            
            // Set cursor based on what's hovered
            if (hoveredPiece === -1 && hoveredSlot === -1 && this.webglRenderer) {
                this.webglRenderer.canvas.style.cursor = 'default';
            }
            
            return;
        }
        
        // Handle dragging
        if (this.draggedCellIndex === -1) return;
        
        // Safety check: ensure original points exist
        if (!this.originalPoints || !this.originalPoints[this.draggedCellIndex]) {
            console.error(`❌ Cannot move piece ${this.draggedCellIndex}: originalPoints not initialized`);
            return;
        }
        
        // Update piece offset for separate pieces
        this.pieceOffsets[this.draggedCellIndex] = {
            x: x - this.dragOffset.x - this.originalPoints[this.draggedCellIndex][0],
            y: y - this.dragOffset.y - this.originalPoints[this.draggedCellIndex][1]
        };
        
        // Update WebGL piece position
        if (this.webglRenderer) {
            this.webglRenderer.updatePiecePosition(this.draggedCellIndex, this.pieceOffsets[this.draggedCellIndex]);
        }
        
        // Handle slot hover while dragging (show which slot the piece would drop into)
        this.handleDragSlotHover(x, y);
        
        // Remove from snapped pieces if moved away from original position
        const currentOffset = this.pieceOffsets[this.draggedCellIndex];
        const distance = Math.sqrt(currentOffset.x * currentOffset.x + currentOffset.y * currentOffset.y);
        if (distance > this.snapThreshold) {
            this.snappedPieces.delete(this.draggedCellIndex);
        }
    }

    handleMouseUp(e) {
        console.log(`🖱️ Mouse up - isDragging: ${this.isDragging}, draggedCellIndex: ${this.draggedCellIndex}`);
        
        if (!this.isDragging || this.draggedCellIndex === -1) {
            // Even if no piece was being dragged, ensure clean state
            this.resetInteractionState();
            return;
        }
        
        const draggedIndex = this.draggedCellIndex;
        
        // For separate pieces, check if close to original position
        const currentOffset = this.pieceOffsets[draggedIndex] || { x: 0, y: 0 };
        const distance = Math.sqrt(currentOffset.x ** 2 + currentOffset.y ** 2);
        
        console.log(`📏 Piece ${draggedIndex} distance from origin: ${distance.toFixed(1)}px (threshold: ${this.snapThreshold}px)`);
        
        if (distance < this.snapThreshold) {
            console.log(`📌 Piece ${draggedIndex} snapping back to original position`);
            
            // Snap back to original position
            this.pieceOffsets[draggedIndex] = { x: 0, y: 0 };
            
            // Add visual feedback for snap
            this.snappedPieces.add(draggedIndex);
            this.snapAnimationTime = 0; // Reset animation
            
            // Update visual state to snapped
            if (this.webglRenderer) {
                this.webglRenderer.updatePieceVisualState(draggedIndex, 'snapped');
                this.webglRenderer.updatePiecePosition(draggedIndex, { x: 0, y: 0 });
            }
            
            // Reset snapped state after animation
            setTimeout(() => {
                this.snappedPieces.delete(draggedIndex);
                if (this.webglRenderer) {
                    this.webglRenderer.updatePieceVisualState(draggedIndex, 'normal');
                }
                console.log(`✨ Piece ${draggedIndex} snap animation completed`);
            }, 2000);
        } else {
            console.log(`🎯 Piece ${draggedIndex} remains at offset position`);
            
            // Update visual state to normal (not snapped)
            if (this.webglRenderer) {
                this.webglRenderer.updatePieceVisualState(draggedIndex, 'normal');
            }
        }
        
        // Always reset interaction state after handling the drop
        this.resetInteractionState();
        
        // Check if puzzle is solved after piece movement
        if (this.webglRenderer && this.webglRenderer.checkSolvedState) {
            this.webglRenderer.checkSolvedState();
        }
        
        console.log(`🏁 Mouse up completed for piece ${draggedIndex}`);
    }
    
    handleDragSlotHover(x, y) {
        // During dragging, check for slot hover to show drop target feedback
        const hoveredResult = this.findCellAtPositionImproved(x, y);
        
        // During dragging, we want to show slot hover only for the specific slot being hovered
        let dragSlot = -1;
        
        if (hoveredResult !== -1) {
            if (typeof hoveredResult === 'object' && hoveredResult.type === 'slot') {
                // Hit an empty slot - show hover for this slot
                dragSlot = hoveredResult.index;
            } else if (typeof hoveredResult === 'number') {
                // Hit a piece - only show hover if it's NOT the piece being dragged
                // (we don't want to show hover for the dragged piece's original slot)
                if (hoveredResult !== this.draggedCellIndex) {
                    dragSlot = hoveredResult;
                }
            }
        }
        
        // Handle slot hover changes during drag
        if (dragSlot !== (this.dragHoveredSlot || -1)) {
            
            // Reset previous drag hovered slot
            if ((this.dragHoveredSlot || -1) !== -1 && this.webglRenderer) {
                this.webglRenderer.updateSlotHover(this.dragHoveredSlot, false, false);
            }
            
            this.dragHoveredSlot = dragSlot === -1 ? undefined : dragSlot;
            
            // Update new drag hovered slot (only for empty slots)
            if (dragSlot !== -1 && this.webglRenderer) {
                // Check if the slot is empty before showing hover effect
                if (this.webglRenderer.slotStates && this.webglRenderer.slotStates[dragSlot] === 'empty') {
                    this.webglRenderer.updateSlotHover(dragSlot, true, true); // true = isDragHover
                }
            }
        }
    }

    handleMouseLeave(e) {
        // Reset hover state when mouse leaves canvas
        // Reset piece hover visual state
        if (this.hoveredPiece !== -1 && this.webglRenderer) {
            this.webglRenderer.updatePieceVisualState(this.hoveredPiece, 'normal');
        }
        this.hoveredPiece = -1;
        
        // Reset slot hover state
        if (this.hoveredSlot !== undefined && this.webglRenderer) {
            this.webglRenderer.updateSlotHover(this.hoveredSlot, false);
            this.hoveredSlot = undefined;
        }
        
        // Reset drag slot hover state
        if (this.dragHoveredSlot !== undefined && this.webglRenderer) {
            this.webglRenderer.updateSlotHover(this.dragHoveredSlot, false, false);
            this.dragHoveredSlot = undefined;
        }
        
        if (this.webglRenderer) {
            this.webglRenderer.canvas.style.cursor = 'default';
        }
    }

    bringPieceToFront(cellIndex) {
        super.bringPieceToFront(cellIndex);
        
        // Update WebGL piece z-index
        if (this.webglRenderer) {
            this.webglRenderer.updatePieceZIndex(cellIndex, this.pieceZIndex[cellIndex]);
        }
    }

    dispose() {
        if (this.webglRenderer) {
            this.webglRenderer.dispose();
            this.webglRenderer = null;
        }
    }
}
*/

// Export classes
window.VoronoiPuzzle = VoronoiPuzzle;
window.WebGLRenderer = WebGLRenderer;
