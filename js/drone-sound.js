/**
 * Looping drone bed (Web Audio). One graph, retargeted per level.
 */

import { prefersReducedMotion } from './accessibility.js';
import {
    unlockGameAudio,
    getDroneInput,
    fadeDroneBus,
    MIX,
    registerAudioReset,
    registerAudioGraphDispose,
    isAudioEnabled,
    isGestureUnlockRequired,
} from './game-audio.js';

export const DRONE_SOUND = {
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
};

/** Timbre evolves; toneGain stays put so loudness stays matched to the mixer. */
export const DRONE_BY_LEVEL = {
    'level-1': DRONE_SOUND,
    'level-2': {
        ...DRONE_SOUND,
        freq: 114,
        detuneHz: 0.42,
        filterFreq: 1400,
        filterQ: 1.35,
        lfoRate: 0.82,
        lfoDepth: 175,
        slowRate: 0.23,
        slowDepth: 760,
        pitchDrift: 6.4,
        wander: 300,
        shimmer: 0.046,
    },
    'level-3': {
        ...DRONE_SOUND,
        freq: 136.5,
        detuneHz: 0.52,
        filterFreq: 1850,
        filterQ: 1.25,
        lfoRate: 1.05,
        lfoDepth: 230,
        slowRate: 0.28,
        slowDepth: 820,
        pitchDrift: 7.2,
        wander: 380,
        shimmer: 0.052,
    },
    'level-4': {
        ...DRONE_SOUND,
        freq: 182,
        detuneHz: 0.66,
        filterFreq: 2400,
        filterQ: 1.15,
        lfoRate: 1.28,
        lfoDepth: 290,
        slowRate: 0.34,
        slowDepth: 880,
        pitchDrift: 8,
        wander: 460,
        shimmer: 0.058,
    },
};

export const DRONE_LEVEL_RAMP_S = 2.2;
export const DRONE_MANUAL_RAMP_S = 0.8;

/** @type {object | null} */
let drone = null;
/** @type {AudioBuffer | null} */
let noiseBuffer = null;
/** @type {AudioBuffer | null} */
let wanderBuffer = null;
/** @type {ReturnType<typeof setTimeout> | number} */
let stopTimer = 0;
let activeLevelId = 'level-1';

export function droneParamsForLevel(levelId) {
    return DRONE_BY_LEVEL[levelId] ?? DRONE_SOUND;
}

function getNoiseBuffer(audio) {
    if (noiseBuffer) return noiseBuffer;
    const seconds = 2;
    const length = Math.ceil(audio.sampleRate * seconds);
    noiseBuffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
}

function getWanderBuffer(audio) {
    if (wanderBuffer) return wanderBuffer;
    const seconds = 16;
    const length = Math.ceil(audio.sampleRate * seconds);
    wanderBuffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = wanderBuffer.getChannelData(0);
    let y = 0;
    for (let i = 0; i < length; i++) {
        y += (Math.random() * 2 - 1) * 0.0018;
        y *= 0.9997;
        data[i] = y;
    }
    let peak = 0;
    for (let i = 0; i < length; i++) {
        peak = Math.max(peak, Math.abs(data[i]));
    }
    if (peak > 0) {
        for (let i = 0; i < length; i++) {
            data[i] /= peak;
        }
    }
    return wanderBuffer;
}

function rampParam(param, value, now, seconds) {
    const next = Math.max(0, value);
    param.cancelScheduledValues(now);
    param.setTargetAtTime(next, now, Math.max(0.02, seconds / 3));
}

function applyDroneParams(params, seconds = 0.08) {
    if (!drone) return;
    const audio = unlockGameAudio();
    if (!audio) return;

    const p = params;
    const now = audio.currentTime;
    const pitch = Math.max(20, p.freq);
    const beat = Math.max(0, p.detuneHz);
    const shimmerPitch = pitch * 1.4983;

    drone.oscA.type = p.wave;
    drone.oscB.type = p.wave;
    drone.oscShimmer.type = 'sine';
    drone.airFilter.type = 'bandpass';
    drone.filter.type = 'lowpass';

    rampParam(drone.oscA.frequency, pitch, now, seconds);
    rampParam(drone.oscB.frequency, pitch + beat, now, seconds);
    rampParam(drone.oscShimmer.frequency, shimmerPitch, now, seconds);
    rampParam(drone.tone.gain, p.toneGain, now, seconds);
    rampParam(drone.filter.frequency, p.filterFreq, now, seconds);
    rampParam(drone.filter.Q, p.filterQ, now, seconds);
    rampParam(drone.lfo.frequency, Math.max(0.02, p.lfoRate), now, seconds);
    rampParam(drone.lfoGain.gain, p.lfoDepth, now, seconds);
    rampParam(drone.slowLfo.frequency, Math.max(0.02, p.slowRate), now, seconds);
    rampParam(drone.slowFilterGain.gain, p.slowDepth, now, seconds);
    rampParam(drone.slowPitchGain.gain, p.pitchDrift * 0.45, now, seconds);
    rampParam(drone.slowSwell.gain, Math.min(p.toneGain * 0.35, 0.012), now, seconds);
    rampParam(drone.wanderFilterGain.gain, p.wander, now, seconds);
    rampParam(drone.wanderPitchGain.gain, p.pitchDrift, now, seconds);
    rampParam(drone.shimmerGain.gain, p.shimmer, now, seconds);
    rampParam(drone.shimmerLfo.frequency, 0.041, now, seconds);
    rampParam(drone.shimmerLfoGain.gain, p.shimmer * 0.7, now, seconds);
    rampParam(drone.noiseGain.gain, p.noiseGain, now, seconds);
    rampParam(drone.airFilter.frequency, p.noiseFreq, now, seconds);
    rampParam(drone.airFilter.Q, p.noiseQ, now, seconds);
}

function buildDrone(audio, output) {
    const now = audio.currentTime;
    const master = audio.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(1, now + 0.45);
    master.connect(output);

    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.connect(master);

    const tone = audio.createGain();
    tone.connect(filter);

    const oscA = audio.createOscillator();
    const oscB = audio.createOscillator();
    oscA.connect(tone);
    oscB.connect(tone);

    const oscShimmer = audio.createOscillator();
    const shimmerGain = audio.createGain();
    oscShimmer.connect(shimmerGain).connect(filter);

    const lfo = audio.createOscillator();
    lfo.type = 'sine';
    const lfoGain = audio.createGain();
    lfo.connect(lfoGain).connect(filter.frequency);

    const slowLfo = audio.createOscillator();
    slowLfo.type = 'sine';
    const slowFilterGain = audio.createGain();
    const slowPitchGain = audio.createGain();
    const slowSwell = audio.createGain();
    slowLfo.connect(slowFilterGain).connect(filter.frequency);
    slowLfo.connect(slowPitchGain);
    slowPitchGain.connect(oscA.frequency);
    slowPitchGain.connect(oscB.frequency);
    slowLfo.connect(slowSwell).connect(tone.gain);

    const shimmerLfo = audio.createOscillator();
    shimmerLfo.type = 'sine';
    const shimmerLfoGain = audio.createGain();
    shimmerLfo.connect(shimmerLfoGain).connect(shimmerGain.gain);

    const wander = audio.createBufferSource();
    wander.buffer = getWanderBuffer(audio);
    wander.loop = true;
    wander.playbackRate.value = 0.13;
    const wanderFilterGain = audio.createGain();
    const wanderPitchGain = audio.createGain();
    wander.connect(wanderFilterGain).connect(filter.frequency);
    wander.connect(wanderPitchGain);
    wanderPitchGain.connect(oscA.frequency);
    wanderPitchGain.connect(oscB.frequency);
    wanderPitchGain.connect(oscShimmer.frequency);

    const noise = audio.createBufferSource();
    noise.buffer = getNoiseBuffer(audio);
    noise.loop = true;
    const airFilter = audio.createBiquadFilter();
    airFilter.type = 'bandpass';
    const noiseGain = audio.createGain();
    noise.connect(airFilter).connect(noiseGain).connect(master);

    return {
        master, filter, tone, oscA, oscB, oscShimmer, shimmerGain,
        lfo, lfoGain, slowLfo, slowFilterGain, slowPitchGain, slowSwell,
        shimmerLfo, shimmerLfoGain, wander, wanderFilterGain, wanderPitchGain,
        noise, airFilter, noiseGain,
    };
}

function startSources(nodes, audio) {
    const now = audio.currentTime;
    nodes.oscA.start(now);
    nodes.oscB.start(now);
    nodes.oscShimmer.start(now);
    nodes.lfo.start(now);
    nodes.slowLfo.start(now);
    nodes.shimmerLfo.start(now);
    nodes.wander.start(now);
    nodes.noise.start(now);
}

/**
 * @param {string} [levelId]
 * @param {{ seconds?: number }} [options]
 */
export function startDroneForLevel(levelId = 'level-1', options = {}) {
    activeLevelId = DRONE_BY_LEVEL[levelId] ? levelId : 'level-1';
    if (!isAudioEnabled() && !drone) {
        return false;
    }
    const audio = unlockGameAudio(options);
    const output = getDroneInput();
    if (!audio || !output) {
        return false;
    }

    const params = droneParamsForLevel(activeLevelId);
    const reduced = prefersReducedMotion();
    const seconds = options.seconds ?? (reduced ? 0.2 : DRONE_MANUAL_RAMP_S);

    fadeDroneBus(MIX.drone, reduced ? 0.2 : 0.45);

    if (drone) {
        applyDroneParams(params, seconds);
        return true;
    }

    window.clearTimeout(stopTimer);
    drone = buildDrone(audio, output);
    applyDroneParams(params, 0.02);
    startSources(drone, audio);
    return true;
}

/**
 * @param {string} levelId
 * @param {{ seconds?: number }} [options]
 */
export function setDroneForLevel(levelId, options = {}) {
    const reduced = prefersReducedMotion();
    const seconds = options.seconds ?? (reduced ? 0.2 : DRONE_LEVEL_RAMP_S);
    activeLevelId = DRONE_BY_LEVEL[levelId] ? levelId : 'level-1';

    if (!drone) {
        return startDroneForLevel(activeLevelId, { seconds });
    }

    applyDroneParams(droneParamsForLevel(activeLevelId), seconds);
    fadeDroneBus(MIX.drone, Math.min(seconds, 0.8));
    return true;
}

export function fadeDrone(value, seconds = 0.8) {
    fadeDroneBus(value, seconds);
}

export function stopDrone() {
    if (!drone) return;
    const nodes = drone;
    const audio = unlockGameAudio();
    const now = audio?.currentTime ?? 0;
    if (nodes.master?.gain && audio) {
        nodes.master.gain.cancelScheduledValues(now);
        nodes.master.gain.setValueAtTime(Math.max(0.0001, nodes.master.gain.value), now);
        nodes.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    }
    drone = null;

    stopTimer = window.setTimeout(() => {
        const sources = [
            nodes.oscA, nodes.oscB, nodes.oscShimmer,
            nodes.lfo, nodes.slowLfo, nodes.shimmerLfo,
            nodes.wander, nodes.noise,
        ];
        for (const source of sources) {
            try { source.stop(); } catch { /* already stopped */ }
        }
        try { nodes.master.disconnect(); } catch { /* already disconnected */ }
    }, 240);
}

export function unlockAndStartBed(options = {}) {
    const audio = unlockGameAudio(options);
    if (!audio) {
        return null;
    }

    if (!isAudioEnabled()) {
        return audio;
    }

    const levelId = window.levelManager?.currentLevel ?? activeLevelId ?? 'level-1';
    startDroneForLevel(levelId, {
        seconds: prefersReducedMotion() ? 0.2 : 0.6,
        fromGesture: options.fromGesture,
    });
    return audio;
}

const GESTURE_EVENTS = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];
const GESTURE_LISTENER = { capture: true, passive: true };
let gestureResumeArmed = false;

function resumeDroneFromGesture() {
    const audio = unlockAndStartBed({ fromGesture: true });
    if (audio?.state === 'running') {
        detachGestureResume();
        return;
    }

    audio?.resume?.().then(() => {
        if (audio.state === 'running') {
            detachGestureResume();
        }
    }).catch(() => {});
}

function detachGestureResume() {
    if (!gestureResumeArmed) {
        return;
    }

    gestureResumeArmed = false;
    for (const eventName of GESTURE_EVENTS) {
        document.removeEventListener(eventName, resumeDroneFromGesture, GESTURE_LISTENER);
    }
}

function armGestureResume() {
    if (gestureResumeArmed) {
        return;
    }

    gestureResumeArmed = true;
    for (const eventName of GESTURE_EVENTS) {
        document.addEventListener(eventName, resumeDroneFromGesture, GESTURE_LISTENER);
    }
}

/**
 * Start the bed as soon as the app is ready. On iOS, wait for a tap so the
 * AudioContext is born inside a user gesture; a load-time context stays silent.
 * @returns {AudioContext | null}
 */
export function startDroneOnLoad() {
    if (isGestureUnlockRequired()) {
        armGestureResume();
        return null;
    }

    const audio = unlockAndStartBed();
    if (audio?.state === 'running') {
        detachGestureResume();
        return audio;
    }

    armGestureResume();
    return audio;
}

export function isDroneRunning() {
    return drone !== null;
}

function disposeDroneGraph() {
    window.clearTimeout(stopTimer);
    if (drone) {
        const nodes = drone;
        drone = null;
        const sources = [
            nodes.oscA, nodes.oscB, nodes.oscShimmer,
            nodes.lfo, nodes.slowLfo, nodes.shimmerLfo,
            nodes.wander, nodes.noise,
        ];
        for (const source of sources) {
            try { source.stop(); } catch { /* already stopped */ }
        }
        try { nodes.master.disconnect(); } catch { /* already disconnected */ }
    }
    noiseBuffer = null;
    wanderBuffer = null;
}

export function resetDrone() {
    disposeDroneGraph();
    detachGestureResume();
    activeLevelId = 'level-1';
}

registerAudioReset(resetDrone);
registerAudioGraphDispose(disposeDroneGraph);
