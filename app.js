// FluidLock Application
// Main JavaScript functionality for the SVG canvas with draggable pieces

        class SVGCanvas {
            constructor() {
                this.templateCanvas = document.getElementById('templateCanvas');
                this.templateCtx = this.templateCanvas.getContext('2d');
                this.canvas = this.templateCanvas; // Use template canvas as main canvas
                this.ctx = this.templateCtx; // Use template context as main context
                this.loading = document.getElementById('loading');
                this.originalWidth = CONFIG.CANVAS.ORIGINAL_WIDTH;
                this.originalHeight = CONFIG.CANVAS.ORIGINAL_HEIGHT;
                this.scale = CONFIG.CANVAS.SCALE;
                this.pieces = [];
                this.zIndexCounter = CONFIG.Z_INDEX.BASE;
                
                this.init();
            }

    async init() {
        try {
            await this.loadSVG();
            this.setupResponsiveCanvas();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading SVG:', error);
            this.showError();
        }
    }

    async loadSVG() {
        try {
            // With Vite server, we can fetch the SVG file directly
            const response = await fetch('/assets/base-image-cube.svg');
            const svgText = await response.text();
            
            // Create an image from the SVG
            const img = new Image();
            const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    this.img = img;
                    URL.revokeObjectURL(url);
                    resolve();
                };
                img.onerror = reject;
                img.src = url;
            });
        } catch (error) {
            console.error('Error fetching SVG:', error);
            throw error;
        }
    }

    setupResponsiveCanvas() {
        this.updateCanvasSize();
        this.drawImage();
        this.setupTemplateCanvas();
        this.createGrid();
        this.createPieces();
        
        // Update canvas on window resize
        window.addEventListener('resize', () => {
            this.updateCanvasSize();
            this.drawImage();
            this.setupTemplateCanvas();
            this.createGrid();
            this.updatePieces();
        });
    }

    updateCanvasSize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        
        // Calculate the display size maintaining aspect ratio
        const aspectRatio = this.originalWidth / this.originalHeight;
        let displayWidth = Math.min(containerWidth, this.originalWidth * this.scale);
        let displayHeight = displayWidth / aspectRatio;
        
        // Set canvas display size
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        
        // Set canvas internal resolution (for crisp rendering)
        const devicePixelRatio = window.devicePixelRatio || 1;
        this.canvas.width = displayWidth * devicePixelRatio;
        this.canvas.height = displayHeight * devicePixelRatio;
        
        // Scale the context to match the device pixel ratio
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
        
        // Update pieces container to match exact canvas size
        this.updatePiecesContainerSize(displayWidth, displayHeight);
    }

    setupTemplateCanvas() {
        // Template canvas displays the reference SVG image with grid overlay
        // This serves as the visual guide for arranging pieces in the workspace
        console.log('Template canvas setup complete');
    }

    updatePiecesContainerSize(width, height) {
        const piecesContainer = document.getElementById('piecesContainer');
        if (piecesContainer) {
            piecesContainer.style.width = width + 'px';
            piecesContainer.style.height = height + 'px';
            
            // Update all piece positions to match new container size
            this.updatePiecePositions(width, height);
        }
    }

    updatePiecePositions(containerWidth, containerHeight) {
        const gridSize = CONFIG.GRID.SIZE;
        const cellWidth = containerWidth / gridSize;
        const cellHeight = containerHeight / gridSize;
        
        this.pieces.forEach(piece => {
            const x = piece.col * cellWidth;
            const y = piece.row * cellHeight;
            
            piece.element.style.left = x + 'px';
            piece.element.style.top = y + 'px';
            piece.element.style.width = cellWidth + 'px';
            piece.element.style.height = cellHeight + 'px';
        });
    }

    drawImage() {
        if (!this.img) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calculate the display dimensions
        const displayWidth = this.canvas.style.width.replace('px', '');
        const displayHeight = this.canvas.style.height.replace('px', '');
        
        // Draw the image scaled up
        this.ctx.drawImage(
            this.img,
            0, 0, this.originalWidth, this.originalHeight,
            0, 0, displayWidth, displayHeight
        );
    }

    createGrid() {
        const gridLines = document.getElementById('templateGridLines');
        const gridLabels = document.getElementById('templateGridLabels');
        
        // Clear existing grid
        gridLines.innerHTML = '';
        gridLabels.innerHTML = '';
        
        // Get canvas display dimensions
        const canvasRect = this.canvas.getBoundingClientRect();
        const containerRect = this.canvas.parentElement.getBoundingClientRect();
        
        const displayWidth = canvasRect.width;
        const displayHeight = canvasRect.height;
        
        // Create 4x4 grid (5 lines in each direction)
        const gridSize = CONFIG.GRID.SIZE;
        
        // Create vertical lines
        for (let i = 0; i <= gridSize; i++) {
            const line = document.createElement('div');
            line.className = 'template-grid-line vertical';
            line.style.left = `${(i / gridSize) * 100}%`;
            gridLines.appendChild(line);
        }
        
        // Create horizontal lines
        for (let i = 0; i <= gridSize; i++) {
            const line = document.createElement('div');
            line.className = 'template-grid-line horizontal';
            line.style.top = `${(i / gridSize) * 100}%`;
            gridLines.appendChild(line);
        }
        
        // Create grid labels (A1, A2, B1, B2, etc.)
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const label = document.createElement('div');
                label.className = 'template-grid-label';
                label.textContent = `${String.fromCharCode(65 + row)}${col + 1}`;
                
                // Position in the center of each grid cell
                const cellWidth = 100 / gridSize;
                const cellHeight = 100 / gridSize;
                const left = (col * cellWidth) + (cellWidth / 2);
                const top = (row * cellHeight) + (cellHeight / 2);
                
                label.style.left = `${left}%`;
                label.style.top = `${top}%`;
                label.style.transform = 'translate(-50%, -50%)';
                
                gridLabels.appendChild(label);
            }
        }
    }

    createPieces() {
        const piecesContainer = document.getElementById('piecesContainer');
        piecesContainer.innerHTML = '';
        this.pieces = [];
        
        const gridSize = CONFIG.GRID.SIZE;
        const containerRect = piecesContainer.getBoundingClientRect();
        const cellWidth = containerRect.width / gridSize;
        const cellHeight = containerRect.height / gridSize;
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const pieceId = `${String.fromCharCode(65 + row)}${col + 1}`;
                const piece = this.createPiece(pieceId, row, col);
                
                // Position piece absolutely in grid
                piece.element.style.left = (col * cellWidth) + 'px';
                piece.element.style.top = (row * cellHeight) + 'px';
                piece.element.style.width = cellWidth + 'px';
                piece.element.style.height = cellHeight + 'px';
                
                piecesContainer.appendChild(piece.element);
                this.pieces.push(piece);
            }
        }
        
        // Store template canvas reference for workspace piece updates
        this.templateCanvasRect = this.templateCanvas.getBoundingClientRect();
        
        this.updatePieces();
        
        // Initial completion check
        this.checkCompletion();
    }

    createPiece(id, row, col) {
        const pieceElement = document.createElement('div');
        pieceElement.className = 'piece';
        pieceElement.id = `piece-${id}`;
        
        const canvas = document.createElement('canvas');
        canvas.id = `canvas-${id}`;
        pieceElement.appendChild(canvas);
        
        const label = document.createElement('div');
        label.className = 'piece-label';
        label.textContent = id;
        pieceElement.appendChild(label);
        
        // Add drag handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        pieceElement.appendChild(dragHandle);
        
        // Add drag functionality
        this.addDragFunctionality(pieceElement, id);
        
        return {
            id,
            row,
            col,
            element: pieceElement,
            canvas,
            ctx: canvas.getContext('2d'),
            isDragging: false,
            dragOffset: { x: 0, y: 0 }
        };
    }

    addDragFunctionality(pieceElement, id) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        let originalPosition = { x: 0, y: 0 };
        
        const startDrag = (e) => {
            isDragging = true;
            pieceElement.classList.add('dragging');
            
            // Bring this piece to the front
            this.bringToFront(pieceElement);
            
            const rect = pieceElement.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            // Store original position
            originalPosition.x = parseInt(pieceElement.style.left) || 0;
            originalPosition.y = parseInt(pieceElement.style.top) || 0;
            
            e.preventDefault();
        };
        
        const drag = (e) => {
            if (!isDragging) return;
            
            const piecesContainer = document.getElementById('piecesContainer');
            const containerRect = piecesContainer.getBoundingClientRect();
            
            const newX = e.clientX - containerRect.left - dragOffset.x;
            const newY = e.clientY - containerRect.top - dragOffset.y;
            
            pieceElement.style.left = newX + 'px';
            pieceElement.style.top = newY + 'px';
            
            // Check for slot overlaps
            this.checkSlotOverlaps(pieceElement, containerRect);
            
            e.preventDefault();
        };
        
        const endDrag = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            pieceElement.classList.remove('dragging');
            
            const piecesContainer = document.getElementById('piecesContainer');
            const containerRect = piecesContainer.getBoundingClientRect();
            
            // Check if there's a highlighted slot to snap to
            if (pieceElement.dataset.targetSlot) {
                const [targetRow, targetCol] = pieceElement.dataset.targetSlot.split(',').map(Number);
                const gridSize = CONFIG.GRID.SIZE;
                const cellWidth = containerRect.width / gridSize;
                const cellHeight = containerRect.height / gridSize;
                
                // Snap to the highlighted slot
                const snapX = targetCol * cellWidth;
                const snapY = targetRow * cellHeight;
                
                pieceElement.style.left = snapX + 'px';
                pieceElement.style.top = snapY + 'px';
                
                // Update piece position in array
                this.updatePiecePosition(id, targetRow, targetCol);
                
                // Clear highlighting
                this.clearSlotHighlights();
                delete pieceElement.dataset.targetSlot;
            } else {
                // Calculate drop position relative to container
                const dropX = e.clientX - containerRect.left - dragOffset.x;
                const dropY = e.clientY - containerRect.top - dragOffset.y;
                
                // Check if dropped within container bounds
                if (dropX >= 0 && dropX <= containerRect.width && 
                    dropY >= 0 && dropY <= containerRect.height) {
                    
                    // Stay exactly where dropped - no snapping
                    pieceElement.style.left = dropX + 'px';
                    pieceElement.style.top = dropY + 'px';
                    
                    // Mark as free-floating (not tied to grid)
                    this.updatePiecePosition(id, -1, -1);
                } else {
                    // Snap back to original position if dropped outside container
                    pieceElement.style.left = originalPosition.x + 'px';
                    pieceElement.style.top = originalPosition.y + 'px';
                }
                
                // Clear any highlighting
                this.clearSlotHighlights();
            }
            
            e.preventDefault();
        };
        
        // Add event listeners
        pieceElement.addEventListener('mousedown', startDrag);
        pieceElement.addEventListener('click', (e) => {
            // Bring to front on click (even if not dragging)
            this.bringToFront(pieceElement);
        });
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
        
        // Touch events for mobile
        pieceElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // Bring to front on touch
            this.bringToFront(pieceElement);
            startDrag(e.touches[0]);
        });
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            drag(e.touches[0]);
        });
        
        document.addEventListener('touchend', (e) => {
            e.preventDefault();
            endDrag(e);
        });
    }

    updatePiecePosition(pieceId, newRow, newCol) {
        const piece = this.pieces.find(p => p.id === pieceId);
        if (piece) {
            piece.row = newRow;
            piece.col = newCol;
        }
        // Check if all pieces are in correct positions after each update
        this.checkCompletion();
    }

    checkCompletion() {
        const gridSize = CONFIG.GRID.SIZE;
        let allCorrect = true;
        
        // Check if all pieces are in their correct grid positions
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const expectedId = `${String.fromCharCode(65 + row)}${col + 1}`;
                const piece = this.pieces.find(p => p.id === expectedId);
                
                // Check if piece is in correct position or if no piece found
                if (!piece || piece.row !== row || piece.col !== col) {
                    allCorrect = false;
                    break;
                }
            }
            if (!allCorrect) break;
        }
        
        // Update canvas outline based on completion status
        this.updateCanvasOutline(allCorrect);
        
        return allCorrect;
    }

    updateCanvasOutline(isComplete) {
        const workspaceContainer = document.getElementById('piecesContainer');
        
        if (isComplete) {
            workspaceContainer.classList.add('completed');
        } else {
            workspaceContainer.classList.remove('completed');
        }
    }

    bringToFront(pieceElement) {
        // Increment z-index counter and apply to piece
        this.zIndexCounter++;
        pieceElement.style.zIndex = this.zIndexCounter;
    }

    calculateOverlap(pieceRect, slotRect) {
        // Calculate the intersection rectangle
        const left = Math.max(pieceRect.left, slotRect.left);
        const right = Math.min(pieceRect.right, slotRect.right);
        const top = Math.max(pieceRect.top, slotRect.top);
        const bottom = Math.min(pieceRect.bottom, slotRect.bottom);
        
        // If no intersection, return 0
        if (left >= right || top >= bottom) {
            return 0;
        }
        
        // Calculate intersection area
        const intersectionArea = (right - left) * (bottom - top);
        
        // Calculate piece area
        const pieceArea = pieceRect.width * pieceRect.height;
        
        // Return percentage of piece that overlaps with slot
        return (intersectionArea / pieceArea) * 100;
    }

    highlightSlot(row, col, containerRect) {
        const gridSize = CONFIG.GRID.SIZE;
        const cellWidth = containerRect.width / gridSize;
        const cellHeight = containerRect.height / gridSize;
        
        const slotX = col * cellWidth;
        const slotY = row * cellHeight;
        
        // Remove existing highlights
        this.clearSlotHighlights();
        
        // Create highlight element
        const highlight = document.createElement('div');
        highlight.className = 'slot-highlight';
        highlight.style.left = slotX + 'px';
        highlight.style.top = slotY + 'px';
        highlight.style.width = cellWidth + 'px';
        highlight.style.height = cellHeight + 'px';
        highlight.id = 'slot-highlight';
        
        const piecesContainer = document.getElementById('piecesContainer');
        piecesContainer.appendChild(highlight);
    }

    clearSlotHighlights() {
        const existingHighlight = document.getElementById('slot-highlight');
        if (existingHighlight) {
            existingHighlight.remove();
        }
    }

    checkSlotOverlaps(pieceElement, containerRect) {
        const gridSize = CONFIG.GRID.SIZE;
        const cellWidth = containerRect.width / gridSize;
        const cellHeight = containerRect.height / gridSize;
        
        // Get piece rectangle
        const pieceRect = {
            left: parseInt(pieceElement.style.left) || 0,
            top: parseInt(pieceElement.style.top) || 0,
            width: pieceElement.offsetWidth,
            height: pieceElement.offsetHeight,
            right: (parseInt(pieceElement.style.left) || 0) + pieceElement.offsetWidth,
            bottom: (parseInt(pieceElement.style.top) || 0) + pieceElement.offsetHeight
        };
        
        let bestOverlap = 0;
        let bestSlot = null;
        
        // Check each grid slot
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const slotRect = {
                    left: col * cellWidth,
                    top: row * cellHeight,
                    right: (col + 1) * cellWidth,
                    bottom: (row + 1) * cellHeight,
                    width: cellWidth,
                    height: cellHeight
                };
                
                const overlap = this.calculateOverlap(pieceRect, slotRect);
                
                if (overlap >= CONFIG.SNAP_THRESHOLD && overlap > bestOverlap) {
                    bestOverlap = overlap;
                    bestSlot = { row, col };
                }
            }
        }
        
        // Highlight the best slot if found
        if (bestSlot) {
            this.highlightSlot(bestSlot.row, bestSlot.col, containerRect);
            // Store the target slot for snapping
            pieceElement.dataset.targetSlot = `${bestSlot.row},${bestSlot.col}`;
        } else {
            this.clearSlotHighlights();
            delete pieceElement.dataset.targetSlot;
        }
    }

    updatePieces() {
        if (!this.img) return;
        
        const gridSize = CONFIG.GRID.SIZE;
        const cellWidth = this.originalWidth / gridSize;
        const cellHeight = this.originalHeight / gridSize;
        
        this.pieces.forEach(piece => {
            const canvas = piece.canvas;
            const ctx = piece.ctx;
            
            // Set canvas size to match the piece container
            const rect = canvas.getBoundingClientRect();
            const devicePixelRatio = window.devicePixelRatio || 1;
            
            canvas.width = rect.width * devicePixelRatio;
            canvas.height = rect.height * devicePixelRatio;
            
            ctx.scale(devicePixelRatio, devicePixelRatio);
            
            // Calculate source coordinates in the original image
            const sourceX = piece.col * cellWidth;
            const sourceY = piece.row * cellHeight;
            
            // Draw the specific portion of the image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(
                this.img,
                sourceX, sourceY, cellWidth, cellHeight,
                0, 0, rect.width, rect.height
            );
        });
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }

    showError() {
        this.loading.textContent = 'Error loading SVG';
        this.loading.style.color = '#ff4444';
    }

    updateTemplateCanvas() {
        // This method will be called when the template canvas changes
        // For now, just update the template canvas reference
        this.templateCanvasRect = this.templateCanvas.getBoundingClientRect();
        
        // In future phases, this will update workspace piece shapes based on template changes
        console.log('Template canvas updated - workspace pieces will inherit new shapes');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SVGCanvas();
});
