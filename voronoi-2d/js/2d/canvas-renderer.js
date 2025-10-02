/**
 * Canvas 2D Renderer for Voronoi Puzzle
 * Handles all Canvas 2D specific rendering and interactions
 */

class Canvas2DRenderer extends VoronoiPuzzleBase {
    constructor() {
        super();
        this.ctx = this.canvas.getContext('2d');
        this.noise = new Noise();
        
        // Canvas 2D specific properties
        this.pieceImages = []; // Cache for piece images
        this.lastCaptureTime = 0;
        this.captureInterval = 1000; // Update piece images every 1 second
        this.pieceCanvases = []; // Separate canvases for each piece
    }

    updateRendererStatus(status) {
        const statusElement = document.getElementById('rendererStatus');
        if (statusElement) {
            statusElement.textContent = `Renderer: ${status}`;
        }
    }

    async init() {
        try {
            console.log('🚀 Starting Canvas 2D renderer initialization...');
            await this.loadBackgroundImage();
            console.log('🎨 Setting up canvas...');
            this.setupCanvas();
            
            // Add Canvas 2D class to canvas for CSS targeting
            this.canvas.classList.add('canvas-2d');
            
            console.log('🔢 Generating Voronoi diagram...');
            this.generateVoronoi();
            console.log('🎛️ Setting up controls...');
            this.setupControls();
            console.log('🖱️ Setting up drag and drop...');
            this.setupDragAndDrop();
            console.log('🎬 Starting animation...');
            this.startAnimation();
            this.updateRendererStatus('Canvas 2D');
            console.log('✅ Canvas 2D renderer initialization complete!');
        } catch (error) {
            console.error('❌ Error initializing Canvas 2D renderer:', error);
            this.updateRendererStatus('Error: ' + error.message);
        }
    }

    setupDragAndDrop() {
        super.setupDragAndDrop();
        
        // Mouse event handlers
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
        
        // Touch event handlers for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleMouseDown(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMouseMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp(e);
        });
    }

    generateVoronoi() {
        super.generateVoronoi();
        // Capture piece images for Canvas 2D rendering
        this.capturePieceImages();
    }

    capturePieceImages() {
        // Only capture images for pieces that are moved (optimization)
        if (!this.backgroundImage || !this.voronoi) return;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Get all cell polygons
        const polygonGenerator = this.voronoi.cellPolygons();
        const polygons = Array.from(polygonGenerator);
        
        for (let i = 0; i < polygons.length; i++) {
            const polygon = polygons[i];
            if (!polygon) continue;
            
            const offset = this.pieceOffsets[i] || { x: 0, y: 0 };
            const distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y);
            
            // Only capture if piece has moved significantly (>10 pixels)
            if (distance > 10) {
                // Create a temporary canvas for this piece
                const pieceCanvas = document.createElement('canvas');
                pieceCanvas.width = width;
                pieceCanvas.height = height;
                const pieceCtx = pieceCanvas.getContext('2d');
                
                // Create clipping path for this piece
                pieceCtx.beginPath();
                pieceCtx.moveTo(polygon[0][0], polygon[0][1]);
                for (let j = 1; j < polygon.length; j++) {
                    pieceCtx.lineTo(polygon[j][0], polygon[j][1]);
                }
                pieceCtx.closePath();
                pieceCtx.clip();
                
                // Draw the background image with slight scaling to minimize gaps
                const scaledWidth = width * this.scaleFactor;
                const scaledHeight = height * this.scaleFactor;
                const offsetX = (width - scaledWidth) / 2;
                const offsetY = (height - scaledHeight) / 2;
                
                pieceCtx.drawImage(this.backgroundImage, offsetX, offsetY, scaledWidth, scaledHeight);
                
                // Store the piece image
                this.pieceImages[i] = pieceCanvas;
            } else {
                // Clear the piece image for pieces in original position
                this.pieceImages[i] = null;
            }
        }
        
        const capturedCount = this.pieceImages.filter(img => img !== null).length;
    }

    shouldUpdatePieceImages() {
        // Check if any pieces have moved significantly or if it's been too long
        const currentTime = Date.now();
        if (currentTime - this.lastCaptureTime > this.captureInterval) {
            return true;
        }
        
        // Check if any piece has moved significantly from its original position
        for (let i = 0; i < this.pieceOffsets.length; i++) {
            const offset = this.pieceOffsets[i] || { x: 0, y: 0 };
            const distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y);
            if (distance > 10) { // If piece moved more than 10 pixels, update
                return true;
            }
        }
        
        return false;
    }

    render() {
        if (!this.voronoi || !this.backgroundImage) return;
        
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw light black background
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, width, height);
        
        // Render each Voronoi cell with animated boundaries
        this.renderVoronoiCells(ctx);
    }

    renderVoronoiCells(ctx) {
        if (this.separatePieces) {
            this.renderSeparatePieces(ctx);
        } else {
            this.renderConnectedVoronoi(ctx);
        }
    }

    renderConnectedVoronoi(ctx) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Get all Voronoi polygons - cellPolygons is a generator
        const polygonGenerator = this.voronoi.cellPolygons();
        const polygons = Array.from(polygonGenerator);
        
        console.log('Rendering', polygons.length, 'Voronoi cells');
        
        for (let i = 0; i < polygons.length; i++) {
            const polygon = polygons[i];
            if (!polygon) continue;
            
            // Create animated path for this cell
            const animatedPath = this.createAnimatedPath(polygon);
            
            // Save context state
            ctx.save();
            
            // Create clipping path for this cell
            ctx.beginPath();
            ctx.moveTo(animatedPath[0][0], animatedPath[0][1]);
            for (let j = 1; j < animatedPath.length; j++) {
                ctx.lineTo(animatedPath[j][0], animatedPath[j][1]);
            }
            ctx.closePath();
            ctx.clip();
            
            // Redraw the background image within this clipped region
            ctx.drawImage(this.backgroundImage, 0, 0, width, height);
            
            // Restore context state
            ctx.restore();
            
            // Draw animated cell boundary
            this.drawAnimatedBoundary(ctx, animatedPath, i);
        }
    }

    renderSeparatePieces(ctx) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Check if we need to update piece images (smart update)
        if (this.shouldUpdatePieceImages()) {
            this.capturePieceImages();
            this.lastCaptureTime = Date.now();
        }
        
        // Get all Voronoi polygons
        const polygonGenerator = this.voronoi.cellPolygons();
        const polygons = Array.from(polygonGenerator);
        
        // Create array of pieces with their z-index for sorting
        const piecesWithZIndex = polygons.map((polygon, i) => ({
            index: i,
            polygon,
            zIndex: this.pieceZIndex[i] || 0
        }));
        
        // Sort by z-index (higher z-index renders on top)
        piecesWithZIndex.sort((a, b) => b.zIndex - a.zIndex);
        
        // Debug: Log the rendering order
        const hasNonZeroZIndex = this.pieceZIndex.some(z => z > 0);
        if (hasNonZeroZIndex) {
            console.log('Rendering order:', piecesWithZIndex.slice(0, 3).map(p => `P${p.index}:${p.zIndex}`).join(' → '));
        }
        
        // First pass: Render all pieces in z-index order (without boundaries)
        for (const { index: i, polygon } of piecesWithZIndex) {
            if (!polygon) continue;
            
            // Calculate piece position (with offset if dragged)
            const offset = this.pieceOffsets[i] || { x: 0, y: 0 };
            
            // Create animated path for this cell
            const animatedPath = this.createAnimatedPath(polygon, offset);
            
            // Save context state
            ctx.save();
            
            // Set composite operation to ensure proper layering
            ctx.globalCompositeOperation = 'source-over';
            
            // Create clipping path for this cell (with offset applied to the path)
            ctx.beginPath();
            ctx.moveTo(animatedPath[0][0] + offset.x, animatedPath[0][1] + offset.y);
            for (let j = 1; j < animatedPath.length; j++) {
                ctx.lineTo(animatedPath[j][0] + offset.x, animatedPath[j][1] + offset.y);
            }
            ctx.closePath();
            ctx.clip();
            
            // Use different rendering based on whether piece has moved
            const distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y);
            if (distance > 10 && this.pieceImages[i]) {
                // For moved pieces: use captured image
                ctx.drawImage(this.pieceImages[i], offset.x, offset.y);
            } else {
                // For pieces in original position: use normal background image
                ctx.drawImage(this.backgroundImage, 0, 0, width, height);
            }
            
            // Add a subtle fill to make pieces more visible
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fill();
            
            // Draw piece number in the center
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Calculate center of the piece
            const centerX = offset.x + (animatedPath.reduce((sum, point) => sum + point[0], 0) / animatedPath.length);
            const centerY = offset.y + (animatedPath.reduce((sum, point) => sum + point[1], 0) / animatedPath.length);
            
            ctx.fillText(i.toString(), centerX, centerY);
            
            // Restore context state
            ctx.restore();
        }
        
        // Second pass: Draw all boundaries in z-index order (highest first)
        for (const { index: i, polygon } of piecesWithZIndex) {
            if (!polygon) continue;
            
            const offset = this.pieceOffsets[i] || { x: 0, y: 0 };
            const animatedPath = this.createAnimatedPath(polygon, offset);
            
            // Draw animated cell boundary (with offset)
            this.drawAnimatedBoundary(ctx, animatedPath, i, offset);
        }
    }

    drawAnimatedBoundary(ctx, path, cellIndex, offset = { x: 0, y: 0 }) {
        // Different styling for dragged cell, snapped pieces, and hovered pieces
        const isDragged = this.isDragging && cellIndex === this.draggedCellIndex;
        const isHovered = !this.isDragging && cellIndex === this.hoveredPiece;
        
        // Check if piece is actually snapped (close to original position)
        const currentOffset = this.pieceOffsets[cellIndex] || { x: 0, y: 0 };
        const distance = Math.sqrt(currentOffset.x * currentOffset.x + currentOffset.y * currentOffset.y);
        const isSnapped = distance < this.snapThreshold && this.snappedPieces.has(cellIndex);
        
        if (isSnapped) {
            // Green outline for snapped pieces with pulsing effect
            const pulseIntensity = 0.5 + 0.5 * Math.sin(this.snapAnimationTime * 8);
            ctx.strokeStyle = `rgba(0, 255, 100, ${0.6 + 0.4 * pulseIntensity})`;
            ctx.lineWidth = 4;
        } else if (isDragged) {
            // Red outline for dragged pieces
            ctx.strokeStyle = `rgba(255, 100, 100, 0.8)`;
            ctx.lineWidth = 4;
        } else if (isHovered) {
            // Brighter outline for hovered pieces
            ctx.strokeStyle = `rgba(0, 221, 255, 0.8)`;
            ctx.lineWidth = 3;
        } else {
            // Normal blue outline with breathing animation
            ctx.strokeStyle = `rgba(0, 221, 255, ${0.3 + 0.3 * Math.sin(this.config.time * 2)})`;
            ctx.lineWidth = 2;
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(path[0][0] + offset.x, path[0][1] + offset.y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i][0] + offset.x, path[i][1] + offset.y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    findCellAtPosition(x, y) {
        if (this.separatePieces) {
            // For separate pieces, check current positions (original + offset)
            let closestIndex = -1;
            let closestDistance = Infinity;
            
            for (let i = 0; i < this.points.length; i++) {
                const originalPoint = this.points[i];
                const offset = this.pieceOffsets[i] || { x: 0, y: 0 };
                
                // Calculate current position
                const currentX = originalPoint[0] + offset.x;
                const currentY = originalPoint[1] + offset.y;
                
                const distance = Math.sqrt((x - currentX) ** 2 + (y - currentY) ** 2);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = i;
                }
            }
            
            // Only return if within a reasonable distance (generous hit detection)
            const maxDistance = Math.min(this.canvas.width, this.canvas.height) / Math.sqrt(this.points.length) * 1.2;
            const hit = closestDistance < maxDistance;
            if (hit) {
                console.log(`Hit piece ${closestIndex} at distance ${closestDistance.toFixed(1)} (max: ${maxDistance.toFixed(1)})`);
            }
            return hit ? closestIndex : -1;
        } else {
            // For connected Voronoi, use original logic
            let closestIndex = -1;
            let closestDistance = Infinity;
            
            for (let i = 0; i < this.points.length; i++) {
                const point = this.points[i];
                const distance = Math.sqrt((x - point[0]) ** 2 + (y - point[1]) ** 2);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = i;
                }
            }
            
            // Only return if within a reasonable distance (generous hit detection)
            const maxDistance = Math.min(this.canvas.width, this.canvas.height) / Math.sqrt(this.points.length) * 1.2;
            const hit = closestDistance < maxDistance;
            if (hit) {
                console.log(`Hit piece ${closestIndex} at distance ${closestDistance.toFixed(1)} (max: ${maxDistance.toFixed(1)})`);
            }
            return hit ? closestIndex : -1;
        }
    }

    handleMouseDown(e) {
        const coords = VoronoiUtils.getCanvasCoordinates(e, this.canvas);
        const x = coords.x;
        const y = coords.y;
        
        // Find which cell was clicked
        const cellIndex = this.findCellAtPosition(x, y);
        if (cellIndex !== -1 && !this.isDragging) {
            // Bring clicked piece to front (highest z-index)
            this.bringPieceToFront(cellIndex);
            
            this.isDragging = true;
            this.draggedCellIndex = cellIndex;
            this.dragOffset.x = x - this.points[cellIndex][0];
            this.dragOffset.y = y - this.points[cellIndex][1];
            
            // Store original position for snap-back
            this.originalPoints[cellIndex] = [...this.points[cellIndex]];
            
            // Change cursor to indicate dragging
            this.canvas.style.cursor = 'grabbing';
        }
    }

    handleMouseMove(e) {
        const coords = VoronoiUtils.getCanvasCoordinates(e, this.canvas);
        const x = coords.x;
        const y = coords.y;
        
        // Handle hover effects when not dragging
        if (!this.isDragging) {
            const hoveredPiece = this.findCellAtPosition(x, y);
            if (hoveredPiece !== this.hoveredPiece) {
                this.hoveredPiece = hoveredPiece;
                
                if (hoveredPiece !== -1) {
                    this.canvas.style.cursor = 'grab';
                } else {
                    this.canvas.style.cursor = 'default';
                }
            }
            return;
        }
        
        // Handle dragging
        if (this.draggedCellIndex === -1) return;
        
        if (this.separatePieces) {
            // Update piece offset for separate pieces
            this.pieceOffsets[this.draggedCellIndex] = {
                x: x - this.dragOffset.x - this.originalPoints[this.draggedCellIndex][0],
                y: y - this.dragOffset.y - this.originalPoints[this.draggedCellIndex][1]
            };
            
            // Remove from snapped pieces if moved away from original position
            const currentOffset = this.pieceOffsets[this.draggedCellIndex];
            const distance = Math.sqrt(currentOffset.x * currentOffset.x + currentOffset.y * currentOffset.y);
            if (distance > this.snapThreshold) {
                this.snappedPieces.delete(this.draggedCellIndex);
            }
        } else {
            // Update the dragged point position for connected Voronoi
            this.points[this.draggedCellIndex][0] = x - this.dragOffset.x;
            this.points[this.draggedCellIndex][1] = y - this.dragOffset.y;
            
            // Regenerate Voronoi with new point position
            this.regenerateVoronoi();
        }
    }

    handleMouseUp(e) {
        if (!this.isDragging || this.draggedCellIndex === -1) return;
        
        if (this.separatePieces) {
            // For separate pieces, check if close to original position
            const currentOffset = this.pieceOffsets[this.draggedCellIndex] || { x: 0, y: 0 };
            const distance = Math.sqrt(currentOffset.x ** 2 + currentOffset.y ** 2);
            
            if (distance < this.snapThreshold) {
                // Snap back to original position
                this.pieceOffsets[this.draggedCellIndex] = { x: 0, y: 0 };
                
                // Clear the captured image for this piece (return to normal rendering)
                this.pieceImages[this.draggedCellIndex] = null;
                
                // Force immediate update of piece images to reflect the change
                this.capturePieceImages();
                this.lastCaptureTime = Date.now();
                
                // Add visual feedback for snap
                this.snappedPieces.add(this.draggedCellIndex);
                this.snapAnimationTime = 0; // Reset animation
                
                // Remove snap feedback after animation
                setTimeout(() => {
                    this.snappedPieces.delete(this.draggedCellIndex);
                }, 2000); // 2 seconds of green feedback
            }
            // Otherwise, keep the piece where it is (separate pieces stay separate)
        } else {
            // Check for snap-to-location for connected Voronoi
            const snapResult = this.checkSnapToLocation(this.draggedCellIndex);
            if (snapResult.snapped) {
                // Snap to the target position
                this.points[this.draggedCellIndex] = [...snapResult.targetPosition];
                this.regenerateVoronoi();
            } else {
                // Snap back to original position
                this.points[this.draggedCellIndex] = [...this.originalPoints[this.draggedCellIndex]];
                this.regenerateVoronoi();
            }
        }
        
        // Reset drag state
        this.isDragging = false;
        this.draggedCellIndex = -1;
        this.canvas.style.cursor = 'grab';
    }
    
    handleMouseLeave(e) {
        // Reset hover state when mouse leaves canvas
        this.hoveredPiece = -1;
        this.canvas.style.cursor = 'default';
    }
}

// Export class
window.Canvas2DRenderer = Canvas2DRenderer;
