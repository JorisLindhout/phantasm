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
    isAudioEnabled,
    setAudioEnabled,
    isIosLike,
    primePlaybackSession,
} from '../js/game-audio.js';
import { SNAP_SOUND } from '../js/snap-sound.js';
import { DRONE_SOUND } from '../js/drone-sound.js';
import { createMockAudioContext } from './audio-mock.js';

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

function stubIosNavigator(audioSession = { type: 'auto' }) {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE_UA);
    Object.defineProperty(navigator, 'audioSession', {
        configurable: true,
        value: audioSession,
    });
    return audioSession;
}

describe('game audio mix', () => {
    beforeEach(() => {
        resetGameAudio();
    });

    afterEach(() => {
        resetGameAudio();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        try {
            delete navigator.audioSession;
        } catch {
            // jsdom may not allow deleting native props
        }
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

    it('defaults to audio on and mutes the master bus', () => {
        const ctx = createMockAudioContext();
        function MockAudioContext() {
            return ctx;
        }
        vi.stubGlobal('AudioContext', MockAudioContext);

        expect(isAudioEnabled()).toBe(true);
        unlockGameAudio();
        expect(setAudioEnabled(false)).toBe(false);
        expect(isAudioEnabled()).toBe(false);
        const master = ctx._nodes.gains[0];
        expect(master.gain.linearRampToValueAtTime).toHaveBeenCalled();
        expect(setAudioEnabled(true)).toBe(true);
    });

    it('detects iPhone and iPadOS as gesture-unlock platforms', () => {
        expect(isIosLike({ userAgent: IPHONE_UA })).toBe(true);
        expect(isIosLike({ userAgent: 'Mozilla/5.0', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true);
        expect(isIosLike({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' })).toBe(false);
    });

    it('promotes the page audio session to playback without downgrading play-and-record', () => {
        const session = { type: 'auto' };
        primePlaybackSession({ audioSession: session });
        expect(session.type).toBe('playback');

        const recording = { type: 'play-and-record' };
        primePlaybackSession({ audioSession: recording });
        expect(recording.type).toBe('play-and-record');
    });

    it('waits for a user gesture before creating an AudioContext on iOS', () => {
        const session = stubIosNavigator();
        const ctor = vi.fn(function AudioContext() {
            return createMockAudioContext();
        });
        vi.stubGlobal('AudioContext', ctor);

        expect(unlockGameAudio()).toBe(null);
        expect(ctor).not.toHaveBeenCalled();

        const ctx = unlockGameAudio({ fromGesture: true });
        expect(ctor).toHaveBeenCalledTimes(1);
        expect(ctx).toBeTruthy();
        expect(session.type).toBe('playback');
    });

    it('discards a load-time context that never reached running', () => {
        const dead = createMockAudioContext('suspended');
        const live = createMockAudioContext('running');
        const ctor = vi.fn(function AudioContext() {
            return ctor.mock.calls.length <= 1 ? dead : live;
        });
        vi.stubGlobal('AudioContext', ctor);

        expect(unlockGameAudio()).toBe(dead);

        const ctx = unlockGameAudio({ fromGesture: true });
        expect(dead.close).toHaveBeenCalled();
        expect(ctor).toHaveBeenCalledTimes(2);
        expect(ctx).toBe(live);
    });
});
