import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isDevPanelEnabled, applyDevPanelVisibility } from '../js/dev-panel.js';

describe('dev panel', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <aside id="controlsDrawer" class="controls-drawer open"></aside>
            <button id="drawerToggle" aria-expanded="true"></button>
        `;
    });

    it('is disabled unless VITE_DEV_PANEL is true', () => {
        vi.stubEnv('VITE_DEV_PANEL', 'false');
        expect(isDevPanelEnabled()).toBe(false);

        applyDevPanelVisibility();
        expect(document.body.classList.contains('dev-panel-enabled')).toBe(false);
        expect(document.getElementById('controlsDrawer').classList.contains('open')).toBe(false);

        vi.unstubAllEnvs();
    });

    it('enables dev panel when flag is true', () => {
        vi.stubEnv('VITE_DEV_PANEL', 'true');
        expect(isDevPanelEnabled()).toBe(true);

        applyDevPanelVisibility();
        expect(document.body.classList.contains('dev-panel-enabled')).toBe(true);

        vi.unstubAllEnvs();
    });
});
