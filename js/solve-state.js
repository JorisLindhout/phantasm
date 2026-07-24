/**
 * Puzzle solve detection — pieces must be fully snapped, not merely near their slots.
 */

/**
 * True when every released piece is in its connected/solved state.
 * Near-zero offsets alone are not enough: auto-snap may still be pending.
 * @param {Array<{ released?: boolean, state?: string, isInSlot?: boolean }>} pieces
 * @returns {boolean}
 */
export function areAllPiecesFullySnapped(pieces) {
    if (!pieces?.length) {
        return false;
    }

    if (pieces.some((piece) => !piece.released)) {
        return false;
    }

    return pieces.every((piece) => piece.state === 'solved' && piece.isInSlot);
}
