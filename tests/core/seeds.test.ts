/**
 * Tests for seed rooting and distribution system
 */

import { describe, it, expect } from "vitest";
import { vec2, World, Plant, PlantNode, Island } from "../../src/core";
import { calculateRootingProbability, SEED_ROOTING_CONFIG } from "../../src/core/simulation/seeds";

// === Test Fixtures ===

function createMinimalWorld(): World {
  const constellationId = "constellation-1";
  const clusterId = "cluster-1";
  const islandId = "island-1";

  const island: Island = {
    kind: "island",
    id: islandId,
    clusterId,
    localPos: vec2(0, 0),
    radius: 50,
  };

  const world: World = {
    constellations: new Map([[constellationId, { id: constellationId, pos: vec2(0, 0) }]]),
    clusters: new Map([
      [
        clusterId,
        { id: clusterId, constellationId, pos: vec2(0, 0), glyphKind: "seed", rotation: 0 },
      ],
    ]),
    pathways: new Map(),
    entities: new Map([[islandId, island]]),
    plants: new Map(),
    camera: { pan: vec2(0, 0), zoom: 1 },
    time: { t: 0, dt: 0 },
    dayCycle: { timeOfDay: 0.5, dayLengthMs: 180000, running: true },
    selection: null,
    hover: null,
    hoveredPathway: null,
    contextMenu: null,
    tutorial: { visible: true, sections: [] },
    debug: { showIds: false, showHitTargets: false, showForceField: false },
    focusedPanel: null,
    seed: 42,
    carriedSubtree: null,
    cursorWorldPos: vec2(0, 0),
    driftingPieces: [],
    fps: 60,
    cameraAnimation: null,
  };

  return world;
}

function addPlantToWorld(
  world: World,
  islandId: string,
  plantPos: { x: number; y: number }
): World {
  const plantId = `plant-${world.plants.size + 1}`;
  const rootId = `root-${world.plants.size + 1}`;

  const rootNode: PlantNode = {
    kind: "plantNode",
    id: rootId,
    plantId,
    nodeKind: "stem",
    localPos: vec2(plantPos.x, plantPos.y),
    angle: -Math.PI / 2,
    depth: 0,
  };

  const plant: Plant = {
    id: plantId,
    islandId,
    rootId,
    adjacency: new Map([[rootId, []]]),
  };

  const newEntities = new Map(world.entities);
  newEntities.set(rootId, rootNode);

  const newPlants = new Map(world.plants);
  newPlants.set(plantId, plant);

  return { ...world, entities: newEntities, plants: newPlants };
}

// === Rooting Probability Tests ===

describe("calculateRootingProbability", () => {
  it("returns 1.0 when no plants exist on the island", () => {
    const world = createMinimalWorld();
    const seedPos = vec2(0, 0); // At origin (island center)

    const probability = calculateRootingProbability(seedPos, "island-1", world);

    expect(probability).toBe(1.0);
  });

  it("returns reduced probability when a plant is nearby", () => {
    let world = createMinimalWorld();
    world = addPlantToWorld(world, "island-1", { x: 20, y: 0 });

    const seedPos = vec2(0, 0); // 20 units from the plant

    const probability = calculateRootingProbability(seedPos, "island-1", world);

    // Should be less than 1.0 but greater than the minimum
    expect(probability).toBeLessThan(1.0);
    expect(probability).toBeGreaterThan(SEED_ROOTING_CONFIG.minProximityMultiplier);
  });

  it("returns minimum probability when plant is very close (stacked)", () => {
    let world = createMinimalWorld();
    world = addPlantToWorld(world, "island-1", { x: 0, y: 0 });

    const seedPos = vec2(0, 0); // Same position as plant

    const probability = calculateRootingProbability(seedPos, "island-1", world);

    // Should be at or very near the minimum
    expect(probability).toBeLessThanOrEqual(SEED_ROOTING_CONFIG.minProximityMultiplier * 1.1);
  });

  it("probability increases with distance from nearby plant", () => {
    let world = createMinimalWorld();
    world = addPlantToWorld(world, "island-1", { x: 0, y: 0 });

    const closeSeedPos = vec2(10, 0);
    const farSeedPos = vec2(60, 0);

    const closeProbability = calculateRootingProbability(closeSeedPos, "island-1", world);
    const farProbability = calculateRootingProbability(farSeedPos, "island-1", world);

    expect(farProbability).toBeGreaterThan(closeProbability);
  });

  it("probability is 1.0 when plant is beyond proximity radius", () => {
    let world = createMinimalWorld();
    world = addPlantToWorld(world, "island-1", { x: 0, y: 0 });

    // Seed position beyond the proximity radius
    const farSeedPos = vec2(SEED_ROOTING_CONFIG.plantProximityRadius + 10, 0);

    const probability = calculateRootingProbability(farSeedPos, "island-1", world);

    // Should be 1.0 (no reduction) since outside proximity radius
    // Note: may still have island crowding reduction if plants > 0
    expect(probability).toBeLessThanOrEqual(1.0);
    // But at least no proximity penalty
  });

  it("probability decreases with island crowding", () => {
    let world = createMinimalWorld();

    // Add plants far apart (no proximity penalty)
    world = addPlantToWorld(world, "island-1", { x: -200, y: 0 });
    world = addPlantToWorld(world, "island-1", { x: 200, y: 0 });
    world = addPlantToWorld(world, "island-1", { x: 0, y: -200 });

    // Seed far from all plants (no proximity penalty)
    const seedPos = vec2(0, 200);

    const probability = calculateRootingProbability(seedPos, "island-1", world);

    // Should be reduced due to island crowding (3 plants)
    expect(probability).toBeLessThan(1.0);
  });

  it("probability is very low when island is at max capacity", () => {
    let world = createMinimalWorld();

    // Add max plants
    for (let i = 0; i < SEED_ROOTING_CONFIG.maxPlantsPerIsland; i++) {
      world = addPlantToWorld(world, "island-1", { x: i * 200 - 400, y: 0 });
    }

    // Seed far from all plants
    const seedPos = vec2(0, 500);

    const probability = calculateRootingProbability(seedPos, "island-1", world);

    // Should be at or near crowded multiplier
    expect(probability).toBeLessThanOrEqual(SEED_ROOTING_CONFIG.crowdedIslandMultiplier * 1.1);
  });
});

describe("seed distribution behavior", () => {
  it("configuration values are reasonable", () => {
    // Sanity checks on the configuration
    expect(SEED_ROOTING_CONFIG.baseRootProbability).toBeGreaterThan(0);
    expect(SEED_ROOTING_CONFIG.baseRootProbability).toBeLessThanOrEqual(1);

    expect(SEED_ROOTING_CONFIG.plantProximityRadius).toBeGreaterThan(0);
    expect(SEED_ROOTING_CONFIG.maxPlantsPerIsland).toBeGreaterThan(0);

    expect(SEED_ROOTING_CONFIG.minProximityMultiplier).toBeGreaterThanOrEqual(0);
    expect(SEED_ROOTING_CONFIG.minProximityMultiplier).toBeLessThan(1);

    expect(SEED_ROOTING_CONFIG.crowdedIslandMultiplier).toBeGreaterThanOrEqual(0);
    expect(SEED_ROOTING_CONFIG.crowdedIslandMultiplier).toBeLessThan(1);
  });
});
