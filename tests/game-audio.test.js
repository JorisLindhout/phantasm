import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    MIX,
    oneShotPeak,
    dronePeak,
    matchedSfxGain,
    unlockGameAudio,
    getSfxInput,
    fadeDroneBus,
    resetGameAudio,
} from '../js/game-audio.js';
import { SNAP_SOUND } from '../js/snap-sound.js';
import { DRONE_SOUND } from '../js/drone-sound.js';
import { createMockAudioContext } from './audio-mock.js';

describe('game audio mix', () => {
    beforeEach(() => {
        resetGameAudio();
    });

    afterEach(() => {
        resetGameAudio();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('keeps the sfx bus matched to the drone bed', () => {
        expect(MIX.sfx).toBeCloseTo(matchedSfxGain(DRONE_SOUND, SNAP_SOUND), 2);
    });

    it('treats two drone tones plus shimmer as the bed peak', () => {
        expect(dronePeak(DRONE_SOUND)).toBeCloseTo(0.119 * 2 + 0.04 + 0.003);
        expect(oneShotPeak(SNAP_SOUND)).toBeCloseTo(0.1 + 0.775);
    });

    it('builds mix buses on unlock', () => {
        const ctx = createMockAudioContext('suspended');
        function MockAudioContext() {
            return ctx;
        }
        vi.stubGlobal('AudioContext', MockAudioContext);

        expect(unlockGameAudio()).toBe(ctx);
        expect(ctx.resume).toHaveBeenCalled();
        expect(ctx.createGain).toHaveBeenCalledTimes(3);
        expect(getSfxInput()).toBe(ctx._nodes.gains[1]);
    });

    it('fades the drone bus toward a target', () => {
        const ctx = createMockAudioContext();
        function MockAudioContext() {
            return ctx;
        }
        vi.stubGlobal('AudioContext', MockAudioContext);

        unlockGameAudio();
        fadeDroneBus(0, 1);
        const droneBus = ctx._nodes.gains[2];
        expect(droneBus.gain.linearRampToValueAtTime).toHaveBeenCalled();
    });
});
