import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    LevelTransitionManager,
    SOLVED_HOLD_MS,
    CROSSFADE_MS,
} from '../js/level-transition.js';

describe('LevelTransitionManager', () => {
    let manager;
    let preloadResolve;
    let preloadPromise;
    let fadeStarted;

    beforeEach(() => {
        vi.useFakeTimers();
        fadeStarted = false;

        document.body.innerHTML = `
            <div class="stage puzzle-solved"></div>
            <button id="releasePiecesBtn" class="release-pieces-btn">+</button>
            <div id="completionOverlay" class="completion-overlay" hidden>
                <button id="playAgainBtn">Play again</button>
            </div>
        `;

        preloadPromise = new Promise((resolve) => {
            preloadResolve = resolve;
        });

        window.levelManager = {
            preloadLevelForTransition: vi.fn(() => preloadPromise),
            finalizeLevelTransition: vi.fn(async () => {}),
            abortLevelTransition: vi.fn(async () => {}),
            resetProgression: vi.fn(),
            setLevel: vi.fn(async () => true),
        };

        window.pieceReleaseManager = {
            releaseInitialBatch: vi.fn(),
            updateButtonVisibility: vi.fn(),
        };

        window.voronoiPuzzle = {
            currentRenderer: { freezeForHold: vi.fn() },
            outgoingRenderer: {
                webglRenderer: {
                    canvas: document.createElement('canvas'),
                },
            },
            webglRenderer: {
                recoverOffscreenLoosePieces: vi.fn(),
            },
        };

        manager = new LevelTransitionManager();
        manager.init();

        manager.fadeOutOutgoingCanvas = vi.fn(async () => {
            fadeStarted = true;
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        delete window.levelManager;
        delete window.pieceReleaseManager;
        delete window.voronoiPuzzle;
    });

    it('waits for hold and preload before crossfade', async () => {
        const transition = manager.runAutoTransition('level-1', 'level-2');

        await vi.advanceTimersByTimeAsync(SOLVED_HOLD_MS - 100);
        expect(fadeStarted).toBe(false);

        preloadResolve();
        await Promise.resolve();
        await vi.advanceTimersByTimeAsync(50);
        expect(fadeStarted).toBe(false);

        await vi.advanceTimersByTimeAsync(100);
        await transition;

        expect(fadeStarted).toBe(true);
        expect(window.levelManager.finalizeLevelTransition).toHaveBeenCalled();
        expect(window.pieceReleaseManager.releaseInitialBatch).toHaveBeenCalled();
    });

    it('extends hold when preload is slower than minimum', async () => {
        const transition = manager.runAutoTransition('level-1', 'level-2');

        await vi.advanceTimersByTimeAsync(SOLVED_HOLD_MS + 500);
        expect(fadeStarted).toBe(false);

        preloadResolve();
        await transition;

        expect(fadeStarted).toBe(true);
    });

    it('aborts cleanly when preload fails', async () => {
        window.levelManager.preloadLevelForTransition = vi.fn(async () => {
            throw new Error('preload failed');
        });

        const transition = manager.runAutoTransition('level-1', 'level-2');
        await vi.advanceTimersByTimeAsync(SOLVED_HOLD_MS);
        await transition;

        expect(window.levelManager.abortLevelTransition).toHaveBeenCalled();
        expect(manager.fadeOutOutgoingCanvas).not.toHaveBeenCalled();
        expect(manager.isTransitioning).toBe(false);
        document.querySelector('.stage')?.classList.contains('transition-locked');
        expect(document.querySelector('.stage')?.classList.contains('transition-locked')).toBe(false);
    });

    it('blocks duplicate transitions while one is running', async () => {
        const first = manager.runAutoTransition('level-1', 'level-2');
        manager.runAutoTransition('level-1', 'level-2');

        expect(window.levelManager.preloadLevelForTransition).toHaveBeenCalledTimes(1);

        preloadResolve();
        await vi.advanceTimersByTimeAsync(SOLVED_HOLD_MS);
        await first;
    });

    it('releases pieces after transition flag clears', async () => {
        manager.fadeOutOutgoingCanvas = vi.fn(async () => {});
        window.levelManager.finalizeLevelTransition = vi.fn(async () => {});

        let transitioningDuringRelease = true;
        window.pieceReleaseManager.releaseInitialBatch = vi.fn(() => {
            transitioningDuringRelease = manager.isTransitioning;
        });

        const transition = manager.runAutoTransition('level-1', 'level-2');
        preloadResolve();
        await vi.advanceTimersByTimeAsync(SOLVED_HOLD_MS);
        await transition;

        expect(transitioningDuringRelease).toBe(false);
        expect(window.pieceReleaseManager.releaseInitialBatch).toHaveBeenCalled();
    });
});

describe('LevelManager progression hook', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = `<select id="levelSelector"></select>`;
        window.themeManager = { applyTheme: vi.fn(), init: vi.fn() };
        window.levelTransitionManager = {
            isTransitioning: false,
            runAutoTransition: vi.fn(),
            showCompletion: vi.fn(),
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('unlocks level 2 on solve and starts auto transition', async () => {
        const { LevelManager } = await import('../js/level-manager.js');
        const levelManager = new LevelManager();

        levelManager.handlePuzzleSolved();

        expect(levelManager.unlockedLevelIds).toContain('level-2');
        expect(window.levelTransitionManager.runAutoTransition).toHaveBeenCalledWith('level-1', 'level-2');
    });

    it('shows completion on final level solve', async () => {
        const { LevelManager } = await import('../js/level-manager.js');
        const levelManager = new LevelManager();
        levelManager.currentLevel = 'level-2';

        levelManager.handlePuzzleSolved();

        expect(window.levelTransitionManager.showCompletion).toHaveBeenCalled();
    });
});
