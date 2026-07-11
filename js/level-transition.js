/**
 * Level-complete and game-complete overlays (Phantasm Bloom).
 */

import { announce, prefersReducedMotion } from './accessibility.js';
import { getLevelById } from './levels.config.js';

class LevelTransitionManager {
    constructor() {
        this.transitionOverlay = null;
        this.completionOverlay = null;
        this.isTransitioning = false;
        this.pendingNextLevelId = null;
    }

    init() {
        this.transitionOverlay = document.getElementById('levelTransitionOverlay');
        this.completionOverlay = document.getElementById('completionOverlay');

        const continueBtn = this.transitionOverlay?.querySelector('.transition-continue');
        continueBtn?.addEventListener('click', () => this.handleContinue());

        const playAgainBtn = document.getElementById('playAgainBtn');
        playAgainBtn?.addEventListener('click', () => this.handlePlayAgain());
    }

    /**
     * @param {string} completedLevelId
     * @param {string} nextLevelId
     */
    async showLevelComplete(completedLevelId, nextLevelId) {
        if (this.isTransitioning || !this.transitionOverlay) return;

        this.isTransitioning = true;
        this.pendingNextLevelId = nextLevelId;

        const completed = getLevelById(completedLevelId);
        const title = this.transitionOverlay.querySelector('.transition-title');
        if (title) {
            title.textContent = `${completed?.name ?? 'Level'} complete`;
        }

        await this.playCelebration();

        this.transitionOverlay.hidden = false;
        this.transitionOverlay.classList.add('visible');
        announce(`${completed?.name ?? 'Level'} complete. Press Continue for the next level.`, 'assertive');
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
        await new Promise((resolve) => setTimeout(resolve, 1200));
        stage.classList.remove('level-celebrating');
    }

    async handleContinue() {
        const nextLevelId = this.pendingNextLevelId;
        if (!nextLevelId || !window.levelManager) {
            this.hideTransitionOverlay();
            return;
        }

        const continueBtn = this.transitionOverlay?.querySelector('.transition-continue');
        if (continueBtn) {
            continueBtn.disabled = true;
        }

        try {
            await window.levelManager.setLevel(nextLevelId, { silent: true });
        } finally {
            this.hideTransitionOverlay();
            if (continueBtn) {
                continueBtn.disabled = false;
            }
        }
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

    hideTransitionOverlay() {
        this.transitionOverlay?.classList.remove('visible');
        if (this.transitionOverlay) {
            this.transitionOverlay.hidden = true;
        }
        this.pendingNextLevelId = null;
        this.isTransitioning = false;
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
