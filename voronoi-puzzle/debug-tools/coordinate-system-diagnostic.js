/**
 * Coordinate System Diagnostic Tool
 * Monitors the WebGL coordinate system implementation and detects inconsistencies
 * 
 * The system now uses WebGL coordinates as the global standard:
 * - Internal calculations: WebGL coordinates (Y=0 at bottom, Y=height at top)
 * - Mouse input: Converted from screen to WebGL coordinates
 * - Display output: Converted from WebGL to screen coordinates
 * 
 * Key issues to monitor:
 * 1. Coordinate conversion consistency between screen and WebGL
 * 2. Position manager calculations in WebGL space
 * 3. UV coordinate mapping for textures
 * 4. Camera setup alignment with coordinate system
 */

class CoordinateSystemDiagnostic {
    constructor(webglRenderer, mainPuzzle) {
        this.renderer = webglRenderer;
        this.puzzle = mainPuzzle;
        this.coordinateLogs = [];
        this.isMonitoring = false;
        this.lastReleaseData = null;
    }

    /**
     * Enable coordinate system monitoring
     */
    enableCoordinateMonitoring() {
        SmartLogger.log('debug-tools','🔍 Enabling coordinate system monitoring...');
        
        if (this.isMonitoring) {
            SmartLogger.log('debug-tools','⚠️ Coordinate monitoring already enabled');
            return;
        }
        
        this.isMonitoring = true;
        
        // Store original methods
        this.originalHandleMouseUp = this.puzzle.handleMouseUp;
        this.originalHandleMouseMove = this.puzzle.handleMouseMove;
        this.originalUpdatePiecePosition = this.renderer.updatePiecePosition;
        
        // Override methods with monitoring
        this.puzzle.handleMouseUp = this.monitoredHandleMouseUp.bind(this);
        this.puzzle.handleMouseMove = this.monitoredHandleMouseMove.bind(this);
        this.renderer.updatePiecePosition = this.monitoredUpdatePiecePosition.bind(this);
        
        // Add global mouse move listener to track ALL mouse movement
        this.canvas = this.renderer.canvas;
        this.canvas.addEventListener('mousemove', this.trackAllMouseMovement.bind(this));
        
        SmartLogger.log('debug-tools','✅ Coordinate system monitoring enabled');
        SmartLogger.log('debug-tools','📝 Drag pieces and move mouse after release to test coordinate issues');
    }

    /**
     * Disable coordinate system monitoring
     */
    disableCoordinateMonitoring() {
        SmartLogger.log('debug-tools','🔍 Disabling coordinate system monitoring...');
        
        if (!this.isMonitoring) {
            SmartLogger.log('debug-tools','⚠️ Coordinate monitoring not enabled');
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
        if (this.originalUpdatePiecePosition) {
            this.renderer.updatePiecePosition = this.originalUpdatePiecePosition;
        }
        
        // Remove mouse move listener
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.trackAllMouseMovement.bind(this));
        }
        
        SmartLogger.log('debug-tools','✅ Coordinate system monitoring disabled');
    }

    /**
     * Track ALL mouse movement (not just during dragging)
     */
    trackAllMouseMovement(e) {
        if (!this.isMonitoring) return;
        
        const mouseCoords = this.getCanvasCoordinates(e);
        const timestamp = Date.now();
        
        // Log every mouse movement
        this.coordinateLogs.push({
            type: 'mouse_move',
            timestamp,
            mouseCoords,
            isDragging: this.puzzle.isDragging,
            draggedPiece: this.puzzle.draggedCellIndex
        });
        
        // If we have recent release data, check for piece movement correlation
        if (this.lastReleaseData && (timestamp - this.lastReleaseData.timestamp) < 5000) {
            this.checkForPieceMovementCorrelation(mouseCoords, timestamp);
        }
        
        // Keep only last 1000 entries to prevent memory issues
        if (this.coordinateLogs.length > 1000) {
            this.coordinateLogs = this.coordinateLogs.slice(-500);
        }
    }

    /**
     * Check for correlation between mouse movement and piece movement
     */
    checkForPieceMovementCorrelation(currentMouseCoords, timestamp) {
        if (!this.lastReleaseData) return;
        
        const pieceIndex = this.lastReleaseData.pieceIndex;
        const currentPieceOffset = this.renderer.pieces[pieceIndex]?.offset || { x: 0, y: 0 };
        
        // Calculate mouse movement since release
        const mouseDelta = {
            x: currentMouseCoords.x - this.lastReleaseData.mouseCoords.x,
            y: currentMouseCoords.y - this.lastReleaseData.mouseCoords.y
        };
        
        const mouseDistance = Math.sqrt(mouseDelta.x * mouseDelta.x + mouseDelta.y * mouseDelta.y);
        
        // Calculate piece movement since release
        const pieceDelta = {
            x: currentPieceOffset.x - this.lastReleaseData.pieceOffset.x,
            y: currentPieceOffset.y - this.lastReleaseData.pieceOffset.y
        };
        
        const pieceDistance = Math.sqrt(pieceDelta.x * pieceDelta.x + pieceDelta.y * pieceDelta.y);
        
        // If piece has moved significantly, log the correlation
        if (pieceDistance > 1) {
            const correlation = {
                timestamp,
                timeSinceRelease: timestamp - this.lastReleaseData.timestamp,
                pieceIndex,
                mouseDelta,
                mouseDistance,
                pieceDelta,
                pieceDistance,
                mouseCoords: currentMouseCoords,
                pieceOffset: currentPieceOffset
            };
            
            this.coordinateLogs.push({
                type: 'correlation_detected',
                ...correlation
            });
            
            SmartLogger.log('debug-tools',`🔄 COORDINATE CORRELATION - Piece ${pieceIndex}:`, {
                timeSinceRelease: correlation.timeSinceRelease + 'ms',
                mouseMovement: `(${mouseDelta.x.toFixed(1)}, ${mouseDelta.y.toFixed(1)}) = ${mouseDistance.toFixed(1)}px`,
                pieceMovement: `(${pieceDelta.x.toFixed(1)}, ${pieceDelta.y.toFixed(1)}) = ${pieceDistance.toFixed(1)}px`,
                ratio: mouseDistance > 0 ? (pieceDistance / mouseDistance).toFixed(2) : 'N/A'
            });
        }
    }

    /**
     * Monitored mouse up handler
     */
    monitoredHandleMouseUp(e) {
        const mouseCoords = this.getCanvasCoordinates(e);
        const timestamp = Date.now();
        
        if (this.puzzle.isDragging && this.puzzle.draggedCellIndex !== -1) {
            const pieceIndex = this.puzzle.draggedCellIndex;
            
            // Store release data for correlation tracking
            this.lastReleaseData = {
                timestamp,
                pieceIndex,
                mouseCoords: { ...mouseCoords },
                pieceOffset: { ...(this.renderer.pieces[pieceIndex]?.offset || { x: 0, y: 0 }) }
            };
            
            SmartLogger.log('debug-tools',`🎯 RELEASE CAPTURED - Piece ${pieceIndex}:`, {
                mousePosition: `(${mouseCoords.x.toFixed(1)}, ${mouseCoords.y.toFixed(1)})`,
                pieceOffset: `(${this.lastReleaseData.pieceOffset.x.toFixed(1)}, ${this.lastReleaseData.pieceOffset.y.toFixed(1)})`
            });
            
            this.coordinateLogs.push({
                type: 'release',
                timestamp,
                pieceIndex,
                mouseCoords: { ...mouseCoords },
                pieceOffset: { ...this.lastReleaseData.pieceOffset }
            });
        }
        
        return this.originalHandleMouseUp.call(this.puzzle, e);
    }

    /**
     * Monitored mouse move handler (during dragging)
     */
    monitoredHandleMouseMove(e) {
        const mouseCoords = this.getCanvasCoordinates(e);
        const timestamp = Date.now();
        
        if (this.puzzle.isDragging && this.puzzle.draggedCellIndex !== -1) {
            const pieceIndex = this.puzzle.draggedCellIndex;
            
            this.coordinateLogs.push({
                type: 'drag_move',
                timestamp,
                pieceIndex,
                mouseCoords: { ...mouseCoords },
                pieceOffset: { ...(this.renderer.pieces[pieceIndex]?.offset || { x: 0, y: 0 }) }
            });
        }
        
        return this.originalHandleMouseMove.call(this.puzzle, e);
    }

    /**
     * Monitored piece position update
     */
    monitoredUpdatePiecePosition(index, offset) {
        const timestamp = Date.now();
        const result = this.originalUpdatePiecePosition.call(this.renderer, index, offset);
        
        this.coordinateLogs.push({
            type: 'position_update',
            timestamp,
            pieceIndex: index,
            newOffset: { ...offset }
        });
        
        return result;
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
     * Generate coordinate system analysis report
     */
    generateCoordinateReport() {
        SmartLogger.log('debug-tools','\n📋 COORDINATE SYSTEM DIAGNOSTIC REPORT');
        SmartLogger.log('debug-tools','======================================');
        
        const totalEvents = this.coordinateLogs.length;
        const correlations = this.coordinateLogs.filter(log => log.type === 'correlation_detected');
        const releases = this.coordinateLogs.filter(log => log.type === 'release');
        
        SmartLogger.log('debug-tools',`\n📊 Statistics:`);
        SmartLogger.log('debug-tools',`   Total events logged: ${totalEvents}`);
        SmartLogger.log('debug-tools',`   Releases tracked: ${releases.length}`);
        SmartLogger.log('debug-tools',`   Correlations detected: ${correlations.length}`);
        
        if (correlations.length > 0) {
            SmartLogger.log('debug-tools','\n🔄 COORDINATE CORRELATIONS DETECTED:');
            
            // Analyze correlation patterns
            let smallMouseLargePiece = 0;
            let largeMouseSmallPiece = 0;
            let directionalMatches = 0;
            
            correlations.forEach((correlation, index) => {
                const mouseDist = correlation.mouseDistance;
                const pieceDist = correlation.pieceDistance;
                const ratio = mouseDist > 0 ? pieceDist / mouseDist : 0;
                
                SmartLogger.log('debug-tools',`\n   Correlation ${index + 1} - Piece ${correlation.pieceIndex}:`);
                SmartLogger.log('debug-tools',`     Time since release: ${correlation.timeSinceRelease}ms`);
                SmartLogger.log('debug-tools',`     Mouse movement: ${mouseDist.toFixed(2)}px`);
                SmartLogger.log('debug-tools',`     Piece movement: ${pieceDist.toFixed(2)}px`);
                SmartLogger.log('debug-tools',`     Movement ratio: ${ratio.toFixed(2)}`);
                
                // Check for inverse relationship
                if (mouseDist < 10 && pieceDist > 20) {
                    smallMouseLargePiece++;
                }
                if (mouseDist > 50 && pieceDist < 10) {
                    largeMouseSmallPiece++;
                }
                
                // Check directional match
                const mouseDir = Math.atan2(correlation.mouseDelta.y, correlation.mouseDelta.x);
                const pieceDir = Math.atan2(correlation.pieceDelta.y, correlation.pieceDelta.x);
                const dirDiff = Math.abs(mouseDir - pieceDir);
                if (dirDiff < Math.PI / 4 || dirDiff > 7 * Math.PI / 4) {
                    directionalMatches++;
                }
            });
            
            SmartLogger.log('debug-tools','\n📈 Pattern Analysis:');
            SmartLogger.log('debug-tools',`   Small mouse → Large piece movements: ${smallMouseLargePiece}`);
            SmartLogger.log('debug-tools',`   Large mouse → Small piece movements: ${largeMouseSmallPiece}`);
            SmartLogger.log('debug-tools',`   Directional matches: ${directionalMatches}/${correlations.length}`);
            
            SmartLogger.log('debug-tools','\n🎯 DIAGNOSIS:');
            if (smallMouseLargePiece > 0 || largeMouseSmallPiece > 0) {
                SmartLogger.log('debug-tools','   ✅ INVERSE RELATIONSHIP CONFIRMED');
                SmartLogger.log('debug-tools','   🎯 Likely cause: Coordinate system scaling issue or CSS interference');
            }
            
            if (directionalMatches > correlations.length * 0.7) {
                SmartLogger.log('debug-tools','   ✅ DIRECTIONAL CORRELATION CONFIRMED');
                SmartLogger.log('debug-tools','   🎯 Likely cause: Piece still connected to mouse after release');
            }
            
            SmartLogger.log('debug-tools','\n🔧 RECOMMENDED INVESTIGATIONS:');
            SmartLogger.log('debug-tools','   1. Check CSS transform/scale properties on canvas or parent elements');
            SmartLogger.log('debug-tools','   2. Verify coordinate system consistency between mouse and piece positioning');
            SmartLogger.log('debug-tools','   3. Check for lingering event listeners or drag state not being reset');
            SmartLogger.log('debug-tools','   4. Investigate browser zoom level or device pixel ratio effects');
            
        } else {
            SmartLogger.log('debug-tools','\n✅ NO COORDINATE CORRELATIONS DETECTED');
            SmartLogger.log('debug-tools','   Mouse movement does not appear to affect piece positions');
        }
        
        // Show recent events
        if (this.coordinateLogs.length > 0) {
            SmartLogger.log('debug-tools','\n📝 Recent Events:');
            const recentEvents = this.coordinateLogs.slice(-10);
            recentEvents.forEach(event => {
                const time = new Date(event.timestamp).toLocaleTimeString();
                SmartLogger.log('debug-tools',`   ${time}: ${event.type} - Piece ${event.pieceIndex || 'N/A'}`);
            });
        }
        
        return {
            totalEvents,
            correlations: correlations.length,
            releases: releases.length,
            coordinateLogs: this.coordinateLogs
        };
    }

    /**
     * Clear all diagnostic data
     */
    clearCoordinateData() {
        this.coordinateLogs = [];
        this.lastReleaseData = null;
        SmartLogger.log('debug-tools','🗑️ Coordinate system diagnostic data cleared');
    }
}

// Global functions for easy access
window.enableCoordinateMonitoring = function() {
    if (window.webglRenderer && window.voronoiPuzzle) {
        if (!window.coordinateSystemDiagnostic) {
            window.coordinateSystemDiagnostic = new CoordinateSystemDiagnostic(window.webglRenderer, window.voronoiPuzzle);
        }
        window.coordinateSystemDiagnostic.enableCoordinateMonitoring();
        return true;
    } else {
        console.warn('⚠️ WebGL renderer or puzzle not available');
        return false;
    }
};

window.disableCoordinateMonitoring = function() {
    if (window.coordinateSystemDiagnostic) {
        window.coordinateSystemDiagnostic.disableCoordinateMonitoring();
        return true;
    } else {
        console.warn('⚠️ Coordinate monitoring not active');
        return false;
    }
};

window.analyzeCoordinateSystem = function() {
    if (window.coordinateSystemDiagnostic) {
        return window.coordinateSystemDiagnostic.generateCoordinateReport();
    } else {
        console.warn('⚠️ Coordinate monitoring not active - run enableCoordinateMonitoring() first');
        return null;
    }
};

window.clearCoordinateData = function() {
    if (window.coordinateSystemDiagnostic) {
        window.coordinateSystemDiagnostic.clearCoordinateData();
        return true;
    } else {
        console.warn('⚠️ Coordinate monitoring not active');
        return false;
    }
};

// Add to debug commands
if (typeof window !== 'undefined') {
    const originalShowDebug = window.showDebugCommands;
    window.showDebugCommands = function() {
        if (originalShowDebug) originalShowDebug();
        SmartLogger.log('debug-tools','  enableCoordinateMonitoring() - Monitor coordinate system issues');
        SmartLogger.log('debug-tools','  disableCoordinateMonitoring() - Disable coordinate monitoring');
        SmartLogger.log('debug-tools','  analyzeCoordinateSystem() - Analyze coordinate system correlations');
        SmartLogger.log('debug-tools','  clearCoordinateData() - Clear coordinate diagnostic data');
    };
}
