/**
 * Simple Raycaster Precision Test
 * Quick test to verify if raycaster precision degrades with large coordinates
 */

// Global function for immediate testing
window.testRaycasterPrecision = function() {
    if (!window.webglRenderer) {
        console.warn('⚠️ WebGL renderer not available');
        return;
    }

    SmartLogger.log('debug-tools','🧪 Testing Raycaster Precision with Large Coordinates...');
    
    const renderer = window.webglRenderer;
    const results = [];

    // Test different distances from origin
    const testDistances = [10, 100, 1000, 5000, 10000, 50000, 100000];
    
    testDistances.forEach(distance => {
        SmartLogger.log('debug-tools',`\n📏 Testing distance: ${distance}`);
        
        // Create a test mesh at this distance
        const geometry = new THREE.BoxGeometry(20, 20, 20);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.5
        });
        const testMesh = new THREE.Mesh(geometry, material);
        
        // Position at distance
        testMesh.position.set(distance, 0, 0);
        renderer.scene.add(testMesh);
        
        // Get screen position of the test mesh
        const worldPosition = testMesh.position.clone();
        worldPosition.project(renderer.camera);
        
        const screenX = (worldPosition.x * 0.5 + 0.5) * renderer.canvas.width;
        const screenY = (worldPosition.y * -0.5 + 0.5) * renderer.canvas.height;
        
        SmartLogger.log('debug-tools',`   World position: (${distance}, 0, 0)`);
        SmartLogger.log('debug-tools',`   Screen position: (${screenX.toFixed(1)}, ${screenY.toFixed(1)})`);
        
        // Test if raycaster can detect the mesh
        const hitResult = renderer.findPieceAtPosition(screenX, screenY);
        const isDetectable = hitResult !== null;
        
        SmartLogger.log('debug-tools',`   Raycaster result: ${isDetectable ? '✅ DETECTED' : '❌ NOT DETECTED'}`);
        
        results.push({
            distance,
            isDetectable,
            worldPosition: { x: distance, y: 0, z: 0 },
            screenPosition: { x: screenX, y: screenY }
        });
        
        // Clean up
        renderer.scene.remove(testMesh);
        geometry.dispose();
        material.dispose();
    });
    
    // Analyze results
    SmartLogger.log('debug-tools','\n📊 RESULTS ANALYSIS:');
    SmartLogger.log('debug-tools','==================');
    
    const detectableCount = results.filter(r => r.isDetectable).length;
    const totalCount = results.length;
    
    SmartLogger.log('debug-tools',`Detectable at ${detectableCount}/${totalCount} distances`);
    
    // Find precision threshold
    const firstUndetectable = results.find(r => !r.isDetectable);
    if (firstUndetectable) {
        SmartLogger.log('debug-tools',`🎯 First undetectable distance: ${firstUndetectable.distance}`);
        SmartLogger.log('debug-tools','   This suggests raycaster precision threshold');
    }
    
    // Check if precision degrades with distance
    let precisionDegrades = false;
    for (let i = 1; i < results.length; i++) {
        if (results[i-1].isDetectable && !results[i].isDetectable) {
            precisionDegrades = true;
            break;
        }
    }
    
    SmartLogger.log('debug-tools',`\n🎯 CONCLUSION:`);
    if (precisionDegrades) {
        SmartLogger.log('debug-tools','✅ HYPOTHESIS CONFIRMED: Raycaster precision degrades with large coordinates');
    } else {
        SmartLogger.log('debug-tools','❌ HYPOTHESIS REJECTED: No clear precision degradation detected');
    }
    
    return results;
};

// Test with actual unresponsive pieces
window.testUnresponsivePieces = function() {
    if (!window.webglRenderer) {
        console.warn('⚠️ WebGL renderer not available');
        return;
    }

    SmartLogger.log('debug-tools','🧩 Testing Actual Unresponsive Pieces...');
    
    const renderer = window.webglRenderer;
    const unresponsivePieces = [];
    
    // Find unsolved pieces and test their responsiveness
    for (let i = 0; i < renderer.pieces.length; i++) {
        const piece = renderer.pieces[i];
        
        if (piece.state === 'unsolved' && piece.mesh) {
            // Calculate distance from origin
            const distance = Math.sqrt(
                piece.mesh.position.x * piece.mesh.position.x + 
                piece.mesh.position.y * piece.mesh.position.y
            );
            
            // Get screen position
            const worldPosition = piece.mesh.position.clone();
            worldPosition.project(renderer.camera);
            
            const screenX = (worldPosition.x * 0.5 + 0.5) * renderer.canvas.width;
            const screenY = (worldPosition.y * -0.5 + 0.5) * renderer.canvas.height;
            
            // Test responsiveness
            const hitResult = renderer.findPieceAtPosition(screenX, screenY);
            const isResponsive = hitResult === i;
            
            if (!isResponsive) {
                unresponsivePieces.push({
                    index: i,
                    distance,
                    worldPosition: piece.mesh.position.clone(),
                    screenPosition: { x: screenX, y: screenY },
                    isResponsive
                });
                
                SmartLogger.log('debug-tools',`❌ Piece ${i}: Distance=${distance.toFixed(1)}, Not responsive`);
            }
        }
    }
    
    if (unresponsivePieces.length > 0) {
        SmartLogger.log('debug-tools',`\n📊 Found ${unresponsivePieces.length} unresponsive pieces:`);
        
        // Sort by distance
        unresponsivePieces.sort((a, b) => b.distance - a.distance);
        
        unresponsivePieces.forEach(piece => {
            SmartLogger.log('debug-tools',`   Piece ${piece.index}: Distance=${piece.distance.toFixed(1)}`);
        });
        
        // Check if distance correlates with unresponsiveness
        const avgDistance = unresponsivePieces.reduce((sum, p) => sum + p.distance, 0) / unresponsivePieces.length;
        SmartLogger.log('debug-tools',`\n🎯 Average distance of unresponsive pieces: ${avgDistance.toFixed(1)}`);
        
        if (avgDistance > 1000) {
            SmartLogger.log('debug-tools','✅ SUPPORTS HYPOTHESIS: Unresponsive pieces are far from origin');
        }
    } else {
        SmartLogger.log('debug-tools','✅ All pieces are responsive');
    }
    
    return unresponsivePieces;
};

// Combined test function
window.runPrecisionTests = function() {
    SmartLogger.log('debug-tools','🚀 Running Complete Precision Test Suite...');
    SmartLogger.log('debug-tools','==========================================');
    
    // Test 1: Synthetic precision test
    const syntheticResults = window.testRaycasterPrecision();
    
    // Test 2: Actual piece responsiveness
    const unresponsivePieces = window.testUnresponsivePieces();
    
    // Final analysis
    SmartLogger.log('debug-tools','\n🎯 FINAL ANALYSIS:');
    SmartLogger.log('debug-tools','==================');
    
    if (syntheticResults && unresponsivePieces) {
        const hasPrecisionIssues = syntheticResults.some(r => !r.isDetectable);
        const hasUnresponsivePieces = unresponsivePieces.length > 0;
        
        if (hasPrecisionIssues && hasUnresponsivePieces) {
            SmartLogger.log('debug-tools','✅ HYPOTHESIS STRONGLY SUPPORTED:');
            SmartLogger.log('debug-tools','   - Raycaster precision degrades with large coordinates');
            SmartLogger.log('debug-tools','   - Actual pieces become unresponsive when far from origin');
            SmartLogger.log('debug-tools','   - Distance-based auto-recovery needed');
        } else if (hasPrecisionIssues) {
            SmartLogger.log('debug-tools','⚠️ HYPOTHESIS PARTIALLY SUPPORTED:');
            SmartLogger.log('debug-tools','   - Raycaster precision issues detected');
            SmartLogger.log('debug-tools','   - But no unresponsive pieces found');
        } else if (hasUnresponsivePieces) {
            SmartLogger.log('debug-tools','❌ HYPOTHESIS NOT SUPPORTED:');
            SmartLogger.log('debug-tools','   - No raycaster precision issues detected');
            SmartLogger.log('debug-tools','   - But unresponsive pieces exist');
            SmartLogger.log('debug-tools','   - Issue may be different than coordinate precision');
        } else {
            SmartLogger.log('debug-tools','✅ NO ISSUES DETECTED: All systems working normally');
        }
    }
    
    return {
        syntheticResults,
        unresponsivePieces
    };
};

// Add to debug commands
if (typeof window !== 'undefined') {
    const originalShowDebug = window.showDebugCommands;
    window.showDebugCommands = function() {
        if (originalShowDebug) originalShowDebug();
        SmartLogger.log('debug-tools','  testRaycasterPrecision() - Test raycaster precision with large coordinates');
        SmartLogger.log('debug-tools','  testUnresponsivePieces() - Test actual piece responsiveness');
        SmartLogger.log('debug-tools','  runPrecisionTests() - Run complete precision test suite');
    };
}
