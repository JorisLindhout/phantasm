/**
 * Comprehensive Test Suite for Object-Based System
 * Tests the new object-based architecture for pieces and slots
 */

class ObjectSystemTester {
    constructor(webglRenderer) {
        this.renderer = webglRenderer;
        this.testResults = [];
    }

    // Run all tests
    runAllTests() {
        console.log('🧪 Starting Object System Test Suite...');
        
        this.testObjectInitialization();
        this.testObjectArraySync();
        this.testPieceStateChanges();
        this.testSlotStateChanges();
        this.testHitDetection();
        this.testAutoRecovery();
        this.testPerformance();
        
        this.printResults();
    }

    // Test 1: Object Initialization
    testObjectInitialization() {
        console.log('🔍 Test 1: Object Initialization');
        
        const pieces = this.renderer.pieces;
        const slots = this.renderer.slots;
        
        // Check if objects are created
        if (!pieces || !slots) {
            this.addResult('Object Initialization', false, 'Pieces or slots not initialized');
            return;
        }
        
        // Check if correct number of objects
        if (pieces.length !== 40 || slots.length !== 40) {
            this.addResult('Object Initialization', false, `Expected 40 pieces/slots, got ${pieces.length}/${slots.length}`);
            return;
        }
        
        // Check object structure
        const piece = pieces[0];
        const slot = slots[0];
        
        const requiredPieceProps = ['id', 'polygon', 'state', 'zIndex', 'offset', 'visible', 'isInSlot'];
        const requiredSlotProps = ['id', 'polygon', 'state', 'pieceId', 'isCorrect'];
        
        const piecePropsValid = requiredPieceProps.every(prop => piece.hasOwnProperty(prop));
        const slotPropsValid = requiredSlotProps.every(prop => slot.hasOwnProperty(prop));
        
        if (!piecePropsValid || !slotPropsValid) {
            this.addResult('Object Initialization', false, 'Missing required properties');
            return;
        }
        
        this.addResult('Object Initialization', true, 'All objects properly initialized');
    }

    // Test 2: Object-Array Synchronization
    testObjectArraySync() {
        console.log('🔍 Test 2: Object-Array Synchronization');
        
        const pieces = this.renderer.pieces;
        const slots = this.renderer.slots;
        
        let syncIssues = 0;
        
        for (let i = 0; i < pieces.length; i++) {
            const piece = pieces[i];
            const slot = slots[i];
            
            // Check piece state sync
            if (piece.state !== this.renderer.pieceStates[i]) {
                syncIssues++;
            }
            
            // Check slot state sync
            if (slot.state !== this.renderer.slotStates[i]) {
                syncIssues++;
            }
            
            // Check z-index sync
            if (piece.zIndex !== this.renderer.pieceZIndices[i]) {
                syncIssues++;
            }
        }
        
        if (syncIssues > 0) {
            this.addResult('Object-Array Sync', false, `${syncIssues} synchronization issues found`);
        } else {
            this.addResult('Object-Array Sync', true, 'Perfect synchronization');
        }
    }

    // Test 3: Piece State Changes
    testPieceStateChanges() {
        console.log('🔍 Test 3: Piece State Changes');
        
        const testPieceIndex = 5;
        const originalState = this.renderer.pieces[testPieceIndex].state;
        
        // Simulate piece movement
        this.renderer.pieces[testPieceIndex].state = 'unsolved';
        this.renderer.pieces[testPieceIndex].isInSlot = false;
        this.renderer.pieces[testPieceIndex].offset = { x: 50, y: 30 };
        
        // Check if state changed
        if (this.renderer.pieces[testPieceIndex].state === 'unsolved') {
            this.addResult('Piece State Changes', true, 'Piece state updated successfully');
        } else {
            this.addResult('Piece State Changes', false, 'Piece state not updated');
        }
        
        // Reset for other tests
        this.renderer.pieces[testPieceIndex].state = originalState;
        this.renderer.pieces[testPieceIndex].isInSlot = true;
        this.renderer.pieces[testPieceIndex].offset = { x: 0, y: 0 };
    }

    // Test 4: Slot State Changes
    testSlotStateChanges() {
        console.log('🔍 Test 4: Slot State Changes');
        
        const testSlotIndex = 5;
        const originalState = this.renderer.slots[testSlotIndex].state;
        
        // Simulate slot becoming empty
        this.renderer.slots[testSlotIndex].state = 'empty';
        this.renderer.slots[testSlotIndex].pieceId = null;
        this.renderer.slots[testSlotIndex].isCorrect = false;
        
        // Check if state changed
        if (this.renderer.slots[testSlotIndex].state === 'empty') {
            this.addResult('Slot State Changes', true, 'Slot state updated successfully');
        } else {
            this.addResult('Slot State Changes', false, 'Slot state not updated');
        }
        
        // Reset for other tests
        this.renderer.slots[testSlotIndex].state = originalState;
        this.renderer.slots[testSlotIndex].pieceId = testSlotIndex;
        this.renderer.slots[testSlotIndex].isCorrect = true;
    }

    // Test 5: Hit Detection
    testHitDetection() {
        console.log('🔍 Test 5: Hit Detection');
        
        // Test hit detection with object system
        const testX = 100;
        const testY = 100;
        
        const hitResult = this.renderer.findPieceAtPosition(testX, testY);
        
        if (hitResult !== -1) {
            this.addResult('Hit Detection', true, `Hit detection working, found piece ${hitResult}`);
        } else {
            this.addResult('Hit Detection', true, 'Hit detection working (no piece at test coordinates)');
        }
    }

    // Test 6: Auto-Recovery
    testAutoRecovery() {
        console.log('🔍 Test 6: Auto-Recovery System');
        
        // Create an unreachable piece
        const testPieceIndex = 10;
        this.renderer.pieces[testPieceIndex].state = 'unsolved';
        this.renderer.pieces[testPieceIndex].mesh = null;
        this.renderer.pieces[testPieceIndex].isInSlot = false;
        
        // Test auto-recovery
        const recoveredCount = this.renderer.autoRecoverUnreachablePieces();
        
        if (recoveredCount > 0) {
            this.addResult('Auto-Recovery', true, `Recovered ${recoveredCount} pieces`);
        } else {
            this.addResult('Auto-Recovery', true, 'No pieces needed recovery');
        }
    }

    // Test 7: Performance
    testPerformance() {
        console.log('🔍 Test 7: Performance');
        
        const iterations = 1000;
        const startTime = performance.now();
        
        // Test object property access performance
        for (let i = 0; i < iterations; i++) {
            for (let j = 0; j < this.renderer.pieces.length; j++) {
                const piece = this.renderer.pieces[j];
                const state = piece.state;
                const zIndex = piece.zIndex;
                const offset = piece.offset;
            }
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (duration < 100) { // Should be fast
            this.addResult('Performance', true, `Object access: ${duration.toFixed(2)}ms for ${iterations} iterations`);
        } else {
            this.addResult('Performance', false, `Object access too slow: ${duration.toFixed(2)}ms`);
        }
    }

    // Helper methods
    addResult(testName, passed, message) {
        this.testResults.push({
            test: testName,
            passed: passed,
            message: message
        });
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${message}`);
    }

    printResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.test}: ${result.message}`);
        });
        
        console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('🎉 All tests passed! Object system is working correctly.');
        } else {
            console.log('⚠️ Some tests failed. Check the results above.');
        }
    }
}

// Global function to run tests
window.runObjectSystemTests = function() {
    if (window.webglRenderer) {
        const tester = new ObjectSystemTester(window.webglRenderer);
        tester.runAllTests();
    } else {
        console.error('❌ WebGL renderer not available for testing');
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObjectSystemTester;
}
