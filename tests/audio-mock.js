import { vi } from 'vitest';

export function createAudioParam(value = 0) {
    return {
        value,
        setValueAtTime: vi.fn(function setValueAtTime(next) {
            this.value = next;
        }),
        exponentialRampToValueAtTime: vi.fn(function exponentialRampToValueAtTime(next) {
            this.value = next;
        }),
        linearRampToValueAtTime: vi.fn(function linearRampToValueAtTime(next) {
            this.value = next;
        }),
        cancelScheduledValues: vi.fn(),
        setTargetAtTime: vi.fn(function setTargetAtTime(next) {
            this.value = next;
        }),
    };
}

export function createGainNode() {
    return {
        gain: createAudioParam(1),
        connect: vi.fn((node) => node),
        disconnect: vi.fn(),
    };
}

export function createOscillatorNode() {
    return {
        type: 'sine',
        frequency: createAudioParam(440),
        connect: vi.fn((node) => node),
        start: vi.fn(),
        stop: vi.fn(),
    };
}

export function createFilterNode() {
    return {
        type: 'lowpass',
        frequency: createAudioParam(1000),
        Q: createAudioParam(1),
        connect: vi.fn((node) => node),
    };
}

export function createBufferSourceNode() {
    return {
        buffer: null,
        loop: false,
        playbackRate: createAudioParam(1),
        connect: vi.fn((node) => node),
        start: vi.fn(),
        stop: vi.fn(),
    };
}

export function createMockAudioContext(state = 'running') {
    const destination = { id: 'destination' };
    const gains = [];
    const oscillators = [];
    const filters = [];
    const sources = [];

    const ctx = {
        state,
        currentTime: 1.25,
        sampleRate: 44100,
        destination,
        resume: vi.fn().mockResolvedValue(undefined),
        createGain: vi.fn(() => {
            const node = createGainNode();
            gains.push(node);
            return node;
        }),
        createOscillator: vi.fn(() => {
            const node = createOscillatorNode();
            oscillators.push(node);
            return node;
        }),
        createBiquadFilter: vi.fn(() => {
            const node = createFilterNode();
            filters.push(node);
            return node;
        }),
        createBuffer: vi.fn((channels, length, sampleRate) => ({
            numberOfChannels: channels,
            length,
            sampleRate,
            getChannelData: vi.fn(() => new Float32Array(length)),
        })),
        createBufferSource: vi.fn(() => {
            const node = createBufferSourceNode();
            sources.push(node);
            return node;
        }),
        _nodes: { gains, oscillators, filters, sources, destination },
    };

    return ctx;
}
