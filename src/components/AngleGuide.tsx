import { useState, useRef, useEffect, useCallback } from 'react';
import type { AngleEntry, AngleSettings, AngleUnit, AngleInputMode, ExportFormat } from '../types';
import {
  ANGLE_BACKGROUND_OPTIONS,
  ANGLE_GUIDE_DEFAULTS,
  ANGLE_GUIDE_UNIT_OPTIONS,
  CANVAS_SIZE_RANGE,
  EXPORT_SETTINGS,
  SHAPE_OPTIONS,
  createDefaultAngleSettings,
  createDefaultAngles,
} from '../config/defaults';
import { toGreyscale } from '../utils/colors';
import { drawAngleGuide } from '../utils/drawAngle';
import { exportCanvas } from '../utils/export';
import { uid } from '../utils/uid';
import { unitLabel, fullRotation } from '../utils/math';

interface AngleGuideProps {
  greyscale?: boolean;
}

export default function AngleGuide({ greyscale = false }: AngleGuideProps) {
  const [angles, setAngles] = useState<AngleEntry[]>(() => createDefaultAngles());
  const [settings, setSettings] = useState<AngleSettings>(() => createDefaultAngleSettings());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderAngles = angles.map((angle) => ({
    ...angle,
    color: greyscale ? toGreyscale(angle.color) : angle.color,
  }));

  const renderSettings = {
    ...settings,
    lineColor: greyscale ? toGreyscale(settings.lineColor) : settings.lineColor,
  };

  const redraw = useCallback(() => {
    if (canvasRef.current) {
      drawAngleGuide(canvasRef.current, renderAngles, renderSettings);
    }
  }, [renderAngles, renderSettings]);

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
        value: ANGLE_GUIDE_DEFAULTS.newAngleValue,
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
    const offscreen = document.createElement('canvas');
    drawAngleGuide(offscreen, renderAngles, renderSettings, EXPORT_SETTINGS.dpr);
    exportCanvas(offscreen, format, 'angle-guide');
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
            {SHAPE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                className={settings.shape === value ? 'active' : ''}
                onClick={() => setSettings((p) => ({ ...p, shape: value }))}
              >
                {label}
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
            {ANGLE_GUIDE_UNIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Background</label>
          <div className="btn-group">
            {ANGLE_BACKGROUND_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={settings.backgroundColor === option.value ? 'active' : ''}
                onClick={() => setSettings((p) => ({ ...p, backgroundColor: option.value }))}
              >
                {option.label}
              </button>
            ))}
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
            min={CANVAS_SIZE_RANGE.min}
            max={CANVAS_SIZE_RANGE.max}
            step={CANVAS_SIZE_RANGE.step}
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
          {EXPORT_SETTINGS.formats.map((format) => (
            <button key={format} onClick={() => handleExport(format)}>{format.toUpperCase()}</button>
          ))}
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
