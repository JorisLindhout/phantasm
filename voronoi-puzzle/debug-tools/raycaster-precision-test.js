/**
 * Raycaster Precision Test Suite
 * Tests the hypothesis that raycaster precision degrades with large coordinates
 */

class RaycasterPrecisionTest {
    constructor(webglRenderer) {
        this.renderer = webglRenderer;
        this.testResults = [];
        this.debugMesh = null;
    }

    /**
     * Run comprehensive precision tests
     */
    runAllTests() {
        SmartLogger.log('debug-tools',('🧪 Starting Raycaster Precision Tests...');
        
        this.testResults = [];
        
        // Test 1: Basic precision at different coordinate ranges
        this.testCoordinateRanges();
        
        // Test 2: Raycaster behavior with progressively larger coordinates
        this.testProgressiveCoordinates();
        
        // Test 3: Compare visual vs collision detection
        this.testVisualVsCollision();
        
        // Test 4: Test with actual piece geometry
        this.testWithActualPieces();
        
        // Generate report
        this.generateReport();
        
        return this.testResults;
    }

    /**
     * Test 1: Check raycaster precision at different coordinate ranges
     */
    testCoordinateRanges() {
        SmartLogger.log('debug-tools',('📊 Test 1: Coordinate Range Precision');
        
        const ranges = [
            { name: 'Near origin', min: -10, max: 10 },
            { name: 'Medium distance', min: -100, max: 100 },
            { name: 'Far distance', min: -1000, max: 1000 },
            { name: 'Very far', min: -10000, max: 10000 },
            { name: 'Extreme', min: -100000, max: 100000 }
        ];

        ranges.forEach(range => {
            const result = this.testRaycasterAtRange(range);
            this.testResults.push({
                test: 'Coordinate Ranges',
                range: range.name,
                ...result
            });
        });
    }

    /**
     * Test raycaster precision at a specific coordinate range
     */
    testRaycasterAtRange(range) {
        const testPositions = [
            { x: range.min, y: range.min },
            { x: 0, y: 0 },
            { x: range.max, y: range.max },
            { x: range.min, y: range.max },
            { x: range.max, y: range.min }
        ];

        let successCount = 0;
        let totalTests = testPositions.length;

        testPositions.forEach(pos => {
            const success = this.testSingleRaycast(pos.x, pos.y);
            if (success) successCount++;
        });

        const successRate = (successCount / totalTests) * 100;
        
        SmartLogger.log('debug-tools',(`   ${range.name}: ${successCount}/${totalTests} (${successRate.toFixed(1)}%)`);
        
        return {
            successRate,
            successCount,
            totalTests,
            range: range
        };
    }

    /**
     * Test 2: Progressive coordinate testing
     */
    testProgressiveCoordinates() {
        SmartLogger.log('debug-tools',('📈 Test 2: Progressive Coordinate Testing');
        
        const distances = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000];
        
        distances.forEach(distance => {
            const result = this.testRaycasterAtDistance(distance);
            this.testResults.push({
                test: 'Progressive Coordinates',
                distance,
                ...result
            });
        });
    }

    /**
     * Test raycaster at a specific distance from origin
     */
    testRaycasterAtDistance(distance) {
        const angles = [0, 45, 90, 135, 180, 225, 270, 315]; // Test 8 directions
        let successCount = 0;

        angles.forEach(angle => {
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * distance;
            const y = Math.sin(rad) * distance;
            
            const success = this.testSingleRaycast(x, y);
            if (success) successCount++;
        });

        const successRate = (successCount / angles.length) * 100;
        
        SmartLogger.log('debug-tools',(`   Distance ${distance}: ${successCount}/${angles.length} (${successRate.toFixed(1)}%)`);
        
        return {
            successRate,
            successCount,
            totalTests: angles.length,
            distance
        };
    }

    /**
     * Test 3: Visual vs Collision detection comparison
     */
    testVisualVsCollision() {
        SmartLogger.log('debug-tools',('👁️ Test 3: Visual vs Collision Detection');
        
        // Create a test mesh at different distances
        const distances = [100, 1000, 10000, 100000];
        
        distances.forEach(distance => {
            const result = this.testVisualVsCollisionAtDistance(distance);
            this.testResults.push({
                test: 'Visual vs Collision',
                distance,
                ...result
            });
        });
    }

    /**
     * Test visual vs collision detection at specific distance
     */
    testVisualVsCollisionAtDistance(distance) {
        // Create test mesh
        const geometry = new THREE.BoxGeometry(10, 10, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const testMesh = new THREE.Mesh(geometry, material);
        
        // Position at distance
        testMesh.position.set(distance, 0, 0);
        this.renderer.scene.add(testMesh);
        
        // Test collision detection
        const canvasCenter = {
            x: this.renderer.canvas.width / 2,
            y: this.renderer.canvas.height / 2
        };
        
        const hitResult = this.renderer.findPieceAtPosition(canvasCenter.x, canvasCenter.y);
        const isDetectable = hitResult !== null;
        
        // Clean up
        this.renderer.scene.remove(testMesh);
        geometry.dispose();
        material.dispose();
        
        SmartLogger.log('debug-tools',(`   Distance ${distance}: Detectable = ${isDetectable}`);
        
        return {
            isDetectable,
            distance
        };
    }

    /**
     * Test 4: Test with actual piece geometry
     */
    testWithActualPieces() {
        SmartLogger.log('debug-tools',('🧩 Test 4: Actual Piece Geometry Testing');
        
        // Find pieces that are currently unresponsive
        const unresponsivePieces = this.findUnresponsivePieces();
        
        unresponsivePieces.forEach(pieceIndex => {
            const result = this.testPieceResponsiveness(pieceIndex);
            this.testResults.push({
                test: 'Actual Pieces',
                pieceIndex,
                ...result
            });
        });
    }

    /**
     * Find pieces that should be responsive but aren't
     */
    findUnresponsivePieces() {
        const unresponsive = [];
        
        for (let i = 0; i < this.renderer.pieces.length; i++) {
            const piece = this.renderer.pieces[i];
            
            // Check if piece is unsolved and has a mesh
            if (piece.state === 'unsolved' && piece.mesh) {
                // Test if piece is actually responsive
                const isResponsive = this.testPieceResponsiveness(i);
                if (!isResponsive.isResponsive) {
                    unresponsive.push(i);
                }
            }
        }
        
        SmartLogger.log('debug-tools',(`   Found ${unresponsive.length} potentially unresponsive pieces`);
        return unresponsive;
    }

    /**
     * Test if a specific piece is responsive
     */
    testPieceResponsiveness(pieceIndex) {
        const piece = this.renderer.pieces[pieceIndex];
        if (!piece || !piece.mesh) {
            return { isResponsive: false, reason: 'No mesh' };
        }

        // Get piece position in screen coordinates
        const worldPosition = piece.mesh.position.clone();
        const screenPosition = this.worldToScreen(worldPosition);
        
        // Test hit detection at piece's screen position
        const hitResult = this.renderer.findPieceAtPosition(screenPosition.x, screenPosition.y);
        const isResponsive = hitResult === pieceIndex;
        
        // Calculate distance from origin
        const distanceFromOrigin = Math.sqrt(worldPosition.x * worldPosition.x + worldPosition.y * worldPosition.y);
        
        SmartLogger.log('debug-tools',(`   Piece ${pieceIndex}: Distance=${distanceFromOrigin.toFixed(1)}, Responsive=${isResponsive}`);
        
        return {
            isResponsive,
            distanceFromOrigin,
            screenPosition,
            worldPosition: worldPosition
        };
    }

    /**
     * Test a single raycast at given world coordinates
     */
    testSingleRaycast(worldX, worldY) {
        try {
            // Convert world coordinates to screen coordinates
            const screenPos = this.worldToScreen(new THREE.Vector3(worldX, worldY, 0));
            
            // Test if raycaster can detect anything at this position
            const result = this.renderer.findPieceAtPosition(screenPos.x, screenPos.y);
            
            return result !== null;
        } catch (error) {
            console.warn(`Raycast test failed at (${worldX}, ${worldY}):`, error);
            return false;
        }
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldPosition) {
        const vector = worldPosition.clone();
        vector.project(this.renderer.camera);
        
        const x = (vector.x * 0.5 + 0.5) * this.renderer.canvas.width;
        const y = (vector.y * -0.5 + 0.5) * this.renderer.canvas.height;
        
        return { x, y };
    }

    /**
     * Generate comprehensive test report
     */
    generateReport() {
        SmartLogger.log('debug-tools',('\n📋 RAYCASTER PRECISION TEST REPORT');
        SmartLogger.log('debug-tools',('=====================================');
        
        // Group results by test type
        const groupedResults = {};
        this.testResults.forEach(result => {
            if (!groupedResults[result.test]) {
                groupedResults[result.test] = [];
            }
            groupedResults[result.test].push(result);
        });
        
        // Analyze each test type
        Object.keys(groupedResults).forEach(testType => {
            SmartLogger.log('debug-tools',(`\n${testType}:`);
            const results = groupedResults[testType];
            
            if (testType === 'Coordinate Ranges') {
                this.analyzeCoordinateRanges(results);
            } else if (testType === 'Progressive Coordinates') {
                this.analyzeProgressiveCoordinates(results);
            } else if (testType === 'Visual vs Collision') {
                this.analyzeVisualVsCollision(results);
            } else if (testType === 'Actual Pieces') {
                this.analyzeActualPieces(results);
            }
        });
        
        // Overall conclusion
        this.generateConclusion();
    }

    analyzeCoordinateRanges(results) {
        results.forEach(result => {
            const status = result.successRate > 80 ? '✅' : result.successRate > 50 ? '⚠️' : '❌';
            SmartLogger.log('debug-tools',(`  ${status} ${result.range.name}: ${result.successRate.toFixed(1)}% success`);
        });
    }

    analyzeProgressiveCoordinates(results) {
        results.forEach(result => {
            const status = result.successRate > 80 ? '✅' : result.successRate > 50 ? '⚠️' : '❌';
            SmartLogger.log('debug-tools',(`  ${status} Distance ${result.distance}: ${result.successRate.toFixed(1)}% success`);
        });
        
        // Find precision threshold
        const threshold = results.find(r => r.successRate < 50);
        if (threshold) {
            SmartLogger.log('debug-tools',(`  🎯 Precision threshold appears around distance: ${threshold.distance}`);
        }
    }

    analyzeVisualVsCollision(results) {
        results.forEach(result => {
            const status = result.isDetectable ? '✅' : '❌';
            SmartLogger.log('debug-tools',(`  ${status} Distance ${result.distance}: ${result.isDetectable ? 'Detectable' : 'Not detectable'}`);
        });
    }

    analyzeActualPieces(results) {
        const unresponsive = results.filter(r => !r.isResponsive);
        const responsive = results.filter(r => r.isResponsive);
        
        SmartLogger.log('debug-tools',(`  📊 Responsive pieces: ${responsive.length}`);
        SmartLogger.log('debug-tools',(`  📊 Unresponsive pieces: ${unresponsive.length}`);
        
        if (unresponsive.length > 0) {
            SmartLogger.log('debug-tools',('  🎯 Unresponsive pieces:');
            unresponsive.forEach(result => {
                SmartLogger.log('debug-tools',(`    Piece ${result.pieceIndex}: Distance=${result.distanceFromOrigin.toFixed(1)}`);
            });
        }
    }

    generateConclusion() {
        SmartLogger.log('debug-tools',('\n🎯 CONCLUSION:');
        
        // Check if precision degrades with distance
        const progressiveResults = this.testResults.filter(r => r.test === 'Progressive Coordinates');
        const hasPrecisionDegradation = progressiveResults.some(r => r.successRate < 50);
        
        if (hasPrecisionDegradation) {
            SmartLogger.log('debug-tools',('✅ HYPOTHESIS CONFIRMED: Raycaster precision degrades with large coordinates');
            
            const threshold = progressiveResults.find(r => r.successRate < 50);
            if (threshold) {
                SmartLogger.log('debug-tools',(`   Precision threshold: ~${threshold.distance} units from origin`);
            }
        } else {
            SmartLogger.log('debug-tools',('❌ HYPOTHESIS REJECTED: Raycaster precision does not degrade significantly');
        }
        
        // Check actual pieces
        const actualResults = this.testResults.filter(r => r.test === 'Actual Pieces');
        const unresponsivePieces = actualResults.filter(r => !r.isResponsive);
        
        if (unresponsivePieces.length > 0) {
            SmartLogger.log('debug-tools',(`\n🔧 ACTION NEEDED: ${unresponsivePieces.length} pieces are unresponsive`);
            SmartLogger.log('debug-tools',('   Consider implementing coordinate-based fixes for distant pieces');
        }
    }

    /**
     * Create visual debugging tools
     */
    createVisualDebugTools() {
        SmartLogger.log('debug-tools',('🎨 Creating visual debugging tools...');
        
        // Add debug overlay to show raycaster precision zones
        this.createPrecisionZoneOverlay();
        
        // Add piece distance indicators
        this.createDistanceIndicators();
    }

    createPrecisionZoneOverlay() {
        // This would create visual indicators showing where raycaster precision is good/bad
        SmartLogger.log('debug-tools',('   Precision zone overlay created');
    }

    createDistanceIndicators() {
        // This would show distance from origin for each piece
        SmartLogger.log('debug-tools',('   Distance indicators created');
    }
}

// Global function to run the test
window.testRaycasterPrecision = function() {
    if (window.webglRenderer) {
        const tester = new RaycasterPrecisionTest(window.webglRenderer);
        return tester.runAllTests();
    } else {
        console.warn('⚠️ WebGL renderer not available');
        return null;
    }
};

// Add to debug commands
if (typeof window !== 'undefined') {
    window.showDebugCommands = window.showDebugCommands || function() {};
    const originalShowDebug = window.showDebugCommands;
    window.showDebugCommands = function() {
        originalShowDebug();
        SmartLogger.log('debug-tools',('  testRaycasterPrecision() - Test raycaster precision with large coordinates');
    };
}
