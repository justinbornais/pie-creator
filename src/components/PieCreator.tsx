import { useState, useRef, useEffect, useCallback } from 'react';
import type { PieSegment, PieSettings, AngleUnit, ShapeType, DisplayMode, ExportFormat, LegendPosition } from '../types';
import { bwShade, paletteColor } from '../utils/colors';
import { drawPie } from '../utils/drawPie';
import { exportCanvas } from '../utils/export';
import { uid } from '../utils/uid';
import { unitLabel, fullRotation } from '../utils/math';

const DEFAULT_PIE_ORIENTATION = {
  rotationX: 30,
  rotationY: 0,
  rotationZ: 0,
} as const;

const DEFAULT_THICKNESS_PERCENT = 12;
const DEFAULT_ZOOM_PERCENT = 120;

const DRAG_ROTATION_SENSITIVITY = 0.5;
const WHEEL_ZOOM_SENSITIVITY = 0.05;

const DEFAULT_SEGMENTS: PieSegment[] = [
  { id: uid(), label: 'Category A', value: 30, color: paletteColor(0) },
  { id: uid(), label: 'Category B', value: 25, color: paletteColor(1) },
  { id: uid(), label: 'Category C', value: 20, color: paletteColor(2) },
  { id: uid(), label: 'Category D', value: 15, color: paletteColor(3) },
  { id: uid(), label: 'Category E', value: 10, color: paletteColor(4) },
];

const DEFAULT_SETTINGS: PieSettings = {
  shape: 'circle',
  angleUnit: 'percentage',
  displayMode: '2d',
  ...DEFAULT_PIE_ORIENTATION,
  thicknessPercent: DEFAULT_THICKNESS_PERCENT,
  zoomPercent: DEFAULT_ZOOM_PERCENT,
  showLabels: true,
  showLegend: true,
  legendPosition: 'left',
  canvasSize: 500,
};

interface PieCreatorProps {
  greyscale?: boolean;
}

export default function PieCreator({ greyscale = false }: PieCreatorProps) {
  const [segments, setSegments] = useState<PieSegment[]>(DEFAULT_SEGMENTS);
  const [settings, setSettings] = useState<PieSettings>(DEFAULT_SETTINGS);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStateRef = useRef<{
    pointerId: number | 'mouse';
    startX: number;
    startY: number;
    rotationX: number;
    rotationY: number;
  } | null>(null);

  const renderSegments = segments.map((segment, index) => ({
    ...segment,
    color: greyscale ? bwShade(index, segments.length) : segment.color,
  }));

  const redraw = useCallback(() => {
    if (canvasRef.current) {
      drawPie(canvasRef.current, renderSegments, settings, undefined, true);
    }
  }, [renderSegments, settings]);

  const legendColors = renderSegments.map((s) => s.color);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const updateSegment = (id: string, field: keyof PieSegment, value: string | number) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const addSegment = () => {
    const idx = segments.length;
    setSegments((prev) => [
      ...prev,
      { id: uid(), label: `Segment ${idx + 1}`, value: 10, color: paletteColor(idx) },
    ]);
  };

  const removeSegment = (id: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  const setDisplayMode = (mode: DisplayMode) => {
    setSettings((prev) => ({ ...prev, displayMode: mode }));
  };

  const updateRotation = (axis: 'rotationX' | 'rotationY' | 'rotationZ', value: number) => {
    setSettings((prev) => ({ ...prev, [axis]: value }));
  };

  const updateThickness = (value: number) => {
    setSettings((prev) => ({
      ...prev,
      thicknessPercent: Math.min(100, Math.max(0.1, value)),
    }));
  };

  const updateZoom = (value: number) => {
    setSettings((prev) => ({
      ...prev,
      zoomPercent: clampZoomPercent(value),
    }));
  };

  const resetOrientation = () => {
    setSettings((prev) => ({ ...prev, ...DEFAULT_PIE_ORIENTATION }));
  };

  const startDrag = (pointerId: number | 'mouse', clientX: number, clientY: number) => {
    if (settings.displayMode !== '3d' || !Number.isFinite(clientX) || !Number.isFinite(clientY)) {
      return;
    }

    dragStateRef.current = {
      pointerId,
      startX: clientX,
      startY: clientY,
      rotationX: settings.rotationX,
      rotationY: settings.rotationY,
    };
  };

  const updateDrag = (pointerId: number | 'mouse', clientX: number, clientY: number) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== pointerId || !Number.isFinite(clientX) || !Number.isFinite(clientY)) {
      return;
    }

    const deltaX = clientX - dragState.startX;
    const deltaY = clientY - dragState.startY;

    setSettings((prev) => ({
      ...prev,
      rotationX: clampRotation(dragState.rotationX + deltaY * DRAG_ROTATION_SENSITIVITY),
      rotationY: normalizeRotation(dragState.rotationY + deltaX * DRAG_ROTATION_SENSITIVITY),
    }));
  };

  const endDrag = (pointerId: number | 'mouse') => {
    if (dragStateRef.current?.pointerId !== pointerId) {
      return;
    }

    dragStateRef.current = null;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    startDrag(event.pointerId, event.clientX, event.clientY);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    updateDrag(event.pointerId, event.clientX, event.clientY);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    startDrag('mouse', event.clientX, event.clientY);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    updateDrag('mouse', event.clientX, event.clientY);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    endDrag(event.pointerId);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleMouseEnd = () => {
    endDrag('mouse');
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    if (settings.displayMode !== '3d') {
      return;
    }

    event.preventDefault();
    updateZoom(settings.zoomPercent - event.deltaY * WHEEL_ZOOM_SENSITIVITY);
  };

  const EXPORT_DPR = 3;
  const handleExport = (format: ExportFormat) => {
    const offscreen = document.createElement('canvas');
    drawPie(offscreen, renderSegments, settings, EXPORT_DPR);
    exportCanvas(offscreen, format, 'pie-chart');
  };

  const unit = unitLabel(settings.angleUnit);
  const max = fullRotation(settings.angleUnit);

  return (
    <div className="creator-layout">
      {/* Controls Panel */}
      <div className="panel controls-panel">
        <h2>Pie Chart Settings</h2>

        <div className="control-group">
          <label>Shape</label>
          <div className="btn-group">
            {(['circle', 'rounded-square', 'square'] as ShapeType[]).map((s) => (
              <button
                key={s}
                className={settings.shape === s ? 'active' : ''}
                onClick={() => setSettings((p) => ({ ...p, shape: s }))}
              >
                {s === 'rounded-square' ? 'Rounded' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label>Angle Unit</label>
          <select
            value={settings.angleUnit}
            onChange={(e) =>
              setSettings((p) => ({ ...p, angleUnit: e.target.value as AngleUnit }))
            }
          >
            <option value="percentage">Percentage (%)</option>
            <option value="degrees">Degrees (°)</option>
            <option value="radians">Radians (rad)</option>
            <option value="gradians">Gradians (gon)</option>
          </select>
        </div>

        <div className="control-group">
          <label>Display Mode</label>
          <div className="btn-group">
            {([
              ['2d', '2D'],
              ['3d', '3D'],
            ] as [DisplayMode, string][]).map(([mode, lbl]) => (
              <button
                key={mode}
                className={settings.displayMode === mode ? 'active' : ''}
                onClick={() => setDisplayMode(mode)}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {settings.displayMode === '3d' && (
          <>
            <h3>Orientation</h3>
            {([
              ['rotationX', 'X Rotation'],
              ['rotationY', 'Y Rotation'],
              ['rotationZ', 'Z Rotation'],
            ] as const).map(([axis, label]) => (
              <div key={axis} className="control-group">
                <label>{label}: {Math.round(settings[axis])}deg</label>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={settings[axis]}
                  onChange={(e) => updateRotation(axis, Number(e.target.value))}
                  aria-label={label}
                />
              </div>
            ))}
            <div className="control-group">
              <label>Zoom: {Math.round(settings.zoomPercent)}%</label>
              <input
                type="range"
                min={60}
                max={200}
                step={1}
                value={settings.zoomPercent}
                onChange={(e) => updateZoom(Number(e.target.value))}
                aria-label="Zoom"
              />
            </div>
            <div className="control-group">
              <label>Thickness: {Math.round(settings.thicknessPercent)}% of diameter</label>
              <input
                type="range"
                min={0.1}
                max={100}
                step={0.1}
                value={settings.thicknessPercent}
                onChange={(e) => updateThickness(Number(e.target.value))}
                aria-label="Thickness"
              />
            </div>
            <button className="btn-secondary" onClick={resetOrientation}>
              Reset Orientation
            </button>
          </>
        )}

        <div className="control-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={settings.showLabels}
              onChange={(e) =>
                setSettings((p) => ({ ...p, showLabels: e.target.checked }))
              }
            />
            Show Labels
          </label>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={settings.showLegend}
              onChange={(e) =>
                setSettings((p) => ({ ...p, showLegend: e.target.checked }))
              }
            />
            Show Legend
          </label>
        </div>

        {settings.showLegend && (
          <div className="control-group">
            <label>Legend Position</label>
            <div className="btn-group">
              {(['left', 'right', 'top', 'bottom'] as LegendPosition[]).map((pos) => (
                <button
                  key={pos}
                  className={settings.legendPosition === pos ? 'active' : ''}
                  onClick={() => setSettings((p) => ({ ...p, legendPosition: pos }))}
                >
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="control-group">
          <label>Canvas Size: {settings.canvasSize}px</label>
          <input
            type="range"
            min={200}
            max={800}
            step={50}
            value={settings.canvasSize}
            onChange={(e) =>
              setSettings((p) => ({ ...p, canvasSize: Number(e.target.value) }))
            }
          />
        </div>

        {/* Data Table */}
        <h3>Segments</h3>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Color</th>
                <th>Label</th>
                <th>Value ({unit})</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg) => (
                <tr key={seg.id}>
                  <td>
                    <input
                      type="color"
                      value={seg.color}
                      onChange={(e) => updateSegment(seg.id, 'color', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={seg.label}
                      onChange={(e) => updateSegment(seg.id, 'label', e.target.value)}
                      placeholder="Label"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={seg.value}
                      min={0}
                      max={max}
                      step={settings.angleUnit === 'radians' ? 0.01 : 1}
                      onChange={(e) =>
                        updateSegment(seg.id, 'value', Math.max(0, Number(e.target.value)))
                      }
                    />
                  </td>
                  <td>
                    <button className="btn-icon danger" onClick={() => removeSegment(seg.id)} title="Remove">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn-add" onClick={addSegment}>
          + Add Segment
        </button>

        {/* Export */}
        <h3>Export</h3>
        <div className="btn-group export-group">
          <button onClick={() => handleExport('png')}>PNG</button>
          <button onClick={() => handleExport('jpeg')}>JPEG</button>
          <button onClick={() => handleExport('pdf')}>PDF</button>
        </div>
      </div>

      {/* Canvas Preview */}
      <div className="panel preview-panel">
        <div className={`pie-with-legend legend-${settings.showLegend ? settings.legendPosition : 'none'}`}>
          <canvas
            ref={canvasRef}
            className={`preview-canvas ${settings.displayMode === '3d' ? 'is-draggable' : ''}`}
            data-testid="pie-preview-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseEnd}
            onMouseLeave={handleMouseEnd}
            onWheel={handleWheel}
            onLostPointerCapture={() => {
              dragStateRef.current = null;
            }}
          />
          {settings.showLegend && (
            <div className="pie-legend">
              {segments.map((seg, i) => (
                <div key={seg.id} className="pie-legend-item">
                  <span className="pie-legend-swatch" style={{ background: legendColors[i] }} />
                  <span className="pie-legend-label">{seg.label || `Segment ${i + 1}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function clampRotation(value: number): number {
  return Math.max(-89, Math.min(89, value));
}

function normalizeRotation(value: number): number {
  const normalized = ((value + 180) % 360 + 360) % 360 - 180;
  return normalized === -180 ? 180 : normalized;
}

function clampZoomPercent(value: number): number {
  return Math.min(200, Math.max(60, value));
}
