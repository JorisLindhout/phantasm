import { describe, it, expect, vi } from 'vitest';
import { themeManager } from '../js/theme-manager.js';
import { THEMES } from '../js/theme.js';
import { WebGLVoronoiRenderer } from '../js/webgl-renderer.js';
import { SLOT_GHOST_OPACITY } from '../js/unsolved-layout.js';

describe('theme outline sync', () => {
    it('syncRendererTheme applies the active theme before outline creation', () => {
        themeManager.applyTheme('levelOne');

        const updateTheme = vi.fn();
        const renderer = { updateTheme };

        themeManager.syncRendererTheme(renderer);

        expect(updateTheme).toHaveBeenCalledWith(THEMES.levelOne);
    });

    it('updateOutlineColors uses level slot and grid colors', () => {
        const gridColor = { setHex: vi.fn() };
        const slotColor = { setHex: vi.fn() };
        const slotMaterial = { color: slotColor, opacity: 1 };

        const renderer = {
            currentTheme: THEMES.levelOne,
            connectedOutline: { material: { color: gridColor } },
            slotGhostOutlines: [{ material: slotMaterial }],
            pieces: [],
            getThemeColor: WebGLVoronoiRenderer.prototype.getThemeColor,
        };

        WebGLVoronoiRenderer.prototype.updateOutlineColors.call(renderer);

        expect(gridColor.setHex).toHaveBeenCalledWith(THEMES.levelOne.colors.outlineNormal.hex);
        expect(slotColor.setHex).toHaveBeenCalledWith(THEMES.levelOne.colors.slotOutline.hex);
        expect(slotMaterial.opacity).toBe(SLOT_GHOST_OPACITY);
        expect(gridColor.setHex).not.toHaveBeenCalledWith(0x00ddff);
    });
});
