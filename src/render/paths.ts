/**
 * Hanging Garden — Path Utilities
 * 
 * Bezier curves, blob shapes, stem paths.
 */

import { Vec2, vec2, addVec2, scaleVec2 } from '../model'

/**
 * Generate SVG path data for a closed blob shape
 * Uses smooth bezier curves through control points
 */
export function blobPath(points: Vec2[], tension: number = 0.3): string {
  if (points.length < 3) return ''
  
  const n = points.length
  const parts: string[] = []
  
  // Start at first point
  parts.push(`M ${points[0].x} ${points[0].y}`)
  
  // Bezier through all points
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]
    const p1 = points[i]
    const p2 = points[(i + 1) % n]
    const p3 = points[(i + 2) % n]
    
    // Control points using Catmull-Rom to Bezier conversion
    const cp1 = addVec2(p1, scaleVec2(subtractVec2(p2, p0), tension))
    const cp2 = addVec2(p2, scaleVec2(subtractVec2(p1, p3), tension))
    
    parts.push(`C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`)
  }
  
  parts.push('Z')
  return parts.join(' ')
}

function subtractVec2(a: Vec2, b: Vec2): Vec2 {
  return vec2(a.x - b.x, a.y - b.y)
}

/**
 * Generate SVG path data for a plant stem segment
 * Curved line with variable thickness (stroke-width handled separately)
 */
export function stemPath(from: Vec2, to: Vec2, curvature: number = 0.2): string {
  const mid = scaleVec2(addVec2(from, to), 0.5)
  const perpendicular = vec2(-(to.y - from.y), to.x - from.x)
  const len = Math.sqrt(perpendicular.x ** 2 + perpendicular.y ** 2)
  const normalizedPerp = len > 0 ? scaleVec2(perpendicular, curvature / len) : vec2(0, 0)
  const controlPoint = addVec2(mid, scaleVec2(normalizedPerp, len * curvature))
  
  return `M ${from.x} ${from.y} Q ${controlPoint.x} ${controlPoint.y} ${to.x} ${to.y}`
}

/**
 * Generate SVG path for a leaf shape
 */
export function leafPath(
  base: Vec2,
  angle: number,
  length: number,
  width: number
): string {
  const tip = addVec2(base, scaleVec2(vec2(Math.cos(angle), Math.sin(angle)), length))
  const perpAngle = angle + Math.PI / 2
  const halfWidth = width / 2
  
  const left = addVec2(
    scaleVec2(addVec2(base, tip), 0.5),
    scaleVec2(vec2(Math.cos(perpAngle), Math.sin(perpAngle)), halfWidth)
  )
  const right = addVec2(
    scaleVec2(addVec2(base, tip), 0.5),
    scaleVec2(vec2(Math.cos(perpAngle), Math.sin(perpAngle)), -halfWidth)
  )
  
  return `M ${base.x} ${base.y} Q ${left.x} ${left.y} ${tip.x} ${tip.y} Q ${right.x} ${right.y} ${base.x} ${base.y} Z`
}

/**
 * Generate SVG path for a simple rock shape
 */
export function rockPath(
  center: Vec2,
  size: number,
  rotation: number,
  irregularity: number = 0.2
): string {
  const points: Vec2[] = []
  const sides = 5 + Math.floor(Math.random() * 3) // 5-7 sides
  
  for (let i = 0; i < sides; i++) {
    const angle = rotation + (i / sides) * Math.PI * 2
    const r = size * (0.8 + Math.random() * irregularity)
    points.push(addVec2(center, vec2(Math.cos(angle) * r, Math.sin(angle) * r)))
  }
  
  return blobPath(points, 0.2)
}

/**
 * Calculate a position along a quadratic bezier curve
 */
export function bezierPoint(from: Vec2, control: Vec2, to: Vec2, t: number): Vec2 {
  const t1 = 1 - t
  return vec2(
    t1 * t1 * from.x + 2 * t1 * t * control.x + t * t * to.x,
    t1 * t1 * from.y + 2 * t1 * t * control.y + t * t * to.y
  )
}

