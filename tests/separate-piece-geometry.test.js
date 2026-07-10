import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
    SEPARATE_PIECE_GEOMETRY_STRATEGY,
    buildSeparatePieceGeometry,
    createShapeFromPolygon,
    usesShapeGeometryStrategy,
} from '../js/separate-piece-geometry.js';

const square = [[0, 0], [100, 0], [100, 100], [0, 100]];
const uvFn = (x, y) => ({ u: x / 100, v: y / 100 });

describe('separate piece geometry', () => {
    it('uses the shape-geometry strategy', () => {
        expect(SEPARATE_PIECE_GEOMETRY_STRATEGY).toBe('shape-geometry');
    });

    it('builds Three.js ShapeGeometry for separate pieces', () => {
        const geometry = buildSeparatePieceGeometry(square, uvFn);
        expect(geometry).toBeInstanceOf(THREE.ShapeGeometry);
        expect(geometry.attributes.uv).toBeDefined();
        expect(geometry.attributes.position.count).toBeGreaterThanOrEqual(square.length);
    });

    it('creates a closed shape from the polygon outline', () => {
        const shape = createShapeFromPolygon(square);
        expect(shape).toBeInstanceOf(THREE.Shape);
    });

    it('does not use fan triangulation vertex layout', () => {
        expect(usesShapeGeometryStrategy(square)).toBe(true);
    });
});
