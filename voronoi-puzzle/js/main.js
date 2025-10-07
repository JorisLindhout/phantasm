/**
 * Phantasm Main Controller
 */

class VoronoiPuzzle extends VoronoiPuzzleBase {
    constructor() {
        super();
        this.currentRenderer = null;
        this.useWebGL = true; // WebGL rendering enabled
        this.noise = new Noise(); // Shared noise instance
        
        // Audio setup
        this.snapSound = null;
        this.initAudio();
        
        this.init();
    }

    initAudio() {
        // Get audio element reference (might be null if called before DOM ready)
        this.snapSound = document.getElementById('snapSound');
        
        if (this.snapSound) {
            SmartLogger.log('initialization', '🔊 Audio element found and initialized');
        } else {
            console.warn('⚠️ Audio element not found - will retry on first play');
        }
        
        // Unlock audio on first user interaction (for mobile browsers)
        document.addEventListener('click', () => {
            if (!this.snapSound) {
                this.snapSound = document.getElementById('snapSound');
            }
            if (this.snapSound) {
                this.snapSound.load();
                SmartLogger.log('audio', '🔊 Audio unlocked on user interaction');
            }
        }, { once: true });
    }

    playSnapSound() {
        SmartLogger.log('audio', '🔊 playSnapSound() called');
        
        // Lazy load audio element if not found yet
        if (!this.snapSound) {
            this.snapSound = document.getElementById('snapSound');
        }
        
        if (this.snapSound) {
            SmartLogger.log('audio', '🔊 Playing snap sound...');
            // Reset and play to allow overlapping sounds
            this.snapSound.currentTime = 0;
            this.snapSound.play().catch(e => {
                // Silent fail - audio might be blocked by browser
                console.warn('⚠️ Audio play blocked:', e.message);
            });
        } else {
            console.warn('⚠️ snapSound element not found - check if audio element exists in HTML');
        }
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
            console.error('Error initializing Phantasm:', error);
            throw error; // Re-throw to be handled by the HTML initialization script
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
                    
                    // KEEP: User-facing success message
                    console.log('✅ Using WebGL renderer for proper z-index layering');
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

    /**
     * Show loading screen
     */
    showLoadingScreen(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('visible');
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    }

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
    
    dispose() {
        // Clean up WebGL renderer (via currentRenderer)
        if (this.currentRenderer) {
            if (this.currentRenderer.dispose) {
                this.currentRenderer.dispose();
            }
            this.currentRenderer = null;
        }
        
        // Call base class dispose
        super.dispose();
        
        // KEEP: User-facing success message
        console.log('✅ Main puzzle disposed and cleaned up');
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
    
    // Helper to get main puzzle instance for audio
    getMainPuzzle() {
        return window.voronoiPuzzle || null;
    }

    async init() {
        try {
            await this.loadBackgroundImage();
            this.setupCanvas();
            
            // Initialize WebGL renderer with config
            this.webglRenderer = new WebGLVoronoiRenderer(this.canvas, this.config);
            await this.webglRenderer.loadBackgroundTexture(window.themeManager ? window.themeManager.getCurrentBaseImage() : './assets/base-image-cube.svg');
            
            this.generateVoronoi();
            
            // Initialize position manager after originalPoints are available
            SmartLogger.log('initialization', '🔍 Main.js position manager initialization:');
            SmartLogger.log('initialization', '  - this.webglRenderer:', !!this.webglRenderer);
            SmartLogger.log('initialization', '  - this.originalPoints:', this.originalPoints);
            SmartLogger.log('initialization', '  - originalPoints length:', this.originalPoints ? this.originalPoints.length : 'undefined');
            
            if (this.webglRenderer && this.originalPoints) {
                // KEEP: User-facing success message
                console.log('✅ Main.js initializing position manager with', this.originalPoints.length, 'points');
                this.webglRenderer.initPositionManager(this.originalPoints);
            } else {
                // KEEP: User-facing warning message
                console.log('⚠️ Main.js position manager not initialized - missing webglRenderer or originalPoints');
            }
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
        
        SmartLogger.log('initialization', 'Initializing WebGL Voronoi...');
        
        // Get polygons from Voronoi diagram
        const polygonGenerator = this.voronoi.cellPolygons();
        const polygons = Array.from(polygonGenerator);
        
        // Initialize the connected Voronoi system
        this.webglRenderer.initializeVoronoi(polygons);
        
        // KEEP: User-facing success message
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
                SmartLogger.log('hit-detection', `🎯 WebGL hit detection result:`, webglResult);
                return webglResult;
            }
        }
        
        // Fallback to standard hit detection
        let cellIndex = this.findCellAtPosition(x, y);
        
        if (cellIndex !== -1) {
            SmartLogger.log('hit-detection', `🎯 Standard hit detection found piece ${cellIndex}`);
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
                SmartLogger.log('hit-detection', `🎯 Expanded hit detection found piece ${cellIndex} at offset (${testX-x}, ${testY-y})`);
                return cellIndex;
            }
        }
        
        SmartLogger.log('hit-detection', `🎯 No piece found at (${x}, ${y}) even with expanded search`);
        return -1;
    }

    handleMouseDown(e) {
        // Only reset interaction state if we're already dragging
        if (this.isDragging) {
            this.resetInteractionState();
        }
        
        // Convert mouse coordinates to WebGL coordinates
        const webglCoords = CoordinateUtils.normalizeMouseCoordinates(e, this.webglRenderer.canvas);
        const x = webglCoords.x;
        const y = webglCoords.y;
        
        SmartLogger.log('drag-events', `🖱️ Mouse down at WebGL (${x}, ${y})`);
        
        // Find which cell was clicked with improved hit detection
        const hitResult = this.findCellAtPositionImproved(x, y);
        SmartLogger.log('hit-detection', `🎯 Hit detection result:`, hitResult);
        
        // Only activate if we hit a piece (not a slot)
        const isSlot = hitResult && typeof hitResult === 'object' && hitResult.type === 'slot';
        const cellIndex = isSlot ? -1 : hitResult;
        
        if (cellIndex !== -1) {
            SmartLogger.log('drag-events', `✅ Activating piece ${cellIndex}`);
            // Clear any existing slot hover when starting to drag a piece
            if (this.hoveredSlot !== undefined && this.webglRenderer) {
                this.webglRenderer.updateSlotHover(this.hoveredSlot, false, false);
                this.hoveredSlot = undefined;
            }
            // Activate the piece
            this.activatePiece(cellIndex, x, y);
        } else if (isSlot) {
            SmartLogger.log('hit-detection', `🎰 Clicked on slot ${hitResult.index}, not activating`);
        } else {
            SmartLogger.log('hit-detection', `❌ No piece found at click position`);
        }
    }
    
    activatePiece(cellIndex, x, y) {
        SmartLogger.log('drag-events', `✨ Activating piece ${cellIndex}`);
        SmartLogger.log('initialization', `🔍 Debug: this.points:`, this.points);
        SmartLogger.log('initialization', `🔍 Debug: this.originalPoints:`, this.originalPoints);
        SmartLogger.log('initialization', `🔍 Debug: cellIndex:`, cellIndex, 'points.length:', this.points?.length);
        
        // Safety check: ensure points array exists and has the right index
        if (!this.points || !this.points[cellIndex]) {
            console.error(`❌ Cannot activate piece ${cellIndex}: points array not properly initialized`);
            console.error(`❌ this.points:`, this.points);
            return;
        }
        
        // Mark this piece as having been moved (for debug overlay tracking)
        if (this.webglRenderer && this.webglRenderer.pieces && this.webglRenderer.pieces[cellIndex]) {
            this.webglRenderer.pieces[cellIndex].hasBeenMoved = true;
        }
        
        // Bring clicked piece to front (highest z-index)
        this.bringPieceToFront(cellIndex);
        
        // Set drag state
        this.isDragging = true;
        this.draggedCellIndex = cellIndex;
        
        // Calculate current piece position using position manager
        const currentOffset = this.webglRenderer.pieces[cellIndex].offset || { x: 0, y: 0 };
        
        SmartLogger.log('drag-events', '🔍 activatePiece debug:');
        SmartLogger.log('drag-events', '  - cellIndex:', cellIndex);
        SmartLogger.log('drag-events', '  - currentOffset:', currentOffset);
        SmartLogger.log('drag-events', '  - positionManager available:', !!this.webglRenderer.positionManager);
        SmartLogger.log('drag-events', '  - originalPoints available:', !!this.webglRenderer.originalPoints);
        
        if (!this.webglRenderer.positionManager) {
            console.error('❌ Position manager not available! Using fallback calculation.');
            // Fallback to direct calculation
            const currentPieceX = this.points[cellIndex][0] + currentOffset.x;
            const currentPieceY = this.points[cellIndex][1] + currentOffset.y;
            this.dragOffset.x = x - currentPieceX;
            this.dragOffset.y = y - currentPieceY;
            return;
        }
        
        const currentPosition = this.webglRenderer.positionManager.getPiecePosition(cellIndex, currentOffset);
        
        // Calculate drag offset from current position, not original position
        this.dragOffset.x = x - currentPosition.x;
        this.dragOffset.y = y - currentPosition.y;
        
        SmartLogger.log('drag-events', `🎯 Piece ${cellIndex} drag offset calculation:`);
        SmartLogger.log('drag-events', `   Original position: (${this.points[cellIndex][0]}, ${this.points[cellIndex][1]})`);
        SmartLogger.log('drag-events', `   Current offset: (${currentOffset.x}, ${currentOffset.y})`);
        SmartLogger.log('drag-events', `   Current position: (${currentPosition.x}, ${currentPosition.y})`);
        SmartLogger.log('drag-events', `   Mouse position: (${x}, ${y})`);
        SmartLogger.log('drag-events', `   Drag offset: (${this.dragOffset.x}, ${this.dragOffset.y})`);
        
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
        
        SmartLogger.log('drag-events', `🎮 Piece ${cellIndex} activated for dragging`);
    }
    
    resetInteractionState() {
        if (this.isDragging && this.draggedCellIndex !== -1) {
            SmartLogger.log('drag-events', `🔄 Resetting interaction state for piece ${this.draggedCellIndex}`);
            
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
        // Convert mouse coordinates to WebGL coordinates
        const webglCoords = CoordinateUtils.normalizeMouseCoordinates(e, this.webglRenderer.canvas);
        const x = webglCoords.x;
        const y = webglCoords.y;
        
        // Handle hover effects when not dragging
        if (!this.isDragging) {
            const hoveredResult = this.findCellAtPositionImproved(x, y);
            
            // Check if we got a slot or piece result
            const isSlot = hoveredResult && typeof hoveredResult === 'object' && hoveredResult.type === 'slot';
            const hoveredPiece = isSlot ? -1 : hoveredResult;
            const hoveredSlot = isSlot ? hoveredResult.index : -1;
            
            // Handle piece hover changes
            if (hoveredPiece !== this.hoveredPiece) {
                SmartLogger.log('drag-events', `🖱️ Piece hover change: ${this.hoveredPiece} -> ${hoveredPiece}`);
                
                // Reset previous hovered piece
                if (this.hoveredPiece !== -1 && this.webglRenderer) {
                    this.webglRenderer.updatePieceVisualState(this.hoveredPiece, 'normal');
                }
                
                this.hoveredPiece = hoveredPiece;
                
                // Update new hovered piece
                if (hoveredPiece !== -1 && this.webglRenderer) {
                    SmartLogger.log('drag-events', `✨ Setting hover effect for piece ${hoveredPiece}`);
                    this.webglRenderer.updatePieceVisualState(hoveredPiece, 'hover');
                    this.webglRenderer.canvas.style.cursor = 'grab';
                }
            }
            
            // Handle slot hover changes (only during normal hover, not dragging)
            if (hoveredSlot !== (this.hoveredSlot || -1)) {
                SmartLogger.log('drag-events', `🎰 Slot hover change: ${this.hoveredSlot || -1} -> ${hoveredSlot}`);
                
                // Reset previous hovered slot
                if ((this.hoveredSlot || -1) !== -1 && this.webglRenderer) {
                    this.webglRenderer.updateSlotHover(this.hoveredSlot, false, false);
                }
                
                this.hoveredSlot = hoveredSlot === -1 ? undefined : hoveredSlot;
                
                // Update new hovered slot (only show outline, not background during normal hover)
                if (hoveredSlot !== -1 && this.webglRenderer) {
                    SmartLogger.log('drag-events', `✨ Setting hover effect for slot ${hoveredSlot}`);
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
        this.webglRenderer.pieces[this.draggedCellIndex].offset = {
            x: x - this.dragOffset.x,
            y: y - this.dragOffset.y
        };
        
        // Update WebGL piece position
        if (this.webglRenderer) {
            this.webglRenderer.updatePiecePosition(this.draggedCellIndex, this.webglRenderer.pieces[this.draggedCellIndex].offset);
        }
        
        // Handle slot hover while dragging (show which slot the piece would drop into)
        this.handleDragSlotHover(x, y);
        
        // Remove from snapped pieces if moved away from original position
        const currentOffset = this.webglRenderer.pieces[this.draggedCellIndex].offset;
        const distance = Math.sqrt(currentOffset.x * currentOffset.x + currentOffset.y * currentOffset.y);
        if (distance > this.snapThreshold) {
            this.snappedPieces.delete(this.draggedCellIndex);
        }
    }

    handleMouseUp(e) {
        SmartLogger.log('drag-events', `🖱️ Mouse up - isDragging: ${this.isDragging}, draggedCellIndex: ${this.draggedCellIndex}`);
        
        if (!this.isDragging || this.draggedCellIndex === -1) {
            // Even if no piece was being dragged, ensure clean state
            this.resetInteractionState();
            return;
        }
        
        const draggedIndex = this.draggedCellIndex;
        
        // For separate pieces, check if close to original position
        const currentOffset = this.webglRenderer.pieces[draggedIndex].offset || { x: 0, y: 0 };
        const distance = Math.sqrt(currentOffset.x ** 2 + currentOffset.y ** 2);
        
        SmartLogger.log('drag-events', `📏 Piece ${draggedIndex} distance from origin: ${distance.toFixed(1)}px (threshold: ${this.snapThreshold}px)`);
        
        if (distance < this.snapThreshold) {
            SmartLogger.log('drag-events', `📌 Piece ${draggedIndex} snapping back to original position`);
            
            // Note: Snap sound is played in webgl-renderer.js autoSnapPieceToSlot()
            
            // Snap back to original position
            this.webglRenderer.pieces[draggedIndex].offset = { x: 0, y: 0 };
            
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
                SmartLogger.log('drag-events', `✨ Piece ${draggedIndex} snap animation completed`);
            }, 2000);
        } else {
            SmartLogger.log('drag-events', `🎯 Piece ${draggedIndex} remains at offset position`);
            
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
        
        SmartLogger.log('drag-events', `🏁 Mouse up completed for piece ${draggedIndex}`);
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
                if (this.webglRenderer.slots[dragSlot] && this.webglRenderer.slots[dragSlot].state === 'empty') {
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
 * WebGL Renderer for 3D Phantasm puzzle rendering
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
            await this.webglRenderer.loadBackgroundTexture(window.themeManager ? window.themeManager.getCurrentBaseImage() : './assets/base-image-cube.svg');
            
            this.generateVoronoi();
            
            // Initialize position manager after originalPoints are available
            SmartLogger.log('initialization', '🔍 Main.js position manager initialization:');
            SmartLogger.log('initialization', '  - this.webglRenderer:', !!this.webglRenderer);
            SmartLogger.log('initialization', '  - this.originalPoints:', this.originalPoints);
            SmartLogger.log('initialization', '  - originalPoints length:', this.originalPoints ? this.originalPoints.length : 'undefined');
            
            if (this.webglRenderer && this.originalPoints) {
                // KEEP: User-facing success message
                console.log('✅ Main.js initializing position manager with', this.originalPoints.length, 'points');
                this.webglRenderer.initPositionManager(this.originalPoints);
            } else {
                // KEEP: User-facing warning message
                console.log('⚠️ Main.js position manager not initialized - missing webglRenderer or originalPoints');
            }
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
        
        SmartLogger.log('initialization', 'Initializing WebGL Voronoi...');
        
        // Get polygons from Voronoi diagram
        const polygonGenerator = this.voronoi.cellPolygons();
        const polygons = Array.from(polygonGenerator);
        
        // Initialize the connected Voronoi system
        this.webglRenderer.initializeVoronoi(polygons);
        
        // KEEP: User-facing success message
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
                SmartLogger.log('hit-detection', `🎯 WebGL hit detection result:`, webglResult);
                return webglResult;
            }
        }
        
        // Fallback to standard hit detection
        let cellIndex = this.findCellAtPosition(x, y);
        
        if (cellIndex !== -1) {
            SmartLogger.log('hit-detection', `🎯 Standard hit detection found piece ${cellIndex}`);
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
                SmartLogger.log('hit-detection', `🎯 Expanded hit detection found piece ${cellIndex} at offset (${testX-x}, ${testY-y})`);
                return cellIndex;
            }
        }
        
        SmartLogger.log('hit-detection', `🎯 No piece found at (${x}, ${y}) even with expanded search`);
        return -1;
    }

    handleMouseDown(e) {
        // Only reset interaction state if we're already dragging
        if (this.isDragging) {
            this.resetInteractionState();
        }
        
        // Convert mouse coordinates to WebGL coordinates
        const webglCoords = CoordinateUtils.normalizeMouseCoordinates(e, this.webglRenderer.canvas);
        const x = webglCoords.x;
        const y = webglCoords.y;
        
        SmartLogger.log('drag-events', `🖱️ Mouse down at WebGL (${x}, ${y})`);
        
        // Find which cell was clicked with improved hit detection
        const hitResult = this.findCellAtPositionImproved(x, y);
        SmartLogger.log('hit-detection', `🎯 Hit detection result:`, hitResult);
        
        // Only activate if we hit a piece (not a slot)
        const isSlot = hitResult && typeof hitResult === 'object' && hitResult.type === 'slot';
        const cellIndex = isSlot ? -1 : hitResult;
        
        if (cellIndex !== -1) {
            SmartLogger.log('drag-events', `✅ Activating piece ${cellIndex}`);
            // Clear any existing slot hover when starting to drag a piece
            if (this.hoveredSlot !== undefined && this.webglRenderer) {
                this.webglRenderer.updateSlotHover(this.hoveredSlot, false, false);
                this.hoveredSlot = undefined;
            }
            // Activate the piece
            this.activatePiece(cellIndex, x, y);
        } else if (isSlot) {
            SmartLogger.log('hit-detection', `🎰 Clicked on slot ${hitResult.index}, not activating`);
        } else {
            SmartLogger.log('hit-detection', `❌ No piece found at click position`);
        }
    }
    
    activatePiece(cellIndex, x, y) {
        SmartLogger.log('drag-events', `✨ Activating piece ${cellIndex}`);
        SmartLogger.log('initialization', `🔍 Debug: this.points:`, this.points);
        SmartLogger.log('initialization', `🔍 Debug: this.originalPoints:`, this.originalPoints);
        SmartLogger.log('initialization', `🔍 Debug: cellIndex:`, cellIndex, 'points.length:', this.points?.length);
        
        // Safety check: ensure points array exists and has the right index
        if (!this.points || !this.points[cellIndex]) {
            console.error(`❌ Cannot activate piece ${cellIndex}: points array not properly initialized`);
            console.error(`❌ this.points:`, this.points);
            return;
        }
        
        // Mark this piece as having been moved (for debug overlay tracking)
        if (this.webglRenderer && this.webglRenderer.pieces && this.webglRenderer.pieces[cellIndex]) {
            this.webglRenderer.pieces[cellIndex].hasBeenMoved = true;
        }
        
        // Bring clicked piece to front (highest z-index)
        this.bringPieceToFront(cellIndex);
        
        // Set drag state
        this.isDragging = true;
        this.draggedCellIndex = cellIndex;
        
        // Calculate current piece position using position manager
        const currentOffset = this.webglRenderer.pieces[cellIndex].offset || { x: 0, y: 0 };
        
        SmartLogger.log('drag-events', '🔍 activatePiece debug:');
        SmartLogger.log('drag-events', '  - cellIndex:', cellIndex);
        SmartLogger.log('drag-events', '  - currentOffset:', currentOffset);
        SmartLogger.log('drag-events', '  - positionManager available:', !!this.webglRenderer.positionManager);
        SmartLogger.log('drag-events', '  - originalPoints available:', !!this.webglRenderer.originalPoints);
        
        if (!this.webglRenderer.positionManager) {
            console.error('❌ Position manager not available! Using fallback calculation.');
            // Fallback to direct calculation
            const currentPieceX = this.points[cellIndex][0] + currentOffset.x;
            const currentPieceY = this.points[cellIndex][1] + currentOffset.y;
            this.dragOffset.x = x - currentPieceX;
            this.dragOffset.y = y - currentPieceY;
            return;
        }
        
        const currentPosition = this.webglRenderer.positionManager.getPiecePosition(cellIndex, currentOffset);
        
        // Calculate drag offset from current position, not original position
        this.dragOffset.x = x - currentPosition.x;
        this.dragOffset.y = y - currentPosition.y;
        
        SmartLogger.log('drag-events', `🎯 Piece ${cellIndex} drag offset calculation:`);
        SmartLogger.log('drag-events', `   Original position: (${this.points[cellIndex][0]}, ${this.points[cellIndex][1]})`);
        SmartLogger.log('drag-events', `   Current offset: (${currentOffset.x}, ${currentOffset.y})`);
        SmartLogger.log('drag-events', `   Current position: (${currentPosition.x}, ${currentPosition.y})`);
        SmartLogger.log('drag-events', `   Mouse position: (${x}, ${y})`);
        SmartLogger.log('drag-events', `   Drag offset: (${this.dragOffset.x}, ${this.dragOffset.y})`);
        
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
        
        SmartLogger.log('drag-events', `🎮 Piece ${cellIndex} activated for dragging`);
    }
    
    resetInteractionState() {
        if (this.isDragging && this.draggedCellIndex !== -1) {
            SmartLogger.log('drag-events', `🔄 Resetting interaction state for piece ${this.draggedCellIndex}`);
            
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
        // Convert mouse coordinates to WebGL coordinates
        const webglCoords = CoordinateUtils.normalizeMouseCoordinates(e, this.webglRenderer.canvas);
        const x = webglCoords.x;
        const y = webglCoords.y;
        
        // Handle hover effects when not dragging
        if (!this.isDragging) {
            const hoveredResult = this.findCellAtPositionImproved(x, y);
            
            // Check if we got a slot or piece result
            const isSlot = hoveredResult && typeof hoveredResult === 'object' && hoveredResult.type === 'slot';
            const hoveredPiece = isSlot ? -1 : hoveredResult;
            const hoveredSlot = isSlot ? hoveredResult.index : -1;
            
            // Handle piece hover changes
            if (hoveredPiece !== this.hoveredPiece) {
                SmartLogger.log('drag-events', `🖱️ Piece hover change: ${this.hoveredPiece} -> ${hoveredPiece}`);
                
                // Reset previous hovered piece
                if (this.hoveredPiece !== -1 && this.webglRenderer) {
                    this.webglRenderer.updatePieceVisualState(this.hoveredPiece, 'normal');
                }
                
                this.hoveredPiece = hoveredPiece;
                
                // Update new hovered piece
                if (hoveredPiece !== -1 && this.webglRenderer) {
                    if (this.webglRenderer.debugLogging.hoverEffects) {
                        SmartLogger.log('drag-events', `✨ Setting hover effect for piece ${hoveredPiece}`);
                    }
                    this.webglRenderer.updatePieceVisualState(hoveredPiece, 'hover');
                    this.webglRenderer.canvas.style.cursor = 'grab';
                }
            }
            
            // Handle slot hover changes (only during normal hover, not dragging)
            if (hoveredSlot !== (this.hoveredSlot || -1)) {
                SmartLogger.log('drag-events', `🎰 Slot hover change: ${this.hoveredSlot || -1} -> ${hoveredSlot}`);
                
                // Reset previous hovered slot
                if ((this.hoveredSlot || -1) !== -1 && this.webglRenderer) {
                    this.webglRenderer.updateSlotHover(this.hoveredSlot, false, false);
                }
                
                this.hoveredSlot = hoveredSlot === -1 ? undefined : hoveredSlot;
                
                // Update new hovered slot (only show outline, not background during normal hover)
                if (hoveredSlot !== -1 && this.webglRenderer) {
                    if (this.webglRenderer.debugLogging.hoverEffects) {
                        SmartLogger.log('drag-events', `✨ Setting hover effect for slot ${hoveredSlot}`);
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
        this.webglRenderer.pieces[this.draggedCellIndex].offset = {
            x: x - this.dragOffset.x,
            y: y - this.dragOffset.y
        };
        
        // Update WebGL piece position
        if (this.webglRenderer) {
            this.webglRenderer.updatePiecePosition(this.draggedCellIndex, this.webglRenderer.pieces[this.draggedCellIndex].offset);
        }
        
        // Handle slot hover while dragging (show which slot the piece would drop into)
        this.handleDragSlotHover(x, y);
        
        // Remove from snapped pieces if moved away from original position
        const currentOffset = this.webglRenderer.pieces[this.draggedCellIndex].offset;
        const distance = Math.sqrt(currentOffset.x * currentOffset.x + currentOffset.y * currentOffset.y);
        if (distance > this.snapThreshold) {
            this.snappedPieces.delete(this.draggedCellIndex);
        }
    }

    handleMouseUp(e) {
        SmartLogger.log('drag-events', `🖱️ Mouse up - isDragging: ${this.isDragging}, draggedCellIndex: ${this.draggedCellIndex}`);
        
        if (!this.isDragging || this.draggedCellIndex === -1) {
            // Even if no piece was being dragged, ensure clean state
            this.resetInteractionState();
            return;
        }
        
        const draggedIndex = this.draggedCellIndex;
        
        // For separate pieces, check if close to original position
        const currentOffset = this.webglRenderer.pieces[draggedIndex].offset || { x: 0, y: 0 };
        const distance = Math.sqrt(currentOffset.x ** 2 + currentOffset.y ** 2);
        
        SmartLogger.log('drag-events', `📏 Piece ${draggedIndex} distance from origin: ${distance.toFixed(1)}px (threshold: ${this.snapThreshold}px)`);
        
        if (distance < this.snapThreshold) {
            SmartLogger.log('drag-events', `📌 Piece ${draggedIndex} snapping back to original position`);
            
            // Note: Snap sound is played in webgl-renderer.js autoSnapPieceToSlot()
            
            // Snap back to original position
            this.webglRenderer.pieces[draggedIndex].offset = { x: 0, y: 0 };
            
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
                SmartLogger.log('drag-events', `✨ Piece ${draggedIndex} snap animation completed`);
            }, 2000);
        } else {
            SmartLogger.log('drag-events', `🎯 Piece ${draggedIndex} remains at offset position`);
            
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
        
        SmartLogger.log('drag-events', `🏁 Mouse up completed for piece ${draggedIndex}`);
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
                if (this.webglRenderer.slots[dragSlot] && this.webglRenderer.slots[dragSlot].state === 'empty') {
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
