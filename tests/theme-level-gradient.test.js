import { describe, it, expect, beforeEach } from 'vitest';
import { themeManager } from '../js/theme-manager.js';

describe('level gradient CSS variable', () => {
    beforeEach(() => {
        document.documentElement.style.removeProperty('--level-gradient');
    });

    it('sets level 1 SVG-matched gradient stops', () => {
        themeManager.applyTheme('levelOne');

        const root = document.documentElement.style;

        expect(root.getPropertyValue('--level-gradient-angle').trim()).toBe('135deg');
        expect(root.getPropertyValue('--level-gradient-start').trim().toLowerCase()).toBe('#0dad9e');
        expect(root.getPropertyValue('--level-gradient-end').trim().toLowerCase()).toBe('#3768fe');

        const gradient = root.getPropertyValue('--level-gradient');
        expect(gradient).toContain('135deg');
        expect(gradient.toLowerCase()).toContain('#0dad9e');
        expect(gradient.toLowerCase()).toContain('#3768fe');
    });

    it('sets level 2 SVG-matched gradient stops', () => {
        themeManager.applyTheme('levelTwo');

        const root = document.documentElement.style;

        expect(root.getPropertyValue('--level-gradient-start').trim().toLowerCase()).toBe('#659be9');
        expect(root.getPropertyValue('--level-gradient-end').trim().toLowerCase()).toBe('#7a4edf');

        const gradient = root.getPropertyValue('--level-gradient');
        expect(gradient).toContain('135deg');
        expect(gradient.toLowerCase()).toContain('#659be9');
        expect(gradient.toLowerCase()).toContain('#7a4edf');
    });

    it('sets phantasm fallback gradient', () => {
        themeManager.applyTheme('phantasm');

        const gradient = document.documentElement.style.getPropertyValue('--level-gradient');

        expect(gradient).toContain('135deg');
        expect(gradient.toLowerCase()).toContain('#00ddff');
        expect(gradient.toLowerCase()).toContain('#00ff64');
    });
});
