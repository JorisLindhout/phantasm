/**
 * Dev tuning panel visibility (level selector, sliders, regenerate).
 * Hidden in production unless VITE_DEV_PANEL=true.
 */

export function isDevPanelEnabled() {
    return import.meta.env.VITE_DEV_PANEL === 'true';
}

export function applyDevPanelVisibility() {
    const enabled = isDevPanelEnabled();
    document.body.classList.toggle('dev-panel-enabled', enabled);

    const drawer = document.getElementById('controlsDrawer');
    const toggle = document.getElementById('drawerToggle');

    if (!enabled) {
        drawer?.classList.remove('open');
        drawer?.setAttribute('aria-hidden', 'true');
        toggle?.setAttribute('aria-expanded', 'false');
    }
}
