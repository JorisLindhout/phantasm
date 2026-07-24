import { describe, it, expect } from 'vitest';
import {
    buildSharedTopology,
    extractCellPolygons,
    birthCornerOnEdge,
    beginCornerDeath,
    advanceCornerTransitions,
    removeVertex,
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

describe('PuzzleTopologyMorph', () => {
    it('keeps adjacent cells flush after shared noise', () => {
        const morph = new PuzzleTopologyMorph([squareA, squareB], { intervalMs: 999999 });
        morph.nextEventAt = Number.POSITIVE_INFINITY;
        const { polygons } = morph.update(5000, 20);

        // Find vertices that belong to the shared edge by vertex id, not home x
        const topology = morph.topology;
        const sharedEdge = topology.edges.find((e) => e.cells.length === 2);
        expect(sharedEdge).toBeTruthy();

        const a = topology.vertices[sharedEdge.a];
        const b = topology.vertices[sharedEdge.b];
        // Both cells reference the same vertex objects → identical coordinates
        expect(polygons[0].some(([x, y]) => x === a.x && y === a.y)).toBe(true);
        expect(polygons[1].some(([x, y]) => x === a.x && y === a.y)).toBe(true);
        expect(polygons[0].some(([x, y]) => x === b.x && y === b.y)).toBe(true);
        expect(polygons[1].some(([x, y]) => x === b.x && y === b.y)).toBe(true);
    });

    it('increases a cell corner count when a birth is triggered', () => {
        const morph = new PuzzleTopologyMorph([squareA, squareB], {
            intervalMs: 999999,
            birthOffsetPx: 15,
        });
        const before = extractCellPolygons(morph.topology)[0].length;
        const ok = morph.triggerEvent(1000);
        expect(ok).toBe(true);
        const after = extractCellPolygons(morph.topology)[0].length;
        // At least one of the two cells gained a corner (shared edge birth hits both)
        const counts = extractCellPolygons(morph.topology).map((p) => p.length);
        expect(Math.max(...counts)).toBeGreaterThan(before);
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
