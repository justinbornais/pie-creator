const PALETTE = [
  '#6366f1', // indigo
  '#f43f5e', // rose
  '#22d3ee', // cyan
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ef4444', // red
  '#14b8a6', // teal
  '#f97316', // orange
  '#3b82f6', // blue
  '#ec4899', // pink
  '#84cc16', // lime
  '#a855f7', // purple
  '#06b6d4', // sky
  '#eab308', // yellow
  '#64748b', // slate
];

/** Get a color from the default palette by index */
export function paletteColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

/** Darken a hex color by a factor (0-1) */
export function darkenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - factor;
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`;
}

/** Convert hex to rgba */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Generate a grayscale shade for B&W mode */
export function bwShade(index: number, total: number): string {
  if (total <= 1) return '#888888';
  const lightness = 30 + (index / (total - 1)) * 55; // 30%-85%
  return `hsl(0, 0%, ${lightness}%)`;
}
