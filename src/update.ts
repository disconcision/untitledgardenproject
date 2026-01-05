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
  scaleVec2,
  genId,
  PlantNode,
  Plant,
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

  // Simulation
  | { type: "tick"; dt: number }
  | { type: "pause" }
  | { type: "resume" }

  // Tutorial
  | { type: "tutorial/complete"; stepId: string }
  | { type: "tutorial/toggle" }
  | { type: "tutorial/dismiss" }

  // Debug
  | { type: "debug/toggleIds" }
  | { type: "debug/toggleHitTargets" }
  | { type: "debug/toggleFreeze" }
  | { type: "debug/regenerate"; seed: number };

// === Audio Event Hooks ===

export type AudioEvent =
  | { type: "sprout" }
  | { type: "prune" }
  | { type: "select" }
  | { type: "hover" }
  | { type: "pan" }
  | { type: "zoom" };

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

    // === Simulation ===
    case "tick": {
      if (world.time.paused || world.debug.freezeTime) {
        return world;
      }

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
          result = sproutResult;
        }
      }

      return {
        ...result,
        time: {
          ...result.time,
          t: result.time.t + msg.dt,
          dt: msg.dt,
        },
      };
    }

    case "pause":
      return { ...world, time: { ...world.time, paused: true } };

    case "resume":
      return { ...world, time: { ...world.time, paused: false } };

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

  // Find the plant
  let targetPlant: Plant | null = null;
  for (const plant of world.plants.values()) {
    if (plant.adjacency.has(nodeId)) {
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

// === Helpers ===

function completeTutorialStep(
  tutorial: World["tutorial"],
  stepId: string
): World["tutorial"] {
  const stepIndex = tutorial.steps.findIndex((s) => s.id === stepId);
  if (stepIndex < 0 || tutorial.steps[stepIndex].completed) {
    return tutorial;
  }

  const newSteps = [...tutorial.steps];
  newSteps[stepIndex] = { ...newSteps[stepIndex], completed: true };

  return {
    ...tutorial,
    steps: newSteps,
  };
}
