/**
 * Hanging Garden — Update Function
 *
 * Messages and state transitions.
 * MVU-style: update(msg, world) → world
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
  PlantNode,
  Plant,
  Particle,
  Island,
  Rock,
} from "./model";

// === Messages ===

export type Msg =
  // Camera
  | { type: "camera/pan"; delta: Vec2 }
  | { type: "camera/zoom"; delta: number; center: Vec2 }
  | { type: "camera/focus"; target: Vec2; zoom?: number }

  // Selection
  | { type: "select"; id: Id | null }
  | { type: "hover"; id: Id | null }

  // Interaction
  | { type: "sprout"; budId: Id }
  | { type: "prune"; nodeId: Id }
  | { type: "trim"; nodeId: Id } // Same as prune but for the context menu action
  | { type: "branch"; nodeId: Id } // Add a new branch from this node

  // Context Menu
  | { type: "contextMenu/open"; nodeId: Id; screenPos: Vec2; worldPos: Vec2 }
  | { type: "contextMenu/close" }

  // Simulation
  | { type: "tick"; dt: number }

  // Tutorial
  | { type: "tutorial/complete"; stepId: string }
  | { type: "tutorial/toggle" }
  | { type: "tutorial/dismiss" }

  // Debug
  | { type: "debug/toggleIds" }
  | { type: "debug/toggleHitTargets" }
  | { type: "debug/toggleFreeze" }
  | { type: "debug/regenerate"; seed: number }

  // Panels
  | { type: "panel/openInspector" }
  | { type: "panel/openDebug" }
  | { type: "panel/openTime" }
  
  // Day Cycle
  | { type: "dayCycle/setTime"; timeOfDay: number }
  | { type: "dayCycle/setDayLength"; dayLengthMs: number }
  | { type: "dayCycle/toggleRunning" }
  | { type: "dayCycle/tick"; dtMs: number }
  
  // Particles (fast tick for smooth movement)
  | { type: "particle/tick"; dtMs: number };

// === Audio Event Hooks ===

export type AudioEvent =
  | { type: "sprout" }
  | { type: "prune" }
  | { type: "branch" }
  | { type: "trim" }
  | { type: "select" }
  | { type: "hover" }
  | { type: "pan" }
  | { type: "zoom" }
  | { type: "menuOpen" }
  | { type: "menuClose" };

const audioEventListeners: ((event: AudioEvent) => void)[] = [];

export function onAudioEvent(
  listener: (event: AudioEvent) => void
): () => void {
  audioEventListeners.push(listener);
  return () => {
    const idx = audioEventListeners.indexOf(listener);
    if (idx >= 0) audioEventListeners.splice(idx, 1);
  };
}

function emitAudioEvent(event: AudioEvent): void {
  audioEventListeners.forEach((l: (event: AudioEvent) => void) => l(event));
}

// === Update Function ===

export function update(msg: Msg, world: World): World {
  switch (msg.type) {
    // === Camera ===
    case "camera/pan": {
      emitAudioEvent({ type: "pan" });
      return {
        ...world,
        camera: {
          ...world.camera,
          pan: addVec2(world.camera.pan, msg.delta),
        },
        tutorial: completeTutorialStep(world.tutorial, "pan"),
      };
    }

    case "camera/zoom": {
      emitAudioEvent({ type: "zoom" });
      const minZoom = 0.25;
      const maxZoom = 4;
      const newZoom = Math.max(
        minZoom,
        Math.min(maxZoom, world.camera.zoom * (1 + msg.delta))
      );

      const zoomRatio = newZoom / world.camera.zoom;
      const panOffset = scaleVec2(
        {
          x: msg.center.x - world.camera.pan.x,
          y: msg.center.y - world.camera.pan.y,
        },
        1 - zoomRatio
      );

      return {
        ...world,
        camera: {
          pan: addVec2(world.camera.pan, panOffset),
          zoom: newZoom,
        },
        tutorial: completeTutorialStep(world.tutorial, "zoom"),
      };
    }

    case "camera/focus": {
      return {
        ...world,
        camera: {
          pan: vec2(-msg.target.x, -msg.target.y),
          zoom: msg.zoom ?? world.camera.zoom,
        },
        tutorial: completeTutorialStep(world.tutorial, "focus"),
      };
    }

    // === Selection ===
    case "select": {
      if (msg.id !== world.selection) {
        emitAudioEvent({ type: "select" });
      }
      return {
        ...world,
        selection: msg.id,
      };
    }

    case "hover": {
      if (msg.id !== world.hover && msg.id !== null) {
        emitAudioEvent({ type: "hover" });
      }
      return {
        ...world,
        hover: msg.id,
      };
    }

    // === Interaction ===
    case "sprout": {
      const result = sproutBud(world, msg.budId);
      if (result) {
        emitAudioEvent({ type: "sprout" });
        return {
          ...result,
          tutorial: completeTutorialStep(result.tutorial, "sprout"),
        };
      }
      return world;
    }

    case "prune": {
      const result = pruneNode(world, msg.nodeId);
      if (result) {
        emitAudioEvent({ type: "prune" });
        return {
          ...result,
          tutorial: completeTutorialStep(result.tutorial, "prune"),
        };
      }
      return world;
    }

    case "trim": {
      const result = pruneNode(world, msg.nodeId);
      if (result) {
        emitAudioEvent({ type: "trim" });
        return {
          ...result,
          contextMenu: null, // Close menu after action
          tutorial: completeTutorialStep(result.tutorial, "context"),
        };
      }
      // Close menu even on failure so user knows something happened
      return { ...world, contextMenu: null };
    }

    case "branch": {
      const result = branchFromNode(world, msg.nodeId);
      if (result) {
        emitAudioEvent({ type: "branch" });
        return {
          ...result,
          contextMenu: null, // Close menu after action
          tutorial: completeTutorialStep(result.tutorial, "context"),
        };
      }
      // Close menu even on failure so user knows something happened
      return { ...world, contextMenu: null };
    }

    // === Context Menu ===
    case "contextMenu/open": {
      emitAudioEvent({ type: "menuOpen" });
      return {
        ...world,
        contextMenu: {
          nodeId: msg.nodeId,
          screenPos: msg.screenPos,
          worldPos: msg.worldPos,
        },
      };
    }

    case "contextMenu/close": {
      if (world.contextMenu) {
        emitAudioEvent({ type: "menuClose" });
      }
      return {
        ...world,
        contextMenu: null,
      };
    }

    // === Simulation ===
    case "tick": {
      // Note: Pausing is now handled at the effect level in App.tsx
      // Both dayCycle.running and debug.freezeTime control simulation
      let result = world;

      // Charge buds and occasionally auto-sprout
      const newEntities = new Map(result.entities);
      let entitiesChanged = false;
      const budsToSprout: Id[] = [];

      for (const [id, entity] of newEntities) {
        if (entity.kind === "plantNode" && entity.nodeKind === "bud") {
          const currentCharge = entity.charge ?? 0;
          if (currentCharge < 1) {
            // Slow charge: ~0.02 per tick (50 ticks = ~50 seconds to full)
            const chargeRate = 0.02 + Math.random() * 0.01;
            const newCharge = Math.min(1, currentCharge + chargeRate);
            newEntities.set(id, { ...entity, charge: newCharge });
            entitiesChanged = true;
          } else {
            // Fully charged buds have a small chance to auto-sprout
            // ~5% per tick when charged
            if (Math.random() < 0.05) {
              budsToSprout.push(id);
            }
          }
        }
      }

      if (entitiesChanged) {
        result = { ...result, entities: newEntities };
      }

      // Auto-sprout charged buds (max 1 per tick to avoid chaos)
      if (budsToSprout.length > 0) {
        const budToSprout = budsToSprout[Math.floor(Math.random() * budsToSprout.length)];
        const sproutResult = sproutBud(result, budToSprout);
        if (sproutResult) {
          result = {
            ...sproutResult,
            tutorial: completeTutorialStep(sproutResult.tutorial, "watch-grow"),
          };
        }
      }

      // === Flower spawning seeds (slow tick) ===
      result = tickFlowerSeeds(result);

      // === Spawn fireflies at dusk (slow tick) ===
      result = tickFireflySpawning(result);

      // === Particle lifecycle (slow tick: rooting, cleanup) ===
      result = tickParticleLifecycle(result);

      return {
        ...result,
        time: {
          ...result.time,
          t: result.time.t + msg.dt,
          dt: msg.dt,
        },
      };
    }

    // === Tutorial ===
    case "tutorial/complete": {
      return {
        ...world,
        tutorial: completeTutorialStep(world.tutorial, msg.stepId),
      };
    }

    case "tutorial/toggle":
      return {
        ...world,
        tutorial: { ...world.tutorial, visible: !world.tutorial.visible },
      };

    case "tutorial/dismiss":
      return {
        ...world,
        tutorial: { ...world.tutorial, visible: false },
      };

    // === Debug ===
    case "debug/toggleIds":
      return {
        ...world,
        debug: { ...world.debug, showIds: !world.debug.showIds },
      };

    case "debug/toggleHitTargets":
      return {
        ...world,
        debug: { ...world.debug, showHitTargets: !world.debug.showHitTargets },
      };

    case "debug/toggleFreeze":
      return {
        ...world,
        debug: { ...world.debug, freezeTime: !world.debug.freezeTime },
      };

    case "debug/regenerate":
      return world;

    // === Panels ===
    case "panel/openInspector":
      return {
        ...world,
        tutorial: completeTutorialStep(world.tutorial, "inspector"),
      };

    case "panel/openDebug":
      return {
        ...world,
        tutorial: completeTutorialStep(world.tutorial, "debug"),
      };

    case "panel/openTime":
      // Opening the time panel doesn't complete a step itself, but is a prerequisite
      return world;

    // === Day Cycle ===
    case "dayCycle/setTime": {
      return {
        ...world,
        dayCycle: {
          ...world.dayCycle,
          timeOfDay: Math.max(0, Math.min(1, msg.timeOfDay)),
        },
        tutorial: completeTutorialStep(world.tutorial, "time-scrub"),
      };
    }

    case "dayCycle/setDayLength": {
      // Clamp between 30 seconds and 30 minutes
      const clamped = Math.max(30000, Math.min(1800000, msg.dayLengthMs));
      return {
        ...world,
        dayCycle: {
          ...world.dayCycle,
          dayLengthMs: clamped,
        },
      };
    }

    case "dayCycle/toggleRunning": {
      return {
        ...world,
        dayCycle: {
          ...world.dayCycle,
          running: !world.dayCycle.running,
        },
        tutorial: completeTutorialStep(world.tutorial, "time-pause"),
      };
    }

    case "dayCycle/tick": {
      if (!world.dayCycle.running) return world;
      
      // Calculate how much time of day to advance
      const fractionOfDay = msg.dtMs / world.dayCycle.dayLengthMs;
      let newTimeOfDay = world.dayCycle.timeOfDay + fractionOfDay;
      
      // Wrap around at midnight
      if (newTimeOfDay >= 1) {
        newTimeOfDay = newTimeOfDay % 1;
      }
      
      return {
        ...world,
        dayCycle: {
          ...world.dayCycle,
          timeOfDay: newTimeOfDay,
        },
      };
    }

    // === Particle Fast Tick (smooth movement) ===
    case "particle/tick": {
      return tickParticlesFast(world, msg.dtMs);
    }

    default:
      return world;
  }
}

// === Sprout Logic ===

function sproutBud(world: World, budId: Id): World | null {
  const bud = world.entities.get(budId);
  if (!bud || bud.kind !== "plantNode" || bud.nodeKind !== "bud") {
    return null;
  }

  // Find the plant this bud belongs to
  let targetPlant: Plant | null = null;
  for (const plant of world.plants.values()) {
    if (plant.adjacency.has(budId)) {
      targetPlant = plant;
      break;
    }
  }
  if (!targetPlant) return null;

  // Depth tracking - new nodes are deeper than parent
  const parentDepth = bud.depth ?? 0;

  // Create new entities map
  const newEntities = new Map(world.entities);

  // Deeper buds have a chance to become flowers instead of stems
  // Flowers are terminal - they don't continue growing
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
    
    // Flowers don't create new children, just return
    const newPlants = new Map(world.plants);
    return {
      ...world,
      entities: newEntities,
      plants: newPlants,
    };
  }

  // Convert bud to stem (keeps same depth)
  const stemNode: PlantNode = {
    ...bud,
    nodeKind: "stem",
    charge: undefined,
  };
  newEntities.set(budId, stemNode);

  // Create new bud extending from this stem
  const newBudId = genId("node");
  const growthAngle = bud.angle + (Math.random() - 0.5) * 0.4;
  // Segment length decreases with depth (like bark effect)
  const growthLength = Math.max(8, 20 - parentDepth * 2) + Math.random() * 10;

  const newBud: PlantNode = {
    kind: "plantNode",
    id: newBudId,
    plantId: bud.plantId,
    nodeKind: "bud",
    localPos: addVec2(
      bud.localPos,
      scaleVec2(
        vec2(Math.cos(growthAngle), Math.sin(growthAngle)),
        growthLength
      )
    ),
    angle: growthAngle,
    charge: 0,
    depth: parentDepth + 1,
  };
  newEntities.set(newBudId, newBud);

  // Maybe add a leaf too (more likely at deeper levels)
  const leafChance = 0.4 + parentDepth * 0.1;
  const addLeaf = Math.random() < leafChance;
  let newLeafId: Id | null = null;

  if (addLeaf) {
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

  // Sometimes add a second bud (branching) - less likely at deeper levels
  const branchChance = Math.max(0.1, 0.4 - parentDepth * 0.1);
  const addBranch = Math.random() < branchChance;
  let branchBudId: Id | null = null;

  if (addBranch) {
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
      charge: 0.2, // Branch buds start with some charge
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

// === Prune Logic ===

function pruneNode(world: World, nodeId: Id): World | null {
  const node = world.entities.get(nodeId);
  if (!node || node.kind !== "plantNode") {
    return null;
  }

  // Find the plant this node belongs to
  let targetPlant: Plant | null = null;
  for (const plant of world.plants.values()) {
    if (plant.rootId === nodeId || plant.adjacency.has(nodeId)) {
      targetPlant = plant;
      break;
    }
  }
  if (!targetPlant) return null;

  // Can't prune the root
  if (targetPlant.rootId === nodeId) return null;

  // Find all nodes to remove (this node and descendants)
  const toRemove = new Set<Id>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    toRemove.add(current);
    const children = targetPlant.adjacency.get(current) || [];
    queue.push(...children);
  }

  // Remove from entities
  const newEntities = new Map(world.entities);
  for (const id of toRemove) {
    newEntities.delete(id);
  }

  // Update adjacency
  const newAdjacency = new Map<Id, Id[]>();
  for (const [parentId, childIds] of targetPlant.adjacency) {
    if (toRemove.has(parentId)) continue;

    // Filter out removed children
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

// === Branch Logic ===

function branchFromNode(world: World, nodeId: Id): World | null {
  const node = world.entities.get(nodeId);
  if (!node || node.kind !== "plantNode") {
    return null;
  }

  // Only stems can branch (not buds, leaves, or flowers)
  if (node.nodeKind !== "stem") {
    return null;
  }

  // Find the plant this node belongs to
  let targetPlant: Plant | null = null;
  for (const plant of world.plants.values()) {
    // Check both rootId and adjacency since root might not be in adjacency yet
    if (plant.rootId === nodeId || plant.adjacency.has(nodeId)) {
      targetPlant = plant;
      break;
    }
  }
  if (!targetPlant) {
    return null;
  }

  const parentDepth = node.depth ?? 0;
  const newEntities = new Map(world.entities);

  // Create a new branch bud
  const branchBudId = genId("node");
  
  // Get existing children and their angles
  const existingChildren = targetPlant.adjacency.get(nodeId) || [];
  const childAngles: number[] = [];
  
  for (const childId of existingChildren) {
    const child = world.entities.get(childId);
    if (child && child.kind === "plantNode") {
      childAngles.push(child.angle);
    }
  }
  
  // Find the best angle for the new branch - maximize distance from existing branches
  let branchAngle: number;
  
  if (childAngles.length === 0) {
    // No existing children, pick a random side perpendicular-ish to parent angle
    const branchSide = Math.random() > 0.5 ? 1 : -1;
    branchAngle = node.angle + branchSide * (0.5 + Math.random() * 0.5);
  } else {
    // Find the largest angular gap from existing children
    // Consider angles in a range around the parent's angle (roughly ±120 degrees)
    const minAngle = node.angle - Math.PI * 0.7;
    const maxAngle = node.angle + Math.PI * 0.7;
    
    // Normalize child angles to be relative to parent
    const normalizedAngles = childAngles.map(a => {
      // Bring angle into range relative to node.angle
      let diff = a - node.angle;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      return node.angle + diff;
    }).filter(a => a >= minAngle && a <= maxAngle);
    
    // Sort angles
    normalizedAngles.sort((a, b) => a - b);
    
    // Find the largest gap
    let bestAngle = node.angle + (Math.random() > 0.5 ? 0.6 : -0.6);
    let largestGap = 0;
    
    // Check gap from minAngle to first child
    if (normalizedAngles.length > 0) {
      const gapToFirst = normalizedAngles[0] - minAngle;
      if (gapToFirst > largestGap) {
        largestGap = gapToFirst;
        bestAngle = minAngle + gapToFirst / 2;
      }
      
      // Check gaps between consecutive children
      for (let i = 0; i < normalizedAngles.length - 1; i++) {
        const gap = normalizedAngles[i + 1] - normalizedAngles[i];
        if (gap > largestGap) {
          largestGap = gap;
          bestAngle = normalizedAngles[i] + gap / 2;
        }
      }
      
      // Check gap from last child to maxAngle
      const gapFromLast = maxAngle - normalizedAngles[normalizedAngles.length - 1];
      if (gapFromLast > largestGap) {
        largestGap = gapFromLast;
        bestAngle = normalizedAngles[normalizedAngles.length - 1] + gapFromLast / 2;
      }
    }
    
    // Add a small random offset to avoid perfectly mechanical placement
    branchAngle = bestAngle + (Math.random() - 0.5) * 0.2;
  }
  
  const branchLength = Math.max(10, 18 - parentDepth * 1.5) + Math.random() * 8;

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
    charge: 0.5, // Start half charged
    depth: parentDepth + 1,
  };
  newEntities.set(branchBudId, branchBud);

  // Update plant adjacency
  const newAdjacency = new Map(targetPlant.adjacency);
  const children = [...existingChildren, branchBudId];
  newAdjacency.set(nodeId, children);
  newAdjacency.set(branchBudId, []);

  const newPlants = new Map(world.plants);
  newPlants.set(targetPlant.id, { ...targetPlant, adjacency: newAdjacency });

  return {
    ...world,
    entities: newEntities,
    plants: newPlants,
  };
}

// === Particle Simulation (Fast Tick - 50ms) ===
// Handles smooth movement, rotation, and glow updates

function tickParticlesFast(world: World, dtMs: number): World {
  const newEntities = new Map(world.entities);
  let entitiesChanged = false;
  
  // Time scale factor (50ms = 0.05)
  const dt = dtMs / 1000;
  
  // Get time of day for firefly behavior
  const timeOfDay = world.dayCycle.timeOfDay;
  const isNight = timeOfDay < 0.25 || timeOfDay > 0.75;
  const isDusk = timeOfDay > 0.7 && timeOfDay < 0.8;

  // Find glowing entities for firefly attraction
  const glowingEntities: { id: Id; pos: Vec2; glow: number }[] = [];
  for (const entity of world.entities.values()) {
    if (entity.kind === "plantNode" && entity.nodeKind === "flower") {
      const plant = world.plants.get(entity.plantId);
      if (plant) {
        const island = world.entities.get(plant.islandId) as Island | undefined;
        if (island) {
          const cluster = world.clusters.get(island.clusterId);
          if (cluster) {
            const islandWorldPos = addVec2(cluster.pos, island.localPos);
            const flowerWorldPos = addVec2(islandWorldPos, entity.localPos);
            glowingEntities.push({ id: entity.id, pos: flowerWorldPos, glow: 0.8 });
          }
        }
      }
    }
    // Charged buds also glow
    if (entity.kind === "plantNode" && entity.nodeKind === "bud" && (entity.charge ?? 0) > 0.7) {
      const plant = world.plants.get(entity.plantId);
      if (plant) {
        const island = world.entities.get(plant.islandId) as Island | undefined;
        if (island) {
          const cluster = world.clusters.get(island.clusterId);
          if (cluster) {
            const islandWorldPos = addVec2(cluster.pos, island.localPos);
            const budWorldPos = addVec2(islandWorldPos, entity.localPos);
            glowingEntities.push({ id: entity.id, pos: budWorldPos, glow: (entity.charge ?? 0) * 0.5 });
          }
        }
      }
    }
  }

  // Find landing spots
  const landingSpots: { id: Id; pos: Vec2; kind: "rock" | "island" }[] = [];
  for (const entity of world.entities.values()) {
    if (entity.kind === "rock") {
      const island = world.entities.get(entity.islandId) as Island | undefined;
      if (island) {
        const cluster = world.clusters.get(island.clusterId);
        if (cluster) {
          const islandWorldPos = addVec2(cluster.pos, island.localPos);
          const rockWorldPos = addVec2(islandWorldPos, entity.localPos);
          landingSpots.push({ id: entity.id, pos: rockWorldPos, kind: "rock" });
        }
      }
    }
    if (entity.kind === "island") {
      const cluster = world.clusters.get(entity.clusterId);
      if (cluster) {
        const islandWorldPos = addVec2(cluster.pos, entity.localPos);
        landingSpots.push({ id: entity.id, pos: islandWorldPos, kind: "island" });
      }
    }
  }

  for (const [id, entity] of newEntities) {
    if (entity.kind !== "particle") continue;

    const particle = entity as Particle;
    let updated: Particle;
    
    // Increment age in fast ticks (20 per second at 50ms)
    const ageIncrement = 1;

    if (particle.particleKind === "seed") {
      updated = tickSeedFast(particle, dt, ageIncrement, landingSpots);
    } else {
      updated = tickFireflyFast(particle, dt, ageIncrement, isNight, isDusk, glowingEntities, landingSpots);
    }

    if (updated !== particle) {
      newEntities.set(id, updated);
      entitiesChanged = true;
    }
  }

  if (!entitiesChanged) return world;
  return { ...world, entities: newEntities };
}

// Fast tick for seed particles - smooth floating movement
function tickSeedFast(
  particle: Particle,
  dt: number,
  ageIncrement: number,
  landingSpots: { id: Id; pos: Vec2; kind: "rock" | "island" }[]
): Particle {
  let updated = { ...particle, age: particle.age + ageIncrement };
  
  if (particle.state !== "floating") {
    return updated;
  }

  // Continuous wind based on world time (smooth sinusoidal)
  const time = particle.age * 0.05; // Slow oscillation
  const windX = Math.sin(time * 0.7) * 8 + Math.sin(time * 1.3) * 4;
  const windY = Math.cos(time * 0.5) * 3 + Math.sin(time * 0.9) * 2;
  
  // Brownian noise (per-particle variation using position as seed)
  const noisePhase = particle.pos.x * 0.01 + particle.pos.y * 0.01;
  const brownianX = Math.sin(time * 3 + noisePhase) * 2;
  const brownianY = Math.cos(time * 2.7 + noisePhase * 1.3) * 1.5;
  
  // Gravity (gentle downward drift)
  const gravity = 1;

  // Update velocity with smooth forces
  const targetVelX = windX + brownianX;
  const targetVelY = windY + brownianY + gravity;
  
  // Smooth velocity interpolation (inertia)
  const velLerp = 0.02; // Slower interpolation = smoother movement
  const newVelX = particle.velocity.x + (targetVelX - particle.velocity.x) * velLerp;
  const newVelY = particle.velocity.y + (targetVelY - particle.velocity.y) * velLerp;
  
  // Cap speed
  const speed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
  const maxSpeed = 15;
  const cappedVelX = speed > maxSpeed ? (newVelX / speed) * maxSpeed : newVelX;
  const cappedVelY = speed > maxSpeed ? (newVelY / speed) * maxSpeed : newVelY;
  
  // Update position (dt scales the movement)
  const newPos = vec2(
    particle.pos.x + cappedVelX * dt,
    particle.pos.y + cappedVelY * dt
  );

  // Update rotation based on movement and wind
  // The tail should trail behind, so rotation follows velocity direction
  const targetRotation = Math.atan2(cappedVelY, cappedVelX) + Math.PI / 2; // Point tail in direction of travel
  const rotLerp = 0.08; // Smooth rotation interpolation
  
  // Interpolate rotation (handling angle wrapping)
  let rotDiff = targetRotation - particle.rotation;
  while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
  while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
  
  const newRotation = particle.rotation + rotDiff * rotLerp;
  
  // Add some wobble to angular velocity
  const wobble = Math.sin(time * 4 + noisePhase * 2) * 0.02;
  const newAngularVel = particle.angularVelocity * 0.95 + wobble;

  // Check for landing (with probability per fast tick)
  for (const spot of landingSpots) {
    const dx = newPos.x - spot.pos.x;
    const dy = newPos.y - spot.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const landingRadius = spot.kind === "rock" ? 40 : 60;
    
    if (distance < landingRadius && Math.random() < 0.001) {
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

// Fast tick for firefly particles - smooth flying and glowing
function tickFireflyFast(
  particle: Particle,
  dt: number,
  ageIncrement: number,
  isNight: boolean,
  isDusk: boolean,
  glowingEntities: { id: Id; pos: Vec2; glow: number }[],
  landingSpots: { id: Id; pos: Vec2; kind: "rock" | "island" }[]
): Particle {
  let updated = { ...particle, age: particle.age + ageIncrement };
  
  // Update glow (smooth pulsing at night)
  const time = particle.age * 0.05;
  let targetGlow = 0;
  if (isNight && particle.state === "floating") {
    // Bright pulsing glow at night when flying
    targetGlow = 0.7 + Math.sin(time * 2.5) * 0.3;
  } else if (isDusk && particle.state === "floating") {
    targetGlow = 0.3 + Math.sin(time * 2) * 0.2;
  }
  const newGlow = particle.glow + (targetGlow - particle.glow) * 0.1;

  if (particle.state === "landed") {
    // At night/dusk, fireflies may take off
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

  // Flying behavior
  if (particle.state === "floating") {
    // During day, try to land
    if (!isNight && !isDusk && Math.random() < 0.002) {
      for (const spot of landingSpots) {
        const dx = particle.pos.x - spot.pos.x;
        const dy = particle.pos.y - spot.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 150) {
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

    // Movement - attracted to glowing things at night
    let targetX = 0;
    let targetY = 0;
    
    if (isNight && glowingEntities.length > 0) {
      // Find nearest glowing entity
      let nearestGlow: { pos: Vec2 } | null = null;
      let nearestDist = Infinity;
      
      for (const glow of glowingEntities) {
        const dx = particle.pos.x - glow.pos.x;
        const dy = particle.pos.y - glow.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist && dist < 200) {
          nearestDist = dist;
          nearestGlow = glow;
        }
      }
      
      if (nearestGlow && nearestDist > 30) {
        // Orbit around the glow source
        const dx = nearestGlow.pos.x - particle.pos.x;
        const dy = nearestGlow.pos.y - particle.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Perpendicular + slight inward pull
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
    
    // Cap speed
    const speed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
    const maxSpeed = 25;
    const cappedVelX = speed > maxSpeed ? (newVelX / speed) * maxSpeed : newVelX;
    const cappedVelY = speed > maxSpeed ? (newVelY / speed) * maxSpeed : newVelY;
    
    const newPos = vec2(
      particle.pos.x + cappedVelX * dt,
      particle.pos.y + cappedVelY * dt
    );

    return {
      ...updated,
      pos: newPos,
      velocity: vec2(cappedVelX, cappedVelY),
      glow: newGlow,
    };
  }

  return { ...updated, glow: newGlow };
}

// === Particle Lifecycle (Slow Tick - 1s) ===
// Handles rooting decisions and cleanup

function tickParticleLifecycle(world: World): World {
  const newEntities = new Map(world.entities);
  let entitiesChanged = false;
  const particlesToRemove: Id[] = [];
  const plantsToAdd: { nodes: PlantNode[]; plant: Plant }[] = [];

  for (const [id, entity] of newEntities) {
    if (entity.kind !== "particle") continue;

    const particle = entity as Particle;

    // Age out old particles (age is in fast ticks, 20/sec, so 3000 = ~2.5 min)
    if (particle.age > 3000) {
      particlesToRemove.push(id);
      continue;
    }

    // Seeds can take root when landed
    if (particle.particleKind === "seed" && particle.state === "landed") {
      // After landing for ~25 seconds, chance to root
      if (particle.age > 500 && Math.random() < 0.02) {
        const landedEntity = particle.landedOn ? world.entities.get(particle.landedOn) : null;
        
        if (landedEntity && (landedEntity.kind === "rock" || landedEntity.kind === "island")) {
          const newPlant = createPlantFromSeed(particle, landedEntity, world);
          if (newPlant) {
            plantsToAdd.push(newPlant);
            particlesToRemove.push(id);
          }
        }
      }
    }
  }

  // Remove old particles
  for (const id of particlesToRemove) {
    newEntities.delete(id);
    entitiesChanged = true;
  }

  if (!entitiesChanged && plantsToAdd.length === 0) {
    return world;
  }

  let result = { ...world, entities: newEntities };

  // Add new plants from rooted seeds
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


function createPlantFromSeed(
  particle: Particle,
  landedOn: Rock | Island,
  world: World
): { nodes: PlantNode[]; plant: Plant } | null {
  // Find the island ID
  let islandId: Id;
  let localPos: Vec2;
  
  if (landedOn.kind === "rock") {
    islandId = landedOn.islandId;
    // Position relative to rock's island
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
  const growAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4; // Mostly upward

  const rootNode: PlantNode = {
    kind: "plantNode",
    id: rootId,
    plantId,
    nodeKind: "stem",
    localPos: localPos,
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

function tickFlowerSeeds(world: World): World {
  // Flowers occasionally release seeds
  const newEntities = new Map(world.entities);
  let changed = false;

  // Count existing seeds to limit total
  let seedCount = 0;
  for (const entity of world.entities.values()) {
    if (entity.kind === "particle" && entity.particleKind === "seed") {
      seedCount++;
    }
  }

  // Max 20 seeds at a time
  if (seedCount >= 20) return world;

  for (const entity of world.entities.values()) {
    if (entity.kind !== "plantNode" || entity.nodeKind !== "flower") continue;

    // Chance per tick to release a seed (~1% per second per flower)
    if (Math.random() > 0.01) continue;

    // Find world position of flower
    const plant = world.plants.get(entity.plantId);
    if (!plant) continue;
    const island = world.entities.get(plant.islandId) as Island | undefined;
    if (!island) continue;
    const cluster = world.clusters.get(island.clusterId);
    if (!cluster) continue;

    const islandWorldPos = addVec2(cluster.pos, island.localPos);
    const flowerWorldPos = addVec2(islandWorldPos, entity.localPos);

    // Create a seed particle
    const seed: Particle = {
      kind: "particle",
      id: genId("particle"),
      particleKind: "seed",
      state: "floating",
      pos: flowerWorldPos,
      velocity: vec2((Math.random() - 0.5) * 8, -Math.random() * 5 - 2), // Initial upward float
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

function tickFireflySpawning(world: World): World {
  const timeOfDay = world.dayCycle.timeOfDay;
  // Spawn during dusk and early night (0.7-0.9)
  const isDuskOrNight = timeOfDay > 0.7 || timeOfDay < 0.1;

  // Only spawn at dusk/night
  if (!isDuskOrNight) return world;

  // Count existing fireflies
  let fireflyCount = 0;
  for (const entity of world.entities.values()) {
    if (entity.kind === "particle" && entity.particleKind === "firefly") {
      fireflyCount++;
    }
  }

  // Max 15 fireflies
  if (fireflyCount >= 15) return world;

  // Spawn chance per tick during dusk/night (~5% per tick)
  if (Math.random() > 0.05) return world;

  // Spawn from a random rock or plant
  const spawnCandidates: Vec2[] = [];
  
  for (const entity of world.entities.values()) {
    if (entity.kind === "rock") {
      const island = world.entities.get(entity.islandId) as Island | undefined;
      if (island) {
        const cluster = world.clusters.get(island.clusterId);
        if (cluster) {
          const islandWorldPos = addVec2(cluster.pos, island.localPos);
          const rockWorldPos = addVec2(islandWorldPos, entity.localPos);
          spawnCandidates.push(rockWorldPos);
        }
      }
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

// === Helpers ===

function completeTutorialStep(
  tutorial: World["tutorial"],
  stepId: string
): World["tutorial"] {
  // Find the step in any section
  for (let sectionIndex = 0; sectionIndex < tutorial.sections.length; sectionIndex++) {
    const section = tutorial.sections[sectionIndex];
    const stepIndex = section.steps.findIndex((s) => s.id === stepId);
    
    if (stepIndex >= 0) {
      if (section.steps[stepIndex].completed) {
        return tutorial; // Already completed
      }
      
      const newSections = [...tutorial.sections];
      const newSteps = [...section.steps];
      newSteps[stepIndex] = { ...newSteps[stepIndex], completed: true };
      newSections[sectionIndex] = { ...section, steps: newSteps };
      
      return {
        ...tutorial,
        sections: newSections,
      };
    }
  }
  
  return tutorial; // Step not found
}
