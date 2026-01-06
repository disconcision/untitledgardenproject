/**
 * Force Field System
 *
 * Composable vector force fields that affect particle movement.
 * Forces are computed on-demand at particle positions for efficiency.
 */

import { World, Vec2, vec2, addVec2 } from "../model";

export { createPathwayForce, samplePathwayForce } from "./pathway";

// === Core Types ===

/**
 * A ForceField is a function that computes a force vector at any position.
 * Returns the force to apply to a particle at that position.
 */
export type ForceField = (pos: Vec2, world: World) => Vec2;

/**
 * Combine multiple force fields into one by summing their contributions.
 */
export function combineForces(fields: ForceField[]): ForceField {
  return (pos: Vec2, world: World): Vec2 => {
    let result = vec2(0, 0);
    for (const field of fields) {
      result = addVec2(result, field(pos, world));
    }
    return result;
  };
}

/**
 * Scale a force field by a constant factor.
 */
export function scaleForce(field: ForceField, scale: number): ForceField {
  return (pos: Vec2, world: World): Vec2 => {
    const force = field(pos, world);
    return vec2(force.x * scale, force.y * scale);
  };
}

/**
 * Zero force field - returns no force at any position.
 */
export const zeroForce: ForceField = (): Vec2 => vec2(0, 0);
