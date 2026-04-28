import { describe, it, expect } from 'vitest';
import { toDegrees, fromDegrees, degToRad, normalizeAngle, formatAngle, fullRotation } from '../utils/math';

describe('toDegrees', () => {
  it('converts degrees to degrees', () => {
    expect(toDegrees(90, 'degrees')).toBe(90);
  });

  it('converts radians to degrees', () => {
    expect(toDegrees(Math.PI, 'radians')).toBeCloseTo(180);
    expect(toDegrees(Math.PI / 2, 'radians')).toBeCloseTo(90);
  });

  it('converts gradians to degrees', () => {
    expect(toDegrees(100, 'gradians')).toBe(90);
    expect(toDegrees(400, 'gradians')).toBe(360);
  });

  it('converts percentage to degrees', () => {
    expect(toDegrees(50, 'percentage')).toBe(180);
    expect(toDegrees(100, 'percentage')).toBe(360);
    expect(toDegrees(25, 'percentage')).toBe(90);
  });
});

describe('fromDegrees', () => {
  it('converts degrees to radians', () => {
    expect(fromDegrees(180, 'radians')).toBeCloseTo(Math.PI);
    expect(fromDegrees(90, 'radians')).toBeCloseTo(Math.PI / 2);
  });

  it('converts degrees to gradians', () => {
    expect(fromDegrees(90, 'gradians')).toBeCloseTo(100);
    expect(fromDegrees(360, 'gradians')).toBeCloseTo(400);
  });

  it('converts degrees to percentage', () => {
    expect(fromDegrees(180, 'percentage')).toBe(50);
    expect(fromDegrees(360, 'percentage')).toBe(100);
  });

  it('is inverse of toDegrees', () => {
    const units = ['degrees', 'radians', 'gradians', 'percentage'] as const;
    for (const unit of units) {
      expect(fromDegrees(toDegrees(42, unit), unit)).toBeCloseTo(42);
    }
  });
});

describe('degToRad', () => {
  it('converts common angles correctly', () => {
    expect(degToRad(0)).toBe(0);
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
    expect(degToRad(180)).toBeCloseTo(Math.PI);
    expect(degToRad(360)).toBeCloseTo(2 * Math.PI);
  });
});

describe('normalizeAngle', () => {
  it('keeps angles 0-360 unchanged', () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(90)).toBe(90);
    expect(normalizeAngle(359)).toBe(359);
  });

  it('wraps angles above 360', () => {
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(450)).toBe(90);
    expect(normalizeAngle(720)).toBe(0);
  });

  it('handles negative angles', () => {
    expect(normalizeAngle(-90)).toBe(270);
    expect(normalizeAngle(-360)).toBe(0);
    expect(normalizeAngle(-10)).toBe(350);
  });
});

describe('formatAngle', () => {
  it('formats degrees with ° suffix', () => {
    expect(formatAngle(90, 'degrees')).toBe('90°');
  });

  it('formats radians with rad suffix', () => {
    expect(formatAngle(3.14, 'radians')).toBe('3.14 rad');
  });

  it('formats gradians with gon suffix', () => {
    expect(formatAngle(100, 'gradians')).toBe('100 gon');
  });

  it('formats percentage with % suffix', () => {
    expect(formatAngle(25, 'percentage')).toBe('25%');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatAngle(33.333, 'degrees')).toBe('33.33°');
    expect(formatAngle(1.125, 'radians')).toBe('1.13 rad');
  });
});

describe('fullRotation', () => {
  it('returns correct full rotation value for each unit', () => {
    expect(fullRotation('degrees')).toBe(360);
    expect(fullRotation('radians')).toBeCloseTo(2 * Math.PI);
    expect(fullRotation('gradians')).toBe(400);
    expect(fullRotation('percentage')).toBe(100);
  });
});
