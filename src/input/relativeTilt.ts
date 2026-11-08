import { gravityToTilt, type Tilt, type Vec3 } from './gravityToTilt.ts'

/**
 * Tilt measured from the pose the player was holding at calibration, instead of from "flat".
 *
 * How: find the rotation that would turn the calibration pose into "lying flat", apply that
 * same rotation to the current gravity reading, then read off beta/gamma as usual.
 * The calibration pose always comes out as (0°, 0°), and small tilts away from it stay small
 * and well-behaved — even if the player holds the phone nearly upright, where raw
 * beta/gamma angles get jumpy.
 */
export function relativeTilt(reference: Vec3, current: Vec3): Tilt {
  return gravityToTilt(...rotateReferenceToFlat(normalize(reference), normalize(current)))
}

const FLAT: Vec3 = { x: 0, y: 0, z: -1 } // gravity when the phone lies face-up on a table

/** Rotate `v` by the smallest rotation that takes `ref` onto FLAT (Rodrigues' formula). */
function rotateReferenceToFlat(ref: Vec3, v: Vec3): [number, number, number] {
  const k = cross(ref, FLAT) // rotation axis, scaled by sin(angle)
  const c = dot(ref, FLAT) // cos(angle)
  if (1 + c < 1e-6) return [v.x, v.y, v.z] // calibrated face-down: no unique rotation, skip
  const kxv = cross(k, v)
  const s = dot(k, v) / (1 + c)
  return [v.x * c + kxv.x + k.x * s, v.y * c + kxv.y + k.y * s, v.z * c + kxv.z + k.z * s]
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z) || 1
  return { x: v.x / len, y: v.y / len, z: v.z / len }
}
