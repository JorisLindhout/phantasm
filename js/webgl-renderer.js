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
import { SLOT_GHOST_OPACITY, LOOSE_PIECE_Z_BASE, isPolygonWithinStage, scatterPiece, polygonRadius } from './unsolved-layout.js';
import { polygonCenter } from './polygon-geometry.js';
import { createLogger } from './logger.js';
import { PositionManager } from './position-manager.js';

const log = createLogger('webgl');

// Check if WebGL is supported
function isWebGLSupported() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    } catch (e) {
        log.error('WebGL support check failed:', e);
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
        this.slotGhostOutlines = []; // Persistent outlines for empty slots
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
            log.error('WebGL context creation failed:', error.message);
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
            log.warn('WebGL context lost');
        });

        this.canvas.addEventListener('webglcontextrestored', () => {
            if (this.voronoiPolygons.length > 0) {
                this.createConnectedMesh();
            }
        });
    }
    
    // Initialize position manager when originalPoints are available
    initPositionManager(originalPoints) {
        if (this.positionManager) {
            this.positionManager.updateOriginalPoints(originalPoints);
        } else {
            this.positionManager = new PositionManager(originalPoints, this.canvas.height);
        }
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
                    resolve(texture);
                },
                undefined,
                (error) => {
                    log.error('Error loading background texture:', error);
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
                released: false,
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

        this.pieceZIndices = new Array(polygons.length).fill(0);

        if (this.originalPoints && this.originalPoints.length > 0) {
            this.initPositionManager(this.originalPoints);
        }
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
        this.connectedMesh.renderOrder = 0;
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
    
    // Reset a piece back to its connected (solved) state — snap path only.
    resetPieceToConnected(pieceIndex) {
        const piece = this.pieces[pieceIndex];
        const slot = this.slots[pieceIndex];

        if (piece.mesh) {
            this.removeSeparatePiece(pieceIndex);
        }

        piece.state = 'solved';
        piece.slotState = 'filled';
        piece.isInSlot = true;
        piece.offset = { x: 0, y: 0 };
        piece.zIndex = 0;

        slot.state = 'filled';
        slot.pieceId = pieceIndex;
        slot.isCorrect = true;

        this.updateConnectedMeshVisibility();
    }

    // Auto-snap a piece to its slot
    autoSnapPieceToSlot(pieceIndex) {
        if (window.voronoiPuzzle && window.voronoiPuzzle.playSnapSound) {
            window.voronoiPuzzle.playSnapSound();
        }

        this.resetPieceToConnected(pieceIndex);
    }
    
    getLoosePieceZ(zIndex = 0) {
        return LOOSE_PIECE_Z_BASE + zIndex;
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
            separatePiece.position.z = this.getLoosePieceZ(zIndex);
            separatePiece.renderOrder = 10 + zIndex;
        }
        
        // Note: Connected pieces use render order for z-index, handled in render()
    }
    
    // Set dragging state for glow timing
    setDraggingState(isDragging, pieceIndex = -1) {
        this.isDragging = isDragging;
        this.draggedPieceIndex = pieceIndex;
    }
    
    shouldShowSeparateOutline(pieceObj, visualState = 'normal') {
        if (visualState === 'hover' || visualState === 'dragging') {
            return true;
        }

        if (pieceObj.state === 'unsolved') {
            return true;
        }

        return this.showGridOutlines;
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
            
            separateOutline.visible = this.shouldShowSeparateOutline(pieceObj, state);
            
            // Control neon glow visibility based on state (use object system)
            const neonGlow = pieceObj ? pieceObj.glowOutline : this.separateGlowOutlines[index];
            if (neonGlow) {
                const showGlow = state === 'dragging';
                neonGlow.forEach((glowLayer, layerIndex) => {
                    if (glowLayer) {
                        glowLayer.visible = showGlow;
                    }
                });
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

        this.updateSlotGhostOutlines();
    }

    disposeSlotGhostOutlines() {
        if (!this.slotGhostOutlines?.length) return;

        for (const outline of this.slotGhostOutlines) {
            if (!outline) continue;
            this.scene.remove(outline);
            outline.geometry.dispose();
            outline.material.dispose();
        }

        this.slotGhostOutlines = [];
    }

    createSlotGhostOutlines() {
        this.disposeSlotGhostOutlines();

        for (let i = 0; i < this.voronoiPolygons.length; i++) {
            const polygon = this.voronoiPolygons[i];
            if (!polygon || polygon.length < 3) {
                this.slotGhostOutlines[i] = null;
                continue;
            }

            const shape = new THREE.Shape();
            polygon.forEach(([x, y], vertexIndex) => {
                if (vertexIndex === 0) {
                    shape.moveTo(x, y);
                } else {
                    shape.lineTo(x, y);
                }
            });
            shape.closePath();

            const geometry = new THREE.EdgesGeometry(new THREE.ShapeGeometry(shape), 1);
            const material = new THREE.LineBasicMaterial({
                color: this.getThemeColor('slotOutline'),
                transparent: true,
                opacity: SLOT_GHOST_OPACITY,
            });

            const outline = new THREE.LineSegments(geometry, material);
            outline.position.z = 0.05;
            outline.visible = this.slots[i]?.state === 'empty';
            this.scene.add(outline);
            this.slotGhostOutlines[i] = outline;
        }
    }

    updateSlotGhostOutlines() {
        if (!this.slotGhostOutlines?.length) return;

        for (let i = 0; i < this.slots.length; i++) {
            const outline = this.slotGhostOutlines[i];
            if (outline) {
                outline.visible = this.slots[i].state === 'empty';
            }
        }
    }

    prepareUnsolvedGrid() {
        for (let i = 0; i < this.pieces.length; i++) {
            const piece = this.pieces[i];
            piece.released = false;
            piece.offset = { x: 0, y: 0 };
            piece.state = 'solved';
            piece.slotState = 'empty';
            piece.isInSlot = false;
            piece.autoSnapTimeout = null;

            this.slots[i].state = 'empty';
            this.slots[i].pieceId = null;
            this.slots[i].isCorrect = false;

            this.removeSeparatePiece(i);
        }

        this.updateConnectedMeshVisibility();
        this.createSlotGhostOutlines();
        this.isSolved = false;
        this.onSolvedStateChanged(false);
    }

    releasePiece(index, offset) {
        const piece = this.pieces[index];
        if (!piece || piece.released) return;

        piece.released = true;
        this.updatePiecePosition(index, offset);
        this.raiseLoosePieceLayer(index);
        this.render();
    }

    raiseLoosePieceLayer(index) {
        const nextZ = Math.max(...this.pieceZIndices, 0) + 1;
        this.updatePieceZIndex(index, nextZ);
    }

    recoverOffscreenLoosePieces() {
        if (!this.canvas) return 0;

        const stageSize = {
            width: this.canvas.width,
            height: this.canvas.height,
        };

        const existingPlacements = [];
        let recovered = 0;

        for (let i = 0; i < this.pieces.length; i++) {
            const piece = this.pieces[i];
            if (!piece.released || piece.state !== 'unsolved' || this.slots[i].state === 'filled') {
                continue;
            }

            const polygon = this.voronoiPolygons[i];
            if (!polygon) continue;

            const needsRecovery = !piece.mesh || !isPolygonWithinStage(polygon, piece.offset, stageSize);
            if (!needsRecovery) {
                const { centerX, centerY } = polygonCenter(polygon);
                existingPlacements.push({
                    x: centerX + piece.offset.x,
                    y: centerY + piece.offset.y,
                    radius: polygonRadius(polygon),
                });
                continue;
            }

            const offset = scatterPiece({
                polygon,
                stageSize,
                existingPlacements,
            });

            this.updatePiecePosition(i, offset);
            this.raiseLoosePieceLayer(i);

            const { centerX, centerY } = polygonCenter(polygon);
            existingPlacements.push({
                x: centerX + offset.x,
                y: centerY + offset.y,
                radius: polygonRadius(polygon),
            });
            recovered++;
        }

        if (recovered > 0) {
            this.render();
        }

        return recovered;
    }

    /**
     * Repair a released loose piece's mesh without changing solved/slot state.
     * @param {number} pieceIndex
     * @returns {boolean}
     */
    repairSeparatePiece(pieceIndex) {
        const piece = this.pieces[pieceIndex];
        if (!piece || !piece.released || piece.state !== 'unsolved') {
            return false;
        }

        const offset = piece.offset || { x: 0, y: 0 };

        if (!piece.mesh) {
            this.createSeparatePiece(pieceIndex, offset);
            return piece.mesh !== null;
        }

        let repaired = false;
        const mesh = piece.mesh;

        if (!mesh.visible) {
            mesh.visible = true;
            repaired = true;
        }

        if (!this.scene.children.includes(mesh)) {
            this.scene.add(mesh);
            repaired = true;
        }

        const position = getSeparatePieceMeshPosition(offset);
        if (mesh.position.x !== position.x || mesh.position.y !== position.y) {
            mesh.position.set(position.x, position.y, mesh.position.z);
            repaired = true;
        }

        if (piece.outline) {
            if (!this.scene.children.includes(piece.outline)) {
                this.scene.add(piece.outline);
                repaired = true;
            }
            piece.outline.position.copy(mesh.position);
            piece.outline.position.z = mesh.position.z + 0.1;
        }

        if (piece.glowOutline) {
            piece.glowOutline.forEach((glowLayer) => {
                if (glowLayer && !this.scene.children.includes(glowLayer)) {
                    this.scene.add(glowLayer);
                    repaired = true;
                }
                if (glowLayer) {
                    glowLayer.position.copy(mesh.position);
                }
            });
        }

        const zIndex = piece.zIndex ?? this.pieceZIndices[pieceIndex];
        if (zIndex === undefined || zIndex < 0) {
            piece.zIndex = 0;
            this.pieceZIndices[pieceIndex] = 0;
            repaired = true;
        }

        if (!mesh.geometry || !mesh.geometry.attributes?.position) {
            if (this.recreatePieceGeometry(pieceIndex)) {
                repaired = true;
            }
        }

        return repaired;
    }

    /**
     * Layout + interaction recovery for released loose pieces (dev/manual use).
     * @returns {number}
     */
    repairAllReleasedPieces() {
        let count = this.recoverOffscreenLoosePieces();

        for (let i = 0; i < this.pieces.length; i++) {
            if (this.repairSeparatePiece(i)) {
                count++;
            }
        }

        return count;
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
        mesh.position.z = this.getLoosePieceZ(this.pieceZIndices[index] ?? 0);
        mesh.renderOrder = 10 + (this.pieceZIndices[index] ?? 0);
        
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
        outline.visible = this.pieces[index].state === 'unsolved';
        if (outline.visible) {
            this.updateOutlineState(outlineMaterial, 'normal');
        }
        
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

        this.disposeSlotGhostOutlines();
        
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
    }
    
    // Toggle grid outline visibility
    toggleGridOutlines() {
        this.showGridOutlines = !this.showGridOutlines;
        
        // Update connected outline visibility
        if (this.connectedOutline) {
            this.connectedOutline.visible = this.showGridOutlines;
        }
        
        // Update separate piece outline visibility using object system
        this.pieces.forEach((piece) => {
            if (piece.outline) {
                piece.outline.visible = this.shouldShowSeparateOutline(piece, 'normal');
            }
        });
        
        return this.showGridOutlines;
    }
    
    // Theme System Methods
    
    /**
     * Update theme - called by ThemeManager
     */
    updateTheme(theme) {
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
    findPieceAtPosition(x, y, options = {}) {
        const opts = typeof options === 'boolean'
            ? { skipDraggedPiece: options, allowRepair: false }
            : { skipDraggedPiece: false, allowRepair: false, ...options };
        const { skipDraggedPiece, allowRepair } = opts;

        const mouse = new THREE.Vector2(
            (x / this.canvas.width) * 2 - 1,
            -(y / this.canvas.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        raycaster.params.Points.threshold = 10;
        raycaster.params.Line.threshold = 5;
        raycaster.near = 0.1;
        raycaster.far = 1000;

        const separatePieces = this.pieces
            .map((piece, index) => ({ piece: piece.mesh, index, pieceObj: piece }))
            .filter(({ piece }) => piece !== null)
            .sort((a, b) => {
                const aZ = a.pieceObj.zIndex || this.pieceZIndices[a.index] || 0;
                const bZ = b.pieceObj.zIndex || this.pieceZIndices[b.index] || 0;

                if (aZ === bZ) {
                    return b.index - a.index;
                }

                return bZ - aZ;
            });

        for (const { index } of separatePieces) {
            if (skipDraggedPiece && index === this.draggedPieceIndex) {
                continue;
            }

            if (allowRepair) {
                this.repairSeparatePiece(index);
            }

            const piece = this.pieces[index].mesh;
            if (!piece || !piece.geometry) {
                continue;
            }

            try {
                const intersects = raycaster.intersectObject(piece);
                if (intersects.length > 0) {
                    return index;
                }
            } catch (error) {
                log.error(`Raycaster error for piece ${index}:`, error);
            }
        }

        for (const { index } of separatePieces) {
            if (skipDraggedPiece && index === this.draggedPieceIndex) {
                continue;
            }

            if (allowRepair) {
                this.repairSeparatePiece(index);
            }

            const piece = this.pieces[index].mesh;
            if (!piece || !piece.geometry) {
                continue;
            }

            const offsets = [
                { x: 0, y: 0 },
                { x: -20, y: 0 },
                { x: 20, y: 0 },
                { x: 0, y: -20 },
                { x: 0, y: 20 },
                { x: -10, y: -10 },
                { x: 10, y: -10 },
                { x: -10, y: 10 },
                { x: 10, y: 10 },
            ];

            for (const offset of offsets) {
                const testX = x + offset.x;
                const testY = y + offset.y;

                const testMouse = new THREE.Vector2(
                    (testX / this.canvas.width) * 2 - 1,
                    -((testY / this.canvas.height) * 2 - 1)
                );

                const testRaycaster = new THREE.Raycaster();
                testRaycaster.setFromCamera(testMouse, this.camera);
                testRaycaster.near = 0.1;
                testRaycaster.far = 1000;

                try {
                    const intersects = testRaycaster.intersectObject(piece);
                    if (intersects.length > 0) {
                        return index;
                    }
                } catch {
                    // Continue to next offset
                }
            }

            if (this.isPointInPieceBounds(x, y, index) || this.isPointInPiecePolygon(x, y, index)) {
                return index;
            }
        }

        if (this.connectedMesh) {
            const connectedIntersects = raycaster.intersectObject(this.connectedMesh);
            if (connectedIntersects.length > 0) {
                const intersectionPoint = connectedIntersects[0].point;
                const pieceIndex = this.findPieceIndexAtPoint(intersectionPoint.x, intersectionPoint.y);
                if (pieceIndex !== -1) {
                    const slot = this.slots[pieceIndex];

                    if (slot && slot.state === 'filled') {
                        return pieceIndex;
                    }

                    return { type: 'slot', index: pieceIndex };
                }
            }
        }

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
        
        return isInside;
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
            
            return true;
        } catch (error) {
            log.error(`Failed to recreate geometry for piece ${pieceIndex}:`, error);
            return false;
        }
    }
   
    // Check if the puzzle is solved (all pieces are in correct positions)
    checkSolvedState() {
        if (!this.pieces || this.pieces.length === 0) {
            return false;
        }

        const unreleasedCount = this.pieces.filter((piece) => !piece.released).length;
        if (unreleasedCount > 0) {
            if (this.isSolved) {
                this.isSolved = false;
                this.onSolvedStateChanged(false);
            }
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

        const isSolved = solvedPieces === this.pieces.length;

        if (isSolved !== this.isSolved) {
            this.isSolved = isSolved;
            this.onSolvedStateChanged(isSolved);
        }

        return isSolved;
    }
    
    // Called when solved state changes
    onSolvedStateChanged(isSolved) {
        const container = this.canvas.parentElement;
        if (container) {
            if (isSolved) {
                container.classList.add('puzzle-solved');
            } else {
                container.classList.remove('puzzle-solved');
            }
        }

        if (isSolved && window.levelManager?.handlePuzzleSolved) {
            window.levelManager.handlePuzzleSolved();
        }
    }

    // Update canvas outline based on solved state
    updateCanvasOutline(_isSolved) {
        this.canvas.style.boxShadow = 'none';
    }
}

// Export for use in main script
window.WebGLVoronoiRenderer = WebGLVoronoiRenderer;
window.isWebGLSupported = isWebGLSupported;
export { WebGLVoronoiRenderer, isWebGLSupported };

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
};

// Note: stopAnimation not needed - complete disposal handles animation cleanup
