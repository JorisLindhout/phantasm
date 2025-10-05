/**
 * Mouse Movement Correlation Diagnostic Tool
 * Investigates the correlation between mouse movement and piece position jumps after release
 * 
 * Key observations:
 * - Piece jumps in the direction of mouse movement
 * - Small mouse movements cause large piece jumps
 * - Large mouse movements cause small piece jumps
 * - Happens even when waiting before moving mouse
 */

class MouseMovementCorrelationDiagnostic {
    constructor(webglRenderer, mainPuzzle) {
        this.renderer = webglRenderer;
        this.puzzle = mainPuzzle;
        this.movementLogs = [];
        this.correlationData = [];
        this.isMonitoring = false;
        this.lastMousePosition = null;
        this.lastReleaseTime = null;
        this.lastReleasePiece = null;
    }

    /**
     * Enable mouse movement correlation monitoring
     */
    enableMouseMovementMonitoring() {
        SmartLogger.log('debug-tools','🔍 Enabling mouse movement correlation monitoring...');
        
        if (this.isMonitoring) {
            SmartLogger.log('debug-tools','⚠️ Mouse movement monitoring already enabled');
            return;
        }
        
        this.isMonitoring = true;
        
        // Store original methods
        this.originalHandleMouseUp = this.puzzle.handleMouseUp;
        this.originalHandleMouseMove = this.puzzle.handleMouseMove;
        
        // Override methods with monitoring
        this.puzzle.handleMouseUp = this.monitoredHandleMouseUp.bind(this);
        this.puzzle.handleMouseMove = this.monitoredHandleMouseMove.bind(this);
        
        // Add mouse move listener to track all mouse movement
        this.canvas = this.renderer.canvas;
        this.canvas.addEventListener('mousemove', this.trackMouseMovement.bind(this));
        
        SmartLogger.log('debug-tools','✅ Mouse movement correlation monitoring enabled');
        SmartLogger.log('debug-tools','📝 Now drag and release pieces, then move mouse to capture correlations');
    }

    /**
     * Disable mouse movement correlation monitoring
     */
    disableMouseMovementMonitoring() {
        SmartLogger.log('debug-tools','🔍 Disabling mouse movement correlation monitoring...');
        
        if (!this.isMonitoring) {
            SmartLogger.log('debug-tools','⚠️ Mouse movement monitoring not enabled');
            return;
        }
        
        this.isMonitoring = false;
        
        // Restore original methods
        if (this.originalHandleMouseUp) {
            this.puzzle.handleMouseUp = this.originalHandleMouseUp;
        }
        if (this.originalHandleMouseMove) {
            this.puzzle.handleMouseMove = this.originalHandleMouseMove;
        }
        
        // Remove mouse move listener
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.trackMouseMovement.bind(this));
        }
        
        SmartLogger.log('debug-tools','✅ Mouse movement correlation monitoring disabled');
    }

    /**
     * Track all mouse movement (not just during dragging)
     */
    trackMouseMovement(e) {
        if (!this.isMonitoring) return;
        
        const currentPosition = this.getCanvasCoordinates(e);
        
        if (this.lastMousePosition && this.lastReleaseTime && this.lastReleasePiece !== null) {
            const timeSinceRelease = Date.now() - this.lastReleaseTime;
            
            // Only track movement within 5 seconds of release
            if (timeSinceRelease < 5000) {
                const mouseDelta = {
                    x: currentPosition.x - this.lastMousePosition.x,
                    y: currentPosition.y - this.lastMousePosition.y
                };
                
                const mouseDistance = Math.sqrt(mouseDelta.x * mouseDelta.x + mouseDelta.y * mouseDelta.y);
                
                // Check if piece position has changed
                const currentPieceOffset = this.renderer.pieces[this.lastReleasePiece]?.offset || { x: 0, y: 0 };
                
                this.movementLogs.push({
                    timestamp: Date.now(),
                    timeSinceRelease,
                    mousePosition: currentPosition,
                    mouseDelta,
                    mouseDistance,
                    pieceOffset: { ...currentPieceOffset },
                    pieceIndex: this.lastReleasePiece
                });
                
                // Check for significant piece movement
                if (this.movementLogs.length > 1) {
                    const prevLog = this.movementLogs[this.movementLogs.length - 2];
                    const pieceDelta = {
                        x: currentPieceOffset.x - prevLog.pieceOffset.x,
                        y: currentPieceOffset.y - prevLog.pieceOffset.y
                    };
                    
                    const pieceDistance = Math.sqrt(pieceDelta.x * pieceDelta.x + pieceDelta.y * pieceDelta.y);
                    
                    if (pieceDistance > 2) { // Piece moved more than 2 pixels
                        this.correlationData.push({
                            timeSinceRelease,
                            mouseDelta,
                            mouseDistance,
                            pieceDelta,
                            pieceDistance,
                            pieceIndex: this.lastReleasePiece,
                            correlation: this.calculateCorrelation(mouseDelta, pieceDelta)
                        });
                        
                        SmartLogger.log('debug-tools',`🔄 CORRELATION DETECTED - Piece ${this.lastReleasePiece}:`, {
                            timeSinceRelease: timeSinceRelease + 'ms',
                            mouseDistance: mouseDistance.toFixed(2) + 'px',
                            pieceDistance: pieceDistance.toFixed(2) + 'px',
                            mouseDirection: `(${mouseDelta.x.toFixed(1)}, ${mouseDelta.y.toFixed(1)})`,
                            pieceDirection: `(${pieceDelta.x.toFixed(1)}, ${pieceDelta.y.toFixed(1)})`,
                            correlation: this.correlationData[this.correlationData.length - 1].correlation
                        });
                    }
                }
            }
        }
        
        this.lastMousePosition = currentPosition;
    }

    /**
     * Calculate correlation between mouse movement and piece movement
     */
    calculateCorrelation(mouseDelta, pieceDelta) {
        const mouseMagnitude = Math.sqrt(mouseDelta.x * mouseDelta.x + mouseDelta.y * mouseDelta.y);
        const pieceMagnitude = Math.sqrt(pieceDelta.x * pieceDelta.x + pieceDelta.y * pieceDelta.y);
        
        if (mouseMagnitude === 0 || pieceMagnitude === 0) {
            return 0;
        }
        
        // Dot product to find directional correlation
        const dotProduct = mouseDelta.x * pieceDelta.x + mouseDelta.y * pieceDelta.y;
        const correlation = dotProduct / (mouseMagnitude * pieceMagnitude);
        
        return correlation;
    }

    /**
     * Monitored mouse up handler
     */
    monitoredHandleMouseUp(e) {
        const coords = this.getCanvasCoordinates(e);
        
        if (this.puzzle.isDragging && this.puzzle.draggedCellIndex !== -1) {
            this.lastReleaseTime = Date.now();
            this.lastReleasePiece = this.puzzle.draggedCellIndex;
            this.lastMousePosition = coords;
            
            SmartLogger.log('debug-tools',`🎯 RELEASE TRACKED - Piece ${this.lastReleasePiece}:`, {
                releasePosition: `(${coords.x.toFixed(1)}, ${coords.y.toFixed(1)})`,
                pieceOffset: this.renderer.pieces[this.lastReleasePiece]?.offset || { x: 0, y: 0 }
            });
        }
        
        return this.originalHandleMouseUp.call(this.puzzle, e);
    }

    /**
     * Monitored mouse move handler (during dragging)
     */
    monitoredHandleMouseMove(e) {
        const coords = this.getCanvasCoordinates(e);
        this.lastMousePosition = coords;
        
        return this.originalHandleMouseMove.call(this.puzzle, e);
    }

    /**
     * Get canvas coordinates from mouse event
     */
    getCanvasCoordinates(e) {
        const rect = this.renderer.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    /**
     * Generate correlation analysis report
     */
    generateCorrelationReport() {
        SmartLogger.log('debug-tools','\n📋 MOUSE MOVEMENT CORRELATION REPORT');
        SmartLogger.log('debug-tools','=====================================');
        
        SmartLogger.log('debug-tools',`\n📊 Statistics:`);
        SmartLogger.log('debug-tools',`   Total mouse movements tracked: ${this.movementLogs.length}`);
        SmartLogger.log('debug-tools',`   Correlation events detected: ${this.correlationData.length}`);
        
        if (this.correlationData.length > 0) {
            SmartLogger.log('debug-tools','\n🔄 CORRELATION ANALYSIS:');
            
            // Calculate average correlation
            const avgCorrelation = this.correlationData.reduce((sum, data) => sum + data.correlation, 0) / this.correlationData.length;
            SmartLogger.log('debug-tools',`   Average correlation: ${avgCorrelation.toFixed(3)}`);
            
            // Analyze inverse relationship (small mouse = large piece, large mouse = small piece)
            const smallMouseMovements = this.correlationData.filter(d => d.mouseDistance < 10);
            const largeMouseMovements = this.correlationData.filter(d => d.mouseDistance > 50);
            
            if (smallMouseMovements.length > 0) {
                const avgPieceMovementSmall = smallMouseMovements.reduce((sum, d) => sum + d.pieceDistance, 0) / smallMouseMovements.length;
                SmartLogger.log('debug-tools',`   Small mouse movements (avg piece response): ${avgPieceMovementSmall.toFixed(2)}px`);
            }
            
            if (largeMouseMovements.length > 0) {
                const avgPieceMovementLarge = largeMouseMovements.reduce((sum, d) => sum + d.pieceDistance, 0) / largeMouseMovements.length;
                SmartLogger.log('debug-tools',`   Large mouse movements (avg piece response): ${avgPieceMovementLarge.toFixed(2)}px`);
            }
            
            SmartLogger.log('debug-tools','\n🎯 DETAILED CORRELATIONS:');
            this.correlationData.forEach((correlation, index) => {
                SmartLogger.log('debug-tools',`   ${index + 1}. Time: ${correlation.timeSinceRelease}ms, Mouse: ${correlation.mouseDistance.toFixed(1)}px, Piece: ${correlation.pieceDistance.toFixed(1)}px, Corr: ${correlation.correlation.toFixed(3)}`);
            });
            
            SmartLogger.log('debug-tools','\n🔍 LIKELY CAUSES:');
            if (avgCorrelation > 0.7) {
                SmartLogger.log('debug-tools','   ✅ Strong positive correlation - Mouse movement directly causes piece movement');
                SmartLogger.log('debug-tools','   🎯 Possible cause: Coordinate system mismatch or event handling issue');
            } else if (avgCorrelation < -0.7) {
                SmartLogger.log('debug-tools','   ❌ Strong negative correlation - Mouse movement causes opposite piece movement');
                SmartLogger.log('debug-tools','   🎯 Possible cause: Inverted coordinate system or sign error');
            } else {
                SmartLogger.log('debug-tools','   ⚠️ Weak correlation - Relationship is not straightforward');
                SmartLogger.log('debug-tools','   🎯 Possible cause: Complex interaction or multiple factors');
            }
            
            SmartLogger.log('debug-tools','\n🔧 RECOMMENDED INVESTIGATIONS:');
            SmartLogger.log('debug-tools','   1. Check coordinate system consistency between mouse and piece positioning');
            SmartLogger.log('debug-tools','   2. Investigate event handling timing and order');
            SmartLogger.log('debug-tools','   3. Look for coordinate transformation errors');
            SmartLogger.log('debug-tools','   4. Check for event listener conflicts or multiple handlers');
            
        } else {
            SmartLogger.log('debug-tools','\n✅ NO CORRELATIONS DETECTED');
            SmartLogger.log('debug-tools','   Mouse movement does not appear to affect piece positions');
        }
        
        return {
            totalMovements: this.movementLogs.length,
            correlationsDetected: this.correlationData.length,
            correlationData: this.correlationData
        };
    }

    /**
     * Clear all diagnostic data
     */
    clearCorrelationData() {
        this.movementLogs = [];
        this.correlationData = [];
        this.lastMousePosition = null;
        this.lastReleaseTime = null;
        this.lastReleasePiece = null;
        SmartLogger.log('debug-tools','🗑️ Mouse movement correlation data cleared');
    }
}

// Global functions for easy access
window.enableMouseMovementMonitoring = function() {
    if (window.webglRenderer && window.voronoiPuzzle) {
        if (!window.mouseMovementDiagnostic) {
            window.mouseMovementDiagnostic = new MouseMovementCorrelationDiagnostic(window.webglRenderer, window.voronoiPuzzle);
        }
        window.mouseMovementDiagnostic.enableMouseMovementMonitoring();
        return true;
    } else {
        console.warn('⚠️ WebGL renderer or puzzle not available');
        return false;
    }
};

window.disableMouseMovementMonitoring = function() {
    if (window.mouseMovementDiagnostic) {
        window.mouseMovementDiagnostic.disableMouseMovementMonitoring();
        return true;
    } else {
        console.warn('⚠️ Mouse movement monitoring not active');
        return false;
    }
};

window.analyzeMouseCorrelations = function() {
    if (window.mouseMovementDiagnostic) {
        return window.mouseMovementDiagnostic.generateCorrelationReport();
    } else {
        console.warn('⚠️ Mouse movement monitoring not active - run enableMouseMovementMonitoring() first');
        return null;
    }
};

window.clearMouseCorrelationData = function() {
    if (window.mouseMovementDiagnostic) {
        window.mouseMovementDiagnostic.clearCorrelationData();
        return true;
    } else {
        console.warn('⚠️ Mouse movement monitoring not active');
        return false;
    }
};

// Add to debug commands
if (typeof window !== 'undefined') {
    const originalShowDebug = window.showDebugCommands;
    window.showDebugCommands = function() {
        if (originalShowDebug) originalShowDebug();
        SmartLogger.log('debug-tools','  enableMouseMovementMonitoring() - Monitor mouse movement correlations');
        SmartLogger.log('debug-tools','  disableMouseMovementMonitoring() - Disable mouse movement monitoring');
        SmartLogger.log('debug-tools','  analyzeMouseCorrelations() - Analyze mouse movement correlations');
        SmartLogger.log('debug-tools','  clearMouseCorrelationData() - Clear mouse correlation data');
    };
}
