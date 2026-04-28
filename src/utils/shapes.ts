import type { ShapeType } from '../types';
import { degToRad } from './math';

/** Apply a clipping path for the given shape to the context */
export function applyShapeClip(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  shape: ShapeType
): void {
  ctx.beginPath();
  switch (shape) {
    case 'circle':
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      break;
    case 'rounded-square': {
      const r = radius * 0.15;
      roundedRect(ctx, cx - radius, cy - radius, radius * 2, radius * 2, r);
      break;
    }
    case 'square':
      ctx.rect(cx - radius, cy - radius, radius * 2, radius * 2);
      break;
  }
  ctx.closePath();
  ctx.clip();
}

/** Draw a shape outline (for border) */
export function drawShapeOutline(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  shape: ShapeType,
  strokeColor: string,
  lineWidth: number
): void {
  ctx.beginPath();
  switch (shape) {
    case 'circle':
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      break;
    case 'rounded-square': {
      const r = radius * 0.15;
      roundedRect(ctx, cx - radius, cy - radius, radius * 2, radius * 2, r);
      break;
    }
    case 'square':
      ctx.rect(cx - radius, cy - radius, radius * 2, radius * 2);
      break;
  }
  ctx.closePath();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
}

/** Draw an arc label positioned at the midpoint of a segment */
export function drawArcLabel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  label: string,
  color: string,
  fontSize: number
): void {
  const midAngleDeg = (startAngleDeg + endAngleDeg) / 2;
  const midAngleRad = degToRad(midAngleDeg);
  const labelRadius = radius * 0.65;
  const x = cx + Math.cos(midAngleRad) * labelRadius;
  const y = cy + Math.sin(midAngleRad) * labelRadius;

  ctx.save();
  ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // text shadow for readability
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillText(label, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(label, x, y);
  ctx.restore();
}
