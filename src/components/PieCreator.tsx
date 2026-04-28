import { useState, useRef, useEffect, useCallback } from 'react';
import type { PieSegment, PieSettings, AngleUnit, ShapeType, DisplayMode, ExportFormat } from '../types';
import { paletteColor } from '../utils/colors';
import { drawPie } from '../utils/drawPie';
import { exportCanvas } from '../utils/export';
import { uid } from '../utils/uid';
import { unitLabel, fullRotation } from '../utils/math';

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
  displayMode: 'color',
  showLabels: true,
  showLegend: true,
  canvasSize: 500,
};

export default function PieCreator() {
  const [segments, setSegments] = useState<PieSegment[]>(DEFAULT_SEGMENTS);
  const [settings, setSettings] = useState<PieSettings>(DEFAULT_SETTINGS);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const redraw = useCallback(() => {
    if (canvasRef.current) {
      drawPie(canvasRef.current, segments, settings);
    }
  }, [segments, settings]);

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

  const handleExport = (format: ExportFormat) => {
    if (canvasRef.current) {
      exportCanvas(canvasRef.current, format, 'pie-chart');
    }
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
              ['color', 'Color'],
              ['3d', '3D Shadow'],
              ['bw', 'B&W'],
            ] as [DisplayMode, string][]).map(([mode, lbl]) => (
              <button
                key={mode}
                className={settings.displayMode === mode ? 'active' : ''}
                onClick={() => setSettings((p) => ({ ...p, displayMode: mode }))}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

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
                      disabled={settings.displayMode === 'bw'}
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
        <canvas ref={canvasRef} className="preview-canvas" />
      </div>
    </div>
  );
}
