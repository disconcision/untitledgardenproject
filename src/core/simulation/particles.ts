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
      updated = tickSeedFast(particle, dt, landingSpots);
    } else {
      updated = tickFireflyFast(particle, dt, isNight, isDusk, glowingEntities, landingSpots);
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
 * Fast tick for seed particles — smooth floating movement with wind.
 */
function tickSeedFast(
  particle: Particle,
  dt: number,
  landingSpots: LandingSpot[]
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

  // Smooth velocity interpolation
  const targetVelX = windX + brownianX;
  const targetVelY = windY + brownianY + gravity;
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

  // Check for landing
  for (const spot of landingSpots) {
    const dx = newPos.x - spot.pos.x;
    const dy = newPos.y - spot.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const landingRadius = spot.kind === "rock" ? 30 : 45;

    if (distance < landingRadius && Math.random() < 0.0002) {
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
  landingSpots: LandingSpot[]
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
    if (particle.particleKind === "seed" && particle.state === "landed") {
      if (particle.age > 500 && Math.random() < 0.02) {
        const landedEntity = particle.landedOn ? world.entities.get(particle.landedOn) : null;

        if (landedEntity && (landedEntity.kind === "rock" || landedEntity.kind === "island")) {
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

