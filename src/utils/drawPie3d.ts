import type { PieSettings, PieSegment, ShapeType } from '../types';
import { darkenColor } from './colors';
import { degToRad } from './math';
import { resolveExternalLabelLayout, type ExternalLabelCandidate } from './pieLabelLayout';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Point2D {
  x: number;
  y: number;
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
  facePoints: ProjectedPoint[];
}

interface Pie3dExternalLabel {
  label: string;
  side: 'left' | 'right';
  startX: number;
  startY: number;
  elbowX: number;
  elbowY: number;
  endX: number;
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
  const useTopLabelPlane = topCenter.z >= bottomCenter.z;
  const labelPlaneZ = useTopLabelPlane ? topPlaneZ : bottomPlaneZ;
  const labelCenter = useTopLabelPlane ? topCenter : bottomCenter;
  const labelColor = useTopLabelPlane ? '#f8fafc' : '#cbd5e1';
  const topOutline = buildProjectedOutline(projectPoint, radius, topPlaneZ, settings.shape);

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
      const rimPoint = getShapeBoundaryPoint(radius, angle, settings.shape);
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
      facePoints: [labelCenter, ...(useTopLabelPlane ? topArc : bottomArc)],
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

  drawProjectedOutline(ctx, topOutline, 'rgba(15, 23, 42, 0.8)', 2);

  if (!settings.showLabels) {
    return;
  }

  const fontSize = Math.max(10, Math.min(14, radius * 0.1));
  const labelRadialScale = 0.65;
  ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
  const externalLabels: ExternalLabelCandidate<Pie3dExternalLabel>[] = [];

  for (const placement of placements) {
    const sweep = placement.endAngle - placement.startAngle;
    if (sweep <= 8) {
      continue;
    }

    const midAngle = (placement.startAngle + placement.endAngle) / 2;
    const insidePoint = projectShapePoint(projectPoint, radius, midAngle, labelPlaneZ, settings.shape, labelRadialScale);
    const chordStart = projectShapePoint(projectPoint, radius, placement.startAngle, labelPlaneZ, settings.shape, labelRadialScale);
    const chordEnd = projectShapePoint(projectPoint, radius, placement.endAngle, labelPlaneZ, settings.shape, labelRadialScale);
    const availableWidth = Math.max(
      distance2d(chordStart, chordEnd),
      measureProjectedFaceHorizontalSpan(placement.facePoints, insidePoint.sy, fontSize)
    );
    const textWidth = ctx.measureText(placement.label).width;

    if (textWidth < availableWidth * 0.85) {
      drawText(ctx, placement.label, insidePoint.sx, insidePoint.sy, 'center', labelColor);
      continue;
    }

    const geometry = createExtenderLabelGeometry3d(
      projectPoint,
      radius,
      midAngle,
      labelPlaneZ,
      placement.label,
      settings.shape
    );
    externalLabels.push({
      side: geometry.side,
      desiredY: geometry.elbowY,
      payload: geometry,
    });
  }

  const resolvedLabels = resolveExternalLabelLayout(
    externalLabels,
    fontSize,
    size - fontSize,
    fontSize + 4
  );

  for (const resolved of resolvedLabels) {
    drawExtenderLabel3d(ctx, resolved.payload, resolved.labelY, labelColor);
  }
}

function createExtenderLabelGeometry3d(
  projectPoint: (point: Point3D) => ProjectedPoint,
  radius: number,
  angleDeg: number,
  planeZ: number,
  label: string,
  shape: ShapeType
): Pie3dExternalLabel {
  const start = projectShapePoint(projectPoint, radius, angleDeg, planeZ, shape, 1.02);
  const elbow = projectShapePoint(projectPoint, radius, angleDeg, planeZ, shape, 1.18);
  const side = elbow.sx >= start.sx ? 'right' : 'left';

  return {
    label,
    side,
    startX: start.sx,
    startY: start.sy,
    elbowX: elbow.sx,
    elbowY: elbow.sy,
    endX: elbow.sx + (side === 'right' ? 18 : -18),
  };
}

function drawExtenderLabel3d(
  ctx: CanvasRenderingContext2D,
  geometry: Pie3dExternalLabel,
  labelY: number,
  color: string
): void {

  ctx.save();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(geometry.startX, geometry.startY);
  ctx.lineTo(geometry.elbowX, geometry.elbowY);
  if (Math.abs(labelY - geometry.elbowY) > 0.5) {
    ctx.lineTo(geometry.elbowX, labelY);
  }
  ctx.lineTo(geometry.endX, labelY);
  ctx.stroke();
  ctx.restore();

  drawText(
    ctx,
    geometry.label,
    geometry.endX + (geometry.side === 'right' ? 4 : -4),
    labelY,
    geometry.side === 'right' ? 'left' : 'right',
    color
  );
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

function projectShapePoint(
  projectPoint: (point: Point3D) => ProjectedPoint,
  radius: number,
  angleDeg: number,
  z: number,
  shape: ShapeType,
  radialScale = 1
): ProjectedPoint {
  const point = getShapeBoundaryPoint(radius, angleDeg, shape);

  return projectPoint({
    x: point.x * radialScale,
    y: point.y * radialScale,
    z,
  });
}

function distance2d(a: ProjectedPoint, b: ProjectedPoint): number {
  return Math.hypot(b.sx - a.sx, b.sy - a.sy);
}

export function measureProjectedFaceHorizontalSpan(
  points: Array<{ sx: number; sy: number }>,
  centerY: number,
  textHeight: number
): number {
  if (points.length < 3) {
    return 0;
  }

  const sampleOffsets = textHeight > 0 ? [-textHeight * 0.35, 0, textHeight * 0.35] : [0];
  let narrowestSpan = Number.POSITIVE_INFINITY;

  for (const offset of sampleOffsets) {
    const intersections = collectHorizontalIntersections(points, centerY + offset);
    if (intersections.length < 2) {
      continue;
    }

    intersections.sort((a, b) => a - b);
    narrowestSpan = Math.min(narrowestSpan, intersections[intersections.length - 1] - intersections[0]);
  }

  return Number.isFinite(narrowestSpan) ? narrowestSpan : 0;
}

function collectHorizontalIntersections(
  points: Array<{ sx: number; sy: number }>,
  targetY: number
): number[] {
  const intersections: number[] = [];

  for (let index = 0; index < points.length; index++) {
    const start = points[index];
    const end = points[(index + 1) % points.length];

    if (Math.abs(start.sy - end.sy) <= 1e-6) {
      if (Math.abs(targetY - start.sy) <= 1e-6) {
        intersections.push(start.sx, end.sx);
      }
      continue;
    }

    const lower = start.sy < end.sy ? start : end;
    const upper = start.sy < end.sy ? end : start;

    if (targetY < lower.sy || targetY >= upper.sy) {
      continue;
    }

    const ratio = (targetY - lower.sy) / (upper.sy - lower.sy);
    intersections.push(lower.sx + (upper.sx - lower.sx) * ratio);
  }

  return intersections;
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
  z: number,
  shape: ShapeType
): ProjectedPoint[] {
  const points: ProjectedPoint[] = [];
  const steps = 96;

  for (let step = 0; step < steps; step++) {
    const angle = -90 + (360 * step) / steps;
    points.push(projectShapePoint(projectPoint, radius, angle, z, shape));
  }

  return points;
}

function drawProjectedOutline(
  ctx: CanvasRenderingContext2D,
  outline: ProjectedPoint[],
  strokeStyle: string,
  lineWidth: number
): void {
  if (outline.length < 2) {
    return;
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(outline[0].sx, outline[0].sy);
  for (let i = 1; i < outline.length; i++) {
    ctx.lineTo(outline[i].sx, outline[i].sy);
  }
  ctx.closePath();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.restore();
}

export function getShapeBoundaryPoint(radius: number, angleDeg: number, shape: ShapeType): Point2D {
  const angleRad = degToRad(angleDeg);
  const directionX = Math.cos(angleRad);
  const directionY = Math.sin(angleRad);

  switch (shape) {
    case 'circle':
      return {
        x: directionX * radius,
        y: directionY * radius,
      };
    case 'square':
      return getSquareBoundaryPoint(radius, directionX, directionY);
    case 'rounded-square':
      return getRoundedSquareBoundaryPoint(radius, directionX, directionY);
  }
}

function getSquareBoundaryPoint(radius: number, directionX: number, directionY: number): Point2D {
  const maxComponent = Math.max(Math.abs(directionX), Math.abs(directionY), 1e-6);
  const scale = radius / maxComponent;

  return {
    x: directionX * scale,
    y: directionY * scale,
  };
}

function getRoundedSquareBoundaryPoint(radius: number, directionX: number, directionY: number): Point2D {
  const cornerRadius = radius * 0.15;
  const straightExtent = radius - cornerRadius;
  const absX = Math.abs(directionX);
  const absY = Math.abs(directionY);
  const signX = directionX >= 0 ? 1 : -1;
  const signY = directionY >= 0 ? 1 : -1;

  if (absX <= 1e-6) {
    return { x: 0, y: signY * radius };
  }

  const verticalScale = radius / absX;
  if (absY * verticalScale <= straightExtent + 1e-6) {
    return {
      x: signX * radius,
      y: directionY * verticalScale,
    };
  }

  if (absY <= 1e-6) {
    return { x: signX * radius, y: 0 };
  }

  const horizontalScale = radius / absY;
  if (absX * horizontalScale <= straightExtent + 1e-6) {
    return {
      x: directionX * horizontalScale,
      y: signY * radius,
    };
  }

  const cornerCenterX = signX * straightExtent;
  const cornerCenterY = signY * straightExtent;
  const dot = directionX * cornerCenterX + directionY * cornerCenterY;
  const cornerCenterLengthSq = cornerCenterX * cornerCenterX + cornerCenterY * cornerCenterY;
  const discriminant = Math.max(
    0,
    dot * dot - (cornerCenterLengthSq - cornerRadius * cornerRadius)
  );
  const scale = dot + Math.sqrt(discriminant);

  return {
    x: directionX * scale,
    y: directionY * scale,
  };
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