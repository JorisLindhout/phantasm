import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    calculateReleaseBatchSize,
    computeScatterBounds,
    hasPlacementCollision,
    isCenterWithinBounds,
    isPolygonWithinStage,
    scatterPiece,
    SCATTER_MIN_DISTANCE,
    shuffleIndices,
} from '../js/unsolved-layout.js';
import { WEBGL_SNAP_THRESHOLD } from '../js/constants.js';
import { offsetDistance } from '../js/drag-offset.js';
import { PieceReleaseManager } from '../js/piece-release-manager.js';

describe('calculateReleaseBatchSize', () => {
    it('returns smaller batches on narrow stages', () => {
        expect(calculateReleaseBatchSize(320)).toBe(3);
        expect(calculateReleaseBatchSize(500)).toBe(5);
        expect(calculateReleaseBatchSize(900)).toBe(8);
        expect(calculateReleaseBatchSize(1400)).toBe(12);
    });

    it('uses level release config when provided', () => {
        const release = { phone: 2, tablet: 4, desktop: 6, large: 10 };
        expect(calculateReleaseBatchSize(320, release)).toBe(2);
        expect(calculateReleaseBatchSize(1400, release)).toBe(10);
    });
});

describe('computeScatterBounds', () => {
    it('insets stage edges by glow padding', () => {
        const bounds = computeScatterBounds({ width: 450, height: 450 });

        expect(bounds.minX).toBeGreaterThan(0);
        expect(bounds.maxX).toBeLessThan(450);
        expect(bounds.minY).toBeGreaterThan(0);
        expect(bounds.maxY).toBeLessThan(450);
    });
});

describe('scatterPiece', () => {
    const square = [
        [200, 200],
        [250, 200],
        [250, 250],
        [200, 250],
    ];

    it('places offsets outside the WebGL snap threshold', () => {
        const offset = scatterPiece({
            polygon: square,
            stageSize: { width: 450, height: 450 },
        });

        expect(offsetDistance(offset)).toBeGreaterThan(WEBGL_SNAP_THRESHOLD);
    });

    it('avoids overlapping existing placements when possible', () => {
        const stageSize = { width: 450, height: 450 };
        const existingPlacements = [
            { x: 225, y: 225, radius: 40 },
        ];

        const offset = scatterPiece({
            polygon: square,
            stageSize,
            existingPlacements,
        });

        const centerX = 225 + offset.x;
        const centerY = 225 + offset.y;

        expect(hasPlacementCollision(centerX, centerY, 35, existingPlacements)).toBe(false);
    });

    it('keeps scattered polygons fully inside the stage', () => {
        const stageSize = { width: 280, height: 280 };

        for (let i = 0; i < 100; i++) {
            const cx = Math.random() * stageSize.width;
            const cy = Math.random() * stageSize.height;
            const polygon = [
                [cx - 20, cy - 15],
                [cx + 20, cy - 15],
                [cx + 20, cy + 15],
                [cx - 20, cy + 15],
            ];
            const offset = scatterPiece({ polygon, stageSize });

            expect(isPolygonWithinStage(polygon, offset, stageSize)).toBe(true);
            expect(offsetDistance(offset)).toBeGreaterThanOrEqual(SCATTER_MIN_DISTANCE);
        }
    });
});

describe('isCenterWithinBounds', () => {
    it('rejects centers that would clip outside the stage', () => {
        const bounds = computeScatterBounds({ width: 450, height: 450 });

        expect(isCenterWithinBounds(10, 10, 30, bounds)).toBe(false);
        expect(isCenterWithinBounds(225, 225, 30, bounds)).toBe(true);
    });
});

describe('shuffleIndices', () => {
    it('returns a permutation of the input indices', () => {
        const shuffled = shuffleIndices([0, 1, 2, 3, 4]);

        expect(shuffled).toHaveLength(5);
        expect([...shuffled].sort()).toEqual([0, 1, 2, 3, 4]);
    });
});

describe('PieceReleaseManager', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <button id="releasePiecesBtn" type="button">+</button>
            <div class="stage"><canvas width="450" height="450"></canvas></div>
        `;
    });

    it('hides the release button when the pool is empty', () => {
        const manager = new PieceReleaseManager();
        const button = document.getElementById('releasePiecesBtn');
        manager.bindButton(button);

        manager.reset(4);
        expect(button.hidden).toBe(false);

        manager.pool = [];
        manager.updateButtonVisibility();
        expect(button.hidden).toBe(true);
    });

    it('releases up to the batch size from the pool', () => {
        const manager = new PieceReleaseManager();
        const stage = document.querySelector('.stage');
        stage.getBoundingClientRect = () => ({
            width: 900,
            height: 450,
            top: 0,
            left: 0,
            right: 900,
            bottom: 450,
        });

        const canvas = document.querySelector('canvas');
        const releasePiece = vi.fn();

        const webglRenderer = {
            canvas,
            voronoiPolygons: Array.from({ length: 10 }, () => [
                [200, 200],
                [250, 200],
                [250, 250],
                [200, 250],
            ]),
            releasePiece,
            recoverOffscreenLoosePieces: vi.fn(),
        };

        manager.reset(10);
        const released = manager.releaseNextBatch(webglRenderer);

        expect(released).toBe(8);
        expect(releasePiece).toHaveBeenCalledTimes(8);
        expect(manager.getRemainingCount()).toBe(2);
    });

    it('calls bringPieceToFront on the active renderer, not the disposed outer puzzle', () => {
        const manager = new PieceReleaseManager();
        const stage = document.querySelector('.stage');
        stage.getBoundingClientRect = () => ({
            width: 900,
            height: 900,
            top: 0,
            left: 0,
            right: 900,
            bottom: 900,
        });

        const bringPieceToFront = vi.fn();
        window.voronoiPuzzle = {
            pieceZIndex: null,
            bringPieceToFront: vi.fn(),
            currentRenderer: { bringPieceToFront },
        };

        const webglRenderer = {
            canvas: document.querySelector('canvas'),
            voronoiPolygons: [
                [
                    [200, 200],
                    [250, 200],
                    [250, 250],
                    [200, 250],
                ],
            ],
            releasePiece: vi.fn(),
            recoverOffscreenLoosePieces: vi.fn(),
        };

        manager.reset(1);
        manager.releaseNextBatch(webglRenderer);

        expect(bringPieceToFront).toHaveBeenCalledWith(0);
        expect(window.voronoiPuzzle.bringPieceToFront).not.toHaveBeenCalled();

        delete window.voronoiPuzzle;
    });
});
