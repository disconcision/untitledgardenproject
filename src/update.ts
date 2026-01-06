/**
 * Hanging Garden — Update Function
 *
 * Messages and state transitions.
 * MVU-style: update(msg, world) → world
 *
 * This is the central dispatcher. Complex logic is delegated to:
 * - core/actions/plant.ts — sprout, prune, branch
 * - core/simulation/particles.ts — particle movement and lifecycle
 * - core/tutorial.ts — tutorial step completion
 */

import { World, Id, Vec2, vec2, addVec2, scaleVec2, DriftingPiece, genId } from "./model";
import { sproutBud, pruneNode, branchFromNode, cutSubtree, graftSubtree } from "./core/actions";
import {
  tickParticlesFast,
  tickParticleLifecycle,
  tickFlowerSeeds,
  tickFireflySpawning,
} from "./core/simulation";
import { completeTutorialStep } from "./core/tutorial";

// === Messages ===

export type Msg =
  // Camera
  | { type: "camera/pan"; delta: Vec2 }
  | { type: "camera/zoom"; delta: number; center: Vec2 }
  | { type: "camera/focus"; target: Vec2; zoom?: number }

  // Selection
  | { type: "select"; id: Id | null }
  | { type: "hover"; id: Id | null }
  | { type: "pathway/hover"; id: Id | null }

  // Interaction
  | { type: "sprout"; budId: Id }
  | { type: "prune"; nodeId: Id }
  | { type: "trim"; nodeId: Id }
  | { type: "branch"; nodeId: Id }

  // Cut/Graft
  | { type: "cut"; nodeId: Id; islandWorldPos: Vec2 }
  | { type: "graft"; targetNodeId: Id }
  | { type: "release" }
  | { type: "cursor/move"; worldPos: Vec2 }
  | { type: "drift/tick"; dtMs: number }

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
  | { type: "debug/toggleForceField" }
  | { type: "debug/regenerate"; seed: number }

  // Performance
  | { type: "fps/update"; fps: number }

  // Panels
  | { type: "panel/openInspector" }
  | { type: "panel/openDebug" }
  | { type: "panel/openTime" }
  | { type: "panel/openTutorial" }

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
  | { type: "cut" }
  | { type: "graft" }
  | { type: "release" }
  | { type: "select" }
  | { type: "hover" }
  | { type: "pan" }
  | { type: "zoom" }
  | { type: "menuOpen" }
  | { type: "menuClose" };

const audioEventListeners: ((event: AudioEvent) => void)[] = [];

export function onAudioEvent(listener: (event: AudioEvent) => void): () => void {
  audioEventListeners.push(listener);
  return (): void => {
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
    case "camera/pan":
      return handleCameraPan(world, msg.delta);

    case "camera/zoom":
      return handleCameraZoom(world, msg.delta, msg.center);

    case "camera/focus":
      return handleCameraFocus(world, msg.target, msg.zoom);

    // === Selection ===
    case "select":
      return handleSelect(world, msg.id);

    case "hover":
      return handleHover(world, msg.id);

    case "pathway/hover":
      return { ...world, hoveredPathway: msg.id };

    // === Plant Interactions ===
    case "sprout":
      return handleSprout(world, msg.budId);

    case "prune":
      return handlePrune(world, msg.nodeId);

    case "trim":
      return handleTrim(world, msg.nodeId);

    case "branch":
      return handleBranch(world, msg.nodeId);

    // === Cut/Graft ===
    case "cut":
      return handleCut(world, msg.nodeId, msg.islandWorldPos);

    case "graft":
      return handleGraft(world, msg.targetNodeId);

    case "release":
      return handleRelease(world);

    case "cursor/move":
      return handleCursorMove(world, msg.worldPos);

    case "drift/tick":
      return handleDriftTick(world, msg.dtMs);

    // === Context Menu ===
    case "contextMenu/open":
      return handleContextMenuOpen(world, msg.nodeId, msg.screenPos, msg.worldPos);

    case "contextMenu/close":
      return handleContextMenuClose(world);

    // === Simulation ===
    case "tick":
      return handleSimulationTick(world, msg.dt);

    case "particle/tick":
      return tickParticlesFast(world, msg.dtMs);

    // === Tutorial ===
    case "tutorial/complete":
      return {
        ...world,
        tutorial: completeTutorialStep(world.tutorial, msg.stepId),
      };

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

    case "debug/toggleForceField":
      return {
        ...world,
        debug: { ...world.debug, showForceField: !world.debug.showForceField },
      };

    case "debug/regenerate":
      return world;

    // === Performance ===
    case "fps/update":
      return { ...world, fps: msg.fps };

    // === Panels ===
    case "panel/openInspector":
      return {
        ...world,
        focusedPanel: "inspector",
        tutorial: completeTutorialStep(world.tutorial, "inspector"),
      };

    case "panel/openDebug":
      return {
        ...world,
        focusedPanel: "debug",
        tutorial: completeTutorialStep(world.tutorial, "debug"),
      };

    case "panel/openTime":
      return {
        ...world,
        focusedPanel: "time",
      };

    case "panel/openTutorial":
      return {
        ...world,
        focusedPanel: "tutorial",
      };

    // === Day Cycle ===
    case "dayCycle/setTime":
      return handleDayCycleSetTime(world, msg.timeOfDay);

    case "dayCycle/setDayLength":
      return handleDayCycleSetDayLength(world, msg.dayLengthMs);

    case "dayCycle/toggleRunning":
      return handleDayCycleToggle(world);

    case "dayCycle/tick":
      return handleDayCycleTick(world, msg.dtMs);

    default: {
      // Exhaustive check — will cause compile error if new Msg type is added
      const _exhaustive: never = msg;
      void _exhaustive;
      return world;
    }
  }
}

// === Camera Handlers ===

function handleCameraPan(world: World, delta: Vec2): World {
  emitAudioEvent({ type: "pan" });
  return {
    ...world,
    camera: {
      ...world.camera,
      pan: addVec2(world.camera.pan, delta),
    },
    tutorial: completeTutorialStep(world.tutorial, "pan"),
  };
}

function handleCameraZoom(world: World, delta: number, center: Vec2): World {
  emitAudioEvent({ type: "zoom" });
  const minZoom = 0.25;
  const maxZoom = 4;
  const newZoom = Math.max(minZoom, Math.min(maxZoom, world.camera.zoom * (1 + delta)));

  const zoomRatio = newZoom / world.camera.zoom;
  const panOffset = scaleVec2(
    {
      x: center.x - world.camera.pan.x,
      y: center.y - world.camera.pan.y,
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

function handleCameraFocus(world: World, target: Vec2, zoom?: number): World {
  return {
    ...world,
    camera: {
      pan: vec2(-target.x, -target.y),
      zoom: zoom ?? world.camera.zoom,
    },
    tutorial: completeTutorialStep(world.tutorial, "focus"),
  };
}

// === Selection Handlers ===

function handleSelect(world: World, id: Id | null): World {
  if (id !== world.selection) {
    emitAudioEvent({ type: "select" });
  }
  return { ...world, selection: id };
}

function handleHover(world: World, id: Id | null): World {
  if (id !== world.hover && id !== null) {
    emitAudioEvent({ type: "hover" });
  }
  return { ...world, hover: id };
}

// === Plant Action Handlers ===

function handleSprout(world: World, budId: Id): World {
  const result = sproutBud(world, budId);
  if (result) {
    emitAudioEvent({ type: "sprout" });
    return {
      ...result,
      tutorial: completeTutorialStep(result.tutorial, "sprout"),
    };
  }
  return world;
}

function handlePrune(world: World, nodeId: Id): World {
  const result = pruneNode(world, nodeId);
  if (result) {
    emitAudioEvent({ type: "prune" });
    return {
      ...result,
      tutorial: completeTutorialStep(result.tutorial, "prune"),
    };
  }
  return world;
}

function handleTrim(world: World, nodeId: Id): World {
  const result = pruneNode(world, nodeId);
  if (result) {
    emitAudioEvent({ type: "trim" });
    return {
      ...result,
      contextMenu: null,
      tutorial: completeTutorialStep(result.tutorial, "context"),
    };
  }
  return { ...world, contextMenu: null };
}

function handleBranch(world: World, nodeId: Id): World {
  const result = branchFromNode(world, nodeId);
  if (result) {
    emitAudioEvent({ type: "branch" });
    return {
      ...result,
      contextMenu: null,
      tutorial: completeTutorialStep(result.tutorial, "context"),
    };
  }
  return { ...world, contextMenu: null };
}

// === Cut/Graft Handlers ===

function handleCut(world: World, nodeId: Id, islandWorldPos: Vec2): World {
  const result = cutSubtree(world, nodeId, islandWorldPos);
  if (result) {
    emitAudioEvent({ type: "cut" });
    let tutorial = completeTutorialStep(result.world.tutorial, "context");
    tutorial = completeTutorialStep(tutorial, "cut");
    return {
      ...result.world,
      carriedSubtree: result.subtree,
      contextMenu: null,
      tutorial,
    };
  }
  return { ...world, contextMenu: null };
}

function handleGraft(world: World, targetNodeId: Id): World {
  if (!world.carriedSubtree) return world;

  const result = graftSubtree(world, targetNodeId, world.carriedSubtree);
  if (result) {
    emitAudioEvent({ type: "graft" });
    return {
      ...result,
      carriedSubtree: null,
      tutorial: completeTutorialStep(result.tutorial, "graft"),
    };
  }
  return world;
}

function handleRelease(world: World): World {
  if (!world.carriedSubtree) return world;

  emitAudioEvent({ type: "release" });

  // Complete tutorial step
  const tutorial = completeTutorialStep(world.tutorial, "release");

  // Convert carried subtree nodes into drifting pieces
  const driftingPieces: DriftingPiece[] = world.carriedSubtree.nodes.map((node) => {
    // Calculate world position for the node
    const worldPos = addVec2(world.cursorWorldPos, {
      x:
        node.localPos.x -
        (world.carriedSubtree!.nodes.find((n) => n.id === world.carriedSubtree!.rootId)?.localPos
          .x ?? 0),
      y:
        node.localPos.y -
        (world.carriedSubtree!.nodes.find((n) => n.id === world.carriedSubtree!.rootId)?.localPos
          .y ?? 0),
    });

    // Random drift velocity (spread outward from center)
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.5;

    return {
      id: genId("drift"),
      node,
      pos: worldPos,
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      opacity: 1,
      age: 0,
    };
  });

  return {
    ...world,
    carriedSubtree: null,
    driftingPieces: [...world.driftingPieces, ...driftingPieces],
    tutorial,
  };
}

function handleCursorMove(world: World, worldPos: Vec2): World {
  return {
    ...world,
    cursorWorldPos: worldPos,
  };
}

function handleDriftTick(world: World, dtMs: number): World {
  if (world.driftingPieces.length === 0) return world;

  const dt = dtMs / 1000; // Convert to seconds
  const fadeRate = 0.5; // Opacity fade per second
  const maxAge = 120; // Frames before removal

  const updatedPieces: DriftingPiece[] = [];

  for (const piece of world.driftingPieces) {
    const newAge = piece.age + 1;
    const newOpacity = Math.max(0, piece.opacity - fadeRate * dt);

    // Remove pieces that have faded out or are too old
    if (newOpacity <= 0 || newAge >= maxAge) {
      continue;
    }

    // Update position with drift velocity (slow down over time)
    const damping = 0.98;
    const newVelocity = {
      x: piece.velocity.x * damping,
      y: piece.velocity.y * damping,
    };

    updatedPieces.push({
      ...piece,
      pos: addVec2(piece.pos, scaleVec2(piece.velocity, dt * 60)), // 60fps base
      velocity: newVelocity,
      opacity: newOpacity,
      age: newAge,
    });
  }

  return {
    ...world,
    driftingPieces: updatedPieces,
  };
}

// === Context Menu Handlers ===

function handleContextMenuOpen(world: World, nodeId: Id, screenPos: Vec2, worldPos: Vec2): World {
  emitAudioEvent({ type: "menuOpen" });
  return {
    ...world,
    contextMenu: { nodeId, screenPos, worldPos },
  };
}

function handleContextMenuClose(world: World): World {
  if (world.contextMenu) {
    emitAudioEvent({ type: "menuClose" });
  }
  return { ...world, contextMenu: null };
}

// === Simulation Tick Handler ===

function handleSimulationTick(world: World, dt: number): World {
  let result = world;

  // Charge buds and occasionally auto-sprout
  result = tickBudCharging(result);

  // Particle lifecycle (rooting, cleanup)
  result = tickParticleLifecycle(result);

  // Spawn seeds from flowers
  result = tickFlowerSeeds(result);

  // Spawn fireflies at dusk/night
  result = tickFireflySpawning(result);

  return {
    ...result,
    time: {
      ...result.time,
      t: result.time.t + dt,
      dt: dt,
    },
  };
}

/**
 * Charge buds over time and auto-sprout fully charged ones.
 */
function tickBudCharging(world: World): World {
  const newEntities = new Map(world.entities);
  let entitiesChanged = false;
  const budsToSprout: Id[] = [];

  for (const [id, entity] of newEntities) {
    if (entity.kind === "plantNode" && entity.nodeKind === "bud") {
      const currentCharge = entity.charge ?? 0;
      if (currentCharge < 1) {
        const chargeRate = 0.02 + Math.random() * 0.01;
        const newCharge = Math.min(1, currentCharge + chargeRate);
        newEntities.set(id, { ...entity, charge: newCharge });
        entitiesChanged = true;
      } else if (Math.random() < 0.05) {
        budsToSprout.push(id);
      }
    }
  }

  let result = entitiesChanged ? { ...world, entities: newEntities } : world;

  // Auto-sprout one charged bud per tick
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

  return result;
}

// === Day Cycle Handlers ===

function handleDayCycleSetTime(world: World, timeOfDay: number): World {
  return {
    ...world,
    dayCycle: {
      ...world.dayCycle,
      timeOfDay: Math.max(0, Math.min(1, timeOfDay)),
    },
    tutorial: completeTutorialStep(world.tutorial, "time-scrub"),
  };
}

function handleDayCycleSetDayLength(world: World, dayLengthMs: number): World {
  // Allow short day lengths for testing (5s min), cap at 30 minutes
  const clamped = Math.max(5000, Math.min(1800000, dayLengthMs));
  return {
    ...world,
    dayCycle: {
      ...world.dayCycle,
      dayLengthMs: clamped,
    },
  };
}

function handleDayCycleToggle(world: World): World {
  return {
    ...world,
    dayCycle: {
      ...world.dayCycle,
      running: !world.dayCycle.running,
    },
    tutorial: completeTutorialStep(world.tutorial, "time-pause"),
  };
}

function handleDayCycleTick(world: World, dtMs: number): World {
  if (!world.dayCycle.running) return world;

  const fractionOfDay = dtMs / world.dayCycle.dayLengthMs;
  let newTimeOfDay = world.dayCycle.timeOfDay + fractionOfDay;

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
