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
        this.currentContext = null; // Track current debugging context
        this.contextSections = {}; // Store context-specific sections
    }

    /**
     * Create and show the debug overlay
     */
    show() {
        if (this.isVisible) {
            SmartLogger.log('debug-tools', '⚠️ Debug overlay already visible');
            return;
        }

        SmartLogger.log('debug-tools', '🔍 Creating visual debug overlay...');

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

        // Create header with context info
        const header = document.createElement('div');
        header.innerHTML = '<strong>🔍 DEBUG OVERLAY</strong>';
        header.style.cssText = 'margin-bottom: 10px; color: #ffff00;';
        this.overlay.appendChild(header);

        // Create context info section
        this.contextInfo = document.createElement('div');
        this.contextInfo.id = 'context-info';
        this.contextInfo.style.cssText = 'margin-bottom: 10px; color: #00ffff; font-size: 11px;';
        this.overlay.appendChild(this.contextInfo);

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
        SmartLogger.log('debug-tools', '✅ Visual debug overlay created');
    }

    /**
     * Hide the debug overlay
     */
    hide() {
        if (!this.isVisible) {
            SmartLogger.log('debug-tools', '⚠️ Debug overlay not visible');
            return;
        }

        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        this.stopUpdateLoop();
        this.removeMouseTracking();

        this.isVisible = false;
        SmartLogger.log('debug-tools', '✅ Visual debug overlay hidden');
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
        SmartLogger.log('debug-tools', `🎯 Now tracking piece ${pieceIndex} in detail`);
    }

    /**
     * Stop tracking specific piece
     */
    stopTracking() {
        this.trackedPiece = -1;
        SmartLogger.log('debug-tools', '🎯 Stopped tracking specific piece');
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

        // Update context info
        this.updateContextInfo();

        // Update mouse info
        this.updateMouseInfo();

        // Update piece info
        this.updatePieceInfo();

        // Update context-specific sections
        this.updateContextSections();

        // Update context-specific data
        this.updateContextSpecificData();
    }

    /**
     * Update context information display
     */
    updateContextInfo() {
        if (!this.contextInfo) return;

        const currentContext = window.ContextManager ? window.ContextManager.getCurrentContext() : null;
        const debugMode = window.SmartLogger ? window.SmartLogger.currentMode : 'unknown';
        const activeCategories = window.SmartLogger ? Array.from(window.SmartLogger.categories) : [];

        this.contextInfo.innerHTML = `
            <div><strong>🎯 Context:</strong> ${currentContext ? currentContext.name : 'None'}</div>
            <div><strong>🔧 Mode:</strong> ${debugMode}</div>
            <div><strong>📋 Categories:</strong> ${activeCategories.join(', ')}</div>
        `;
    }

    /**
     * Update context-specific sections
     */
    updateContextSections() {
        if (!window.ContextManager) return;

        const currentContext = window.ContextManager.getCurrentContext();
        const contextName = currentContext ? currentContext.name : 'None';

        // Only update if context changed
        if (this.currentContext === contextName) return;
        this.currentContext = contextName;

        // Remove old context sections
        Object.values(this.contextSections).forEach(section => {
            if (section && section.parentNode) {
                section.parentNode.removeChild(section);
            }
        });
        this.contextSections = {};

        // Add new context-specific sections
        this.addContextSections(currentContext);
    }

    /**
     * Add context-specific sections to the overlay
     */
    addContextSections(context) {
        if (!context || !this.overlay) return;

        switch (context.name) {
            case 'Puzzle Solving':
                this.addPuzzleSolvingSection();
                break;
            case 'Performance Debugging':
                this.addPerformanceSection();
                break;
            case 'Coordinate Issues':
                this.addCoordinateSection();
                break;
            case 'Hit Detection Problems':
                this.addHitDetectionSection();
                break;
            case 'Theme Development':
                this.addThemeSection();
                break;
            case 'Full Debugging':
                this.addFullDebuggingSection();
                break;
        }
    }

    /**
     * Add puzzle solving specific section
     */
    addPuzzleSolvingSection() {
        const section = document.createElement('div');
        section.id = 'puzzle-solving-section';
        section.style.cssText = 'margin-top: 10px; padding: 5px; background: rgba(0,255,0,0.1); border-radius: 3px;';
        section.innerHTML = `
            <div style="color: #00ff00;"><strong>🧩 Puzzle Solving:</strong></div>
            <div id="puzzle-progress">Progress: Calculating...</div>
            <div id="unsolved-count">Unsolved pieces: Calculating...</div>
        `;
        this.overlay.appendChild(section);
        this.contextSections['puzzle-solving'] = section;
    }

    /**
     * Add performance debugging section
     */
    addPerformanceSection() {
        const section = document.createElement('div');
        section.id = 'performance-section';
        section.style.cssText = 'margin-top: 10px; padding: 5px; background: rgba(255,255,0,0.1); border-radius: 3px;';
        section.innerHTML = `
            <div style="color: #ffff00;"><strong>⚡ Performance:</strong></div>
            <div id="fps-counter">FPS: Calculating...</div>
            <div id="render-time">Render time: Calculating...</div>
            <div id="piece-count">Active pieces: Calculating...</div>
        `;
        this.overlay.appendChild(section);
        this.contextSections['performance'] = section;
    }

    /**
     * Add coordinate issues section
     */
    addCoordinateSection() {
        const section = document.createElement('div');
        section.id = 'coordinate-section';
        section.style.cssText = 'margin-top: 10px; padding: 5px; background: rgba(255,0,255,0.1); border-radius: 3px;';
        section.innerHTML = `
            <div style="color: #ff00ff;"><strong>📍 Coordinates:</strong></div>
            <div id="coordinate-inconsistencies">Inconsistencies: Calculating...</div>
            <div id="coordinate-precision">Precision: Calculating...</div>
        `;
        this.overlay.appendChild(section);
        this.contextSections['coordinates'] = section;
    }

    /**
     * Add hit detection section
     */
    addHitDetectionSection() {
        const section = document.createElement('div');
        section.id = 'hit-detection-section';
        section.style.cssText = 'margin-top: 10px; padding: 5px; background: rgba(255,0,0,0.1); border-radius: 3px;';
        section.innerHTML = `
            <div style="color: #ff0000;"><strong>🎯 Hit Detection:</strong></div>
            <div id="hit-accuracy">Accuracy: Calculating...</div>
            <div id="missed-hits">Missed hits: Calculating...</div>
            <div id="raycaster-info">Raycaster info: Calculating...</div>
        `;
        this.overlay.appendChild(section);
        this.contextSections['hit-detection'] = section;
    }

    /**
     * Add theme development section
     */
    addThemeSection() {
        const section = document.createElement('div');
        section.id = 'theme-section';
        section.style.cssText = 'margin-top: 10px; padding: 5px; background: rgba(0,255,255,0.1); border-radius: 3px;';
        section.innerHTML = `
            <div style="color: #00ffff;"><strong>🎨 Theme:</strong></div>
            <div id="current-theme">Current theme: Calculating...</div>
            <div id="theme-colors">Colors: Calculating...</div>
        `;
        this.overlay.appendChild(section);
        this.contextSections['theme'] = section;
    }

    /**
     * Add full debugging section
     */
    addFullDebuggingSection() {
        const section = document.createElement('div');
        section.id = 'full-debugging-section';
        section.style.cssText = 'margin-top: 10px; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 3px;';
        section.innerHTML = `
            <div style="color: #ffffff;"><strong>🔍 Full Debug:</strong></div>
            <div id="system-status">System status: Calculating...</div>
            <div id="all-metrics">All metrics: Calculating...</div>
        `;
        this.overlay.appendChild(section);
        this.contextSections['full-debugging'] = section;
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
     * Update context-specific data
     */
    updateContextSpecificData() {
        if (!this.overlay) return;

        // Update puzzle solving data
        if (this.contextSections['puzzle-solving']) {
            this.updatePuzzleSolvingData();
        }

        // Update performance data
        if (this.contextSections['performance']) {
            this.updatePerformanceData();
        }

        // Update coordinate data
        if (this.contextSections['coordinates']) {
            this.updateCoordinateData();
        }

        // Update hit detection data
        if (this.contextSections['hit-detection']) {
            this.updateHitDetectionData();
        }

        // Update theme data
        if (this.contextSections['theme']) {
            this.updateThemeData();
        }

        // Update full debugging data
        if (this.contextSections['full-debugging']) {
            this.updateFullDebuggingData();
        }
    }

    /**
     * Update puzzle solving specific data
     */
    updatePuzzleSolvingData() {
        const section = this.contextSections['puzzle-solving'];
        if (!section) return;

        const progressEl = section.querySelector('#puzzle-progress');
        const unsolvedEl = section.querySelector('#unsolved-count');

        if (progressEl && unsolvedEl && this.renderer.pieces) {
            const totalPieces = this.renderer.pieces.length;
            const solvedPieces = this.renderer.pieces.filter(p => p.state === 'solved').length;
            const unsolvedPieces = totalPieces - solvedPieces;
            const progress = totalPieces > 0 ? ((solvedPieces / totalPieces) * 100).toFixed(1) : 0;

            progressEl.textContent = `Progress: ${progress}% (${solvedPieces}/${totalPieces})`;
            unsolvedEl.textContent = `Unsolved pieces: ${unsolvedPieces}`;
        }
    }

    /**
     * Update performance specific data
     */
    updatePerformanceData() {
        const section = this.contextSections['performance'];
        if (!section) return;

        const fpsEl = section.querySelector('#fps-counter');
        const renderTimeEl = section.querySelector('#render-time');
        const pieceCountEl = section.querySelector('#piece-count');

        if (fpsEl && renderTimeEl && pieceCountEl) {
            // Simple FPS calculation (this could be enhanced with actual timing)
            const now = performance.now();
            if (!this.lastFrameTime) this.lastFrameTime = now;
            const fps = Math.round(1000 / (now - this.lastFrameTime));
            this.lastFrameTime = now;

            fpsEl.textContent = `FPS: ${fps}`;
            renderTimeEl.textContent = `Render time: ${(now - this.lastFrameTime).toFixed(2)}ms`;
            
            if (this.renderer.pieces) {
                const activePieces = this.renderer.pieces.filter(p => p.mesh && p.mesh.visible).length;
                pieceCountEl.textContent = `Active pieces: ${activePieces}`;
            }
        }
    }

    /**
     * Update coordinate specific data
     */
    updateCoordinateData() {
        const section = this.contextSections['coordinates'];
        if (!section) return;

        const inconsistenciesEl = section.querySelector('#coordinate-inconsistencies');
        const precisionEl = section.querySelector('#coordinate-precision');

        if (inconsistenciesEl && precisionEl && this.renderer.pieces) {
            let inconsistencies = 0;
            let totalPrecision = 0;
            let precisionCount = 0;

            this.renderer.pieces.forEach(piece => {
                if (piece.offset) {
                    const offset = Math.sqrt(piece.offset.x * piece.offset.x + piece.offset.y * piece.offset.y);
                    if (offset > 0.1) inconsistencies++;
                    totalPrecision += offset;
                    precisionCount++;
                }
            });

            inconsistenciesEl.textContent = `Inconsistencies: ${inconsistencies}`;
            precisionEl.textContent = `Precision: ${precisionCount > 0 ? (totalPrecision / precisionCount).toFixed(3) : '0.000'}`;
        }
    }

    /**
     * Update hit detection specific data
     */
    updateHitDetectionData() {
        const section = this.contextSections['hit-detection'];
        if (!section) return;

        const accuracyEl = section.querySelector('#hit-accuracy');
        const missedHitsEl = section.querySelector('#missed-hits');
        const raycasterEl = section.querySelector('#raycaster-info');

        if (accuracyEl && missedHitsEl && raycasterEl) {
            // This would need to be connected to actual hit detection metrics
            accuracyEl.textContent = `Accuracy: Calculating...`;
            missedHitsEl.textContent = `Missed hits: Calculating...`;
            raycasterEl.textContent = `Raycaster info: Available`;
        }
    }

    /**
     * Update theme specific data
     */
    updateThemeData() {
        const section = this.contextSections['theme'];
        if (!section) return;

        const currentThemeEl = section.querySelector('#current-theme');
        const themeColorsEl = section.querySelector('#theme-colors');

        if (currentThemeEl && themeColorsEl) {
            const themeManager = window.themeManager;
            if (themeManager) {
                currentThemeEl.textContent = `Current theme: ${themeManager.getCurrentTheme()}`;
                themeColorsEl.textContent = `Colors: ${themeManager.getAvailableThemes().length} available`;
            } else {
                currentThemeEl.textContent = `Current theme: Unknown`;
                themeColorsEl.textContent = `Colors: Unknown`;
            }
        }
    }

    /**
     * Update full debugging data
     */
    updateFullDebuggingData() {
        const section = this.contextSections['full-debugging'];
        if (!section) return;

        const systemStatusEl = section.querySelector('#system-status');
        const allMetricsEl = section.querySelector('#all-metrics');

        if (systemStatusEl && allMetricsEl) {
            const systemStatus = this.renderer && this.puzzle ? 'Operational' : 'Issues detected';
            systemStatusEl.textContent = `System status: ${systemStatus}`;
            
            const metrics = [];
            if (this.renderer.pieces) metrics.push(`${this.renderer.pieces.length} pieces`);
            if (this.currentMousePos) metrics.push('Mouse tracking active');
            if (this.trackedPiece !== -1) metrics.push(`Tracking piece ${this.trackedPiece}`);
            
            allMetricsEl.textContent = `All metrics: ${metrics.join(', ')}`;
        }
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

        SmartLogger.log('debug-tools', '✅ Debug overlay made interactive - click to cycle through pieces');
    }

    /**
     * Set context-aware visibility based on current debugging context
     */
    setContextAwareVisibility() {
        if (!window.ContextManager) return;

        const currentContext = window.ContextManager.getCurrentContext();
        if (!currentContext) return;

        // Show overlay for contexts that benefit from visual debugging
        const visualContexts = [
            'Puzzle Solving',
            'Performance Debugging', 
            'Coordinate Issues',
            'Hit Detection Problems',
            'Theme Development',
            'Full Debugging'
        ];

        if (visualContexts.includes(currentContext.name)) {
            if (!this.isVisible) {
                this.show();
                SmartLogger.log('debug-tools', `🎯 Auto-showing overlay for context: ${currentContext.name}`);
            }
        } else {
            if (this.isVisible) {
                this.hide();
                SmartLogger.log('debug-tools', `🎯 Auto-hiding overlay for context: ${currentContext.name}`);
            }
        }
    }

    /**
     * Force refresh of all context sections
     */
    refreshContextSections() {
        this.currentContext = null; // Force refresh
        this.updateContextSections();
    }
}

// Global functions for easy access
window.showDebugOverlay = function() {
    SmartLogger.log('debug-tools', '🔍 Debug overlay requested...');
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

window.setDebugOverlayContextAware = function() {
    if (window.visualDebugOverlay) {
        window.visualDebugOverlay.setContextAwareVisibility();
        return true;
    } else {
        console.warn('⚠️ Visual debug overlay not active');
        return false;
    }
};

window.refreshDebugOverlayContext = function() {
    if (window.visualDebugOverlay) {
        window.visualDebugOverlay.refreshContextSections();
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
        console.log('  setDebugOverlayContextAware() - Enable context-aware overlay');
        console.log('  refreshDebugOverlayContext() - Refresh overlay context sections');
    };
}
