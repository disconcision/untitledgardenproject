/**
 * Particle Simulation — Seeds and Fireflies
 *
 * Central orchestrator for particle movement, lifecycle, and spawning.
 * Delegates to seeds.ts and fireflies.ts for type-specific logic.
 */

import { World, Id, Vec2, addVec2, Particle, PlantNode, Plant, Island, Rock } from "../model";
import {
  tickSeedFast,
  tickFlowerSeeds,
  calculateRootingProbability,
  createPlantFromSeed,
  SEED_ROOTING_CONFIG,
} from "./seeds";
import { tickFireflyFast, tickFireflySpawning } from "./fireflies";

// === Shared Types ===

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

// === Re-exports ===

export { tickFlowerSeeds, tickFireflySpawning };

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
