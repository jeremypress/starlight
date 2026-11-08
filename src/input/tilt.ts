import { gravityToTilt, type Tilt } from './gravityToTilt.ts'

/**
 * One place for the game to get tilt readings, wherever they come from:
 * - Inside the iOS app: CoreMotion gravity readings sent in by the native shell.
 * - In a browser: the standard `deviceorientation` event.
 */

/** Set by the iOS shell before the page loads. */
export const isNativeApp = typeof window !== 'undefined' && window.starlightNative === true

/** Name of the event the native shell dispatches on `window` with `{ x, y, z }` gravity. */
const NATIVE_GRAVITY_EVENT = 'starlight:gravity'

/** Ask for motion access if the platform needs it. Must be called from a tap. */
export async function requestTiltPermission(): Promise<boolean> {
  if (isNativeApp) return true // the app reads motion natively; no browser prompt needed
  const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
  if (typeof DOE.requestPermission !== 'function') return true
  try {
    return (await DOE.requestPermission()) === 'granted'
  } catch (err) {
    console.error('Gyroscope permission denied:', err)
    return false
  }
}

/** Subscribe to tilt readings. Returns a function that unsubscribes. */
export function onTilt(callback: (tilt: Tilt) => void): () => void {
  if (isNativeApp) {
    const handler = (e: Event) => {
      const { x, y, z } = (e as CustomEvent<{ x: number; y: number; z: number }>).detail
      callback(gravityToTilt(x, y, z))
    }
    window.addEventListener(NATIVE_GRAVITY_EVENT, handler)
    return () => window.removeEventListener(NATIVE_GRAVITY_EVENT, handler)
  }

  const handler = (e: DeviceOrientationEvent) => {
    if (e.beta !== null && e.gamma !== null) callback({ beta: e.beta, gamma: e.gamma })
  }
  window.addEventListener('deviceorientation', handler)
  return () => window.removeEventListener('deviceorientation', handler)
}
