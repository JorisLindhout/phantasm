import { describe, it, expect } from 'vitest';
import {
    buildSharedTopology,
    extractCellPolygons,
    birthCornerOnEdge,
    seedCornerOnEdge,
    seedMorphCorners,
    beginCornerDeath,
    advanceCornerTransitions,
    removeVertex,
    isPrimalEdge,
    listPrimalEdgeIndices,
    countBornVertices,
    PuzzleTopologyMorph,
} from '../js/voronoi-topology-morph.js';

const squareA = [
    [0, 0],
    [50, 0],
    [50, 50],
    [0, 50],
];
const squareB = [
    [50, 0],
    [100, 0],
    [100, 50],
    [50, 50],
];

describe('buildSharedTopology', () => {
    it('merges shared corners between adjacent cells', () => {
        const topology = buildSharedTopology([squareA, squareB]);
        // Two squares sharing an edge → 6 unique corners, not 8
        expect(topology.vertices.length).toBe(6);
        expect(topology.cells[0]).toHaveLength(4);
        expect(topology.cells[1]).toHaveLength(4);

        const sharedEdge = topology.edges.find((e) => e.cells.length === 2);
        expect(sharedEdge).toBeTruthy();
    });
});

describe('corner birth and death', () => {
    it('adds a corner to every cell on a shared edge', () => {
        const topology = buildSharedTopology([squareA, squareB]);
        const sharedIndex = topology.edges.findIndex((e) => e.cells.length === 2);
        expect(sharedIndex).toBeGreaterThanOrEqual(0);

        const beforeA = topology.cells[0].length;
        const beforeB = topology.cells[1].length;
        const newId = birthCornerOnEdge(topology, sharedIndex, 10);

        expect(newId).toBeGreaterThanOrEqual(0);
        expect(topology.cells[0]).toHaveLength(beforeA + 1);
        expect(topology.cells[1]).toHaveLength(beforeB + 1);
        expect(topology.cells[0]).toContain(newId);
        expect(topology.cells[1]).toContain(newId);
    });

    it('refuses birth on a non-primal edge', () => {
        const topology = buildSharedTopology([squareA, squareB]);
        const sharedIndex = topology.edges.findIndex((e) => e.cells.length === 2);
        const bornId = birthCornerOnEdge(topology, sharedIndex, 10);
        topology.vertices[bornId].transition = null;

        const childEdgeIndex = topology.edges.findIndex(
            (e) => e.a === bornId || e.b === bornId
        );
        expect(childEdgeIndex).toBeGreaterThanOrEqual(0);
        expect(isPrimalEdge(topology, topology.edges[childEdgeIndex])).toBe(false);
        expect(birthCornerOnEdge(topology, childEdgeIndex, 10)).toBe(-1);
    });

    it('removes a born corner after death completes', () => {
        const topology = buildSharedTopology([squareA, squareB]);
        const sharedIndex = topology.edges.findIndex((e) => e.cells.length === 2);
        const newId = birthCornerOnEdge(topology, sharedIndex, 10);
        topology.vertices[newId].transition = null;
        topology.vertices[newId].born = true;

        expect(beginCornerDeath(topology, newId)).toBe(true);
        const tr = topology.vertices[newId].transition;
        tr.startTime = 1000;
        tr.duration = 100;

        const mid = advanceCornerTransitions(topology, 1050);
        expect(mid.topologyChanged).toBe(false);
        expect(topology.vertices[newId]).toBeTruthy();

        const done = advanceCornerTransitions(topology, 1200);
        expect(done.topologyChanged).toBe(true);
        expect(topology.vertices.some((v) => v.born && v.transition?.kind === 'death')).toBe(false);
    });
});

describe('seedMorphCorners', () => {
    it('places corners at rest without transitions', () => {
        const topology = buildSharedTopology([squareA, squareB]);
        const seeded = seedMorphCorners(topology, 2, 10);
        expect(seeded).toBeGreaterThan(0);
        expect(countBornVertices(topology)).toBe(seeded);
        expect(topology.vertices.filter((v) => v.born).every((v) => !v.transition)).toBe(true);
    });

    it('leaves at least one free primal edge when possible', () => {
        const topology = buildSharedTopology([squareA, squareB]);
        const before = listPrimalEdgeIndices(topology).length;
        seedMorphCorners(topology, 99, 10);
        expect(listPrimalEdgeIndices(topology).length).toBeGreaterThanOrEqual(1);
        expect(countBornVertices(topology)).toBeLessThan(before);
    });
});

describe('PuzzleTopologyMorph', () => {
    it('seeds morphCornerCount born corners at construct', () => {
        const morph = new PuzzleTopologyMorph([squareA, squareB], {
            morphCornerCount: 2,
            birthOffsetPx: 10,
            intervalMs: 999999,
        });
        expect(countBornVertices(morph.topology)).toBe(2);
        expect(morph.topology.vertices.filter((v) => v.born).every((v) => !v.transition)).toBe(true);
    });

    it('keeps adjacent cells flush after shared noise', () => {
        const morph = new PuzzleTopologyMorph([squareA, squareB], {
            intervalMs: 999999,
            morphCornerCount: 0,
        });
        morph.nextEventAt = Number.POSITIVE_INFINITY;
        const { polygons } = morph.update(5000, 20);

        const topology = morph.topology;
        const sharedEdge = topology.edges.find((e) => e.cells.length === 2 && isPrimalEdge(topology, e));
        expect(sharedEdge).toBeTruthy();

        const a = topology.vertices[sharedEdge.a];
        const b = topology.vertices[sharedEdge.b];
        expect(polygons[0].some(([x, y]) => x === a.x && y === a.y)).toBe(true);
        expect(polygons[1].some(([x, y]) => x === a.x && y === a.y)).toBe(true);
        expect(polygons[0].some(([x, y]) => x === b.x && y === b.y)).toBe(true);
        expect(polygons[1].some(([x, y]) => x === b.x && y === b.y)).toBe(true);
    });

    it('pairs birth and death so born count returns to N', () => {
        const morph = new PuzzleTopologyMorph([squareA, squareB], {
            morphCornerCount: 2,
            birthOffsetPx: 10,
            transitionMs: 100,
            intervalMs: 999999,
        });
        const n = countBornVertices(morph.topology);
        expect(n).toBe(2);

        const ok = morph.triggerEvent(1000);
        expect(ok).toBe(true);
        // Overlap: dying corner still present + new birth
        expect(countBornVertices(morph.topology)).toBe(n + 1);

        advanceCornerTransitions(morph.topology, 1000);
        advanceCornerTransitions(morph.topology, 1200);
        expect(countBornVertices(morph.topology)).toBe(n);
    });

    it('does not accumulate born corners across many paired events', () => {
        const morph = new PuzzleTopologyMorph([squareA, squareB], {
            morphCornerCount: 2,
            birthOffsetPx: 8,
            transitionMs: 50,
            intervalMs: 999999,
        });
        const n = countBornVertices(morph.topology);

        for (let i = 0; i < 20; i++) {
            const t0 = 1000 + i * 200;
            morph.triggerEvent(t0);
            advanceCornerTransitions(morph.topology, t0);
            advanceCornerTransitions(morph.topology, t0 + 100);
            expect(countBornVertices(morph.topology)).toBeLessThanOrEqual(n + 1);
        }
        expect(countBornVertices(morph.topology)).toBe(n);
    });
});

describe('removeVertex', () => {
    it('compacts vertex ids in cell rings', () => {
        const topology = buildSharedTopology([squareA, squareB]);
        const sharedIndex = topology.edges.findIndex((e) => e.cells.length === 2);
        const newId = birthCornerOnEdge(topology, sharedIndex, 10);
        topology.vertices[newId].transition = null;
        removeVertex(topology, newId);
        for (const ring of topology.cells) {
            for (const id of ring) {
                expect(id).toBeGreaterThanOrEqual(0);
                expect(id).toBeLessThan(topology.vertices.length);
            }
        }
    });
});

describe('seedCornerOnEdge', () => {
    it('inserts at the bulge target without a transition', () => {
        const topology = buildSharedTopology([squareA, squareB]);
        const sharedIndex = topology.edges.findIndex((e) => e.cells.length === 2);
        const id = seedCornerOnEdge(topology, sharedIndex, 12);
        expect(id).toBeGreaterThanOrEqual(0);
        const v = topology.vertices[id];
        expect(v.born).toBe(true);
        expect(v.transition).toBeNull();
        expect(v.x).toBe(v.homeX);
        expect(v.y).toBe(v.homeY);
        // Not at edge midpoint — offset along the normal
        const midX = 50;
        const midY = 25;
        expect(Math.hypot(v.x - midX, v.y - midY)).toBeGreaterThan(5);
    });
});
