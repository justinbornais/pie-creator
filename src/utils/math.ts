import type { AngleUnit } from '../types';

/** Convert any angle unit value to degrees */
export function toDegrees(value: number, unit: AngleUnit): number {
  switch (unit) {
    case 'degrees':
      return value;
    case 'radians':
      return value * (180 / Math.PI);
    case 'gradians':
      return value * (360 / 400);
    case 'percentage':
      return value * 3.6; // 100% = 360°
  }
}

/** Convert degrees to any angle unit */
export function fromDegrees(degrees: number, unit: AngleUnit): number {
  switch (unit) {
    case 'degrees':
      return degrees;
    case 'radians':
      return degrees * (Math.PI / 180);
    case 'gradians':
      return degrees * (400 / 360);
    case 'percentage':
      return degrees / 3.6;
  }
}

/** Convert degrees to radians */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Normalize an angle to 0-360 range */
export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Format an angle value with its unit label */
export function formatAngle(value: number, unit: AngleUnit): string {
  const rounded = Math.round(value * 100) / 100;
  switch (unit) {
    case 'degrees':
      return `${rounded}°`;
    case 'radians':
      return `${rounded} rad`;
    case 'gradians':
      return `${rounded} gon`;
    case 'percentage':
      return `${rounded}%`;
  }
}

/** Get the unit suffix label */
export function unitLabel(unit: AngleUnit): string {
  switch (unit) {
    case 'degrees':
      return '°';
    case 'radians':
      return 'rad';
    case 'gradians':
      return 'gon';
    case 'percentage':
      return '%';
  }
}

/** Get the full rotation value for a unit */
export function fullRotation(unit: AngleUnit): number {
  switch (unit) {
    case 'degrees':
      return 360;
    case 'radians':
      return 2 * Math.PI;
    case 'gradians':
      return 400;
    case 'percentage':
      return 100;
  }
}
