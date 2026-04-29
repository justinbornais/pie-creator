// ── Shared Types ──

export type ShapeType = 'circle' | 'rounded-square' | 'square';
export type AngleUnit = 'percentage' | 'degrees' | 'radians' | 'gradians';
export type DisplayMode = '2d' | '3d';
export type ExportFormat = 'png' | 'jpeg' | 'pdf';
export type LegendPosition = 'left' | 'right' | 'top' | 'bottom';

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
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  thicknessPercent: number;
  showLabels: boolean;
  showLegend: boolean;
  legendPosition: LegendPosition;
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
