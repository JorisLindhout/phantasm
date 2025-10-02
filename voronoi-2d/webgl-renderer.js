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
        this.pieceZIndices = []; // Z-index for each piece
        this.separatePiecesMode = false;
        this.pieceOffsets = []; // Track which pieces are moved
        
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
        this.renderer.autoClear = true; // Ensure complete clearing each frame
        
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
            uvs.push(centerX / this.canvas.width, centerY / this.canvas.height);
            
            // Add polygon vertices
            for (let i = 0; i < polygon.length; i++) {
                vertices.push(polygon[i][0], polygon[i][1], 0);
                uvs.push(polygon[i][0] / this.canvas.width, polygon[i][1] / this.canvas.height);
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
        
        // Create material
        const material = new THREE.MeshBasicMaterial({
            map: this.backgroundTexture,
            transparent: true,
            opacity: 1.0,
            side: THREE.DoubleSide
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
            color: 0x00ddff,
            transparent: true,
            opacity: 0.6, // Slightly more transparent to match 2D version
            linewidth: 1
        });
        
        // Create outline mesh
        this.connectedOutline = new THREE.LineSegments(boundaryGeometry, outlineMaterial);
        this.connectedOutline.position.z = 0.1; // Slightly above the main mesh
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
    
    // Create boundary geometry for a single separate piece
    createSeparatePieceBoundaryGeometry(polygon) {
        const vertices = [];
        
        // Create lines for each edge of the polygon
        for (let i = 0; i < polygon.length; i++) {
            const current = polygon[i];
            const next = polygon[(i + 1) % polygon.length];
            
            // Add line segment
            vertices.push(current[0], current[1], 0);
            vertices.push(next[0], next[1], 0);
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
            this.createSeparatePiece(index, offset);
        } else {
            // Remove separate piece if it exists (piece snapped back)
            this.removeSeparatePiece(index);
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
        
        // Create material
        const material = new THREE.MeshBasicMaterial({
            map: this.backgroundTexture,
            transparent: true,
            opacity: 1.0,
            side: THREE.DoubleSide
        });
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = offset.x;
        mesh.position.y = -offset.y; // Flip Y for camera
        mesh.position.z = this.pieceZIndices[index] * 10;
        
        // Create outline for separate piece (boundary only)
        const boundaryGeometry = this.createSeparatePieceBoundaryGeometry(polygon);
        const outlineMaterial = new THREE.LineBasicMaterial({
            color: 0xff4444, // Red outline for dragged pieces
            transparent: true,
            opacity: 0.8,
            linewidth: 1
        });
        
        const outline = new THREE.LineSegments(boundaryGeometry, outlineMaterial);
        outline.position.copy(mesh.position);
        outline.position.z += 0.1; // Slightly above the piece
        
        // Store and add to scene
        this.separatePieces[index] = mesh;
        this.separateOutlines[index] = outline;
        this.scene.add(mesh);
        this.scene.add(outline);
        
        console.log(`✅ Created separate piece ${index} at offset (${offset.x}, ${offset.y})`);
    }
    
    removeSeparatePiece(index) {
        const piece = this.separatePieces[index];
        const outline = this.separateOutlines[index];
        
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
        
        if (piece || outline) {
            console.log(`🗑️ Removed separate piece ${index}`);
        }
    }
    
    updatePieceVisualState(index, state) {
        // Update visual state for separate pieces
        const separatePiece = this.separatePieces[index];
        const separateOutline = this.separateOutlines[index];
        
        if (separatePiece) {
            this.updateMaterialState(separatePiece.material, state);
        }
        
        if (separateOutline) {
            this.updateOutlineState(separateOutline.material, state);
        }
        
        // For connected pieces, we could add outline effects or other visual feedback
        // This could be implemented later if needed
    }
    
    updateMaterialState(material, state) {
        switch (state) {
            case 'hover':
                material.color.setHex(0xffffff);
                material.opacity = 1.0;
                break;
            case 'dragging':
                material.color.setHex(0xffffff);
                material.opacity = 0.9;
                break;
            case 'snapped':
                material.color.setHex(0xffffff);
                material.opacity = 1.0;
                break;
            case 'normal':
            default:
                material.color.setHex(0xffffff);
                material.opacity = 1.0;
                break;
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
    }
    
    // Create animated path using noise (similar to 2D version)
    createAnimatedPath(originalPolygon, time, amplitude = 10) {
        const animatedPath = [];
        
        for (let i = 0; i < originalPolygon.length; i++) {
            const [x, y] = originalPolygon[i];
            
            // Calculate noise-based offset (simplified noise function)
            const noiseX = Math.sin(time * 0.001 + x * 0.01 + y * 0.005) * amplitude * 0.5;
            const noiseY = Math.cos(time * 0.001 + x * 0.005 + y * 0.01) * amplitude * 0.5;
            
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
            uvs[vertexIndex * 2] = centerX / this.canvas.width;
            uvs[vertexIndex * 2 + 1] = centerY / this.canvas.height;
            vertexIndex++;
            
            // Update polygon vertices
            for (let i = 0; i < animatedPolygon.length; i++) {
                positions[vertexIndex * 3] = animatedPolygon[i][0];
                positions[vertexIndex * 3 + 1] = animatedPolygon[i][1];
                uvs[vertexIndex * 2] = animatedPolygon[i][0] / this.canvas.width;
                uvs[vertexIndex * 2 + 1] = animatedPolygon[i][1] / this.canvas.height;
                vertexIndex++;
            }
        }
        
        // Mark geometry as needing update
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.uv.needsUpdate = true;
        
        // Update connected outline with animated boundaries
        this.updateConnectedOutline(time);
    }
    
    // Update connected outline geometry with animated boundaries
    updateConnectedOutline(time) {
        if (!this.connectedOutline) return;
        
        const vertices = [];
        const edges = new Set(); // Track unique edges to avoid duplicates
        
        for (let pieceIndex = 0; pieceIndex < this.voronoiPolygons.length; pieceIndex++) {
            const originalPolygon = this.voronoiPolygons[pieceIndex];
            if (!originalPolygon || originalPolygon.length < 3) continue;
            
            // Skip pieces that have been moved (they're separate meshes now)
            if (this.separatePieces[pieceIndex]) continue;
            
            // Create animated polygon
            const animatedPolygon = this.createAnimatedPath(originalPolygon, time);
            
            // Create lines for each edge of the animated polygon
            for (let i = 0; i < animatedPolygon.length; i++) {
                const current = animatedPolygon[i];
                const next = animatedPolygon[(i + 1) % animatedPolygon.length];
                
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
        
        // Update outline geometry
        const geometry = this.connectedOutline.geometry;
        const positions = new Float32Array(vertices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.attributes.position.needsUpdate = true;
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
                uvs.push(x / this.canvas.width, y / this.canvas.height);
            }
            
            newGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        }
        
        // Replace geometry
        piece.geometry.dispose();
        piece.geometry = newGeometry;
        
        // Update outline geometry for this separate piece
        const outline = this.separateOutlines[index];
        if (outline) {
            const outlineGeometry = this.createSeparatePieceBoundaryGeometry(animatedPolygon);
            outline.geometry.dispose();
            outline.geometry = outlineGeometry;
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
    
    // Helper method to find piece at screen coordinates
    findPieceAtPosition(x, y) {
        // Convert screen coordinates to normalized device coordinates
        const mouse = new THREE.Vector2(
            (x / this.canvas.width) * 2 - 1,
            (y / this.canvas.height) * 2 - 1
        );
        
        // Create raycaster
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        // First check separate pieces (they have higher priority)
        const separatePieces = this.separatePieces.filter(p => p !== null);
        if (separatePieces.length > 0) {
            const separateIntersects = raycaster.intersectObjects(separatePieces);
            if (separateIntersects.length > 0) {
                // Find the piece index for the intersected mesh
                for (let i = 0; i < this.separatePieces.length; i++) {
                    if (this.separatePieces[i] === separateIntersects[0].object) {
                        console.log(`🎯 WebGL hit: separate piece ${i}`);
                        return i;
                    }
                }
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
                    console.log(`🎯 WebGL hit: connected piece ${pieceIndex}`);
                    return pieceIndex;
                }
            }
        }
        
        return -1;
    }
    
    // Helper to find which Voronoi piece contains a given point
    findPieceIndexAtPoint(x, y) {
        for (let i = 0; i < this.voronoiPolygons.length; i++) {
            if (this.pointInPolygon(x, y, this.voronoiPolygons[i])) {
                return i;
            }
        }
        return -1;
    }
    
    // Point-in-polygon test using ray casting algorithm
    pointInPolygon(x, y, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (((polygon[i][1] > y) !== (polygon[j][1] > y)) &&
                (x < (polygon[j][0] - polygon[i][0]) * (y - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0])) {
                inside = !inside;
            }
        }
        return inside;
    }
}

// Export for use in main script
window.WebGLVoronoiRenderer = WebGLVoronoiRenderer;
window.isWebGLSupported = isWebGLSupported;
