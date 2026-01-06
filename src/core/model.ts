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

// === Constellation ===
// A constellation is a higher-order grouping of clusters

export type Constellation = {
  id: Id;
  pos: Vec2; // World position of constellation center
  // Future: personality, theme, etc.
};

// === Cluster ===
// A cluster is a grouping of islands/rocks/plants with a central glyph

export type Cluster = {
  id: Id;
  constellationId: Id; // Which constellation this belongs to
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

// === Pathways ===
// Inter-cluster connections that form constellation patterns

export type PathwayDirection = "forward" | "backward" | "bidirectional";
// forward = force flows from → to
// backward = force flows to → from
// bidirectional = force pulls toward line center only

export type Pathway = {
  id: Id;
  fromClusterId: Id;
  toClusterId: Id;
  direction: PathwayDirection;
};

export type Entity = Island | Rock | PlantNode | Vine | Particle;

// === Plant Structure ===

export type Plant = {
  id: Id;
  islandId: Id;
  rootId: Id;
  adjacency: Map<Id, Id[]>;
};

// === Cut/Graft System ===

// Subtree being carried by cursor after cutting
export type CarriedSubtree = {
  nodes: PlantNode[]; // All nodes in subtree
  adjacency: Map<Id, Id[]>; // Subtree structure
  rootId: Id; // Root node of subtree
  sourceIslandPos: Vec2; // Original island position (for rendering offsets)
};

// Subtree piece drifting after release into void
export type DriftingPiece = {
  id: Id;
  node: PlantNode;
  pos: Vec2; // Current world position
  velocity: Vec2; // Drift velocity
  opacity: number; // Fading out (1 -> 0)
  age: number; // Frames since release
};

// === Camera ===

export type Camera = {
  pan: Vec2;
  zoom: number;
};

// Animation state for smooth camera transitions
export type CameraAnimation = {
  startPan: Vec2;
  startZoom: number;
  targetPan: Vec2;
  targetZoom: number;
  startTime: number; // performance.now() timestamp
  duration: number; // ms
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

// === UI State ===

export type PanelId = "tutorial" | "debug" | "inspector" | "time";

// === Audio State ===

export type AudioLayerKey = "actionSounds" | "voidDrone" | "dayNightShift" | "zoomMixing";

export type AudioState = {
  // Master audio enabled
  enabled: boolean;
  // Whether audio context has been started (user gesture received)
  started: boolean;
  // Master volume (0-1)
  masterVolume: number;
  // Per-layer toggles for evaluation
  layers: Record<AudioLayerKey, boolean>;
};

// === World State ===

export type World = {
  constellations: Map<Id, Constellation>;
  clusters: Map<Id, Cluster>;
  pathways: Map<Id, Pathway>;
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
  hoveredPathway: Id | null;
  contextMenu: ContextMenu;
  tutorial: {
    visible: boolean;
    sections: TutorialSection[];
  };
  debug: {
    showIds: boolean;
    showHitTargets: boolean;
    showForceField: boolean;
  };
  // Track which panel is on top (last focused)
  focusedPanel: PanelId | null;
  seed: number;
  // Cut/Graft system
  carriedSubtree: CarriedSubtree | null;
  cursorWorldPos: Vec2;
  driftingPieces: DriftingPiece[];
  // Performance monitoring
  fps: number;
  // Smooth camera animation (null when not animating)
  cameraAnimation: CameraAnimation | null;
  // Audio system state
  audio: AudioState;
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

// === Type Safety Helpers ===

/**
 * Exhaustive switch helper - causes compile error if a case is not handled.
 * Use in default case of switch statements over union types.
 */
export function assertNever(x: never, msg?: string): never {
  throw new Error(msg ?? `Unexpected value: ${JSON.stringify(x)}`);
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
    constellations: new Map(),
    clusters: new Map(),
    pathways: new Map(),
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
    hoveredPathway: null,
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
              instruction: "Right-click a stem to branch or cut",
              completed: false,
            },
            {
              id: "cut",
              instruction: "Cut a branch — it follows your cursor",
              completed: false,
              isNew: true,
            },
            {
              id: "graft",
              instruction: "Click another stem to graft the cut branch",
              completed: false,
              isNew: true,
            },
            {
              id: "release",
              instruction: "Click empty space to release and scatter pieces",
              completed: false,
              isNew: true,
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
      showForceField: false,
    },
    focusedPanel: null,
    seed,
    // Cut/Graft system
    carriedSubtree: null,
    cursorWorldPos: vec2(0, 0),
    driftingPieces: [],
    // Performance monitoring
    fps: 60,
    cameraAnimation: null,
    // Audio system
    audio: {
      enabled: true,
      started: false,
      masterVolume: 0.7,
      layers: {
        actionSounds: true,
        voidDrone: true,
        dayNightShift: true,
        zoomMixing: true,
      },
    },
  };
}

// === World Inspection (for CLI tools) ===

export function summarizeWorld(world: World): {
  seed: number;
  constellationCount: number;
  clusterCount: number;
  pathwayCount: number;
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
      case "vine":
        // Vines not counted separately for now
        break;
      default:
        assertNever(entity, `Unknown entity kind in summarizeWorld`);
    }
  }

  return {
    seed: world.seed,
    constellationCount: world.constellations.size,
    clusterCount: world.clusters.size,
    pathwayCount: world.pathways.size,
    entityCount: world.entities.size,
    islandCount,
    plantCount: world.plants.size,
    rockCount,
    nodeCount,
    particleCount,
  };
}
