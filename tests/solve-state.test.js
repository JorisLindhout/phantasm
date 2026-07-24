import { describe, it, expect } from 'vitest';
import { areAllPiecesFullySnapped } from '../js/solve-state.js';

function piece(overrides = {}) {
    return {
        released: true,
        state: 'solved',
        isInSlot: true,
        offset: { x: 0, y: 0 },
        ...overrides,
    };
}

describe('areAllPiecesFullySnapped', () => {
    it('returns false for empty or missing pieces', () => {
        expect(areAllPiecesFullySnapped([])).toBe(false);
        expect(areAllPiecesFullySnapped(null)).toBe(false);
    });

    it('returns false while any piece is still unreleased', () => {
        expect(areAllPiecesFullySnapped([
            piece(),
            piece({ released: false, state: 'unsolved', isInSlot: false }),
        ])).toBe(false);
    });

    it('returns false when a piece is near the slot but not yet snapped', () => {
        // Near-zero offset used to trip solve before auto-snap reconnected the mesh
        expect(areAllPiecesFullySnapped([
            piece(),
            piece({
                state: 'unsolved',
                isInSlot: false,
                offset: { x: 0, y: 0 },
            }),
        ])).toBe(false);
    });

    it('returns true only when every piece is released, solved, and in its slot', () => {
        expect(areAllPiecesFullySnapped([
            piece(),
            piece(),
            piece(),
        ])).toBe(true);
    });
});
