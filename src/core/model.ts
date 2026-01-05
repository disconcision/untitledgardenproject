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

// === Cluster ===
// A cluster is a grouping of islands/rocks/plants with a central glyph

export type Cluster = {
  id: Id;
  pos: Vec2; // World position of cluster center
  glyphKind: "seed" | "node" | "sigil"; // Visual representation
  // Optional: rotation for slow orbital drift
  rotation: number;
  // All islands in this cluster are positioned relative to this
};

// === Entities ===

export type Island = {
  kind: "island";
  id: Id;
  clusterId: Id; // Which cluster this belongs to
  localPos: Vec2; // Position relative to cluster center
  radius: number;
  shape: Vec2[];
  depth: number;
};

// A boulder is a single stone within a rock formation
export type Boulder = {
  localPos: Vec2; // relative to rock formation center
  size: number;
  rotation: number;
  sides: number; // polygon complexity
  irregularity: number; // how jagged (0 = smooth, 1 = very irregular)
};

// A rock formation is a compound structure of multiple boulders
export type Rock = {
  kind: "rock";
  id: Id;
  islandId: Id;
  localPos: Vec2; // formation center, relative to island
  boulders: Boulder[]; // compound structure
  // Cracks/seams where dirt accumulates and plants can grow
  cracks: Vec2[];
};

export type PlantNodeKind = "bud" | "stem" | "leaf" | "flower";

// === Particles ===
// Free-floating, single-node entities: seeds, pollen, fireflies, etc.

export type ParticleKind = "seed" | "firefly";

export type ParticleState =
  | "floating" // Moving through the air
  | "landed" // Resting on a surface
  | "rooting"; // Seed taking root (becoming a plant)

export type Particle = {
  kind: "particle";
  id: Id;
  particleKind: ParticleKind;
  state: ParticleState;
  pos: Vec2; // World position
  velocity: Vec2; // Current velocity
  // Rotation angle for visual orientation
  rotation: number;
  // Angular velocity for smooth rotation
  angularVelocity: number;
  // For seeds: which flower/plant spawned it
  sourceId?: Id;
  // For fireflies: which entity they're orbiting/attracted to
  targetId?: Id;
  // Glow intensity (0-1), used for firefly bioluminescence
  glow: number;
  // Age in frames (fast tick), for lifecycle management
  age: number;
  // Landing target (rock/island id) when landed
  landedOn?: Id;
};

export type PlantNode = {
  kind: "plantNode";
  id: Id;
  plantId: Id;
  nodeKind: PlantNodeKind;
  localPos: Vec2;
  angle: number;
  charge?: number;
  // Depth in plant tree (0 = root, increases outward)
  // Used for bark-like thickness gradient
  depth: number;
};

export type Vine = {
  kind: "vine";
  id: Id;
  fromId: Id;
  toId: Id;
  tension: number;
};

export type Entity = Island | Rock | PlantNode | Vine | Particle;

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

// === Day Cycle ===

export type DayCycle = {
  // Current time of day (0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset)
  timeOfDay: number;
  // Length of a full day in milliseconds (default: 3 minutes = 180000ms)
  dayLengthMs: number;
  // Whether the day cycle is advancing
  running: boolean;
};

// === Tutorial ===

export type TutorialStep = {
  id: string;
  instruction: string;
  completed: boolean;
  focusTarget?: Id;
  isNew?: boolean; // Highlights recently added features
};

export type TutorialSection = {
  id: string;
  title: string;
  steps: TutorialStep[];
  defaultExpanded: boolean;
  isNew?: boolean; // Entire section is new
};

// === Context Menu ===

export type ContextMenu = {
  nodeId: Id;
  // Screen position for the menu
  screenPos: Vec2;
  // World position of the node (for rendering offset)
  worldPos: Vec2;
} | null;

// === World State ===

export type World = {
  clusters: Map<Id, Cluster>;
  entities: Map<Id, Entity>;
  plants: Map<Id, Plant>;
  camera: Camera;
  time: {
    t: number;
    dt: number;
  };
  dayCycle: DayCycle;
  selection: Id | null;
  hover: Id | null;
  contextMenu: ContextMenu;
  tutorial: {
    visible: boolean;
    sections: TutorialSection[];
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
    clusters: new Map(),
    entities: new Map(),
    plants: new Map(),
    camera: {
      pan: vec2(0, 0),
      zoom: 1,
    },
    time: {
      t: 0,
      dt: 0,
    },
    selection: null,
    hover: null,
    contextMenu: null,
    tutorial: {
      visible: true,
      sections: [
        {
          id: "navigation",
          title: "Navigation",
          defaultExpanded: true,
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
              id: "focus",
              instruction: "Double-click an island to focus on it",
              completed: false,
            },
          ],
        },
        {
          id: "plants",
          title: "Plants",
          defaultExpanded: true,
          steps: [
            {
              id: "sprout",
              instruction: "Click a glowing bud to sprout a new branch",
              completed: false,
            },
            {
              id: "context",
              instruction: "Right-click a stem to branch or trim",
              completed: false,
            },
          ],
        },
        {
          id: "simulation",
          title: "Simulation",
          defaultExpanded: true,
          steps: [
            {
              id: "time-pause",
              instruction: "Open the clock panel (⏱) and pause/play to control time",
              completed: false,
            },
            {
              id: "time-scrub",
              instruction: "Drag the time slider to jump to any time of day",
              completed: false,
            },
            {
              id: "watch-grow",
              instruction: "Watch plants grow automatically when simulation runs",
              completed: false,
            },
          ],
        },
        {
          id: "panels",
          title: "Panels",
          defaultExpanded: false,
          steps: [
            {
              id: "inspector",
              instruction: "Open the tree panel (🌳) to inspect world structure",
              completed: false,
            },
            {
              id: "debug",
              instruction: "Open the settings panel (⚙️) for debug options",
              completed: false,
            },
          ],
        },
      ],
    },
    dayCycle: {
      timeOfDay: 0.35, // Start in the morning
      dayLengthMs: 180000, // 3 minutes default
      running: true,
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
  clusterCount: number;
  entityCount: number;
  islandCount: number;
  plantCount: number;
  rockCount: number;
  nodeCount: number;
  particleCount: number;
} {
  let islandCount = 0;
  let rockCount = 0;
  let nodeCount = 0;
  let particleCount = 0;

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
      case "particle":
        particleCount++;
        break;
    }
  }

  return {
    seed: world.seed,
    clusterCount: world.clusters.size,
    entityCount: world.entities.size,
    islandCount,
    plantCount: world.plants.size,
    rockCount,
    nodeCount,
    particleCount,
  };
}
