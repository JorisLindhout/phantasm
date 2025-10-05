/**
 * Scene State Diagnostic Tool
 * Investigates scene management and object state issues that cause piece unresponsiveness
 */

class SceneStateDiagnostic {
    constructor(webglRenderer) {
        this.renderer = webglRenderer;
        this.diagnosticResults = [];
    }

    /**
     * Run comprehensive scene state diagnostics
     */
    runFullDiagnostics() {
        SmartLogger.log('debug-tools','🔍 Starting Scene State Diagnostics...');
        
        this.diagnosticResults = [];
        
        // Test 1: Scene membership analysis
        this.analyzeSceneMembership();
        
        // Test 2: Geometry validity check
        this.analyzeGeometryValidity();
        
        // Test 3: Raycaster target analysis
        this.analyzeRaycasterTargets();
        
        // Test 4: State synchronization check
        this.analyzeStateSynchronization();
        
        // Test 5: Z-index and layering analysis
        this.analyzeZIndexLayering();
        
        // Generate comprehensive report
        this.generateDiagnosticReport();
        
        return this.diagnosticResults;
    }

    /**
     * Test 1: Check if pieces are properly in the scene
     */
    analyzeSceneMembership() {
        SmartLogger.log('debug-tools','\n📋 Test 1: Scene Membership Analysis');
        
        const sceneIssues = [];
        
        for (let i = 0; i < this.renderer.pieces.length; i++) {
            const piece = this.renderer.pieces[i];
            
            if (piece.state === 'unsolved' && piece.mesh) {
                const isInScene = this.renderer.scene.children.includes(piece.mesh);
                const isVisible = piece.mesh.visible;
                
                if (!isInScene || !isVisible) {
                    sceneIssues.push({
                        pieceIndex: i,
                        isInScene,
                        isVisible,
                        position: piece.mesh.position.clone(),
                        issue: !isInScene ? 'Not in scene' : 'Not visible'
                    });
                    
                    SmartLogger.log('debug-tools',`❌ Piece ${i}: ${!isInScene ? 'Not in scene' : 'Not visible'}`);
                } else {
                    SmartLogger.log('debug-tools',`✅ Piece ${i}: In scene and visible`);
                }
            }
        }
        
        this.diagnosticResults.push({
            test: 'Scene Membership',
            issues: sceneIssues,
            totalIssues: sceneIssues.length
        });
        
        SmartLogger.log('debug-tools',`📊 Scene membership issues: ${sceneIssues.length}`);
    }

    /**
     * Test 2: Check geometry validity
     */
    analyzeGeometryValidity() {
        SmartLogger.log('debug-tools','\n🔧 Test 2: Geometry Validity Analysis');
        
        const geometryIssues = [];
        
        for (let i = 0; i < this.renderer.pieces.length; i++) {
            const piece = this.renderer.pieces[i];
            
            if (piece.state === 'unsolved' && piece.mesh) {
                const mesh = piece.mesh;
                const geometry = mesh.geometry;
                
                const issues = [];
                
                // Check if geometry exists
                if (!geometry) {
                    issues.push('No geometry');
                } else {
                    // Check geometry attributes
                    if (!geometry.attributes.position) {
                        issues.push('No position attributes');
                    }
                    
                    if (!geometry.attributes.position.count) {
                        issues.push('Empty position buffer');
                    }
                    
                    // Check if geometry is disposed
                    if (geometry.isDisposed) {
                        issues.push('Geometry disposed');
                    }
                    
                    // Check vertex count
                    const vertexCount = geometry.attributes.position?.count || 0;
                    if (vertexCount < 3) {
                        issues.push(`Insufficient vertices: ${vertexCount}`);
                    }
                }
                
                // Check material
                if (!mesh.material) {
                    issues.push('No material');
                }
                
                if (issues.length > 0) {
                    geometryIssues.push({
                        pieceIndex: i,
                        issues,
                        vertexCount: geometry?.attributes.position?.count || 0,
                        position: piece.mesh.position.clone()
                    });
                    
                    SmartLogger.log('debug-tools',`❌ Piece ${i}: ${issues.join(', ')}`);
                } else {
                    SmartLogger.log('debug-tools',`✅ Piece ${i}: Valid geometry`);
                }
            }
        }
        
        this.diagnosticResults.push({
            test: 'Geometry Validity',
            issues: geometryIssues,
            totalIssues: geometryIssues.length
        });
        
        SmartLogger.log('debug-tools',`📊 Geometry issues: ${geometryIssues.length}`);
    }

    /**
     * Test 3: Analyze raycaster target list
     */
    analyzeRaycasterTargets() {
        SmartLogger.log('debug-tools','\n🎯 Test 3: Raycaster Target Analysis');
        
        // Get pieces that raycaster would check
        const raycasterTargets = this.renderer.pieces
            .map((piece, index) => ({ piece: piece.mesh, index, pieceObj: piece }))
            .filter(({ piece }) => piece !== null);
        
        SmartLogger.log('debug-tools',`📊 Raycaster targets: ${raycasterTargets.length} pieces`);
        
        // Check each target
        const targetIssues = [];
        
        raycasterTargets.forEach(({ piece, index, pieceObj }) => {
            const issues = [];
            
            // Check if piece is in scene
            if (!this.renderer.scene.children.includes(piece)) {
                issues.push('Not in scene');
            }
            
            // Check visibility
            if (!piece.visible) {
                issues.push('Not visible');
            }
            
            // Check geometry
            if (!piece.geometry || !piece.geometry.attributes.position) {
                issues.push('Invalid geometry');
            }
            
            // Check if piece is actually unsolved
            if (pieceObj.state !== 'unsolved') {
                issues.push(`Wrong state: ${pieceObj.state}`);
            }
            
            if (issues.length > 0) {
                targetIssues.push({
                    pieceIndex: index,
                    issues,
                    state: pieceObj.state,
                    position: piece.position.clone()
                });
                
                SmartLogger.log('debug-tools',`❌ Target ${index}: ${issues.join(', ')}`);
            } else {
                SmartLogger.log('debug-tools',`✅ Target ${index}: Valid`);
            }
        });
        
        this.diagnosticResults.push({
            test: 'Raycaster Targets',
            targets: raycasterTargets.length,
            issues: targetIssues,
            totalIssues: targetIssues.length
        });
        
        SmartLogger.log('debug-tools',`📊 Target issues: ${targetIssues.length}`);
    }

    /**
     * Test 4: Check state synchronization
     */
    analyzeStateSynchronization() {
        SmartLogger.log('debug-tools','\n🔄 Test 4: State Synchronization Analysis');
        
        const syncIssues = [];
        
        for (let i = 0; i < this.renderer.pieces.length; i++) {
            const piece = this.renderer.pieces[i];
            const slot = this.renderer.slots[i];
            
            if (piece.state === 'unsolved') {
                const issues = [];
                
                // Check if piece has mesh but slot is filled
                if (piece.mesh && slot.state === 'filled') {
                    issues.push('Has mesh but slot filled');
                }
                
                // Check if piece has no mesh but slot is empty
                if (!piece.mesh && slot.state === 'empty') {
                    issues.push('No mesh and slot empty');
                }
                
                // Check z-index consistency
                const pieceZIndex = piece.zIndex || this.renderer.pieceZIndices[i] || 0;
                if (pieceZIndex < 0) {
                    issues.push('Negative z-index');
                }
                
                // Check position consistency
                if (piece.mesh && piece.offset) {
                    const expectedX = piece.offset.x;
                    const expectedY = piece.offset.y;
                    const actualX = piece.mesh.position.x;
                    const actualY = piece.mesh.position.y;
                    
                    if (Math.abs(actualX - expectedX) > 1 || Math.abs(actualY - expectedY) > 1) {
                        issues.push(`Position mismatch: expected(${expectedX}, ${expectedY}) vs actual(${actualX}, ${actualY})`);
                    }
                }
                
                if (issues.length > 0) {
                    syncIssues.push({
                        pieceIndex: i,
                        issues,
                        pieceState: piece.state,
                        slotState: slot.state,
                        hasMesh: !!piece.mesh,
                        zIndex: piece.zIndex || this.renderer.pieceZIndices[i] || 0
                    });
                    
                    SmartLogger.log('debug-tools',`❌ Piece ${i}: ${issues.join(', ')}`);
                } else {
                    SmartLogger.log('debug-tools',`✅ Piece ${i}: Synchronized`);
                }
            }
        }
        
        this.diagnosticResults.push({
            test: 'State Synchronization',
            issues: syncIssues,
            totalIssues: syncIssues.length
        });
        
        SmartLogger.log('debug-tools',`📊 Sync issues: ${syncIssues.length}`);
    }

    /**
     * Test 5: Analyze z-index and layering
     */
    analyzeZIndexLayering() {
        SmartLogger.log('debug-tools','\n📐 Test 5: Z-Index and Layering Analysis');
        
        const layeringIssues = [];
        
        // Get all separate pieces with their z-indices
        const piecesWithZIndex = this.renderer.pieces
            .map((piece, index) => ({
                index,
                piece,
                zIndex: piece.zIndex || this.renderer.pieceZIndices[index] || 0,
                position: piece.mesh?.position.clone() || new THREE.Vector3(0, 0, 0),
                visible: piece.mesh?.visible || false
            }))
            .filter(({ piece }) => piece.state === 'unsolved' && piece.mesh);
        
        // Sort by z-index
        piecesWithZIndex.sort((a, b) => b.zIndex - a.zIndex);
        
        SmartLogger.log('debug-tools','📊 Z-Index Order (highest first):');
        piecesWithZIndex.forEach(({ index, zIndex, position }) => {
            SmartLogger.log('debug-tools',`   Piece ${index}: z-index=${zIndex}, pos=(${position.x.toFixed(1)}, ${position.y.toFixed(1)})`);
        });
        
        // Check for z-index conflicts
        const zIndexGroups = {};
        piecesWithZIndex.forEach(({ index, zIndex }) => {
            if (!zIndexGroups[zIndex]) {
                zIndexGroups[zIndex] = [];
            }
            zIndexGroups[zIndex].push(index);
        });
        
        Object.keys(zIndexGroups).forEach(zIndex => {
            const pieces = zIndexGroups[zIndex];
            if (pieces.length > 1) {
                layeringIssues.push({
                    zIndex: parseInt(zIndex),
                    pieces,
                    issue: `Multiple pieces with same z-index: ${zIndex}`
                });
                
                SmartLogger.log('debug-tools',`⚠️ Z-index ${zIndex}: ${pieces.length} pieces (${pieces.join(', ')})`);
            }
        });
        
        // Check for negative z-indices
        const negativeZIndex = piecesWithZIndex.filter(({ zIndex }) => zIndex < 0);
        if (negativeZIndex.length > 0) {
            layeringIssues.push({
                issue: 'Negative z-indices',
                pieces: negativeZIndex.map(({ index }) => index)
            });
            
            SmartLogger.log('debug-tools',`❌ Negative z-indices: ${negativeZIndex.map(({ index, zIndex }) => `${index}(${zIndex})`).join(', ')}`);
        }
        
        this.diagnosticResults.push({
            test: 'Z-Index Layering',
            piecesWithZIndex: piecesWithZIndex.length,
            issues: layeringIssues,
            totalIssues: layeringIssues.length
        });
        
        SmartLogger.log('debug-tools',`📊 Layering issues: ${layeringIssues.length}`);
    }

    /**
     * Generate comprehensive diagnostic report
     */
    generateDiagnosticReport() {
        SmartLogger.log('debug-tools','\n📋 SCENE STATE DIAGNOSTIC REPORT');
        SmartLogger.log('debug-tools','==================================');
        
        let totalIssues = 0;
        let criticalIssues = 0;
        
        this.diagnosticResults.forEach(result => {
            totalIssues += result.totalIssues;
            
            if (result.test === 'Scene Membership' || result.test === 'Geometry Validity') {
                criticalIssues += result.totalIssues;
            }
            
            SmartLogger.log('debug-tools',`\n${result.test}:`);
            SmartLogger.log('debug-tools',`   Issues: ${result.totalIssues}`);
            
            if (result.issues && result.issues.length > 0) {
                result.issues.forEach(issue => {
                    if (typeof issue === 'object' && issue.pieceIndex !== undefined) {
                        SmartLogger.log('debug-tools',`   - Piece ${issue.pieceIndex}: ${issue.issues ? issue.issues.join(', ') : issue.issue}`);
                    } else if (typeof issue === 'object' && issue.issue) {
                        SmartLogger.log('debug-tools',`   - ${issue.issue}`);
                    }
                });
            }
        });
        
        SmartLogger.log('debug-tools','\n🎯 OVERALL ASSESSMENT:');
        SmartLogger.log('debug-tools','======================');
        SmartLogger.log('debug-tools',`Total issues found: ${totalIssues}`);
        SmartLogger.log('debug-tools',`Critical issues: ${criticalIssues}`);
        
        if (criticalIssues > 0) {
            SmartLogger.log('debug-tools','❌ CRITICAL ISSUES DETECTED:');
            SmartLogger.log('debug-tools','   Scene membership or geometry problems found');
            SmartLogger.log('debug-tools','   These likely cause piece unresponsiveness');
        } else if (totalIssues > 0) {
            SmartLogger.log('debug-tools','⚠️ MINOR ISSUES DETECTED:');
            SmartLogger.log('debug-tools','   State synchronization or layering problems');
            SmartLogger.log('debug-tools','   May contribute to piece unresponsiveness');
        } else {
            SmartLogger.log('debug-tools','✅ NO OBVIOUS ISSUES DETECTED');
            SmartLogger.log('debug-tools','   All pieces appear to be in correct state');
            SmartLogger.log('debug-tools','   Issue may be more subtle or timing-related');
        }
        
        // Recommendations
        SmartLogger.log('debug-tools','\n🔧 RECOMMENDATIONS:');
        if (criticalIssues > 0) {
            SmartLogger.log('debug-tools','1. Fix scene membership issues - ensure pieces are in scene');
            SmartLogger.log('debug-tools','2. Fix geometry validity issues - recreate corrupted geometries');
            SmartLogger.log('debug-tools','3. Run ensurePieceVisibility() on affected pieces');
        } else if (totalIssues > 0) {
            SmartLogger.log('debug-tools','1. Fix state synchronization issues');
            SmartLogger.log('debug-tools','2. Resolve z-index conflicts');
            SmartLogger.log('debug-tools','3. Check for timing issues in piece updates');
        } else {
            SmartLogger.log('debug-tools','1. Investigate timing-related issues');
            SmartLogger.log('debug-tools','2. Check for race conditions in piece creation');
            SmartLogger.log('debug-tools','3. Examine raycaster intersection logic more closely');
        }
    }

    /**
     * Fix detected issues automatically
     */
    autoFixIssues() {
        SmartLogger.log('debug-tools','🔧 Attempting to auto-fix detected issues...');
        
        let fixedCount = 0;
        
        this.diagnosticResults.forEach(result => {
            if (result.issues) {
                result.issues.forEach(issue => {
                    if (issue.pieceIndex !== undefined) {
                        const pieceIndex = issue.pieceIndex;
                        
                        // Try to fix the piece
                        if (this.renderer.ensurePieceVisibility) {
                            if (this.renderer.ensurePieceVisibility(pieceIndex)) {
                                fixedCount++;
                                SmartLogger.log('debug-tools',`✅ Fixed piece ${pieceIndex}`);
                            } else {
                                SmartLogger.log('debug-tools',`❌ Failed to fix piece ${pieceIndex}`);
                            }
                        }
                    }
                });
            }
        });
        
        SmartLogger.log('debug-tools',`🔧 Auto-fixed ${fixedCount} pieces`);
        
        // Re-run diagnostics to see if issues are resolved
        if (fixedCount > 0) {
            SmartLogger.log('debug-tools','\n🔄 Re-running diagnostics after fixes...');
            this.runFullDiagnostics();
        }
        
        return fixedCount;
    }
}

// Global functions for easy access
window.diagnoseSceneState = function() {
    if (window.webglRenderer) {
        const diagnostic = new SceneStateDiagnostic(window.webglRenderer);
        return diagnostic.runFullDiagnostics();
    } else {
        console.warn('⚠️ WebGL renderer not available');
        return null;
    }
};

window.autoFixSceneIssues = function() {
    if (window.webglRenderer) {
        const diagnostic = new SceneStateDiagnostic(window.webglRenderer);
        diagnostic.runFullDiagnostics();
        return diagnostic.autoFixIssues();
    } else {
        console.warn('⚠️ WebGL renderer not available');
        return 0;
    }
};

// Add to debug commands
if (typeof window !== 'undefined') {
    const originalShowDebug = window.showDebugCommands;
    window.showDebugCommands = function() {
        if (originalShowDebug) originalShowDebug();
        SmartLogger.log('debug-tools','  diagnoseSceneState() - Diagnose scene management issues');
        SmartLogger.log('debug-tools','  autoFixSceneIssues() - Auto-fix detected scene issues');
    };
}
