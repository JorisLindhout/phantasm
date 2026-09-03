/**
 * Synthesized piece-snap click (Web Audio). No audio files.
 */

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

/** @type {AudioContext | null} */
let snapAudioContext = null;

function getAudioContextConstructor() {
    return window.AudioContext || window.webkitAudioContext || null;
}

/**
 * Create (once) and resume the shared AudioContext.
 * Call from a user gesture so later timeout-based snaps can play.
 * @returns {AudioContext | null}
 */
export function unlockSnapAudio() {
    const AudioContextCtor = getAudioContextConstructor();
    if (!AudioContextCtor) {
        return null;
    }

    if (!snapAudioContext) {
        try {
            snapAudioContext = new AudioContextCtor();
        } catch {
            return null;
        }
    }

    if (snapAudioContext.state === 'suspended') {
        snapAudioContext.resume().catch(() => {});
    }

    return snapAudioContext;
}

/**
 * Schedule one snap on an existing AudioContext.
 * @param {AudioContext} audio
 * @param {typeof SNAP_SOUND} [params]
 */
export function playSnap(audio, params = SNAP_SOUND) {
    const t = audio.currentTime;
    const dur = Math.max(0.008, params.duration);
    const atk = Math.min(Math.max(0.001, params.attack ?? 0.001), dur * 0.8);
    const master = audio.createGain();
    master.connect(audio.destination);

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

export function playSnapSound() {
    const audio = unlockSnapAudio();
    if (!audio) {
        return;
    }

    playSnap(audio, SNAP_SOUND);
}

/** Test helper — drop the shared context so the next unlock creates a new one. */
export function resetSnapAudioContext() {
    snapAudioContext = null;
}
