/**
 * Separate piece geometry using Three.js ShapeGeometry (earcut triangulation).
 * Matches the original main-branch rendering for dragged puzzle pieces.
 */

import * as THREE from 'three';
import { buildFanTriangulation } from './polygon-geometry.js';

export const SEPARATE_PIECE_GEOMETRY_STRATEGY = 'shape-geometry';

/**
 * @param {Array<[number, number]>} polygon
 * @returns {THREE.Shape}
 */
export function createShapeFromPolygon(polygon) {
    const shape = new THREE.Shape();
    shape.moveTo(polygon[0][0], polygon[0][1]);

    for (let i = 1; i < polygon.length; i++) {
        shape.lineTo(polygon[i][0], polygon[i][1]);
    }

    return shape;
}

/**
 * @param {Array<[number, number]>} polygon
 * @param {(x: number, y: number) => { u: number, v: number }} uvFn
 * @returns {THREE.ShapeGeometry}
 */
export function buildSeparatePieceGeometry(polygon, uvFn) {
    const shape = createShapeFromPolygon(polygon);
    const geometry = new THREE.ShapeGeometry(shape);

    if (geometry.attributes.position) {
        const positions = geometry.attributes.position.array;
        const uvs = [];

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const vertexUV = uvFn(x, y);
            uvs.push(vertexUV.u, vertexUV.v);
        }

        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    }

    return geometry;
}

/**
 * ShapeGeometry uses earcut vertices; fan triangulation uses center + boundary.
 * @param {Array<[number, number]>} polygon
 * @returns {boolean}
 */
export function usesShapeGeometryStrategy(polygon) {
    const uvFn = () => ({ u: 0, v: 0 });
    const shapeGeometry = buildSeparatePieceGeometry(polygon, uvFn);
    const fan = buildFanTriangulation(polygon, uvFn);

    const shapeVertexCount = shapeGeometry.attributes.position.count;
    const fanVertexCount = fan.vertices.length / 3;

    return shapeVertexCount !== fanVertexCount;
}
