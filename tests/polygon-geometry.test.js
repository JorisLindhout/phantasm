import { describe, it, expect } from 'vitest';
import {
    buildFanTriangulation,
    updateFanTriangulationBuffers,
    buildBoundaryVertices,
    updateBoundaryVertices,
    polygonCenter,
} from '../js/polygon-geometry.js';

const uvFn = (x, y) => ({ u: x / 100, v: y / 100 });
const triangle = [[0, 0], [50, 0], [25, 40]];

describe('polygon geometry utilities', () => {
    it('computes polygon center', () => {
        expect(polygonCenter(triangle)).toEqual({ centerX: 25, centerY: 40 / 3 });
    });

    it('builds fan triangulation with center + perimeter vertices', () => {
        const { vertices, uvs, indices } = buildFanTriangulation(triangle, uvFn);

        expect(vertices.length / 3).toBe(triangle.length + 1);
        expect(uvs.length / 2).toBe(triangle.length + 1);
        expect(indices.length / 3).toBe(triangle.length);
    });

    it('updates fan triangulation buffers in place without changing length', () => {
        const { vertices, uvs } = buildFanTriangulation(triangle, uvFn);
        const positions = new Float32Array(vertices);
        const uvBuffer = new Float32Array(uvs);
        const animated = triangle.map(([x, y]) => [x + 2, y + 3]);

        updateFanTriangulationBuffers(positions, uvBuffer, animated, uvFn);

        expect(positions[0]).toBeCloseTo(27);
        expect(positions[1]).toBeCloseTo(16.333, 1);
        expect(positions[3]).toBeCloseTo(2);
        expect(positions[4]).toBeCloseTo(3);
    });

    it('updates boundary vertices in place', () => {
        const initial = buildBoundaryVertices(triangle, 1.05);
        const positions = new Float32Array(initial);
        const shifted = triangle.map(([x, y]) => [x + 5, y + 5]);

        updateBoundaryVertices(positions, shifted, 1.05);

        expect(positions[0]).not.toBe(initial[0]);
        expect(positions.length).toBe(initial.length);
    });
});
