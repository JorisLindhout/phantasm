import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { WebGLVoronoiRenderer } from '../js/webgl-renderer.js';
import { isPolygonWithinStage } from '../js/unsolved-layout.js';

const { repairSeparatePiece, recoverOffscreenLoosePieces, findPieceAtPosition } =
    WebGLVoronoiRenderer.prototype;

function createSceneMock() {
    const children = [];
    return {
        children,
        add(obj) {
            if (!children.includes(obj)) {
                children.push(obj);
            }
        },
        remove() {},
    };
}

function createReleasedPiece(overrides = {}) {
    return {
        released: true,
        state: 'unsolved',
        offset: { x: 100, y: 50 },
        mesh: null,
        outline: null,
        glowOutline: null,
        zIndex: 1,
        ...overrides,
    };
}

function createRendererStub(overrides = {}) {
    const scene = createSceneMock();
    const polygon = [
        [200, 200],
        [250, 200],
        [250, 250],
        [200, 250],
    ];

    const stub = {
        canvas: { width: 450, height: 450 },
        scene,
        camera: new THREE.OrthographicCamera(0, 450, 0, 450, -1000, 1000),
        pieces: [createReleasedPiece()],
        slots: [{ state: 'empty', isCorrect: false }],
        voronoiPolygons: [polygon],
        pieceZIndices: [1],
        draggedPieceIndex: -1,
        connectedMesh: null,
        createSeparatePiece: vi.fn(function (index, offset) {
            const mesh = {
                visible: true,
                position: { x: offset.x, y: offset.y, z: 5, set(x, y, z) { this.x = x; this.y = y; this.z = z; }, copy() {} },
                geometry: new THREE.BufferGeometry(),
            };
            this.pieces[index].mesh = mesh;
            scene.add(mesh);
        }),
        recreatePieceGeometry: vi.fn(() => true),
        updatePiecePosition: vi.fn(),
        render: vi.fn(),
        raiseLoosePieceLayer: vi.fn(),
        ...overrides,
    };

    return Object.setPrototypeOf(stub, WebGLVoronoiRenderer.prototype);
}

describe('repairSeparatePiece', () => {
    it('returns false for unreleased pieces', () => {
        const renderer = createRendererStub();
        renderer.pieces[0].released = false;

        expect(repairSeparatePiece.call(renderer, 0)).toBe(false);
        expect(renderer.createSeparatePiece).not.toHaveBeenCalled();
    });

    it('recreates missing mesh without changing solved state', () => {
        const renderer = createRendererStub();

        expect(repairSeparatePiece.call(renderer, 0)).toBe(true);
        expect(renderer.createSeparatePiece).toHaveBeenCalledWith(0, { x: 100, y: 50 });
        expect(renderer.pieces[0].state).toBe('unsolved');
        expect(renderer.slots[0].isCorrect).toBe(false);
    });

    it('fixes invisible mesh and syncs position without marking solved', () => {
        const mesh = {
            visible: false,
            position: { x: 0, y: 0, z: 5, set(x, y, z) { this.x = x; this.y = y; this.z = z; } },
            geometry: { attributes: { position: {} } },
        };
        const renderer = createRendererStub();
        renderer.pieces[0].mesh = mesh;

        expect(repairSeparatePiece.call(renderer, 0)).toBe(true);
        expect(mesh.visible).toBe(true);
        expect(mesh.position.x).toBe(100);
        expect(mesh.position.y).toBe(50);
        expect(renderer.slots[0].isCorrect).toBe(false);
    });

    it('re-adds mesh missing from scene', () => {
        const mesh = {
            visible: true,
            position: { x: 100, y: 50, z: 5, set() {} },
            geometry: { attributes: { position: {} } },
        };
        const renderer = createRendererStub();
        renderer.pieces[0].mesh = mesh;

        expect(renderer.scene.children).not.toContain(mesh);
        expect(repairSeparatePiece.call(renderer, 0)).toBe(true);
        expect(renderer.scene.children).toContain(mesh);
    });
});

describe('recoverOffscreenLoosePieces', () => {
    it('skips unreleased pieces', () => {
        const renderer = createRendererStub();
        renderer.pieces[0].released = false;

        expect(recoverOffscreenLoosePieces.call(renderer)).toBe(0);
        expect(renderer.updatePiecePosition).not.toHaveBeenCalled();
    });

    it('rescatters off-screen released pieces', () => {
        const renderer = createRendererStub({
            updatePiecePosition: vi.fn(function (index, offset) {
                this.pieces[index].offset = offset;
            }),
        });
        renderer.pieces[0].offset = { x: -500, y: -500 };

        const recovered = recoverOffscreenLoosePieces.call(renderer);

        expect(recovered).toBe(1);
        expect(renderer.updatePiecePosition).toHaveBeenCalled();
        expect(renderer.pieces[0].state).toBe('unsolved');
        expect(renderer.pieces[0].released).toBe(true);
    });

    it('skips on-stage released pieces with valid mesh', () => {
        const offset = { x: 10, y: 10 };
        const polygon = rendererPolygon();
        const renderer = createRendererStub({
            pieces: [createReleasedPiece({ offset, mesh: { position: { x: 10, y: 10 } } })],
            voronoiPolygons: [polygon],
        });

        expect(isPolygonWithinStage(polygon, offset, { width: 450, height: 450 })).toBe(true);
        expect(recoverOffscreenLoosePieces.call(renderer)).toBe(0);
        expect(renderer.updatePiecePosition).not.toHaveBeenCalled();
    });
});

function rendererPolygon() {
    return [
        [200, 200],
        [250, 200],
        [250, 250],
        [200, 250],
    ];
}

describe('findPieceAtPosition allowRepair', () => {
    it('does not repair on hover (allowRepair false)', () => {
        const repairSpy = vi.spyOn(WebGLVoronoiRenderer.prototype, 'repairSeparatePiece');
        const renderer = createRendererStub();
        renderer.pieces[0].mesh = new THREE.Mesh(new THREE.BufferGeometry());
        renderer.pieces[0].mesh.position.set(100, 50, 5);
        renderer.scene.children.push(renderer.pieces[0].mesh);

        findPieceAtPosition.call(renderer, 220, 220, { allowRepair: false });

        expect(repairSpy).not.toHaveBeenCalled();
        repairSpy.mockRestore();
    });

    it('repairs when allowRepair is true', () => {
        const repairSpy = vi.spyOn(WebGLVoronoiRenderer.prototype, 'repairSeparatePiece');
        const renderer = createRendererStub();
        renderer.pieces[0].mesh = new THREE.Mesh(new THREE.BufferGeometry());
        renderer.pieces[0].mesh.position.set(100, 50, 5);
        renderer.scene.children.push(renderer.pieces[0].mesh);

        findPieceAtPosition.call(renderer, 220, 220, { allowRepair: true });

        expect(repairSpy).toHaveBeenCalled();
        repairSpy.mockRestore();
    });

    it('accepts legacy boolean skipDraggedPiece argument', () => {
        const repairSpy = vi.spyOn(WebGLVoronoiRenderer.prototype, 'repairSeparatePiece');
        const renderer = createRendererStub();
        renderer.pieces[0].mesh = new THREE.Mesh(new THREE.BufferGeometry());
        renderer.pieces[0].mesh.position.set(100, 50, 5);
        renderer.scene.children.push(renderer.pieces[0].mesh);

        findPieceAtPosition.call(renderer, 220, 220, true);

        expect(repairSpy).not.toHaveBeenCalled();
        repairSpy.mockRestore();
    });
});

describe('repairAllReleasedPieces', () => {
    it('runs layout and interaction recovery', () => {
        const renderer = createRendererStub();
        renderer.recoverOffscreenLoosePieces = vi.fn(() => 1);
        renderer.repairSeparatePiece = vi.fn(() => 1);

        const count = renderer.repairAllReleasedPieces();

        expect(renderer.recoverOffscreenLoosePieces).toHaveBeenCalled();
        expect(renderer.repairSeparatePiece).toHaveBeenCalledWith(0);
        expect(count).toBe(2);
    });
});
