/**
 * Fan-triangulated polygon geometry utilities for in-place WebGL updates.
 */

/**
 * @param {Array<[number, number]>} polygon
 * @returns {{ centerX: number, centerY: number }}
 */
export function polygonCenter(polygon) {
    const n = polygon.length;
    let centerX = 0;
    let centerY = 0;

    for (let i = 0; i < n; i++) {
        centerX += polygon[i][0];
        centerY += polygon[i][1];
    }

    return { centerX: centerX / n, centerY: centerY / n };
}

/**
 * Build fan-triangulated vertex, UV, and index arrays for a polygon.
 * @param {Array<[number, number]>} polygon
 * @param {(x: number, y: number) => { u: number, v: number }} uvFn
 * @returns {{ vertices: number[], uvs: number[], indices: number[] }}
 */
export function buildFanTriangulation(polygon, uvFn) {
    const n = polygon.length;
    const { centerX, centerY } = polygonCenter(polygon);
    const vertices = [];
    const uvs = [];
    const indices = [];

    vertices.push(centerX, centerY, 0);
    const centerUV = uvFn(centerX, centerY);
    uvs.push(centerUV.u, centerUV.v);

    for (let i = 0; i < n; i++) {
        const [x, y] = polygon[i];
        vertices.push(x, y, 0);
        const vertexUV = uvFn(x, y);
        uvs.push(vertexUV.u, vertexUV.v);
    }

    for (let i = 0; i < n; i++) {
        const next = (i + 1) % n;
        indices.push(0, 1 + i, 1 + next);
    }

    return { vertices, uvs, indices };
}

/**
 * Update fan-triangulated position and UV buffers in place.
 * @param {Float32Array} positions
 * @param {Float32Array} uvs
 * @param {Array<[number, number]>} animatedPolygon
 * @param {(x: number, y: number) => { u: number, v: number }} uvFn
 */
export function updateFanTriangulationBuffers(positions, uvs, animatedPolygon, uvFn) {
    const n = animatedPolygon.length;
    const { centerX, centerY } = polygonCenter(animatedPolygon);

    positions[0] = centerX;
    positions[1] = centerY;

    const centerUV = uvFn(centerX, centerY);
    uvs[0] = centerUV.u;
    uvs[1] = centerUV.v;

    for (let i = 0; i < n; i++) {
        const positionIndex = (1 + i) * 3;
        const uvIndex = (1 + i) * 2;
        const [x, y] = animatedPolygon[i];

        positions[positionIndex] = x;
        positions[positionIndex + 1] = y;

        const vertexUV = uvFn(x, y);
        uvs[uvIndex] = vertexUV.u;
        uvs[uvIndex + 1] = vertexUV.v;
    }
}

/**
 * Build line-segment vertices for a polygon outline (optionally scaled from center).
 * @param {Array<[number, number]>} polygon
 * @param {number} [scale=1]
 * @returns {number[]}
 */
export function buildBoundaryVertices(polygon, scale = 1) {
    const vertices = [];
    const { centerX, centerY } = polygonCenter(polygon);

    for (let i = 0; i < polygon.length; i++) {
        const current = polygon[i];
        const next = polygon[(i + 1) % polygon.length];

        const scaledCurrentX = centerX + (current[0] - centerX) * scale;
        const scaledCurrentY = centerY + (current[1] - centerY) * scale;
        const scaledNextX = centerX + (next[0] - centerX) * scale;
        const scaledNextY = centerY + (next[1] - centerY) * scale;

        vertices.push(scaledCurrentX, scaledCurrentY, 0);
        vertices.push(scaledNextX, scaledNextY, 0);
    }

    return vertices;
}

/**
 * Update boundary line-segment positions in place.
 * @param {Float32Array} positions
 * @param {Array<[number, number]>} polygon
 * @param {number} [scale=1]
 */
export function updateBoundaryVertices(positions, polygon, scale = 1) {
    const { centerX, centerY } = polygonCenter(polygon);

    for (let i = 0; i < polygon.length; i++) {
        const current = polygon[i];
        const next = polygon[(i + 1) % polygon.length];

        const scaledCurrentX = centerX + (current[0] - centerX) * scale;
        const scaledCurrentY = centerY + (current[1] - centerY) * scale;
        const scaledNextX = centerX + (next[0] - centerX) * scale;
        const scaledNextY = centerY + (next[1] - centerY) * scale;

        const index = i * 6;
        positions[index] = scaledCurrentX;
        positions[index + 1] = scaledCurrentY;
        positions[index + 3] = scaledNextX;
        positions[index + 4] = scaledNextY;
    }
}
