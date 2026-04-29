import { describe, expect, it } from 'vitest';
import { resolveExternalLabelLayout } from '../utils/pieLabelLayout';

describe('resolveExternalLabelLayout', () => {
  it('separates labels on the same side by the requested gap', () => {
    const resolved = resolveExternalLabelLayout(
      [
        { side: 'left' as const, desiredY: 40, payload: 'a' },
        { side: 'left' as const, desiredY: 44, payload: 'b' },
        { side: 'left' as const, desiredY: 48, payload: 'c' },
      ],
      20,
      100,
      12
    );

    const left = resolved
      .filter((entry) => entry.side === 'left')
      .sort((a, b) => a.labelY - b.labelY);

    expect(left[1].labelY - left[0].labelY).toBeGreaterThanOrEqual(12);
    expect(left[2].labelY - left[1].labelY).toBeGreaterThanOrEqual(12);
  });

  it('keeps the left and right sides independent', () => {
    const resolved = resolveExternalLabelLayout(
      [
        { side: 'left' as const, desiredY: 40, payload: 'left' },
        { side: 'right' as const, desiredY: 40, payload: 'right' },
      ],
      20,
      100,
      12
    );

    const left = resolved.find((entry) => entry.payload === 'left');
    const right = resolved.find((entry) => entry.payload === 'right');

    expect(left?.labelY).toBe(40);
    expect(right?.labelY).toBe(40);
  });
});