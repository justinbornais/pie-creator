import { describe, expect, it } from 'vitest';
import { getShapeBoundaryPoint } from '../utils/drawPie3d';

describe('getShapeBoundaryPoint', () => {
  it('reaches the square corner at 45 degrees', () => {
    const point = getShapeBoundaryPoint(100, 45, 'square');

    expect(point.x).toBeCloseTo(100, 6);
    expect(point.y).toBeCloseTo(100, 6);
  });

  it('keeps rounded-square cardinal points flush with the outer edge', () => {
    const point = getShapeBoundaryPoint(100, 0, 'rounded-square');

    expect(point.x).toBeCloseTo(100, 6);
    expect(point.y).toBeCloseTo(0, 6);
  });

  it('uses the straight side of the rounded square before the corner arc', () => {
    const point = getShapeBoundaryPoint(100, 30, 'rounded-square');

    expect(point.x).toBeCloseTo(100, 6);
    expect(point.y).toBeCloseTo(Math.tan(Math.PI / 6) * 100, 6);
  });

  it('uses the rounded corner arc near the diagonal', () => {
    const point = getShapeBoundaryPoint(100, 45, 'rounded-square');
    const expected = 85 + 15 / Math.SQRT2;

    expect(point.x).toBeCloseTo(expected, 6);
    expect(point.y).toBeCloseTo(expected, 6);
    expect(point.x).toBeLessThan(100);
  });
});