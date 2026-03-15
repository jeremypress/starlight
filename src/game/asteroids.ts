/**
 * Pure functions for asteroid spawn logic — no Phaser dependencies.
 */

/**
 * Returns the number of milliseconds between asteroid spawns
 * based on how far the player has traveled (in pixels).
 *
 * Starts slow (~2s between spawns) and ramps up to fast (~400ms)
 * as distance increases.
 */
export function spawnIntervalMs(distanceTraveled: number): number {
  const startInterval = 1200
  const minInterval = 250
  // Every 3000px of distance, interval drops by half (exponential ramp)
  const decay = Math.pow(0.5, distanceTraveled / 3000)
  return minInterval + (startInterval - minInterval) * decay
}

/**
 * Generates a random asteroid size (width, height) in pixels.
 * Pixel-art style: blocky rectangles with integer sizes.
 */
export function randomAsteroidSize(): { w: number; h: number } {
  const w = 20 + Math.floor(Math.random() * 40) // 20–59
  const h = 16 + Math.floor(Math.random() * 30) // 16–45
  return { w, h }
}

/**
 * Picks a random horizontal x-position for spawning,
 * biased toward the player's current x so they have to dodge.
 * Spread widens slightly so some asteroids still appear at the edges.
 */
export function spawnXNearPlayer(playerX: number, gameWidth = 360): number {
  // Offset from player: normal-ish distribution via two random draws averaged
  const spread = 120
  const offset = (Math.random() + Math.random() - 1) * spread
  return Math.max(0, Math.min(gameWidth, Math.floor(playerX + offset)))
}
