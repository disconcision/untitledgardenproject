/**
 * Hanging Garden — Data Model
 * 
 * The world state. Entities with stable identity,
 * overlapping structures, camera, simulation time.
 */

// === Core Types ===

export type Id = string

export type Vec2 = {
  x: number
  y: number
}

// === Entities ===

export type Island = {
  kind: 'island'
  id: Id
  pos: Vec2
  radius: number
  // Shape will be defined by control points for organic blobs
  shape: Vec2[]
  depth: number  // pseudo-z for parallax
}

export type Rock = {
  kind: 'rock'
  id: Id
  islandId: Id
  localPos: Vec2
  size: number
  rotation: number
}

export type PlantNodeKind = 'bud' | 'stem' | 'leaf' | 'flower'

export type PlantNode = {
  kind: 'plantNode'
  id: Id
  plantId: Id
  nodeKind: PlantNodeKind
  localPos: Vec2      // relative to island
  angle: number       // growth direction
  charge?: number     // for buds: 0-1, ready to sprout when 1
}

export type Vine = {
  kind: 'vine'
  id: Id
  fromId: Id
  toId: Id
  tension: number
}

export type Entity = Island | Rock | PlantNode | Vine

// === Plant Structure ===

export type Plant = {
  id: Id
  islandId: Id
  rootId: Id
  adjacency: Map<Id, Id[]>  // parent → children
}

// === Camera ===

export type Camera = {
  pan: Vec2
  zoom: number
}

// === Tutorial ===

export type TutorialStep = {
  id: string
  instruction: string
  completed: boolean
  // Optional: focus target for "Take me there"
  focusTarget?: Id
}

// === World State ===

export type World = {
  entities: Map<Id, Entity>
  plants: Map<Id, Plant>
  camera: Camera
  time: {
    t: number       // total elapsed time (ms)
    dt: number      // delta since last tick
    paused: boolean
  }
  selection: Id | null
  hover: Id | null
  tutorial: {
    visible: boolean
    steps: TutorialStep[]
  }
  debug: {
    showIds: boolean
    showHitTargets: boolean
    freezeTime: boolean
  }
  seed: number
}

// === Helpers ===

export function vec2(x: number, y: number): Vec2 {
  return { x, y }
}

export function addVec2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function subVec2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function scaleVec2(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s }
}

export function lenVec2(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y)
}

export function normalizeVec2(v: Vec2): Vec2 {
  const len = lenVec2(v)
  return len > 0 ? scaleVec2(v, 1 / len) : { x: 0, y: 0 }
}

// === ID Generation ===

let idCounter = 0

export function genId(prefix: string = 'e'): Id {
  return `${prefix}-${++idCounter}`
}

export function resetIdCounter(value: number = 0): void {
  idCounter = value
}

// === Initial State ===

export function createInitialWorld(seed: number): World {
  return {
    entities: new Map(),
    plants: new Map(),
    camera: {
      pan: vec2(0, 0),
      zoom: 1,
    },
    time: {
      t: 0,
      dt: 0,
      paused: false,
    },
    selection: null,
    hover: null,
    tutorial: {
      visible: true,
      steps: [
        {
          id: 'pan',
          instruction: 'Drag the background to pan around the garden',
          completed: false,
        },
        {
          id: 'zoom',
          instruction: 'Scroll to zoom in and out',
          completed: false,
        },
        {
          id: 'sprout',
          instruction: 'Click a glowing bud to sprout a new branch',
          completed: false,
        },
        {
          id: 'prune',
          instruction: 'Click a leaf to prune it',
          completed: false,
        },
        {
          id: 'focus',
          instruction: 'Double-click an island to focus on it',
          completed: false,
        },
      ],
    },
    debug: {
      showIds: false,
      showHitTargets: false,
      freezeTime: false,
    },
    seed,
  }
}

