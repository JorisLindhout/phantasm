/**
 * Visual Debug Overlay
 * Shows real-time piece position data, mouse coordinates, and dragging state
 * Displays coordinates in WebGL coordinate system (internal calculations)
 * Simple overlay to see exactly what's happening when visual jumps occur
 */

class VisualDebugOverlay {
    constructor(webglRenderer, mainPuzzle) {
        this.renderer = webglRenderer;
        this.puzzle = mainPuzzle;
        this.overlay = null;
        this.isVisible = false;
        this.updateInterval = null;
        this.trackedPiece = -1; // Track specific piece, or -1 for all
    }

    /**
     * Create and show the debug overlay
     */
    show() {
        if (this.isVisible) {
            console.log('⚠️ Debug overlay already visible');
            return;
        }

        console.log('🔍 Creating visual debug overlay...');

        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.id = 'debug-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            min-width: 300px;
            max-height: 400px;
            overflow-y: auto;
            pointer-events: none;
            border: 1px solid #00ff00;
        `;

        // Create header
        const header = document.createElement('div');
        header.innerHTML = '<strong>🔍 DEBUG OVERLAY</strong>';
        header.style.cssText = 'margin-bottom: 10px; color: #ffff00;';
        this.overlay.appendChild(header);

        // Create mouse info section
        this.mouseInfo = document.createElement('div');
        this.mouseInfo.id = 'mouse-info';
        this.mouseInfo.style.cssText = 'margin-bottom: 10px;';
        this.overlay.appendChild(this.mouseInfo);

        // Create piece info section
        this.pieceInfo = document.createElement('div');
        this.pieceInfo.id = 'piece-info';
        this.overlay.appendChild(this.pieceInfo);

        // Add to page
        document.body.appendChild(this.overlay);

        // Add mouse tracking
        this.addMouseTracking();

        // Start update loop
        this.startUpdateLoop();

        this.isVisible = true;
        console.log('✅ Visual debug overlay created');
    }

    /**
     * Hide the debug overlay
     */
    hide() {
        if (!this.isVisible) {
            console.log('⚠️ Debug overlay not visible');
            return;
        }

        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        this.stopUpdateLoop();
        this.removeMouseTracking();

        this.isVisible = false;
        console.log('✅ Visual debug overlay hidden');
    }

    /**
     * Toggle overlay visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Set which piece to track in detail
     */
    trackPiece(pieceIndex) {
        this.trackedPiece = pieceIndex;
        console.log(`🎯 Now tracking piece ${pieceIndex} in detail`);
    }

    /**
     * Stop tracking specific piece
     */
    stopTracking() {
        this.trackedPiece = -1;
        console.log('🎯 Stopped tracking specific piece');
    }

    /**
     * Add mouse tracking
     */
    addMouseTracking() {
        this.mouseMoveHandler = (e) => {
            if (!this.isVisible) return;
            
            const rect = this.renderer.canvas.getBoundingClientRect();
            this.currentMousePos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                clientX: e.clientX,
                clientY: e.clientY
            };
        };

        this.renderer.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    }

    /**
     * Remove mouse tracking
     */
    removeMouseTracking() {
        if (this.mouseMoveHandler) {
            this.renderer.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
            this.mouseMoveHandler = null;
        }
        this.currentMousePos = null;
    }

    /**
     * Start the update loop
     */
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            if (this.isVisible) {
                this.updateDisplay();
            }
        }, 100); // Update every 100ms
    }

    /**
     * Stop the update loop
     */
    stopUpdateLoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Update the display with current data
     */
    updateDisplay() {
        if (!this.overlay) return;

        // Update mouse info
        this.updateMouseInfo();

        // Update piece info
        this.updatePieceInfo();
    }

    /**
     * Update mouse information display
     */
    updateMouseInfo() {
        if (!this.mouseInfo) return;

        const mouseData = this.currentMousePos || { x: 'N/A', y: 'N/A', clientX: 'N/A', clientY: 'N/A' };
        
        // Add debugging info - check both puzzle and renderer for dragging state
        const puzzleExists = !!this.puzzle;
        const rendererExists = !!this.renderer;
        
        // Check dragging state from puzzle (main controller)
        // The puzzle might be the main VoronoiPuzzle instance, but the actual dragging is handled by currentRenderer
        let actualPuzzle = this.puzzle;
        if (this.puzzle && this.puzzle.currentRenderer) {
            actualPuzzle = this.puzzle.currentRenderer; // Use the WebGLRenderer instance that actually handles dragging
        }
        
        const puzzleIsDragging = actualPuzzle ? actualPuzzle.isDragging : false;
        const puzzleDraggedPiece = actualPuzzle ? actualPuzzle.draggedCellIndex : -1;
        
        // Check dragging state from renderer (secondary)
        const rendererIsDragging = rendererExists ? this.renderer.isDragging : false;
        const rendererDraggedPiece = rendererExists ? this.renderer.draggedPieceIndex : -1;
        
        this.mouseInfo.innerHTML = `
            <div style="color: #00ffff;"><strong>🖱️ Mouse:</strong></div>
            <div>Canvas: (${mouseData.x}, ${mouseData.y})</div>
            <div>Client: (${mouseData.clientX}, ${mouseData.clientY})</div>
            <div>Puzzle exists: ${puzzleExists ? 'YES' : 'NO'}</div>
            <div>Renderer exists: ${rendererExists ? 'YES' : 'NO'}</div>
            <div style="color: ${puzzleIsDragging ? '#ff0000' : '#00ff00'};">Puzzle Dragging: ${puzzleIsDragging} (${puzzleDraggedPiece})</div>
            <div style="color: ${rendererIsDragging ? '#ff0000' : '#00ff00'};">Renderer Dragging: ${rendererIsDragging} (${rendererDraggedPiece})</div>
        `;
    }

    /**
     * Update piece information display
     */
    updatePieceInfo() {
        if (!this.pieceInfo) return;

        let html = '<div style="color: #ffff00;"><strong>🧩 Pieces:</strong></div>';

        if (this.trackedPiece !== -1) {
            // Show detailed info for tracked piece
            html += this.getDetailedPieceInfo(this.trackedPiece);
        } else {
            // Show summary info for all pieces
            html += this.getSummaryInfo();
        }

        this.pieceInfo.innerHTML = html;
    }

    /**
     * Get detailed information for a specific piece
     */
    getDetailedPieceInfo(pieceIndex) {
        if (!this.renderer.pieces || !this.renderer.pieces[pieceIndex]) {
            return `<div style="color: #ff0000;">Piece ${pieceIndex}: NOT FOUND in renderer</div>`;
        }

        const piece = this.renderer.pieces[pieceIndex];
        
        // Get offset from unified object system (pieces[i].offset)
        const offset = piece.offset || { x: 0, y: 0 };
        
        // Get the actual puzzle instance that handles dragging
        let actualPuzzle = this.puzzle;
        if (this.puzzle && this.puzzle.currentRenderer) {
            actualPuzzle = this.puzzle.currentRenderer;
        }
        
        // Get original and current points from puzzle
        const originalPoint = actualPuzzle && actualPuzzle.originalPoints ? actualPuzzle.originalPoints[pieceIndex] : null;
        const currentPoint = actualPuzzle && actualPuzzle.points ? actualPuzzle.points[pieceIndex] : null;
        const state = piece.state || 'unknown';

        // Calculate the actual visual position (original + offset)
        const actualPosition = originalPoint ? 
            `(${(originalPoint[0] + offset.x).toFixed(1)}, ${(originalPoint[1] + offset.y).toFixed(1)})` : 
            'N/A';

        return `
            <div style="margin-top: 5px; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 3px;">
                <div style="color: #ffff00;"><strong>Piece ${pieceIndex}:</strong></div>
                <div>Original Point: (${originalPoint ? originalPoint[0].toFixed(1) : 'N/A'}, ${originalPoint ? originalPoint[1].toFixed(1) : 'N/A'})</div>
                <div>Current Point: (${currentPoint ? currentPoint[0].toFixed(1) : 'N/A'}, ${currentPoint ? currentPoint[1].toFixed(1) : 'N/A'})</div>
                <div style="color: #00ffff;"><strong>Actual Position: ${actualPosition}</strong></div>
                <div>Offset: (${offset.x.toFixed(1)}, ${offset.y.toFixed(1)})</div>
                <div>State: ${state}</div>
                <div>Has Mesh: ${piece.mesh ? 'YES' : 'NO'}</div>
                <div>Mesh Position: ${piece.mesh ? 
                    `(${piece.mesh.position.x.toFixed(1)}, ${piece.mesh.position.y.toFixed(1)})` : 'N/A'}</div>
                <div>Mesh Z: ${piece.mesh ? piece.mesh.position.z.toFixed(1) : 'N/A'}</div>
                <div>Is Dragging: ${actualPuzzle && actualPuzzle.isDragging && actualPuzzle.draggedCellIndex === pieceIndex ? 'YES' : 'NO'}</div>
            </div>
        `;
    }

    /**
     * Get summary information for all pieces
     */
    getSummaryInfo() {
        let html = '';
        
        // Check renderer data structure (unified object system)
        const rendererPieces = this.renderer.pieces;
        
        html += `<div style="color: #888; font-size: 10px;">Debug: renderer.pieces=${!!rendererPieces}, length=${rendererPieces ? rendererPieces.length : 0}</div>`;
        
        // Use renderer data structure (objects)
        if (!rendererPieces) {
            html += '<div style="color: #ff0000;">No renderer pieces found</div>';
            return html;
        }
        
        
        const maxPieces = Math.min(rendererPieces.length, 50); // Increased to show more pieces
        let foundActivePieces = false;
        let draggingPiece = -1;
        
        // Check if any piece is currently being dragged (check both puzzle and renderer)
        // The puzzle might be the main VoronoiPuzzle instance, but the actual dragging is handled by currentRenderer
        let actualPuzzle = this.puzzle;
        if (this.puzzle && this.puzzle.currentRenderer) {
            actualPuzzle = this.puzzle.currentRenderer; // Use the WebGLRenderer instance that actually handles dragging
        }
        
        if (actualPuzzle && actualPuzzle.isDragging && actualPuzzle.draggedCellIndex !== -1) {
            draggingPiece = actualPuzzle.draggedCellIndex;
        } else if (this.renderer && this.renderer.isDragging && this.renderer.draggedPieceIndex !== -1) {
            draggingPiece = this.renderer.draggedPieceIndex;
        }

        for (let i = 0; i < maxPieces; i++) {
            const piece = rendererPieces[i];
            if (!piece) continue;
            
            // Get offset from unified object system (piece.offset)
            const offset = piece.offset || { x: 0, y: 0 };
            const state = piece.state || 'unknown';
            const isDragging = (i === draggingPiece);
            
            
            // Show pieces that have offsets, are unsolved, are being dragged, or have been moved (track movement history)
            const hasOffset = offset && (offset.x !== 0 || offset.y !== 0);
            const isUnsolved = state === 'unsolved';
            const hasBeenMoved = piece.hasBeenMoved || false; // Track if piece has ever been moved
            
            
            if (hasOffset || isUnsolved || isDragging || hasBeenMoved) {
                foundActivePieces = true;
                const dragIndicator = isDragging ? ' 🖱️' : '';
                const movedIndicator = hasBeenMoved && !hasOffset ? ' 📍' : ''; // Show if moved but back at origin
                
                // Calculate actual position for display
                const actualPuzzle = this.puzzle && this.puzzle.currentRenderer ? this.puzzle.currentRenderer : this.puzzle;
                const originalPoint = actualPuzzle && actualPuzzle.originalPoints ? actualPuzzle.originalPoints[i] : null;
                const actualPos = originalPoint ? 
                    `(${(originalPoint[0] + offset.x).toFixed(1)}, ${(originalPoint[1] + offset.y).toFixed(1)})` : 
                    `Offset: (${offset.x.toFixed(1)}, ${offset.y.toFixed(1)})`;
                
                // Add auto-snap indicator if piece was moved but is now back at origin
                const autoSnappedIndicator = hasBeenMoved && !hasOffset && state === 'solved' ? ' 🔄' : '';
                
                html += `
                    <div style="margin-top: 2px; color: ${isDragging ? '#ff0000' : hasOffset ? '#ffff00' : '#ffffff'};">
                        Piece ${i}: ${state}${dragIndicator}${movedIndicator}${autoSnappedIndicator} - ${actualPos}
                    </div>
                `;
            }
        }

        // Always show the currently dragged piece if it exists and wasn't already shown
        if (draggingPiece !== -1 && draggingPiece >= maxPieces) {
            const piece = rendererPieces[draggingPiece];
            if (piece) {
                const offset = piece.offset || { x: 0, y: 0 };
                const state = piece.state || 'unknown';
                const actualPuzzle = this.puzzle && this.puzzle.currentRenderer ? this.puzzle.currentRenderer : this.puzzle;
                const originalPoint = actualPuzzle && actualPuzzle.originalPoints ? actualPuzzle.originalPoints[draggingPiece] : null;
                const actualPos = originalPoint ? 
                    `(${(originalPoint[0] + offset.x).toFixed(1)}, ${(originalPoint[1] + offset.y).toFixed(1)})` : 
                    `Offset: (${offset.x.toFixed(1)}, ${offset.y.toFixed(1)})`;
                
                html += `
                    <div style="margin-top: 2px; color: #ff0000;">
                        Piece ${draggingPiece}: ${state} 🖱️ - ${actualPos}
                    </div>
                `;
                foundActivePieces = true;
            }
        }

        if (!foundActivePieces) {
            html += '<div style="color: #888;">All pieces at origin</div>';
            // Fallback: show first few pieces anyway for debugging
            html += '<div style="color: #888; font-size: 10px; margin-top: 5px;">Debug - First 3 pieces:</div>';
            for (let i = 0; i < Math.min(3, rendererPieces.length); i++) {
                const piece = rendererPieces[i];
                if (piece) {
                    const offset = piece.offset || { x: 0, y: 0 };
                    const state = piece.state || 'unknown';
                    html += `<div style="color: #888; font-size: 10px;">Piece ${i}: ${state} - Offset: (${offset.x.toFixed(1)}, ${offset.y.toFixed(1)})</div>`;
                }
            }
        }

        return html;
    }

    /**
     * Highlight a piece on the canvas
     */
    highlightPiece(pieceIndex) {
        if (!this.renderer.pieces || !this.renderer.pieces[pieceIndex]) return;

        const piece = this.renderer.pieces[pieceIndex];
        if (piece.mesh) {
            // Store original scale
            if (!piece.originalScale) {
                piece.originalScale = piece.mesh.scale.clone();
            }
            
            // Highlight with pulsing effect
            piece.mesh.scale.setScalar(1.2);
            
            // Reset after 2 seconds
            setTimeout(() => {
                if (piece.mesh && piece.originalScale) {
                    piece.mesh.scale.copy(piece.originalScale);
                }
            }, 2000);
        }
    }

    /**
     * Add click handlers to overlay for interaction
     */
    makeInteractive() {
        if (!this.overlay) return;

        this.overlay.style.pointerEvents = 'auto';
        
        // Add click handler to cycle through pieces
        this.overlay.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (this.trackedPiece === -1) {
                // Start tracking first piece with offset
                for (let i = 0; i < (this.renderer.pieces ? this.renderer.pieces.length : 0); i++) {
                    const piece = this.renderer.pieces[i];
                    const offset = piece ? piece.offset : null;
                    if (offset && (offset.x !== 0 || offset.y !== 0)) {
                        this.trackPiece(i);
                        this.highlightPiece(i);
                        break;
                    }
                }
            } else {
                // Cycle to next piece with offset
                let found = false;
                for (let i = this.trackedPiece + 1; i < (this.renderer.pieces ? this.renderer.pieces.length : 0); i++) {
                    const piece = this.renderer.pieces[i];
                    const offset = piece ? piece.offset : null;
                    if (offset && (offset.x !== 0 || offset.y !== 0)) {
                        this.trackPiece(i);
                        this.highlightPiece(i);
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    this.stopTracking();
                }
            }
        });

        console.log('✅ Debug overlay made interactive - click to cycle through pieces');
    }
}

// Global functions for easy access
window.showDebugOverlay = function() {
    console.log('🔍 Debug overlay requested...');
    console.log('Available objects:', {
        webglRenderer: !!window.webglRenderer,
        voronoiPuzzle: !!window.voronoiPuzzle,
        puzzle: window.voronoiPuzzle ? Object.keys(window.voronoiPuzzle) : 'N/A'
    });
    
    if (window.webglRenderer && window.voronoiPuzzle) {
        if (!window.visualDebugOverlay) {
            window.visualDebugOverlay = new VisualDebugOverlay(window.webglRenderer, window.voronoiPuzzle);
        }
        window.visualDebugOverlay.show();
        return true;
    } else {
        console.warn('⚠️ WebGL renderer or puzzle not available');
        console.log('webglRenderer:', window.webglRenderer);
        console.log('voronoiPuzzle:', window.voronoiPuzzle);
        return false;
    }
};

window.hideDebugOverlay = function() {
    if (window.visualDebugOverlay) {
        window.visualDebugOverlay.hide();
        return true;
    } else {
        console.warn('⚠️ Visual debug overlay not active');
        return false;
    }
};

window.toggleDebugOverlay = function() {
    if (window.visualDebugOverlay) {
        window.visualDebugOverlay.toggle();
        return true;
    } else {
        console.warn('⚠️ Visual debug overlay not available');
        return false;
    }
};

window.trackDebugPiece = function(pieceIndex) {
    if (window.visualDebugOverlay) {
        window.visualDebugOverlay.trackPiece(pieceIndex);
        return true;
    } else {
        console.warn('⚠️ Visual debug overlay not active');
        return false;
    }
};

window.makeDebugOverlayInteractive = function() {
    if (window.visualDebugOverlay) {
        window.visualDebugOverlay.makeInteractive();
        return true;
    } else {
        console.warn('⚠️ Visual debug overlay not active');
        return false;
    }
};

// Add to debug commands
if (typeof window !== 'undefined') {
    const originalShowDebug = window.showDebugCommands;
    window.showDebugCommands = function() {
        if (originalShowDebug) originalShowDebug();
        console.log('  showDebugOverlay() - Show visual debug overlay');
        console.log('  hideDebugOverlay() - Hide visual debug overlay');
        console.log('  toggleDebugOverlay() - Toggle debug overlay visibility');
        console.log('  trackDebugPiece(pieceIndex) - Track specific piece in detail');
        console.log('  makeDebugOverlayInteractive() - Make overlay clickable');
    };
}
