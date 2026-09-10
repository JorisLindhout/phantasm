import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { bindAudioToggle, syncAudioToggle } from '../js/audio-toggle.js';
import { isAudioEnabled, resetGameAudio, setAudioEnabled } from '../js/game-audio.js';

vi.mock('../js/drone-sound.js', () => ({
    unlockAndStartBed: vi.fn(),
}));

import { unlockAndStartBed } from '../js/drone-sound.js';

describe('audio toggle', () => {
    beforeEach(() => {
        resetGameAudio();
        document.body.innerHTML = `
            <button id="audioToggleBtn" type="button" aria-pressed="true" aria-label="Mute sound"></button>
        `;
        vi.mocked(unlockAndStartBed).mockClear();
    });

    afterEach(() => {
        resetGameAudio();
        vi.restoreAllMocks();
    });

    it('defaults to on and mutes on click', () => {
        const button = document.getElementById('audioToggleBtn');
        bindAudioToggle(button);

        expect(isAudioEnabled()).toBe(true);
        button.click();

        expect(isAudioEnabled()).toBe(false);
        expect(button.getAttribute('aria-pressed')).toBe('false');
        expect(button.getAttribute('aria-label')).toBe('Unmute sound');
        expect(unlockAndStartBed).not.toHaveBeenCalled();
    });

    it('unmutes and starts the bed on the next click', () => {
        const button = document.getElementById('audioToggleBtn');
        bindAudioToggle(button);
        setAudioEnabled(false);
        syncAudioToggle(button);

        button.click();

        expect(isAudioEnabled()).toBe(true);
        expect(button.getAttribute('aria-pressed')).toBe('true');
        expect(button.getAttribute('aria-label')).toBe('Mute sound');
        expect(unlockAndStartBed).toHaveBeenCalledTimes(1);
        expect(unlockAndStartBed).toHaveBeenCalledWith({ fromGesture: true });
    });
});
