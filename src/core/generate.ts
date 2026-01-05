/**
 * Hanging Garden — Procedural Generation (Core)
 *
 * Seeded generation. Rocks as primary anchors.
 * Plants emerge FROM rocks, growing outward into sky.
 */

import {
  World,
  Island,
  Rock,
  PlantNode,
  Plant,
  Vec2,
  vec2,
  genId,
  resetIdCounter,
  createInitialWorld,
  addVec2,
  scaleVec2,
  normalizeVec2,
  subVec2,
  lenVec2,
} from "./model";

// === Seeded Random ===

export function createRng(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// === Shape Generation ===

function generateBlobShape(
  rng: () => number,
  radius: number,
  irregularity: number = 0.3,
  points: number = 10
): Vec2[] {
  const shape: Vec2[] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius * (1 + (rng() - 0.5) * irregularity);
    shape.push(vec2(Math.cos(angle) * r, Math.sin(angle) * r));
  }
  return shape;
}

// === Island Generation ===
// Positioned to all be visible in initial viewport

function generateIsland(
  rng: () => number,
  index: number,
  totalIslands: number
): Island {
  // Tight cluster - all islands visible in initial viewport
  const spreadRadius = 150 + totalIslands * 20;
  const angle = (index / totalIslands) * Math.PI * 2 + (rng() - 0.5) * 0.4;
  const distance = spreadRadius * (0.5 + rng() * 0.4);

  // Visible soil patches - bigger so they're clearly visible
  const radius = 40 + rng() * 30;

  return {
    kind: "island",
    id: genId("island"),
    pos: vec2(Math.cos(angle) * distance, Math.sin(angle) * distance),
    radius,
    shape: generateBlobShape(rng, radius, 0.2 + rng() * 0.15),
    depth: 0.8 + rng() * 0.4,
  };
}

// === Rock Generation ===
// Positioned around island edge

function generateRocksForIsland(rng: () => number, island: Island): Rock[] {
  const count = 2 + Math.floor(rng() * 2); // 2-3 rocks
  const rocks: Rock[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rng() * 0.5;
    // Rocks overlap island edge
    const dist = island.radius * (0.5 + rng() * 0.3);

    rocks.push({
      kind: "rock",
      id: genId("rock"),
      islandId: island.id,
      localPos: vec2(Math.cos(angle) * dist, Math.sin(angle) * dist),
      // Bigger rocks: 25-50px
      size: 25 + rng() * 25,
      rotation: rng() * Math.PI * 2,
    });
  }

  return rocks;
}

// === Plant Generation ===
// Plants grow FROM rocks, with branching

function generatePlantForRock(
  rng: () => number,
  rock: Rock,
  _island: Island
): { nodes: PlantNode[]; plant: Plant } {
  const plantId = genId("plant");
  const nodes: PlantNode[] = [];
  const adjacency = new Map<string, string[]>();

  // Direction from island center toward rock (outward)
  const outwardDir = normalizeVec2(rock.localPos);
  const outwardAngle =
    lenVec2(rock.localPos) > 5
      ? Math.atan2(outwardDir.y, outwardDir.x)
      : -Math.PI / 2 + (rng() - 0.5) * 1.0;

  // Root position: AT the rock edge (visually emerging from it)
  const rootPos = addVec2(
    rock.localPos,
    scaleVec2(vec2(Math.cos(outwardAngle), Math.sin(outwardAngle)), rock.size * 0.5)
  );

  // Growth direction: mix of outward and upward
  const baseAngle = outwardAngle * 0.3 + (-Math.PI / 2) * 0.7;
  const growAngle = baseAngle + (rng() - 0.5) * 0.5;

  const rootId = genId("node");
  nodes.push({
    kind: "plantNode",
    id: rootId,
    plantId,
    nodeKind: "stem",
    localPos: rootPos,
    angle: growAngle,
  });
  adjacency.set(rootId, []);

  // Recursive branching function
  function growBranch(
    parentId: string,
    startPos: Vec2,
    startAngle: number,
    depth: number,
    maxDepth: number
  ): void {
    if (depth > maxDepth) return;

    const segmentLength = 18 + rng() * 14;
    const angleVariation = (rng() - 0.5) * 0.4;
    const newAngle = startAngle + angleVariation;

    const newPos = addVec2(
      startPos,
      scaleVec2(vec2(Math.cos(newAngle), Math.sin(newAngle)), segmentLength)
    );

    const isTerminal = depth === maxDepth;
    const newId = genId("node");

    nodes.push({
      kind: "plantNode",
      id: newId,
      plantId,
      nodeKind: isTerminal ? "bud" : "stem",
      localPos: newPos,
      angle: newAngle,
      charge: isTerminal ? 0.5 + rng() * 0.5 : undefined,
    });

    adjacency.get(parentId)!.push(newId);
    adjacency.set(newId, []);

    if (!isTerminal) {
      // Continue main branch
      growBranch(newId, newPos, newAngle, depth + 1, maxDepth);

      // Maybe add a side branch
      if (depth >= 1 && rng() > 0.4) {
        const branchSide = rng() > 0.5 ? 1 : -1;
        const branchAngle = newAngle + branchSide * (0.5 + rng() * 0.4);
        const branchId = genId("node");
        const branchLength = 12 + rng() * 10;
        const branchPos = addVec2(
          newPos,
          scaleVec2(vec2(Math.cos(branchAngle), Math.sin(branchAngle)), branchLength)
        );

        // Side branch can be leaf or short sub-branch
        const isLeaf = rng() > 0.3;

        nodes.push({
          kind: "plantNode",
          id: branchId,
          plantId,
          nodeKind: isLeaf ? "leaf" : "stem",
          localPos: branchPos,
          angle: branchAngle,
        });

        adjacency.get(newId)!.push(branchId);
        adjacency.set(branchId, []);

        // If it's a stem, maybe continue it to a bud
        if (!isLeaf && rng() > 0.5) {
          const subBudId = genId("node");
          const subLength = 10 + rng() * 8;
          const subAngle = branchAngle + (rng() - 0.5) * 0.3;
          const subPos = addVec2(
            branchPos,
            scaleVec2(vec2(Math.cos(subAngle), Math.sin(subAngle)), subLength)
          );

          nodes.push({
            kind: "plantNode",
            id: subBudId,
            plantId,
            nodeKind: "bud",
            localPos: subPos,
            angle: subAngle,
            charge: 0.3 + rng() * 0.5,
          });

          adjacency.get(branchId)!.push(subBudId);
          adjacency.set(subBudId, []);
        }
      }
    }
  }

  // Start growing from root
  const mainBranchDepth = 2 + Math.floor(rng() * 2); // 2-3 segments
  growBranch(rootId, rootPos, growAngle, 0, mainBranchDepth);

  return {
    nodes,
    plant: {
      id: plantId,
      islandId: rock.islandId,
      rootId,
      adjacency,
    },
  };
}

// === World Generation ===

export function generateWorld(seed: number): World {
  resetIdCounter();
  const rng = createRng(seed);
  const world = createInitialWorld(seed);

  // 3-5 islands, all visible in initial viewport
  const islandCount = 3 + Math.floor(rng() * 3);
  const islands: Island[] = [];
  const allRocks: { rock: Rock; island: Island }[] = [];

  for (let i = 0; i < islandCount; i++) {
    const island = generateIsland(rng, i, islandCount);
    islands.push(island);
    world.entities.set(island.id, island);

    const rocks = generateRocksForIsland(rng, island);
    for (const rock of rocks) {
      world.entities.set(rock.id, rock);
      allRocks.push({ rock, island });
    }
  }

  // 50% of rocks have a plant
  for (const { rock, island } of allRocks) {
    if (rng() > 0.5) {
      const { nodes, plant } = generatePlantForRock(rng, rock, island);
      for (const node of nodes) {
        world.entities.set(node.id, node);
      }
      world.plants.set(plant.id, plant);
    }
  }

  return world;
}
