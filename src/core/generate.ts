/**
 * Hanging Garden — Procedural Generation (Core)
 *
 * Seeded generation. Rocks as primary anchors.
 * Plants grow from rock edges with sky behind them.
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
// Smaller, more subtle - just soil patches

function generateIsland(
  rng: () => number,
  index: number,
  totalIslands: number
): Island {
  const spreadRadius = 350 + totalIslands * 40;
  const angle = (index / totalIslands) * Math.PI * 2 + rng() * 0.5;
  const distance = spreadRadius * (0.4 + rng() * 0.6);

  // SMALLER islands - 30-60px radius
  const radius = 30 + rng() * 30;

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
// Larger, more prominent - the primary visual anchors

function generateRocksForIsland(rng: () => number, island: Island): Rock[] {
  // 2-4 rocks per island, larger and more spread out
  const count = 2 + Math.floor(rng() * 3);
  const rocks: Rock[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rng() * 0.8;
    // Rocks positioned at edge of island or slightly beyond
    const dist = island.radius * (0.6 + rng() * 0.6);

    rocks.push({
      kind: "rock",
      id: genId("rock"),
      islandId: island.id,
      localPos: vec2(Math.cos(angle) * dist, Math.sin(angle) * dist),
      // Bigger rocks: 15-35px
      size: 15 + rng() * 20,
      rotation: rng() * Math.PI * 2,
    });
  }

  return rocks;
}

// === Plant Generation ===
// Plants grow from rock edges, reaching into open sky

function generatePlantForRock(
  rng: () => number,
  rock: Rock,
  island: Island
): { nodes: PlantNode[]; plant: Plant } {
  const plantId = genId("plant");
  const nodes: PlantNode[] = [];
  const adjacency = new Map<string, string[]>();

  // Root position at rock edge, pointing outward (toward sky)
  const outwardDir = normalizeVec2(subVec2(rock.localPos, vec2(0, 0)));

  // If rock is near center, pick a random outward direction
  const outwardAngle =
    lenVec2(rock.localPos) > 10
      ? Math.atan2(outwardDir.y, outwardDir.x)
      : rng() * Math.PI * 2;

  // Root starts at rock edge
  const rootOffset = scaleVec2(
    vec2(Math.cos(outwardAngle), Math.sin(outwardAngle)),
    rock.size * 0.7
  );
  const rootPos = addVec2(rock.localPos, rootOffset);

  // Growth direction: mostly outward and upward
  const growAngle = outwardAngle * 0.5 + -Math.PI / 2 * 0.5 + (rng() - 0.5) * 0.4;

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

  let currentId = rootId;
  let currentPos = rootPos;
  let currentAngle = growAngle;

  const segmentCount = 2 + Math.floor(rng() * 2);

  for (let i = 0; i < segmentCount; i++) {
    const segmentLength = 20 + rng() * 15;
    const angleVariation = (rng() - 0.5) * 0.35;
    currentAngle += angleVariation;

    const newPos = addVec2(
      currentPos,
      scaleVec2(
        vec2(Math.cos(currentAngle), Math.sin(currentAngle)),
        segmentLength
      )
    );

    const isLast = i === segmentCount - 1;
    const newId = genId("node");

    nodes.push({
      kind: "plantNode",
      id: newId,
      plantId,
      nodeKind: isLast ? "bud" : "stem",
      localPos: newPos,
      angle: currentAngle,
      charge: isLast ? 0.6 + rng() * 0.4 : undefined,
    });

    adjacency.get(currentId)!.push(newId);
    adjacency.set(newId, []);

    // Add leaves on stems (not on first segment)
    if (!isLast && i > 0 && rng() > 0.3) {
      const leafId = genId("node");
      const leafSide = rng() > 0.5 ? 1 : -1;
      const leafAngle = currentAngle + leafSide * (0.6 + rng() * 0.5);
      const leafDist = 14 + rng() * 10;

      nodes.push({
        kind: "plantNode",
        id: leafId,
        plantId,
        nodeKind: "leaf",
        localPos: addVec2(
          newPos,
          scaleVec2(vec2(Math.cos(leafAngle), Math.sin(leafAngle)), leafDist)
        ),
        angle: leafAngle,
      });

      adjacency.get(newId)!.push(leafId);
      adjacency.set(leafId, []);
    }

    currentId = newId;
    currentPos = newPos;
  }

  return {
    nodes,
    plant: {
      id: plantId,
      islandId: island.id,
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

  // Fewer islands: 3-5
  const islandCount = 3 + Math.floor(rng() * 3);
  const islands: Island[] = [];
  const allRocks: { rock: Rock; island: Island }[] = [];

  for (let i = 0; i < islandCount; i++) {
    const island = generateIsland(rng, i, islandCount);
    islands.push(island);
    world.entities.set(island.id, island);

    // Generate rocks
    const rocks = generateRocksForIsland(rng, island);
    for (const rock of rocks) {
      world.entities.set(rock.id, rock);
      allRocks.push({ rock, island });
    }
  }

  // Generate plants from rocks (not all rocks have plants)
  for (const { rock, island } of allRocks) {
    // 60% of rocks have a plant
    if (rng() > 0.4) {
      const { nodes, plant } = generatePlantForRock(rng, rock, island);
      for (const node of nodes) {
        world.entities.set(node.id, node);
      }
      world.plants.set(plant.id, plant);
    }
  }

  return world;
}
