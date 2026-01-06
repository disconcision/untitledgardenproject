/**
 * Tests for plant actions — sprout, prune, branch, cut, graft
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
  CarriedSubtree,
} from "../../src/core";
import {
  sproutBud,
  pruneNode,
  branchFromNode,
  cutSubtree,
  graftSubtree,
} from "../../src/core/actions";

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
    radius: 50,
    depth: 0,
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

// === Cut/Graft Tests ===

/**
 * Create a larger test plant for cut/graft testing.
 * Structure: root(stem) -> stem1 -> bud1
 *                       -> stem2 -> bud2
 *                                -> bud3
 */
function createBranchingTestWorld(): {
  world: World;
  nodeIds: Record<string, Id>;
  islandPos: { x: number; y: number };
} {
  resetIdCounter(100); // Different seed to avoid collisions
  const world = createInitialWorld(42);

  const islandId = genId("island");
  const islandPos = vec2(100, 100);
  const island: Island = {
    kind: "island",
    id: islandId,
    clusterId: "test-cluster",
    localPos: vec2(0, 0),
    shape: [vec2(-50, -50), vec2(50, -50), vec2(50, 50), vec2(-50, 50)],
    radius: 50,
    depth: 0,
  };

  const plantId = genId("plant");
  const rootId = genId("node");
  const stem1Id = genId("node");
  const stem2Id = genId("node");
  const bud1Id = genId("node");
  const bud2Id = genId("node");
  const bud3Id = genId("node");

  const root: PlantNode = {
    kind: "plantNode",
    id: rootId,
    plantId,
    nodeKind: "stem",
    localPos: vec2(0, 0),
    angle: -Math.PI / 2,
    depth: 0,
  };

  const stem1: PlantNode = {
    kind: "plantNode",
    id: stem1Id,
    plantId,
    nodeKind: "stem",
    localPos: vec2(-15, -20),
    angle: -Math.PI * 0.75,
    depth: 1,
  };

  const stem2: PlantNode = {
    kind: "plantNode",
    id: stem2Id,
    plantId,
    nodeKind: "stem",
    localPos: vec2(15, -20),
    angle: -Math.PI * 0.25,
    depth: 1,
  };

  const bud1: PlantNode = {
    kind: "plantNode",
    id: bud1Id,
    plantId,
    nodeKind: "bud",
    localPos: vec2(-25, -35),
    angle: -Math.PI * 0.75,
    charge: 0.5,
    depth: 2,
  };

  const bud2: PlantNode = {
    kind: "plantNode",
    id: bud2Id,
    plantId,
    nodeKind: "bud",
    localPos: vec2(25, -35),
    angle: -Math.PI * 0.25,
    charge: 0.5,
    depth: 2,
  };

  const bud3: PlantNode = {
    kind: "plantNode",
    id: bud3Id,
    plantId,
    nodeKind: "bud",
    localPos: vec2(30, -25),
    angle: 0,
    charge: 0.5,
    depth: 2,
  };

  const adjacency = new Map<Id, Id[]>();
  adjacency.set(rootId, [stem1Id, stem2Id]);
  adjacency.set(stem1Id, [bud1Id]);
  adjacency.set(stem2Id, [bud2Id, bud3Id]);
  adjacency.set(bud1Id, []);
  adjacency.set(bud2Id, []);
  adjacency.set(bud3Id, []);

  const plant: Plant = {
    id: plantId,
    islandId,
    rootId,
    adjacency,
  };

  const entities = new Map(world.entities);
  entities.set(islandId, island);
  entities.set(rootId, root);
  entities.set(stem1Id, stem1);
  entities.set(stem2Id, stem2);
  entities.set(bud1Id, bud1);
  entities.set(bud2Id, bud2);
  entities.set(bud3Id, bud3);

  const plants = new Map(world.plants);
  plants.set(plantId, plant);

  return {
    world: { ...world, entities, plants },
    nodeIds: { rootId, stem1Id, stem2Id, bud1Id, bud2Id, bud3Id },
    islandPos,
  };
}

describe("cutSubtree", () => {
  let world: World;
  let nodeIds: Record<string, Id>;
  let islandPos: { x: number; y: number };

  beforeEach(() => {
    const setup = createBranchingTestWorld();
    world = setup.world;
    nodeIds = setup.nodeIds;
    islandPos = setup.islandPos;
  });

  it("extracts subtree with correct nodes", () => {
    // Cut stem2 which has bud2 and bud3 as children
    const result = cutSubtree(world, nodeIds.stem2Id, islandPos);
    expect(result).not.toBeNull();

    const { subtree } = result!;
    expect(subtree.nodes.length).toBe(3); // stem2 + bud2 + bud3
    expect(subtree.rootId).toBe(nodeIds.stem2Id);
  });

  it("removes cut nodes from world entities", () => {
    const result = cutSubtree(world, nodeIds.stem2Id, islandPos);
    expect(result).not.toBeNull();

    const newWorld = result!.world;
    expect(newWorld.entities.has(nodeIds.stem2Id)).toBe(false);
    expect(newWorld.entities.has(nodeIds.bud2Id)).toBe(false);
    expect(newWorld.entities.has(nodeIds.bud3Id)).toBe(false);
  });

  it("preserves remaining nodes", () => {
    const result = cutSubtree(world, nodeIds.stem2Id, islandPos);
    expect(result).not.toBeNull();

    const newWorld = result!.world;
    expect(newWorld.entities.has(nodeIds.rootId)).toBe(true);
    expect(newWorld.entities.has(nodeIds.stem1Id)).toBe(true);
    expect(newWorld.entities.has(nodeIds.bud1Id)).toBe(true);
  });

  it("updates parent adjacency", () => {
    const result = cutSubtree(world, nodeIds.stem2Id, islandPos);
    expect(result).not.toBeNull();

    const plant = Array.from(result!.world.plants.values())[0];
    const rootChildren = plant.adjacency.get(nodeIds.rootId);
    expect(rootChildren).toBeDefined();
    expect(rootChildren!.includes(nodeIds.stem2Id)).toBe(false);
    expect(rootChildren!.includes(nodeIds.stem1Id)).toBe(true);
  });

  it("preserves subtree internal structure", () => {
    const result = cutSubtree(world, nodeIds.stem2Id, islandPos);
    expect(result).not.toBeNull();

    const { subtree } = result!;
    const stem2Children = subtree.adjacency.get(nodeIds.stem2Id);
    expect(stem2Children).toBeDefined();
    expect(stem2Children!.length).toBe(2); // bud2 and bud3
    expect(stem2Children!.includes(nodeIds.bud2Id)).toBe(true);
    expect(stem2Children!.includes(nodeIds.bud3Id)).toBe(true);
  });

  it("returns null for root node", () => {
    const result = cutSubtree(world, nodeIds.rootId, islandPos);
    expect(result).toBeNull();
  });

  it("returns null for non-existent id", () => {
    const result = cutSubtree(world, "fake-id", islandPos);
    expect(result).toBeNull();
  });
});

describe("graftSubtree", () => {
  let world: World;
  let nodeIds: Record<string, Id>;
  let islandPos: { x: number; y: number };
  let carriedSubtree: CarriedSubtree;

  beforeEach(() => {
    const setup = createBranchingTestWorld();
    world = setup.world;
    nodeIds = setup.nodeIds;
    islandPos = setup.islandPos;

    // Cut stem2 subtree to get a CarriedSubtree
    const cutResult = cutSubtree(world, nodeIds.stem2Id, islandPos);
    expect(cutResult).not.toBeNull();
    world = cutResult!.world;
    carriedSubtree = cutResult!.subtree;
  });

  it("attaches subtree to target stem", () => {
    const result = graftSubtree(world, nodeIds.stem1Id, carriedSubtree);
    expect(result).not.toBeNull();

    // stem1 should now have additional children (the grafted subtree root)
    const plant = Array.from(result!.plants.values())[0];
    const stem1Children = plant.adjacency.get(nodeIds.stem1Id);
    expect(stem1Children).toBeDefined();
    // Was: [bud1Id], now should have one more child
    expect(stem1Children!.length).toBe(2);
  });

  it("creates new entities with remapped IDs", () => {
    const initialEntityCount = world.entities.size;
    const result = graftSubtree(world, nodeIds.stem1Id, carriedSubtree);
    expect(result).not.toBeNull();

    // Should have 3 new entities (stem2, bud2, bud3 with new IDs)
    expect(result!.entities.size).toBe(initialEntityCount + 3);
  });

  it("positions subtree with offset from target", () => {
    const result = graftSubtree(world, nodeIds.stem1Id, carriedSubtree);
    expect(result).not.toBeNull();

    // Find the grafted root (new child of stem1 that isn't bud1)
    const plant = Array.from(result!.plants.values())[0];
    const stem1Children = plant.adjacency.get(nodeIds.stem1Id)!;
    const graftedRootId = stem1Children.find((id: Id): boolean => id !== nodeIds.bud1Id);
    expect(graftedRootId).toBeDefined();

    const graftedRoot = result!.entities.get(graftedRootId!) as PlantNode;
    const stem1 = result!.entities.get(nodeIds.stem1Id) as PlantNode;

    // Grafted root should NOT be at the same position as stem1
    const distance = Math.sqrt(
      Math.pow(graftedRoot.localPos.x - stem1.localPos.x, 2) +
        Math.pow(graftedRoot.localPos.y - stem1.localPos.y, 2)
    );
    expect(distance).toBeGreaterThan(5); // Should have offset
  });

  it("returns null when targeting non-stem", () => {
    const result = graftSubtree(world, nodeIds.bud1Id, carriedSubtree);
    expect(result).toBeNull();
  });

  it("returns null for non-existent target", () => {
    const result = graftSubtree(world, "fake-id", carriedSubtree);
    expect(result).toBeNull();
  });
});
