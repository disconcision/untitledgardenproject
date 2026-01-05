/**
 * Plant Actions — Sprout, Prune, Branch
 *
 * Pure functions for modifying plant structures.
 * Each function takes a World and returns a modified World or null on failure.
 */

import { World, Id, vec2, addVec2, scaleVec2, genId, PlantNode, Plant } from "../model";

/**
 * Sprout a bud into a stem, creating new growth.
 * Buds may become flowers at deeper depths.
 *
 * @param world - Current world state
 * @param budId - ID of the bud to sprout
 * @returns Modified world, or null if sprout failed
 */
export function sproutBud(world: World, budId: Id): World | null {
  const bud = world.entities.get(budId);
  if (!bud || bud.kind !== "plantNode" || bud.nodeKind !== "bud") {
    return null;
  }

  // Find the plant this bud belongs to
  const targetPlant = findPlantForNode(world, budId);
  if (!targetPlant) return null;

  const parentDepth = bud.depth ?? 0;
  const newEntities = new Map(world.entities);

  // Deeper buds have a chance to become flowers instead of stems
  const flowerChance = Math.min(0.4, parentDepth * 0.1);
  const becomesFlower = parentDepth >= 2 && Math.random() < flowerChance;

  if (becomesFlower) {
    // Convert bud to flower (terminal node)
    const flowerNode: PlantNode = {
      ...bud,
      nodeKind: "flower",
      charge: undefined,
    };
    newEntities.set(budId, flowerNode);

    const newPlants = new Map(world.plants);
    return {
      ...world,
      entities: newEntities,
      plants: newPlants,
    };
  }

  // Convert bud to stem
  const stemNode: PlantNode = {
    ...bud,
    nodeKind: "stem",
    charge: undefined,
  };
  newEntities.set(budId, stemNode);

  // Create new bud extending from this stem
  const newBudId = genId("node");
  const growthAngle = bud.angle + (Math.random() - 0.5) * 0.4;
  const growthLength = Math.max(8, 20 - parentDepth * 2) + Math.random() * 10;

  const newBud: PlantNode = {
    kind: "plantNode",
    id: newBudId,
    plantId: bud.plantId,
    nodeKind: "bud",
    localPos: addVec2(
      bud.localPos,
      scaleVec2(vec2(Math.cos(growthAngle), Math.sin(growthAngle)), growthLength)
    ),
    angle: growthAngle,
    charge: 0,
    depth: parentDepth + 1,
  };
  newEntities.set(newBudId, newBud);

  // Maybe add a leaf (more likely at deeper levels)
  const leafChance = 0.4 + parentDepth * 0.1;
  let newLeafId: Id | null = null;

  if (Math.random() < leafChance) {
    newLeafId = genId("node");
    const leafSide = Math.random() > 0.5 ? 1 : -1;
    const leafAngle = bud.angle + leafSide * (0.5 + Math.random() * 0.5);
    const leafDist = 10 + Math.random() * 8;

    const newLeaf: PlantNode = {
      kind: "plantNode",
      id: newLeafId,
      plantId: bud.plantId,
      nodeKind: "leaf",
      localPos: addVec2(
        bud.localPos,
        scaleVec2(vec2(Math.cos(leafAngle), Math.sin(leafAngle)), leafDist)
      ),
      angle: leafAngle,
      depth: parentDepth + 1,
    };
    newEntities.set(newLeafId, newLeaf);
  }

  // Maybe add a branch bud (less likely at deeper levels)
  const branchChance = Math.max(0.1, 0.4 - parentDepth * 0.1);
  let branchBudId: Id | null = null;

  if (Math.random() < branchChance) {
    branchBudId = genId("node");
    const branchSide = Math.random() > 0.5 ? 1 : -1;
    const branchAngle = bud.angle + branchSide * (0.6 + Math.random() * 0.4);
    const branchLength = growthLength * (0.6 + Math.random() * 0.3);

    const branchBud: PlantNode = {
      kind: "plantNode",
      id: branchBudId,
      plantId: bud.plantId,
      nodeKind: "bud",
      localPos: addVec2(
        bud.localPos,
        scaleVec2(vec2(Math.cos(branchAngle), Math.sin(branchAngle)), branchLength)
      ),
      angle: branchAngle,
      charge: 0.2,
      depth: parentDepth + 1,
    };
    newEntities.set(branchBudId, branchBud);
  }

  // Update plant adjacency
  const newAdjacency = new Map(targetPlant.adjacency);
  const children = [...(newAdjacency.get(budId) || []), newBudId];
  if (newLeafId) children.push(newLeafId);
  if (branchBudId) children.push(branchBudId);
  newAdjacency.set(budId, children);
  newAdjacency.set(newBudId, []);
  if (newLeafId) newAdjacency.set(newLeafId, []);
  if (branchBudId) newAdjacency.set(branchBudId, []);

  const newPlants = new Map(world.plants);
  newPlants.set(targetPlant.id, { ...targetPlant, adjacency: newAdjacency });

  return {
    ...world,
    entities: newEntities,
    plants: newPlants,
  };
}

/**
 * Prune a node and all its descendants.
 *
 * @param world - Current world state
 * @param nodeId - ID of the node to prune
 * @returns Modified world, or null if prune failed
 */
export function pruneNode(world: World, nodeId: Id): World | null {
  const node = world.entities.get(nodeId);
  if (!node || node.kind !== "plantNode") {
    return null;
  }

  const targetPlant = findPlantForNode(world, nodeId);
  if (!targetPlant) return null;

  // Can't prune the root
  if (targetPlant.rootId === nodeId) return null;

  // Find all nodes to remove (this node and descendants)
  const toRemove = collectDescendants(targetPlant, nodeId);
  toRemove.add(nodeId);

  // Remove from entities
  const newEntities = new Map(world.entities);
  for (const id of toRemove) {
    newEntities.delete(id);
  }

  // Update adjacency
  const newAdjacency = new Map<Id, Id[]>();
  for (const [parentId, childIds] of targetPlant.adjacency) {
    if (toRemove.has(parentId)) continue;
    const filteredChildren = childIds.filter((c: Id) => !toRemove.has(c));
    newAdjacency.set(parentId, filteredChildren);
  }

  const newPlants = new Map(world.plants);
  newPlants.set(targetPlant.id, { ...targetPlant, adjacency: newAdjacency });

  return {
    ...world,
    entities: newEntities,
    plants: newPlants,
  };
}

/**
 * Add a new branch from a stem node.
 *
 * @param world - Current world state
 * @param nodeId - ID of the stem to branch from
 * @returns Modified world, or null if branch failed
 */
export function branchFromNode(world: World, nodeId: Id): World | null {
  const node = world.entities.get(nodeId);
  if (!node || node.kind !== "plantNode" || node.nodeKind !== "stem") {
    return null;
  }

  const targetPlant = findPlantForNode(world, nodeId);
  if (!targetPlant) return null;

  const parentDepth = node.depth ?? 0;
  const newEntities = new Map(world.entities);

  // Find the best angle for the new branch
  const branchAngle = findBestBranchAngle(world, targetPlant, nodeId, node.angle);
  const branchLength = Math.max(10, 18 - parentDepth * 1.5) + Math.random() * 8;

  const branchBudId = genId("node");
  const branchBud: PlantNode = {
    kind: "plantNode",
    id: branchBudId,
    plantId: node.plantId,
    nodeKind: "bud",
    localPos: addVec2(
      node.localPos,
      scaleVec2(vec2(Math.cos(branchAngle), Math.sin(branchAngle)), branchLength)
    ),
    angle: branchAngle,
    charge: 0.5,
    depth: parentDepth + 1,
  };
  newEntities.set(branchBudId, branchBud);

  // Update plant adjacency
  const existingChildren = targetPlant.adjacency.get(nodeId) || [];
  const newAdjacency = new Map(targetPlant.adjacency);
  newAdjacency.set(nodeId, [...existingChildren, branchBudId]);
  newAdjacency.set(branchBudId, []);

  const newPlants = new Map(world.plants);
  newPlants.set(targetPlant.id, { ...targetPlant, adjacency: newAdjacency });

  return {
    ...world,
    entities: newEntities,
    plants: newPlants,
  };
}

// === Helper Functions ===

/**
 * Find the plant that contains a given node.
 */
function findPlantForNode(world: World, nodeId: Id): Plant | null {
  for (const plant of world.plants.values()) {
    if (plant.rootId === nodeId || plant.adjacency.has(nodeId)) {
      return plant;
    }
  }
  return null;
}

/**
 * Collect all descendant node IDs from a given node.
 */
function collectDescendants(plant: Plant, nodeId: Id): Set<Id> {
  const descendants = new Set<Id>();
  const queue = [...(plant.adjacency.get(nodeId) || [])];

  while (queue.length > 0) {
    const current = queue.shift()!;
    descendants.add(current);
    const children = plant.adjacency.get(current) || [];
    queue.push(...children);
  }

  return descendants;
}

/**
 * Find the best angle for a new branch, maximizing distance from existing children.
 */
function findBestBranchAngle(world: World, plant: Plant, nodeId: Id, parentAngle: number): number {
  const existingChildren = plant.adjacency.get(nodeId) || [];
  const childAngles: number[] = [];

  for (const childId of existingChildren) {
    const child = world.entities.get(childId);
    if (child && child.kind === "plantNode") {
      childAngles.push(child.angle);
    }
  }

  if (childAngles.length === 0) {
    // No existing children, pick a random side
    const branchSide = Math.random() > 0.5 ? 1 : -1;
    return parentAngle + branchSide * (0.5 + Math.random() * 0.5);
  }

  // Find the largest angular gap
  const minAngle = parentAngle - Math.PI * 0.7;
  const maxAngle = parentAngle + Math.PI * 0.7;

  // Normalize child angles relative to parent
  const normalizedAngles = childAngles
    .map((a: number): number => {
      let diff = a - parentAngle;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      return parentAngle + diff;
    })
    .filter((a: number): boolean => a >= minAngle && a <= maxAngle)
    .sort((a: number, b: number): number => a - b);

  let bestAngle = parentAngle + (Math.random() > 0.5 ? 0.6 : -0.6);
  let largestGap = 0;

  if (normalizedAngles.length > 0) {
    // Gap from minAngle to first child
    const gapToFirst = normalizedAngles[0] - minAngle;
    if (gapToFirst > largestGap) {
      largestGap = gapToFirst;
      bestAngle = minAngle + gapToFirst / 2;
    }

    // Gaps between consecutive children
    for (let i = 0; i < normalizedAngles.length - 1; i++) {
      const gap = normalizedAngles[i + 1] - normalizedAngles[i];
      if (gap > largestGap) {
        largestGap = gap;
        bestAngle = normalizedAngles[i] + gap / 2;
      }
    }

    // Gap from last child to maxAngle
    const gapFromLast = maxAngle - normalizedAngles[normalizedAngles.length - 1];
    if (gapFromLast > largestGap) {
      largestGap = gapFromLast;
      bestAngle = normalizedAngles[normalizedAngles.length - 1] + gapFromLast / 2;
    }
  }

  // Add small random offset
  return bestAngle + (Math.random() - 0.5) * 0.2;
}
