/**
 * Triangle-vs-AABB collision using the Separating Axis Theorem (SAT).
 *
 * SAT says: two convex shapes do NOT overlap if you can find an axis
 * (a direction) where the "shadows" (projections) of the two shapes
 * don't overlap.  For a triangle vs a rectangle we need to check
 * 3 triangle-edge normals + 2 rectangle-edge normals (the X and Y axes).
 *
 * If no separating axis is found, the shapes are colliding.
 */

interface Vec2 {
  x: number
  y: number
}

/** Project every vertex onto `axis` and return the min/max scalar values. */
function project(vertices: Vec2[], axis: Vec2): [number, number] {
  let min = Infinity
  let max = -Infinity
  for (const v of vertices) {
    const dot = v.x * axis.x + v.y * axis.y
    if (dot < min) min = dot
    if (dot > max) max = dot
  }
  return [min, max]
}

/** True when two 1-D intervals overlap. */
function overlaps(a: [number, number], b: [number, number]): boolean {
  return a[0] <= b[1] && b[0] <= a[1]
}

/**
 * Returns true if a triangle and an axis-aligned rectangle overlap.
 *
 * @param tri  Three vertices of the triangle (world coords).
 * @param rect Top-left corner (x, y), width, and height of the rectangle.
 */
export function triangleRectOverlap(
  tri: [Vec2, Vec2, Vec2],
  rect: { x: number; y: number; w: number; h: number },
): boolean {
  const rectVerts: Vec2[] = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
  ]

  // Axes to test: 2 from the AABB (x and y) + 3 from the triangle edges
  const axes: Vec2[] = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ]

  for (let i = 0; i < 3; i++) {
    const a = tri[i]
    const b = tri[(i + 1) % 3]
    // Edge normal (perpendicular to edge)
    axes.push({ x: -(b.y - a.y), y: b.x - a.x })
  }

  for (const axis of axes) {
    if (!overlaps(project(tri, axis), project(rectVerts, axis))) {
      return false // found a separating axis — no collision
    }
  }
  return true
}
