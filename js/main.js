/**
 * Phantasm Main Controller
 */

import { announce } from './accessibility.js';
import { showLoadingOverlay, hideLoadingOverlay } from './loading-overlay.js';
import { CoordinateUtils } from './coordinate-utils.js';
import { computePieceOffsetFromDragDelta } from './drag-offset.js';
import { alignCanvasDimensions } from './voronoi-coordinates.js';
import {
    ActivePointerTracker,
    ActiveTouchTracker,
    configureInteractionSurface,
    getTouchEndPoint,
    getTouchMovePoint,
    isPrimaryMouseButton,
    supportsPointerEvents,
} from './pointer-input.js';
import { createLogger } from './logger.js';

const log = createLogger('main');

class VoronoiPuzzle extends VoronoiPuzzleBase {
    constructor() {
        super();
        this.currentRenderer = null;
        this.useWebGL = true;
    }

    async start() {
        await this.init();
    }

    /**
     * Snap audio hook — no-op until a source is wired (see Future Development in README).
     * Call sites stay in place so enabling sound is a small change later.
     */
    playSnapSound() {
        const snapSound = document.getElementById('snapSound');
        if (!snapSound?.src && !snapSound?.querySelector('source')) {
            return;
        }

        snapSound.currentTime = 0;
        snapSound.play().catch((e) => {
            log.warn('Audio play blocked:', e.message);
        });
    }

    async init() {
        try {
            await this.initializeRenderer();
        } catch (error) {
            log.error('Error initializing Phantasm:', error);
            throw error;
        }
    }

    async initializeRenderer(options = {}) {
        const { preserveOutgoing = false, deferPieceRelease = false } = options;

        if (this.currentRenderer) {
            if (preserveOutgoing) {
                this.outgoingRenderer = this.currentRenderer;
                const outgoingCanvas = this.outgoingRenderer.webglRenderer?.canvas;
                if (outgoingCanvas) {
                    outgoingCanvas.classList.add('transition-outgoing');
                    outgoingCanvas.dataset.transitionRole = 'outgoing';
                }
                this.currentRenderer = null;
            } else {
                if (this.outgoingRenderer) {
                    this.outgoingRenderer.dispose?.();
                    this.outgoingRenderer = null;
                }
                if (this.currentRenderer.dispose) {
                    this.currentRenderer.dispose();
                }
                this.currentRenderer = null;
            }
        }

        // Use WebGL renderer for 3D puzzle rendering
        if (typeof WebGLRenderer !== 'undefined' && typeof isWebGLSupported !== 'undefined') {
            if (isWebGLSupported()) {
                try {
                    // Create WebGL renderer
                    this.currentRenderer = new WebGLRenderer();
                    Object.assign(this.currentRenderer.config, this.config);
                    await this.currentRenderer.init({ deferPieceRelease });

                    // Add WebGL mode class to container
                    const container = document.querySelector('.puzzle-container');
                    if (container) {
                        container.classList.add('webgl-mode');
                    }
                } catch (error) {
                    log.error('WebGL initialization failed:', error.message);
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
    showLoadingScreen() {
        showLoadingOverlay();
    }

    /**
     * Hide loading screen (respects minimum display duration).
     */
    hideLoadingScreen() {
        return hideLoadingOverlay({ announceLoaded: false });
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

    bringPieceToFront(cellIndex) {
        if (this.currentRenderer?.bringPieceToFront) {
            this.currentRenderer.bringPieceToFront(cellIndex);
            return;
        }
        super.bringPieceToFront(cellIndex);
    }
    
    dispose() {
        if (this.outgoingRenderer) {
            this.outgoingRenderer.dispose?.();
            this.outgoingRenderer = null;
        }

        // Clean up WebGL renderer (via currentRenderer)
        if (this.currentRenderer) {
            if (this.currentRenderer.dispose) {
                this.currentRenderer.dispose();
            }
            this.currentRenderer = null;
        }
        
        // Call base class dispose
        super.dispose();
    }
}

/**
 * WebGL Renderer that combines WebGL rendering with base class functionality
 */
class WebGLRenderer extends VoronoiPuzzleBase {
    constructor() {
        super();
        this.webglRenderer = null;
    }

    async init(options = {}) {
        const { deferPieceRelease = false } = options;

        try {
            await this.loadBackgroundImage();
            this.setupCanvas({ resetLogical: true });
            
            // Initialize WebGL renderer with config
            this.webglRenderer = new WebGLVoronoiRenderer(this.canvas, this.config);
            window.themeManager?.syncRendererTheme(this.webglRenderer);
            await this.webglRenderer.loadBackgroundTexture(window.themeManager ? window.themeManager.getCurrentBaseImage() : './assets/Level-1.svg');
            
            // Order matters: generateVoronoi → setupDragAndDrop → syncWebGLPositionData
            // (see voronoi-coordinates.js and syncWebGLPositionData comments).
            this.generateVoronoi();
            this.setupDragAndDrop();
            this.syncWebGLPositionData();
            this.startUnsolvedLayout({ deferPieceRelease });

            this.setupControls();
            this.startAnimation();
            this.render();
        } catch (error) {
            log.error('Error initializing WebGL hybrid renderer:', error);
            throw error;
        }
    }

    freezeForHold() {
        this.stopAnimation();
        this.config.isAnimating = false;
    }

    resumeAfterHold() {
        if (!this.config.isAnimating) {
            this.config.isAnimating = true;
            this.startAnimation();
        }
    }

    setupDragAndDrop() {
        super.setupDragAndDrop();

        const eventCanvas = this.webglRenderer.canvas;
        configureInteractionSurface(this.canvas, eventCanvas);

        this.pointerTracker = new ActivePointerTracker();
        this.touchTracker = new ActiveTouchTracker();
        this.capturedPointerId = null;

        this.addEventListener(eventCanvas, 'keydown', (e) => this.handleKeyDown(e));

        if (supportsPointerEvents()) {
            this.setupPointerListeners(eventCanvas);
        } else {
            this.setupMouseAndTouchListeners(eventCanvas);
        }

        this.keyboardSelectedIndex = 0;
    }

    setupPointerListeners(eventCanvas) {
        const options = { passive: false };

        this.addEventListener(eventCanvas, 'pointerdown', (e) => this.handlePointerDown(e), options);
        this.addEventListener(eventCanvas, 'pointermove', (e) => this.handlePointerMove(e), options);
        this.addEventListener(eventCanvas, 'pointerup', (e) => this.handlePointerEnd(e), options);
        this.addEventListener(eventCanvas, 'pointercancel', (e) => this.handlePointerCancel(e), options);
        this.addEventListener(eventCanvas, 'pointerleave', (e) => this.handlePointerLeave(e));
    }

    setupMouseAndTouchListeners(eventCanvas) {
        const touchOptions = { passive: false };

        this.addEventListener(eventCanvas, 'mousedown', (e) => this.handleMouseDown(e));
        this.addEventListener(eventCanvas, 'mousemove', (e) => this.handleMouseMove(e));
        this.addEventListener(eventCanvas, 'mouseup', (e) => this.handleMouseUp(e));
        this.addEventListener(eventCanvas, 'mouseleave', (e) => this.handleMouseLeave(e));

        this.addEventListener(eventCanvas, 'touchstart', (e) => this.handleTouchStart(e), touchOptions);
        this.addEventListener(eventCanvas, 'touchmove', (e) => this.handleTouchMove(e), touchOptions);
        this.addEventListener(eventCanvas, 'touchend', (e) => this.handleTouchEnd(e), touchOptions);
        this.addEventListener(eventCanvas, 'touchcancel', (e) => this.handleTouchCancel(e), touchOptions);
    }

    handlePointerDown(e) {
        if (!this.pointerTracker.shouldHandle(e) || !isPrimaryMouseButton(e)) {
            return;
        }

        e.preventDefault();
        this.pointerTracker.claim(e.pointerId);
        this.handleMouseDown(e);

        if (this.isDragging) {
            try {
                e.currentTarget.setPointerCapture(e.pointerId);
                this.capturedPointerId = e.pointerId;
            } catch {
                // Capture may fail on some browsers; drag still works without it.
            }
        } else {
            this.pointerTracker.release();
        }
    }

    handlePointerMove(e) {
        if (!this.pointerTracker.shouldHandle(e)) {
            return;
        }

        e.preventDefault();
        this.handleMouseMove(e);
    }

    handlePointerEnd(e) {
        if (this.pointerTracker.id !== null && !this.pointerTracker.isOwner(e)) {
            return;
        }

        e.preventDefault();

        if (this.isDragging) {
            this.handleMouseMove(e);
            this.handleMouseUp(e);
        }

        this.releaseCapturedPointer(e.currentTarget);
        this.pointerTracker.release();
    }

    handlePointerCancel(e) {
        if (!this.pointerTracker.isOwner(e)) {
            return;
        }

        e.preventDefault();

        if (this.isDragging) {
            this.handleMouseMove(e);
            this.resetInteractionState();
        } else {
            this.handleMouseLeave(e);
        }

        this.releaseCapturedPointer(e.currentTarget);
        this.pointerTracker.release();
    }

    handlePointerLeave(e) {
        if (this.isDragging && this.capturedPointerId !== null) {
            return;
        }

        if (!this.pointerTracker.shouldHandle(e)) {
            return;
        }

        this.handleMouseLeave(e);
    }

    handleTouchStart(e) {
        if (e.touches.length === 0) {
            return;
        }

        e.preventDefault();
        const touch = e.touches[0];
        this.touchTracker.claim(touch.identifier);
        this.handleMouseDown(touch);
    }

    handleTouchMove(e) {
        const touch = getTouchMovePoint(e, this.touchTracker);
        if (!touch) {
            return;
        }

        e.preventDefault();
        this.handleMouseMove(touch);
    }

    handleTouchEnd(e) {
        const touch = getTouchEndPoint(e, this.touchTracker);
        if (!touch) {
            return;
        }

        e.preventDefault();

        if (this.isDragging) {
            this.handleMouseMove(touch);
            this.handleMouseUp(e);
        }

        this.touchTracker.release();
    }

    handleTouchCancel(e) {
        const touch = getTouchEndPoint(e, this.touchTracker);
        if (touch && this.isDragging) {
            this.handleMouseMove(touch);
        }

        e.preventDefault();
        this.resetInteractionState();
        this.touchTracker.release();
    }

    releaseCapturedPointer(eventCanvas) {
        if (this.capturedPointerId === null || !eventCanvas?.releasePointerCapture) {
            this.capturedPointerId = null;
            return;
        }

        try {
            eventCanvas.releasePointerCapture(this.capturedPointerId);
        } catch {
            // Already released.
        }

        this.capturedPointerId = null;
    }

    regeneratePuzzle() {
        super.regeneratePuzzle();
        this.syncWebGLPositionData();
        this.startUnsolvedLayout();
    }

    startUnsolvedLayout(options = {}) {
        const { deferPieceRelease = false } = options;

        if (!this.webglRenderer) return;

        this.isSolved = false;
        this.onSolvedStateChanged(false);

        this.webglRenderer.prepareUnsolvedGrid();

        if (window.pieceReleaseManager) {
            window.pieceReleaseManager.reset(this.webglRenderer.pieces.length);
            if (!deferPieceRelease) {
                window.pieceReleaseManager.releaseInitialBatch(this.webglRenderer);
                this.webglRenderer.recoverOffscreenLoosePieces?.();
            }
            window.pieceReleaseManager.updateButtonVisibility(this.webglRenderer);
        }
    }

    handleKeyDown(e) {
        if (!this.webglRenderer || !this.points?.length) return;

        const pieceCount = this.points.length;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                this.keyboardSelectedIndex = (this.keyboardSelectedIndex + 1) % pieceCount;
                this.highlightKeyboardSelection();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                this.keyboardSelectedIndex = (this.keyboardSelectedIndex - 1 + pieceCount) % pieceCount;
                this.highlightKeyboardSelection();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.toggleKeyboardDrag();
                break;
            case 'Escape':
                e.preventDefault();
                if (this.isDragging) {
                    this.resetInteractionState();
                    announce('Drag cancelled.');
                }
                break;
            default:
                break;
        }
    }

    highlightKeyboardSelection() {
        if (this.hoveredPiece !== -1 && this.webglRenderer) {
            this.webglRenderer.updatePieceVisualState(this.hoveredPiece, 'normal');
        }

        this.hoveredPiece = this.keyboardSelectedIndex;
        this.webglRenderer.updatePieceVisualState(this.keyboardSelectedIndex, 'hover');
        announce(`Piece ${this.keyboardSelectedIndex + 1} selected. Press Enter to pick up or drop.`);
    }

    toggleKeyboardDrag() {
        const index = this.keyboardSelectedIndex;

        if (!this.isDragging) {
            const position = this.webglRenderer.positionManager?.getPiecePosition(
                index,
                this.webglRenderer.pieces[index]?.offset || { x: 0, y: 0 }
            ) || { x: this.points[index][0], y: this.points[index][1] };

            this.activatePiece(index, position.x, position.y);
            announce(`Piece ${index + 1} picked up. Use Enter to drop or Escape to cancel.`);
            return;
        }

        if (this.draggedCellIndex === index) {
            this.handleMouseUp({});
        }
    }

    generateVoronoi() {
        // Align hidden 2D canvas to WebGL canvas before seed generation (see voronoi-coordinates.js).
        this.alignVoronoiCoordinateSpace();
        super.generateVoronoi();

        if (this.webglRenderer) {
            this.createWebGLPieces();
        }
    }

    /**
     * Hidden this.canvas and WebGL canvas can differ in size; seeds must match WebGL bounds.
     */
    alignVoronoiCoordinateSpace() {
        const glCanvas = this.webglRenderer?.canvas;
        if (!glCanvas || !this.canvas) return;

        alignCanvasDimensions(this.canvas, glCanvas);
    }

    /**
     * Position manager needs originalPoints AFTER setupDragAndDrop() copies this.points.
     * Initializing earlier produced "0 points" and broken snap/drag math.
     */
    syncWebGLPositionData() {
        if (!this.webglRenderer) return;

        if ((!this.originalPoints || this.originalPoints.length === 0) && this.points?.length) {
            this.originalPoints = [...this.points];
        }

        if ((!this.pieceZIndex || this.pieceZIndex.length !== this.points.length) && this.points?.length) {
            this.pieceZIndex = new Array(this.points.length).fill(0);
        }

        if (this.pieceZIndex?.length) {
            this.webglRenderer.pieceZIndices = [...this.pieceZIndex];
        }

        if (!this.originalPoints?.length) return;

        this.webglRenderer.originalPoints = this.originalPoints;
        this.webglRenderer.initPositionManager(this.originalPoints);
    }

    createWebGLPieces() {
        if (!this.voronoi || !this.webglRenderer) return;
                
        // Get polygons from Voronoi diagram
        const polygonGenerator = this.voronoi.cellPolygons();
        const polygons = Array.from(polygonGenerator);
        
        // Initialize the connected Voronoi system
        this.webglRenderer.initializeVoronoi(polygons);
    }

    render() {
        if (!this.voronoi || !this.backgroundImage) return;
        
        // Hide Canvas 2D and use WebGL renderer
        this.canvas.style.display = 'none';
        if (this.webglRenderer) {
            this.webglRenderer.render();
        }
    }

    findCellAtPosition(x, y, { allowRepair = false } = {}) {
        if (this.webglRenderer) {
            return this.webglRenderer.findPieceAtPosition(x, y, { allowRepair });
        }
        return -1;
    }
    
    findCellAtPositionImproved(x, y, { allowRepair = false } = {}) {
        if (this.webglRenderer) {
            const skipDraggedPiece = this.isDragging;
            const webglResult = this.webglRenderer.findPieceAtPosition(x, y, {
                skipDraggedPiece,
                allowRepair,
            });
            if (webglResult !== -1) {
                return webglResult;
            }
        }
        
        let cellIndex = this.findCellAtPosition(x, y, { allowRepair });
        
        if (cellIndex !== -1) {
            return cellIndex;
        }
        
        const tolerance = 20;
        const searchPoints = [
            [x, y],
            [x - tolerance, y], [x + tolerance, y],
            [x, y - tolerance], [x, y + tolerance],
            [x - tolerance / 2, y - tolerance / 2], [x + tolerance / 2, y - tolerance / 2],
            [x - tolerance / 2, y + tolerance / 2], [x + tolerance / 2, y + tolerance / 2],
        ];
        
        for (const [testX, testY] of searchPoints) {
            cellIndex = this.findCellAtPosition(testX, testY, { allowRepair });
            if (cellIndex !== -1) {
                return cellIndex;
            }
        }
        
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
                
        // Find which cell was clicked with improved hit detection
        const hitResult = this.findCellAtPositionImproved(x, y, { allowRepair: true });
        
        // Only activate if we hit a piece (not a slot)
        const isSlot = hitResult && typeof hitResult === 'object' && hitResult.type === 'slot';
        const cellIndex = isSlot ? -1 : hitResult;
        
        if (cellIndex !== -1) {
            // Clear any existing slot hover when starting to drag a piece
            if (this.hoveredSlot !== undefined && this.webglRenderer) {
                this.webglRenderer.updateSlotHover(this.hoveredSlot, false, false);
                this.hoveredSlot = undefined;
            }
            // Activate the piece
            this.activatePiece(cellIndex, x, y);
        }
    }
    
    activatePiece(cellIndex, x, y) {
        // Safety check: ensure points array exists and has the right index
        if (!this.points || !this.points[cellIndex]) {
            log.error(`Cannot activate piece ${cellIndex}: points array not properly initialized`, this.points);
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
        
        const currentOffset = this.webglRenderer.pieces[cellIndex].offset || { x: 0, y: 0 };

        // Drag uses pointer delta, not seed-based math (see drag-offset.js).
        this.dragPointerStart = { x, y };
        this.dragOffsetStart = { x: currentOffset.x, y: currentOffset.y };

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
    }
    
    resetInteractionState() {
        if (this.isDragging && this.draggedCellIndex !== -1) {            
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
        this.dragPointerStart = null;
        this.dragOffsetStart = null;
        
        // Notify WebGL renderer about stopping drag
        if (this.webglRenderer && this.webglRenderer.setDraggingState) {
            this.webglRenderer.setDraggingState(false, -1);
        }

        this.releaseCapturedPointer(this.webglRenderer?.canvas);
        this.pointerTracker?.release();
        this.touchTracker?.release();
        
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
                
                // Reset previous hovered piece
                if (this.hoveredPiece !== -1 && this.webglRenderer) {
                    this.webglRenderer.updatePieceVisualState(this.hoveredPiece, 'normal');
                }
                
                this.hoveredPiece = hoveredPiece;
                
                // Update new hovered piece
                if (hoveredPiece !== -1 && this.webglRenderer) {
                    this.webglRenderer.updatePieceVisualState(hoveredPiece, 'hover');
                    this.webglRenderer.canvas.style.cursor = 'grab';
                }
            }
            
            // Handle slot hover changes (only during normal hover, not dragging)
            if (hoveredSlot !== (this.hoveredSlot || -1)) {
                
                // Reset previous hovered slot
                if ((this.hoveredSlot || -1) !== -1 && this.webglRenderer) {
                    this.webglRenderer.updateSlotHover(this.hoveredSlot, false, false);
                }
                
                this.hoveredSlot = hoveredSlot === -1 ? undefined : hoveredSlot;
                
                // Update new hovered slot (only show outline, not background during normal hover)
                if (hoveredSlot !== -1 && this.webglRenderer) {
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

        if (!this.dragPointerStart || !this.dragOffsetStart) return;

        // offset is displacement from home slot; mesh.position = offset (see drag-offset.js).
        const offset = computePieceOffsetFromDragDelta(
            { x, y },
            this.dragPointerStart,
            this.dragOffsetStart
        );

        this.webglRenderer.pieces[this.draggedCellIndex].offset = offset;
        
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
        if (!this.isDragging || this.draggedCellIndex === -1) {
            // Even if no piece was being dragged, ensure clean state
            this.resetInteractionState();
            return;
        }
        
        const draggedIndex = this.draggedCellIndex;
        
        // For separate pieces, check if close to original position
        const currentOffset = this.webglRenderer.pieces[draggedIndex].offset || { x: 0, y: 0 };
        const distance = Math.sqrt(currentOffset.x ** 2 + currentOffset.y ** 2);
                
        if (distance < this.snapThreshold) {            
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
            }, 2000);
        } else {            
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
        this.removeAllEventListeners();

        if (this.webglRenderer) {
            this.webglRenderer.dispose();
            this.webglRenderer = null;
        }

        super.dispose();
    }
}

// Export classes
export { VoronoiPuzzle, WebGLRenderer };
window.VoronoiPuzzle = VoronoiPuzzle;
window.WebGLRenderer = WebGLRenderer;
