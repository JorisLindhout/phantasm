/**
 * Shared Web Audio context and mix buses.
 * Drone is the loudness reference; one-shots sit on the sfx bus.
 *
 * iOS: do not construct AudioContext except inside a user gesture, and promote
 * the page audio session to `playback` so Web Audio is not treated as ambient.
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

/** One-sample silent WAV — fallback kick for older iOS without AudioSession. */
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

/** @type {AudioContext | null} */
let audioContext = null;
/** @type {GainNode | null} */
let masterGain = null;
/** @type {GainNode | null} */
let sfxGain = null;
/** @type {GainNode | null} */
let droneGain = null;
/** @type {HTMLAudioElement | null} */
let silentUnlockEl = null;
let createdWithoutGesture = false;
/** @type {Array<() => void>} */
const resetHooks = [];
/** @type {Array<() => void>} */
const graphDisposeHooks = [];
let audioEnabled = true;

export function registerAudioReset(hook) {
    resetHooks.push(hook);
}

export function registerAudioGraphDispose(hook) {
    graphDisposeHooks.push(hook);
}

function getAudioContextConstructor() {
    return window.AudioContext || window.webkitAudioContext || null;
}

export function isIosLike(nav = typeof navigator !== 'undefined' ? navigator : {}) {
    const ua = nav.userAgent || '';
    const iOS = /iPad|iPhone|iPod/i.test(ua);
    const iPadOS = nav.platform === 'MacIntel' && (nav.maxTouchPoints || 0) > 1;
    return iOS || iPadOS;
}

export function isGestureUnlockRequired(nav = typeof navigator !== 'undefined' ? navigator : {}) {
    return isIosLike(nav);
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

export function primePlaybackSession(nav = typeof navigator !== 'undefined' ? navigator : {}) {
    try {
        const session = nav.audioSession;
        if (session && session.type !== 'play-and-record' && session.type !== 'playback') {
            session.type = 'playback';
        }
    } catch {
        // AudioSession is Safari-only and may throw if locked.
    }
}

function kickHtmlAudioUnlock() {
    if (!isIosLike()) {
        return;
    }

    const session = typeof navigator !== 'undefined' ? navigator.audioSession : null;
    if (session) {
        return;
    }

    try {
        if (!silentUnlockEl) {
            silentUnlockEl = new Audio(SILENT_WAV);
            silentUnlockEl.loop = true;
            silentUnlockEl.volume = 0.0001;
            silentUnlockEl.playsInline = true;
            silentUnlockEl.setAttribute('playsinline', 'true');
        }
        const play = silentUnlockEl.play();
        play?.catch(() => {});
    } catch {
        // HTMLAudio unlock is best-effort.
    }
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

function disposeDeadContext() {
    for (const hook of graphDisposeHooks) {
        hook();
    }

    try {
        audioContext?.close?.();
    } catch {
        // Already closed.
    }

    audioContext = null;
    masterGain = null;
    sfxGain = null;
    droneGain = null;
    createdWithoutGesture = false;
}

function resumeIfNeeded(audio) {
    if (!audio || audio.state === 'running' || audio.state === 'closed') {
        return;
    }

    audio.resume().catch(() => {});
}

/**
 * Create (once) and resume the shared AudioContext, with mix buses.
 * On iOS, pass `{ fromGesture: true }` from a tap/key handler — a context
 * created on page load never reaches the speaker.
 * @param {{ fromGesture?: boolean }} [options]
 * @returns {AudioContext | null}
 */
export function unlockGameAudio(options = {}) {
    const fromGesture = options.fromGesture === true;
    const AudioContextCtor = getAudioContextConstructor();
    if (!AudioContextCtor) {
        return null;
    }

    if (fromGesture) {
        primePlaybackSession();
        kickHtmlAudioUnlock();
    }

    if (fromGesture && audioContext && audioContext.state !== 'running' && createdWithoutGesture) {
        disposeDeadContext();
    }

    if (!audioContext) {
        if (!fromGesture && isGestureUnlockRequired()) {
            return null;
        }

        try {
            audioContext = new AudioContextCtor();
        } catch {
            return null;
        }

        createdWithoutGesture = !fromGesture;
    }

    ensureMixer(audioContext);

    if (fromGesture || audioContext.state !== 'running') {
        resumeIfNeeded(audioContext);
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
    try {
        silentUnlockEl?.pause?.();
    } catch {
        // Ignore.
    }
    silentUnlockEl = null;
    audioContext = null;
    masterGain = null;
    sfxGain = null;
    droneGain = null;
    createdWithoutGesture = false;
    audioEnabled = true;
}
