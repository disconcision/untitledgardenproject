/**
 * Seed Particle Simulation
 *
 * Handles seed movement, landing, and rooting into new plants.
 * Seeds spawn from flowers and travel via pathway force fields.
 */

import {
  World,
  Id,
  Vec2,
  vec2,
  addVec2,
  subVec2,
  scaleVec2,
  genId,
  Particle,
  PlantNode,
  Plant,
  Island,
  Rock,
} from "../model";
import { createPathwayForce } from "../forces";
import { LandingSpot } from "./particles";

// === Force Field Configuration ===

// Create the pathway force field (applied to seeds)
const pathwayForce = createPathwayForce({
  maxDistance: 400, // Range of pathway influence
  baseStrength: 20, // Base force strength
  attractionWeight: 0.2, // Pull toward pathway line
  directionWeight: 0.8, // Push along pathway direction
});

// Force multiplier for seeds (strongly affected by pathways)
const SEED_FORCE_MULTIPLIER = 1.0;

// === Seed Rooting Configuration ===
// Controls how seeds avoid clustering with existing plants

export const SEED_ROOTING_CONFIG = {
  /** Base probability of rooting per tick (when no plants nearby) */
  baseRootProbability: 0.05,
  /** Distance within which nearby plants reduce rooting probability */
  plantProximityRadius: 80,
  /** Probability multiplier when a plant is at distance 0 (stacked) */
  minProximityMultiplier: 0.02,
  /** Maximum plants on same island before rooting becomes very unlikely */
  maxPlantsPerIsland: 4,
  /** Probability multiplier when island has maxPlantsPerIsland */
  crowdedIslandMultiplier: 0.1,
};

// === Fast Tick — Smooth Seed Movement ===

/**
 * Fast tick for seed particles — smooth floating movement with wind and pathway forces.
 */
export function tickSeedFast(
  particle: Particle,
  dt: number,
  landingSpots: LandingSpot[],
  world: World
): Particle {
  const updated = { ...particle, age: particle.age + 1 };

  if (particle.state !== "floating") {
    return updated;
  }

  // Continuous wind (smooth sinusoidal)
  const time = particle.age * 0.05;
  const windX = Math.sin(time * 0.7) * 25 + Math.sin(time * 1.3) * 12;
  const windY = Math.cos(time * 0.5) * 8 + Math.sin(time * 0.9) * 5;

  // Brownian noise
  const noisePhase = particle.pos.x * 0.01 + particle.pos.y * 0.01;
  const brownianX = Math.sin(time * 3 + noisePhase) * 6;
  const brownianY = Math.cos(time * 2.7 + noisePhase * 1.3) * 4;

  const gravity = 0.3;

  // Pathway force field contribution
  const pathwayContribution = pathwayForce(particle.pos, world);
  const forceX = pathwayContribution.x * SEED_FORCE_MULTIPLIER;
  const forceY = pathwayContribution.y * SEED_FORCE_MULTIPLIER;

  // Smooth velocity interpolation
  const targetVelX = windX + brownianX + forceX;
  const targetVelY = windY + brownianY + gravity + forceY;
  const velLerp = 0.02;
  const newVelX = particle.velocity.x + (targetVelX - particle.velocity.x) * velLerp;
  const newVelY = particle.velocity.y + (targetVelY - particle.velocity.y) * velLerp;

  // Cap speed
  const speed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
  const maxSpeed = 35;
  const cappedVelX = speed > maxSpeed ? (newVelX / speed) * maxSpeed : newVelX;
  const cappedVelY = speed > maxSpeed ? (newVelY / speed) * maxSpeed : newVelY;

  const newPos = vec2(particle.pos.x + cappedVelX * dt, particle.pos.y + cappedVelY * dt);

  // Rotation follows velocity direction
  const targetRotation = Math.atan2(cappedVelY, cappedVelX) + Math.PI / 2;
  const rotLerp = 0.08;
  let rotDiff = targetRotation - particle.rotation;
  while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
  while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
  const newRotation = particle.rotation + rotDiff * rotLerp;

  const wobble = Math.sin(time * 4 + noisePhase * 2) * 0.02;
  const newAngularVel = particle.angularVelocity * 0.95 + wobble;

  // Check for landing - seeds should land within a few seconds of being near a surface
  for (const spot of landingSpots) {
    const dx = newPos.x - spot.pos.x;
    const dy = newPos.y - spot.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const landingRadius = spot.kind === "rock" ? 30 : 45;

    // Probability of 0.02 (1 in 50 per tick)
    if (distance < landingRadius && Math.random() < 0.02) {
      return {
        ...updated,
        state: "landed",
        pos: spot.pos,
        velocity: vec2(0, 0),
        landedOn: spot.id,
        rotation: newRotation,
        angularVelocity: 0,
      };
    }
  }

  return {
    ...updated,
    pos: newPos,
    velocity: vec2(cappedVelX, cappedVelY),
    rotation: newRotation,
    angularVelocity: newAngularVel,
  };
}

// === Seed Lifecycle ===

/**
 * Calculate the probability of a seed rooting based on nearby plant density.
 * Returns a multiplier (0-1) to apply to the base rooting probability.
 */
export function calculateRootingProbability(seedPos: Vec2, islandId: Id, world: World): number {
  const config = SEED_ROOTING_CONFIG;
  let multiplier = 1.0;

  // Count plants on this island and find nearest plant distance
  let plantsOnIsland = 0;
  let nearestPlantDistSq = Infinity;

  for (const plant of world.plants.values()) {
    if (plant.islandId !== islandId) continue;
    plantsOnIsland++;

    // Get root node position
    const rootNode = world.entities.get(plant.rootId) as PlantNode | undefined;
    if (!rootNode) continue;

    // Get island world position
    const island = world.entities.get(islandId) as Island | undefined;
    if (!island) continue;
    const cluster = world.clusters.get(island.clusterId);
    if (!cluster) continue;

    const plantWorldPos = addVec2(addVec2(cluster.pos, island.localPos), rootNode.localPos);
    const dx = seedPos.x - plantWorldPos.x;
    const dy = seedPos.y - plantWorldPos.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < nearestPlantDistSq) {
      nearestPlantDistSq = distSq;
    }
  }

  // Reduce probability based on nearest plant distance
  const nearestDist = Math.sqrt(nearestPlantDistSq);
  if (nearestDist < config.plantProximityRadius) {
    // Linear interpolation from minProximityMultiplier (at 0) to 1.0 (at radius)
    const proximityFactor = nearestDist / config.plantProximityRadius;
    const proximityMultiplier =
      config.minProximityMultiplier + (1 - config.minProximityMultiplier) * proximityFactor;
    multiplier *= proximityMultiplier;
  }

  // Reduce probability based on island crowding
  if (plantsOnIsland >= config.maxPlantsPerIsland) {
    multiplier *= config.crowdedIslandMultiplier;
  } else if (plantsOnIsland > 0) {
    // Gradual reduction as island fills up
    const crowdingFactor = plantsOnIsland / config.maxPlantsPerIsland;
    const crowdingMultiplier = 1 - crowdingFactor * (1 - config.crowdedIslandMultiplier);
    multiplier *= crowdingMultiplier;
  }

  return multiplier;
}

/**
 * Create a new plant from a rooted seed.
 */
export function createPlantFromSeed(
  particle: Particle,
  landedOn: Rock | Island,
  world: World
): { nodes: PlantNode[]; plant: Plant } | null {
  let islandId: Id;
  let localPos: Vec2;

  if (landedOn.kind === "rock") {
    islandId = landedOn.islandId;
    const island = world.entities.get(islandId) as Island | undefined;
    if (!island) return null;
    const cluster = world.clusters.get(island.clusterId);
    if (!cluster) return null;
    const islandWorldPos = addVec2(cluster.pos, island.localPos);
    localPos = subVec2(particle.pos, islandWorldPos);
  } else {
    islandId = landedOn.id;
    const cluster = world.clusters.get(landedOn.clusterId);
    if (!cluster) return null;
    const islandWorldPos = addVec2(cluster.pos, landedOn.localPos);
    localPos = subVec2(particle.pos, islandWorldPos);
  }

  const plantId = genId("plant");
  const rootId = genId("node");
  const budId = genId("node");
  const growAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;

  const rootNode: PlantNode = {
    kind: "plantNode",
    id: rootId,
    plantId,
    nodeKind: "stem",
    localPos,
    angle: growAngle,
    depth: 0,
  };

  const budNode: PlantNode = {
    kind: "plantNode",
    id: budId,
    plantId,
    nodeKind: "bud",
    localPos: addVec2(localPos, scaleVec2(vec2(Math.cos(growAngle), Math.sin(growAngle)), 15)),
    angle: growAngle,
    charge: 0.3,
    depth: 1,
  };

  const adjacency = new Map<Id, Id[]>();
  adjacency.set(rootId, [budId]);
  adjacency.set(budId, []);

  return {
    nodes: [rootNode, budNode],
    plant: {
      id: plantId,
      islandId,
      rootId,
      adjacency,
    },
  };
}

/**
 * Spawn seeds from flowering plants.
 */
export function tickFlowerSeeds(world: World): World {
  const newEntities = new Map(world.entities);
  let changed = false;

  // Count existing seeds
  let seedCount = 0;
  for (const entity of world.entities.values()) {
    if (entity.kind === "particle" && entity.particleKind === "seed") {
      seedCount++;
    }
  }

  if (seedCount >= 20) return world;

  for (const entity of world.entities.values()) {
    if (entity.kind !== "plantNode" || entity.nodeKind !== "flower") continue;
    if (Math.random() > 0.01) continue;

    const flowerWorldPos = getPlantNodeWorldPos(entity as PlantNode, world);
    if (!flowerWorldPos) continue;

    const seed: Particle = {
      kind: "particle",
      id: genId("particle"),
      particleKind: "seed",
      state: "floating",
      pos: flowerWorldPos,
      velocity: vec2((Math.random() - 0.5) * 8, -Math.random() * 5 - 2),
      rotation: Math.random() * Math.PI * 2,
      angularVelocity: (Math.random() - 0.5) * 0.1,
      sourceId: entity.id,
      glow: 0,
      age: 0,
    };

    newEntities.set(seed.id, seed);
    changed = true;
  }

  if (!changed) return world;
  return { ...world, entities: newEntities };
}

// === Helper Functions ===

function getPlantNodeWorldPos(node: PlantNode, world: World): Vec2 | null {
  const plant = world.plants.get(node.plantId);
  if (!plant) return null;

  const island = world.entities.get(plant.islandId) as Island | undefined;
  if (!island) return null;

  const cluster = world.clusters.get(island.clusterId);
  if (!cluster) return null;

  const islandWorldPos = addVec2(cluster.pos, island.localPos);
  return addVec2(islandWorldPos, node.localPos);
}

