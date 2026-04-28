// ── Shared Types ──

export type ShapeType = 'circle' | 'rounded-square' | 'square';
export type AngleUnit = 'percentage' | 'degrees' | 'radians' | 'gradians';
export type DisplayMode = 'color' | '3d' | 'bw';
export type ExportFormat = 'png' | 'jpeg' | 'pdf';

// ── Pie Chart Types ──

export interface PieSegment {
  id: string;
  label: string;
  value: number;
  color: string;
}

export interface PieSettings {
  shape: ShapeType;
  angleUnit: AngleUnit;
  displayMode: DisplayMode;
  showLabels: boolean;
  showLegend: boolean;
  canvasSize: number;
}

// ── Angle Guide Types ──

export type AngleInputMode = 'relative' | 'absolute';

export interface AngleEntry {
  id: string;
  label: string;
  value: number;
  color: string;
  inputMode: AngleInputMode;
  showAbsolute: boolean;
}

export interface AngleSettings {
  shape: ShapeType;
  angleUnit: AngleUnit;
  canvasSize: number;
  showBaseLabel: boolean;
  backgroundColor: 'white' | 'transparent';
  lineColor: string;
}
