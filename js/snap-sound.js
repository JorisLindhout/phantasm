/**
 * Synthesized piece-snap click (Web Audio). No audio files.
 */

import { unlockGameAudio, getSfxInput, resetGameAudio, isAudioEnabled } from './game-audio.js';

export const SNAP_SOUND = {
    wave: 'sawtooth',
    freq: 640,
    freqEnd: 1180,
    duration: 0.012,
    attack: 0.011,
    toneGain: 0.1,
    noiseGain: 0.775,
    noiseFreq: 1340,
    noiseQ: 1.1,
};

/** Cue when a batch of pieces is released onto the stage. */
export const RELEASE_SOUND = {
    wave: 'sawtooth',
    freq: 7740,
    freqEnd: 7770,
    duration: 0.116,
    attack: 0.021,
    toneGain: 0.555,
    noiseGain: 0.14,
    noiseFreq: 10510,
    noiseQ: 1.1,
};

/**
 * Create (once) and resume the shared AudioContext.
 * Call from a user gesture so later timeout-based snaps can play.
 * @returns {AudioContext | null}
 */
export function unlockSnapAudio() {
    return unlockGameAudio();
}

/**
 * Schedule one snap on an existing AudioContext.
 * @param {AudioContext} audio
 * @param {typeof SNAP_SOUND} [params]
 * @param {AudioNode} [output]
 */
export function playSnap(audio, params = SNAP_SOUND, output = audio.destination) {
    const t = audio.currentTime;
    const dur = Math.max(0.008, params.duration);
    const atk = Math.min(Math.max(0.001, params.attack ?? 0.001), dur * 0.8);
    const master = audio.createGain();
    master.connect(output);

    const osc = audio.createOscillator();
    osc.type = params.wave;
    osc.frequency.setValueAtTime(params.freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, params.freqEnd), t + dur);

    const tone = audio.createGain();
    tone.gain.setValueAtTime(0.0001, t);
    tone.gain.exponentialRampToValueAtTime(Math.max(0.0001, params.toneGain), t + atk);
    tone.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(tone).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);

    const noiseLen = Math.ceil(audio.sampleRate * dur);
    const buffer = audio.createBuffer(1, noiseLen, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audio.createBufferSource();
    noise.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = params.noiseFreq;
    filter.Q.value = params.noiseQ;

    const noiseGain = audio.createGain();
    noiseGain.gain.setValueAtTime(0.0001, t);
    noiseGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, params.noiseGain), t + atk);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    noise.connect(filter).connect(noiseGain).connect(master);
    noise.start(t);
    noise.stop(t + dur);
}

function playSound(params) {
    if (!isAudioEnabled()) {
        return;
    }

    const audio = unlockGameAudio();
    const output = getSfxInput();
    if (!audio || !output) {
        return;
    }

    playSnap(audio, params, output);
}

export function playSnapSound() {
    playSound(SNAP_SOUND);
}

export function playReleaseSound() {
    playSound(RELEASE_SOUND);
}

/** Test helper — drop the shared context so the next unlock creates a new one. */
export function resetSnapAudioContext() {
    resetGameAudio();
}
