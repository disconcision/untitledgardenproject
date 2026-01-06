/**
 * Pathway Force Field
 *
 * Creates a force field that pulls particles toward and along pathways.
 * Particles near pathway lines get pulled in the pathway's direction.
 */

import {
  World,
  Vec2,
  vec2,
  subVec2,
  addVec2,
  scaleVec2,
  lenVec2,
  normalizeVec2,
  Pathway,
} from "../model";
// ForceField type is defined here to avoid circular import
type ForceField = (pos: Vec2, world: World) => Vec2;

// === Types ===

type PathwayGeometry = {
  pathway: Pathway;
  fromPos: Vec2;
  toPos: Vec2;
  length: number;
  direction: Vec2; // Unit vector from -> to
};

// === Helper Functions ===

/**
 * Get the geometry of a pathway (cached positions and direction).
 */
function getPathwayGeometry(pathway: Pathway, world: World): PathwayGeometry | null {
  const fromCluster = world.clusters.get(pathway.fromClusterId);
  const toCluster = world.clusters.get(pathway.toClusterId);
  if (!fromCluster || !toCluster) return null;

  const fromPos = fromCluster.pos;
  const toPos = toCluster.pos;
  const delta = subVec2(toPos, fromPos);
  const length = lenVec2(delta);
  const direction = length > 0 ? normalizeVec2(delta) : vec2(0, 0);

  return { pathway, fromPos, toPos, length, direction };
}

/**
 * Calculate the closest point on a line segment to a given point.
 * Returns the parameter t (0-1) along the segment and the closest point.
 */
function closestPointOnSegment(
  point: Vec2,
  segStart: Vec2,
  segEnd: Vec2
): { t: number; closest: Vec2; distance: number } {
  const segVec = subVec2(segEnd, segStart);
  const segLen = lenVec2(segVec);

  if (segLen === 0) {
    return { t: 0, closest: segStart, distance: lenVec2(subVec2(point, segStart)) };
  }

  const pointVec = subVec2(point, segStart);
  const t = Math.max(
    0,
    Math.min(1, (pointVec.x * segVec.x + pointVec.y * segVec.y) / (segLen * segLen))
  );
  const closest = addVec2(segStart, scaleVec2(segVec, t));
  const distance = lenVec2(subVec2(point, closest));

  return { t, closest, distance };
}

// === Force Field Creation ===

/**
 * Configuration for pathway force field.
 */
export type PathwayForceConfig = {
  /** Maximum distance from pathway to feel the force */
  maxDistance: number;
  /** Base strength of the force at distance 0 */
  baseStrength: number;
  /** How much the force pulls toward the line (vs along it) */
  attractionWeight: number;
  /** How much the force pulls along the direction */
  directionWeight: number;
};

const DEFAULT_CONFIG: PathwayForceConfig = {
  maxDistance: 300,
  baseStrength: 25, // Increased to compensate for cubic falloff
  attractionWeight: 0.35,
  directionWeight: 0.65,
};

/**
 * Create a force field that pulls particles toward and along pathways.
 */
export function createPathwayForce(config: Partial<PathwayForceConfig> = {}): ForceField {
  const cfg: PathwayForceConfig = { ...DEFAULT_CONFIG, ...config };

  return (pos: Vec2, world: World): Vec2 => {
    return samplePathwayForce(pos, world, cfg);
  };
}

/**
 * Sample the pathway force at a specific position.
 * Exported for debug visualization.
 */
export function samplePathwayForce(
  pos: Vec2,
  world: World,
  config: PathwayForceConfig = DEFAULT_CONFIG
): Vec2 {
  let totalForce = vec2(0, 0);

  for (const pathway of world.pathways.values()) {
    const geom = getPathwayGeometry(pathway, world);
    if (!geom) continue;

    const { t, closest, distance } = closestPointOnSegment(pos, geom.fromPos, geom.toPos);

    // Skip if too far from pathway
    if (distance > config.maxDistance) continue;

    // Force falls off with distance (cubic for steeper falloff - stronger near, weaker far)
    const distanceFactor = 1 - distance / config.maxDistance;
    const strength = config.baseStrength * distanceFactor * distanceFactor * distanceFactor; // Cubic falloff

    // Direction based on pathway direction property
    let flowDirection: Vec2;
    switch (pathway.direction) {
      case "forward":
        flowDirection = geom.direction;
        break;
      case "backward":
        flowDirection = scaleVec2(geom.direction, -1);
        break;
      case "bidirectional":
        // Pull toward center of pathway
        if (t < 0.5) {
          flowDirection = geom.direction;
        } else {
          flowDirection = scaleVec2(geom.direction, -1);
        }
        break;
    }

    // Attraction toward the line
    const toLine = subVec2(closest, pos);
    const toLineNorm = lenVec2(toLine) > 0 ? normalizeVec2(toLine) : vec2(0, 0);

    // Combined force: attraction toward line + flow along direction
    const attractForce = scaleVec2(toLineNorm, strength * config.attractionWeight);
    const flowForce = scaleVec2(flowDirection, strength * config.directionWeight);

    totalForce = addVec2(totalForce, addVec2(attractForce, flowForce));
  }

  return totalForce;
}

/**
 * Sample the force field on a grid for debug visualization.
 * Returns array of { pos, force } for rendering.
 */
export function sampleForceFieldGrid(
  world: World,
  forceField: ForceField,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  gridSpacing: number
): Array<{ pos: Vec2; force: Vec2 }> {
  const samples: Array<{ pos: Vec2; force: Vec2 }> = [];

  for (let x = bounds.minX; x <= bounds.maxX; x += gridSpacing) {
    for (let y = bounds.minY; y <= bounds.maxY; y += gridSpacing) {
      const pos = vec2(x, y);
      const force = forceField(pos, world);
      samples.push({ pos, force });
    }
  }

  return samples;
}
