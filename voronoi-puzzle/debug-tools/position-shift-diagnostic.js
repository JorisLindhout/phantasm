/**
 * Position Shift Diagnostic Tool
 * Investigates the immediate position shift that occurs after drag release
 * This focuses on the "jump" behavior where pieces move from release position to a corrected position
 */

class PositionShiftDiagnostic {
    constructor(webglRenderer, mainPuzzle) {
        this.renderer = webglRenderer;
        this.puzzle = mainPuzzle;
        this.releaseLogs = [];
        this.positionShifts = [];
        this.isMonitoring = false;
    }

    /**
     * Enable position shift monitoring
     */
    enablePositionShiftMonitoring() {
        SmartLogger.log('debug-tools','🔍 Enabling position shift monitoring...');
        
        if (this.isMonitoring) {
            SmartLogger.log('debug-tools','⚠️ Position shift monitoring already enabled');
            return;
        }
        
        this.isMonitoring = true;
        
        // Store original methods
        this.originalHandleMouseUp = this.puzzle.handleMouseUp;
        this.originalUpdatePiecePosition = this.renderer.updatePiecePosition;
        
        // Override methods with monitoring
        this.puzzle.handleMouseUp = this.monitoredHandleMouseUp.bind(this);
        this.renderer.updatePiecePosition = this.monitoredUpdatePiecePosition.bind(this);
        
        SmartLogger.log('debug-tools','✅ Position shift monitoring enabled');
        SmartLogger.log('debug-tools','📝 Now drag and release pieces to capture position shifts');
    }

    /**
     * Disable position shift monitoring
     */
    disablePositionShiftMonitoring() {
        SmartLogger.log('debug-tools','🔍 Disabling position shift monitoring...');
        
        if (!this.isMonitoring) {
            SmartLogger.log('debug-tools','⚠️ Position shift monitoring not enabled');
            return;
        }
        
        this.isMonitoring = false;
        
        // Restore original methods
        if (this.originalHandleMouseUp) {
            this.puzzle.handleMouseUp = this.originalHandleMouseUp;
        }
        if (this.originalUpdatePiecePosition) {
            this.renderer.updatePiecePosition = this.originalUpdatePiecePosition;
        }
        
        SmartLogger.log('debug-tools','✅ Position shift monitoring disabled');
    }

    /**
     * Monitored mouse up handler - captures the release moment
     */
    monitoredHandleMouseUp(e) {
        const coords = this.getCanvasCoordinates(e);
        
        if (this.puzzle.isDragging && this.puzzle.draggedCellIndex !== -1) {
            const pieceIndex = this.puzzle.draggedCellIndex;
            const currentOffset = this.renderer.pieces[pieceIndex]?.offset || { x: 0, y: 0 };
            
            // Log the release moment
            const releaseLog = {
                pieceIndex,
                releaseTime: Date.now(),
                mousePosition: { x: coords.x, y: coords.y },
                pieceOffsetAtRelease: { ...currentOffset },
                piecePositionAtRelease: {
                    x: this.puzzle.points[pieceIndex][0] + currentOffset.x,
                    y: this.puzzle.points[pieceIndex][1] + currentOffset.y
                },
                originalPoints: this.puzzle.originalPoints[pieceIndex] ? [...this.puzzle.originalPoints[pieceIndex]] : null
            };
            
            this.releaseLogs.push(releaseLog);
            
            SmartLogger.log('debug-tools',`🎯 RELEASE CAPTURED - Piece ${pieceIndex}:`, {
                mouse: `(${coords.x.toFixed(1)}, ${coords.y.toFixed(1)})`,
                pieceAtRelease: `(${releaseLog.piecePositionAtRelease.x.toFixed(1)}, ${releaseLog.piecePositionAtRelease.y.toFixed(1)})`,
                offsetAtRelease: `(${currentOffset.x.toFixed(1)}, ${currentOffset.y.toFixed(1)})`
            });
            
            // Set up monitoring for position changes after release
            this.monitorPostReleaseChanges(pieceIndex, releaseLog);
        }
        
        // Call original handler
        return this.originalHandleMouseUp.call(this.puzzle, e);
    }

    /**
     * Monitor position changes after release
     */
    monitorPostReleaseChanges(pieceIndex, releaseLog) {
        let checkCount = 0;
        const maxChecks = 20; // Check for 2 seconds (20 * 100ms)
        
        const checkPosition = () => {
            if (checkCount >= maxChecks || !this.isMonitoring) {
                return;
            }
            
            const currentOffset = this.renderer.pieces[pieceIndex]?.offset || { x: 0, y: 0 };
            const currentPosition = {
                x: this.puzzle.points[pieceIndex][0] + currentOffset.x,
                y: this.puzzle.points[pieceIndex][1] + currentOffset.y
            };
            
            const timeSinceRelease = Date.now() - releaseLog.releaseTime;
            
            // Check if position has changed significantly
            const positionDelta = {
                x: currentPosition.x - releaseLog.piecePositionAtRelease.x,
                y: currentPosition.y - releaseLog.piecePositionAtRelease.y
            };
            
            const shiftDistance = Math.sqrt(positionDelta.x * positionDelta.x + positionDelta.y * positionDelta.y);
            
            if (shiftDistance > 5) { // More than 5 pixel shift
                const positionShift = {
                    pieceIndex,
                    releaseTime: releaseLog.releaseTime,
                    timeToShift: timeSinceRelease,
                    shiftDistance,
                    positionDelta,
                    fromPosition: { ...releaseLog.piecePositionAtRelease },
                    toPosition: { ...currentPosition },
                    fromOffset: { ...releaseLog.pieceOffsetAtRelease },
                    toOffset: { ...currentOffset },
                    mousePosition: { ...releaseLog.mousePosition }
                };
                
                this.positionShifts.push(positionShift);
                
                SmartLogger.log('debug-tools',`🔄 POSITION SHIFT DETECTED - Piece ${pieceIndex}:`, {
                    timeToShift: timeSinceRelease + 'ms',
                    shiftDistance: shiftDistance.toFixed(2) + 'px',
                    from: `(${releaseLog.piecePositionAtRelease.x.toFixed(1)}, ${releaseLog.piecePositionAtRelease.y.toFixed(1)})`,
                    to: `(${currentPosition.x.toFixed(1)}, ${currentPosition.y.toFixed(1)})`,
                    delta: `(${positionDelta.x.toFixed(1)}, ${positionDelta.y.toFixed(1)})`
                });
                
                // Stop monitoring this piece
                return;
            }
            
            checkCount++;
            setTimeout(checkPosition, 100); // Check every 100ms
        };
        
        // Start monitoring after a small delay to let the release handler complete
        setTimeout(checkPosition, 50);
    }

    /**
     * Monitored piece position update - tracks all position changes
     */
    monitoredUpdatePiecePosition(index, offset) {
        const result = this.originalUpdatePiecePosition.call(this.renderer, index, offset);
        
        // Only log if we're monitoring and this is a recent release
        if (this.isMonitoring) {
            const recentRelease = this.releaseLogs.find(log => 
                log.pieceIndex === index && 
                (Date.now() - log.releaseTime) < 3000 // Within last 3 seconds
            );
            
            if (recentRelease) {
                const timeSinceRelease = Date.now() - recentRelease.releaseTime;
                SmartLogger.log('debug-tools',`📐 Position Update - Piece ${index} (${timeSinceRelease}ms after release):`, {
                    newOffset: `(${offset.x.toFixed(1)}, ${offset.y.toFixed(1)})`
                });
            }
        }
        
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
     * Generate position shift report
     */
    generatePositionShiftReport() {
        SmartLogger.log('debug-tools','\n📋 POSITION SHIFT DIAGNOSTIC REPORT');
        SmartLogger.log('debug-tools','====================================');
        
        SmartLogger.log('debug-tools',`\n📊 Statistics:`);
        SmartLogger.log('debug-tools',`   Total releases monitored: ${this.releaseLogs.length}`);
        SmartLogger.log('debug-tools',`   Position shifts detected: ${this.positionShifts.length}`);
        
        if (this.positionShifts.length > 0) {
            SmartLogger.log('debug-tools','\n🔄 POSITION SHIFTS DETECTED:');
            
            this.positionShifts.forEach((shift, index) => {
                SmartLogger.log('debug-tools',`\n   Shift ${index + 1} - Piece ${shift.pieceIndex}:`);
                SmartLogger.log('debug-tools',`     Time to shift: ${shift.timeToShift}ms`);
                SmartLogger.log('debug-tools',`     Shift distance: ${shift.shiftDistance.toFixed(2)}px`);
                SmartLogger.log('debug-tools',`     From position: (${shift.fromPosition.x.toFixed(1)}, ${shift.fromPosition.y.toFixed(1)})`);
                SmartLogger.log('debug-tools',`     To position: (${shift.toPosition.x.toFixed(1)}, ${shift.toPosition.y.toFixed(1)})`);
                SmartLogger.log('debug-tools',`     Position delta: (${shift.positionDelta.x.toFixed(1)}, ${shift.positionDelta.y.toFixed(1)})`);
                SmartLogger.log('debug-tools',`     Mouse position: (${shift.mousePosition.x.toFixed(1)}, ${shift.mousePosition.y.toFixed(1)})`);
                SmartLogger.log('debug-tools',`     From offset: (${shift.fromOffset.x.toFixed(1)}, ${shift.fromOffset.y.toFixed(1)})`);
                SmartLogger.log('debug-tools',`     To offset: (${shift.toOffset.x.toFixed(1)}, ${shift.toOffset.y.toFixed(1)})`);
            });
            
            // Analyze patterns
            const avgShiftDistance = this.positionShifts.reduce((sum, shift) => sum + shift.shiftDistance, 0) / this.positionShifts.length;
            const avgTimeToShift = this.positionShifts.reduce((sum, shift) => sum + shift.timeToShift, 0) / this.positionShifts.length;
            
            SmartLogger.log('debug-tools','\n📈 Pattern Analysis:');
            SmartLogger.log('debug-tools',`   Average shift distance: ${avgShiftDistance.toFixed(2)}px`);
            SmartLogger.log('debug-tools',`   Average time to shift: ${avgTimeToShift.toFixed(1)}ms`);
            
            SmartLogger.log('debug-tools','\n🎯 LIKELY CAUSES:');
            SmartLogger.log('debug-tools','   1. Snap-back logic triggering incorrectly');
            SmartLogger.log('debug-tools','   2. Auto-snap system interfering with manual positioning');
            SmartLogger.log('debug-tools','   3. Position correction after release');
            SmartLogger.log('debug-tools','   4. Race condition between release and position update');
            
            SmartLogger.log('debug-tools','\n🔧 RECOMMENDED FIXES:');
            SmartLogger.log('debug-tools','   1. Review snap-back threshold and logic');
            SmartLogger.log('debug-tools','   2. Check auto-snap timing and conditions');
            SmartLogger.log('debug-tools','   3. Add position validation before corrections');
            SmartLogger.log('debug-tools','   4. Implement debouncing for position updates');
            
        } else {
            SmartLogger.log('debug-tools','\n✅ NO POSITION SHIFTS DETECTED');
            SmartLogger.log('debug-tools','   Pieces maintain their release positions');
        }
        
        // Show recent releases
        if (this.releaseLogs.length > 0) {
            SmartLogger.log('debug-tools','\n📝 Recent Releases:');
            const recentReleases = this.releaseLogs.slice(-5);
            recentReleases.forEach(log => {
                SmartLogger.log('debug-tools',`   Piece ${log.pieceIndex}: pos(${log.piecePositionAtRelease.x.toFixed(1)}, ${log.piecePositionAtRelease.y.toFixed(1)})`);
            });
        }
        
        return {
            totalReleases: this.releaseLogs.length,
            shiftsDetected: this.positionShifts.length,
            positionShifts: this.positionShifts
        };
    }

    /**
     * Clear all diagnostic data
     */
    clearPositionShiftData() {
        this.releaseLogs = [];
        this.positionShifts = [];
        SmartLogger.log('debug-tools','🗑️ Position shift diagnostic data cleared');
    }
}

// Global functions for easy access
window.enablePositionShiftMonitoring = function() {
    if (window.webglRenderer && window.voronoiPuzzle) {
        if (!window.positionShiftDiagnostic) {
            window.positionShiftDiagnostic = new PositionShiftDiagnostic(window.webglRenderer, window.voronoiPuzzle);
        }
        window.positionShiftDiagnostic.enablePositionShiftMonitoring();
        return true;
    } else {
        console.warn('⚠️ WebGL renderer or puzzle not available');
        return false;
    }
};

window.disablePositionShiftMonitoring = function() {
    if (window.positionShiftDiagnostic) {
        window.positionShiftDiagnostic.disablePositionShiftMonitoring();
        return true;
    } else {
        console.warn('⚠️ Position shift monitoring not active');
        return false;
    }
};

window.analyzePositionShifts = function() {
    if (window.positionShiftDiagnostic) {
        return window.positionShiftDiagnostic.generatePositionShiftReport();
    } else {
        console.warn('⚠️ Position shift monitoring not active - run enablePositionShiftMonitoring() first');
        return null;
    }
};

window.clearPositionShiftData = function() {
    if (window.positionShiftDiagnostic) {
        window.positionShiftDiagnostic.clearPositionShiftData();
        return true;
    } else {
        console.warn('⚠️ Position shift monitoring not active');
        return false;
    }
};

// Add to debug commands
if (typeof window !== 'undefined') {
    const originalShowDebug = window.showDebugCommands;
    window.showDebugCommands = function() {
        if (originalShowDebug) originalShowDebug();
        SmartLogger.log('debug-tools','  enablePositionShiftMonitoring() - Monitor position shifts after release');
        SmartLogger.log('debug-tools','  disablePositionShiftMonitoring() - Disable position shift monitoring');
        SmartLogger.log('debug-tools','  analyzePositionShifts() - Analyze detected position shifts');
        SmartLogger.log('debug-tools','  clearPositionShiftData() - Clear position shift diagnostic data');
    };
}
