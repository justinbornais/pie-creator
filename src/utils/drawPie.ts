import type { PieSegment, PieSettings } from '../types';
import { degToRad, toDegrees } from './math';
import { darkenColor, bwShade } from './colors';
import { applyShapeClip, drawShapeOutline, drawArcLabel } from './shapes';

export function drawPie(
  canvas: HTMLCanvasElement,
  segments: PieSegment[],
  settings: PieSettings,
  dprOverride?: number,
  skipLegend?: boolean
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = settings.canvasSize;
  const dpr = dprOverride ?? (window.devicePixelRatio || 1);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, size, size);

  const totalValue = segments.reduce((sum, s) => sum + s.value, 0);
  if (totalValue <= 0 || segments.length === 0) {
    drawEmpty(ctx, size);
    return;
  }

  const cx = size / 2;
  const cy = size / 2;
  const margin = size * 0.06;
  const radius = size / 2 - margin;

  // Convert values to degrees
  const degreesArr = segments.map((s) => {
    const valInDeg = toDegrees(s.value, settings.angleUnit);
    return valInDeg;
  });
  const totalDegrees = degreesArr.reduce((a, b) => a + b, 0);

  // If using percentage or raw values, normalize to 360
  const normFactor = totalDegrees > 0 ? 360 / totalDegrees : 1;

  const normalizedDeg = degreesArr.map((d) => d * normFactor);

  // Determine fill colors
  const fillColors = segments.map((s, i) => {
    if (settings.displayMode === 'bw') return bwShade(i, segments.length);
    return s.color;
  });

  // For non-circle shapes the arc must extend beyond the clip boundary
  // so the clip path cuts the wedges into the desired shape.
  // √2 * radius reaches the corners of the bounding square.
  const arcRadius = settings.shape === 'circle' ? radius : radius * Math.SQRT2;

  // 3D effect: draw shadow layers
  if (settings.displayMode === '3d') {
    const shadowDepth = Math.max(6, radius * 0.04);
    for (let layer = shadowDepth; layer > 0; layer--) {
      ctx.save();
      applyShapeClip(ctx, cx, cy + layer, radius, settings.shape);
      drawPieSlices(ctx, cx, cy + layer, arcRadius, normalizedDeg, fillColors.map((c) => darkenColor(c, 0.4)));
      ctx.restore();
    }
  }

  // Main pie
  ctx.save();
  applyShapeClip(ctx, cx, cy, radius, settings.shape);
  drawPieSlices(ctx, cx, cy, arcRadius, normalizedDeg, fillColors);
  ctx.restore();

  // Border
  drawShapeOutline(ctx, cx, cy, radius, settings.shape, settings.displayMode === 'bw' ? '#333' : '#1e1e2e', 2);

  // Labels
  if (settings.showLabels) {
    let angleCursor = -90;
    const fontSize = Math.max(10, Math.min(14, radius * 0.1));
    for (let i = 0; i < segments.length; i++) {
      const sweep = normalizedDeg[i];
      if (sweep > 8) {
        // only draw label if segment is big enough
        drawArcLabel(
          ctx,
          cx,
          cy,
          radius,
          angleCursor,
          angleCursor + sweep,
          segments[i].label || `${Math.round(normalizedDeg[i] / 3.6)}%`,
          '#fff',
          fontSize
        );
      }
      angleCursor += sweep;
    }
  }

  // Legend
  if (settings.showLegend && !skipLegend) {
    drawLegend(ctx, segments, fillColors, size);
  }
}

function drawPieSlices(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  degArr: number[],
  colors: string[]
): void {
  let angleCursor = -90; // start from top
  for (let i = 0; i < degArr.length; i++) {
    const startRad = degToRad(angleCursor);
    angleCursor += degArr[i];
    const endRad = degToRad(angleCursor);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startRad, endRad);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();

    // subtle border between segments
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  segments: PieSegment[],
  colors: string[],
  size: number
): void {
  const fontSize = Math.max(10, Math.min(13, size * 0.03));
  const boxSize = fontSize;
  const padding = 8;
  const lineHeight = fontSize + 6;
  const legendX = padding;
  const legendY = size - padding - segments.length * lineHeight;

  // background
  const legendW = size * 0.4;
  const legendH = segments.length * lineHeight + padding;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.beginPath();
  ctx.roundRect(legendX - 4, legendY - 4, legendW, legendH, 6);
  ctx.fill();

  ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textBaseline = 'middle';

  for (let i = 0; i < segments.length; i++) {
    const y = legendY + i * lineHeight + lineHeight / 2;
    ctx.fillStyle = colors[i];
    ctx.fillRect(legendX, y - boxSize / 2, boxSize, boxSize);
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'left';
    ctx.fillText(segments[i].label || `Segment ${i + 1}`, legendX + boxSize + 6, y);
  }
}

function drawEmpty(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = '#334155';
  ctx.font = '14px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Add segments to create a pie chart', size / 2, size / 2);
}
