import { describe, expect, it } from 'vitest';
import {
    ActivePointerTracker,
    ActiveTouchTracker,
    getTouchEndPoint,
    getTouchMovePoint,
    isPrimaryMouseButton,
    supportsPointerEvents,
} from '../js/pointer-input.js';

describe('pointer-input', () => {
    it('detects pointer event support in jsdom', () => {
        expect(typeof supportsPointerEvents()).toBe('boolean');
    });

    it('tracks a single active pointer id', () => {
        const tracker = new ActivePointerTracker();

        expect(tracker.shouldHandle({ pointerId: 1 })).toBe(true);

        tracker.claim(2);
        expect(tracker.shouldHandle({ pointerId: 2 })).toBe(true);
        expect(tracker.shouldHandle({ pointerId: 3 })).toBe(false);
        expect(tracker.isOwner({ pointerId: 2 })).toBe(true);

        tracker.release();
        expect(tracker.shouldHandle({ pointerId: 3 })).toBe(true);
    });

    it('accepts only the primary mouse button', () => {
        expect(isPrimaryMouseButton({ pointerType: 'touch', button: 0 })).toBe(true);
        expect(isPrimaryMouseButton({ pointerType: 'mouse', button: 0 })).toBe(true);
        expect(isPrimaryMouseButton({ pointerType: 'mouse', button: 2 })).toBe(false);
    });

    it('resolves move and end touches by identifier', () => {
        const tracker = new ActiveTouchTracker();
        tracker.claim(7);

        const touches = [
            { identifier: 3, clientX: 1, clientY: 2 },
            { identifier: 7, clientX: 10, clientY: 20 },
        ];
        const changedTouches = [
            { identifier: 7, clientX: 15, clientY: 25 },
        ];

        expect(getTouchMovePoint({ touches }, tracker)?.clientX).toBe(10);
        expect(getTouchEndPoint({ changedTouches }, tracker)?.clientY).toBe(25);
    });
});
