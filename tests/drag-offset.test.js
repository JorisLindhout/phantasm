import { describe, it, expect } from 'vitest';
import {
    computePieceOffsetFromDragDelta,
    getSeparatePieceMeshPosition,
    offsetDistance,
    looksLikeDoubleAppliedSeedPosition,
} from '../js/drag-offset.js';

describe('drag offset calculations', () => {
    it('uses displacement only for separate-piece mesh position', () => {
        expect(getSeparatePieceMeshPosition({ x: 20, y: 15 })).toEqual({ x: 20, y: 15 });
    });

    it('tracks drag as pointer delta from drag start', () => {
        const dragStartPointer = { x: 100, y: 80 };
        const dragStartOffset = { x: 0, y: 0 };

        expect(
            computePieceOffsetFromDragDelta({ x: 100, y: 80 }, dragStartPointer, dragStartOffset)
        ).toEqual({ x: 0, y: 0 });

        expect(
            computePieceOffsetFromDragDelta({ x: 130, y: 110 }, dragStartPointer, dragStartOffset)
        ).toEqual({ x: 30, y: 30 });
    });

    it('preserves existing offset when continuing a drag', () => {
        const dragStartPointer = { x: 200, y: 150 };
        const dragStartOffset = { x: 10, y: -5 };

        expect(
            computePieceOffsetFromDragDelta({ x: 220, y: 140 }, dragStartPointer, dragStartOffset)
        ).toEqual({ x: 30, y: -15 });
    });

    it('reports small displacement near the origin of movement', () => {
        const offset = computePieceOffsetFromDragDelta(
            { x: 105, y: 82 },
            { x: 100, y: 80 },
            { x: 0, y: 0 }
        );

        expect(offsetDistance(offset)).toBeLessThan(10);
    });

    it('detects double-applied seed coordinates on mesh position', () => {
        const originalPoint = [400, 300];
        const offset = { x: 20, y: 15 };

        expect(
            looksLikeDoubleAppliedSeedPosition(
                { x: originalPoint[0] + offset.x, y: originalPoint[1] + offset.y },
                offset,
                originalPoint
            )
        ).toBe(true);

        expect(
            looksLikeDoubleAppliedSeedPosition(getSeparatePieceMeshPosition(offset), offset, originalPoint)
        ).toBe(false);
    });
});
