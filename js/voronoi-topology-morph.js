/**
 * Shared Voronoi topology morph — corner births/deaths on the global diagram
 * so adjacent pieces stay flush and the puzzle still tiles.
 *
 * Morph corner count stays constant: N corners are seeded at level start, then
 * each event pairs a death with a birth on a free primal edge.
 */

import { polygonCenter } from './polygon-geometry.js';

export const VERTEX_MERGE_EPSILON = 0.75;
export const CORNER_MORPH_INTERVAL_MS = 3500;
export const CORNER_MORPH_TRANSITION_MS = 1000;
export const CORNER_BIRTH_OFFSET_PX = 18;
export const DEFAULT_MORPH_CORNER_COUNT = 3;

const TIME_SCALE = 0.002;
const SPATIAL_SCALE = 0.015;

/**
 * @param {number} ax
 * @param {number} ay
 * @param {number} bx
 * @param {number} by
 * @param {number} epsilon
 * @returns {boolean}
 */
export function pointsEqual(ax, ay, bx, by, epsilon = VERTEX_MERGE_EPSILON) {
    return Math.hypot(ax - bx, ay - by) <= epsilon;
}

/**
 * Build a shared vertex/edge graph from cell polygons (Voronoi tiling).
 * Nearby corners are merged so adjacent cells share the same vertex ids.
 *
 * @param {Array<Array<[number, number]>>} polygons
 * @param {number} [epsilon]
 * @returns {{
 *   vertices: Array<{ x: number, y: number, homeX: number, homeY: number, born: boolean }>,
 *   cells: number[][],
 *   edges: Array<{ a: number, b: number, cells: number[] }>
 * }}
 */
export function buildSharedTopology(polygons, epsilon = VERTEX_MERGE_EPSILON) {
    const vertices = [];
    const cells = [];

    function findOrAddVertex(x, y) {
        for (let i = 0; i < vertices.length; i++) {
            if (pointsEqual(vertices[i].x, vertices[i].y, x, y, epsilon)) {
                return i;
            }
        }
        vertices.push({
            x,
            y,
            homeX: x,
            homeY: y,
            born: false,
        });
        return vertices.length - 1;
    }

    for (let cellIndex = 0; cellIndex < polygons.length; cellIndex++) {
        const polygon = polygons[cellIndex];
        if (!polygon || polygon.length < 3) {
            cells.push([]);
            continue;
        }

        const ring = [];
        for (let i = 0; i < polygon.length; i++) {
            const [x, y] = polygon[i];
            const id = findOrAddVertex(x, y);
            if (ring.length === 0 || ring[ring.length - 1] !== id) {
                ring.push(id);
            }
        }
        // Close ring: drop duplicate last==first if present from voronoi generators
        if (ring.length > 1 && ring[0] === ring[ring.length - 1]) {
            ring.pop();
        }
        cells.push(ring);
    }

    const edgeMap = new Map();
    function edgeKey(a, b) {
        return a < b ? `${a}:${b}` : `${b}:${a}`;
    }

    for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
        const ring = cells[cellIndex];
        const n = ring.length;
        for (let i = 0; i < n; i++) {
            const a = ring[i];
            const b = ring[(i + 1) % n];
            if (a === b) continue;
            const key = edgeKey(a, b);
            let edge = edgeMap.get(key);
            if (!edge) {
                edge = { a: Math.min(a, b), b: Math.max(a, b), cells: [] };
                edgeMap.set(key, edge);
            }
            if (!edge.cells.includes(cellIndex)) {
                edge.cells.push(cellIndex);
            }
        }
    }

    return {
        vertices,
        cells,
        edges: Array.from(edgeMap.values()),
    };
}

/**
 * Extract cell polygons from topology using current vertex positions.
 * @param {{ vertices: Array<{ x: number, y: number }>, cells: number[][] }} topology
 * @returns {Array<Array<[number, number]>>}
 */
export function extractCellPolygons(topology) {
    return topology.cells.map((ring) => {
        if (!ring || ring.length < 3) return [];
        return ring.map((id) => {
            const v = topology.vertices[id];
            return [v.x, v.y];
        });
    });
}

/**
 * Apply shared sinusoidal noise to all non-transitioning vertices (same input → same offset).
 * @param {Array<{ x: number, y: number, homeX: number, homeY: number, transition?: object|null }>} vertices
 * @param {number} time
 * @param {number} noiseAmplitude
 */
export function applySharedVertexNoise(vertices, time, noiseAmplitude) {
    for (let i = 0; i < vertices.length; i++) {
        const v = vertices[i];
        if (v.transition) continue;

        const hx = v.homeX;
        const hy = v.homeY;
        const noiseX = Math.sin(time * TIME_SCALE + hx * SPATIAL_SCALE + hy * SPATIAL_SCALE * 0.7) * noiseAmplitude * 0.8;
        const noiseY = Math.cos(time * TIME_SCALE * 1.3 + hx * SPATIAL_SCALE * 0.8 + hy * SPATIAL_SCALE) * noiseAmplitude * 0.8;
        v.x = hx + noiseX;
        v.y = hy + noiseY;
    }
}

/**
 * @param {number} ax
 * @param {number} ay
 * @param {number} bx
 * @param {number} by
 * @returns {{ nx: number, ny: number }}
 */
function edgeNormal(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    return { nx: -dy / len, ny: dx / len };
}

/**
 * Edge between two original (non-born) vertices — eligible for a morph corner.
 * @param {{ vertices: Array<{ born?: boolean }> }} topology
 * @param {{ a: number, b: number }} edge
 * @returns {boolean}
 */
export function isPrimalEdge(topology, edge) {
    if (!edge) return false;
    const va = topology.vertices[edge.a];
    const vb = topology.vertices[edge.b];
    return Boolean(va && vb && !va.born && !vb.born);
}

/**
 * Indices of primal edges in topology.edges.
 * @param {{ vertices: Array<{ born?: boolean }>, edges: Array<{ a: number, b: number }> }} topology
 * @returns {number[]}
 */
export function listPrimalEdgeIndices(topology) {
    const indices = [];
    for (let i = 0; i < topology.edges.length; i++) {
        if (isPrimalEdge(topology, topology.edges[i])) {
            indices.push(i);
        }
    }
    return indices;
}

/**
 * @param {{ vertices: any[], cells: number[][], edges: any[] }} topology
 * @param {number} edgeIndex
 * @param {number} offsetPx
 * @returns {{ midX: number, midY: number, targetX: number, targetY: number } | null}
 */
function computeBirthTargets(topology, edgeIndex, offsetPx) {
    const edge = topology.edges[edgeIndex];
    if (!edge) return null;

    const va = topology.vertices[edge.a];
    const vb = topology.vertices[edge.b];
    const midX = (va.homeX + vb.homeX) / 2;
    const midY = (va.homeY + vb.homeY) / 2;
    const { nx, ny } = edgeNormal(va.homeX, va.homeY, vb.homeX, vb.homeY);

    // Bias normal toward the first cell's centroid so the bulge is visible
    let sign = 1;
    if (edge.cells.length > 0) {
        const ring = topology.cells[edge.cells[0]];
        const poly = ring.map((id) => [topology.vertices[id].homeX, topology.vertices[id].homeY]);
        const { centerX, centerY } = polygonCenter(poly);
        const toCenterX = centerX - midX;
        const toCenterY = centerY - midY;
        if (nx * toCenterX + ny * toCenterY < 0) {
            sign = -1;
        }
    }

    return {
        midX,
        midY,
        targetX: midX + nx * offsetPx * sign,
        targetY: midY + ny * offsetPx * sign,
    };
}

/**
 * Insert born vertex into every cell ring that contains the edge.
 * @param {{ cells: number[][], edges: any[] }} topology
 * @param {{ a: number, b: number, cells: number[] }} edge
 * @param {number} newId
 */
function insertVertexOnEdgeRings(topology, edge, newId) {
    for (const cellIndex of edge.cells) {
        const ring = topology.cells[cellIndex];
        const n = ring.length;
        for (let i = 0; i < n; i++) {
            const curr = ring[i];
            const next = ring[(i + 1) % n];
            if ((curr === edge.a && next === edge.b) || (curr === edge.b && next === edge.a)) {
                ring.splice(i + 1, 0, newId);
                break;
            }
        }
    }
}

/**
 * Insert a new corner on an edge (shared by 1–2 cells). Returns new vertex id or -1.
 * Only call on primal edges to avoid recursive subdivision.
 * @param {{ vertices: any[], cells: number[][], edges: any[] }} topology
 * @param {number} edgeIndex
 * @param {number} offsetPx
 * @returns {number}
 */
export function birthCornerOnEdge(topology, edgeIndex, offsetPx = CORNER_BIRTH_OFFSET_PX) {
    const edge = topology.edges[edgeIndex];
    if (!edge || !isPrimalEdge(topology, edge)) return -1;

    const targets = computeBirthTargets(topology, edgeIndex, offsetPx);
    if (!targets) return -1;

    const { midX, midY, targetX, targetY } = targets;
    const newId = topology.vertices.length;
    topology.vertices.push({
        x: midX,
        y: midY,
        homeX: midX,
        homeY: midY,
        born: true,
        transition: {
            kind: 'birth',
            startX: midX,
            startY: midY,
            endX: targetX,
            endY: targetY,
            endHomeX: targetX,
            endHomeY: targetY,
            startTime: 0,
            duration: CORNER_MORPH_TRANSITION_MS,
        },
    });

    insertVertexOnEdgeRings(topology, edge, newId);
    rebuildEdges(topology);
    return newId;
}

/**
 * Insert a morph corner at its final bulge position (no transition).
 * @param {{ vertices: any[], cells: number[][], edges: any[] }} topology
 * @param {number} edgeIndex
 * @param {number} offsetPx
 * @returns {number}
 */
export function seedCornerOnEdge(topology, edgeIndex, offsetPx = CORNER_BIRTH_OFFSET_PX) {
    const edge = topology.edges[edgeIndex];
    if (!edge || !isPrimalEdge(topology, edge)) return -1;

    const targets = computeBirthTargets(topology, edgeIndex, offsetPx);
    if (!targets) return -1;

    const { targetX, targetY } = targets;
    const newId = topology.vertices.length;
    topology.vertices.push({
        x: targetX,
        y: targetY,
        homeX: targetX,
        homeY: targetY,
        born: true,
        transition: null,
    });

    insertVertexOnEdgeRings(topology, edge, newId);
    rebuildEdges(topology);
    return newId;
}

/**
 * Seed up to `count` morph corners on distinct primal edges.
 * Leaves at least one free primal edge when possible so paired births can run.
 * @param {{ vertices: any[], cells: number[][], edges: any[] }} topology
 * @param {number} count
 * @param {number} [offsetPx]
 * @returns {number} number of corners seeded
 */
export function seedMorphCorners(topology, count, offsetPx = CORNER_BIRTH_OFFSET_PX) {
    if (count <= 0) return 0;

    const initialPrimal = listPrimalEdgeIndices(topology);
    const maxSeed = Math.max(0, Math.min(count, initialPrimal.length - 1));
    let seeded = 0;

    while (seeded < maxSeed) {
        const primal = listPrimalEdgeIndices(topology);
        // Keep at least one free primal edge for paired births
        if (primal.length <= 1) break;

        const edgeIndex = primal[Math.floor(Math.random() * primal.length)];
        const id = seedCornerOnEdge(topology, edgeIndex, offsetPx);
        if (id < 0) break;
        seeded++;
    }
    return seeded;
}

/**
 * Start collapsing a born corner out of the tiling.
 * @param {{ vertices: any[], cells: number[][] }} topology
 * @param {number} vertexId
 * @returns {boolean}
 */
export function beginCornerDeath(topology, vertexId) {
    const v = topology.vertices[vertexId];
    if (!v || !v.born || v.transition) return false;

    // Find neighbors on any cell ring containing this vertex
    let midX = v.homeX;
    let midY = v.homeY;
    let found = false;

    for (const ring of topology.cells) {
        const idx = ring.indexOf(vertexId);
        if (idx < 0) continue;
        const n = ring.length;
        const left = topology.vertices[ring[(idx - 1 + n) % n]];
        const right = topology.vertices[ring[(idx + 1) % n]];
        midX = (left.homeX + right.homeX) / 2;
        midY = (left.homeY + right.homeY) / 2;
        found = true;
        break;
    }

    if (!found) return false;

    v.transition = {
        kind: 'death',
        startX: v.x,
        startY: v.y,
        endX: midX,
        endY: midY,
        endHomeX: midX,
        endHomeY: midY,
        startTime: 0,
        duration: CORNER_MORPH_TRANSITION_MS,
        removeId: vertexId,
    };
    return true;
}

/**
 * Rebuild edge list from cell rings after topology edits.
 * @param {{ vertices: any[], cells: number[][], edges: any[] }} topology
 */
export function rebuildEdges(topology) {
    const edgeMap = new Map();
    function edgeKey(a, b) {
        return a < b ? `${a}:${b}` : `${b}:${a}`;
    }

    for (let cellIndex = 0; cellIndex < topology.cells.length; cellIndex++) {
        const ring = topology.cells[cellIndex];
        const n = ring.length;
        for (let i = 0; i < n; i++) {
            const a = ring[i];
            const b = ring[(i + 1) % n];
            if (a === b) continue;
            const key = edgeKey(a, b);
            let edge = edgeMap.get(key);
            if (!edge) {
                edge = { a: Math.min(a, b), b: Math.max(a, b), cells: [] };
                edgeMap.set(key, edge);
            }
            if (!edge.cells.includes(cellIndex)) {
                edge.cells.push(cellIndex);
            }
        }
    }

    topology.edges = Array.from(edgeMap.values());
}

/**
 * Remove a vertex from all rings and compact vertex ids.
 * @param {{ vertices: any[], cells: number[][], edges: any[] }} topology
 * @param {number} vertexId
 */
export function removeVertex(topology, vertexId) {
    for (const ring of topology.cells) {
        for (let i = ring.length - 1; i >= 0; i--) {
            if (ring[i] === vertexId) {
                ring.splice(i, 1);
            }
        }
    }

    topology.vertices.splice(vertexId, 1);

    for (const ring of topology.cells) {
        for (let i = 0; i < ring.length; i++) {
            if (ring[i] > vertexId) ring[i]--;
        }
    }

    rebuildEdges(topology);
}

/**
 * Advance birth/death transitions. Returns { topologyChanged }.
 * @param {{ vertices: any[], cells: number[][], edges: any[] }} topology
 * @param {number} time
 * @returns {{ topologyChanged: boolean }}
 */
export function advanceCornerTransitions(topology, time) {
    let topologyChanged = false;
    const toRemove = [];

    for (let i = 0; i < topology.vertices.length; i++) {
        const v = topology.vertices[i];
        const tr = v.transition;
        if (!tr) continue;

        if (tr.startTime === 0) {
            tr.startTime = time;
        }

        const t = Math.min(1, Math.max(0, (time - tr.startTime) / tr.duration));
        const ease = t * t * (3 - 2 * t);
        v.x = tr.startX + (tr.endX - tr.startX) * ease;
        v.y = tr.startY + (tr.endY - tr.startY) * ease;
        v.homeX = tr.startX + (tr.endHomeX - tr.startX) * ease;
        v.homeY = tr.startY + (tr.endHomeY - tr.startY) * ease;

        if (t >= 1) {
            v.homeX = tr.endHomeX;
            v.homeY = tr.endHomeY;
            v.x = tr.endX;
            v.y = tr.endY;
            v.transition = null;

            if (tr.kind === 'death') {
                toRemove.push(i);
            } else if (tr.kind === 'birth') {
                topologyChanged = true;
            }
        }
    }

    // Remove highest ids first
    toRemove.sort((a, b) => b - a);
    for (const id of toRemove) {
        removeVertex(topology, id);
        topologyChanged = true;
    }

    return { topologyChanged };
}

/**
 * Count born vertices (including those mid-transition).
 * @param {{ vertices: Array<{ born?: boolean }> }} topology
 * @returns {number}
 */
export function countBornVertices(topology) {
    let n = 0;
    for (const v of topology.vertices) {
        if (v.born) n++;
    }
    return n;
}

/**
 * Stateful morph controller for the whole puzzle.
 */
export class PuzzleTopologyMorph {
    /**
     * @param {Array<Array<[number, number]>>} polygons
     * @param {{
     *   intervalMs?: number,
     *   transitionMs?: number,
     *   birthOffsetPx?: number,
     *   morphCornerCount?: number
     * }} [options]
     */
    constructor(polygons, options = {}) {
        this.topology = buildSharedTopology(polygons);
        this.intervalMs = options.intervalMs ?? CORNER_MORPH_INTERVAL_MS;
        this.transitionMs = options.transitionMs ?? CORNER_MORPH_TRANSITION_MS;
        this.birthOffsetPx = options.birthOffsetPx ?? CORNER_BIRTH_OFFSET_PX;
        this.morphCornerCount = options.morphCornerCount ?? DEFAULT_MORPH_CORNER_COUNT;
        this.nextEventAt = 0;
        this.topologyVersion = 0;
        this.enabled = true;

        seedMorphCorners(this.topology, this.morphCornerCount, this.birthOffsetPx);
        this.morphCornerCount = countBornVertices(this.topology);
        if (this.morphCornerCount > 0) {
            this.topologyVersion++;
        }
    }

    /**
     * @param {number} time
     * @param {number} noiseAmplitude
     * @returns {{ polygons: Array<Array<[number, number]>>, topologyChanged: boolean, version: number }}
     */
    update(time, noiseAmplitude) {
        if (!this.enabled) {
            applySharedVertexNoise(this.topology.vertices, time, noiseAmplitude);
            return {
                polygons: extractCellPolygons(this.topology),
                topologyChanged: false,
                version: this.topologyVersion,
            };
        }

        if (this.nextEventAt === 0) {
            this.nextEventAt = time + this.intervalMs * (0.6 + Math.random() * 0.8);
        }

        let { topologyChanged } = advanceCornerTransitions(this.topology, time);

        const busy = this.topology.vertices.some((v) => v.transition);
        if (!busy && time >= this.nextEventAt) {
            const didEvent = this.triggerEvent(time);
            if (didEvent) {
                topologyChanged = true;
            }
            this.nextEventAt = time + this.intervalMs * (0.6 + Math.random() * 0.8);
        }

        applySharedVertexNoise(this.topology.vertices, time, noiseAmplitude);

        // Re-apply transition positions after noise (transitions own their positions)
        for (const v of this.topology.vertices) {
            if (!v.transition) continue;
            const tr = v.transition;
            if (!tr.startTime) {
                tr.startTime = time;
            }
            const t = Math.min(1, Math.max(0, (time - tr.startTime) / tr.duration));
            const ease = t * t * (3 - 2 * t);
            v.x = tr.startX + (tr.endX - tr.startX) * ease;
            v.y = tr.startY + (tr.endY - tr.startY) * ease;
        }

        if (topologyChanged) {
            this.topologyVersion++;
        }

        return {
            polygons: extractCellPolygons(this.topology),
            topologyChanged,
            version: this.topologyVersion,
        };
    }

    /**
     * Pair a death of one idle born corner with a birth on a free primal edge.
     * @param {number} [time]
     * @returns {boolean}
     */
    triggerEvent(time = 0) {
        const bornIds = [];
        for (let i = 0; i < this.topology.vertices.length; i++) {
            if (this.topology.vertices[i].born && !this.topology.vertices[i].transition) {
                bornIds.push(i);
            }
        }

        if (bornIds.length === 0) return false;

        const deathId = bornIds[Math.floor(Math.random() * bornIds.length)];
        const deathOk = beginCornerDeath(this.topology, deathId);
        if (!deathOk) return false;

        const deathTr = this.topology.vertices[deathId].transition;
        if (deathTr) {
            deathTr.duration = this.transitionMs;
            deathTr.startTime = time || 0;
        }

        const primal = listPrimalEdgeIndices(this.topology);
        if (primal.length === 0) {
            // Death alone still progresses; birth will refill on a later tick if possible
            return true;
        }

        const edgeIndex = primal[Math.floor(Math.random() * primal.length)];
        const newId = birthCornerOnEdge(this.topology, edgeIndex, this.birthOffsetPx);
        if (newId >= 0) {
            const birthTr = this.topology.vertices[newId].transition;
            if (birthTr) {
                birthTr.duration = this.transitionMs;
                birthTr.startTime = time || 0;
            }
        }

        return true;
    }

    getPolygons() {
        return extractCellPolygons(this.topology);
    }
}
