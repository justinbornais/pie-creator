import type {
  AngleEntry,
  AngleSettings,
  AngleUnit,
  DisplayMode,
  ExportFormat,
  LegendPosition,
  PieSegment,
  PieSettings,
  ShapeType,
} from '../types';
import { paletteColor } from '../utils/colors';
import { uid } from '../utils/uid';

export const APP_DEFAULTS = {
  activeTab: 'pie' as const,
  greyscale: false,
};

export const SHAPE_OPTIONS: Array<{ value: ShapeType; label: string }> = [
  { value: 'circle', label: 'Circle' },
  { value: 'rounded-square', label: 'Rounded' },
  { value: 'square', label: 'Square' },
];

export const PIE_DISPLAY_MODE_OPTIONS: Array<{ value: DisplayMode; label: string }> = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' },
];

export const PIE_ANGLE_UNIT_OPTIONS: Array<{ value: AngleUnit; label: string }> = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'degrees', label: 'Degrees (°)' },
  { value: 'radians', label: 'Radians (rad)' },
  { value: 'gradians', label: 'Gradians (gon)' },
];

export const ANGLE_GUIDE_UNIT_OPTIONS: Array<{ value: AngleUnit; label: string }> = [
  { value: 'degrees', label: 'Degrees (°)' },
  { value: 'radians', label: 'Radians (rad)' },
  { value: 'gradians', label: 'Gradians (gon)' },
  { value: 'percentage', label: 'Percentage (%)' },
];

export const LEGEND_POSITION_OPTIONS: LegendPosition[] = ['left', 'right', 'top', 'bottom'];

export const ANGLE_BACKGROUND_OPTIONS = [
  { value: 'white' as const, label: 'White' },
  { value: 'transparent' as const, label: 'Transparent' },
];

export const CANVAS_SIZE_RANGE = {
  min: 200,
  max: 800,
  step: 50,
};

export const PIE_3D_ROTATION_RANGE = {
  min: -180,
  max: 180,
  step: 1,
};

export const PIE_3D_ZOOM_RANGE = {
  min: 10,
  max: 200,
  step: 1,
};

export const PIE_3D_THICKNESS_RANGE = {
  min: 0.1,
  max: 100,
  step: 0.1,
};

export const PIE_3D_INTERACTION = {
  dragRotationSensitivity: 0.5,
  wheelZoomSensitivity: 0.05,
};

export const EXPORT_SETTINGS: { dpr: number; formats: ExportFormat[] } = {
  dpr: 3,
  formats: ['png', 'jpeg', 'pdf'],
};

export const PIE_DEFAULTS = {
  shape: 'circle' as ShapeType,
  angleUnit: 'percentage' as AngleUnit,
  displayMode: '2d' as DisplayMode,
  rotationX: 30,
  rotationY: 0,
  rotationZ: 0,
  thicknessPercent: 12,
  zoomPercent: 120,
  showLabels: true,
  showLegend: true,
  legendPosition: 'left' as LegendPosition,
  canvasSize: 500,
  newSegmentValue: 10,
};

export const ANGLE_GUIDE_DEFAULTS = {
  shape: 'circle' as ShapeType,
  angleUnit: 'degrees' as AngleUnit,
  canvasSize: 500,
  showBaseLabel: true,
  backgroundColor: 'white' as const,
  lineColor: '#1a1a1a',
  entryColor: '#333333',
  newAngleValue: 30,
};

export const PIE_DEFAULT_ORIENTATION = {
  rotationX: PIE_DEFAULTS.rotationX,
  rotationY: PIE_DEFAULTS.rotationY,
  rotationZ: PIE_DEFAULTS.rotationZ,
} as const;

export function createDefaultPieSegments(): PieSegment[] {
  return [
    { id: uid(), label: 'Category A', value: 30, color: paletteColor(0) },
    { id: uid(), label: 'Category B', value: 25, color: paletteColor(1) },
    { id: uid(), label: 'Category C', value: 20, color: paletteColor(2) },
    { id: uid(), label: 'Category D', value: 15, color: paletteColor(3) },
    { id: uid(), label: 'Category E', value: 10, color: paletteColor(4) },
  ];
}

export function createDefaultPieSettings(): PieSettings {
  return {
    shape: PIE_DEFAULTS.shape,
    angleUnit: PIE_DEFAULTS.angleUnit,
    displayMode: PIE_DEFAULTS.displayMode,
    rotationX: PIE_DEFAULTS.rotationX,
    rotationY: PIE_DEFAULTS.rotationY,
    rotationZ: PIE_DEFAULTS.rotationZ,
    thicknessPercent: PIE_DEFAULTS.thicknessPercent,
    zoomPercent: PIE_DEFAULTS.zoomPercent,
    showLabels: PIE_DEFAULTS.showLabels,
    showLegend: PIE_DEFAULTS.showLegend,
    legendPosition: PIE_DEFAULTS.legendPosition,
    canvasSize: PIE_DEFAULTS.canvasSize,
  };
}

export function createDefaultAngles(): AngleEntry[] {
  return [
    { id: uid(), label: '', value: 45, color: ANGLE_GUIDE_DEFAULTS.entryColor, inputMode: 'relative', showAbsolute: false },
    { id: uid(), label: '', value: 45, color: ANGLE_GUIDE_DEFAULTS.entryColor, inputMode: 'relative', showAbsolute: true },
    { id: uid(), label: '', value: 30, color: ANGLE_GUIDE_DEFAULTS.entryColor, inputMode: 'relative', showAbsolute: true },
  ];
}

export function createDefaultAngleSettings(): AngleSettings {
  return {
    shape: ANGLE_GUIDE_DEFAULTS.shape,
    angleUnit: ANGLE_GUIDE_DEFAULTS.angleUnit,
    canvasSize: ANGLE_GUIDE_DEFAULTS.canvasSize,
    showBaseLabel: ANGLE_GUIDE_DEFAULTS.showBaseLabel,
    backgroundColor: ANGLE_GUIDE_DEFAULTS.backgroundColor,
    lineColor: ANGLE_GUIDE_DEFAULTS.lineColor,
  };
}