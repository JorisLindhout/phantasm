import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
    THREE_COLOR_PROFILE,
    configureLegacyColorPipeline,
    configureRendererColors,
    configureTextureColors,
    isLegacyColorProfileActive,
} from '../js/three-config.js';

describe('three color configuration', () => {
    beforeEach(() => {
        THREE.ColorManagement.enabled = true;
    });

    it('targets the legacy r128 profile', () => {
        expect(THREE_COLOR_PROFILE).toBe('legacy-r128');
    });

    it('disables modern color management', () => {
        configureLegacyColorPipeline();
        expect(isLegacyColorProfileActive()).toBe(true);
    });

    it('configures renderer output for legacy colors', () => {
        const renderer = {
            outputColorSpace: THREE.SRGBColorSpace,
            toneMapping: THREE.ACESFilmicToneMapping,
        };

        configureRendererColors(renderer);

        expect(renderer.outputColorSpace).toBe(THREE.LinearSRGBColorSpace);
        expect(renderer.toneMapping).toBe(THREE.NoToneMapping);
        expect(isLegacyColorProfileActive()).toBe(true);
    });

    it('configures background textures without sRGB conversion', () => {
        const texture = new THREE.Texture();
        configureTextureColors(texture);
        expect(texture.colorSpace).toBe(THREE.NoColorSpace);
    });
});
