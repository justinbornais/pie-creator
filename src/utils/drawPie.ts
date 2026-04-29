import type { PieSegment, PieSettings } from '../types';
import { degToRad, toDegrees } from './math';
import { drawPie3d } from './drawPie3d';
import { resolveExternalLabelLayout, type ExternalLabelCandidate } from './pieLabelLayout';
import { applyShapeClip, drawShapeOutline, drawArcLabel } from './shapes';

interface PieExternalLabel {
  label: string;
  side: 'left' | 'right';
  startX: number;
  startY: number;
  elbowX: number;
  elbowY: number;
  endX: number;
}

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

  // Convert values to degrees
  const degreesArr = segments.map((s) => {
    const valInDeg = toDegrees(s.value, settings.angleUnit);
    return valInDeg;
  });
  const totalDegrees = degreesArr.reduce((a, b) => a + b, 0);

  // If using percentage or raw values, normalize to 360
  const normFactor = totalDegrees > 0 ? 360 / totalDegrees : 1;

  const normalizedDeg = degreesArr.map((d) => d * normFactor);

  // Pre-compute display labels
  const labels = segments.map((s, i) => s.label || `${Math.round(normalizedDeg[i] / 3.6)}%`);

  const fillColors = segments.map((s) => s.color);

  if (settings.displayMode === '3d') {
    drawPie3d(ctx, segments, normalizedDeg, settings, fillColors, labels);
    return;
  }

  // Determine margin — if any labels need extender lines, expand it so there
  // is room outside the pie for the leader lines and text.
  let margin = size * 0.06;
  let radius = size / 2 - margin;

  if (settings.showLabels) {
    const testFontSize = Math.max(10, Math.min(14, radius * 0.1));
    ctx.font = `bold ${testFontSize}px Inter, system-ui, sans-serif`;
    const anyNeedsExtender = normalizedDeg.some((deg, i) => {
      if (deg <= 8) return false;
      const chord = 2 * (radius * 0.65) * Math.sin(degToRad(deg / 2));
      return ctx.measureText(labels[i]).width >= chord * 0.85;
    });
    if (anyNeedsExtender) {
      margin = size * 0.18;
      radius = size / 2 - margin;
    }
  }

  // For non-circle shapes the arc must extend beyond the clip boundary
  // so the clip path cuts the wedges into the desired shape.
  // √2 * radius reaches the corners of the bounding square.
  const arcRadius = settings.shape === 'circle' ? radius : radius * Math.SQRT2;

  // Main pie
  ctx.save();
  applyShapeClip(ctx, cx, cy, radius, settings.shape);
  drawPieSlices(ctx, cx, cy, arcRadius, normalizedDeg, fillColors);
  ctx.restore();

  // Border
  drawShapeOutline(ctx, cx, cy, radius, settings.shape, '#1e1e2e', 2);

  // Labels
  if (settings.showLabels) {
    let angleCursor = -90;
    const fontSize = Math.max(10, Math.min(14, radius * 0.1));
    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
    const externalLabels: ExternalLabelCandidate<PieExternalLabel>[] = [];

    for (let i = 0; i < segments.length; i++) {
      const sweep = normalizedDeg[i];
      const label = labels[i];
      const startAngle = angleCursor;
      angleCursor += sweep;

      if (sweep <= 8) continue;

      // Check if the label fits inside the segment at the label radius (65% of radius).
      // The chord length at that radius for this sweep angle is the available width.
      const chord = 2 * (radius * 0.65) * Math.sin(degToRad(sweep / 2));
      const textWidth = ctx.measureText(label).width;

      if (textWidth < chord * 0.85) {
        drawArcLabel(ctx, cx, cy, radius, startAngle, startAngle + sweep, label, '#fff', fontSize);
      } else {
        const geometry = createExtenderLabelGeometry(cx, cy, radius, startAngle, startAngle + sweep, label);
        externalLabels.push({
          side: geometry.side,
          desiredY: geometry.elbowY,
          payload: geometry,
        });
      }
    }

    const resolvedLabels = resolveExternalLabelLayout(
      externalLabels,
      fontSize,
      size - fontSize,
      fontSize + 4
    );

    for (const resolved of resolvedLabels) {
      drawExtenderLabel(ctx, resolved.payload, fontSize, resolved.labelY);
    }
  }

  // Legend
  if (settings.showLegend && !skipLegend) {
    drawLegend(ctx, segments, fillColors, size);
  }
}

/**
 * Draws a leader line from the pie edge to a label outside the chart.
 * Used when the label text is too wide to fit inside the segment.
 */
function createExtenderLabelGeometry(
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  label: string
): PieExternalLabel {
  const midAngleDeg = (startAngleDeg + endAngleDeg) / 2;
  const midAngleRad = degToRad(midAngleDeg);

  const lineStart = radius + 2;
  const lineEnd = radius + 16;
  const tickLen = 12;

  const x1 = cx + Math.cos(midAngleRad) * lineStart;
  const y1 = cy + Math.sin(midAngleRad) * lineStart;
  const x2 = cx + Math.cos(midAngleRad) * lineEnd;
  const y2 = cy + Math.sin(midAngleRad) * lineEnd;

  const side = Math.cos(midAngleRad) >= 0 ? 'right' : 'left';

  return {
    label,
    side,
    startX: x1,
    startY: y1,
    elbowX: x2,
    elbowY: y2,
    endX: x2 + (side === 'right' ? tickLen : -tickLen),
  };
}

function drawExtenderLabel(
  ctx: CanvasRenderingContext2D,
  geometry: PieExternalLabel,
  fontSize: number,
  labelY: number
): void {
  const verticalBendX = geometry.elbowX;

  ctx.save();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(geometry.startX, geometry.startY);
  ctx.lineTo(geometry.elbowX, geometry.elbowY);
  if (Math.abs(labelY - geometry.elbowY) > 0.5) {
    ctx.lineTo(verticalBendX, labelY);
  }
  ctx.lineTo(geometry.endX, labelY);
  ctx.stroke();

  ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = geometry.side === 'right' ? 'left' : 'right';
  const textX = geometry.endX + (geometry.side === 'right' ? 3 : -3);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillText(geometry.label, textX + 1, labelY + 1);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(geometry.label, textX, labelY);
  ctx.restore();
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
