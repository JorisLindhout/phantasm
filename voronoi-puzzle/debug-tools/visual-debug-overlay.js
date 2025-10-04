/**
 * Visual Debug Overlay
 * Shows real-time piece position data, mouse coordinates, and dragging state
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
        
        // Add debugging info
        const puzzleExists = !!this.puzzle;
        const isDragging = puzzleExists ? this.puzzle.isDragging : 'N/A';
        const draggedPiece = puzzleExists ? this.puzzle.draggedCellIndex : 'N/A';
        
        this.mouseInfo.innerHTML = `
            <div style="color: #00ffff;"><strong>🖱️ Mouse:</strong></div>
            <div>Canvas: (${mouseData.x}, ${mouseData.y})</div>
            <div>Client: (${mouseData.clientX}, ${mouseData.clientY})</div>
            <div>Puzzle exists: ${puzzleExists ? 'YES' : 'NO'}</div>
            <div>Dragging: ${isDragging}</div>
            <div>Dragged Piece: ${draggedPiece}</div>
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
        
        // Get data from both puzzle and renderer
        const puzzleOffset = this.puzzle.pieceOffsets ? this.puzzle.pieceOffsets[pieceIndex] : null;
        const rendererOffset = this.renderer.pieceOffsets ? this.renderer.pieceOffsets[pieceIndex] : null;
        const offset = rendererOffset || puzzleOffset || { x: 0, y: 0 };
        
        const originalPoint = this.puzzle.originalPoints ? this.puzzle.originalPoints[pieceIndex] : null;
        const currentPoint = this.puzzle.points ? this.puzzle.points[pieceIndex] : null;
        const state = piece.state || 'unknown';

        return `
            <div style="margin-top: 5px; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 3px;">
                <div style="color: #ffff00;"><strong>Piece ${pieceIndex}:</strong></div>
                <div>Original Point: (${originalPoint ? originalPoint[0].toFixed(1) : 'N/A'}, ${originalPoint ? originalPoint[1].toFixed(1) : 'N/A'})</div>
                <div>Current Point: (${currentPoint ? currentPoint[0].toFixed(1) : 'N/A'}, ${currentPoint ? currentPoint[1].toFixed(1) : 'N/A'})</div>
                <div>Offset: (${offset.x.toFixed(1)}, ${offset.y.toFixed(1)})</div>
                <div>State: ${state}</div>
                <div>Has Mesh: ${piece.mesh ? 'YES' : 'NO'}</div>
                <div>Mesh Position: ${piece.mesh ? 
                    `(${piece.mesh.position.x.toFixed(1)}, ${piece.mesh.position.y.toFixed(1)})` : 'N/A'}</div>
                <div>Offset Source: ${rendererOffset ? 'renderer' : (puzzleOffset ? 'puzzle' : 'default')}</div>
            </div>
        `;
    }

    /**
     * Get summary information for all pieces
     */
    getSummaryInfo() {
        let html = '';
        
        // Check both puzzle and renderer data structures
        const puzzlePieces = this.puzzle.pieces;
        const rendererPieces = this.renderer.pieces;
        const puzzleOffsets = this.puzzle.pieceOffsets;
        const rendererOffsets = this.renderer.pieceOffsets;
        
        html += `<div style="color: #888; font-size: 10px;">Debug: puzzle.pieces=${!!puzzlePieces}, renderer.pieces=${!!rendererPieces}, puzzle.offsets=${!!puzzleOffsets}, renderer.offsets=${!!rendererOffsets}</div>`;
        
        // Use renderer data structure (objects)
        if (!rendererPieces) {
            html += '<div style="color: #ff0000;">No renderer pieces found</div>';
            return html;
        }
        
        const maxPieces = Math.min(rendererPieces.length, 10);
        let foundOffsets = false;

        for (let i = 0; i < maxPieces; i++) {
            const piece = rendererPieces[i];
            if (!piece) continue;
            
            // Get offset from either puzzle or renderer
            const offset = rendererOffsets ? rendererOffsets[i] : (piece.offset || { x: 0, y: 0 });
            const state = piece.state || 'unknown';
            
            if (offset && (offset.x !== 0 || offset.y !== 0 || state === 'unsolved')) {
                foundOffsets = true;
                html += `
                    <div style="margin-top: 2px;">
                        Piece ${i}: ${state} - Offset: (${offset.x.toFixed(1)}, ${offset.y.toFixed(1)})
                    </div>
                `;
            }
        }

        if (!foundOffsets) {
            html += '<div style="color: #888;">All pieces at origin</div>';
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
                for (let i = 0; i < (this.puzzle.pieces ? this.puzzle.pieces.length : 0); i++) {
                    const offset = this.puzzle.pieceOffsets ? this.puzzle.pieceOffsets[i] : null;
                    if (offset && (offset.x !== 0 || offset.y !== 0)) {
                        this.trackPiece(i);
                        this.highlightPiece(i);
                        break;
                    }
                }
            } else {
                // Cycle to next piece with offset
                let found = false;
                for (let i = this.trackedPiece + 1; i < (this.puzzle.pieces ? this.puzzle.pieces.length : 0); i++) {
                    const offset = this.puzzle.pieceOffsets ? this.puzzle.pieceOffsets[i] : null;
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
