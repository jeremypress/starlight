/**
 * Converts a gravity vector (in the phone's own coordinate frame, units of g) into the
 * same `beta` / `gamma` angles a browser's `deviceorientation` event reports.
 *
 * Phone axes (same for CoreMotion and the web): x → right edge, y → top edge, z → out of the screen.
 * Gravity points "down", so a phone lying flat face-up reads roughly (0, 0, -1).
 *
 * For the browser's angle convention, gravity in the phone frame works out to:
 *   x =  cos(beta) * sin(gamma)
 *   y = -sin(beta)
 *   z = -cos(beta) * cos(gamma)
 * and this function solves those equations for beta and gamma.
 */
export interface Tilt {
  /** Front/back tilt in degrees, -180..180. 0 = flat, 90 = upright facing you. */
  beta: number
  /** Left/right tilt in degrees, -90..90. Positive = right edge lower. */
  gamma: number
}

const RAD_TO_DEG = 180 / Math.PI

export function gravityToTilt(x: number, y: number, z: number): Tilt {
  // gamma is kept in -90..90 (like the browser), so fold the full-circle angle into that range.
  let gamma = Math.atan2(x, -z)
  if (gamma > Math.PI / 2) gamma -= Math.PI
  if (gamma < -Math.PI / 2) gamma += Math.PI

  // Recover cos(beta) by projecting (x, -z) onto (sin gamma, cos gamma) — avoids dividing by ~0.
  const cosBeta = x * Math.sin(gamma) + -z * Math.cos(gamma)
  const beta = Math.atan2(-y, cosBeta)

  return { beta: beta * RAD_TO_DEG, gamma: gamma * RAD_TO_DEG }
}
