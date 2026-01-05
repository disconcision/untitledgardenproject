/**
 * Hanging Garden — Update Function
 * 
 * Messages and state transitions.
 * MVU-style: update(msg, world) → world
 */

import { World, Id, Vec2, vec2, addVec2, scaleVec2 } from './model'

// === Messages ===

export type Msg =
  // Camera
  | { type: 'camera/pan'; delta: Vec2 }
  | { type: 'camera/zoom'; delta: number; center: Vec2 }
  | { type: 'camera/focus'; target: Vec2; zoom?: number }
  
  // Selection
  | { type: 'select'; id: Id | null }
  | { type: 'hover'; id: Id | null }
  
  // Interaction
  | { type: 'sprout'; budId: Id }
  | { type: 'prune'; nodeId: Id }
  
  // Simulation
  | { type: 'tick'; dt: number }
  | { type: 'pause' }
  | { type: 'resume' }
  
  // Tutorial
  | { type: 'tutorial/complete'; stepId: string }
  | { type: 'tutorial/toggle' }
  | { type: 'tutorial/dismiss' }
  
  // Debug
  | { type: 'debug/toggleIds' }
  | { type: 'debug/toggleHitTargets' }
  | { type: 'debug/toggleFreeze' }
  | { type: 'debug/regenerate'; seed: number }

// === Audio Event Hooks ===
// These are triggered by interactions for future sound integration

export type AudioEvent =
  | { type: 'sprout' }
  | { type: 'prune' }
  | { type: 'select' }
  | { type: 'hover' }
  | { type: 'pan' }
  | { type: 'zoom' }

// Placeholder for audio system - will be wired up later
const audioEventListeners: ((event: AudioEvent) => void)[] = []

export function onAudioEvent(listener: (event: AudioEvent) => void): () => void {
  audioEventListeners.push(listener)
  return () => {
    const idx = audioEventListeners.indexOf(listener)
    if (idx >= 0) audioEventListeners.splice(idx, 1)
  }
}

function emitAudioEvent(event: AudioEvent): void {
  audioEventListeners.forEach((l: (event: AudioEvent) => void) => l(event))
}

// === Update Function ===

export function update(msg: Msg, world: World): World {
  switch (msg.type) {
    // === Camera ===
    case 'camera/pan': {
      emitAudioEvent({ type: 'pan' })
      return {
        ...world,
        camera: {
          ...world.camera,
          pan: addVec2(world.camera.pan, msg.delta),
        },
        tutorial: completeTutorialStep(world.tutorial, 'pan'),
      }
    }

    case 'camera/zoom': {
      emitAudioEvent({ type: 'zoom' })
      const minZoom = 0.25
      const maxZoom = 4
      const newZoom = Math.max(minZoom, Math.min(maxZoom, world.camera.zoom * (1 + msg.delta)))
      
      // Zoom toward center point
      const zoomRatio = newZoom / world.camera.zoom
      const panOffset = scaleVec2(
        { x: msg.center.x - world.camera.pan.x, y: msg.center.y - world.camera.pan.y },
        1 - zoomRatio
      )
      
      return {
        ...world,
        camera: {
          pan: addVec2(world.camera.pan, panOffset),
          zoom: newZoom,
        },
        tutorial: completeTutorialStep(world.tutorial, 'zoom'),
      }
    }

    case 'camera/focus': {
      return {
        ...world,
        camera: {
          pan: vec2(-msg.target.x, -msg.target.y),
          zoom: msg.zoom ?? world.camera.zoom,
        },
        tutorial: completeTutorialStep(world.tutorial, 'focus'),
      }
    }

    // === Selection ===
    case 'select': {
      if (msg.id !== world.selection) {
        emitAudioEvent({ type: 'select' })
      }
      return {
        ...world,
        selection: msg.id,
      }
    }

    case 'hover': {
      if (msg.id !== world.hover && msg.id !== null) {
        emitAudioEvent({ type: 'hover' })
      }
      return {
        ...world,
        hover: msg.id,
      }
    }

    // === Interaction ===
    case 'sprout': {
      emitAudioEvent({ type: 'sprout' })
      // TODO: Implement sprouting logic
      return {
        ...world,
        tutorial: completeTutorialStep(world.tutorial, 'sprout'),
      }
    }

    case 'prune': {
      emitAudioEvent({ type: 'prune' })
      // TODO: Implement pruning logic
      return {
        ...world,
        tutorial: completeTutorialStep(world.tutorial, 'prune'),
      }
    }

    // === Simulation ===
    case 'tick': {
      if (world.time.paused || world.debug.freezeTime) {
        return world
      }
      return {
        ...world,
        time: {
          ...world.time,
          t: world.time.t + msg.dt,
          dt: msg.dt,
        },
        // TODO: Run simulation tick (charge buds, sway, etc.)
      }
    }

    case 'pause':
      return { ...world, time: { ...world.time, paused: true } }

    case 'resume':
      return { ...world, time: { ...world.time, paused: false } }

    // === Tutorial ===
    case 'tutorial/complete': {
      return {
        ...world,
        tutorial: completeTutorialStep(world.tutorial, msg.stepId),
      }
    }

    case 'tutorial/toggle':
      return {
        ...world,
        tutorial: { ...world.tutorial, visible: !world.tutorial.visible },
      }

    case 'tutorial/dismiss':
      return {
        ...world,
        tutorial: { ...world.tutorial, visible: false },
      }

    // === Debug ===
    case 'debug/toggleIds':
      return {
        ...world,
        debug: { ...world.debug, showIds: !world.debug.showIds },
      }

    case 'debug/toggleHitTargets':
      return {
        ...world,
        debug: { ...world.debug, showHitTargets: !world.debug.showHitTargets },
      }

    case 'debug/toggleFreeze':
      return {
        ...world,
        debug: { ...world.debug, freezeTime: !world.debug.freezeTime },
      }

    case 'debug/regenerate':
      // Will be handled by App - triggers full regeneration
      return world

    default:
      return world
  }
}

// === Helpers ===

function completeTutorialStep(
  tutorial: World['tutorial'],
  stepId: string
): World['tutorial'] {
  const stepIndex = tutorial.steps.findIndex((s) => s.id === stepId)
  if (stepIndex < 0 || tutorial.steps[stepIndex].completed) {
    return tutorial
  }
  
  const newSteps = [...tutorial.steps]
  newSteps[stepIndex] = { ...newSteps[stepIndex], completed: true }
  
  return {
    ...tutorial,
    steps: newSteps,
  }
}

