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

import { World, Id, Vec2, vec2, addVec2, scaleVec2 } from "./model";
import { sproutBud, pruneNode, branchFromNode } from "./core/actions";
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

  // Interaction
  | { type: "sprout"; budId: Id }
  | { type: "prune"; nodeId: Id }
  | { type: "trim"; nodeId: Id }
  | { type: "branch"; nodeId: Id }

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

    // === Plant Interactions ===
    case "sprout":
      return handleSprout(world, msg.budId);

    case "prune":
      return handlePrune(world, msg.nodeId);

    case "trim":
      return handleTrim(world, msg.nodeId);

    case "branch":
      return handleBranch(world, msg.nodeId);

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
      return world;

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

// === Context Menu Handlers ===

function handleContextMenuOpen(
  world: World,
  nodeId: Id,
  screenPos: Vec2,
  worldPos: Vec2
): World {
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
  const clamped = Math.max(30000, Math.min(1800000, dayLengthMs));
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
