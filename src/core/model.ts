/**
 * Hanging Garden — Data Model (Core)
 *
 * Pure types and functions. No React/DOM dependencies.
 * Can run in Node or browser.
 */

// === Core Types ===

export type Id = string;

export type Vec2 = {
  x: number;
  y: number;
};

// === Entities ===

export type Island = {
  kind: "island";
  id: Id;
  pos: Vec2;
  radius: number;
  shape: Vec2[];
  depth: number;
};

export type Rock = {
  kind: "rock";
  id: Id;
  islandId: Id;
  localPos: Vec2;
  size: number;
  rotation: number;
};

export type PlantNodeKind = "bud" | "stem" | "leaf" | "flower";

export type PlantNode = {
  kind: "plantNode";
  id: Id;
  plantId: Id;
  nodeKind: PlantNodeKind;
  localPos: Vec2;
  angle: number;
  charge?: number;
};

export type Vine = {
  kind: "vine";
  id: Id;
  fromId: Id;
  toId: Id;
  tension: number;
};

export type Entity = Island | Rock | PlantNode | Vine;

// === Plant Structure ===

export type Plant = {
  id: Id;
  islandId: Id;
  rootId: Id;
  adjacency: Map<Id, Id[]>;
};

// === Camera ===

export type Camera = {
  pan: Vec2;
  zoom: number;
};

// === Tutorial ===

export type TutorialStep = {
  id: string;
  instruction: string;
  completed: boolean;
  focusTarget?: Id;
};

// === World State ===

export type World = {
  entities: Map<Id, Entity>;
  plants: Map<Id, Plant>;
  camera: Camera;
  time: {
    t: number;
    dt: number;
    paused: boolean;
  };
  selection: Id | null;
  hover: Id | null;
  tutorial: {
    visible: boolean;
    steps: TutorialStep[];
  };
  debug: {
    showIds: boolean;
    showHitTargets: boolean;
    freezeTime: boolean;
  };
  seed: number;
};

// === Vector Helpers ===

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function addVec2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subVec2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scaleVec2(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function lenVec2(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalizeVec2(v: Vec2): Vec2 {
  const len = lenVec2(v);
  return len > 0 ? scaleVec2(v, 1 / len) : { x: 0, y: 0 };
}

// === ID Generation ===

let idCounter = 0;

export function genId(prefix: string = "e"): Id {
  return `${prefix}-${++idCounter}`;
}

export function resetIdCounter(value: number = 0): void {
  idCounter = value;
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
          id: "pan",
          instruction: "Drag the background to pan around the garden",
          completed: false,
        },
        {
          id: "zoom",
          instruction: "Scroll to zoom in and out",
          completed: false,
        },
        {
          id: "sprout",
          instruction: "Click a glowing bud to sprout a new branch",
          completed: false,
        },
        {
          id: "prune",
          instruction: "Click a leaf to prune it",
          completed: false,
        },
        {
          id: "focus",
          instruction: "Double-click an island to focus on it",
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
  };
}

// === World Inspection (for CLI tools) ===

export function summarizeWorld(world: World): {
  seed: number;
  entityCount: number;
  islandCount: number;
  plantCount: number;
  rockCount: number;
  nodeCount: number;
} {
  let islandCount = 0;
  let rockCount = 0;
  let nodeCount = 0;

  for (const entity of world.entities.values()) {
    switch (entity.kind) {
      case "island":
        islandCount++;
        break;
      case "rock":
        rockCount++;
        break;
      case "plantNode":
        nodeCount++;
        break;
    }
  }

  return {
    seed: world.seed,
    entityCount: world.entities.size,
    islandCount,
    plantCount: world.plants.size,
    rockCount,
    nodeCount,
  };
}

