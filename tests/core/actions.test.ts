/**
 * Tests for plant actions — sprout, prune, branch
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createInitialWorld,
  genId,
  resetIdCounter,
  PlantNode,
  Plant,
  Id,
  vec2,
  Island,
  World,
} from "../../src/core";
import { sproutBud, pruneNode, branchFromNode } from "../../src/core/actions";

// === Test Fixtures ===

/**
 * Create a minimal test world with a single plant.
 * Plant structure: root(stem) -> bud
 */
function createTestWorld(): World {
  resetIdCounter(0);
  const world = createInitialWorld(42);

  // Create a minimal island
  const islandId = genId("island");
  const island: Island = {
    kind: "island",
    id: islandId,
    clusterId: "test-cluster",
    localPos: vec2(0, 0),
    shape: [vec2(-50, -50), vec2(50, -50), vec2(50, 50), vec2(-50, 50)],
  };

  // Create a simple plant
  const plantId = genId("plant");
  const rootId = genId("node");
  const budId = genId("node");

  const root: PlantNode = {
    kind: "plantNode",
    id: rootId,
    plantId,
    nodeKind: "stem",
    localPos: vec2(0, 0),
    angle: -Math.PI / 2, // Pointing up
    depth: 0,
  };

  const bud: PlantNode = {
    kind: "plantNode",
    id: budId,
    plantId,
    nodeKind: "bud",
    localPos: vec2(0, -20),
    angle: -Math.PI / 2,
    charge: 1.0, // Fully charged
    depth: 1,
  };

  const adjacency = new Map<Id, Id[]>();
  adjacency.set(rootId, [budId]);
  adjacency.set(budId, []);

  const plant: Plant = {
    id: plantId,
    islandId,
    rootId,
    adjacency,
  };

  const entities = new Map(world.entities);
  entities.set(islandId, island);
  entities.set(rootId, root);
  entities.set(budId, bud);

  const plants = new Map(world.plants);
  plants.set(plantId, plant);

  return {
    ...world,
    entities,
    plants,
  };
}

// === Sprout Tests ===

describe("sproutBud", () => {
  let world: World;
  let budId: Id;

  beforeEach(() => {
    world = createTestWorld();
    // Find the bud in our test plant
    for (const [id, entity] of world.entities) {
      if (entity.kind === "plantNode" && entity.nodeKind === "bud") {
        budId = id;
        break;
      }
    }
  });

  it("converts a bud to a stem", () => {
    const result = sproutBud(world, budId);
    expect(result).not.toBeNull();

    const sprouted = result!.entities.get(budId) as PlantNode;
    expect(sprouted.nodeKind).toBe("stem");
  });

  it("creates at least one new bud", () => {
    const result = sproutBud(world, budId);
    expect(result).not.toBeNull();

    const buds = Array.from(result!.entities.values()).filter(
      (e): e is PlantNode => e.kind === "plantNode" && e.nodeKind === "bud"
    );
    expect(buds.length).toBeGreaterThanOrEqual(1);
  });

  it("updates plant adjacency", () => {
    const result = sproutBud(world, budId);
    expect(result).not.toBeNull();

    // Find the plant
    const plant = Array.from(result!.plants.values())[0];
    expect(plant.adjacency.get(budId)!.length).toBeGreaterThan(0);
  });

  it("returns null for non-existent id", () => {
    const result = sproutBud(world, "fake-id");
    expect(result).toBeNull();
  });

  it("returns null for non-bud nodes", () => {
    // Find the stem (root)
    let stemId: Id = "";
    for (const [id, entity] of world.entities) {
      if (entity.kind === "plantNode" && entity.nodeKind === "stem") {
        stemId = id;
        break;
      }
    }

    const result = sproutBud(world, stemId);
    expect(result).toBeNull();
  });
});

// === Prune Tests ===

describe("pruneNode", () => {
  let world: World;
  let budId: Id;
  let rootId: Id;

  beforeEach(() => {
    world = createTestWorld();
    for (const [id, entity] of world.entities) {
      if (entity.kind === "plantNode") {
        if (entity.nodeKind === "bud") budId = id;
        if (entity.depth === 0) rootId = id;
      }
    }
  });

  it("removes the node from entities", () => {
    const result = pruneNode(world, budId);
    expect(result).not.toBeNull();
    expect(result!.entities.has(budId)).toBe(false);
  });

  it("updates parent adjacency", () => {
    const result = pruneNode(world, budId);
    expect(result).not.toBeNull();

    const plant = Array.from(result!.plants.values())[0];
    const parentChildren = plant.adjacency.get(rootId);
    expect(parentChildren).toBeDefined();
    expect(parentChildren!.includes(budId)).toBe(false);
  });

  it("returns null for root node", () => {
    const result = pruneNode(world, rootId);
    expect(result).toBeNull();
  });

  it("returns null for non-existent id", () => {
    const result = pruneNode(world, "fake-id");
    expect(result).toBeNull();
  });

  it("removes descendants when pruning", () => {
    // First sprout to create descendants
    const sproutResult = sproutBud(world, budId);
    expect(sproutResult).not.toBeNull();

    // Now the original budId is a stem with children
    const result = pruneNode(sproutResult!, budId);
    expect(result).not.toBeNull();

    // All descendants should be removed
    expect(result!.entities.has(budId)).toBe(false);
  });
});

// === Branch Tests ===

describe("branchFromNode", () => {
  let world: World;
  let stemId: Id;

  beforeEach(() => {
    world = createTestWorld();
    for (const [id, entity] of world.entities) {
      if (entity.kind === "plantNode" && entity.nodeKind === "stem") {
        stemId = id;
        break;
      }
    }
  });

  it("creates a new bud from a stem", () => {
    const initialBudCount = Array.from(world.entities.values()).filter(
      (e): e is PlantNode => e.kind === "plantNode" && e.nodeKind === "bud"
    ).length;

    const result = branchFromNode(world, stemId);
    expect(result).not.toBeNull();

    const newBudCount = Array.from(result!.entities.values()).filter(
      (e): e is PlantNode => e.kind === "plantNode" && e.nodeKind === "bud"
    ).length;

    expect(newBudCount).toBe(initialBudCount + 1);
  });

  it("updates adjacency with new child", () => {
    const plant = Array.from(world.plants.values())[0];
    const initialChildCount = plant.adjacency.get(stemId)?.length ?? 0;

    const result = branchFromNode(world, stemId);
    expect(result).not.toBeNull();

    const newPlant = Array.from(result!.plants.values())[0];
    const newChildCount = newPlant.adjacency.get(stemId)?.length ?? 0;

    expect(newChildCount).toBe(initialChildCount + 1);
  });

  it("returns null for non-stem nodes", () => {
    // Find the bud
    let budId: Id = "";
    for (const [id, entity] of world.entities) {
      if (entity.kind === "plantNode" && entity.nodeKind === "bud") {
        budId = id;
        break;
      }
    }

    const result = branchFromNode(world, budId);
    expect(result).toBeNull();
  });

  it("returns null for non-existent id", () => {
    const result = branchFromNode(world, "fake-id");
    expect(result).toBeNull();
  });
});

