/**
 * Shared base classes for Phantasm (WebGL puzzle controller)
 */

import { SNAP_THRESHOLD, SOLVE_THRESHOLD, DEFAULT_CELL_COUNT } from './constants.js';
import { LEVEL_HEIGHT, LEVEL_WIDTH } from './stage-constants.js';

class VoronoiConfig {
    constructor() {
        this.cellCount = DEFAULT_CELL_COUNT;
        this.animationSpeed = 1.0;
        this.noiseAmplitude = 10;
        this.morphIntervalMs = 3500;
        this.isAnimating = true;
        this.time = 0;
    }
}

class VoronoiPuzzleBase {
    constructor() {
        this.canvas = document.getElementById('voronoiCanvas');
        this.config = new VoronoiConfig();

        this.voronoi = null;
        this.points = [];
        this.backgroundImage = null;
        this.animationId = null;

        this.isDragging = false;
        this.draggedCellIndex = -1;
        this.dragOffset = { x: 0, y: 0 };
        this.originalPoints = [];
        this.snapThreshold = SNAP_THRESHOLD;
        this.scaleFactor = 1.1;

        this.separatePieces = true;
        this.piecePositions = [];

        this.pieceZIndex = [];
        this.snappedPieces = new Set();
        this.snapAnimationTime = 0;
        this.hoveredPiece = -1;

        this.isSolved = false;
        this.solveThreshold = SOLVE_THRESHOLD;

        this.eventListeners = [];
    }

    async loadBackgroundImage() {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.backgroundImage = img;
                resolve();
            };
            img.onerror = reject;
            img.src = window.themeManager ? window.themeManager.getCurrentBaseImage() : './assets/Level-1.svg';
        });
    }

    setupCanvas(options = {}) {
        if (window.responsiveCanvas) {
            window.responsiveCanvas.setupStage(this.canvas, options);
        } else {
            this.setupFixedCanvas();
        }

        this.canvas.style.display = 'block';
        this.canvas.style.cursor = 'grab';
    }

    setupFixedCanvas() {
        const baseWidth = 1200;
        const baseHeight = Math.floor(baseWidth / (LEVEL_WIDTH / LEVEL_HEIGHT));

        this.canvas.width = baseWidth;
        this.canvas.height = baseHeight;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
    }

    generateVoronoi() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        this.points = [];
        for (let i = 0; i < this.config.cellCount; i++) {
            this.points.push([
                Math.random() * width,
                Math.random() * height
            ]);
        }

        if (typeof d3 !== 'undefined' && d3.Delaunay) {
            this.voronoi = d3.Delaunay.from(this.points).voronoi([0, 0, width, height]);
        } else if (typeof Delaunay !== 'undefined') {
            this.voronoi = Delaunay.from(this.points).voronoi([0, 0, width, height]);
        } else {
            this.voronoi = this.createFallbackVoronoi();
        }
    }

    createFallbackVoronoi() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const cellCount = this.config.cellCount;
        const cols = Math.ceil(Math.sqrt(cellCount));
        const rows = Math.ceil(cellCount / cols);

        const cellWidth = width / cols;
        const cellHeight = height / rows;

        const cells = [];
        for (let i = 0; i < cellCount; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = col * cellWidth;
            const y = row * cellHeight;

            cells.push({
                polygon: [
                    [x, y],
                    [x + cellWidth, y],
                    [x + cellWidth, y + cellHeight],
                    [x, y + cellHeight]
                ]
            });
        }

        return {
            cellPolygons: () => cells.map(cell => cell.polygon)
        };
    }

    setupControls() {
        const cellCountSlider = document.getElementById('cellCount');
        const cellCountValue = document.getElementById('cellCountValue');
        if (cellCountSlider && cellCountValue) {
            this.addEventListener(cellCountSlider, 'input', (e) => {
                this.config.cellCount = parseInt(e.target.value, 10);
                cellCountValue.textContent = e.target.value;
                e.target.setAttribute('aria-valuenow', e.target.value);
                e.target.setAttribute('aria-valuetext', e.target.value);

                if (typeof this.regeneratePuzzle === 'function') {
                    this.regeneratePuzzle();
                } else {
                    this.generateVoronoi();
                    this.originalPoints = [...this.points];
                }
            });
        }

        const animationSpeedSlider = document.getElementById('animationSpeed');
        const animationSpeedValue = document.getElementById('animationSpeedValue');
        if (animationSpeedSlider && animationSpeedValue) {
            this.addEventListener(animationSpeedSlider, 'input', (e) => {
                this.config.animationSpeed = parseFloat(e.target.value);
                animationSpeedValue.textContent = e.target.value;
            });
        }

        const noiseAmplitudeSlider = document.getElementById('noiseAmplitude');
        const noiseAmplitudeValue = document.getElementById('noiseAmplitudeValue');
        if (noiseAmplitudeSlider && noiseAmplitudeValue) {
            this.addEventListener(noiseAmplitudeSlider, 'input', (e) => {
                this.config.noiseAmplitude = parseInt(e.target.value, 10);
                noiseAmplitudeValue.textContent = e.target.value;
                e.target.setAttribute('aria-valuenow', e.target.value);
                e.target.setAttribute('aria-valuetext', e.target.value);

                if (this.webglRenderer && this.webglRenderer.updateConfig) {
                    this.webglRenderer.updateConfig({ noiseAmplitude: this.config.noiseAmplitude });
                }
            });
        }

        const morphIntervalSlider = document.getElementById('morphInterval');
        const morphIntervalValue = document.getElementById('morphIntervalValue');
        if (morphIntervalSlider && morphIntervalValue) {
            this.addEventListener(morphIntervalSlider, 'input', (e) => {
                this.config.morphIntervalMs = parseInt(e.target.value, 10);
                morphIntervalValue.textContent = e.target.value;
                e.target.setAttribute('aria-valuenow', e.target.value);
                e.target.setAttribute('aria-valuetext', `${e.target.value} milliseconds`);

                if (this.webglRenderer && this.webglRenderer.updateConfig) {
                    this.webglRenderer.updateConfig({ morphIntervalMs: this.config.morphIntervalMs });
                }
            });
        }
    }

    setupDragAndDrop() {
        this.originalPoints = [...this.points];

        if (this.separatePieces) {
            if (!this.pieceZIndex || this.pieceZIndex.length !== this.points.length) {
                this.pieceZIndex = new Array(this.points.length).fill(0);
            }
        }
    }

    startAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        const animate = () => {
            if (this.config.isAnimating) {
                this.render();
                this.config.time += 0.01 * this.config.animationSpeed;
                this.snapAnimationTime += 0.02;
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.animationId = null;
            }
        };

        if (this.config.isAnimating) {
            this.animationId = requestAnimationFrame(animate);
        }
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    bringPieceToFront(cellIndex) {
        if (!this.pieceZIndex) {
            const length = this.points?.length ?? 0;
            if (length === 0) return;
            this.pieceZIndex = new Array(length).fill(0);
        }

        const maxZIndex = Math.max(...this.pieceZIndex, 0);
        this.pieceZIndex[cellIndex] = maxZIndex + 1;

        if (maxZIndex > 25) {
            this.normalizeZIndices();
        }
    }

    normalizeZIndices() {
        if (!this.pieceZIndex?.length) return;

        const maxZ = Math.max(...this.pieceZIndex, 0);

        if (maxZ > 100) {
            const sortedIndices = this.pieceZIndex
                .map((z, index) => ({ z, index }))
                .sort((a, b) => b.z - a.z);

            sortedIndices.forEach((item, newZ) => {
                this.pieceZIndex[item.index] = newZ;
            });

            if (this.webglRenderer && this.webglRenderer.updatePieceZIndex) {
                for (let i = 0; i < this.pieceZIndex.length; i++) {
                    this.webglRenderer.updatePieceZIndex(i, this.pieceZIndex[i]);
                }
            }
        }
    }

    regeneratePuzzle() {
        this.generateVoronoi();
        this.originalPoints = [...this.points];

        if (this.separatePieces) {
            if (!this.pieceZIndex || this.pieceZIndex.length !== this.points.length) {
                this.pieceZIndex = new Array(this.points.length).fill(0);
            }
            if (!this.snappedPieces) {
                this.snappedPieces = new Set();
            } else {
                this.snappedPieces.clear();
            }
        }
    }

    toggleAnimation() {
        this.config.isAnimating = !this.config.isAnimating;

        if (this.config.isAnimating) {
            this.startAnimation();
        } else if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        const button = document.querySelector('[data-action="toggle-animation"]');
        if (button) {
            button.textContent = this.config.isAnimating ? 'Pause Animation' : 'Start Animation';
        }
    }

    checkSolvedState() {
        return this.isSolved || false;
    }

    onSolvedStateChanged(isSolved) {
        const container = this.canvas.parentElement;
        if (container) {
            if (isSolved) {
                container.classList.add('puzzle-solved');
            } else {
                container.classList.remove('puzzle-solved');
            }
        }
    }

    updateCanvasOutline(_isSolved) {
        this.canvas.style.border = 'none';
        this.canvas.style.boxShadow = 'none';
    }

    addEventListener(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        this.eventListeners.push({ element, event, handler, options });
    }

    removeAllEventListeners() {
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.eventListeners = [];
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.removeAllEventListeners();

        this.pieces = null;
        this.slots = null;
        this.pieceZIndex = null;
        this.snappedPieces = null;
        this.backgroundImage = null;
        this.voronoi = null;
        this.points = null;
        this.originalPoints = null;
    }

    render() {
        throw new Error('render() method must be implemented by subclass');
    }

    findCellAtPosition(x, y) {
        throw new Error('findCellAtPosition() method must be implemented by subclass');
    }

    handleMouseDown(e) {
        throw new Error('handleMouseDown() method must be implemented by subclass');
    }

    handleMouseMove(e) {
        throw new Error('handleMouseMove() method must be implemented by subclass');
    }

    handleMouseUp(e) {
        throw new Error('handleMouseUp() method must be implemented by subclass');
    }

    handleMouseLeave(e) {
        throw new Error('handleMouseLeave() method must be implemented by subclass');
    }
}

window.VoronoiConfig = VoronoiConfig;
window.VoronoiPuzzleBase = VoronoiPuzzleBase;
