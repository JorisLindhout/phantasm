import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveLevelConfig } from '../js/animated-path.js';
import { LevelManager } from '../js/level-manager.js';

/**
 * Minimal level-manager logic tests for the config bug fix.
 * Full LevelManager requires DOM; we test the extracted config resolution
 * and simulate the fixed assignment pattern.
 */

describe('level manager config application', () => {
    let puzzleConfig;

    beforeEach(() => {
        puzzleConfig = {
            cellCount: 40,
            animationSpeed: 1.0,
            noiseAmplitude: 10,
        };
    });

    function applyLevelConfig(levelConfig) {
        const resolved = resolveLevelConfig(levelConfig);
        puzzleConfig.cellCount = resolved.cellCount;
        puzzleConfig.animationSpeed = resolved.animationSpeed;
        puzzleConfig.noiseAmplitude = resolved.noiseAmplitude;
    }

    it('applies level 2 settings without undefined values', () => {
        applyLevelConfig({
            id: 'level-2',
            name: 'Level 2',
            config: { cellCount: 60, animationSpeed: 0.8, noiseAmplitude: 15 },
        });

        expect(puzzleConfig.cellCount).toBe(60);
        expect(puzzleConfig.animationSpeed).toBe(0.8);
        expect(puzzleConfig.noiseAmplitude).toBe(15);
    });

    it('would have failed with the old flat property access pattern', () => {
        const levelConfig = {
            config: { cellCount: 60, animationSpeed: 0.8, noiseAmplitude: 15 },
        };

        // Old buggy pattern
        expect(levelConfig.cellCount).toBeUndefined();

        applyLevelConfig(levelConfig);
        expect(puzzleConfig.cellCount).toBe(60);
    });
});

describe('LevelManager startup', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <select id="levelSelector">
                <option value="level-1">Level 1</option>
                <option value="level-2">Level 2</option>
            </select>
        `;
        localStorage.setItem('phantasm-level', 'level-2');
        window.themeManager = { applyTheme: vi.fn() };
    });

    it('defaults to level-1 regardless of saved localStorage preference', () => {
        const manager = new LevelManager();
        expect(manager.currentLevel).toBe('level-1');
    });

    it('prepareForStartup sets selector to level-1 and applies level one theme', () => {
        const manager = new LevelManager();
        manager.currentLevel = 'level-2';

        manager.prepareForStartup();

        expect(manager.currentLevel).toBe('level-1');
        expect(document.getElementById('levelSelector').value).toBe('level-1');
        expect(window.themeManager.applyTheme).toHaveBeenCalledWith('levelOne');
    });
});

describe('debug renderer accessor', () => {
    function getWebGLRenderer() {
        return window.voronoiPuzzle?.webglRenderer ?? null;
    }

    beforeEach(() => {
        window.voronoiPuzzle = undefined;
    });

    it('resolves renderer through voronoiPuzzle', () => {
        const renderer = { pieces: [] };
        window.voronoiPuzzle = { webglRenderer: renderer };
        expect(getWebGLRenderer()).toBe(renderer);
    });

    it('returns null when puzzle is unavailable', () => {
        expect(getWebGLRenderer()).toBeNull();
    });
});

describe('accessibility helpers', () => {
    it('detects reduced motion preference', async () => {
        vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query) => ({
            matches: query.includes('prefers-reduced-motion'),
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })));

        const { prefersReducedMotion } = await import('../js/accessibility.js');
        expect(prefersReducedMotion()).toBe(true);
        vi.unstubAllGlobals();
    });
});
