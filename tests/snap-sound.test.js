import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    SNAP_SOUND,
    playSnap,
    playSnapSound,
    unlockSnapAudio,
    resetSnapAudioContext,
} from '../js/snap-sound.js';

function createAudioParam() {
    return {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
    };
}

function createMockAudioContext(state = 'running') {
    const destination = { id: 'destination' };
    const osc = {
        type: 'sine',
        frequency: createAudioParam(),
        connect: vi.fn((node) => node),
        start: vi.fn(),
        stop: vi.fn(),
    };
    const tone = {
        gain: createAudioParam(),
        connect: vi.fn((node) => node),
    };
    const master = {
        connect: vi.fn(),
    };
    const filter = {
        type: 'lowpass',
        frequency: createAudioParam(),
        Q: createAudioParam(),
        connect: vi.fn((node) => node),
    };
    const noiseGain = {
        gain: createAudioParam(),
        connect: vi.fn((node) => node),
    };
    const noise = {
        buffer: null,
        connect: vi.fn((node) => node),
        start: vi.fn(),
        stop: vi.fn(),
    };
    const channelData = new Float32Array(Math.ceil(44100 * SNAP_SOUND.duration));
    const buffer = {
        getChannelData: vi.fn(() => channelData),
    };

    const ctx = {
        state,
        currentTime: 1.25,
        sampleRate: 44100,
        destination,
        resume: vi.fn().mockResolvedValue(undefined),
        createGain: vi.fn()
            .mockReturnValueOnce(master)
            .mockReturnValueOnce(tone)
            .mockReturnValueOnce(noiseGain),
        createOscillator: vi.fn(() => osc),
        createBiquadFilter: vi.fn(() => filter),
        createBuffer: vi.fn(() => buffer),
        createBufferSource: vi.fn(() => noise),
        _nodes: { osc, tone, master, filter, noiseGain, noise, buffer, channelData },
    };

    return ctx;
}

describe('snap sound', () => {
    beforeEach(() => {
        resetSnapAudioContext();
    });

    afterEach(() => {
        resetSnapAudioContext();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('keeps the designed snap recipe', () => {
        expect(SNAP_SOUND).toEqual({
            wave: 'sawtooth',
            freq: 640,
            freqEnd: 1180,
            duration: 0.012,
            attack: 0.011,
            toneGain: 0.1,
            noiseGain: 0.775,
            noiseFreq: 1340,
            noiseQ: 1.1,
        });
    });

    it('schedules a rising sawtooth plus filtered noise', () => {
        const ctx = createMockAudioContext();
        playSnap(ctx, SNAP_SOUND);

        const { osc, tone, master, filter, noiseGain, noise } = ctx._nodes;
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

    it('plays through the shared context', () => {
        const ctx = createMockAudioContext();
        function MockAudioContext() {
            return ctx;
        }
        vi.stubGlobal('AudioContext', MockAudioContext);

        playSnapSound();

        expect(ctx.createOscillator).toHaveBeenCalled();
        expect(ctx.createBufferSource).toHaveBeenCalled();
    });

    it('no-ops when Web Audio is unavailable', () => {
        vi.stubGlobal('AudioContext', undefined);
        vi.stubGlobal('webkitAudioContext', undefined);

        expect(() => playSnapSound()).not.toThrow();
    });
});
