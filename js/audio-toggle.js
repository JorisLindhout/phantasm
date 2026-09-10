/**
 * Stage-corner audio mute toggle.
 */

import { isAudioEnabled, setAudioEnabled } from './game-audio.js';
import { unlockAndStartBed } from './drone-sound.js';

export function syncAudioToggle(button = document.getElementById('audioToggleBtn')) {
    if (!button) {
        return;
    }

    const enabled = isAudioEnabled();
    button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    button.setAttribute('aria-label', enabled ? 'Mute sound' : 'Unmute sound');
}

/**
 * @param {HTMLButtonElement | null} [button]
 */
export function bindAudioToggle(button = document.getElementById('audioToggleBtn')) {
    if (!button || button.dataset.bound === 'true') {
        return;
    }

    button.dataset.bound = 'true';
    syncAudioToggle(button);

    button.addEventListener('click', () => {
        const enabled = setAudioEnabled(!isAudioEnabled());
        syncAudioToggle(button);
        if (enabled) {
            unlockAndStartBed({ fromGesture: true });
        }
    });
}
