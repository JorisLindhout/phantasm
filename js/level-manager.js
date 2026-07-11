/**
 * Level Manager
 *
 * Handles level switching with complete reinitialization approach.
 * This ensures clean state and avoids coordinate system conflicts.
 */

import { resolveLevelConfig } from './animated-path.js';
import {
    LEVEL_MANIFEST,
    getNextLevelId,
    isFinalLevel,
    loadUnlockedLevelIds,
    saveUnlockedLevelIds,
    unlockLevelId,
    manifestEntryToLevelConfig,
    getLevelById,
} from './levels.config.js';

class LevelManager {
    constructor() {
        this.initializeLevelConfigurations();
        this.currentLevel = 'level-1';
        this.puzzle = null;
        this.isChangingLevel = false;
        this.isHandlingSolve = false;
        this.pendingLevelId = null;
        this.unlockedLevelIds = loadUnlockedLevelIds();

        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.querySelector('#loadingOverlay .loading-text');
        this.loadingBar = document.querySelector('#loadingOverlay .loading-bar');
    }

    initializeLevelConfigurations() {
        this.levelConfigurations = {};

        for (const entry of LEVEL_MANIFEST) {
            this.levelConfigurations[entry.id] = manifestEntryToLevelConfig(entry);
        }
    }

    /**
     * Apply level 1 theme and selector before the puzzle initializes.
     */
    prepareForStartup() {
        this.currentLevel = 'level-1';

        const levelConfig = this.getCurrentLevel();
        if (levelConfig && window.themeManager) {
            window.themeManager.applyTheme(levelConfig.theme);
        }

        this.rebuildLevelSelector();
    }

    /**
     * Attach puzzle reference and sync config after startup.
     */
    init(puzzle) {
        this.puzzle = puzzle;
        console.log(`🎮 Level Manager initialized with level: ${this.currentLevel}`);
        this.syncPuzzleConfig();
    }

    /**
     * Sync puzzle config from current level without reinitialization.
     */
    syncPuzzleConfig() {
        const levelConfig = this.getCurrentLevel();
        if (!levelConfig || !this.puzzle) return;

        const resolved = resolveLevelConfig(levelConfig);
        this.puzzle.config.cellCount = resolved.cellCount;
        this.puzzle.config.animationSpeed = resolved.animationSpeed;
        this.puzzle.config.noiseAmplitude = resolved.noiseAmplitude;
    }

    /**
     * Get current level configuration
     */
    getCurrentLevel() {
        return this.levelConfigurations[this.currentLevel];
    }

    /**
     * @param {string} levelId
     * @returns {boolean}
     */
    isLevelUnlocked(levelId) {
        const entry = getLevelById(levelId);
        if (!entry) return false;
        if (entry.unlockedByDefault) return true;
        return this.unlockedLevelIds.includes(levelId);
    }

    /**
     * @param {string} levelId
     * @returns {boolean}
     */
    canSelectLevel(levelId) {
        if (import.meta.env.DEV) return true;
        return this.isLevelUnlocked(levelId);
    }

    /**
     * @param {string} levelId
     */
    unlockLevel(levelId) {
        const next = unlockLevelId(levelId, this.unlockedLevelIds);
        if (next.length === this.unlockedLevelIds.length) return;

        this.unlockedLevelIds = next;
        saveUnlockedLevelIds(this.unlockedLevelIds);
        this.rebuildLevelSelector();
        console.log(`🔓 Unlocked level: ${levelId}`);
    }

    resetProgression() {
        this.unlockedLevelIds = [];
        saveUnlockedLevelIds(this.unlockedLevelIds);
        this.rebuildLevelSelector();
    }

    /**
     * Called when the puzzle is solved — triggers transition or completion.
     */
    handlePuzzleSolved() {
        if (this.isHandlingSolve || this.isChangingLevel) return;
        if (window.levelTransitionManager?.isTransitioning) return;

        this.isHandlingSolve = true;

        try {
            const currentConfig = this.getCurrentLevel();
            if (!currentConfig) return;

            if (isFinalLevel(this.currentLevel)) {
                window.levelTransitionManager?.showCompletion();
                return;
            }

            const nextLevelId = getNextLevelId(this.currentLevel);
            if (!nextLevelId) return;

            this.unlockLevel(nextLevelId);
            window.levelTransitionManager?.runAutoTransition(this.currentLevel, nextLevelId);
        } finally {
            this.isHandlingSolve = false;
        }
    }

    /**
     * Set level with complete reinitialization
     * @param {string} levelId
     * @param {{ silent?: boolean }} [options]
     */
    async setLevel(levelId, options = {}) {
        if (this.isChangingLevel) {
            console.log(`⚠️ Level change already in progress, ignoring request for: ${levelId}`);
            return false;
        }

        if (!this.levelConfigurations[levelId]) {
            console.error(`Level "${levelId}" not found`);
            return false;
        }

        if (!this.canSelectLevel(levelId)) {
            console.warn(`Level "${levelId}" is locked`);
            return false;
        }

        const levelConfig = this.levelConfigurations[levelId];
        console.log(`🎮 Switching to ${levelConfig.name}`);

        this.isChangingLevel = true;

        try {
            if (!options.silent) {
                this.showLoadingScreen(`Loading ${levelConfig.name}...`);
            }

            await this.completeReinitialization(levelConfig);

            this.currentLevel = levelId;
            this.rebuildLevelSelector();
            this.saveLevelPreference(levelId);

            if (!options.silent) {
                this.hideLoadingScreen();
            }

            console.log(`✅ Successfully switched to ${levelConfig.name}`);
            return true;
        } catch (error) {
            console.error('Failed to switch level:', error);
            if (!options.silent) {
                this.hideLoadingScreen();
            }
            return false;
        } finally {
            setTimeout(() => {
                this.isChangingLevel = false;
            }, 500);
        }
    }

    /**
     * Preload the next level behind the outgoing solved canvas.
     * @param {string} levelId
     */
    async preloadLevelForTransition(levelId) {
        if (!this.levelConfigurations[levelId]) {
            throw new Error(`Level "${levelId}" not found`);
        }

        if (!this.canSelectLevel(levelId)) {
            throw new Error(`Level "${levelId}" is locked`);
        }

        if (!this.puzzle) {
            throw new Error('Puzzle not initialized');
        }

        const levelConfig = this.levelConfigurations[levelId];
        console.log(`🔄 Preloading ${levelConfig.name} for transition`);

        const resolved = resolveLevelConfig(levelConfig);
        this.puzzle.config.cellCount = resolved.cellCount;
        this.puzzle.config.animationSpeed = resolved.animationSpeed;
        this.puzzle.config.noiseAmplitude = resolved.noiseAmplitude;

        this.isChangingLevel = true;
        this.pendingLevelId = levelId;

        if (window.themeManager) {
            window.themeManager.applyTheme(levelConfig.theme);
        }

        await this.puzzle.initializeRenderer({
            preserveOutgoing: true,
            deferPieceRelease: true,
        });

        console.log(`✅ Preload ready for ${levelConfig.name}`);
    }

    /**
     * Dispose outgoing renderer and commit the preloaded level.
     */
    async finalizeLevelTransition() {
        if (!this.puzzle) {
            throw new Error('Puzzle not initialized');
        }

        if (this.puzzle.outgoingRenderer) {
            this.puzzle.outgoingRenderer.dispose?.();
            this.puzzle.outgoingRenderer = null;
        }

        if (this.pendingLevelId) {
            this.currentLevel = this.pendingLevelId;
            this.pendingLevelId = null;
            this.rebuildLevelSelector();
            this.saveLevelPreference(this.currentLevel);
        }

        if (window.themeManager) {
            window.themeManager.init(this.puzzle.webglRenderer);
        }

        this.isChangingLevel = false;
        console.log('✅ Level transition finalized');
    }

    /**
     * Restore the outgoing level if preload fails.
     */
    async abortLevelTransition() {
        if (!this.puzzle) return;

        console.warn('⚠️ Aborting level transition');

        if (this.puzzle.currentRenderer) {
            this.puzzle.currentRenderer.dispose?.();
            this.puzzle.currentRenderer = null;
        }

        if (this.puzzle.outgoingRenderer) {
            this.puzzle.currentRenderer = this.puzzle.outgoingRenderer;
            this.puzzle.outgoingRenderer = null;

            const canvas = this.puzzle.currentRenderer.webglRenderer?.canvas;
            canvas?.classList.remove('transition-outgoing', 'is-fading');
            delete canvas?.dataset.transitionRole;

            this.puzzle.currentRenderer.resumeAfterHold?.();
        }

        this.pendingLevelId = null;
        this.isChangingLevel = false;
    }

    /**
     * Complete reinitialization of the puzzle
     */
    async completeReinitialization(levelConfig) {
        if (!this.puzzle) {
            throw new Error('Puzzle not initialized');
        }

        console.log(`🔄 Complete reinitialization for ${levelConfig.name}`);

        const resolved = resolveLevelConfig(levelConfig);
        this.puzzle.config.cellCount = resolved.cellCount;
        this.puzzle.config.animationSpeed = resolved.animationSpeed;
        this.puzzle.config.noiseAmplitude = resolved.noiseAmplitude;

        await this.disposePuzzle();

        if (window.themeManager) {
            window.themeManager.applyTheme(levelConfig.theme);
        }

        await this.puzzle.init();
        console.log(`✅ Reinitialization complete for ${levelConfig.name}`);
    }

    /**
     * Dispose current puzzle state
     */
    async disposePuzzle() {
        if (!this.puzzle) return;

        console.log('🗑️ Disposing current puzzle state...');

        if (this.puzzle.stopAnimation) {
            this.puzzle.stopAnimation();
        }

        if (this.puzzle.resetInteractionState) {
            this.puzzle.resetInteractionState();
        }

        if (this.puzzle.currentRenderer && this.puzzle.currentRenderer.dispose) {
            this.puzzle.currentRenderer.dispose();
        }

        if (this.puzzle.dispose) {
            this.puzzle.dispose();
        }

        console.log('✅ Puzzle state disposed');
    }

    showLoadingScreen(message = 'Loading Level...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = overlay?.querySelector('.loading-text');

        if (overlay) {
            overlay.classList.add('visible');
            overlay.setAttribute('aria-busy', 'true');
        }

        if (text) {
            text.textContent = message;
        }
    }

    hideLoadingScreen() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('visible');
            overlay.setAttribute('aria-busy', 'false');
        }
    }

    rebuildLevelSelector() {
        const selector = document.getElementById('levelSelector');
        if (!selector) return;

        selector.innerHTML = '';

        for (const entry of LEVEL_MANIFEST) {
            const level = this.levelConfigurations[entry.id];
            const option = document.createElement('option');
            option.value = entry.id;

            const selectable = this.canSelectLevel(entry.id);
            option.textContent = selectable ? level.name : `${level.name} (locked)`;
            option.disabled = !selectable;
            selector.appendChild(option);
        }

        selector.value = this.currentLevel;
    }

    updateLevelSelector() {
        this.rebuildLevelSelector();
    }

    saveLevelPreference(levelId) {
        try {
            localStorage.setItem('phantasm-level', levelId);
            console.log(`💾 Saved level preference: ${levelId}`);
        } catch (error) {
            console.warn('Failed to save level preference:', error);
        }
    }

    loadLevelPreference() {
        try {
            const saved = localStorage.getItem('phantasm-level');
            if (saved && this.levelConfigurations[saved]) {
                console.log(`📁 Loaded level preference: ${saved}`);
                return saved;
            }
        } catch (error) {
            console.warn('Failed to load level preference:', error);
        }
        return null;
    }

    getAvailableLevels() {
        return LEVEL_MANIFEST
            .map((entry) => this.levelConfigurations[entry.id])
            .filter((level) => this.isLevelUnlocked(level.id));
    }
}

const levelManager = new LevelManager();

export { LevelManager, levelManager };

if (typeof window !== 'undefined') {
    window.LevelManager = LevelManager;
    window.levelManager = levelManager;
}
