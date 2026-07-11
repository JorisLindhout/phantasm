import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    LEVEL_MANIFEST,
    getLevelById,
    getNextLevelId,
    isFinalLevel,
    loadUnlockedLevelIds,
    saveUnlockedLevelIds,
    unlockLevelId,
    manifestEntryToLevelConfig,
} from '../js/levels.config.js';
import { calculateReleaseBatchSize } from '../js/unsolved-layout.js';

describe('LEVEL_MANIFEST', () => {
    it('lists levels in progression order', () => {
        expect(LEVEL_MANIFEST.map((level) => level.id)).toEqual(['level-1', 'level-2']);
    });

    it('maps manifest entries to level-manager config shape', () => {
        const config = manifestEntryToLevelConfig(LEVEL_MANIFEST[0]);
        expect(config.config.cellCount).toBe(40);
        expect(config.release.phone).toBe(3);
    });
});

describe('progression helpers', () => {
    it('returns next level id', () => {
        expect(getNextLevelId('level-1')).toBe('level-2');
        expect(getNextLevelId('level-2')).toBeNull();
    });

    it('detects final level', () => {
        expect(isFinalLevel('level-1')).toBe(false);
        expect(isFinalLevel('level-2')).toBe(true);
    });

    it('returns undefined for unknown level', () => {
        expect(getLevelById('level-99')).toBeUndefined();
    });
});

describe('unlock persistence', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('persists unlocked level ids', () => {
        saveUnlockedLevelIds(['level-2']);
        expect(loadUnlockedLevelIds()).toEqual(['level-2']);
    });

    it('ignores invalid stored ids', () => {
        saveUnlockedLevelIds(['level-2', 'level-99']);
        expect(loadUnlockedLevelIds()).toEqual(['level-2']);
    });

    it('adds new unlock without duplicates', () => {
        expect(unlockLevelId('level-2', [])).toEqual(['level-2']);
        expect(unlockLevelId('level-2', ['level-2'])).toEqual(['level-2']);
    });
});

describe('calculateReleaseBatchSize with level config', () => {
    const release = { phone: 2, tablet: 4, desktop: 6, large: 10 };

    it('uses per-level release sizes', () => {
        expect(calculateReleaseBatchSize(320, release)).toBe(2);
        expect(calculateReleaseBatchSize(500, release)).toBe(4);
        expect(calculateReleaseBatchSize(900, release)).toBe(6);
        expect(calculateReleaseBatchSize(1400, release)).toBe(10);
    });
});

describe('LevelManager progression', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = `
            <select id="levelSelector"></select>
        `;
        window.themeManager = { applyTheme: vi.fn() };
        window.levelTransitionManager = {
            isTransitioning: false,
            runAutoTransition: vi.fn(),
            showCompletion: vi.fn(),
        };
    });

    it('unlocks level 2 on solve and starts auto transition', async () => {
        const { LevelManager } = await import('../js/level-manager.js');
        const manager = new LevelManager();

        manager.handlePuzzleSolved();

        expect(manager.unlockedLevelIds).toContain('level-2');
        expect(window.levelTransitionManager.runAutoTransition).toHaveBeenCalledWith('level-1', 'level-2');
    });

    it('shows completion on final level solve', async () => {
        const { LevelManager } = await import('../js/level-manager.js');
        const manager = new LevelManager();
        manager.currentLevel = 'level-2';

        manager.handlePuzzleSolved();

        expect(window.levelTransitionManager.showCompletion).toHaveBeenCalled();
    });

    it('marks level 2 as locked in selector outside dev', async () => {
        vi.stubEnv('DEV', false);

        const { LevelManager } = await import('../js/level-manager.js');
        const manager = new LevelManager();
        manager.rebuildLevelSelector();

        const selector = document.getElementById('levelSelector');
        const level2Option = selector.querySelector('option[value="level-2"]');
        expect(level2Option.disabled).toBe(true);

        vi.unstubAllEnvs();
    });
});
