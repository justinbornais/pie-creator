import { describe, expect, it } from 'vitest';
import { getShapeBoundaryPoint, measureProjectedFaceHorizontalSpan } from '../utils/drawPie3d';

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

describe('measureProjectedFaceHorizontalSpan', () => {
  it('captures horizontal room across a tilted projected face', () => {
    const face = [
      { sx: 0, sy: -18 },
      { sx: 96, sy: -22 },
      { sx: 142, sy: 18 },
      { sx: 0, sy: 18 },
    ];

    const span = measureProjectedFaceHorizontalSpan(face, 0, 14);
    const tiltedChord = Math.hypot(face[2].sx - face[1].sx, face[2].sy - face[1].sy);

    expect(span).toBeGreaterThan(110);
    expect(span).toBeGreaterThan(tiltedChord * 1.75);
  });

  it('returns zero when a sample line misses the face entirely', () => {
    const face = [
      { sx: 10, sy: 10 },
      { sx: 40, sy: 10 },
      { sx: 40, sy: 40 },
      { sx: 10, sy: 40 },
    ];

    expect(measureProjectedFaceHorizontalSpan(face, 80, 12)).toBe(0);
  });
});