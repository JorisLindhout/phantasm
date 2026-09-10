import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    SNAP_SOUND,
    RELEASE_SOUND,
    playSnap,
    playSnapSound,
    playReleaseSound,
    unlockSnapAudio,
    resetSnapAudioContext,
} from '../js/snap-sound.js';
import { createMockAudioContext } from './audio-mock.js';

describe('snap sound', () => {
    beforeEach(() => {
        resetSnapAudioContext();
    });

    afterEach(() => {
        resetSnapAudioContext();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('keeps the designed release recipe', () => {
        expect(RELEASE_SOUND).toEqual({
            wave: 'sawtooth',
            freq: 7740,
            freqEnd: 7770,
            duration: 0.116,
            attack: 0.021,
            toneGain: 0.555,
            noiseGain: 0.14,
            noiseFreq: 10510,
            noiseQ: 1.1,
        });
    });

    it('schedules a rising sawtooth plus filtered noise', () => {
        const ctx = createMockAudioContext();
        playSnap(ctx, SNAP_SOUND);

        const osc = ctx._nodes.oscillators[0];
        const tone = ctx._nodes.gains[1];
        const master = ctx._nodes.gains[0];
        const filter = ctx._nodes.filters[0];
        const noiseGain = ctx._nodes.gains[2];
        const noise = ctx._nodes.sources[0];
        const t = ctx.currentTime;
        const dur = SNAP_SOUND.duration;
        const atk = Math.min(SNAP_SOUND.attack, dur * 0.8);

        expect(osc.type).toBe('sawtooth');
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(640, t);
        expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(1180, t + dur);
        expect(tone.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, t);
        expect(tone.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.1, t + atk);
        expect(osc.start).toHaveBeenCalledWith(t);
        expect(osc.stop).toHaveBeenCalledWith(t + dur + 0.02);

        expect(filter.type).toBe('bandpass');
        expect(filter.frequency.value).toBe(1340);
        expect(filter.Q.value).toBe(1.1);
        expect(noiseGain.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, t);
        expect(noiseGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.775, t + atk);
        expect(noise.start).toHaveBeenCalledWith(t);
        expect(noise.stop).toHaveBeenCalledWith(t + dur);
        expect(master.connect).toHaveBeenCalledWith(ctx.destination);
    });

    it('unlocks a suspended context so delayed snaps can play', () => {
        const ctx = createMockAudioContext('suspended');
        function MockAudioContext() {
            return ctx;
        }
        vi.stubGlobal('AudioContext', MockAudioContext);

        expect(unlockSnapAudio()).toBe(ctx);
        expect(ctx.resume).toHaveBeenCalled();
    });

    it('plays through the shared sfx bus', () => {
        const ctx = createMockAudioContext();
        function MockAudioContext() {
            return ctx;
        }
        vi.stubGlobal('AudioContext', MockAudioContext);

        playSnapSound();

        expect(ctx.createOscillator).toHaveBeenCalled();
        expect(ctx.createBufferSource).toHaveBeenCalled();
        const voice = ctx._nodes.gains[3];
        const sfxBus = ctx._nodes.gains[1];
        expect(voice.connect).toHaveBeenCalledWith(sfxBus);
    });

    it('plays the release cue through the shared context', () => {
        const ctx = createMockAudioContext();
        function MockAudioContext() {
            return ctx;
        }
        vi.stubGlobal('AudioContext', MockAudioContext);

        playReleaseSound();

        const osc = ctx._nodes.oscillators[0];
        expect(osc.type).toBe('sawtooth');
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(7740, ctx.currentTime);
        expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
            7770,
            ctx.currentTime + RELEASE_SOUND.duration
        );
    });

    it('no-ops when Web Audio is unavailable', () => {
        vi.stubGlobal('AudioContext', undefined);
        vi.stubGlobal('webkitAudioContext', undefined);

        expect(() => playSnapSound()).not.toThrow();
    });
});
