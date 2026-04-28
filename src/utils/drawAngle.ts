import type { AngleEntry, AngleSettings } from '../types';
import { degToRad, toDegrees, formatAngle, fromDegrees } from './math';
import { applyShapeClip, drawShapeOutline } from './shapes';

export function drawAngleGuide(
  canvas: HTMLCanvasElement,
  angles: AngleEntry[],
  settings: AngleSettings
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = settings.canvasSize;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  ctx.scale(dpr, dpr);

  // Background
  if (settings.backgroundColor === 'transparent') {
    ctx.clearRect(0, 0, size, size);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
  }

  const cx = size / 2;
  const cy = size / 2;
  const margin = size * 0.1;
  const radius = size / 2 - margin;

  // Clip to shape
  ctx.save();
  applyShapeClip(ctx, cx, cy, radius + margin * 0.5, settings.shape);
  if (settings.backgroundColor === 'white') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
  }
  ctx.restore();

  // Draw circle outline
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = settings.lineColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Draw base line (center to right, 0°)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + radius, cy);
  ctx.strokeStyle = settings.lineColor;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = settings.lineColor;
  ctx.fill();

  // Draw 0° label
  if (settings.showBaseLabel) {
    ctx.save();
    ctx.font = `bold 12px Inter, system-ui, sans-serif`;
    ctx.fillStyle = settings.lineColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('0°', cx + radius + 6, cy);
    ctx.restore();
  }

  if (angles.length === 0) {
    ctx.save();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add angles to create a guide', cx, cy + radius + margin * 0.3);
    ctx.restore();
    return;
  }

  // Compute absolute angles in degrees
  const absoluteAngles = computeAbsoluteAngles(angles, settings.angleUnit);

  // Radius of the outer label ring (between inner circle and outer boundary)
  const outerLabelR = radius + margin * 0.55;

  // Draw angle arcs and lines
  // Angles go counterclockwise: negate degrees before converting to canvas radians.
  let prevAbsDeg = 0;
  const fontSize = Math.max(10, Math.min(13, radius * 0.09));

  for (let i = 0; i < angles.length; i++) {
    const absDeg = absoluteAngles[i];
    const relDeg = absDeg - prevAbsDeg;
    // Negate so positive angles go counterclockwise
    const angleRad = degToRad(-absDeg);
    const color = angles[i].color || settings.lineColor;

    // Draw line from center
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angleRad) * radius, cy + Math.sin(angleRad) * radius);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Draw relative angle label - stagger radii so overlapping labels separate
    const arcRadius = Math.min(radius * 0.25, 30 + i * 12);
    const midAngleDeg = -(prevAbsDeg + absDeg) / 2; // CCW midpoint
    const midAngleRad = degToRad(midAngleDeg);
    const labelR = arcRadius + fontSize;

    ctx.save();
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const relLabel = angles[i].label || formatAngle(fromDegrees(relDeg, settings.angleUnit), settings.angleUnit);
    ctx.fillText(
      relLabel,
      cx + Math.cos(midAngleRad) * labelR,
      cy + Math.sin(midAngleRad) * labelR
    );
    ctx.restore();

    // Show absolute angle label in the outer ring (same zone as the base "0°" label)
    if (angles[i].showAbsolute) {
      ctx.save();
      ctx.font = `italic ${fontSize - 1}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const absLabel = formatAngle(fromDegrees(absDeg, settings.angleUnit), settings.angleUnit);
      ctx.fillText(
        `(${absLabel})`,
        cx + Math.cos(angleRad) * outerLabelR,
        cy + Math.sin(angleRad) * outerLabelR
      );
      ctx.restore();
    }

    prevAbsDeg = absDeg;
  }

  // Shape outline
  drawShapeOutline(ctx, cx, cy, radius + margin * 0.3, settings.shape, settings.lineColor, 1);
}

/** Compute absolute angles in degrees for all entries */
export function computeAbsoluteAngles(
  angles: AngleEntry[],
  unit: import('../types').AngleUnit
): number[] {
  const result: number[] = [];
  let cursor = 0;

  for (const entry of angles) {
    const valueDeg = toDegrees(entry.value, unit);
    if (entry.inputMode === 'absolute') {
      cursor = valueDeg;
    } else {
      cursor += valueDeg;
    }
    result.push(cursor);
  }

  return result;
}
