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
  | { type: "dayCycle/tick"; dtMs: number };

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
