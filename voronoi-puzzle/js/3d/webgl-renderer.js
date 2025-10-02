/**
 * WebGL Renderer for Voronoi Puzzle with proper z-index layering
 * Uses Three.js for simplified WebGL management
 */

// Check if WebGL is supported
function isWebGLSupported() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const supported = !!gl;
        console.log('🔍 WebGL support check:', supported);
        if (gl) {
            console.log('🔍 WebGL version:', gl.getParameter(gl.VERSION));
            console.log('🔍 WebGL vendor:', gl.getParameter(gl.VENDOR));
            console.log('🔍 WebGL renderer:', gl.getParameter(gl.RENDERER));
        }
        return supported;
    } catch (e) {
        console.error('🔍 WebGL support check failed:', e);
        return false;
    }
}

class WebGLVoronoiRenderer {
    constructor(canvas) {
        this.originalCanvas = canvas;
        this.canvas = null; // Will create a new canvas for WebGL
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.backgroundTexture = null;
        this.animationTime = 0;
        
        // Store Voronoi data for connected rendering
        this.voronoiPolygons = [];
        this.connectedMesh = null; // Single mesh for all connected pieces
        this.connectedOutline = null; // Outline for connected mesh
        this.separatePieces = []; // Individual meshes for moved pieces
        this.separateOutlines = []; // Outlines for separate pieces
        this.separateGlowOutlines = []; // Neon glow outlines for separate pieces
        this.pieceZIndices = []; // Z-index for each piece
        this.separatePiecesMode = false;
        this.pieceOffsets = []; // Track which pieces are moved
        
        // Piece state management
        this.pieceStates = []; // 'solved' or 'unsolved' for each piece
        this.slotStates = []; // 'filled' or 'empty' for each slot
        
        // Hover effect for connected pieces and slots
        this.hoverOverlay = null; // Temporary highlight mesh for piece hover
        this.slotHoverOverlay = null; // Temporary highlight mesh for slot hover
        this.hoveredPieceIndex = undefined; // Track which piece is currently hovered
        this.hoveredSlotIndex = undefined; // Track which slot is currently hovered
        
        // Grid outline visibility toggle
        this.showGridOutlines = false; // Set to true to show the thin blue grid outlines
        
        // Debug logging control
        this.debugLogging = {
            glow: true,         // Neon glow creation/updates - ENABLED for debugging
            animation: false,   // Animation updates
            hitDetection: false, // Hit detection
            visual: true,       // Visual state changes - ENABLED for debugging
            creation: true      // Basic creation/removal logs
        };
        
        // Track dragging state for glow timing
        this.isDragging = false;
        this.draggedPieceIndex = -1;
        
        // Theme system
        this.currentTheme = null; // Will be set by theme manager
        
        this.init();
    }
    
    init() {
        // Check WebGL support first
        if (!isWebGLSupported()) {
            throw new Error('WebGL is not supported by this browser');
        }
        
        // Create a new canvas for WebGL to avoid context conflicts
        this.canvas = document.createElement('canvas');
        
        // Get the display size from the original canvas container
        const container = this.originalCanvas.parentElement;
        const displayWidth = container.clientWidth;
        const displayHeight = container.clientHeight;
        
        // Set canvas resolution to match display size (avoid high DPI scaling issues)
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
        
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
        
        console.log('🎨 WebGL canvas size:', this.canvas.width, 'x', this.canvas.height, 'display:', displayWidth, 'x', displayHeight);
        
        // Insert the WebGL canvas as a sibling to the original canvas
        this.originalCanvas.parentNode.appendChild(this.canvas);
        
        // Create Three.js scene
        this.scene = new THREE.Scene();
        
        // Create orthographic camera for 2D-like rendering
        const width = this.canvas.width;
        const height = this.canvas.height;
        this.camera = new THREE.OrthographicCamera(
            0, width,     // left, right
            height, 0,    // top, bottom (flipped to match screen coordinates)
            -1000, 1000   // near, far (large range for z-layering)
        );
        this.camera.position.z = 100;
        
        // Create WebGL renderer with error handling
        console.log('🔍 Attempting to create Three.js WebGL renderer...');
        console.log('🔍 Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
        
        try {
            // Test if we can get a WebGL context directly first
            const testGL = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            if (!testGL) {
                throw new Error('Cannot get WebGL context from canvas');
            }
            console.log('🔍 Direct WebGL context test: SUCCESS');
            
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                alpha: true,
                antialias: true,
                preserveDrawingBuffer: true,
                powerPreference: "default", // Use default power preference for compatibility
                failIfMajorPerformanceCaveat: false // Don't fail on performance issues
            });
            console.log('🔍 Three.js WebGL renderer created successfully');
        } catch (error) {
            console.error('❌ WebGL context creation failed:', error);
            console.error('❌ Error details:', error.message);
            throw new Error('WebGL not supported or context creation failed: ' + error.message);
        }
        this.renderer.setSize(width, height, false); // false = don't update CSS size
        this.renderer.setClearColor(0x111111, 1.0); // Dark background matching 2D version
        
        // Enable depth testing for proper z-layering
        this.renderer.sortObjects = true;
        this.renderer.setPixelRatio(1); // Force pixel ratio to 1 to avoid scaling issues
        
        console.log('✅ WebGL renderer initialized');
    }
    
    loadBackgroundTexture(imageUrl) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                imageUrl,
                (texture) => {
                    this.backgroundTexture = texture;
                    texture.wrapS = THREE.ClampToEdgeWrapping;
                    texture.wrapT = THREE.ClampToEdgeWrapping;
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;
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
    
    // Initialize Voronoi data for connected rendering
    initializeVoronoi(polygons) {
        this.voronoiPolygons = polygons.map(polygon => [...polygon]); // Deep copy
        this.pieceZIndices = new Array(polygons.length).fill(0);
        this.pieceOffsets = new Array(polygons.length).fill(null);
        
        // Initialize piece and slot states
        this.pieceStates = new Array(polygons.length).fill('solved'); // All pieces start solved
        this.slotStates = new Array(polygons.length).fill('filled'); // All slots start filled
        
        // Create the connected mesh that represents all pieces
        this.createConnectedMesh();
        
        console.log(`✅ Initialized connected Voronoi with ${polygons.length} pieces`);
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
            uvs.push(centerX / this.canvas.width, centerY / this.canvas.height); // Keep original orientation
            
            // Add polygon vertices
            for (let i = 0; i < polygon.length; i++) {
                vertices.push(polygon[i][0], polygon[i][1], 0);
                uvs.push(polygon[i][0] / this.canvas.width, polygon[i][1] / this.canvas.height); // Keep original orientation
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
            const showBackground = this.slotStates[pieceIndex] === 'filled';
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
        
        console.log(`✅ Created connected mesh with ${vertices.length / 3} vertices`);
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
            if (this.separatePieces[pieceIndex]) continue;
            
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
    
    updatePiecePosition(index, offset) {
        // Store the offset for this piece
        this.pieceOffsets[index] = offset;
        
        // If piece has significant offset, create separate mesh
        const distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y);
        if (distance > 10) { // Threshold for creating separate piece
            // Piece is being moved out - update states
            this.pieceStates[index] = 'unsolved';
            this.slotStates[index] = 'empty';
            
            this.createSeparatePiece(index, offset);
            this.updateConnectedMeshVisibility(); // Update slot visibility
        } else {
            // Piece snapped back - update states
            this.pieceStates[index] = 'solved';
            this.slotStates[index] = 'filled';
            
            this.removeSeparatePiece(index);
            this.updateConnectedMeshVisibility(); // Update slot visibility
        }
    }
    
    updatePieceZIndex(index, zIndex) {
        this.pieceZIndices[index] = zIndex;
        
        // If there's a separate piece for this index, update its z-position
        const separatePiece = this.separatePieces[index];
        if (separatePiece) {
            separatePiece.position.z = zIndex * 10;
            console.log(`🔄 Updated separate piece ${index} z-index to ${zIndex}`);
        }
        
        // Note: Connected pieces use render order for z-index, handled in render()
    }
    
    // Set dragging state for glow timing
    setDraggingState(isDragging, pieceIndex = -1) {
        this.isDragging = isDragging;
        this.draggedPieceIndex = pieceIndex;
        
        if (this.debugLogging.glow) {
            console.log(`🎯 WebGL dragging state: ${isDragging ? 'START' : 'STOP'} piece ${pieceIndex}`);
        }
    }
    
    // Update visual state of a piece (hover, dragging, snapped, normal)
    updatePieceVisualState(index, state) {
        const separatePiece = this.separatePieces[index];
        const separateOutline = this.separateOutlines[index];
        
        console.log(`🎨 Updating piece ${index} visual state to: ${state}, separatePiece: ${!!separatePiece}`);
        
        if (separatePiece && separateOutline) {
            console.log(`🔧 Updating separate piece ${index} materials`);
            console.log(`🎨 Before update - Material color:`, separatePiece.material.color.getHex().toString(16));
            console.log(`🎨 Before update - Material opacity:`, separatePiece.material.opacity);
            
            this.updateMaterialState(separatePiece.material, state);
            this.updateOutlineState(separateOutline.material, state);
            this.updatePieceScale(separatePiece, state);
            
            // Control neon glow visibility based on state
            const neonGlow = this.separateGlowOutlines[index];
            console.log(`🔍 Checking neon glow for piece ${index}, state: ${state}, neonGlow exists: ${!!neonGlow}`);
            if (neonGlow) {
                const showGlow = state === 'dragging';
                console.log(`🌟 Setting glow visibility to: ${showGlow} for ${neonGlow.length} layers`);
                neonGlow.forEach((glowLayer, layerIndex) => {
                    if (glowLayer) {
                        glowLayer.visible = showGlow;
                        console.log(`   Layer ${layerIndex}: visible = ${glowLayer.visible}, position = ${glowLayer.position.x}, ${glowLayer.position.y}, ${glowLayer.position.z}`);
                    }
                });
                console.log(`🌟 Neon glow ${showGlow ? 'ENABLED' : 'DISABLED'} for piece ${index}`);
            } else {
                console.log(`❌ No neon glow found for piece ${index}`);
            }
            
            console.log(`🎨 After update - Material color:`, separatePiece.material.color.getHex().toString(16));
            console.log(`🎨 After update - Material opacity:`, separatePiece.material.opacity);
        } else {
            console.log(`⚠️ No separate piece/outline found for index ${index}`);
            console.log(`⚠️ separatePiece:`, !!separatePiece, 'separateOutline:', !!separateOutline);
        }
        
        // Also update connected pieces for hover effects
        if (state === 'hover' && !separatePiece) {
            console.log(`🔗 Creating hover overlay for connected piece ${index}`);
            this.updateConnectedPieceHover(index, true);
        } else if (state === 'normal' && !separatePiece) {
            console.log(`🔗 Removing hover overlay for connected piece ${index}`);
            this.updateConnectedPieceHover(index, false);
        }
    }
    
    // Update material properties for piece fill
    updateMaterialState(material, state) {
        // Store original color and opacity if not already stored
        if (!material.originalColor) {
            material.originalColor = material.color.clone();
            material.originalOpacity = material.opacity;
        }
        
        console.log(`🎨 Material state update: ${state}, hasTexture: ${!!material.map}`);
        
        switch (state) {
            case 'hover':
                // Subtle tint for hover
                material.color.setHex(this.getThemeColor('pieceHover'));
                material.opacity = Math.max(this.getThemeEffect('opacityHover', 0.8), material.originalOpacity);
                console.log(`✨ Applied hover tint from theme`);
                break;
            case 'dragging':
                // Very bright tint for dragging - temporarily remove texture for pure glow
                if (material.map) {
                    material.originalMap = material.map;
                    material.map = null; // Remove texture to show pure color glow
                }
                material.color.setHex(this.getThemeColor('pieceDragging')); // Theme dragging color
                material.opacity = this.getThemeEffect('opacityDragging', 0.9);
                console.log(`🔥 Applied dragging glow from theme (texture removed)`);
                break;
            case 'snapped':
                // Green tint for snapped pieces
                material.color.setHex(this.getThemeColor('pieceSnapped'));
                material.opacity = 1.0;
                console.log(`✅ Applied snapped tint: #44FF88`);
                break;
            case 'normal':
            default:
                // Restore original color, opacity, and texture
                material.color.copy(material.originalColor);
                material.opacity = material.originalOpacity || 1.0;
                
                // Restore texture if it was temporarily removed
                if (material.originalMap) {
                    material.map = material.originalMap;
                    material.originalMap = null;
                }
                
                console.log(`🔄 Restored original material state (including texture)`);
                break;
        }
    }
    
    // Create neon glow outline with multiple layers for realistic glow effect
    createNeonGlowOutline(geometry, position, visible = true) {
        const glowLayers = [];
        
        if (this.debugLogging.glow) {
            console.log(`🌟 Creating neon glow outline at position:`, position);
        }
        
        // Create outline-only glow using edge geometry
        // Since linewidth doesn't work reliably in WebGL, we'll use multiple overlapping outlines
        const glowConfigs = [
            { thickness: 1, opacity: 1.0, color: this.getThemeColor('pieceDragging') }, // Base outline
        ];
        
        glowConfigs.forEach((config, index) => {
            // Create outline geometry using EdgesGeometry
            const edgesGeometry = new THREE.EdgesGeometry(geometry, 1); // Low threshold for all edges
            
            const glowMaterial = new THREE.LineBasicMaterial({
                color: config.color,
                transparent: true,
                opacity: config.opacity,
                linewidth: config.thickness // This might not work in all browsers, but let's try
            });
            
            const glowOutline = new THREE.LineSegments(edgesGeometry, glowMaterial);
            
            // Position the glow outline at the same position as the piece
            glowOutline.position.copy(position);
            glowOutline.position.z += 0.01 + (index * 0.001); // Just slightly above piece
            glowOutline.visible = visible;
            
            if (this.debugLogging.glow) {
                console.log(`✨ Created glow outline ${index + 1} with thickness ${config.thickness}, opacity ${config.opacity}`);
            }
            
            glowLayers.push(glowOutline);
            this.scene.add(glowOutline);
        });
        
        if (this.debugLogging.glow) {
            console.log(`🎆 Created ${glowLayers.length} glow layers`);
        }
        return glowLayers;
    }
    
    // Update neon glow outline geometry to match animation
    updateNeonGlowOutline(glowLayers, geometry, position) {
        if (!glowLayers || glowLayers.length === 0) return;
        
        if (this.debugLogging.animation) {
            console.log(`🔄 Updating ${glowLayers.length} glow layers to match animation`);
        }
        
        glowLayers.forEach((glowOutline, index) => {
            // Create new edges geometry from updated piece geometry
            const newEdgesGeometry = new THREE.EdgesGeometry(geometry, 1);
            
            // Update geometry
            glowOutline.geometry.dispose();
            glowOutline.geometry = newEdgesGeometry;
            
            // Update position
            glowOutline.position.copy(position);
            glowOutline.position.z += 0.01 + (index * 0.001);
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
                // FluidLock hover color: rgba(0, 221, 255, 0.6)
                material.color.setHex(this.getThemeColor('outlineHover'));
                material.opacity = 0.6;
                material.linewidth = 2;
                break;
            case 'dragging':
                // Very bright outline for dragging - make it super visible
                material.color.setHex(this.getThemeColor('outlineDragging')); // Theme dragging outline
                material.opacity = 1.0; // Full opacity
                material.linewidth = 4; // Thick line
                console.log(`🔥 Applied bright dragging outline`);
                break;
            case 'snapped':
                // Green outline for snapped pieces
                material.color.setHex(this.getThemeColor('outlineSnapped'));
                material.opacity = 0.8;
                material.linewidth = 2;
                break;
            case 'normal':
            default:
                // Default subtle outline
                material.color.setHex(this.getThemeColor('outlineNormal'));
                material.opacity = 0.3;
                material.linewidth = 1;
                break;
        }
    }
    
    // Update piece scale with smooth animation
    updatePieceScale(piece, state) {
        // Remove any existing scale animation
        if (piece.scaleAnimation) {
            clearInterval(piece.scaleAnimation);
        }
        
        let targetScale;
        switch (state) {
            case 'dragging':
                targetScale = this.getThemeEffect('scaleDragging', 1.1);
                break;
            case 'hover':
                targetScale = this.getThemeEffect('scaleHover', 1.02);
                break;
            case 'normal':
            case 'snapped':
            default:
                targetScale = 1.0; // Normal size
                break;
        }
        
        // Smooth scale animation
        const startScale = piece.scale.x;
        const duration = 200; // 200ms animation
        const steps = 10;
        const stepDuration = duration / steps;
        const scaleStep = (targetScale - startScale) / steps;
        
        let currentStep = 0;
        piece.scaleAnimation = setInterval(() => {
            currentStep++;
            const newScale = startScale + (scaleStep * currentStep);
            piece.scale.set(newScale, newScale, 1);
            
            if (currentStep >= steps) {
                clearInterval(piece.scaleAnimation);
                piece.scaleAnimation = null;
                piece.scale.set(targetScale, targetScale, 1);
            }
        }, stepDuration);
    }
    
    // Update hover effect for connected pieces
    updateConnectedPieceHover(index, isHovered) {
        console.log(`🖱️ Connected piece ${index} hover: ${isHovered}`);
        
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
            
            const hoverGeometry = new THREE.ShapeGeometry(shape);
            
            // Create hover material with visible highlight
            const hoverMaterial = new THREE.MeshBasicMaterial({
                color: this.getThemeColor('pieceHover'),
                transparent: true,
                opacity: 0.25, // More visible for testing
                side: THREE.DoubleSide
            });
            
            // Create hover overlay mesh
            this.hoverOverlay = new THREE.Mesh(hoverGeometry, hoverMaterial);
            this.hoverOverlay.position.z = 0.05; // Slightly above the connected mesh
            this.scene.add(this.hoverOverlay);
        } else {
            // Clear hovered piece index
            this.hoveredPieceIndex = undefined;
        }
    }
    
    // Update hover effect for empty slots
    updateSlotHover(index, isHovered) {
        console.log(`🎰 Slot ${index} hover: ${isHovered}`);
        
        // Remove existing slot hover overlay
        if (this.slotHoverOverlay) {
            this.scene.remove(this.slotHoverOverlay);
            this.slotHoverOverlay.geometry.dispose();
            this.slotHoverOverlay.material.dispose();
            this.slotHoverOverlay = null;
        }
        
        if (isHovered && this.voronoiPolygons[index] && this.slotStates[index] === 'empty') {
            // Track which slot is hovered
            this.hoveredSlotIndex = index;
            
            // Create slot hover overlay for the specific empty slot
            const polygon = this.voronoiPolygons[index];
            
            // Create animated polygon for current time
            const animatedPolygon = this.createAnimatedPath(polygon, this.animationTime);
            
            // Create shape geometry
            const shape = new THREE.Shape();
            shape.moveTo(animatedPolygon[0][0], animatedPolygon[0][1]);
            for (let i = 1; i < animatedPolygon.length; i++) {
                shape.lineTo(animatedPolygon[i][0], animatedPolygon[i][1]);
            }
            
            const slotHoverGeometry = new THREE.ShapeGeometry(shape);
            
            // Create slot hover material with theme color
            const slotHoverMaterial = new THREE.MeshBasicMaterial({
                color: this.getThemeColor('slotHover'), // Theme slot hover color
                transparent: true,
                opacity: 0.2, // Subtle but visible
                side: THREE.DoubleSide
            });
            
            // Create slot hover overlay mesh
            this.slotHoverOverlay = new THREE.Mesh(slotHoverGeometry, slotHoverMaterial);
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
        
        // Create new shape geometry
        const shape = new THREE.Shape();
        shape.moveTo(animatedPolygon[0][0], animatedPolygon[0][1]);
        for (let i = 1; i < animatedPolygon.length; i++) {
            shape.lineTo(animatedPolygon[i][0], animatedPolygon[i][1]);
        }
        
        const newGeometry = new THREE.ShapeGeometry(shape);
        
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
        
        const newGeometry = new THREE.ShapeGeometry(shape);
        
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
            const showBackground = this.slotStates[pieceIndex] === 'filled';
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
    
    createSeparatePiece(index, offset) {
        // Remove existing separate piece if any
        this.removeSeparatePiece(index);
        
        const polygon = this.voronoiPolygons[index];
        if (!polygon || polygon.length < 3) return;
        
        // Create geometry for this piece
        const shape = new THREE.Shape();
        shape.moveTo(polygon[0][0], polygon[0][1]);
        for (let i = 1; i < polygon.length; i++) {
            shape.lineTo(polygon[i][0], polygon[i][1]);
        }
        
        const geometry = new THREE.ShapeGeometry(shape);
        
        // Set up UV coordinates
        if (geometry.attributes.position) {
            const positions = geometry.attributes.position.array;
            const uvs = [];
            
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const y = positions[i + 1];
                uvs.push(x / this.canvas.width, y / this.canvas.height);
            }
            
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        }
        
        // Create material - only show background image if piece is unsolved
        const showBackground = this.pieceStates[index] === 'unsolved';
        const material = new THREE.MeshBasicMaterial({
            map: showBackground ? this.backgroundTexture : null,
            color: 0xffffff, // Always start with white for proper color tinting
            transparent: true,
            opacity: showBackground ? 1.0 : 0.3, // Make pieces without texture semi-transparent
            side: THREE.DoubleSide
        });
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = offset.x;
        mesh.position.y = -offset.y; // Flip Y for camera
        mesh.position.z = this.pieceZIndices[index] * 10;
        
        // Force bounding box computation for hit detection
        geometry.computeBoundingBox();
        mesh.updateMatrixWorld(true);
        
        // Create outline for separate piece
        const wireframeGeometry = new THREE.WireframeGeometry(geometry);
        const outlineMaterial = new THREE.LineBasicMaterial({
            color: this.getThemeColor('outlineDragging'), // Theme outline for dragged pieces
            transparent: true,
            opacity: 0.8,
            linewidth: 2
        });
        
        const outline = new THREE.LineSegments(wireframeGeometry, outlineMaterial);
        outline.position.copy(mesh.position);
        outline.position.z += 0.1; // Slightly above the piece
        outline.visible = this.showGridOutlines; // Control visibility
        
        // Store and add to scene
        // Create neon glow outline - make it visible if this piece is currently being dragged
        const isDragging = this.isDragging && this.draggedPieceIndex === index;
        const neonGlow = this.createNeonGlowOutline(geometry, mesh.position, isDragging);
        
        this.separatePieces[index] = mesh;
        this.separateOutlines[index] = outline;
        this.separateGlowOutlines[index] = neonGlow;
        this.scene.add(mesh);
        this.scene.add(outline);
        
        // If this piece is currently being dragged, make sure glow is visible
        if (isDragging && this.debugLogging.glow) {
            console.log(`🌟 CREATED DRAGGING PIECE ${index} - glow should be visible!`);
        }
        
        console.log(`✅ Created separate piece ${index} at offset (${offset.x}, ${offset.y})`);
    }
    
    removeSeparatePiece(index) {
        const piece = this.separatePieces[index];
        const outline = this.separateOutlines[index];
        const neonGlow = this.separateGlowOutlines[index];
        
        if (piece) {
            this.scene.remove(piece);
            piece.geometry.dispose();
            piece.material.dispose();
            this.separatePieces[index] = null;
        }
        
        if (outline) {
            this.scene.remove(outline);
            outline.geometry.dispose();
            outline.material.dispose();
            this.separateOutlines[index] = null;
        }
        
        if (neonGlow) {
            this.removeNeonGlowOutline(neonGlow);
            this.separateGlowOutlines[index] = null;
        }
        
        if (piece || outline || neonGlow) {
            console.log(`🗑️ Removed separate piece ${index} (including neon glow)`);
        }
    }
    
    
    updateOutlineState(material, state) {
        switch (state) {
            case 'hover':
                material.color.setHex(0x00ddff); // Blue for hover
                material.opacity = 1.0;
                break;
            case 'dragging':
                material.color.setHex(0xff4444); // Red for dragging
                material.opacity = 1.0;
                break;
            case 'snapped':
                material.color.setHex(0x44ff44); // Green for snapped
                material.opacity = 1.0;
                break;
            case 'normal':
            default:
                material.color.setHex(0x00ddff); // Default blue
                material.opacity = 0.8;
                break;
        }
    }
    
    animatePieceBoundaries(time) {
        this.animationTime = time;
        
        // Update connected mesh geometry with animated boundaries
        if (this.connectedMesh && this.voronoiPolygons.length > 0) {
            this.updateConnectedMeshGeometry(time);
        }
        
        // Update separate pieces with animated boundaries
        this.separatePieces.forEach((piece, index) => {
            if (piece && this.voronoiPolygons[index]) {
                this.updateSeparatePieceGeometry(piece, index, time);
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
    createAnimatedPath(originalPolygon, time, amplitude = 20) {
        const animatedPath = [];
        
        for (let i = 0; i < originalPolygon.length; i++) {
            const [x, y] = originalPolygon[i];
            
            // Calculate noise-based offset (enhanced for better visibility)
            const timeScale = 0.002; // Slower animation for better visibility
            const spatialScale = 0.015; // More variation across space
            const noiseX = Math.sin(time * timeScale + x * spatialScale + y * spatialScale * 0.7) * amplitude * 0.8;
            const noiseY = Math.cos(time * timeScale * 1.3 + x * spatialScale * 0.8 + y * spatialScale) * amplitude * 0.8;
            
            const animatedX = x + noiseX;
            const animatedY = y + noiseY;
            
            animatedPath.push([animatedX, animatedY]);
        }
        
        return animatedPath;
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
            if (this.separatePieces[pieceIndex]) {
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
            uvs[vertexIndex * 2] = centerX / this.canvas.width;
            uvs[vertexIndex * 2 + 1] = centerY / this.canvas.height; // Keep original orientation
            vertexIndex++;
            
            // Update polygon vertices
            for (let i = 0; i < animatedPolygon.length; i++) {
                positions[vertexIndex * 3] = animatedPolygon[i][0];
                positions[vertexIndex * 3 + 1] = animatedPolygon[i][1];
                // Sync UV coordinates with animated positions for proper texture alignment
                uvs[vertexIndex * 2] = animatedPolygon[i][0] / this.canvas.width;
                uvs[vertexIndex * 2 + 1] = animatedPolygon[i][1] / this.canvas.height; // Keep original orientation
                vertexIndex++;
            }
        }
        
        // Mark geometry as needing update
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.uv.needsUpdate = true;
    }
    
    // Update separate piece geometry with animated boundaries
    updateSeparatePieceGeometry(piece, index, time) {
        const originalPolygon = this.voronoiPolygons[index];
        if (!originalPolygon) return;
        
        // Create animated polygon
        const animatedPolygon = this.createAnimatedPath(originalPolygon, time);
        
        // Create new geometry with animated boundaries
        const shape = new THREE.Shape();
        shape.moveTo(animatedPolygon[0][0], animatedPolygon[0][1]);
        for (let i = 1; i < animatedPolygon.length; i++) {
            shape.lineTo(animatedPolygon[i][0], animatedPolygon[i][1]);
        }
        
        const newGeometry = new THREE.ShapeGeometry(shape);
        
        // Set up UV coordinates
        if (newGeometry.attributes.position) {
            const positions = newGeometry.attributes.position.array;
            const uvs = [];
            
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const y = positions[i + 1];
                // Sync UV coordinates with animated positions
                uvs.push(x / this.canvas.width, y / this.canvas.height);
            }
            
            newGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        }
        
        // Replace geometry
        piece.geometry.dispose();
        piece.geometry = newGeometry;
        
        // Update neon glow outline to follow animated boundaries
        const neonGlow = this.separateGlowOutlines[index];
        if (neonGlow) {
            this.updateNeonGlowOutline(neonGlow, newGeometry, piece.position);
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
        
        // Clean up separate pieces
        this.separatePieces.forEach(piece => {
            if (piece) {
                this.scene.remove(piece);
                piece.geometry.dispose();
                piece.material.dispose();
            }
        });
        this.separatePieces = [];
        
        // Clean up separate outlines
        this.separateOutlines.forEach(outline => {
            if (outline) {
                this.scene.remove(outline);
                outline.geometry.dispose();
                outline.material.dispose();
            }
        });
        this.separateOutlines = [];
        
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
        
        // Update separate piece outline visibility
        this.separateOutlines.forEach(outline => {
            if (outline) {
                outline.visible = this.showGridOutlines;
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
        // Update connected mesh material
        if (this.connectedMesh && this.connectedMesh.material) {
            // Connected mesh uses the background texture, so we don't need to change its color
        }
        
        // Update separate piece materials
        this.separatePieces.forEach((piece, index) => {
            if (piece && piece.material) {
                // Reset to normal state color
                const normalColor = this.getThemeColor('pieceNormal');
                piece.material.color.setHex(normalColor);
                
                // Store original color for state changes
                piece.material.originalColor = piece.material.color.clone();
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
        
        // Update separate outlines
        this.separateOutlines.forEach(outline => {
            if (outline && outline.material) {
                const outlineColor = this.getThemeColor('outlineNormal');
                outline.material.color.setHex(outlineColor);
            }
        });
    }
    
    /**
     * Update background/environment colors
     */
    updateBackgroundColors() {
        // Update WebGL clear color to match theme
        const bgColor = this.getThemeColor('background', 0x111111);
        this.renderer.setClearColor(bgColor, 1.0);
    }
    
    // Helper method to find piece at screen coordinates
    findPieceAtPosition(x, y) {
        // Convert canvas coordinates to normalized device coordinates
        // Canvas: Y=0 at top, Y=height at bottom
        // WebGL: Y=-1 at bottom, Y=+1 at top
        const mouse = new THREE.Vector2(
            (x / this.canvas.width) * 2 - 1,
            -((y / this.canvas.height) * 2 - 1)  // Flip Y-axis for WebGL
        );
        
        console.log(`🎯 Canvas coords: (${x}, ${y}) → NDC: (${mouse.x.toFixed(3)}, ${mouse.y.toFixed(3)})`);
        
        // Create raycaster with more generous settings
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        // Make raycaster more generous for better hit detection
        raycaster.params.Points.threshold = 10;
        raycaster.params.Line.threshold = 5;
        
        // First check separate pieces (they have higher priority)
        // Sort by z-index (highest first) for proper hit detection
        const separatePieces = this.separatePieces
            .map((piece, index) => ({ piece, index }))
            .filter(({ piece }) => piece !== null)
            .sort((a, b) => {
                const aZ = this.pieceZIndices[a.index] || 0;
                const bZ = this.pieceZIndices[b.index] || 0;
                return bZ - aZ; // Highest z-index first
            });
        
        for (const { piece, index } of separatePieces) {
            const intersects = raycaster.intersectObject(piece);
            if (intersects.length > 0) {
                console.log(`🎯 WebGL hit: separate piece ${index} (z-index: ${this.pieceZIndices[index]})`);
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
                    // Return piece if visible, or slot if empty (for slot hover)
                    if (this.slotStates[pieceIndex] === 'filled') {
                        console.log(`🎯 WebGL hit: connected piece ${pieceIndex}`);
                        return pieceIndex;
                    } else {
                        console.log(`🎯 WebGL hit: empty slot ${pieceIndex}`);
                        return { type: 'slot', index: pieceIndex }; // Return slot info
                    }
                }
            }
        }
        
        return -1;
    }
    
    // Helper to find which Voronoi piece contains a given point
    findPieceIndexAtPoint(x, y) {
        for (let i = 0; i < this.voronoiPolygons.length; i++) {
            if (VoronoiUtils.pointInPolygon(x, y, this.voronoiPolygons[i])) {
                return i;
            }
        }
        return -1;
    }
}

// Export for use in main script
window.WebGLVoronoiRenderer = WebGLVoronoiRenderer;
window.isWebGLSupported = isWebGLSupported;
