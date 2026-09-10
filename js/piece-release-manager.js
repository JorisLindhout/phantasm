/**
 * Staged piece release — pool state and "+" button wiring.
 */

import {
    calculateReleaseBatchSize,
    polygonRadius,
    scatterPiece,
    shuffleIndices,
} from './unsolved-layout.js';
import { polygonCenter } from './polygon-geometry.js';
import { playReleaseSound } from './snap-sound.js';
import { unlockAndStartBed } from './drone-sound.js';

class PieceReleaseManager {
    constructor() {
        this.pool = [];
        this.placedCenters = [];
        this.button = null;
    }

    /**
     * @param {HTMLButtonElement | null} [button]
     */
    bindButton(button = document.getElementById('releasePiecesBtn')) {
        this.button = button;

        if (!this.button || this.button.dataset.bound === 'true') {
            return;
        }

        this.button.dataset.bound = 'true';
        this.button.addEventListener('click', () => {
            if (window.levelTransitionManager?.isTransitioning) {
                return;
            }

            unlockAndStartBed();

            const renderer = window.voronoiPuzzle?.webglRenderer;
            if (renderer) {
                this.releaseNextBatch(renderer, { playSound: true });
            }
        });
    }

    /**
     * @param {number} pieceCount
     */
    reset(pieceCount) {
        this.pool = shuffleIndices(Array.from({ length: pieceCount }, (_, index) => index));
        this.placedCenters = [];
        this.updateButtonVisibility();
    }

    /**
     * Keep the release pool aligned with pieces that were never released.
     * @param {object | null | undefined} webglRenderer
     */
    reconcilePool(webglRenderer) {
        if (!webglRenderer?.pieces?.length) {
            return;
        }

        const unreleased = webglRenderer.pieces
            .map((piece, index) => (!piece.released ? index : null))
            .filter((index) => index !== null);

        const unreleasedSet = new Set(unreleased);
        this.pool = this.pool.filter((index) => unreleasedSet.has(index));

        for (const index of unreleased) {
            if (!this.pool.includes(index)) {
                this.pool.push(index);
            }
        }
    }

    /**
     * @param {object} webglRenderer
     * @returns {number}
     */
    countUnreleased(webglRenderer) {
        if (!webglRenderer?.pieces?.length) {
            return this.pool.length;
        }

        return webglRenderer.pieces.filter((piece) => !piece.released).length;
    }

    /**
     * @param {object} webglRenderer
     * @returns {number}
     */
    releaseInitialBatch(webglRenderer) {
        return this.releaseNextBatch(webglRenderer, { playSound: false });
    }

    /**
     * @param {object} webglRenderer
     * @param {{ playSound?: boolean }} [options]
     * @returns {number}
     */
    releaseNextBatch(webglRenderer, { playSound = false } = {}) {
        if (!webglRenderer || window.levelTransitionManager?.isTransitioning) {
            this.updateButtonVisibility();
            return 0;
        }

        this.reconcilePool(webglRenderer);

        if (this.pool.length === 0) {
            webglRenderer.recoverOffscreenLoosePieces?.();
            this.updateButtonVisibility(webglRenderer);
            return 0;
        }

        const stageDisplayWidth = this.getStageDisplayWidth(webglRenderer.canvas);
        const releaseConfig = window.levelManager?.getCurrentLevel()?.release ?? null;
        const batchSize = Math.min(
            calculateReleaseBatchSize(stageDisplayWidth, releaseConfig),
            this.pool.length
        );

        const stageSize = {
            width: webglRenderer.canvas.width,
            height: webglRenderer.canvas.height,
        };

        let releasedCount = 0;

        for (let i = 0; i < batchSize; i++) {
            const pieceIndex = this.pool.shift();
            if (pieceIndex === undefined) break;

            const polygon = webglRenderer.voronoiPolygons[pieceIndex];
            if (!polygon) {
                this.pool.push(pieceIndex);
                continue;
            }

            const offset = scatterPiece({
                polygon,
                stageSize,
                existingPlacements: this.placedCenters,
            });

            webglRenderer.releasePiece(pieceIndex, offset);
            window.voronoiPuzzle?.currentRenderer?.bringPieceToFront?.(pieceIndex);

            const { centerX, centerY } = polygonCenter(polygon);
            this.placedCenters.push({
                x: centerX + offset.x,
                y: centerY + offset.y,
                radius: polygonRadius(polygon),
            });

            releasedCount++;
        }

        webglRenderer.recoverOffscreenLoosePieces?.();
        this.updateButtonVisibility(webglRenderer);

        if (playSound && releasedCount > 0) {
            playReleaseSound();
        }

        return releasedCount;
    }

    /**
     * @param {HTMLCanvasElement | null | undefined} canvas
     * @returns {number}
     */
    getStageDisplayWidth(canvas) {
        const stage = canvas?.closest('.stage');
        if (stage) {
            return stage.getBoundingClientRect().width;
        }

        return canvas?.clientWidth ?? 450;
    }

    /**
     * @param {object | null | undefined} [webglRenderer]
     */
    updateButtonVisibility(webglRenderer = null) {
        if (!this.button) return;

        if (window.levelTransitionManager?.isTransitioning) {
            this.button.hidden = true;
            this.button.disabled = true;
            this.button.setAttribute('aria-hidden', 'true');
            return;
        }

        const renderer = webglRenderer ?? window.voronoiPuzzle?.webglRenderer ?? null;

        if (renderer) {
            this.reconcilePool(renderer);
        }

        const remaining = renderer ? this.countUnreleased(renderer) : this.pool.length;
        const hasRemaining = remaining > 0;

        this.button.hidden = !hasRemaining;
        this.button.setAttribute('aria-hidden', hasRemaining ? 'false' : 'true');
        this.button.disabled = !hasRemaining;
    }

    /**
     * @returns {number}
     */
    getRemainingCount() {
        const renderer = window.voronoiPuzzle?.webglRenderer;
        return renderer ? this.countUnreleased(renderer) : this.pool.length;
    }
}

const pieceReleaseManager = new PieceReleaseManager();

export { PieceReleaseManager, pieceReleaseManager };

if (typeof window !== 'undefined') {
    window.pieceReleaseManager = pieceReleaseManager;
}
