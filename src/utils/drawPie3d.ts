import type { PieSettings, PieSegment } from '../types';
import { darkenColor } from './colors';
import { degToRad } from './math';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface ProjectedPoint extends Point3D {
  sx: number;
  sy: number;
}

interface Face {
  points: ProjectedPoint[];
  fill: string;
  stroke?: string;
  avgZ: number;
  kind: 'top' | 'side' | 'bottom';
}

interface LabelPlacement {
  startAngle: number;
  endAngle: number;
  label: string;
}

export function drawPie3d(
  ctx: CanvasRenderingContext2D,
  segments: PieSegment[],
  normalizedDeg: number[],
  settings: PieSettings,
  fillColors: string[],
  labels: string[]
): void {
  const size = settings.canvasSize;
  const cx = size / 2;
  const cy = size / 2 + size * 0.02;
  const baseRadius = size * (settings.showLabels ? 0.31 : 0.35);
  const radius = baseRadius * (settings.zoomPercent / 100);
  const depth = radius * 2 * (settings.thicknessPercent / 100);
  const cameraDistance = radius * 6;
  const topPlaneZ = depth / 2;
  const bottomPlaneZ = -depth / 2;

  const rotation = {
    x: degToRad(settings.rotationX),
    y: degToRad(settings.rotationY),
    z: degToRad(settings.rotationZ),
  };

  const projectPoint = (point: Point3D): ProjectedPoint => {
    const rotated = rotatePoint(point, rotation.x, rotation.y, rotation.z);
    const scale = cameraDistance / (cameraDistance - rotated.z);
    return {
      ...rotated,
      sx: cx + rotated.x * scale,
      sy: cy + rotated.y * scale,
    };
  };

  const topCenter = projectPoint({ x: 0, y: 0, z: topPlaneZ });
  const bottomCenter = projectPoint({ x: 0, y: 0, z: bottomPlaneZ });
  const labelPlaneZ = topCenter.z >= bottomCenter.z ? topPlaneZ : bottomPlaneZ;
  const labelColor = topCenter.z >= bottomCenter.z ? '#f8fafc' : '#cbd5e1';
  const topOutline = buildProjectedOutline(projectPoint, radius, topPlaneZ);

  const faces: Face[] = [];
  const placements: LabelPlacement[] = [];

  let angleCursor = -90;
  for (let i = 0; i < segments.length; i++) {
    const startAngle = angleCursor;
    const sweep = normalizedDeg[i];
    const endAngle = startAngle + sweep;
    angleCursor = endAngle;

    const steps = Math.max(10, Math.ceil(sweep / 6));
    const topArc: ProjectedPoint[] = [];
    const bottomArc: ProjectedPoint[] = [];

    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      const angle = startAngle + sweep * t;
      const angleRad = degToRad(angle);
      const rimPoint = {
        x: Math.cos(angleRad) * radius,
        y: Math.sin(angleRad) * radius,
      };
      topArc.push(projectPoint({ ...rimPoint, z: topPlaneZ }));
      bottomArc.push(projectPoint({ ...rimPoint, z: bottomPlaneZ }));
    }

    faces.push({
      points: orientFaceOutward([projectPoint({ x: 0, y: 0, z: bottomPlaneZ }), ...bottomArc]),
      fill: darkenColor(fillColors[i], 0.55),
      avgZ: averageZ(bottomArc),
      kind: 'bottom',
    });

    for (let step = 0; step < steps; step++) {
      const quad = orientFaceOutward([topArc[step], topArc[step + 1], bottomArc[step + 1], bottomArc[step]]);
      const sideDarken = 0.32 + (step / steps) * 0.12;
      faces.push({
        points: quad,
        fill: darkenColor(fillColors[i], sideDarken),
        stroke: 'rgba(15, 23, 42, 0.18)',
        avgZ: averageZ(quad),
        kind: 'side',
      });
    }

    faces.push({
      points: orientFaceOutward([projectPoint({ x: 0, y: 0, z: topPlaneZ }), ...topArc]),
      fill: fillColors[i],
      stroke: 'rgba(15, 23, 42, 0.22)',
      avgZ: averageZ(topArc) + 0.001,
      kind: 'top',
    });

    placements.push({
      startAngle,
      endAngle,
      label: labels[i],
    });
  }

  faces.sort((a, b) => a.avgZ - b.avgZ);

  const thicknessFaces = faces.filter((face) => face.kind !== 'top');
  const topFaces = faces.filter((face) => face.kind === 'top');

  if (depth > 0) {
    ctx.save();
    clipOutsideTopOutline(ctx, size, topOutline);
    for (const face of thicknessFaces) {
      drawFace(ctx, face);
    }
    ctx.restore();
  }

  for (const face of topFaces) {
    drawFace(ctx, face);
  }

  if (!settings.showLabels) {
    return;
  }

  const fontSize = Math.max(10, Math.min(14, radius * 0.11));
  ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;

  for (const placement of placements) {
    const sweep = placement.endAngle - placement.startAngle;
    if (sweep <= 8) {
      continue;
    }

    const midAngle = (placement.startAngle + placement.endAngle) / 2;
    const insidePoint = projectPolarPoint(projectPoint, radius * 0.58, midAngle, labelPlaneZ);
    const chordStart = projectPolarPoint(projectPoint, radius * 0.58, placement.startAngle, labelPlaneZ);
    const chordEnd = projectPolarPoint(projectPoint, radius * 0.58, placement.endAngle, labelPlaneZ);
    const availableWidth = distance2d(chordStart, chordEnd);
    const textWidth = ctx.measureText(placement.label).width;

    if (textWidth < availableWidth * 0.82) {
      drawText(ctx, placement.label, insidePoint.sx, insidePoint.sy, 'center', labelColor);
      continue;
    }

    drawExtenderLabel3d(ctx, projectPoint, radius, midAngle, labelPlaneZ, placement.label, labelColor);
  }
}

function drawExtenderLabel3d(
  ctx: CanvasRenderingContext2D,
  projectPoint: (point: Point3D) => ProjectedPoint,
  radius: number,
  angleDeg: number,
  planeZ: number,
  label: string,
  color: string
): void {
  const start = projectPolarPoint(projectPoint, radius * 1.02, angleDeg, planeZ);
  const elbow = projectPolarPoint(projectPoint, radius * 1.18, angleDeg, planeZ);
  const onRight = elbow.sx >= start.sx;
  const endX = elbow.sx + (onRight ? 18 : -18);

  ctx.save();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(start.sx, start.sy);
  ctx.lineTo(elbow.sx, elbow.sy);
  ctx.lineTo(endX, elbow.sy);
  ctx.stroke();
  ctx.restore();

  drawText(ctx, label, endX + (onRight ? 4 : -4), elbow.sy, onRight ? 'left' : 'right', color);
}

function drawText(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  align: CanvasTextAlign,
  color: string
): void {
  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.fillText(label, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(label, x, y);
  ctx.restore();
}

function projectPolarPoint(
  projectPoint: (point: Point3D) => ProjectedPoint,
  radius: number,
  angleDeg: number,
  z: number
): ProjectedPoint {
  const angleRad = degToRad(angleDeg);
  return projectPoint({
    x: Math.cos(angleRad) * radius,
    y: Math.sin(angleRad) * radius,
    z,
  });
}

function distance2d(a: ProjectedPoint, b: ProjectedPoint): number {
  return Math.hypot(b.sx - a.sx, b.sy - a.sy);
}

function averageZ(points: ProjectedPoint[]): number {
  if (points.length === 0) return 0;
  return points.reduce((sum, point) => sum + point.z, 0) / points.length;
}

function drawFace(ctx: CanvasRenderingContext2D, face: Face): void {
  if (face.points.length < 3 || !isFaceVisible(face.points)) {
    return;
  }

  ctx.beginPath();
  ctx.moveTo(face.points[0].sx, face.points[0].sy);
  for (let i = 1; i < face.points.length; i++) {
    ctx.lineTo(face.points[i].sx, face.points[i].sy);
  }
  ctx.closePath();
  ctx.fillStyle = face.fill;
  ctx.fill();

  if (face.stroke) {
    ctx.strokeStyle = face.stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function buildProjectedOutline(
  projectPoint: (point: Point3D) => ProjectedPoint,
  radius: number,
  z: number
): ProjectedPoint[] {
  const points: ProjectedPoint[] = [];
  const steps = 96;

  for (let step = 0; step < steps; step++) {
    const angle = -90 + (360 * step) / steps;
    const angleRad = degToRad(angle);
    points.push(projectPoint({
      x: Math.cos(angleRad) * radius,
      y: Math.sin(angleRad) * radius,
      z,
    }));
  }

  return points;
}

function clipOutsideTopOutline(
  ctx: CanvasRenderingContext2D,
  size: number,
  outline: ProjectedPoint[]
): void {
  if (outline.length < 3) {
    return;
  }

  ctx.beginPath();
  ctx.rect(0, 0, size, size);
  ctx.moveTo(outline[0].sx, outline[0].sy);
  for (let i = 1; i < outline.length; i++) {
    ctx.lineTo(outline[i].sx, outline[i].sy);
  }
  ctx.closePath();
  ctx.clip('evenodd');
}

function orientFaceOutward(points: ProjectedPoint[]): ProjectedPoint[] {
  if (points.length < 3) {
    return points;
  }

  const normal = computeFaceNormal(points);
  const center = computeFaceCenter(points);
  const outwardScore = normal.x * center.x + normal.y * center.y + normal.z * center.z;

  if (outwardScore >= 0) {
    return points;
  }

  return [points[0], ...points.slice(1).reverse()];
}

function isFaceVisible(points: ProjectedPoint[]): boolean {
  return computeFaceNormal(points).z > 0;
}

function computeFaceCenter(points: ProjectedPoint[]): Point3D {
  const total = points.reduce(
    (sum, point) => ({
      x: sum.x + point.x,
      y: sum.y + point.y,
      z: sum.z + point.z,
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
    z: total.z / points.length,
  };
}

function computeFaceNormal(points: ProjectedPoint[]): Point3D {
  const origin = points[0];

  for (let i = 1; i < points.length - 1; i++) {
    const edgeA = {
      x: points[i].x - origin.x,
      y: points[i].y - origin.y,
      z: points[i].z - origin.z,
    };
    const edgeB = {
      x: points[i + 1].x - origin.x,
      y: points[i + 1].y - origin.y,
      z: points[i + 1].z - origin.z,
    };
    const normal = {
      x: edgeA.y * edgeB.z - edgeA.z * edgeB.y,
      y: edgeA.z * edgeB.x - edgeA.x * edgeB.z,
      z: edgeA.x * edgeB.y - edgeA.y * edgeB.x,
    };
    const magnitude = Math.hypot(normal.x, normal.y, normal.z);

    if (magnitude > 1e-6) {
      return normal;
    }
  }

  return { x: 0, y: 0, z: 0 };
}

function rotatePoint(point: Point3D, rx: number, ry: number, rz: number): Point3D {
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const cosZ = Math.cos(rz);
  const sinZ = Math.sin(rz);

  let x = point.x;
  let y = point.y * cosX - point.z * sinX;
  let z = point.y * sinX + point.z * cosX;

  const rotatedX = x * cosY + z * sinY;
  const rotatedZ = -x * sinY + z * cosY;
  x = rotatedX;
  z = rotatedZ;

  return {
    x: x * cosZ - y * sinZ,
    y: x * sinZ + y * cosZ,
    z,
  };
}