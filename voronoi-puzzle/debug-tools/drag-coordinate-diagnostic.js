/**
 * Drag Coordinate Diagnostic Tool
 * Investigates coordinate inconsistencies during drag release that cause pieces to shift or stick
 */

class DragCoordinateDiagnostic {
    constructor(webglRenderer, mainPuzzle) {
        this.renderer = webglRenderer;
        this.puzzle = mainPuzzle;
        this.dragLogs = [];
        this.coordinateIssues = [];
    }

    /**
     * Enable drag coordinate monitoring
     */
    enableDragMonitoring() {
        SmartLogger.log('debug-tools','🔍 Enabling drag coordinate monitoring...');
        
        // Store original methods
        this.originalHandleMouseUp = this.puzzle.handleMouseUp;
        this.originalHandleMouseMove = this.puzzle.handleMouseMove;
        this.originalHandleMouseDown = this.puzzle.handleMouseDown;
        this.originalUpdatePiecePosition = this.renderer.updatePiecePosition;
        
        // Override methods with monitoring
        this.puzzle.handleMouseDown = this.monitoredHandleMouseDown.bind(this);
        this.puzzle.handleMouseMove = this.monitoredHandleMouseMove.bind(this);
        this.puzzle.handleMouseUp = this.monitoredHandleMouseUp.bind(this);
        this.renderer.updatePiecePosition = this.monitoredUpdatePiecePosition.bind(this);
        
        SmartLogger.log('debug-tools','✅ Drag coordinate monitoring enabled');
    }

    /**
     * Disable drag coordinate monitoring
     */
    disableDragMonitoring() {
        SmartLogger.log('debug-tools','🔍 Disabling drag coordinate monitoring...');
        
        // Restore original methods
        if (this.originalHandleMouseUp) {
            this.puzzle.handleMouseUp = this.originalHandleMouseUp;
        }
        if (this.originalHandleMouseMove) {
            this.puzzle.handleMouseMove = this.originalHandleMouseMove;
        }
        if (this.originalHandleMouseDown) {
            this.puzzle.handleMouseDown = this.originalHandleMouseDown;
        }
        if (this.originalUpdatePiecePosition) {
            this.renderer.updatePiecePosition = this.originalUpdatePiecePosition;
        }
        
        SmartLogger.log('debug-tools','✅ Drag coordinate monitoring disabled');
    }

    /**
     * Monitored mouse down handler
     */
    monitoredHandleMouseDown(e) {
        const result = this.originalHandleMouseDown.call(this.puzzle, e);
        
        if (this.puzzle.isDragging && this.puzzle.draggedCellIndex !== -1) {
            const pieceIndex = this.puzzle.draggedCellIndex;
            const coords = this.getCanvasCoordinates(e);
            
            this.dragLogs.push({
                event: 'mousedown',
                pieceIndex,
                mouseX: coords.x,
                mouseY: coords.y,
                dragOffset: { ...this.puzzle.dragOffset },
                pieceOffset: { ...(this.renderer.pieces[pieceIndex]?.offset || { x: 0, y: 0 }) },
                originalPoints: this.puzzle.originalPoints[pieceIndex] ? [...this.puzzle.originalPoints[pieceIndex]] : null,
                timestamp: Date.now()
            });
            
            SmartLogger.log('debug-tools',`🎯 DRAG START - Piece ${pieceIndex}:`, {
                mouse: `(${coords.x}, ${coords.y})`,
                dragOffset: `(${this.puzzle.dragOffset.x}, ${this.puzzle.dragOffset.y})`,
                pieceOffset: `(${this.renderer.pieces[pieceIndex]?.offset?.x || 0}, ${this.renderer.pieces[pieceIndex]?.offset?.y || 0})`
            });
        }
        
        return result;
    }

    /**
     * Monitored mouse move handler
     */
    monitoredHandleMouseMove(e) {
        const result = this.originalHandleMouseMove.call(this.puzzle, e);
        
        if (this.puzzle.isDragging && this.puzzle.draggedCellIndex !== -1) {
            const pieceIndex = this.puzzle.draggedCellIndex;
            const coords = this.getCanvasCoordinates(e);
            
            // Only log every 10th move to avoid spam
            if (this.dragLogs.length === 0 || Date.now() - this.dragLogs[this.dragLogs.length - 1].timestamp > 50) {
                this.dragLogs.push({
                    event: 'mousemove',
                    pieceIndex,
                    mouseX: coords.x,
                    mouseY: coords.y,
                    dragOffset: { ...this.puzzle.dragOffset },
                    pieceOffset: { ...(this.renderer.pieces[pieceIndex]?.offset || { x: 0, y: 0 }) },
                    timestamp: Date.now()
                });
            }
        }
        
        return result;
    }

    /**
     * Monitored mouse up handler
     */
    monitoredHandleMouseUp(e) {
        const coords = this.getCanvasCoordinates(e);
        
        if (this.puzzle.isDragging && this.puzzle.draggedCellIndex !== -1) {
            const pieceIndex = this.puzzle.draggedCellIndex;
            
            // Log final position before release
            this.dragLogs.push({
                event: 'mouseup_before',
                pieceIndex,
                mouseX: coords.x,
                mouseY: coords.y,
                dragOffset: { ...this.puzzle.dragOffset },
                pieceOffset: { ...(this.renderer.pieces[pieceIndex]?.offset || { x: 0, y: 0 }) },
                timestamp: Date.now()
            });
            
            SmartLogger.log('debug-tools',`🎯 DRAG END - Piece ${pieceIndex} (before release):`, {
                mouse: `(${coords.x}, ${coords.y})`,
                dragOffset: `(${this.puzzle.dragOffset.x}, ${this.puzzle.dragOffset.y})`,
                pieceOffset: `(${this.renderer.pieces[pieceIndex]?.offset?.x || 0}, ${this.renderer.pieces[pieceIndex]?.offset?.y || 0})`
            });
        }
        
        // Call original handler
        const result = this.originalHandleMouseUp.call(this.puzzle, e);
        
        // Log position after release
        if (this.puzzle.draggedCellIndex !== -1) {
            const pieceIndex = this.puzzle.draggedCellIndex;
            
            setTimeout(() => {
                this.dragLogs.push({
                    event: 'mouseup_after',
                    pieceIndex,
                    mouseX: coords.x,
                    mouseY: coords.y,
                    dragOffset: { ...this.puzzle.dragOffset },
                    pieceOffset: { ...(this.renderer.pieces[pieceIndex]?.offset || { x: 0, y: 0 }) },
                    timestamp: Date.now()
                });
                
                SmartLogger.log('debug-tools',`🎯 DRAG END - Piece ${pieceIndex} (after release):`, {
                    mouse: `(${coords.x}, ${coords.y})`,
                    dragOffset: `(${this.puzzle.dragOffset.x}, ${this.puzzle.dragOffset.y})`,
                    pieceOffset: `(${this.renderer.pieces[pieceIndex]?.offset?.x || 0}, ${this.renderer.pieces[pieceIndex]?.offset?.y || 0})`
                });
                
                // Analyze for coordinate issues
                this.analyzeDragRelease(pieceIndex);
            }, 10); // Small delay to ensure all updates are complete
        }
        
        return result;
    }

    /**
     * Monitored piece position update
     */
    monitoredUpdatePiecePosition(index, offset) {
        const result = this.originalUpdatePiecePosition.call(this.renderer, index, offset);
        
        // Log position updates
        this.dragLogs.push({
            event: 'position_update',
            pieceIndex: index,
            newOffset: { ...offset },
            timestamp: Date.now()
        });
        
        return result;
    }

    /**
     * Analyze drag release for coordinate issues
     */
    analyzeDragRelease(pieceIndex) {
        const beforeRelease = this.dragLogs.find(log => 
            log.event === 'mouseup_before' && log.pieceIndex === pieceIndex
        );
        const afterRelease = this.dragLogs.find(log => 
            log.event === 'mouseup_after' && log.pieceIndex === pieceIndex
        );
        
        if (!beforeRelease || !afterRelease) {
            console.warn(`⚠️ Missing drag logs for piece ${pieceIndex}`);
            return;
        }
        
        // Check for position shifts
        const positionShift = {
            x: afterRelease.pieceOffset.x - beforeRelease.pieceOffset.x,
            y: afterRelease.pieceOffset.y - beforeRelease.pieceOffset.y
        };
        
        const shiftDistance = Math.sqrt(positionShift.x * positionShift.x + positionShift.y * positionShift.y);
        
        if (shiftDistance > 1) { // More than 1 pixel shift
            const issue = {
                pieceIndex,
                shiftDistance,
                positionShift,
                beforeOffset: beforeRelease.pieceOffset,
                afterOffset: afterRelease.pieceOffset,
                mousePosition: { x: beforeRelease.mouseX, y: beforeRelease.mouseY }
            };
            
            this.coordinateIssues.push(issue);
            
            SmartLogger.log('debug-tools',`❌ COORDINATE ISSUE DETECTED - Piece ${pieceIndex}:`, {
                shiftDistance: shiftDistance.toFixed(2) + 'px',
                positionShift: `(${positionShift.x.toFixed(1)}, ${positionShift.y.toFixed(1)})`,
                before: `(${beforeRelease.pieceOffset.x.toFixed(1)}, ${beforeRelease.pieceOffset.y.toFixed(1)})`,
                after: `(${afterRelease.pieceOffset.x.toFixed(1)}, ${afterRelease.pieceOffset.y.toFixed(1)})`
            });
        } else {
            SmartLogger.log('debug-tools',`✅ No coordinate issues for piece ${pieceIndex}`);
        }
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
     * Generate diagnostic report
     */
    generateReport() {
        SmartLogger.log('debug-tools','\n📋 DRAG COORDINATE DIAGNOSTIC REPORT');
        SmartLogger.log('debug-tools','====================================');
        
        SmartLogger.log('debug-tools',`\n📊 Statistics:`);
        SmartLogger.log('debug-tools',`   Total drag events logged: ${this.dragLogs.length}`);
        SmartLogger.log('debug-tools',`   Coordinate issues found: ${this.coordinateIssues.length}`);
        
        if (this.coordinateIssues.length > 0) {
            SmartLogger.log('debug-tools','\n❌ COORDINATE ISSUES DETECTED:');
            
            this.coordinateIssues.forEach((issue, index) => {
                SmartLogger.log('debug-tools',`\n   Issue ${index + 1} - Piece ${issue.pieceIndex}:`);
                SmartLogger.log('debug-tools',`     Shift distance: ${issue.shiftDistance.toFixed(2)}px`);
                SmartLogger.log('debug-tools',`     Position shift: (${issue.positionShift.x.toFixed(1)}, ${issue.positionShift.y.toFixed(1)})`);
                SmartLogger.log('debug-tools',`     Before: (${issue.beforeOffset.x.toFixed(1)}, ${issue.beforeOffset.y.toFixed(1)})`);
                SmartLogger.log('debug-tools',`     After: (${issue.afterOffset.x.toFixed(1)}, ${issue.afterOffset.y.toFixed(1)})`);
                SmartLogger.log('debug-tools',`     Mouse: (${issue.mousePosition.x.toFixed(1)}, ${issue.mousePosition.y.toFixed(1)})`);
            });
            
            SmartLogger.log('debug-tools','\n🎯 POTENTIAL CAUSES:');
            SmartLogger.log('debug-tools','   1. Drag offset calculation inconsistency');
            SmartLogger.log('debug-tools','   2. Mouse coordinate rounding errors');
            SmartLogger.log('debug-tools','   3. Timing issues between mouse events');
            SmartLogger.log('debug-tools','   4. Piece position update race conditions');
            
            SmartLogger.log('debug-tools','\n🔧 RECOMMENDED FIXES:');
            SmartLogger.log('debug-tools','   1. Improve drag offset calculation precision');
            SmartLogger.log('debug-tools','   2. Add coordinate validation before position updates');
            SmartLogger.log('debug-tools','   3. Implement debouncing for rapid position updates');
            SmartLogger.log('debug-tools','   4. Add coordinate consistency checks');
            
        } else {
            SmartLogger.log('debug-tools','\n✅ NO COORDINATE ISSUES DETECTED');
            SmartLogger.log('debug-tools','   Drag release behavior appears normal');
        }
        
        // Show recent drag logs
        if (this.dragLogs.length > 0) {
            SmartLogger.log('debug-tools','\n📝 Recent Drag Events:');
            const recentLogs = this.dragLogs.slice(-10);
            recentLogs.forEach(log => {
                SmartLogger.log('debug-tools',`   ${log.event} - Piece ${log.pieceIndex}: offset(${log.pieceOffset?.x?.toFixed(1) || 'N/A'}, ${log.pieceOffset?.y?.toFixed(1) || 'N/A'})`);
            });
        }
        
        return {
            totalEvents: this.dragLogs.length,
            issues: this.coordinateIssues.length,
            coordinateIssues: this.coordinateIssues
        };
    }

    /**
     * Clear all diagnostic data
     */
    clearData() {
        this.dragLogs = [];
        this.coordinateIssues = [];
        SmartLogger.log('debug-tools','🗑️ Drag coordinate diagnostic data cleared');
    }
}

// Global functions for easy access
window.enableDragMonitoring = function() {
    if (window.webglRenderer && window.voronoiPuzzle) {
        if (!window.dragDiagnostic) {
            window.dragDiagnostic = new DragCoordinateDiagnostic(window.webglRenderer, window.voronoiPuzzle);
        }
        window.dragDiagnostic.enableDragMonitoring();
        return true;
    } else {
        console.warn('⚠️ WebGL renderer or puzzle not available');
        return false;
    }
};

window.disableDragMonitoring = function() {
    if (window.dragDiagnostic) {
        window.dragDiagnostic.disableDragMonitoring();
        return true;
    } else {
        console.warn('⚠️ Drag monitoring not active');
        return false;
    }
};

window.analyzeDragIssues = function() {
    if (window.dragDiagnostic) {
        return window.dragDiagnostic.generateReport();
    } else {
        console.warn('⚠️ Drag monitoring not active - run enableDragMonitoring() first');
        return null;
    }
};

window.clearDragData = function() {
    if (window.dragDiagnostic) {
        window.dragDiagnostic.clearData();
        return true;
    } else {
        console.warn('⚠️ Drag monitoring not active');
        return false;
    }
};

// Add to debug commands
if (typeof window !== 'undefined') {
    const originalShowDebug = window.showDebugCommands;
    window.showDebugCommands = function() {
        if (originalShowDebug) originalShowDebug();
        SmartLogger.log('debug-tools','  enableDragMonitoring() - Monitor drag coordinate issues');
        SmartLogger.log('debug-tools','  disableDragMonitoring() - Disable drag monitoring');
        SmartLogger.log('debug-tools','  analyzeDragIssues() - Analyze detected drag coordinate issues');
        SmartLogger.log('debug-tools','  clearDragData() - Clear drag diagnostic data');
    };
}
