/**
 * Hanging Garden — Procedural Generation (Core)
 *
 * Compound rock formations as anchors.
 * Plants emerge from cracks and edges, with bark-like thickness.
 */

import {
  World,
  Constellation,
  Cluster,
  Island,
  Rock,
  Boulder,
  PlantNode,
  Plant,
  Pathway,
  PathwayDirection,
  Vec2,
  Id,
  vec2,
  genId,
  resetIdCounter,
  createInitialWorld,
  addVec2,
  scaleVec2,
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

// === Constellation Generation ===
// A constellation is a higher-order grouping of clusters

function generateConstellation(
  rng: () => number,
  index: number,
  totalConstellations: number
): Constellation {
  // First constellation at center, others positioned far away
  // Inter-constellation distance: 3000-5000 units (order of magnitude larger than inter-cluster)
  const spreadRadius = index === 0 ? 0 : 3500 + rng() * 1500;
  const angle =
    index === 0 ? 0 : ((index - 1) / (totalConstellations - 1)) * Math.PI * 2 + (rng() - 0.5) * 0.4;
  const distance = spreadRadius;

  return {
    id: genId("constellation"),
    pos: vec2(Math.cos(angle) * distance, Math.sin(angle) * distance),
  };
}

// === Cluster Generation ===
// Central glyph with orbiting islands/rocks

function generateCluster(
  rng: () => number,
  constellation: Constellation,
  index: number,
  totalClusters: number
): Cluster {
  // Inter-cluster distance within constellation: 400-600 units
  const spreadRadius = index === 0 ? 0 : 400 + rng() * 200;
  const angle = index === 0 ? 0 : (index / totalClusters) * Math.PI * 2 + (rng() - 0.5) * 0.4;
  const distance = spreadRadius * (0.8 + rng() * 0.4);

  const glyphKinds: Array<"seed" | "node" | "sigil"> = ["seed", "node", "sigil"];

  // Cluster position is relative to constellation center
  const clusterPos = addVec2(
    constellation.pos,
    vec2(Math.cos(angle) * distance, Math.sin(angle) * distance)
  );

  return {
    id: genId("cluster"),
    constellationId: constellation.id,
    pos: clusterPos,
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
  // The boulderPoints algorithm creates a mostly-convex base shape
  // with localized detail areas (crevices/protuberances) based on irregularity
  boulders.push({
    localPos: vec2(0, 0),
    size: mainSize,
    rotation: rng() * Math.PI * 2,
    sides: 6, // Base vertex count (algorithm may add detail vertices)
    irregularity: 0.3 + rng() * 0.4, // Controls how many detail areas and how dramatic
  });

  // Secondary boulders clustered around
  for (let i = 1; i < boulderCount; i++) {
    const subAngle = rng() * Math.PI * 2;
    const subDist = mainSize * (0.5 + rng() * 0.4);
    const subSize = mainSize * (0.3 + rng() * 0.4);

    // Varied detail levels for visual interest
    const hasMoreDetail = rng() > 0.5;

    boulders.push({
      localPos: vec2(Math.cos(subAngle) * subDist, Math.sin(subAngle) * subDist),
      size: subSize,
      rotation: rng() * Math.PI * 2,
      sides: 6,
      irregularity: hasMoreDetail ? 0.4 + rng() * 0.3 : 0.15 + rng() * 0.2,
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
    const segmentLength = 22 - depth * 3 + rng() * 12;
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

// === Pathway Generation ===
// Creates constellation-like patterns between clusters using
// angle-aware connection algorithm to avoid parallel/near-parallel lines
// Denser within constellations, sparse between constellations

function generatePathways(rng: () => number, clusters: Cluster[]): Pathway[] {
  if (clusters.length < 2) return [];

  const pathways: Pathway[] = [];
  const addedEdges = new Set<string>();

  // Track outgoing angles per cluster to avoid small-angle pairs
  const clusterAngles = new Map<Id, number[]>();
  for (const c of clusters) {
    clusterAngles.set(c.id, []);
  }

  // Helper to create a canonical edge key
  const edgeKey = (a: Id, b: Id): string => (a < b ? `${a}-${b}` : `${b}-${a}`);

  // Calculate angle from cluster a to cluster b
  const getAngle = (a: Cluster, b: Cluster): number => {
    const delta = subVec2(b.pos, a.pos);
    return Math.atan2(delta.y, delta.x);
  };

  // Check if a new angle would be too close to existing angles from this cluster
  const getMinAngleDiff = (clusterId: Id, newAngle: number): number => {
    const existingAngles = clusterAngles.get(clusterId) || [];
    if (existingAngles.length === 0) return Math.PI;

    let minDiff = Math.PI;
    for (const existing of existingAngles) {
      let diff = Math.abs(newAngle - existing);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      minDiff = Math.min(minDiff, diff);
    }
    return minDiff;
  };

  // Random direction assignment
  const randomDirection = (): PathwayDirection => {
    const roll = rng();
    if (roll < 0.4) return "forward";
    if (roll < 0.8) return "backward";
    return "bidirectional";
  };

  // Minimum angle between pathways from same cluster (~30 degrees)
  const MIN_ANGLE_SEPARATION = Math.PI / 6;

  // Calculate all possible edges with distances and constellation info
  const edges: {
    from: Cluster;
    to: Cluster;
    dist: number;
    sameConstellation: boolean;
  }[] = [];
  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const from = clusters[i];
      const to = clusters[j];
      const delta = subVec2(to.pos, from.pos);
      edges.push({
        from,
        to,
        dist: lenVec2(delta),
        sameConstellation: from.constellationId === to.constellationId,
      });
    }
  }

  // Sort by distance (shortest first) for priority
  edges.sort((a, b) => a.dist - b.dist);

  // Try to add each edge (only intra-constellation edges)
  for (const edge of edges) {
    const key = edgeKey(edge.from.id, edge.to.id);
    if (addedEdges.has(key)) continue;

    const angleFromA = getAngle(edge.from, edge.to);
    const angleFromB = getAngle(edge.to, edge.from);

    const minDiffA = getMinAngleDiff(edge.from.id, angleFromA);
    const minDiffB = getMinAngleDiff(edge.to.id, angleFromB);

    // Skip if angle is too close to existing pathway from either cluster
    if (minDiffA < MIN_ANGLE_SEPARATION || minDiffB < MIN_ANGLE_SEPARATION) {
      if (rng() > 0.05) continue;
    }

    // Only create pathways within the same constellation
    // No inter-constellation pathways - each constellation is a separate network
    if (!edge.sameConstellation) {
      continue;
    }

    // Intra-constellation: denser connections (only ~15% pruning)
    if (rng() < 0.15) continue;

    // Accept this edge
    addedEdges.add(key);
    pathways.push({
      id: genId("pathway"),
      fromClusterId: edge.from.id,
      toClusterId: edge.to.id,
      direction: randomDirection(),
    });

    // Record angles for both endpoints
    clusterAngles.get(edge.from.id)!.push(angleFromA);
    clusterAngles.get(edge.to.id)!.push(angleFromB);
  }

  // Ensure main cluster has at least one connection
  const mainCluster = clusters[0];
  const mainHasConnection = pathways.some(
    (p: Pathway): boolean => p.fromClusterId === mainCluster.id || p.toClusterId === mainCluster.id
  );

  if (!mainHasConnection && clusters.length > 1) {
    const nearest = edges.find((d) => d.from.id === mainCluster.id || d.to.id === mainCluster.id);
    if (nearest) {
      pathways.push({
        id: genId("pathway"),
        fromClusterId: nearest.from.id,
        toClusterId: nearest.to.id,
        direction: randomDirection(),
      });
    }
  }

  return pathways;
}

// === World Generation ===

export function generateWorld(seed: number): World {
  resetIdCounter();
  const rng = createRng(seed);
  const world = createInitialWorld(seed);

  // Generate 3 constellations
  const constellationCount = 3;
  const constellations: Constellation[] = [];

  for (let c = 0; c < constellationCount; c++) {
    const constellation = generateConstellation(rng, c, constellationCount);
    constellations.push(constellation);
    world.constellations.set(constellation.id, constellation);
  }

  // Generate clusters within each constellation
  const clusters: Cluster[] = [];

  for (let ci = 0; ci < constellations.length; ci++) {
    const constellation = constellations[ci];
    // First constellation gets 4 clusters, others get 3-4
    const clusterCount = ci === 0 ? 4 : 3 + Math.floor(rng() * 2);

    for (let c = 0; c < clusterCount; c++) {
      const cluster = generateCluster(rng, constellation, c, clusterCount);
      clusters.push(cluster);
      world.clusters.set(cluster.id, cluster);
    }
  }

  // Generate pathways between clusters (constellation pattern)
  const pathways = generatePathways(rng, clusters);
  for (const pathway of pathways) {
    world.pathways.set(pathway.id, pathway);
  }

  // Generate islands within each cluster
  const allRocks: { rock: Rock; island: Island; cluster: Cluster }[] = [];

  for (const cluster of clusters) {
    // First cluster of first constellation gets more islands
    const isMainCluster = cluster === clusters[0];
    const islandCount = isMainCluster
      ? 4 + Math.floor(rng() * 3) // 4-6 islands for main
      : 2 + Math.floor(rng() * 2); // 2-3 islands for others

    for (let i = 0; i < islandCount; i++) {
      const island = generateIsland(rng, cluster.id, i, islandCount);
      world.entities.set(island.id, island);

      // Main cluster gets more rocks, distant ones fewer
      const rockCount = isMainCluster ? 1 + Math.floor(rng() * 2) : 1;

      for (let j = 0; j < rockCount; j++) {
        const rock = generateRockFormation(rng, island, j, rockCount);
        world.entities.set(rock.id, rock);
        allRocks.push({ rock, island, cluster });
      }
    }
  }

  // Plants: main cluster gets 70%, distant get 50%
  for (const { rock, island, cluster } of allRocks) {
    const isMainCluster = cluster === clusters[0];
    const plantChance = isMainCluster ? 0.7 : 0.5;

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
