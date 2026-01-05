/**
 * Hanging Garden — Procedural Generation (Core)
 *
 * Compound rock formations as anchors.
 * Plants emerge from cracks and edges, with bark-like thickness.
 */

import {
  World,
  Cluster,
  Island,
  Rock,
  Boulder,
  PlantNode,
  Plant,
  Vec2,
  Id,
  vec2,
  genId,
  resetIdCounter,
  createInitialWorld,
  addVec2,
  scaleVec2,
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

// === Cluster Generation ===
// Central glyph with orbiting islands/rocks

function generateCluster(
  rng: () => number,
  index: number,
  totalClusters: number
): Cluster {
  // For now, main cluster at center, others positioned outward
  const spreadRadius = index === 0 ? 0 : 600 + totalClusters * 100;
  const angle = index === 0 ? 0 : (index / totalClusters) * Math.PI * 2 + (rng() - 0.5) * 0.3;
  const distance = spreadRadius * (0.7 + rng() * 0.3);

  const glyphKinds: Array<"seed" | "node" | "sigil"> = ["seed", "node", "sigil"];

  return {
    id: genId("cluster"),
    pos: vec2(Math.cos(angle) * distance, Math.sin(angle) * distance),
    glyphKind: glyphKinds[Math.floor(rng() * glyphKinds.length)],
    rotation: rng() * Math.PI * 2,
  };
}

// === Island Generation ===
// Smaller, more interstitial - dirt between rocks

function generateIsland(
  rng: () => number,
  clusterId: Id,
  index: number,
  totalIslands: number
): Island {
  const spreadRadius = 120 + totalIslands * 20;
  const angle = (index / totalIslands) * Math.PI * 2 + (rng() - 0.5) * 0.4;
  const distance = spreadRadius * (0.5 + rng() * 0.4);

  // Smaller soil patches - interstitial between rocks
  const radius = 25 + rng() * 20;

  return {
    kind: "island",
    id: genId("island"),
    clusterId,
    localPos: vec2(Math.cos(angle) * distance, Math.sin(angle) * distance),
    radius,
    shape: generateBlobShape(rng, radius, 0.25 + rng() * 0.2),
    depth: 0.8 + rng() * 0.4,
  };
}

// === Rock Formation Generation ===
// Compound structure: multiple boulders clustered together

function generateRockFormation(
  rng: () => number,
  island: Island,
  index: number,
  count: number
): Rock {
  const angle = (index / count) * Math.PI * 2 + rng() * 0.5;
  const dist = island.radius * (0.3 + rng() * 0.5);

  // Main boulder size
  const mainSize = 30 + rng() * 30;

  // Generate 2-4 boulders in this formation
  const boulderCount = 2 + Math.floor(rng() * 3);
  const boulders: Boulder[] = [];

  // Primary large boulder
  boulders.push({
    localPos: vec2(0, 0),
    size: mainSize,
    rotation: rng() * Math.PI * 2,
    sides: 8 + Math.floor(rng() * 5),
    irregularity: 0.1 + rng() * 0.15,
  });

  // Secondary boulders clustered around
  for (let i = 1; i < boulderCount; i++) {
    const subAngle = rng() * Math.PI * 2;
    const subDist = mainSize * (0.5 + rng() * 0.4);
    const subSize = mainSize * (0.3 + rng() * 0.4);

    boulders.push({
      localPos: vec2(Math.cos(subAngle) * subDist, Math.sin(subAngle) * subDist),
      size: subSize,
      rotation: rng() * Math.PI * 2,
      sides: 6 + Math.floor(rng() * 5),
      irregularity: 0.15 + rng() * 0.2,
    });
  }

  // Generate cracks between boulders where plants can grow
  const cracks: Vec2[] = [];
  for (let i = 0; i < boulderCount - 1; i++) {
    const b1 = boulders[i];
    const b2 = boulders[(i + 1) % boulderCount];
    const crackPos = vec2(
      (b1.localPos.x + b2.localPos.x) / 2 + (rng() - 0.5) * 10,
      (b1.localPos.y + b2.localPos.y) / 2 + (rng() - 0.5) * 10
    );
    cracks.push(crackPos);
  }

  return {
    kind: "rock",
    id: genId("rock"),
    islandId: island.id,
    localPos: vec2(Math.cos(angle) * dist, Math.sin(angle) * dist),
    boulders,
    cracks,
  };
}

// === Plant Generation ===
// Plants grow from rock cracks/edges with depth-tracked thickness

function generatePlantForRock(
  rng: () => number,
  rock: Rock,
  _island: Island
): { nodes: PlantNode[]; plant: Plant } {
  const plantId = genId("plant");
  const nodes: PlantNode[] = [];
  const adjacency = new Map<string, string[]>();

  // Choose growth point: crack or rock edge
  let rootPos: Vec2;
  if (rock.cracks.length > 0 && rng() > 0.3) {
    // Grow from a crack
    const crack = rock.cracks[Math.floor(rng() * rock.cracks.length)];
    rootPos = addVec2(rock.localPos, crack);
  } else {
    // Grow from main boulder edge
    const mainBoulder = rock.boulders[0];
    const outwardAngle = rng() * Math.PI * 2;
    rootPos = addVec2(
      rock.localPos,
      addVec2(
        mainBoulder.localPos,
        scaleVec2(vec2(Math.cos(outwardAngle), Math.sin(outwardAngle)), mainBoulder.size * 0.7)
      )
    );
  }

  // Growth direction: mostly upward with some variation
  const growAngle = -Math.PI / 2 + (rng() - 0.5) * 0.8;

  const rootId = genId("node");
  nodes.push({
    kind: "plantNode",
    id: rootId,
    plantId,
    nodeKind: "stem",
    localPos: rootPos,
    angle: growAngle,
    depth: 0, // Root is depth 0
  });
  adjacency.set(rootId, []);

  // Recursive branching with depth tracking
  function growBranch(
    parentId: string,
    startPos: Vec2,
    startAngle: number,
    depth: number,
    maxDepth: number
  ): void {
    if (depth > maxDepth) return;

    // Segment length decreases with depth
    const segmentLength = (22 - depth * 3) + rng() * 12;
    const angleVariation = (rng() - 0.5) * 0.5;
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
      depth: depth + 1,
    });

    adjacency.get(parentId)!.push(newId);
    adjacency.set(newId, []);

    if (!isTerminal) {
      // Continue main branch
      growBranch(newId, newPos, newAngle, depth + 1, maxDepth);

      // Maybe add side branches (more likely at lower depths)
      const branchChance = 0.6 - depth * 0.1;
      if (rng() < branchChance) {
        const branchSide = rng() > 0.5 ? 1 : -1;
        const branchAngle = newAngle + branchSide * (0.6 + rng() * 0.5);
        const branchId = genId("node");
        const branchLength = 10 + rng() * 10;
        const branchPos = addVec2(
          newPos,
          scaleVec2(vec2(Math.cos(branchAngle), Math.sin(branchAngle)), branchLength)
        );

        // Side branches are leaves or continue as stems
        const isLeaf = rng() > 0.4;

        nodes.push({
          kind: "plantNode",
          id: branchId,
          plantId,
          nodeKind: isLeaf ? "leaf" : "stem",
          localPos: branchPos,
          angle: branchAngle,
          depth: depth + 2,
        });

        adjacency.get(newId)!.push(branchId);
        adjacency.set(branchId, []);

        // Sub-branches can continue to buds
        if (!isLeaf && rng() > 0.4) {
          const subId = genId("node");
          const subLength = 8 + rng() * 8;
          const subAngle = branchAngle + (rng() - 0.5) * 0.4;
          const subPos = addVec2(
            branchPos,
            scaleVec2(vec2(Math.cos(subAngle), Math.sin(subAngle)), subLength)
          );

          nodes.push({
            kind: "plantNode",
            id: subId,
            plantId,
            nodeKind: "bud",
            localPos: subPos,
            angle: subAngle,
            charge: 0.3 + rng() * 0.5,
            depth: depth + 3,
          });

          adjacency.get(branchId)!.push(subId);
          adjacency.set(subId, []);
        }
      }
    }
  }

  // Main branch depth varies
  const mainBranchDepth = 2 + Math.floor(rng() * 3); // 2-4 segments
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

  // Multiple clusters: 1 main + 2-4 distant
  const clusterCount = 3 + Math.floor(rng() * 3); // 3-5 clusters total
  const clusters: Cluster[] = [];

  for (let c = 0; c < clusterCount; c++) {
    const cluster = generateCluster(rng, c, clusterCount);
    clusters.push(cluster);
    world.clusters.set(cluster.id, cluster);
  }

  // Generate islands within each cluster
  const allRocks: { rock: Rock; island: Island; cluster: Cluster }[] = [];

  for (const cluster of clusters) {
    // Main cluster (index 0) gets more islands, distant ones get fewer
    const isMain = clusters.indexOf(cluster) === 0;
    const islandCount = isMain
      ? 4 + Math.floor(rng() * 3) // 4-6 islands for main
      : 2 + Math.floor(rng() * 2); // 2-3 islands for distant

    for (let i = 0; i < islandCount; i++) {
      const island = generateIsland(rng, cluster.id, i, islandCount);
      world.entities.set(island.id, island);

      // Main cluster gets more rocks, distant ones fewer
      const rockCount = isMain
        ? 1 + Math.floor(rng() * 2) // 1-2 rocks
        : 1; // Just 1 rock for distant

      for (let j = 0; j < rockCount; j++) {
        const rock = generateRockFormation(rng, island, j, rockCount);
        world.entities.set(rock.id, rock);
        allRocks.push({ rock, island, cluster });
      }
    }
  }

  // Plants: main cluster gets 70%, distant get 50%
  for (const { rock, island, cluster } of allRocks) {
    const isMain = clusters.indexOf(cluster) === 0;
    const plantChance = isMain ? 0.7 : 0.5;

    if (rng() < plantChance) {
      const { nodes, plant } = generatePlantForRock(rng, rock, island);
      for (const node of nodes) {
        world.entities.set(node.id, node);
      }
      world.plants.set(plant.id, plant);
    }
  }

  return world;
}
