import { describe, it, expect } from 'vitest';
import { paletteColor, darkenColor, bwShade, hexToRgba } from '../utils/colors';

describe('paletteColor', () => {
  it('returns consistent colors for same index', () => {
    expect(paletteColor(0)).toBe(paletteColor(0));
    expect(paletteColor(5)).toBe(paletteColor(5));
  });

  it('wraps around the palette', () => {
    expect(paletteColor(0)).toBe(paletteColor(16));
    expect(paletteColor(1)).toBe(paletteColor(17));
  });

  it('returns valid hex colors', () => {
    for (let i = 0; i < 20; i++) {
      expect(paletteColor(i)).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe('darkenColor', () => {
  it('returns darker color for positive factor', () => {
    const original = '#ffffff';
    const darkened = darkenColor(original, 0.5);
    // Should be around rgb(128, 128, 128)
    expect(darkened).toContain('rgb(');
  });

  it('returns black for factor 1', () => {
    const result = darkenColor('#ff0000', 1);
    expect(result).toBe('rgb(0, 0, 0)');
  });

  it('returns original color for factor 0', () => {
    const result = darkenColor('#ff8040', 0);
    expect(result).toBe('rgb(255, 128, 64)');
  });
});

describe('hexToRgba', () => {
  it('converts hex to rgba with given alpha', () => {
    expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    expect(hexToRgba('#00ff00', 1)).toBe('rgba(0, 255, 0, 1)');
  });
});

describe('bwShade', () => {
  it('returns a valid hsl string', () => {
    const shade = bwShade(0, 5);
    expect(shade).toMatch(/^hsl\(0, 0%, \d+(\.\d+)?%\)$/);
  });

  it('returns single shade for total 1', () => {
    expect(bwShade(0, 1)).toBe('#888888');
  });

  it('produces different shades for different indices', () => {
    const shade0 = bwShade(0, 3);
    const shade1 = bwShade(1, 3);
    const shade2 = bwShade(2, 3);
    expect(shade0).not.toBe(shade1);
    expect(shade1).not.toBe(shade2);
  });
});
