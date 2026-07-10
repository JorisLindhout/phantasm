/**
 * Three.js color configuration to match legacy r128 rendering.
 */

import * as THREE from 'three';

export const THREE_COLOR_PROFILE = 'legacy-r128';

/**
 * Disable modern color management so puzzle colors match the original CDN build.
 */
export function configureLegacyColorPipeline() {
    THREE.ColorManagement.enabled = false;
}

/**
 * @param {THREE.WebGLRenderer|null} renderer
 */
export function configureRendererColors(renderer) {
    configureLegacyColorPipeline();

    if (renderer) {
        renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        renderer.toneMapping = THREE.NoToneMapping;
    }
}

/**
 * @param {THREE.Texture|null} texture
 */
export function configureTextureColors(texture) {
    configureLegacyColorPipeline();

    if (texture) {
        texture.colorSpace = THREE.NoColorSpace;
    }

    return texture;
}

/**
 * @returns {boolean}
 */
export function isLegacyColorProfileActive() {
    return THREE.ColorManagement.enabled === false;
}
