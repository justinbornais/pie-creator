export interface ExternalLabelCandidate<T> {
  side: 'left' | 'right';
  desiredY: number;
  payload: T;
}

export interface ResolvedExternalLabel<T> extends ExternalLabelCandidate<T> {
  labelY: number;
}

export function resolveExternalLabelLayout<T>(
  candidates: ExternalLabelCandidate<T>[],
  minY: number,
  maxY: number,
  minGap: number
): ResolvedExternalLabel<T>[] {
  const left = layoutSide(
    candidates.filter((candidate) => candidate.side === 'left'),
    minY,
    maxY,
    minGap
  );
  const right = layoutSide(
    candidates.filter((candidate) => candidate.side === 'right'),
    minY,
    maxY,
    minGap
  );

  return [...left, ...right];
}

function layoutSide<T>(
  candidates: ExternalLabelCandidate<T>[],
  minY: number,
  maxY: number,
  minGap: number
): ResolvedExternalLabel<T>[] {
  if (candidates.length === 0) {
    return [];
  }

  const resolved = [...candidates]
    .sort((a, b) => a.desiredY - b.desiredY)
    .map((candidate) => ({
      ...candidate,
      labelY: clamp(candidate.desiredY, minY, maxY),
    }));

  for (let i = 1; i < resolved.length; i++) {
    resolved[i].labelY = Math.max(resolved[i].labelY, resolved[i - 1].labelY + minGap);
  }

  if (resolved[resolved.length - 1].labelY > maxY) {
    resolved[resolved.length - 1].labelY = maxY;
    for (let i = resolved.length - 2; i >= 0; i--) {
      resolved[i].labelY = Math.min(resolved[i].labelY, resolved[i + 1].labelY - minGap);
    }
  }

  if (resolved[0].labelY < minY) {
    resolved[0].labelY = minY;
    for (let i = 1; i < resolved.length; i++) {
      resolved[i].labelY = Math.max(resolved[i].labelY, resolved[i - 1].labelY + minGap);
    }
  }

  return resolved;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}