import { describe, it, expect } from 'vitest';
import { computeAbsoluteAngles } from '../utils/drawAngle';
import type { AngleEntry } from '../types';

function makeEntry(overrides: Partial<AngleEntry> = {}): AngleEntry {
  return {
    id: 'test',
    label: '',
    value: 45,
    color: '#000',
    inputMode: 'relative',
    showAbsolute: false,
    ...overrides,
  };
}

describe('computeAbsoluteAngles', () => {
  it('accumulates relative angles', () => {
    const angles: AngleEntry[] = [
      makeEntry({ value: 45 }),
      makeEntry({ value: 45 }),
      makeEntry({ value: 30 }),
    ];
    const result = computeAbsoluteAngles(angles, 'degrees');
    expect(result).toEqual([45, 90, 120]);
  });

  it('handles absolute mode', () => {
    const angles: AngleEntry[] = [
      makeEntry({ value: 45, inputMode: 'relative' }),
      makeEntry({ value: 90, inputMode: 'absolute' }),
      makeEntry({ value: 30, inputMode: 'relative' }),
    ];
    const result = computeAbsoluteAngles(angles, 'degrees');
    expect(result).toEqual([45, 90, 120]);
  });

  it('handles mixed modes', () => {
    const angles: AngleEntry[] = [
      makeEntry({ value: 30, inputMode: 'relative' }),
      makeEntry({ value: 180, inputMode: 'absolute' }),
      makeEntry({ value: 45, inputMode: 'relative' }),
    ];
    const result = computeAbsoluteAngles(angles, 'degrees');
    expect(result).toEqual([30, 180, 225]);
  });

  it('handles percentage unit', () => {
    const angles: AngleEntry[] = [
      makeEntry({ value: 25 }), // 25% = 90°
      makeEntry({ value: 25 }), // 25% = 90°
    ];
    const result = computeAbsoluteAngles(angles, 'percentage');
    expect(result[0]).toBeCloseTo(90);
    expect(result[1]).toBeCloseTo(180);
  });

  it('handles radians unit', () => {
    const angles: AngleEntry[] = [
      makeEntry({ value: Math.PI / 2 }), // 90°
    ];
    const result = computeAbsoluteAngles(angles, 'radians');
    expect(result[0]).toBeCloseTo(90);
  });

  it('handles empty array', () => {
    expect(computeAbsoluteAngles([], 'degrees')).toEqual([]);
  });
});
