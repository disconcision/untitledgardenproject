/**
 * Particle Simulation — Seeds and Fireflies
 *
 * Handles movement, lifecycle, and spawning for particle entities.
 * Separated into fast tick (50ms for smooth movement) and slow tick (1s for lifecycle).
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

// === Types ===

/** Position with glow intensity for firefly attraction */
export type GlowingEntity = {
  id: Id;
  pos: Vec2;
  glow: number;
};

/** Potential landing position for particles */
export type LandingSpot = {
  id: Id;
  pos: Vec2;
  kind: "rock" | "island";
};

// === Force Field Configuration ===

// Create the pathway force field (applied to particles)
const pathwayForce = createPathwayForce({
  maxDistance: 400, // Range of pathway influence
  baseStrength: 20, // Base force strength
  attractionWeight: 0.2, // Pull toward pathway line
  directionWeight: 0.8, // Push along pathway direction
});

// Force multipliers for different particle types
const SEED_FORCE_MULTIPLIER = 1.0; // Seeds are strongly affected
const FIREFLY_FORCE_MULTIPLIER = 0.3; // Fireflies are weakly affected

// === Fast Tick (50ms) — Smooth Movement ===

/**
 * Update all particles with smooth movement.
 * Called at 20fps (50ms interval) for visual smoothness.
 */
export function tickParticlesFast(world: World, dtMs: number): World {
  const newEntities = new Map(world.entities);
  let entitiesChanged = false;

  const dt = dtMs / 1000;
  const timeOfDay = world.dayCycle.timeOfDay;
  const isNight = timeOfDay < 0.25 || timeOfDay > 0.75;
  const isDusk = timeOfDay > 0.7 && timeOfDay < 0.8;

  const glowingEntities = findGlowingEntities(world);
  const landingSpots = findLandingSpots(world);

  for (const [id, entity] of newEntities) {
    if (entity.kind !== "particle") continue;

    const particle = entity as Particle;
    let updated: Particle;

    if (particle.particleKind === "seed") {
      updated = tickSeedFast(particle, dt, landingSpots, world);
    } else {
      updated = tickFireflyFast(
        particle,
        dt,
        isNight,
        isDusk,
        glowingEntities,
        landingSpots,
        world
      );
    }

    if (updated !== particle) {
      newEntities.set(id, updated);
      entitiesChanged = true;
    }
  }

  if (!entitiesChanged) return world;
  return { ...world, entities: newEntities };
}

/**
 * Fast tick for seed particles — smooth floating movement with wind and pathway forces.
 */
function tickSeedFast(
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

    // Increased probability from 0.0002 to 0.02 (1 in 50 per tick)
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

/**
 * Fast tick for firefly particles — smooth flying and glowing.
 */
function tickFireflyFast(
  particle: Particle,
  dt: number,
  isNight: boolean,
  isDusk: boolean,
  glowingEntities: GlowingEntity[],
  landingSpots: LandingSpot[],
  world: World
): Particle {
  const updated = { ...particle, age: particle.age + 1 };

  // Update glow (pulsing at night)
  const time = particle.age * 0.05;
  let targetGlow = 0;
  if (isNight && particle.state === "floating") {
    targetGlow = 0.7 + Math.sin(time * 2.5) * 0.3;
  } else if (isDusk && particle.state === "floating") {
    targetGlow = 0.3 + Math.sin(time * 2) * 0.2;
  }
  const newGlow = particle.glow + (targetGlow - particle.glow) * 0.1;

  if (particle.state === "landed") {
    // Take off at night/dusk
    if ((isNight || isDusk) && Math.random() < 0.002) {
      return {
        ...updated,
        state: "floating",
        velocity: vec2((Math.random() - 0.5) * 5, -Math.random() * 3),
        glow: 0.3,
        rotation: Math.random() * Math.PI * 2,
        angularVelocity: 0,
      };
    }
    return { ...updated, glow: newGlow };
  }

  if (particle.state === "floating") {
    // During day, try to land
    if (!isNight && !isDusk) {
      for (const spot of landingSpots) {
        const dx = particle.pos.x - spot.pos.x;
        const dy = particle.pos.y - spot.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 80 && Math.random() < 0.02) {
          return {
            ...updated,
            state: "landed",
            pos: spot.pos,
            velocity: vec2(0, 0),
            landedOn: spot.id,
            glow: 0,
            rotation: 0,
            angularVelocity: 0,
          };
        }
      }
    }

    // Movement — attracted to glowing things at night
    let targetX = 0;
    let targetY = 0;

    if (isNight && glowingEntities.length > 0) {
      const nearest = findNearestGlow(particle.pos, glowingEntities, 200);
      if (nearest && nearest.distance > 30) {
        // Orbit around the glow
        const dx = nearest.entity.pos.x - particle.pos.x;
        const dy = nearest.entity.pos.y - particle.pos.y;
        const dist = nearest.distance;
        const orbitSpeed = 20;
        targetX = (dy / dist) * orbitSpeed + (dx / dist) * 3;
        targetY = (-dx / dist) * orbitSpeed + (dy / dist) * 3;
      }
    }

    // Random wandering
    const wanderPhase = particle.pos.x * 0.02 + particle.pos.y * 0.02;
    targetX += Math.sin(time * 3 + wanderPhase) * 8;
    targetY += Math.cos(time * 2.5 + wanderPhase) * 6;

    // Pathway force field contribution (weaker for fireflies)
    const pathwayContribution = pathwayForce(particle.pos, world);
    targetX += pathwayContribution.x * FIREFLY_FORCE_MULTIPLIER;
    targetY += pathwayContribution.y * FIREFLY_FORCE_MULTIPLIER;

    // Smooth velocity update
    const velLerp = 0.05;
    const newVelX = particle.velocity.x + (targetX - particle.velocity.x) * velLerp;
    const newVelY = particle.velocity.y + (targetY - particle.velocity.y) * velLerp;

    const speed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
    const maxSpeed = 25;
    const cappedVelX = speed > maxSpeed ? (newVelX / speed) * maxSpeed : newVelX;
    const cappedVelY = speed > maxSpeed ? (newVelY / speed) * maxSpeed : newVelY;

    const newPos = vec2(particle.pos.x + cappedVelX * dt, particle.pos.y + cappedVelY * dt);

    return {
      ...updated,
      pos: newPos,
      velocity: vec2(cappedVelX, cappedVelY),
      glow: newGlow,
    };
  }

  return { ...updated, glow: newGlow };
}

// === Slow Tick (1s) — Lifecycle ===

// === Seed Rooting Configuration ===
// Controls how seeds avoid clustering with existing plants

const SEED_ROOTING_CONFIG = {
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

/**
 * Calculate the probability of a seed rooting based on nearby plant density.
 * Returns a multiplier (0-1) to apply to the base rooting probability.
 */
function calculateRootingProbability(seedPos: Vec2, islandId: Id, world: World): number {
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
 * Handle particle lifecycle: rooting, cleanup, spawning.
 * Called at 1fps (1s interval) for game logic.
 */
export function tickParticleLifecycle(world: World): World {
  const newEntities = new Map(world.entities);
  let entitiesChanged = false;
  const particlesToRemove: Id[] = [];
  const plantsToAdd: { nodes: PlantNode[]; plant: Plant }[] = [];

  for (const [id, entity] of newEntities) {
    if (entity.kind !== "particle") continue;

    const particle = entity as Particle;

    // Age out old particles
    if (particle.age > 3000) {
      particlesToRemove.push(id);
      continue;
    }

    // Seeds can take root when landed
    if (particle.particleKind === "seed" && particle.state === "landed" && particle.age > 50) {
      const landedEntity = particle.landedOn ? world.entities.get(particle.landedOn) : null;

      if (landedEntity && (landedEntity.kind === "rock" || landedEntity.kind === "island")) {
        // Determine the island ID
        const islandId =
          landedEntity.kind === "island" ? landedEntity.id : (landedEntity as Rock).islandId;

        // Calculate proximity-adjusted rooting probability
        const rootingMultiplier = calculateRootingProbability(particle.pos, islandId, world);
        const rootingChance = SEED_ROOTING_CONFIG.baseRootProbability * rootingMultiplier;

        if (Math.random() < rootingChance) {
          const newPlant = createPlantFromSeed(particle, landedEntity as Rock | Island, world);
          if (newPlant) {
            plantsToAdd.push(newPlant);
            particlesToRemove.push(id);
          }
        }
      }
    }
  }

  for (const id of particlesToRemove) {
    newEntities.delete(id);
    entitiesChanged = true;
  }

  if (!entitiesChanged && plantsToAdd.length === 0) {
    return world;
  }

  let result = { ...world, entities: newEntities };

  if (plantsToAdd.length > 0) {
    const newPlants = new Map(world.plants);
    for (const { nodes, plant } of plantsToAdd) {
      for (const node of nodes) {
        newEntities.set(node.id, node);
      }
      newPlants.set(plant.id, plant);
    }
    result = { ...result, entities: newEntities, plants: newPlants };
  }

  return result;
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

/**
 * Spawn fireflies at dusk/night.
 */
export function tickFireflySpawning(world: World): World {
  const timeOfDay = world.dayCycle.timeOfDay;
  const isDuskOrNight = timeOfDay > 0.7 || timeOfDay < 0.1;

  if (!isDuskOrNight) return world;

  let fireflyCount = 0;
  for (const entity of world.entities.values()) {
    if (entity.kind === "particle" && entity.particleKind === "firefly") {
      fireflyCount++;
    }
  }

  if (fireflyCount >= 20) return world;
  if (Math.random() > 0.15) return world;

  const spawnCandidates: Vec2[] = [];

  for (const entity of world.entities.values()) {
    if (entity.kind === "rock") {
      const rockWorldPos = getRockWorldPos(entity as Rock, world);
      if (rockWorldPos) spawnCandidates.push(rockWorldPos);
    }
  }

  if (spawnCandidates.length === 0) return world;

  const spawnPos = spawnCandidates[Math.floor(Math.random() * spawnCandidates.length)];

  const firefly: Particle = {
    kind: "particle",
    id: genId("particle"),
    particleKind: "firefly",
    state: "floating",
    pos: addVec2(spawnPos, vec2((Math.random() - 0.5) * 30, -10 - Math.random() * 20)),
    velocity: vec2((Math.random() - 0.5) * 5, -Math.random() * 3),
    rotation: 0,
    angularVelocity: 0,
    glow: 0.5,
    age: 0,
  };

  const newEntities = new Map(world.entities);
  newEntities.set(firefly.id, firefly);
  return { ...world, entities: newEntities };
}

// === Helper Functions ===

function findGlowingEntities(world: World): GlowingEntity[] {
  const glowing: GlowingEntity[] = [];

  for (const entity of world.entities.values()) {
    if (entity.kind === "plantNode" && entity.nodeKind === "flower") {
      const pos = getPlantNodeWorldPos(entity, world);
      if (pos) glowing.push({ id: entity.id, pos, glow: 0.8 });
    }
    if (entity.kind === "plantNode" && entity.nodeKind === "bud" && (entity.charge ?? 0) > 0.7) {
      const pos = getPlantNodeWorldPos(entity, world);
      if (pos) glowing.push({ id: entity.id, pos, glow: (entity.charge ?? 0) * 0.5 });
    }
  }

  return glowing;
}

function findLandingSpots(world: World): LandingSpot[] {
  const spots: LandingSpot[] = [];

  for (const entity of world.entities.values()) {
    if (entity.kind === "rock") {
      const pos = getRockWorldPos(entity, world);
      if (pos) spots.push({ id: entity.id, pos, kind: "rock" });
    }
    if (entity.kind === "island") {
      const cluster = world.clusters.get(entity.clusterId);
      if (cluster) {
        spots.push({
          id: entity.id,
          pos: addVec2(cluster.pos, entity.localPos),
          kind: "island",
        });
      }
    }
  }

  return spots;
}

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

function getRockWorldPos(rock: Rock, world: World): Vec2 | null {
  const island = world.entities.get(rock.islandId) as Island | undefined;
  if (!island) return null;

  const cluster = world.clusters.get(island.clusterId);
  if (!cluster) return null;

  const islandWorldPos = addVec2(cluster.pos, island.localPos);
  return addVec2(islandWorldPos, rock.localPos);
}

function findNearestGlow(
  pos: Vec2,
  glowing: GlowingEntity[],
  maxDistance: number
): { entity: GlowingEntity; distance: number } | null {
  let nearest: { entity: GlowingEntity; distance: number } | null = null;

  for (const entity of glowing) {
    const dx = pos.x - entity.pos.x;
    const dy = pos.y - entity.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < maxDistance && (!nearest || distance < nearest.distance)) {
      nearest = { entity, distance };
    }
  }

  return nearest;
}

function createPlantFromSeed(
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
