/**
 * Level transitions — automatic crossfade between levels and completion overlay.
 */

import { announce, prefersReducedMotion } from './accessibility.js';
import { getLevelById } from './levels.config.js';

export const SOLVED_HOLD_MS = 2000;
export const CROSSFADE_MS = 800;
const REDUCED_MOTION_FADE_MS = 200;

class LevelTransitionManager {
    constructor() {
        this.completionOverlay = null;
        this.isTransitioning = false;
    }

    init() {
        this.completionOverlay = document.getElementById('completionOverlay');

        const playAgainBtn = document.getElementById('playAgainBtn');
        playAgainBtn?.addEventListener('click', () => this.handlePlayAgain());
    }

    /**
     * Automatic crossfade from solved level to the next.
     * @param {string} completedLevelId
     * @param {string} nextLevelId
     */
    async runAutoTransition(completedLevelId, nextLevelId) {
        if (this.isTransitioning) return;

        this.isTransitioning = true;

        const reducedMotion = prefersReducedMotion();
        const holdMs = reducedMotion ? 0 : SOLVED_HOLD_MS;
        const fadeMs = reducedMotion ? REDUCED_MOTION_FADE_MS : CROSSFADE_MS;

        try {
            const puzzle = window.voronoiPuzzle;
            if (!puzzle || !window.levelManager) {
                throw new Error('Puzzle or level manager not available');
            }

            puzzle.currentRenderer?.freezeForHold?.();
            this.blockInput();
            document.documentElement.style.setProperty('--crossfade-duration', `${fadeMs}ms`);

            await Promise.all([
                this.delay(holdMs),
                window.levelManager.preloadLevelForTransition(nextLevelId),
            ]);

            await this.fadeOutOutgoingCanvas(puzzle, fadeMs);
            await window.levelManager.finalizeLevelTransition();

            // Clear before piece release — releaseNextBatch and updateButtonVisibility no-op while transitioning
            this.isTransitioning = false;

            const renderer = puzzle.webglRenderer;
            if (renderer && window.pieceReleaseManager) {
                window.pieceReleaseManager.releaseInitialBatch(renderer);
                renderer.recoverOffscreenLoosePieces?.();
                window.pieceReleaseManager.updateButtonVisibility(renderer);
            }

            this.unblockInput();

            const nextLevel = getLevelById(nextLevelId);
            announce(nextLevel ? `${nextLevel.name} ready.` : 'Next level ready.');
        } catch (error) {
            console.error('Level transition failed:', error);
            await window.levelManager?.abortLevelTransition?.();
            this.unblockInput();
            announce('Failed to load next level.', 'assertive');
        } finally {
            this.isTransitioning = false;
        }
    }

    async showCompletion() {
        if (this.isTransitioning || !this.completionOverlay) return;

        this.isTransitioning = true;

        await this.playCelebration();

        this.completionOverlay.hidden = false;
        this.completionOverlay.classList.add('visible');
        announce('Phantasm complete.', 'assertive');
    }

    async playCelebration() {
        const stage = document.querySelector('.stage');
        if (!stage || prefersReducedMotion()) {
            return;
        }

        stage.classList.add('level-celebrating');
        await this.delay(1200);
        stage.classList.remove('level-celebrating');
    }

    async handlePlayAgain() {
        if (!window.levelManager) {
            this.hideCompletionOverlay();
            return;
        }

        const playAgainBtn = document.getElementById('playAgainBtn');
        if (playAgainBtn) {
            playAgainBtn.disabled = true;
        }

        try {
            window.levelManager.resetProgression();
            await window.levelManager.setLevel('level-1', { silent: true });
        } finally {
            this.hideCompletionOverlay();
            if (playAgainBtn) {
                playAgainBtn.disabled = false;
            }
        }
    }

    blockInput() {
        const stage = document.querySelector('.stage');
        stage?.classList.add('transition-locked', 'transition-hold');

        const releaseBtn = document.getElementById('releasePiecesBtn');
        if (releaseBtn) {
            releaseBtn.hidden = true;
            releaseBtn.disabled = true;
        }
    }

    unblockInput() {
        const stage = document.querySelector('.stage');
        stage?.classList.remove('transition-locked', 'transition-hold');

        const releaseBtn = document.getElementById('releasePiecesBtn');
        if (releaseBtn) {
            releaseBtn.disabled = false;
        }
    }

    /**
     * @param {object} puzzle
     * @param {number} fadeMs
     */
    async fadeOutOutgoingCanvas(puzzle, fadeMs) {
        const canvas = puzzle.outgoingRenderer?.webglRenderer?.canvas;
        if (!canvas) return;

        await new Promise((resolve) => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                canvas.removeEventListener('transitionend', onTransitionEnd);
                resolve();
            };

            const onTransitionEnd = (event) => {
                if (event.target === canvas && event.propertyName === 'opacity') {
                    finish();
                }
            };

            canvas.addEventListener('transitionend', onTransitionEnd);
            requestAnimationFrame(() => {
                canvas.classList.add('is-fading');
            });
            setTimeout(finish, fadeMs + 100);
        });
    }

    /**
     * @param {number} ms
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    hideCompletionOverlay() {
        this.completionOverlay?.classList.remove('visible');
        if (this.completionOverlay) {
            this.completionOverlay.hidden = true;
        }
        this.isTransitioning = false;
    }
}

const levelTransitionManager = new LevelTransitionManager();

export { LevelTransitionManager, levelTransitionManager };

if (typeof window !== 'undefined') {
    window.levelTransitionManager = levelTransitionManager;
}
