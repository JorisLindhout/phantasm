import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    DRONE_SOUND,
    DRONE_BY_LEVEL,
    droneParamsForLevel,
    startDroneForLevel,
    setDroneForLevel,
    unlockAndStartBed,
    startDroneOnLoad,
    isDroneRunning,
    resetDrone,
} from '../js/drone-sound.js';
import { resetGameAudio } from '../js/game-audio.js';
import { createMockAudioContext } from './audio-mock.js';

describe('drone sound', () => {
    beforeEach(() => {
        resetDrone();
        resetGameAudio();
    });

    afterEach(() => {
        resetDrone();
        resetGameAudio();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        delete window.levelManager;
        try {
            delete navigator.audioSession;
        } catch {
            // ignore
        }
    });

    it('keeps the designed level 1 recipe', () => {
        expect(DRONE_BY_LEVEL['level-1']).toEqual(DRONE_SOUND);
        expect(DRONE_SOUND).toEqual({
            wave: 'sine',
            freq: 91,
            detuneHz: 0.33,
            toneGain: 0.119,
            filterFreq: 1085,
            filterQ: 1.4,
            lfoRate: 0.65,
            lfoDepth: 128,
            noiseGain: 0.003,
            noiseFreq: 720,
            noiseQ: 8,
            slowRate: 0.187,
            slowDepth: 681,
            pitchDrift: 5.3,
            wander: 226,
            shimmer: 0.04,
        });
    });

    it('raises pitch and opens the filter across levels without changing bed gain', () => {
        const level1 = droneParamsForLevel('level-1');
        const level2 = droneParamsForLevel('level-2');
        const level4 = droneParamsForLevel('level-4');

        expect(level2.freq).toBeGreaterThan(level1.freq);
        expect(level4.freq).toBeGreaterThan(level2.freq);
        expect(level4.filterFreq).toBeGreaterThan(level1.filterFreq);
        expect(level4.lfoRate).toBeGreaterThan(level1.lfoRate);
        expect(level4.toneGain).toBe(level1.toneGain);
        expect(level4.noiseGain).toBe(level1.noiseGain);
    });

    it('starts a looping graph on first unlock', () => {
        const ctx = createMockAudioContext();
        function MockAudioContext() {
            return ctx;
        }
        vi.stubGlobal('AudioContext', MockAudioContext);

        expect(startDroneForLevel('level-1')).toBe(true);
        expect(isDroneRunning()).toBe(true);
        expect(ctx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(5);
        expect(ctx._nodes.sources.some((source) => source.loop)).toBe(true);
    });

    it('retargets the live graph when the level changes', () => {
        const ctx = createMockAudioContext();
        function MockAudioContext() {
            return ctx;
        }
        vi.stubGlobal('AudioContext', MockAudioContext);

        startDroneForLevel('level-1');
        const oscCount = ctx.createOscillator.mock.calls.length;
        setDroneForLevel('level-4', { seconds: 1 });

        expect(ctx.createOscillator.mock.calls.length).toBe(oscCount);
        const pitch = ctx._nodes.oscillators[0].frequency;
        expect(pitch.setTargetAtTime).toHaveBeenCalledWith(182, ctx.currentTime, expect.any(Number));
    });

    it('uses the current level when unlocking the bed', () => {
        const ctx = createMockAudioContext();
        function MockAudioContext() {
            return ctx;
        }
        vi.stubGlobal('AudioContext', MockAudioContext);
        window.levelManager = { currentLevel: 'level-3' };

        unlockAndStartBed();
        const pitch = ctx._nodes.oscillators[0].frequency;
        expect(pitch.setTargetAtTime).toHaveBeenCalledWith(136.5, ctx.currentTime, expect.any(Number));
    });

    it('starts the bed on load when the context is allowed to run', () => {
        const ctx = createMockAudioContext();
        function MockAudioContext() {
            return ctx;
        }
        vi.stubGlobal('AudioContext', MockAudioContext);

        startDroneOnLoad();

        expect(isDroneRunning()).toBe(true);
        expect(ctx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(5);
    });

    it('resumes a suspended context from any tap, not only piece drags', async () => {
        const ctx = createMockAudioContext('suspended');
        ctx.resume = vi.fn(async () => {
            ctx.state = 'running';
        });
        function MockAudioContext() {
            return ctx;
        }
        vi.stubGlobal('AudioContext', MockAudioContext);

        startDroneOnLoad();
        expect(isDroneRunning()).toBe(true);

        document.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await Promise.resolve();

        expect(ctx.resume).toHaveBeenCalled();
        expect(ctx.state).toBe('running');
    });

    it('waits for a tap before starting the bed on iOS', () => {
        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
        );
        Object.defineProperty(navigator, 'audioSession', {
            configurable: true,
            value: { type: 'auto' },
        });
        const ctor = vi.fn(function AudioContext() {
            return createMockAudioContext();
        });
        vi.stubGlobal('AudioContext', ctor);

        startDroneOnLoad();
        expect(ctor).not.toHaveBeenCalled();
        expect(isDroneRunning()).toBe(false);

        document.dispatchEvent(new Event('pointerdown', { bubbles: true }));

        expect(ctor).toHaveBeenCalledTimes(1);
        expect(isDroneRunning()).toBe(true);

        try {
            delete navigator.audioSession;
        } catch {
            // ignore
        }
    });
});
