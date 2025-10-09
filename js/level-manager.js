/**
 * Level Manager
 * 
 * Handles level switching with complete reinitialization approach.
 * This ensures clean state and avoids coordinate system conflicts.
 */

class LevelManager {
    constructor() {
        // Initialize level configurations first
        this.initializeLevelConfigurations();
        this.currentLevel = this.loadLevelPreference() || 'level-1';
        this.puzzle = null;
        this.isChangingLevel = false;
        
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.querySelector('#loadingOverlay .loading-text');
        this.loadingBar = document.querySelector('#loadingOverlay .loading-bar');
        this.isChangingLevel = false; // Debounce flag
    }

    initializeLevelConfigurations() {
        // Level configurations
        this.levelConfigurations = {
            'level-1': {
                id: 'level-1',
                name: 'Level 1',
                config: { cellCount: 40, animationSpeed: 1.0, noiseAmplitude: 10 },
                theme: 'levelOne',
                unlocked: true
            },
            'level-2': {
                id: 'level-2', 
                name: 'Level 2',
                config: { cellCount: 60, animationSpeed: 0.8, noiseAmplitude: 15 },
                theme: 'levelTwo',
                unlocked: true
            }
        };
    }

    /**
     * Initialize the level manager
     */
    init(puzzle) {
        this.puzzle = puzzle;
        console.log(`🎮 Level Manager initialized with level: ${this.currentLevel}`);
        
        // Apply initial level configuration without disposal
        this.applyInitialLevel();
    }

    /**
     * Apply initial level configuration without disposal (for startup)
     */
    applyInitialLevel() {
        const levelConfig = this.getCurrentLevel();
        if (!levelConfig) return;

        console.log(`🎨 Applying initial level: ${levelConfig.name}`);

        // Update puzzle config
        this.puzzle.config.cellCount = levelConfig.config.cellCount;
        this.puzzle.config.animationSpeed = levelConfig.config.animationSpeed;
        this.puzzle.config.noiseAmplitude = levelConfig.config.noiseAmplitude;

        // Apply theme
        if (window.themeManager) {
            window.themeManager.applyTheme(levelConfig.theme);
        }

        // Update UI
        this.updateLevelSelector();

        console.log(`✅ Initial level applied: ${levelConfig.name}`);
    }

    /**
     * Get current level configuration
     */
    getCurrentLevel() {
        return this.levelConfigurations[this.currentLevel];
    }

    /**
     * Set level with complete reinitialization
     */
    async setLevel(levelId) {
        if (this.isChangingLevel) {
            console.log(`⚠️ Level change already in progress, ignoring request for: ${levelId}`);
            return false;
        }

        if (!this.levelConfigurations[levelId]) {
            console.error(`Level "${levelId}" not found`);
            return false;
        }

        if (!this.levelConfigurations[levelId].unlocked) {
            console.warn(`Level "${levelId}" is locked`);
            return false;
        }

        const levelConfig = this.levelConfigurations[levelId];
        console.log(`🎮 Switching to ${levelConfig.name}`);

        this.isChangingLevel = true;

        try {
            // Show loading screen
            this.showLoadingScreen(`Loading ${levelConfig.name}...`);

            // Complete reinitialization
            await this.completeReinitialization(levelConfig);

            // Update current level
            this.currentLevel = levelId;

            // Update UI
            this.updateLevelSelector();

            // Save level preference
            this.saveLevelPreference(levelId);

            // Hide loading screen
            this.hideLoadingScreen();

            console.log(`✅ Successfully switched to ${levelConfig.name}`);
            return true;

        } catch (error) {
            console.error('Failed to switch level:', error);
            this.hideLoadingScreen();
            return false;

        } finally {
            // Allow next level change after a short delay
            setTimeout(() => {
                this.isChangingLevel = false;
            }, 500);
        }
    }

    /**
     * Complete reinitialization of the puzzle
     */
    async completeReinitialization(levelConfig) {
        if (!this.puzzle) {
            throw new Error('Puzzle not initialized');
        }

        console.log(`🔄 Complete reinitialization for ${levelConfig.name}`);

        // 1. Update puzzle configuration
        this.puzzle.config.cellCount = levelConfig.cellCount;
        this.puzzle.config.animationSpeed = levelConfig.animationSpeed;
        this.puzzle.config.noiseAmplitude = levelConfig.noiseAmplitude;

        // 2. Dispose current puzzle state
        await this.disposePuzzle();

        // 3. Apply theme first so background image loads correctly
        if (window.themeManager) {
            window.themeManager.applyTheme(levelConfig.theme);
        }

        // 4. Reinitialize puzzle from scratch (now with correct theme)
        await this.puzzle.init();

        console.log(`✅ Reinitialization complete for ${levelConfig.name}`);
    }

    /**
     * Dispose current puzzle state
     */
    async disposePuzzle() {
        if (!this.puzzle) return;

        console.log('🗑️ Disposing current puzzle state...');

        // Stop animations before disposal to prevent render loop errors
        if (this.puzzle.stopAnimation) {
            this.puzzle.stopAnimation();
        }

        // Reset interaction state
        if (this.puzzle.resetInteractionState) {
            this.puzzle.resetInteractionState();
        }

        // Dispose WebGL renderer if available (via currentRenderer)
        if (this.puzzle.currentRenderer && this.puzzle.currentRenderer.dispose) {
            this.puzzle.currentRenderer.dispose();
        }

        // Clear puzzle state
        if (this.puzzle.dispose) {
            this.puzzle.dispose();
        }

        console.log('✅ Puzzle state disposed');
    }

    /**
     * Show loading screen
     */
    showLoadingScreen(message = 'Loading Level...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = overlay.querySelector('.loading-text');
        
        if (overlay && text) {
            text.textContent = message;
            overlay.classList.add('visible');
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    }

    /**
     * Update level selector UI
     */
    updateLevelSelector() {
        const selector = document.getElementById('levelSelector');
        if (selector) {
            selector.value = this.currentLevel;
        }
    }

    /**
     * Save level preference to localStorage
     */
    saveLevelPreference(levelId) {
        try {
            localStorage.setItem('phantasm-level', levelId);
            console.log(`💾 Saved level preference: ${levelId}`);
        } catch (error) {
            console.warn('Failed to save level preference:', error);
        }
    }

    /**
     * Load level preference from localStorage
     */
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

    /**
     * Get available levels
     */
    getAvailableLevels() {
        return Object.values(this.levelConfigurations).filter(level => level.unlocked);
    }

    /**
     * Unlock a level (for future use)
     */
    unlockLevel(levelId) {
        if (this.levelConfigurations[levelId]) {
            this.levelConfigurations[levelId].unlocked = true;
            console.log(`🔓 Unlocked level: ${levelId}`);
        }
    }
}

// Create global instance
const levelManager = new LevelManager();

// Export for use in other modules
export { LevelManager, levelManager };

// Also make available globally for dev tools
if (typeof window !== 'undefined') {
    window.LevelManager = LevelManager;
    window.levelManager = levelManager;
}
