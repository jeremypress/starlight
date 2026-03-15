/**
 * Difficulty parameters that ramp linearly over 5 minutes (300s), then cap.
 */
export function difficultyAt(elapsedSeconds: number) {
  const t = Math.min(elapsedSeconds, 300) / 300 // 0→1 over 5 minutes

  return {
    minScroll: 80 + t * (400 - 80),        // 80 → 400 px/s
    maxScroll: 500 + t * (1200 - 500),      // 500 → 1200 px/s
    asteroidExtraSpeed: t * 250,             // 0 → 250 px/s on top of scroll speed
  }
}
