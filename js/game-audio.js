/**
 * Shared Web Audio context and mix buses.
 * Drone is the loudness reference; one-shots sit on the sfx bus.
 */

export const MIX = {
    master: 0.9,
    drone: 1,
    /**
     * One-shots may peak this much hotter than the drone bed.
     * Short clicks need a little extra to read against a continuous tone.
     */
    sfxHeadroom: 1.25,
    /**
     * SFX bus gain. Keep in sync with matchedSfxGain(DRONE_SOUND, SNAP_SOUND).
     */
    sfx: 0.4,
};

/** @type {AudioContext | null} */
let audioContext = null;
/** @type {GainNode | null} */
let masterGain = null;
/** @type {GainNode | null} */
let sfxGain = null;
/** @type {GainNode | null} */
let droneGain = null;
/** @type {Array<() => void>} */
const resetHooks = [];
let audioEnabled = true;

export function registerAudioReset(hook) {
    resetHooks.push(hook);
}

function getAudioContextConstructor() {
    return window.AudioContext || window.webkitAudioContext || null;
}

export function oneShotPeak(params) {
    return Math.max(0.0001, (params?.toneGain ?? 0) + (params?.noiseGain ?? 0));
}

export function dronePeak(params) {
    return Math.max(
        0.0001,
        (params?.toneGain ?? 0) * 2 + (params?.shimmer ?? 0) + (params?.noiseGain ?? 0)
    );
}

export function matchedSfxGain(droneParams, snapParams, headroom = MIX.sfxHeadroom) {
    return (dronePeak(droneParams) * headroom) / oneShotPeak(snapParams);
}

function ensureMixer(audio) {
    if (masterGain) {
        return;
    }

    masterGain = audio.createGain();
    masterGain.gain.value = audioEnabled ? MIX.master : 0;
    masterGain.connect(audio.destination);

    sfxGain = audio.createGain();
    sfxGain.gain.value = MIX.sfx;
    sfxGain.connect(masterGain);

    droneGain = audio.createGain();
    droneGain.gain.value = MIX.drone;
    droneGain.connect(masterGain);
}

/**
 * Create (once) and resume the shared AudioContext, with mix buses.
 * Call from a user gesture so later sounds can play.
 * @returns {AudioContext | null}
 */
export function unlockGameAudio() {
    const AudioContextCtor = getAudioContextConstructor();
    if (!AudioContextCtor) {
        return null;
    }

    if (!audioContext) {
        try {
            audioContext = new AudioContextCtor();
        } catch {
            return null;
        }
    }

    ensureMixer(audioContext);

    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }

    return audioContext;
}

/** @returns {GainNode | AudioDestinationNode | null} */
export function getSfxInput() {
    const audio = unlockGameAudio();
    if (!audio) {
        return null;
    }
    return sfxGain ?? audio.destination;
}

/** @returns {GainNode | AudioDestinationNode | null} */
export function getDroneInput() {
    const audio = unlockGameAudio();
    if (!audio) {
        return null;
    }
    return droneGain ?? audio.destination;
}

export function isAudioEnabled() {
    return audioEnabled;
}

/**
 * Mute or unmute the shared master bus. Default is on.
 * @param {boolean} enabled
 * @returns {boolean}
 */
export function setAudioEnabled(enabled) {
    audioEnabled = Boolean(enabled);
    applyMasterMute();
    return audioEnabled;
}

function applyMasterMute() {
    if (!masterGain || !audioContext) {
        return;
    }

    const now = audioContext.currentTime;
    const target = audioEnabled ? MIX.master : 0;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(Math.max(0, masterGain.gain.value), now);
    masterGain.gain.linearRampToValueAtTime(Math.max(0.0001, target), now + 0.08);
    if (!audioEnabled) {
        masterGain.gain.setValueAtTime(0, now + 0.1);
    }
}

/**
 * @param {number} value
 * @param {number} [seconds]
 */
export function fadeDroneBus(value, seconds = 0.8) {
    if (!droneGain || !audioContext) {
        return;
    }

    const now = audioContext.currentTime;
    const next = Math.max(0, value);
    droneGain.gain.cancelScheduledValues(now);
    droneGain.gain.setValueAtTime(Math.max(0.0001, droneGain.gain.value), now);
    droneGain.gain.linearRampToValueAtTime(Math.max(0.0001, next), now + Math.max(0.05, seconds));
    if (next === 0) {
        droneGain.gain.setValueAtTime(0, now + Math.max(0.05, seconds) + 0.02);
    }
}

/** Test helper — drop the shared context so the next unlock creates a new one. */
export function resetGameAudio() {
    for (const hook of resetHooks) {
        hook();
    }
    audioContext = null;
    masterGain = null;
    sfxGain = null;
    droneGain = null;
    audioEnabled = true;
}
