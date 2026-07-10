import { describe, expect, it } from 'vitest';
import {
    alignCanvasDimensions,
    countPointsOutsideCanvas,
} from '../js/voronoi-coordinates.js';

describe('voronoi-coordinates', () => {
    it('aligns source canvas dimensions to the WebGL canvas', () => {
        const source = { width: 800, height: 450 };
        const target = { width: 626, height: 400 };

        const aligned = alignCanvasDimensions(source, target);

        expect(aligned).toEqual({ width: 626, height: 400 });
        expect(source.width).toBe(626);
        expect(source.height).toBe(400);
    });

    it('counts seed points outside the render canvas', () => {
        const points = [
            [100, 100],
            [783, 289],
            [620, 390],
            [-5, 50],
        ];

        expect(countPointsOutsideCanvas(points, 626, 400)).toBe(2);
        expect(countPointsOutsideCanvas(points, 800, 450)).toBe(1);
    });
});
