/**
 * WebGL Renderer for Phantasm with proper z-index layering
 * Uses Three.js for simplified WebGL management
 */

import * as THREE from 'three';
import { SNAP_THRESHOLD, WEBGL_SNAP_THRESHOLD, SOLVE_THRESHOLD, GLOW_LAYER_CONFIGS, OUTLINE_OPACITY } from './constants.js';
import { createAnimatedPolygon } from './animated-path.js';
import { buildSeparatePieceGeometry } from './separate-piece-geometry.js';
import { getSeparatePieceMeshPosition } from './drag-offset.js';
import { ensureUnsolvedPieceBackground } from './piece-material.js';
import { configureRendererColors, configureTextureColors } from './three-config.js';
import { LEVEL_HEIGHT, LEVEL_WIDTH } from './stage-constants.js';

// Check if WebGL is supported
function isWebGLSupported() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const supported = !!gl;
        console.log('🔍 WebGL support check:', supported);
        return supported;
    } catch (e) {
        console.error('🔍 WebGL support check failed:', e);
        return false;
    }
}

class WebGLVoronoiRenderer {
    constructor(canvas, config = null) {
        this.originalCanvas = canvas;
        this.canvas = null; // Will create a new canvas for WebGL
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.backgroundTexture = null;
        this.animationTime = 0;
        
        // Store configuration for noise amplitude control
        this.config = config || { noiseAmplitude: 20 };
        
        // Store original background image dimensions for proper UV mapping
        this.backgroundImageWidth = LEVEL_WIDTH;
        this.backgroundImageHeight = LEVEL_HEIGHT;
        
        // Store Voronoi data for connected rendering
        this.voronoiPolygons = [];
        this.connectedMesh = null; // Single mesh for all connected pieces
        this.connectedOutline = null; // Outline for connected mesh
        // Array backup system removed - using object system only
        this.separateGlowOutlines = []; // Neon glow outlines for separate pieces
        this.pieceZIndices = []; // Z-index for each piece
        this.separatePiecesMode = false;
        // Object-based system
        this.pieces = []; // Object-based pieces
        this.slots = [];  // Object-based slots
        
        // Hover effect for connected pieces and slots
        this.hoverOverlay = null; // Temporary highlight mesh for piece hover
        this.slotHoverOverlay = null; // Temporary highlight mesh for slot hover
        this.hoveredPieceIndex = undefined; // Track which piece is currently hovered
        this.hoveredSlotIndex = undefined; // Track which slot is currently hovered
        
        // Grid outline visibility toggle
        this.showGridOutlines = false; // Set to true to show the thin blue grid outlines
        
        // Initialize position manager (will be set up when originalPoints are available)
        this.positionManager = null;
        
        // Track dragging state for glow timing
        this.isDragging = false;
        this.draggedPieceIndex = -1;
        
        // Theme system
        this.currentTheme = null; // Will be set by theme manager
        
        // Solved state tracking
        this.isSolved = false;
        this.solveThreshold = SOLVE_THRESHOLD;

        this.debugLogging = {
            interactionDebug: false,
            materialUpdates: false,
            hoverEffects: false,
            neonGlow: false,
            initialization: false,
            coordinates: false,
            rendererSwitching: false,
            canvasSetup: false,
        };
        
        this.init();
    }
    
    // Update configuration (for slider changes)
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    
    init() {
        // Check WebGL support first
        if (!isWebGLSupported()) {
            throw new Error('WebGL is not supported by this browser');
        }
        
        // Create a new canvas for WebGL to avoid context conflicts
        this.canvas = document.createElement('canvas');

        // Match logical resolution set by setupCanvas on the hidden canvas
        const logicalWidth = this.originalCanvas.width;
        const logicalHeight = this.originalCanvas.height;

        this.canvas.width = logicalWidth;
        this.canvas.height = logicalHeight;
        
        // Set CSS size to fill container
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'auto'; // Enable mouse events on WebGL canvas
        this.canvas.style.zIndex = '10';
        
        // Add WebGL canvas class for CSS targeting
        this.canvas.classList.add('webgl-canvas');
        
        // Insert the WebGL canvas as a sibling to the original canvas
        this.originalCanvas.parentNode.appendChild(this.canvas);
        
        // Create Three.js scene
        this.scene = new THREE.Scene();
        
        // Create orthographic camera for 2D-like rendering
        const width = this.canvas.width;
        const height = this.canvas.height;
        this.camera = new THREE.OrthographicCamera(
            0, width,     // left, right
            0, height,    // bottom, top (WebGL coordinates: Y=0 at bottom, Y=height at top)
            -1000, 1000   // near, far (large range for z-layering)
        );
        this.camera.position.z = 100;
        
        try {
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                alpha: true,
                antialias: true,
                preserveDrawingBuffer: false,
                powerPreference: 'default',
                failIfMajorPerformanceCaveat: false,
            });
        } catch (error) {
            console.error('❌ WebGL context creation failed:', error);
            console.error('❌ Error details:', error.message);
            throw new Error('WebGL not supported or context creation failed: ' + error.message);
        }
        this.renderer.setSize(width, height, false); // false = don't update CSS size
        this.renderer.setClearColor(0x111111, 1.0);
        
        // Enable depth testing for proper z-layering
        this.renderer.sortObjects = true;
        this.renderer.setPixelRatio(1); // Force pixel ratio to 1 to avoid scaling issues
        configureRendererColors(this.renderer);

        this.canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            console.warn('WebGL context lost');
        });

        this.canvas.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored');
            if (this.voronoiPolygons.length > 0) {
                this.createConnectedMesh();
            }
        });
        
        // KEEP: User-facing success message
        console.log('✅ WebGL renderer initialized');
    }
    
    // Initialize position manager when originalPoints are available
    initPositionManager(originalPoints) {
        if (this.positionManager) {
            this.positionManager.updateOriginalPoints(originalPoints);
        } else {
            this.positionManager = new PositionManager(originalPoints, this.canvas.height);
        }
        
        // KEEP: User-facing success message
        console.log('✅ Position manager initialized with', originalPoints.length, 'points');
    }
    
    loadBackgroundTexture(imageUrl) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                imageUrl,
                (texture) => {
                    this.backgroundTexture = configureTextureColors(texture);
                    texture.wrapS = THREE.ClampToEdgeWrapping;
                    texture.wrapT = THREE.ClampToEdgeWrapping;
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    // KEEP: User-facing success message
                    console.log('✅ Background texture loaded');
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.error('❌ Error loading background texture:', error);
                    reject(error);
                }
            );
        });
    }
    
    /**
     * Calculate proper UV coordinates based on background image dimensions
     * This centers the background image within the canvas and maintains its aspect ratio
     * 
     * @param {number} x - X coordinate in canvas space
     * @param {number} y - Y coordinate in canvas space
     * @returns {Object} {u, v} UV coordinates (0-1 range)
     */
    calculateBackgroundUV(x, y) {
        // Calculate offset to center the background image within the canvas
        const offsetX = (this.canvas.width - this.backgroundImageWidth) / 2;
        const offsetY = (this.canvas.height - this.backgroundImageHeight) / 2;
        
        // Apply offset to coordinates before calculating UV
        const u = (x - offsetX) / this.backgroundImageWidth;
        const v = 1.0 - ((y - offsetY) / this.backgroundImageHeight); // Flip Y for WebGL coordinates
        
        return { u, v };
    }
    
    // Initialize Voronoi data for connected rendering
    initializeVoronoi(polygons) {
        this.voronoiPolygons = polygons.map(polygon => [...polygon]); // Deep copy
        
        // NEW: Initialize object-based system
        this.pieces = [];
        this.slots = [];
        
        for (let i = 0; i < polygons.length; i++) {
            // Create piece object
            this.pieces[i] = {
                id: i,
                polygon: this.voronoiPolygons[i],
                mesh: null,
                outline: null,
                glowOutline: null,
                state: 'solved',
                slotState: 'filled',
                zIndex: 0,
                offset: { x: 0, y: 0 },
                visible: true,
                hovered: false,
                dragging: false,
                slotId: i,
                isInSlot: true,
                animationTime: 0,
                animationOffset: { x: 0, y: 0 }
            };
            
            // Create slot object
            this.slots[i] = {
                id: i,
                polygon: this.voronoiPolygons[i],
                position: { x: 0, y: 0 }, // Will be calculated from polygon center
                state: 'filled',
                pieceId: i,
                correctPieceId: i,
                isCorrect: true,
                hovered: false,
                showBackground: true
            };
        }
        
        // Create the connected mesh that represents all pieces
        this.createConnectedMesh();
        
        // Initialize solved state (puzzle starts solved since all pieces are in place)
        this.isSolved = true;
        this.onSolvedStateChanged(true);

        if (this.originalPoints && this.originalPoints.length > 0) {
            // KEEP: User-facing success message
            console.log('✅ Initializing position manager with', this.originalPoints.length, 'points');
            this.initPositionManager(this.originalPoints);
        } else {
            // KEEP: User-facing warning message
            console.log('⚠️ Position manager not initialized - originalPoints not available');
        }
    }
    
    // NEW: Debug method to validate object-array sync
    validateObjectArraySync() {        
        for (let i = 0; i < this.pieces.length; i++) {
            const piece = this.pieces[i];
            const slot = this.slots[i];
            
            
            // Check mesh sync (object system only)
            const objectHasMesh = piece.mesh !== null;

        }        
    }
    
    // NEW: Auto-recovery for unreachable pieces
    autoRecoverUnreachablePieces() {
        let recoveredCount = 0;
        
        // Safety check: Don't run auto-recovery too frequently
        const now = Date.now();
        if (this.lastAutoRecoveryTime && (now - this.lastAutoRecoveryTime) < 2000) {
            return 0; // Don't run auto-recovery more than once every 2 seconds
        }
        this.lastAutoRecoveryTime = now;
        
        // Check all pieces for unreachable state
        for (let i = 0; i < this.pieces.length; i++) {
            const piece = this.pieces[i];
            const slot = this.slots[i];
            
            // Skip if piece is already in correct slot
            if (piece.isInSlot && slot.isCorrect) {
                continue;
            }
            
            // Check if piece is in an unreachable state
            const isUnreachable = this.isPieceUnreachable(i);
            
            if (isUnreachable) {                
                // Reset piece to connected state
                this.resetPieceToConnected(i);
                recoveredCount++;                
            }
        }
        
        return recoveredCount;
    }
    
    // Check for pieces that are in a "ghost" state (solved but not detectable)
    checkForGhostPieces() {
        let ghostCount = 0;
        
        for (let i = 0; i < this.pieces.length; i++) {
            const piece = this.pieces[i];
            const slot = this.slots[i];
            
            // Only check pieces that should be detectable
            if (piece.state === 'solved' && piece.isInSlot && slot.isCorrect) {
                // Test if this piece is actually detectable at its expected position
                const isDetectable = this.testPieceDetectability(i);
                if (!isDetectable) {
                    ghostCount++;
                }
            }
        }

        return ghostCount;
    }
    
    // NEW: Test if a piece is detectable at its expected position
    testPieceDetectability(pieceIndex) {
        const piece = this.pieces[pieceIndex];
        const slot = this.slots[pieceIndex];
        
        // Get the expected position of this piece
        const expectedPosition = this.getPieceExpectedPosition(pieceIndex);
        if (!expectedPosition) return false;
        
        // Convert world position to screen coordinates
        const screenPos = this.worldToScreen(expectedPosition);
        if (!screenPos) return false;
        
        // Test hit detection at this position
        const hitPiece = this.findPieceAtPosition(screenPos.x, screenPos.y, true);
        
        return hitPiece === pieceIndex;
    }
    
    // NEW: Get the expected position of a piece
    getPieceExpectedPosition(pieceIndex) {
        const piece = this.pieces[pieceIndex];
        const slot = this.slots[pieceIndex];
        
        if (piece.isInSlot && slot.isCorrect) {
            // Piece should be at its slot position
            return slot.position || { x: 0, y: 0, z: 0 };
        }
        
        return null;
    }
    
    // Convert world position to screen coordinates using coordinate utilities
    worldToScreen(worldPosition) {
        return CoordinateUtils.webGLWorldToScreen(
            worldPosition, 
            this.camera, 
            this.canvas.width, 
            this.canvas.height
        );
    }
    
    // Check if a piece is in an unreachable state
    isPieceUnreachable(pieceIndex) {
        const piece = this.pieces[pieceIndex];
        const slot = this.slots[pieceIndex];
        
        // Piece is unreachable if:
        // 1. It's marked as unsolved but has no separate mesh (truly lost)
        // 2. It's in an incorrect slot (wrong position)
        // 3. It has a separate mesh but is not visible or not in scene
        
        const hasSeparateMesh = piece.mesh !== null;
        const isUnsolved = piece.state === 'unsolved';
        const isInCorrectSlot = piece.isInSlot && slot.isCorrect;
        const isInWrongSlot = piece.isInSlot && !slot.isCorrect;
        
        // Case 1: Piece is unsolved but has no separate mesh (truly lost)
        if (isUnsolved && !hasSeparateMesh) {
            return true;
        }
        
        // Case 2: Piece is in wrong slot (moved to incorrect position)
        // Only auto-recover if it's been in wrong slot for a while
        if (isInWrongSlot) {
            // For now, let's be conservative and not auto-recover wrong slots
            // This prevents the puzzle from "solving itself"
            return false;
        }
        
        // Case 3: Piece has separate mesh but is not visible or not in scene
        if (hasSeparateMesh && piece.mesh) {
            const isVisible = piece.mesh.visible;
            const isInScene = this.scene.children.includes(piece.mesh);
            if (!isVisible || !isInScene) {
                return true;
            }
        }
        
        // Case 4: Piece appears to be in correct position but is not responding to hit detection
        // This handles "ghost" pieces that are solved but not detectable
        if (piece.state === 'solved' && piece.isInSlot && slot.isCorrect) {
            // Check if the piece is actually visible and in the scene
            const connectedMesh = this.connectedMesh;
            if (connectedMesh && connectedMesh.visible) {
                // Piece should be detectable - if it's not, it might be in a ghost state
                // We'll let the hit detection system handle this case
                return false;
            }
        }
        
        return false;
    }
    
    // Reset a piece back to its connected state
    resetPieceToConnected(pieceIndex) {
        const piece = this.pieces[pieceIndex];
        const slot = this.slots[pieceIndex];
                
        // Remove separate mesh if it exists
        if (piece.mesh) {
            this.removeSeparatePiece(pieceIndex);
        }
        
        // Reset piece state to solved
        piece.state = 'solved';
        piece.slotState = 'filled';
        piece.isInSlot = true;
        piece.offset = { x: 0, y: 0 };
        piece.zIndex = 0;
        
        // Reset slot state
        slot.state = 'filled';
        slot.pieceId = pieceIndex;
        slot.isCorrect = true;
        
        // Update array system to match
        
        // Update connected mesh visibility
        this.updateConnectedMeshVisibility();        
    }
    
    // Create a single mesh that contains all connected Voronoi pieces
    createConnectedMesh() {
        if (!this.voronoiPolygons.length || !this.backgroundTexture) return;
        
        // Create combined geometry for all pieces
        const combinedGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const uvs = [];
        const indices = [];
        
        let vertexOffset = 0;
        
        for (let pieceIndex = 0; pieceIndex < this.voronoiPolygons.length; pieceIndex++) {
            const polygon = this.voronoiPolygons[pieceIndex];
            if (!polygon || polygon.length < 3) continue;
            
            // Triangulate the polygon (simple fan triangulation)
            const centerX = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
            const centerY = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
            
            // Add center vertex
            vertices.push(centerX, centerY, 0);
            const centerUV = this.calculateBackgroundUV(centerX, centerY);
            uvs.push(centerUV.u, centerUV.v);
            
            // Add polygon vertices
            for (let i = 0; i < polygon.length; i++) {
                vertices.push(polygon[i][0], polygon[i][1], 0);
                const vertexUV = this.calculateBackgroundUV(polygon[i][0], polygon[i][1]);
                uvs.push(vertexUV.u, vertexUV.v);
            }
            
            // Create triangles (fan from center)
            for (let i = 0; i < polygon.length; i++) {
                const next = (i + 1) % polygon.length;
                indices.push(
                    vertexOffset, // center
                    vertexOffset + 1 + i, // current vertex
                    vertexOffset + 1 + next // next vertex
                );
            }
            
            vertexOffset += polygon.length + 1; // +1 for center vertex
        }
        
        // Set geometry attributes
        combinedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        combinedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        combinedGeometry.setIndex(indices);
        
        // Create colors array for state-based visibility
        const colors = [];
        let colorVertexIndex = 0;
        
        for (let pieceIndex = 0; pieceIndex < this.voronoiPolygons.length; pieceIndex++) {
            const polygon = this.voronoiPolygons[pieceIndex];
            if (!polygon || polygon.length < 3) continue;
            
            // Determine if this slot should show the background image
            const showBackground = this.slots[pieceIndex].state === 'filled';
            const alpha = showBackground ? 1.0 : 0.0; // Fully transparent if empty slot
            
            // Add center vertex color
            colors.push(1, 1, 1, alpha); // White with variable alpha
            colorVertexIndex++;
            
            // Add polygon vertex colors
            for (let i = 0; i < polygon.length; i++) {
                colors.push(1, 1, 1, alpha); // White with variable alpha
                colorVertexIndex++;
            }
        }
        
        // Set color attribute
        combinedGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
        
        // Create material with background texture and vertex colors
        const material = new THREE.MeshBasicMaterial({
            map: this.backgroundTexture,
            transparent: true,
            opacity: 1.0,
            side: THREE.DoubleSide,
            vertexColors: true // Enable per-vertex colors for state-based visibility
        });
        
        // Remove old mesh if it exists
        if (this.connectedMesh) {
            this.scene.remove(this.connectedMesh);
            this.connectedMesh.geometry.dispose();
            this.connectedMesh.material.dispose();
        }
        
        // Remove old outline if it exists
        if (this.connectedOutline) {
            this.scene.remove(this.connectedOutline);
            this.connectedOutline.geometry.dispose();
            this.connectedOutline.material.dispose();
        }
        
        // Create and add new mesh
        this.connectedMesh = new THREE.Mesh(combinedGeometry, material);
        this.connectedMesh.position.z = 0; // Base layer
        this.scene.add(this.connectedMesh);
        
        // Create outline mesh
        this.createConnectedOutline(combinedGeometry);        
    }
    
    // Create outline for connected mesh using only piece boundaries
    createConnectedOutline(geometry) {
        // Create custom boundary geometry instead of wireframe
        const boundaryGeometry = this.createBoundaryGeometry();
        
        // Create outline material
        const outlineMaterial = new THREE.LineBasicMaterial({
            color: this.getThemeColor('outlineNormal'),
            transparent: true,
            opacity: 0.6, // Slightly more transparent to match 2D version
            linewidth: 1
        });
        
        // Create outline mesh
        this.connectedOutline = new THREE.LineSegments(boundaryGeometry, outlineMaterial);
        this.connectedOutline.position.z = 0.1; // Slightly above the main mesh
        this.connectedOutline.visible = this.showGridOutlines; // Control visibility
        this.scene.add(this.connectedOutline);
    }
    
    // Create geometry that only shows piece boundaries (not internal triangulation)
    createBoundaryGeometry() {
        const vertices = [];
        const edges = new Set(); // Track unique edges to avoid duplicates
        
        for (let pieceIndex = 0; pieceIndex < this.voronoiPolygons.length; pieceIndex++) {
            const polygon = this.voronoiPolygons[pieceIndex];
            if (!polygon || polygon.length < 3) continue;
            
            // Skip pieces that have been moved (they're separate meshes now)
            // Array backup removed - using object system only
            if (this.pieces[pieceIndex].mesh) continue;
            
            // Create lines for each edge of the polygon
            for (let i = 0; i < polygon.length; i++) {
                const current = polygon[i];
                const next = polygon[(i + 1) % polygon.length];
                
                // Create edge key to avoid duplicates (shared edges between pieces)
                const edgeKey = `${Math.min(current[0], next[0])},${Math.min(current[1], next[1])}-${Math.max(current[0], next[0])},${Math.max(current[1], next[1])}`;
                
                if (!edges.has(edgeKey)) {
                    edges.add(edgeKey);
                    // Add line segment
                    vertices.push(current[0], current[1], 0);
                    vertices.push(next[0], next[1], 0);
                }
            }
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        return geometry;
    }
    
    // Create boundary geometry for a single polygon (for hover effects)
    createBoundaryGeometryForPolygon(polygon, scale = 1.0) {
        const vertices = [];
        
        if (!polygon || polygon.length < 3) {
            return new THREE.BufferGeometry();
        }
        
        // Calculate the center of the polygon for scaling
        const centerX = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
        const centerY = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
        
        // Create lines for each edge of the polygon with scaling
        for (let i = 0; i < polygon.length; i++) {
            const current = polygon[i];
            const next = polygon[(i + 1) % polygon.length];
            
            // Scale vertices from center
            const scaledCurrentX = centerX + (current[0] - centerX) * scale;
            const scaledCurrentY = centerY + (current[1] - centerY) * scale;
            const scaledNextX = centerX + (next[0] - centerX) * scale;
            const scaledNextY = centerY + (next[1] - centerY) * scale;
            
            // Add scaled line segment
            vertices.push(scaledCurrentX, scaledCurrentY, 0);
            vertices.push(scaledNextX, scaledNextY, 0);
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        return geometry;
    }
    
    // Create boundary geometry for a Three.js geometry with scaling
    // This method extracts only the outer boundary edges, not internal triangulation
    createBoundaryGeometryForGeometry(geometry, scale = 1.0) {
        const vertices = [];
        
        if (!geometry || !geometry.attributes.position) {
            return new THREE.BufferGeometry();
        }
        
        const positions = geometry.attributes.position.array;
        const indices = geometry.index ? geometry.index.array : null;
        
        // Use EdgesGeometry to get only the boundary edges, then scale them
        const edgesGeometry = new THREE.EdgesGeometry(geometry, 1); // Low threshold for all edges
        const edgePositions = edgesGeometry.attributes.position.array;
        
        // Calculate the center of the geometry for scaling
        let centerX = 0, centerY = 0, vertexCount = 0;
        for (let i = 0; i < edgePositions.length; i += 3) {
            centerX += edgePositions[i];
            centerY += edgePositions[i + 1];
            vertexCount++;
        }
        centerX /= vertexCount;
        centerY /= vertexCount;
        
        // Create scaled boundary edges
        for (let i = 0; i < edgePositions.length; i += 6) { // 2 vertices per edge
            if (i + 5 >= edgePositions.length) break;
            
            const x1 = edgePositions[i];
            const y1 = edgePositions[i + 1];
            const z1 = edgePositions[i + 2];
            const x2 = edgePositions[i + 3];
            const y2 = edgePositions[i + 4];
            const z2 = edgePositions[i + 5];
            
            // Scale vertices from center
            const scaledX1 = centerX + (x1 - centerX) * scale;
            const scaledY1 = centerY + (y1 - centerY) * scale;
            const scaledX2 = centerX + (x2 - centerX) * scale;
            const scaledY2 = centerY + (y2 - centerY) * scale;
            
            // Add scaled edge
            vertices.push(scaledX1, scaledY1, z1);
            vertices.push(scaledX2, scaledY2, z2);
        }
        
        const boundaryGeometry = new THREE.BufferGeometry();
        boundaryGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        return boundaryGeometry;
    }
    
    updatePiecePosition(index, offset) {
        // Update object system
        this.pieces[index].offset = offset;
        
        // Calculate distance from origin
        const distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y);
        
        // NEW: Auto-snap when piece gets close to its slot
        if (distance <= WEBGL_SNAP_THRESHOLD && this.pieces[index].state === 'unsolved') {
            // Piece is close to its slot - trigger auto-snap
            // Add a small delay to prevent rapid cycling
            if (!this.pieces[index].autoSnapTimeout) {
                this.pieces[index].autoSnapTimeout = setTimeout(() => {
                    this.autoSnapPieceToSlot(index);
                    this.pieces[index].autoSnapTimeout = null;
                }, 100); // 100ms delay to prevent rapid cycling
            }
            return; // Exit early to prevent further processing
        }
        
        // If piece has significant offset, create separate mesh
        if (distance > WEBGL_SNAP_THRESHOLD) { // Increased threshold to prevent rapid cycling
            // Piece is being moved out - update states (ARRAY SYSTEM)
            
            // NEW: Update object system
            this.pieces[index].state = 'unsolved';
            this.pieces[index].slotState = 'empty';
            this.pieces[index].isInSlot = false;
            
            // Update corresponding slot
            this.slots[index].state = 'empty';
            this.slots[index].pieceId = null;
            this.slots[index].isCorrect = false;

            // Create separate piece if it doesn't exist, or update position if it does
            if (!this.pieces[index].mesh) {
                this.createSeparatePiece(index, offset);
            } else {
                // Update existing mesh position
                this.updateSeparatePiecePosition(index, offset);
            }
            this.updateConnectedMeshVisibility(); // Update slot visibility
        } else {
            // Piece snapped back - update states (ARRAY SYSTEM)
            
            // NEW: Update object system
            this.pieces[index].state = 'solved';
            this.pieces[index].slotState = 'filled';
            this.pieces[index].isInSlot = true;
            
            // Update corresponding slot
            this.slots[index].state = 'filled';
            this.slots[index].pieceId = index;
            this.slots[index].isCorrect = true;
            
            this.removeSeparatePiece(index);
            this.updateConnectedMeshVisibility(); // Update slot visibility
        }
        
        
        // Check if puzzle is solved after position update
        this.checkSolvedState();
    }
    
    // Separate mesh position = offset only (geometry is absolute — see drag-offset.js).
    updateSeparatePiecePosition(index, offset) {
        const piece = this.pieces[index];
        if (!piece.mesh) return;

        const position = getSeparatePieceMeshPosition(offset);
        piece.mesh.position.x = position.x;
        piece.mesh.position.y = position.y;
        
        // Update outline position if it exists
        if (piece.outline) {
            piece.outline.position.copy(piece.mesh.position);
            piece.outline.position.z += 0.1; // Slightly above the piece
        }
        
        // Update glow outline position if it exists
        if (piece.glowOutline) {
            piece.glowOutline.forEach(glowLayer => {
                if (glowLayer) {
                    glowLayer.position.copy(piece.mesh.position);
                }
            });
        }
    }
    
    // Auto-snap a piece to its slot
    autoSnapPieceToSlot(pieceIndex) {
        const piece = this.pieces[pieceIndex];
        const slot = this.slots[pieceIndex];
                
        // Play snap sound
        if (window.voronoiPuzzle && window.voronoiPuzzle.playSnapSound) {
            window.voronoiPuzzle.playSnapSound();
        }
        
        // Remove any separate mesh if it exists
        if (piece.mesh) {
            this.removeSeparatePiece(pieceIndex);
        }
        
        // Reset piece to connected state
        piece.state = 'solved';
        piece.slotState = 'filled';
        piece.isInSlot = true;
        piece.offset = { x: 0, y: 0 };
        piece.zIndex = 0;
        
        // Reset slot state
        slot.state = 'filled';
        slot.pieceId = pieceIndex;
        slot.isCorrect = true;
        
        // Update array system to match
        
        // Update connected mesh visibility
        this.updateConnectedMeshVisibility();
    }   
    
    updatePieceZIndex(index, zIndex) {
        // ARRAY SYSTEM
        this.pieceZIndices[index] = zIndex;
        
        // NEW: Update object system
        this.pieces[index].zIndex = zIndex;
        
        // If there's a separate piece for this index, update its z-position
        // Array backup removed - using object system only
        const separatePiece = this.pieces[index].mesh;
        if (separatePiece) {
            separatePiece.position.z = zIndex * 10;
        }
        
        // Note: Connected pieces use render order for z-index, handled in render()
    }
    
    // Set dragging state for glow timing
    setDraggingState(isDragging, pieceIndex = -1) {
        this.isDragging = isDragging;
        this.draggedPieceIndex = pieceIndex;
    }
    
    // Update visual state of a piece (hover, dragging, snapped, normal)
    updatePieceVisualState(index, state) {
        // Use object system for piece and outline access
        const pieceObj = this.pieces[index];
        // Use object system only (array backup removed)
        const separatePiece = pieceObj.mesh;
        const separateOutline = pieceObj.outline;
        
        if (separatePiece && separateOutline) {
            const pieceState = pieceObj.state || 'solved';
            this.updateMaterialState(separatePiece.material, state, pieceState);
            this.updateOutlineState(separateOutline.material, state);
            this.updatePieceScale(separatePiece, state);
            
            // Control outline visibility based on state
            if (state === 'hover' || state === 'dragging') {
                separateOutline.visible = true;
            } else {
                separateOutline.visible = false; // Hide outline for normal state
            }
            
            // Control neon glow visibility based on state (use object system)
            const neonGlow = pieceObj ? pieceObj.glowOutline : this.separateGlowOutlines[index];
            if (neonGlow) {
                const showGlow = state === 'dragging';
                neonGlow.forEach((glowLayer, layerIndex) => {
                    if (glowLayer) {
                        glowLayer.visible = showGlow;
                    }
                });
            } else {
                console.log(`❌ No neon glow found for piece ${index}`);
            }
        }
        
        // Also update connected pieces for hover effects
        if (state === 'hover' && !separatePiece) {
            this.updateConnectedPieceHover(index, true);
        } else if (state === 'normal' && !separatePiece) {
            this.updateConnectedPieceHover(index, false);
        }
        
        // For separate pieces, the hover effect is handled by the outline and material changes above
        // The separate piece outline should be visible and properly styled for hover effects
    }
    
    /**
     * Material state for separate pieces. Unsolved pieces must keep backgroundTexture
     * on material.map in every state — see piece-material.js. Do not strip map for drag glow.
     */
    updateMaterialState(material, state, pieceState = 'solved') {
        if (!material.originalColor) {
            material.originalColor = material.color.clone();
            material.originalOpacity = material.opacity;
        }

        const isUnsolvedSeparate = pieceState === 'unsolved';

        switch (state) {
            case 'hover':
                if (isUnsolvedSeparate) {
                    ensureUnsolvedPieceBackground(material, this.backgroundTexture);
                } else {
                    material.color.copy(material.originalColor);
                    material.opacity = material.originalOpacity || 1.0;
                }
                break;
            case 'dragging':
                if (isUnsolvedSeparate) {
                    ensureUnsolvedPieceBackground(material, this.backgroundTexture);
                    material.color.setHex(this.getThemeColor('pieceDragging'));
                    material.opacity = this.getThemeEffect('opacityDragging', 0.9);
                } else if (material.map) {
                    material.originalMap = material.map;
                    material.map = null;
                    material.color.setHex(this.getThemeColor('pieceDragging'));
                    material.opacity = this.getThemeEffect('opacityDragging', 0.9);
                }
                break;
            case 'snapped':
                material.color.setHex(this.getThemeColor('pieceSnapped'));
                material.opacity = 1.0;
                break;
            case 'normal':
            default:
                if (isUnsolvedSeparate) {
                    ensureUnsolvedPieceBackground(material, this.backgroundTexture);
                } else {
                    material.color.copy(material.originalColor);
                    material.opacity = material.originalOpacity || 1.0;

                    if (material.originalMap) {
                        material.map = material.originalMap;
                        material.originalMap = null;
                    }
                }
                break;
        }
    }
    
    // Create neon glow outline for a polygon with multiple layers for realistic glow effect
    createNeonGlowOutlineForPolygon(polygon, position, visible = true) {
        const glowLayers = [];
        const glowColor = this.getThemeColor('pieceDragging');

        GLOW_LAYER_CONFIGS.forEach((config) => {
            const glowGeometry = this.createBoundaryGeometryForPolygon(polygon, config.scale);

            const glowMaterial = new THREE.LineBasicMaterial({
                color: glowColor,
                transparent: true,
                opacity: config.opacity,
                linewidth: 1,
            });

            const glowOutline = new THREE.LineSegments(glowGeometry, glowMaterial);
            glowOutline.position.copy(position);
            glowOutline.position.z += config.zOffset;
            glowOutline.visible = visible;

            glowLayers.push(glowOutline);
            this.scene.add(glowOutline);
        });

        return glowLayers;
    }
    
    // Create neon glow outline with multiple layers for realistic glow effect
    createNeonGlowOutline(geometry, position, visible = true) {
        const glowLayers = [];

        // Create multi-layered glow effect similar to CSS box-shadow
        // Multiple layers with different opacities and scales for realistic glow
        const glowColor = this.getThemeColor('pieceDragging');
        const glowConfigs = [
            // Inner glow layers (closest to piece) - bright and tight
            { scale: 1.0, opacity: 1.0, color: glowColor, zOffset: 0.01 },
            { scale: 1.01, opacity: 0.8, color: glowColor, zOffset: 0.02 },
            { scale: 1.02, opacity: 0.6, color: glowColor, zOffset: 0.03 },
            { scale: 1.04, opacity: 0.4, color: glowColor, zOffset: 0.04 },
            // Middle glow layers - medium spread
            { scale: 1.06, opacity: 0.3, color: glowColor, zOffset: 0.05 },
            { scale: 1.08, opacity: 0.25, color: glowColor, zOffset: 0.06 },
            { scale: 1.10, opacity: 0.2, color: glowColor, zOffset: 0.07 },
            // Outer glow layers (further from piece) - soft and wide
            { scale: 1.12, opacity: 0.15, color: glowColor, zOffset: 0.08 },
            { scale: 1.15, opacity: 0.1, color: glowColor, zOffset: 0.09 },
            { scale: 1.18, opacity: 0.05, color: glowColor, zOffset: 0.10 },
        ];
        
        glowConfigs.forEach((config, index) => {
            // Create boundary geometry for this glow layer using only the piece outline
            const glowGeometry = this.createBoundaryGeometryForGeometry(geometry, config.scale);
            
            const glowMaterial = new THREE.LineBasicMaterial({
                color: config.color,
                transparent: true,
                opacity: config.opacity,
                linewidth: 1
            });
            
            const glowOutline = new THREE.LineSegments(glowGeometry, glowMaterial);
            
            // Position the glow outline at the same position as the piece
            glowOutline.position.copy(position);
            glowOutline.position.z += config.zOffset; // Layer the glow effects
            glowOutline.visible = visible;

            glowLayers.push(glowOutline);
            this.scene.add(glowOutline);
        });
        
        return glowLayers;
    }
    
    // Update neon glow outline geometry to match animation for polygon-based glow
    updateNeonGlowOutlineForPolygon(glowLayers, polygon, position) {
        if (!glowLayers || glowLayers.length === 0) return;

        glowLayers.forEach((glowOutline, index) => {
            if (index >= GLOW_LAYER_CONFIGS.length) return;

            const config = GLOW_LAYER_CONFIGS[index];
            const newBoundaryGeometry = this.createBoundaryGeometryForPolygon(polygon, config.scale);

            glowOutline.geometry.dispose();
            glowOutline.geometry = newBoundaryGeometry;

            glowOutline.position.x = position.x;
            glowOutline.position.y = position.y;
            glowOutline.position.z = position.z + config.zOffset;
        });
    }
    
    // Update neon glow outline geometry to match animation
    updateNeonGlowOutline(glowLayers, geometry, position) {
        if (!glowLayers || glowLayers.length === 0) return;

        // Define the same glow configs as in createNeonGlowOutline
        const glowConfigs = [
            { scale: 1.0, opacity: 1.0, zOffset: 0.01 },
            { scale: 1.01, opacity: 0.8, zOffset: 0.02 },
            { scale: 1.02, opacity: 0.6, zOffset: 0.03 },
            { scale: 1.04, opacity: 0.4, zOffset: 0.04 },
            { scale: 1.06, opacity: 0.3, zOffset: 0.05 },
            { scale: 1.08, opacity: 0.25, zOffset: 0.06 },
            { scale: 1.10, opacity: 0.2, zOffset: 0.07 },
            { scale: 1.12, opacity: 0.15, zOffset: 0.08 },
            { scale: 1.15, opacity: 0.1, zOffset: 0.09 },
            { scale: 1.18, opacity: 0.05, zOffset: 0.10 },
        ];
        
        glowLayers.forEach((glowOutline, index) => {
            if (index < glowConfigs.length) {
                const config = glowConfigs[index];
                
                // Create new boundary geometry with proper scaling
                const newBoundaryGeometry = this.createBoundaryGeometryForGeometry(geometry, config.scale);
                
                // Update geometry
                glowOutline.geometry.dispose();
                glowOutline.geometry = newBoundaryGeometry;
                
                // Update position - use same coordinate system as piece
                // The position parameter should match the piece's mesh position
                glowOutline.position.x = position.x;
                glowOutline.position.y = position.y;
                glowOutline.position.z = position.z + config.zOffset;
            }
        });
    }
    
    // Remove neon glow outline layers
    removeNeonGlowOutline(glowLayers) {
        if (!glowLayers) return;
        
        console.log(`🗑️ Removing ${glowLayers.length} glow layers`);
        
        glowLayers.forEach(glowOutline => {
            if (glowOutline) {
                this.scene.remove(glowOutline);
                glowOutline.geometry.dispose();
                glowOutline.material.dispose();
            }
        });
    }
    
    // Update outline properties for piece borders
    updateOutlineState(material, state) {
        switch (state) {
            case 'hover':
                material.color.setHex(this.getThemeColor('outlineHover'));
                material.opacity = OUTLINE_OPACITY.hover;
                break;
            case 'dragging':
                material.color.setHex(this.getThemeColor('outlineDragging'));
                material.opacity = OUTLINE_OPACITY.dragging;
                break;
            case 'snapped':
                material.color.setHex(this.getThemeColor('outlineSnapped'));
                material.opacity = OUTLINE_OPACITY.snapped;
                break;
            case 'normal':
            default:
                material.color.setHex(this.getThemeColor('outlineNormal'));
                material.opacity = OUTLINE_OPACITY.normal;
                break;
        }
    }
    
    // Update piece scale with smooth animation
    updatePieceScale(piece, state) {
        // Remove any existing scale animation
        if (piece.scaleAnimation) {
            clearInterval(piece.scaleAnimation);
            piece.scaleAnimation = null;
        }
        
        // Set scale to 1.0 for all states (no visual scaling)
        piece.scale.set(1.0, 1.0, 1);
    }
    
    // Update hover effect for connected pieces
    updateConnectedPieceHover(index, isHovered) {
        
        // Remove existing hover overlay
        if (this.hoverOverlay) {
            this.scene.remove(this.hoverOverlay);
            this.hoverOverlay.geometry.dispose();
            this.hoverOverlay.material.dispose();
            this.hoverOverlay = null;
        }
        
        if (isHovered && this.voronoiPolygons[index]) {
            // Track which piece is hovered
            this.hoveredPieceIndex = index;
            
            // Create hover overlay for the specific piece
            const polygon = this.voronoiPolygons[index];
            
            // Create animated polygon for current time
            const animatedPolygon = this.createAnimatedPath(polygon, this.animationTime);
            
            // Create shape geometry
            const shape = new THREE.Shape();
            shape.moveTo(animatedPolygon[0][0], animatedPolygon[0][1]);
            for (let i = 1; i < animatedPolygon.length; i++) {
                shape.lineTo(animatedPolygon[i][0], animatedPolygon[i][1]);
            }
            
            // Create proper boundary geometry for hover outline
            const hoverGeometry = this.createBoundaryGeometryForPolygon(animatedPolygon);
            
            // Create hover outline material
            const hoverMaterial = new THREE.LineBasicMaterial({
                color: this.getThemeColor('outlineHover'),
                transparent: true,
                opacity: 0.8,
                linewidth: 3
            });
            
            // Create hover outline mesh
            this.hoverOverlay = new THREE.LineSegments(hoverGeometry, hoverMaterial);
            this.hoverOverlay.position.z = 0.05; // Slightly above the connected mesh
            this.scene.add(this.hoverOverlay);
        } else {
            // Clear hovered piece index
            this.hoveredPieceIndex = undefined;
        }
    }
    
    // Update hover effect for empty slots
    updateSlotHover(index, isHovered, isDragHover = false) {
        
        // Remove existing slot hover overlay
        if (this.slotHoverOverlay) {
            this.scene.remove(this.slotHoverOverlay);
            this.slotHoverOverlay.geometry.dispose();
            this.slotHoverOverlay.material.dispose();
            this.slotHoverOverlay = null;
        }
        
        if (isHovered && this.voronoiPolygons[index]) {
            // Track which slot is hovered
            this.hoveredSlotIndex = index;
            
            // Create slot hover overlay for the specific slot
            const polygon = this.voronoiPolygons[index];
            
            // Create animated polygon for current time
            const animatedPolygon = this.createAnimatedPath(polygon, this.animationTime);
            
            // Create shape geometry
            const shape = new THREE.Shape();
            shape.moveTo(animatedPolygon[0][0], animatedPolygon[0][1]);
            for (let i = 1; i < animatedPolygon.length; i++) {
                shape.lineTo(animatedPolygon[i][0], animatedPolygon[i][1]);
            }
            
            if (isDragHover) {
                // During drag hover - show filled background
                const slotHoverGeometry = new THREE.ShapeGeometry(shape);
                
                const slotHoverMaterial = new THREE.MeshBasicMaterial({
                    color: this.getThemeColor('slotHover'), // Theme slot hover color
                    transparent: true,
                    opacity: 0.3, // Subtle background fill
                    side: THREE.DoubleSide
                });
                
                this.slotHoverOverlay = new THREE.Mesh(slotHoverGeometry, slotHoverMaterial);
            } else {
                // During normal hover - show only clean outline using EdgesGeometry
                const slotHoverGeometry = new THREE.EdgesGeometry(new THREE.ShapeGeometry(shape), 1);
                
                const slotHoverMaterial = new THREE.LineBasicMaterial({
                    color: this.getThemeColor('slotOutline'), // Theme slot outline color
                    transparent: true,
                    opacity: 0.6, // More visible for outline
                    linewidth: 2
                });
                
                this.slotHoverOverlay = new THREE.LineSegments(slotHoverGeometry, slotHoverMaterial);
            }
            
            this.slotHoverOverlay.position.z = 0.03; // Just above the connected mesh
            this.scene.add(this.slotHoverOverlay);
        } else {
            // Clear hovered slot index
            this.hoveredSlotIndex = undefined;
        }
    }
    
    // Update hover overlay geometry to match animation
    updateHoverOverlayGeometry(index, time) {
        if (!this.hoverOverlay || !this.voronoiPolygons[index]) return;
        
        const polygon = this.voronoiPolygons[index];
        const animatedPolygon = this.createAnimatedPath(polygon, time);
        
        // Create new boundary geometry
        const newGeometry = this.createBoundaryGeometryForPolygon(animatedPolygon);
        
        // Replace geometry
        this.hoverOverlay.geometry.dispose();
        this.hoverOverlay.geometry = newGeometry;
    }
    
    // Update slot hover overlay geometry to match animation
    updateSlotHoverOverlayGeometry(index, time) {
        if (!this.slotHoverOverlay || !this.voronoiPolygons[index]) return;
        
        const polygon = this.voronoiPolygons[index];
        const animatedPolygon = this.createAnimatedPath(polygon, time);
        
        // Create new shape geometry
        const shape = new THREE.Shape();
        shape.moveTo(animatedPolygon[0][0], animatedPolygon[0][1]);
        for (let i = 1; i < animatedPolygon.length; i++) {
            shape.lineTo(animatedPolygon[i][0], animatedPolygon[i][1]);
        }
        
        // Determine if this is a drag hover (filled) or normal hover (outline)
        const isDragHover = this.slotHoverOverlay.material instanceof THREE.MeshBasicMaterial;
        
        let newGeometry;
        if (isDragHover) {
            // For drag hover - use filled geometry
            newGeometry = new THREE.ShapeGeometry(shape);
        } else {
            // For normal hover - use outline geometry
            newGeometry = new THREE.EdgesGeometry(new THREE.ShapeGeometry(shape), 1);
        }
        
        // Replace geometry
        this.slotHoverOverlay.geometry.dispose();
        this.slotHoverOverlay.geometry = newGeometry;
    }
    
    // Update the visibility of pieces in the connected mesh based on slot states
    updateConnectedMeshVisibility() {
        if (!this.connectedMesh || !this.connectedMesh.geometry) return;
        
        const geometry = this.connectedMesh.geometry;
        const colors = geometry.attributes.color.array;
        
        let colorIndex = 0;
        
        for (let pieceIndex = 0; pieceIndex < this.voronoiPolygons.length; pieceIndex++) {
            const polygon = this.voronoiPolygons[pieceIndex];
            if (!polygon || polygon.length < 3) continue;
            
            // Determine if this slot should show the background image
            const showBackground = this.slots[pieceIndex].state === 'filled';
            const alpha = showBackground ? 1.0 : 0.0;
            
            // Update center vertex alpha
            colors[colorIndex * 4 + 3] = alpha; // Alpha channel
            colorIndex++;
            
            // Update polygon vertex alphas
            for (let i = 0; i < polygon.length; i++) {
                colors[colorIndex * 4 + 3] = alpha; // Alpha channel
                colorIndex++;
            }
        }
        
        // Mark colors as needing update
        geometry.attributes.color.needsUpdate = true;
    }
    
    /**
     * Creates a standalone mesh when a piece is dragged away from its slot.
     * Geometry vertices are absolute canvas coords; mesh.position = offset only.
     */
    createSeparatePiece(index, offset) {
        // Remove existing separate piece if any
        this.removeSeparatePiece(index);
        
        const polygon = this.voronoiPolygons[index];
        if (!polygon || polygon.length < 3) return;
        
        // Create geometry for this piece using ShapeGeometry (matches original rendering)
        const uvFn = (x, y) => this.calculateBackgroundUV(x, y);
        const geometry = buildSeparatePieceGeometry(polygon, uvFn);
        
        // Create material - only show background image if piece is unsolved
        const showBackground = this.pieces[index].state === 'unsolved';
        const material = new THREE.MeshBasicMaterial({
            map: showBackground ? this.backgroundTexture : null,
            color: 0xffffff, // Consistent white for proper color tinting
            transparent: true,
            opacity: showBackground ? 1.0 : 0.3, // Make pieces without texture semi-transparent
            side: THREE.DoubleSide
        });
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);

        const position = getSeparatePieceMeshPosition(offset);
        mesh.position.x = position.x;
        mesh.position.y = position.y;
        mesh.position.z = this.pieceZIndices[index] * 10;
        
        // Force bounding box computation for hit detection
        geometry.computeBoundingBox();
        mesh.updateMatrixWorld(true);
        
        // Create outline for separate piece using clean boundary geometry
        const boundaryGeometry = this.createBoundaryGeometryForPolygon(polygon);
        const outlineMaterial = new THREE.LineBasicMaterial({
            color: this.getThemeColor('outlineDragging'), // Theme outline for dragged pieces
            transparent: true,
            opacity: 0.8,
            linewidth: 2
        });
        
        const outline = new THREE.LineSegments(boundaryGeometry, outlineMaterial);
        outline.position.copy(mesh.position);
        outline.position.z += 0.1; // Slightly above the piece
        outline.visible = false; // Start hidden, only show on hover
        
        // Store and add to scene
        // Create neon glow outline - make it visible if this piece is currently being dragged
        const isDragging = this.isDragging && this.draggedPieceIndex === index;
        const neonGlow = this.createNeonGlowOutlineForPolygon(polygon, mesh.position, isDragging);
        
        // ARRAY SYSTEM
        // Store in object system only (array backup removed)
        this.separateGlowOutlines[index] = neonGlow;
        
        // NEW: Update object system
        this.pieces[index].mesh = mesh;
        this.pieces[index].outline = outline;
        this.pieces[index].glowOutline = neonGlow;
        this.scene.add(mesh);
        this.scene.add(outline);

        // Sync drag visuals when mesh is created mid-drag (activatePiece runs before mesh exists).
        if (this.isDragging && this.draggedPieceIndex === index) {
            this.updatePieceVisualState(index, 'dragging');
        }
    }
    
    removeSeparatePiece(index) {
        // Use object system only (array backup removed)
        const piece = this.pieces[index].mesh;
        const outline = this.pieces[index].outline;
        const neonGlow = this.separateGlowOutlines[index];
        const label = this.pieceLabels ? this.pieceLabels[index] : null;
        
        if (piece) {
            this.scene.remove(piece);
            piece.geometry.dispose();
            piece.material.dispose();
            // ARRAY SYSTEM
            // Array backup removed - using object system only
            // Update object system
            this.pieces[index].mesh = null;
        }
        
        if (outline) {
            this.scene.remove(outline);
            outline.geometry.dispose();
            outline.material.dispose();
            // ARRAY SYSTEM
            // Array backup removed - using object system only
            // Update object system
            this.pieces[index].outline = null;
        }
        
        if (neonGlow) {
            this.removeNeonGlowOutline(neonGlow);
            // ARRAY SYSTEM
            this.separateGlowOutlines[index] = null;
            // Update object system
            this.pieces[index].glowOutline = null;
        }
        
        if (label) {
            // Don't remove the label, just update its position to the connected piece center
            const polygon = this.voronoiPolygons[index];
            if (polygon && polygon.length > 0) {
                const x = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
                const y = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
                label.position.set(x, y, 5);
                label.visible = true;
                console.log(`🏷️ Updated label for connected piece ${index} at (${x.toFixed(1)}, ${y.toFixed(1)})`);
            }
        }
    }
    
    animatePieceBoundaries(time) {
        this.animationTime = time;
        
        // Update connected mesh geometry with animated boundaries
        if (this.connectedMesh && this.voronoiPolygons.length > 0) {
            this.updateConnectedMeshGeometry(time);
        }
        
        // NEW: Update separate pieces with animated boundaries using object system
        this.pieces.forEach((pieceObj, index) => {
            if (pieceObj && pieceObj.mesh && pieceObj.polygon) {
                this.updateSeparatePieceGeometry(pieceObj.mesh, index, time);
            }
        });
        
        // Update hover overlays to match animation
        if (this.hoverOverlay && this.hoveredPieceIndex !== undefined) {
            this.updateHoverOverlayGeometry(this.hoveredPieceIndex, time);
        }
        
        // Update slot hover overlay to match animation
        if (this.slotHoverOverlay && this.hoveredSlotIndex !== undefined) {
            this.updateSlotHoverOverlayGeometry(this.hoveredSlotIndex, time);
        }
    }
    
    // Create animated path using noise (similar to 2D version)
    createAnimatedPath(originalPolygon, time, amplitude = null) {
        const noiseAmplitude = amplitude !== null ? amplitude : this.config.noiseAmplitude;
        return createAnimatedPolygon(originalPolygon, time, noiseAmplitude);
    }
    
    // Update connected mesh geometry with animated boundaries
    updateConnectedMeshGeometry(time) {
        if (!this.connectedMesh) return;
        
        const geometry = this.connectedMesh.geometry;
        const positions = geometry.attributes.position.array;
        const uvs = geometry.attributes.uv.array;
        
        let vertexIndex = 0;
        
        for (let pieceIndex = 0; pieceIndex < this.voronoiPolygons.length; pieceIndex++) {
            const originalPolygon = this.voronoiPolygons[pieceIndex];
            if (!originalPolygon || originalPolygon.length < 3) continue;
            
            // Skip pieces that have been moved (they're separate meshes now)
            if (this.pieces[pieceIndex].mesh) {
                vertexIndex += originalPolygon.length + 1; // +1 for center vertex
                continue;
            }
            
            // Create animated polygon
            const animatedPolygon = this.createAnimatedPath(originalPolygon, time);
            
            // Calculate animated center
            const centerX = animatedPolygon.reduce((sum, p) => sum + p[0], 0) / animatedPolygon.length;
            const centerY = animatedPolygon.reduce((sum, p) => sum + p[1], 0) / animatedPolygon.length;
            
            // Update center vertex
            positions[vertexIndex * 3] = centerX;
            positions[vertexIndex * 3 + 1] = centerY;
                // Sync UV coordinates with animated positions for proper texture alignment
                const centerUV = this.calculateBackgroundUV(centerX, centerY);
                uvs[vertexIndex * 2] = centerUV.u;
                uvs[vertexIndex * 2 + 1] = centerUV.v;
            vertexIndex++;
            
            // Update polygon vertices
            for (let i = 0; i < animatedPolygon.length; i++) {
                positions[vertexIndex * 3] = animatedPolygon[i][0];
                positions[vertexIndex * 3 + 1] = animatedPolygon[i][1];
                // Sync UV coordinates with animated positions for proper texture alignment
                const vertexUV = this.calculateBackgroundUV(animatedPolygon[i][0], animatedPolygon[i][1]);
                uvs[vertexIndex * 2] = vertexUV.u;
                uvs[vertexIndex * 2 + 1] = vertexUV.v;
                vertexIndex++;
            }
        }
        
        // Mark geometry as needing update
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.uv.needsUpdate = true;
    }
    
    // Update separate piece geometry with animated boundaries
    updateSeparatePieceGeometry(piece, index, time) {
        const pieceObj = this.pieces[index];
        const originalPolygon = pieceObj ? pieceObj.polygon : this.voronoiPolygons[index];
        if (!originalPolygon) return;

        const animatedPolygon = this.createAnimatedPath(originalPolygon, time);
        const uvFn = (x, y) => this.calculateBackgroundUV(x, y);
        const newGeometry = buildSeparatePieceGeometry(animatedPolygon, uvFn);

        piece.geometry.dispose();
        piece.geometry = newGeometry;

        const neonGlow = this.separateGlowOutlines[index];
        if (neonGlow) {
            this.updateNeonGlowOutlineForPolygon(neonGlow, animatedPolygon, piece.position);
        }
    }
    
    render() {
        // Update animation
        this.animatePieceBoundaries(Date.now());
        
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    dispose() {
        // Clean up resources
        
        // Clean up connected mesh
        if (this.connectedMesh) {
            this.scene.remove(this.connectedMesh);
            this.connectedMesh.geometry.dispose();
            this.connectedMesh.material.dispose();
            this.connectedMesh = null;
        }
        
        // Clean up connected outline
        if (this.connectedOutline) {
            this.scene.remove(this.connectedOutline);
            this.connectedOutline.geometry.dispose();
            this.connectedOutline.material.dispose();
            this.connectedOutline = null;
        }
        
        // Clean up separate pieces using object system
        this.pieces.forEach(piece => {
            if (piece.mesh) {
                this.scene.remove(piece.mesh);
                piece.mesh.geometry.dispose();
                piece.mesh.material.dispose();
                piece.mesh = null;
            }
        });
        
        // Clean up separate outlines using object system
        this.pieces.forEach(piece => {
            if (piece.outline) {
                this.scene.remove(piece.outline);
                piece.outline.geometry.dispose();
                piece.outline.material.dispose();
                piece.outline = null;
            }
        });
        
        // Clean up separate glow outlines
        this.separateGlowOutlines.forEach(glowLayers => {
            if (glowLayers) {
                this.removeNeonGlowOutline(glowLayers);
            }
        });
        this.separateGlowOutlines = [];
        
        if (this.backgroundTexture) {
            this.backgroundTexture.dispose();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Remove the WebGL canvas from DOM
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        console.log('✅ WebGL renderer disposed');
    }
    
    // Toggle grid outline visibility
    toggleGridOutlines() {
        this.showGridOutlines = !this.showGridOutlines;
        
        // Update connected outline visibility
        if (this.connectedOutline) {
            this.connectedOutline.visible = this.showGridOutlines;
        }
        
        // Update separate piece outline visibility using object system
        this.pieces.forEach(piece => {
            if (piece.outline) {
                piece.outline.visible = this.showGridOutlines;
            }
        });
        
        console.log(`🔗 Grid outlines: ${this.showGridOutlines ? 'ON' : 'OFF'}`);
        return this.showGridOutlines;
    }
    
    // Theme System Methods
    
    /**
     * Update theme - called by ThemeManager
     */
    updateTheme(theme) {
        console.log(`🎨 WebGL renderer updating to theme: ${theme.name}`);
        this.currentTheme = theme;
        
        // Update all existing materials
        this.updateAllMaterials();
        
        // Update outline colors
        this.updateOutlineColors();
        
        // Update background colors if needed
        this.updateBackgroundColors();
    }
    
    /**
     * Get color from current theme
     */
    getThemeColor(colorKey, fallback = 0x00DDFF) {
        if (!this.currentTheme || !this.currentTheme.colors[colorKey]) {
            return fallback;
        }
        return this.currentTheme.colors[colorKey].hex;
    }
    
    /**
     * Get effect value from current theme
     */
    getThemeEffect(effectKey, fallback = 1.0) {
        if (!this.currentTheme || !this.currentTheme.effects[effectKey]) {
            return fallback;
        }
        return this.currentTheme.effects[effectKey];
    }
    
    /**
     * Update all existing materials with new theme colors
     */
    updateAllMaterials() {
        
        // Update separate piece materials using object system
        if (!this.pieces || !Array.isArray(this.pieces)) {
            // This is expected during disposal/reinitialization, no need to warn
            return;
        }
        this.pieces.forEach((piece, index) => {
            if (piece.mesh && piece.mesh.material) {
                // Unsolved separate pieces must keep white + background map (piece-material.js).
                if (piece.state === 'unsolved') {
                    ensureUnsolvedPieceBackground(piece.mesh.material, this.backgroundTexture);
                    return;
                }

                const normalColor = this.getThemeColor('pieceNormal');
                piece.mesh.material.color.setHex(normalColor);
                piece.mesh.material.originalColor = piece.mesh.material.color.clone();
            }
        });
        
        // Update glow outlines
        this.separateGlowOutlines.forEach(glowLayers => {
            if (glowLayers) {
                glowLayers.forEach(glowLayer => {
                    if (glowLayer && glowLayer.material) {
                        const glowColor = this.getThemeColor('pieceDragging');
                        glowLayer.material.color.setHex(glowColor);
                    }
                });
            }
        });
    }
    
    /**
     * Update outline colors
     */
    updateOutlineColors() {
        // Update connected outline
        if (this.connectedOutline && this.connectedOutline.material) {
            const outlineColor = this.getThemeColor('outlineNormal');
            this.connectedOutline.material.color.setHex(outlineColor);
        }
        
        // Update separate outlines using object system
        if (!this.pieces || !Array.isArray(this.pieces)) {
            // This is expected during disposal/reinitialization, no need to warn
            return;
        }
        this.pieces.forEach(piece => {
            if (piece.outline && piece.outline.material) {
                const outlineColor = this.getThemeColor('outlineNormal');
                piece.outline.material.color.setHex(outlineColor);
            }
        });
    }
    
    /**
     * Update background/environment colors
     */
    updateBackgroundColors() {
        // Update WebGL clear color to match theme
        if (!this.renderer) {
            // This is expected during disposal/reinitialization, no need to warn
            return;
        }
        const bgColor = 0x111111;
        this.renderer.setClearColor(bgColor, 1.0);
    }
    
    // Helper method to find piece at screen coordinates
    findPieceAtPosition(x, y, skipDraggedPiece = false) {
        // Convert canvas coordinates to normalized device coordinates
        // Canvas: Y=0 at top, Y=height at bottom
        // WebGL: Y=-1 at bottom, Y=+1 at top
        const mouse = new THREE.Vector2(
            (x / this.canvas.width) * 2 - 1,
            -(y / this.canvas.height) * 2 + 1  // Y-flip needed - mouse coords are in screen coordinates
        );

        // Create raycaster with more generous settings
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        // Make raycaster more generous for better hit detection
        raycaster.params.Points.threshold = 10;
        raycaster.params.Line.threshold = 5;
        
        // Ensure raycaster has reasonable near/far planes for hit detection
        raycaster.near = 0.1;
        raycaster.far = 1000;
        
        // Use object system for hit detection
        // First check separate pieces (they have higher priority)
        // Sort by z-index (highest first) for proper hit detection
        const separatePieces = this.pieces
            .map((piece, index) => ({ piece: piece.mesh, index, pieceObj: piece }))
            .filter(({ piece }) => piece !== null)
            .sort((a, b) => {
                // Use object z-index, fallback to array
                const aZ = a.pieceObj.zIndex || this.pieceZIndices[a.index] || 0;
                const bZ = b.pieceObj.zIndex || this.pieceZIndices[b.index] || 0;
                
                // CRITICAL FIX: If z-indices are equal, use piece index as tiebreaker
                // This prevents random selection when pieces have same z-index
                if (aZ === bZ) {
                    return b.index - a.index; // Higher index first (more recently created)
                }
                
                return bZ - aZ; // Highest z-index first
            });
        
        // Try raycaster first for all separate pieces
        for (const { piece, index } of separatePieces) {
            // Skip the dragged piece if we're looking for slots during drag
            if (skipDraggedPiece && index === this.draggedPieceIndex) {
                continue;
            }
            
            // Ensure piece is valid and has proper geometry
            if (!piece || !piece.geometry) {
                continue;
            }
            
        // CRITICAL FIX: Ensure piece is in the scene
        if (!this.scene.children.includes(piece)) {
            this.scene.add(piece);
        }
        
        // Reposition for hit test: offset only — NOT positionManager.getMeshPosition()
        // (that adds seed coords and has caused off-screen / skin-disappear regressions).
        if (piece && piece.position) {
            const pieceObj = this.pieces[index];
            if (pieceObj && pieceObj.mesh === piece) {
                piece.visible = true;
                if (pieceObj.offset) {
                    const position = getSeparatePieceMeshPosition(pieceObj.offset);
                    piece.position.set(position.x, position.y, piece.position.z);
                }
            }
        }
            
            // Ensure piece visibility and fix any issues
            this.ensurePieceVisibility(index);
            
            try {
                const intersects = raycaster.intersectObject(piece);
                if (intersects.length > 0) {
                    return index;
                }
            } catch (error) {
                console.log('piece-states',`⚠️ Raycaster error for piece ${index}:`, error);
                console.log('hit-detection', `🖱️ INTERACTION DEBUG: Raycaster error for piece ${index}:`, error);
            }
        }
        
        // If raycaster failed for all pieces, try expanded hit detection
        for (const { piece, index } of separatePieces) {
            // Skip the dragged piece if we're looking for slots during drag
            if (skipDraggedPiece && index === this.draggedPieceIndex) {
                continue;
            }
            
            // Ensure piece is valid and has proper geometry
            if (!piece || !piece.geometry) {
                continue;
            }
            
            // Ensure piece visibility and fix any issues
            this.ensurePieceVisibility(index);
            
            // Try expanded hit detection with multiple offset positions
            const offsets = [
                { x: 0, y: 0 },      // Original position
                { x: -20, y: 0 },    // Left
                { x: 20, y: 0 },     // Right
                { x: 0, y: -20 },    // Up
                { x: 0, y: 20 },     // Down
                { x: -10, y: -10 },  // Top-left
                { x: 10, y: -10 },   // Top-right
                { x: -10, y: 10 },   // Bottom-left
                { x: 10, y: 10 }     // Bottom-right
            ];
            
            for (const offset of offsets) {
                const testX = x + offset.x;
                const testY = y + offset.y;
                
                // Convert test coordinates to NDC
                const testMouse = new THREE.Vector2(
                    (testX / this.canvas.width) * 2 - 1,
                    -((testY / this.canvas.height) * 2 - 1)
                );
                
                // Create new raycaster for this test position
                const testRaycaster = new THREE.Raycaster();
                testRaycaster.setFromCamera(testMouse, this.camera);
                testRaycaster.near = 0.1;
                testRaycaster.far = 1000;
                
                try {
                    const intersects = testRaycaster.intersectObject(piece);
                    if (intersects.length > 0) {
                        return index;
                    }
                } catch (error) {
                    // Continue to next offset
                }
            }
            
            // Final fallback: try both bounds and polygon checks
            if (this.isPointInPieceBounds(x, y, index) || this.isPointInPiecePolygon(x, y, index)) {
                return index;
            }
        }
        
        // Then check connected mesh
        if (this.connectedMesh) {
            const connectedIntersects = raycaster.intersectObject(this.connectedMesh);
            if (connectedIntersects.length > 0) {
                // Find which piece was hit based on the intersection point
                const intersectionPoint = connectedIntersects[0].point;
                const pieceIndex = this.findPieceIndexAtPoint(intersectionPoint.x, intersectionPoint.y);
                if (pieceIndex !== -1) {
                    // NEW: Use object system for slot state check
                    const slot = this.slots[pieceIndex];
                    const piece = this.pieces[pieceIndex];
                    
                    // Return piece if visible, or slot if empty (for slot hover)
                    if (slot && slot.state === 'filled') {
                        return pieceIndex;
                    } else {
                        return { type: 'slot', index: pieceIndex }; // Return slot info
                    }
                }
            }
        }
        
        // Check for and fix any lost pieces
        const fixedCount = this.checkAndFixLostPieces();
        if (fixedCount > 0) {
            console.log(`🔄 Retrying hit detection after fixing ${fixedCount} lost pieces...`);
            // Try one more time with the fixed pieces
            return this.findPieceAtPosition(x, y, skipDraggedPiece);
        }
        
        // NEW: Auto-recovery for unreachable pieces
        const recoveredCount = this.autoRecoverUnreachablePieces();
        if (recoveredCount > 0) {
            console.log(`🔄 Auto-recovered ${recoveredCount} unreachable pieces...`);
            // Try one more time with the recovered pieces
            return this.findPieceAtPosition(x, y, skipDraggedPiece);
        }

        // NEW: Check for state inconsistencies that could cause waterfall effect
        const inconsistentPieces = this.pieces.filter((piece, index) => {
            return piece.mesh !== null && !this.scene.children.includes(piece.mesh);
        });
        
        // NEW: Check for pieces that are in scene but not positioned correctly
        const mispositionedPieces = this.pieces.filter((piece, index) => {
            if (piece.mesh && this.scene.children.includes(piece.mesh)) {
                // Check if piece is positioned at origin (0,0,0) when it should be elsewhere
                const pos = piece.mesh.position;
                return pos.x === 0 && pos.y === 0 && piece.offset && (piece.offset.x !== 0 || piece.offset.y !== 0);
            }
            return false;
        });
        
        return -1;
    }
    
    // Helper to find which Voronoi piece contains a given point
    findPieceIndexAtPoint(x, y) {
        // NEW: Use object system for polygon checking
        for (let i = 0; i < this.pieces.length; i++) {
            const piece = this.pieces[i];
            if (piece && piece.polygon && VoronoiUtils.pointInPolygon(x, y, piece.polygon)) {
                return i;
            }
        }
        return -1;
    }
    
    // Fallback method to check if a point is within piece bounds
    isPointInPieceBounds(x, y, pieceIndex) {
        // NEW: Use object system for piece checking
        const pieceObj = this.pieces[pieceIndex];
        // Array backup removed - using object system only
        const piece = pieceObj.mesh;
        if (!piece || !piece.geometry) {
            return false;
        }
        
        // Get piece position and bounds
        const pieceX = piece.position.x;
        const pieceY = piece.position.y;
        
        // Get geometry bounds
        if (!piece.geometry.boundingBox) {
            piece.geometry.computeBoundingBox();
        }
        
        const bounds = piece.geometry.boundingBox;
        const width = bounds.max.x - bounds.min.x;
        const height = bounds.max.y - bounds.min.y;
        
        // Check if point is within piece bounds (with some tolerance)
        const tolerance = 30; // Increased tolerance for better hit detection
        const isWithinBounds = (
            x >= pieceX - width/2 - tolerance &&
            x <= pieceX + width/2 + tolerance &&
            y >= pieceY - height/2 - tolerance &&
            y <= pieceY + height/2 + tolerance
        );
        
        if (isWithinBounds) {
            console.log(`🔍 Bounds check for piece ${pieceIndex}: point (${x}, ${y}) within bounds of piece at (${pieceX.toFixed(1)}, ${pieceY.toFixed(1)})`);
        }
        
        return isWithinBounds;
    }
    
    // Enhanced method to check if a point is within a piece using Voronoi polygon
    isPointInPiecePolygon(x, y, pieceIndex) {
        // NEW: Use object system for piece and polygon checking
        const pieceObj = this.pieces[pieceIndex];
        // Array backup removed - using object system only
        const piece = pieceObj.mesh;
        const polygon = pieceObj ? pieceObj.polygon : this.voronoiPolygons[pieceIndex];
        if (!piece || !polygon) {
            return false;
        }
        
        // Get piece position
        const pieceX = piece.position.x;
        const pieceY = piece.position.y;
        
        // Transform point to piece's local coordinate system
        const localX = x - pieceX;
        const localY = y - pieceY;
        
        // Check if point is within the Voronoi polygon (use object system)
        const isInside = VoronoiUtils.pointInPolygon(localX, localY, polygon);
        
        if (isInside) {
            console.log(`🔍 Polygon check for piece ${pieceIndex}: point (${x}, ${y}) within polygon of piece at (${pieceX.toFixed(1)}, ${pieceY.toFixed(1)})`);
        }
        
        return isInside;
    }
    
    // Method to ensure a piece is properly positioned and visible
    ensurePieceVisibility(pieceIndex) {
        // NEW: Use object system for piece checking
        const pieceObj = this.pieces[pieceIndex];
        // Array backup removed - using object system only
        const piece = pieceObj.mesh;
        if (!piece) {
            return false;
        }
        
        // Ensure piece is visible
        if (!piece.visible) {
            piece.visible = true;
            console.log(`👁️ Made piece ${pieceIndex} visible`);
        }
        
        // Ensure piece has proper z-index (use object system)
        const zIndex = pieceObj ? pieceObj.zIndex : this.pieceZIndices[pieceIndex];
        if (zIndex === undefined || zIndex < 0) {
            const newZIndex = 0;
            if (pieceObj) {
                pieceObj.zIndex = newZIndex;
            }
            this.pieceZIndices[pieceIndex] = newZIndex;
            console.log(`📐 Reset z-index for piece ${pieceIndex} to 0`);
        }
        
        // Ensure piece is in the scene
        if (!this.scene.children.includes(piece)) {
            this.scene.add(piece);
            console.log(`➕ Added piece ${pieceIndex} back to scene`);
        }
        
        // Ensure piece has proper geometry
        if (!piece.geometry || !piece.geometry.attributes.position) {
            this.recreatePieceGeometry(pieceIndex);
        }
        
        return true;
    }
    
    // Method to recreate piece geometry if it's corrupted
    recreatePieceGeometry(pieceIndex) {
        // Array backup removed - using object system only
        const piece = this.pieces[pieceIndex].mesh;
        if (!piece || !this.voronoiPolygons[pieceIndex]) {
            return false;
        }
        
        try {
            // Create new geometry for this piece
            const polygon = this.voronoiPolygons[pieceIndex];
            const geometry = new THREE.BufferGeometry();
            
            // Triangulate the polygon
            const vertices = [];
            const uvs = [];
            const indices = [];
            
            // Simple fan triangulation from center
            const centerX = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
            const centerY = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
            
            // Add center vertex
            vertices.push(centerX, centerY, 0);
            const centerUV = this.calculateBackgroundUV(centerX, centerY);
            uvs.push(centerUV.u, centerUV.v);
            
            // Add polygon vertices
            for (let i = 0; i < polygon.length; i++) {
                vertices.push(polygon[i][0], polygon[i][1], 0);
                const vertexUV = this.calculateBackgroundUV(polygon[i][0], polygon[i][1]);
                uvs.push(vertexUV.u, vertexUV.v);
            }
            
            // Create triangles
            for (let i = 0; i < polygon.length; i++) {
                const next = (i + 1) % polygon.length;
                indices.push(0, i + 1, next + 1);
            }
            
            // Set geometry attributes
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            geometry.setIndex(indices);
            
            // Create material
            const material = new THREE.MeshBasicMaterial({
                map: this.backgroundTexture,
                transparent: true,
                opacity: 1.0,
                side: THREE.DoubleSide
            });
            
            // Update piece geometry and material
            piece.geometry = geometry;
            piece.material = material;
            
            console.log(`🔧 Recreated geometry for piece ${pieceIndex}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to recreate geometry for piece ${pieceIndex}:`, error);
            return false;
        }
    }
    
    // Method to check and fix any lost pieces (using object system)
    checkAndFixLostPieces() {
        let fixedCount = 0;
        
        for (let i = 0; i < this.pieces.length; i++) {
            const pieceObj = this.pieces[i];
            // Array backup removed - using object system only
            const piece = pieceObj.mesh;
            if (!piece) continue;
            
            // Check if piece is lost (not visible, not in scene, or has invalid geometry)
            const isLost = !piece.visible || 
                          !this.scene.children.includes(piece) || 
                          !piece.geometry || 
                          !piece.geometry.attributes.position;
            
            if (isLost) {
                console.log(`🔧 Found lost piece ${i}, attempting to fix...`);
                if (this.ensurePieceVisibility(i)) {
                    fixedCount++;
                    console.log(`✅ Fixed lost piece ${i}`);
                } else {
                    console.log('piece-states',`❌ Failed to fix lost piece ${i}`);
                }
            }
        }
        
        if (fixedCount > 0) {
            console.log(`🔧 Fixed ${fixedCount} lost pieces`);
        }
        
        return fixedCount;
    }
   
    // Check if the puzzle is solved (all pieces are in correct positions)
    checkSolvedState() {
        if (!this.pieces || this.pieces.length === 0) {
            return false;
        }
        
        let solvedPieces = 0;
        
        for (let i = 0; i < this.pieces.length; i++) {
            const offset = this.pieces[i].offset || { x: 0, y: 0 };
            const distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y);
            
            if (distance < this.solveThreshold) {
                solvedPieces++;
            }
        }
        
        // Consider solved if all pieces are within the threshold
        const isSolved = solvedPieces === this.pieces.length;
        
        if (isSolved !== this.isSolved) {
            this.isSolved = isSolved;
            this.onSolvedStateChanged(isSolved);
        }
        
        return isSolved;
    }
    
    // Called when solved state changes
    onSolvedStateChanged(isSolved) {
        console.log(`🎉 Puzzle ${isSolved ? 'SOLVED' : 'UNSOLVED'}!`);
        
        // Add/remove solved class to canvas container
        const container = this.canvas.parentElement;
        if (container) {
            if (isSolved) {
                container.classList.add('puzzle-solved');
            } else {
                container.classList.remove('puzzle-solved');
            }
        }
        
        // Glow is handled by .stage.puzzle-solved CSS on the parent element.
    }

    // Update canvas outline based on solved state
    updateCanvasOutline(_isSolved) {
        this.canvas.style.boxShadow = 'none';
    }
}

// Export for use in main script
window.WebGLVoronoiRenderer = WebGLVoronoiRenderer;
window.isWebGLSupported = isWebGLSupported;

// Enhanced dispose method for proper cleanup
WebGLVoronoiRenderer.prototype.dispose = function() {
    // Clean up connected mesh
    if (this.connectedMesh) {
        this.scene.remove(this.connectedMesh);
        this.connectedMesh.geometry.dispose();
        this.connectedMesh.material.dispose();
        this.connectedMesh = null;
    }
    
    // Clean up connected outline
    if (this.connectedOutline) {
        this.scene.remove(this.connectedOutline);
        this.connectedOutline.geometry.dispose();
        this.connectedOutline.material.dispose();
        this.connectedOutline = null;
    }
    
    // Clean up separate pieces
    if (this.pieces) {
        this.pieces.forEach(piece => {
            if (piece.mesh) {
                this.scene.remove(piece.mesh);
                piece.mesh.geometry.dispose();
                piece.mesh.material.dispose();
                piece.mesh = null;
            }
            if (piece.outline) {
                this.scene.remove(piece.outline);
                piece.outline.geometry.dispose();
                piece.outline.material.dispose();
                piece.outline = null;
            }
        });
        this.pieces = null;
    }
    
    // Clean up glow outlines
    if (this.separateGlowOutlines && Array.isArray(this.separateGlowOutlines)) {
        this.separateGlowOutlines.forEach(glow => {
            if (glow) {
                this.scene.remove(glow);
                if (glow.geometry) glow.geometry.dispose();
                if (glow.material) glow.material.dispose();
            }
        });
        this.separateGlowOutlines = null;
    }
    
    // Clean up background texture
    if (this.backgroundTexture) {
        this.backgroundTexture.dispose();
        this.backgroundTexture = null;
    }
    
    // Clean up Three.js objects
    if (this.scene) {
        this.scene.clear();
        this.scene = null;
    }
    
    if (this.camera) {
        this.camera = null;
    }
    
    if (this.renderer) {
        this.renderer.dispose();
        this.renderer = null;
    }
    
    // Remove the WebGL canvas from DOM
    if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
        this.canvas = null;
    }
    
    // Nullify other references
    this.voronoiPolygons = null;
    this.pieceZIndices = null;
    
    console.log('✅ WebGL renderer disposed and cleaned up');
};

// Note: stopAnimation not needed - complete disposal handles animation cleanup
