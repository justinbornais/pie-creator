import { useState, useRef, useEffect, useCallback } from 'react';
import type { AngleEntry, AngleSettings, AngleUnit, ShapeType, AngleInputMode, ExportFormat } from '../types';
import { drawAngleGuide } from '../utils/drawAngle';
import { exportCanvas } from '../utils/export';
import { uid } from '../utils/uid';
import { unitLabel, fullRotation } from '../utils/math';

const DEFAULT_ANGLES: AngleEntry[] = [
  { id: uid(), label: '', value: 45, color: '#333333', inputMode: 'relative', showAbsolute: false },
  { id: uid(), label: '', value: 45, color: '#333333', inputMode: 'relative', showAbsolute: true },
  { id: uid(), label: '', value: 30, color: '#333333', inputMode: 'relative', showAbsolute: true },
];

const DEFAULT_SETTINGS: AngleSettings = {
  shape: 'circle',
  angleUnit: 'degrees',
  canvasSize: 500,
  showBaseLabel: true,
  backgroundColor: 'white',
  lineColor: '#1a1a1a',
};

export default function AngleGuide() {
  const [angles, setAngles] = useState<AngleEntry[]>(DEFAULT_ANGLES);
  const [settings, setSettings] = useState<AngleSettings>(DEFAULT_SETTINGS);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const redraw = useCallback(() => {
    if (canvasRef.current) {
      drawAngleGuide(canvasRef.current, angles, settings);
    }
  }, [angles, settings]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const updateAngle = (id: string, field: keyof AngleEntry, value: string | number | boolean) => {
    setAngles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const addAngle = () => {
    setAngles((prev) => [
      ...prev,
      {
        id: uid(),
        label: '',
        value: 30,
        color: settings.lineColor,
        inputMode: 'relative',
        showAbsolute: false,
      },
    ]);
  };

  const removeAngle = (id: string) => {
    setAngles((prev) => prev.filter((a) => a.id !== id));
  };

  const handleExport = (format: ExportFormat) => {
    if (canvasRef.current) {
      exportCanvas(canvasRef.current, format, 'angle-guide');
    }
  };

  const unit = unitLabel(settings.angleUnit);
  const max = fullRotation(settings.angleUnit);

  return (
    <div className="creator-layout">
      {/* Controls Panel */}
      <div className="panel controls-panel">
        <h2>Angle Guide Settings</h2>

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
            <option value="degrees">Degrees (°)</option>
            <option value="radians">Radians (rad)</option>
            <option value="gradians">Gradians (gon)</option>
            <option value="percentage">Percentage (%)</option>
          </select>
        </div>

        <div className="control-group">
          <label>Background</label>
          <div className="btn-group">
            <button
              className={settings.backgroundColor === 'white' ? 'active' : ''}
              onClick={() => setSettings((p) => ({ ...p, backgroundColor: 'white' }))}
            >
              White
            </button>
            <button
              className={settings.backgroundColor === 'transparent' ? 'active' : ''}
              onClick={() => setSettings((p) => ({ ...p, backgroundColor: 'transparent' }))}
            >
              Transparent
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Line Color</label>
          <input
            type="color"
            value={settings.lineColor}
            onChange={(e) => setSettings((p) => ({ ...p, lineColor: e.target.value }))}
          />
        </div>

        <div className="control-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={settings.showBaseLabel}
              onChange={(e) =>
                setSettings((p) => ({ ...p, showBaseLabel: e.target.checked }))
              }
            />
            Show Base Label (0°)
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

        {/* Angle Table */}
        <h3>Angles</h3>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Color</th>
                <th>Label</th>
                <th>Value ({unit})</th>
                <th>Mode</th>
                <th>Abs?</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {angles.map((ang) => (
                <tr key={ang.id}>
                  <td>
                    <input
                      type="color"
                      value={ang.color}
                      onChange={(e) => updateAngle(ang.id, 'color', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={ang.label}
                      onChange={(e) => updateAngle(ang.id, 'label', e.target.value)}
                      placeholder="Auto"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={ang.value}
                      min={0}
                      max={max}
                      step={settings.angleUnit === 'radians' ? 0.01 : 1}
                      onChange={(e) =>
                        updateAngle(ang.id, 'value', Math.max(0, Number(e.target.value)))
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={ang.inputMode}
                      onChange={(e) =>
                        updateAngle(ang.id, 'inputMode', e.target.value as AngleInputMode)
                      }
                    >
                      <option value="relative">Rel</option>
                      <option value="absolute">Abs</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={ang.showAbsolute}
                      onChange={(e) => updateAngle(ang.id, 'showAbsolute', e.target.checked)}
                      title="Show absolute angle"
                    />
                  </td>
                  <td>
                    <button className="btn-icon danger" onClick={() => removeAngle(ang.id)} title="Remove">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn-add" onClick={addAngle}>
          + Add Angle
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
        <canvas
          ref={canvasRef}
          className="preview-canvas"
          style={{
            background: settings.backgroundColor === 'transparent'
              ? 'repeating-conic-gradient(#d1d5db 0% 25%, #f3f4f6 0% 50%) 0 0 / 16px 16px'
              : undefined,
          }}
        />
      </div>
    </div>
  );
}
