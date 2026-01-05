# Hanging Garden — Design + Agent Workflow

A browser-based software toy: a dense, tactile, explorable _floating garden_ of algorithmic, multi-scale structures. Plants, soil clumps, stones, and attachments drift in airy space. The underlying data stays close to what you see—the garden _is_ the syntax.

---

## 0. North Star

Create an artifact that feels **artisanally iterated**: subtle layout, animation timing, micro-interactions, visual detail at every scale. Each revision should be quickly apprehendable.

The garden is not a static illustration. It is an **interactive simulation** that evolves toward richer dynamics. What you see _is_ what it is—data structures render as themselves with minimal representational gap.

---

## 1. Goals

### Product

- **Immediate density**: On load, rich structure. Within a few interactions, lots of behavior. Shallow before deep.
- **Garden as structure**: Visually cohesive world where combinatorics are visible—trees, graphs, shared node identities, attachments, layers.
- **Floating medium**: Not gravity-bound. Soil in clumps, plants in air, stone assemblages drifting. Optional grounded areas.
- **Exploration**: Pan/zoom + at least one nontrivial space manipulation (focus-lens, warp, neighborhood expand).
- **Simulation baked in**: Ticking state evolution with local rules, even if initially trivial.
- **Tactility**: Click/drag, hover affordances, motion polish. Springs, easing, satisfying feedback.

### Process (agentic)

- Fast MVP, then alternating:
  - **Quick loop**: User feedback → small targeted changes
  - **Long loop**: Agent refines autonomously, returns checkpoints + guided tour

---

## 2. Non-Goals (early phases)

- Multiplayer, networking, accounts, cross-device persistence
- Photorealistic rendering or "real garden" fidelity
- Complex backend / server infrastructure

---

## 3. Tech Stack

### Recommended

- **React + TypeScript + Vite**
- **Rendering: SVG + Canvas hybrid**
  - SVG: stems, paths, crisp zoomable shapes, hit targets
  - Canvas: particles, grain, soft shadows, background atmosphere
  - DOM: HUD, tutorial, debug panels

### Architectural style

- Single state store, functional updates (MVU-ish):
  - `Model` (world state)
  - `update(msg, model) → model`
  - `view(model) → JSX`
- Pure functions for: growth rules, layout, rendering decisions
- Side effects isolated: animation frames, timers, pointer events

---

## 4. Core Concept: Garden as Multi-Structure World

The world consists of **entities** (nodes with stable identity) participating in multiple overlapping structures:

| Structure          | Description                                                 |
| ------------------ | ----------------------------------------------------------- |
| **Plant graphs**   | Rooted branching DAG—buds, stems, leaves, flowers           |
| **Soil clusters**  | Floating blobs/islands that can host roots                  |
| **Rock scaffolds** | Rigid anchors; plants can attach                            |
| **Vines/threads**  | Edges connecting distant entities (non-tree links)          |
| **Shared nodes**   | A node may appear in multiple structures; identity persists |

Visually: clusters of soil + rock drift in airy space. Plants grow from anchors. Vines create incidence between clusters. The whole thing floats—an archipelago in a sunny abyss.

### Future combinatorial depth

- **Incident structures**: Families of sets sharing elements
- **Hypergraphs**: Edges connecting >2 nodes (mycorrhizal networks)
- **Layered containment**: Regions with sub-regions
- **Mappings**: Correspondences between structures (flower → fruit)

---

## 5. Extensibility: Designing for Additive Depth

This project is intended to run for a while—many iterations, much agent refinement. The danger is reaching a plateau where new detail requires rewriting old detail. We want **additive extensibility**: rich directions to grow without displacement.

### Principles

1. **Entities are open for extension**

   - The `Entity` union should grow. New kinds (fungi, insects, weather particles, abstract nodes) slot in without changing existing kinds.
   - Rendering and simulation dispatch on `kind`—adding a kind means adding a case, not restructuring.

2. **Structures compose, don't replace**

   - Plants, vines, islands are all structures over the same node pool.
   - New structure types (spore networks, light paths, water flow graphs) layer on top.
   - Shared node identity means new structures can reference existing entities.

3. **Simulation rules are local and stackable**

   - Each rule operates on a pattern (e.g., "if bud is charged and clicked → sprout").
   - New rules add to the set; they don't rewrite the tick function.
   - Rules can have priorities or phases, but default is independent application.

4. **Rendering layers are independent**

   - Canvas background, SVG world, DOM HUD are separate layers.
   - New visual effects (glow, particles, overlays) add layers or composit within existing ones.
   - A new entity kind needs a renderer; it doesn't change how other entities render.

5. **Interactions are event-driven and extensible**
   - Pointer events produce messages; the update function routes them.
   - New interaction types (long-press, gesture, multi-select) add message types.
   - Context menus and radial menus are containers for dynamically registered actions.

### Extension Points (planned)

These are places we _know_ we'll want to add depth. Design now to make these additions smooth:

| Extension Point       | What might go there                                                                |
| --------------------- | ---------------------------------------------------------------------------------- |
| **Entity kinds**      | Fungi, insects, water droplets, abstract "concept" nodes, user-placed markers      |
| **Structure types**   | Spore networks, nutrient flows, light/shadow graphs, user-drawn connections        |
| **Simulation rules**  | Seasons, weather, predation, symbiosis, decay cycles, user-defined growth grammars |
| **Render layers**     | Particle systems, procedural textures, glow/bloom effects, annotation overlays     |
| **Interaction modes** | Drawing mode, pruning mode, time-scrub, grammar editing, camera presets            |
| **Spatial mechanics** | Hyperbolic zoom, focus lens, layer isolation, portal/wormhole navigation           |
| **Meta features**     | Undo/redo stack, action replay, garden export/import, seed sharing                 |

### What this means in practice

- When implementing a feature, ask: "If I wanted 5 variations of this, would I have to copy-paste or restructure?" Aim for the former to be easy.
- Prefer data over code: growth rules as data structures, not hardcoded if-statements.
- Prefer composition over inheritance: entities have components, not deep class hierarchies.
- Keep the core loop simple: `tick(world) → world`, `update(msg, world) → world`, `view(world) → JSX`. Complexity lives in what those functions _dispatch to_, not in their shape.

---

## 6. MVP (Phase 1): Beautiful Static-ish Garden With Minimal Life

### Must ship

1. **Viewport**: Full-screen into the garden world
2. **Camera**: Pan (drag) + zoom (wheel/pinch)
3. **Generated scene**:
   - 3–8 floating islands (irregular soft-edge shapes)
   - Each island: 1–3 plants (branching SVG paths)
   - At least one cross-island vine/connection
   - Scattered stones
4. **Minimal simulation**:
   - Gentle ambient sway (per-island noise)
   - Buds slowly "charge" over time
5. **Minimal interaction**:
   - Click charged bud → sprout (adds segment)
   - Click leaf → prune (removes subtree)
   - Hover → highlight with crisp hit targets
6. **Tutorial overlay**:
   - "What's New" card: 3–5 actionable steps
   - Optional "Take me there" to focus camera on exemplar
   - Dismissible but reopenable

### Visual bar

- Cohesive muted palette (earth tones, airy sky)
- Depth cues: parallax layers, scale attenuation, subtle blur
- Micro-polish: cursor changes, hover transitions, z-order correctness
- Nothing perfectly still—ambient drift/sway

---

## 7. Data Model

### Identity

Every entity has a stable `id: string`.

### Types (sketch)

```typescript
type Id = string;

type Entity =
  | { kind: "island"; id: Id; pos: Vec2; radius: number; shape: Path }
  | { kind: "rock"; id: Id; islandId: Id; localPos: Vec2; size: number }
  | {
      kind: "plantNode";
      id: Id;
      plantId: Id;
      nodeKind: "bud" | "stem" | "leaf" | "flower";
      charge?: number;
    }
  | { kind: "vine"; id: Id; fromId: Id; toId: Id; tension: number };

type Plant = {
  id: Id;
  rootId: Id;
  adjacency: Map<Id, Id[]>; // parent → children
};

type World = {
  entities: Map<Id, Entity>;
  plants: Map<Id, Plant>;
  camera: { pan: Vec2; zoom: number };
  time: { t: number; dt: number };
  selection: Id | null;
  hover: Id | null;
  tutorial: { steps: TutorialStep[]; completed: Set<number> };
  seed: number;
};
```

### Layout

- Islands have local coordinate systems
- Plants embedded procedurally: segments as bezier splines in local space
- Global positions = island transform × local × camera

---

## 8. Rendering (Hybrid Layers)

1. **Canvas background**

   - Sky/abyss gradient
   - Subtle grain/noise
   - Faint drifting particles

2. **SVG world layer**

   - Islands: soft-edge blobs (radial gradients, filter blur)
   - Rocks: vector shapes with texture patterns
   - Plant stems: `<path>` with variable stroke-width
   - Leaves/flowers: simple shapes, slight rotation variance
   - Vines: curves with tension, dashed or dotted

3. **DOM HUD**
   - Tutorial / "What's New"
   - Debug panel (toggles)
   - Mini-map (later)

### Visual cues

- **Depth**: Parallax on pan, scale by pseudo-z per island
- **Focus**: Selection glow, hover outline, nearby-node highlight
- **Ambient motion**: CSS keyframes or JS-driven subtle sway

---

## 9. Interaction Design

### Camera

| Action | Gesture                                    |
| ------ | ------------------------------------------ |
| Pan    | Drag background / two-finger drag          |
| Zoom   | Scroll wheel / pinch                       |
| Focus  | Double-click → smooth center + slight zoom |

### Direct manipulation

| Action                     | Result                             |
| -------------------------- | ---------------------------------- |
| Click charged bud          | Sprout: add stem segment + new bud |
| Click leaf                 | Prune: remove leaf + small subtree |
| Hover any entity           | Highlight, show tooltip            |
| Drag stem (later)          | Bend path locally                  |
| Drag vine endpoint (later) | Reattach to another node           |

### Reveal strategy

- First interactions: obvious, safe, immediate feedback
- Deeper interactions: contextual menu on long-press/right-click, or unlocked after basic tutorial

---

## 10. Simulation

### Phase 1: Trivial but real

- **Tick rate**: ~30–60fps for motion; growth tick every few seconds
- **Bud charging**: Buds accumulate charge over time; show subtle glow when ready
- **Sprout**: Clicking charged bud consumes charge, grows segment
- **Sway**: Per-island noise function drives ambient motion

### Phase 2: Ecosystem hooks

- **Humidity field**: Per-island, drifts slowly
- **Growth rate**: Depends on humidity + local crowding
- **Wilt**: Leaves decay if pruned too aggressively or starved

Keep simulation **deterministic given seed + action log** when feasible.

---

## 11. Tutorial / "What's New" System

Required for every revision.

### Specification

- 3–6 steps, each an actionable instruction
- Checkmark when completed
- Optional "Take me there" button → camera focuses on exemplar
- Skimmable, dismissible, easy to reopen

### Implementation

- Tutorial steps are predicates over `World` + recent events
- Agent updates steps when adding features
- Store in `World.tutorial`

### Example steps (MVP)

1. "Drag the background to pan around the garden"
2. "Scroll to zoom in and out"
3. "Click a glowing bud to sprout a new branch"
4. "Click a leaf to prune it"
5. "Double-click an island to focus on it"

---

## 12. Instrumentation + Feedback

### Dev logging (always-on in dev)

Console log:

- Pointer events: down/up, target entity, drag start/end
- Camera changes
- Growth events: sprout, prune
- Simulation ticks (optional verbose mode)

### Debug panel toggles

- `Show hit targets` (outlines)
- `Show IDs` (labels)
- `Freeze time` (pause simulation)
- `Seed` input + `Regenerate` button

### Checkpoints

Separate file: `CHECKPOINTS.md`

- Format: `CP-###: [date] [seed] [description]`
- Include "tour path": 2–5 actions demonstrating new feature
- Keep checkpoints small, reversible

---

## 13. Milestones

### M1 — MVP Garden

- [ ] Vite + React + TS scaffold
- [ ] Camera pan/zoom
- [ ] Procedural generator (seeded): islands + plants
- [ ] SVG render: stems, leaves, islands, rocks
- [ ] Hover + selection highlighting
- [ ] Click bud → sprout; click leaf → prune
- [ ] Tutorial overlay v1
- [ ] Canvas background (gradient + grain)

### M2 — Polished Tactility

- [ ] Refined hit testing + hover states
- [ ] Smooth transitions: focus, sprout animation, prune collapse
- [ ] Background particles (canvas)
- [ ] Debug panel: IDs, hit targets, freeze, regenerate
- [ ] Animation timing audit (150ms hovers, 300ms growth, etc.)

### M3 — Space Lens Mechanic

Add one nontrivial exploration mechanic:

- **Option A**: Focus lens—hovering cluster expands spacing, increases detail
- **Option B**: Neighborhood unfold—double-click node expands its neighborhood
- [ ] Implement chosen mechanic
- [ ] Update tutorial

### M4 — Ecosystem Hooks

- [ ] Humidity/crowding fields
- [ ] Growth rate varies by conditions
- [ ] Visible field visualization (very subtle)
- [ ] Tutorial updated

### M5 — Baroque Growth

- [ ] Multiple plant varieties (grammar-based generation)
- [ ] Cross-links/vines forming loops
- [ ] Deeper layered rendering
- [ ] Sound (optional)

---

## 14. Stretch Directions

Pick opportunistically:

- **Growth grammar editor**: Drag rules to change plant generation
- **Alternate skins**: Botanical / coral / circuitry / crystal over same structures
- **Time-lapse replay**: Action log playback as animation
- **Sandbox tools**: Sprinkle seeds, place rocks, carve soil
- **Save/load**: LocalStorage snapshots, JSON export

---

## 15. Acceptance Criteria

"Done for now" means:

- First-time viewer understands controls in <30 seconds
- Tutorial completable in <2 minutes
- Immediate impression: "there's a lot here"
- Visual polish: coherent, smooth, readable at multiple zoom levels
- Agent can iterate without breaking everything:
  - Deterministic seeds
  - Simple regeneration
  - Debug overlays for diagnosis

---

## 16. Agent Operating Instructions

### Primary loop

1. **Run app**, ensure no console errors
2. **Make 1–3 coherent improvements** per iteration (not 20 scattered changes)
3. **Update files**:
   - `SOURCE.md`: Mark TODOs, add notes
   - `CHECKPOINTS.md`: Add entry (what changed, seed, tour path)
   - Tutorial: Ensure "What's New" reflects changes
4. **Prefer changes that increase**:
   - Visual cohesion
   - Interaction clarity
   - Shallow discoverability
5. **If experiment looks worse**: Revert quickly. Note what failed and why.

### Checkpointing protocol

Every checkpoint:

- `CP-###` (increment)
- Seed used
- Short description
- Tour path: 2–5 actions showing new feature

### Long autonomous runs

Choose a single theme:

- "Sprout/prune animation polish"
- "Hover + hit testing"
- "Semantic zoom lens"

Produce:

- Updated tutorial
- Short guided tour list
- 2–3 checkpoints (not 20)

---

## 17. Initial TODOs

- [ ] Scaffold Vite + React + TS
- [ ] Implement camera pan/zoom
- [ ] Procedural generator (seeded) for islands + plants
- [ ] SVG render stems/leaves + hover/selection
- [ ] Click bud → sprout; click leaf → prune
- [ ] Tutorial overlay v1
- [ ] Debug toggles: show IDs, hit targets, freeze time, regenerate
- [ ] Canvas background gradient + grain
- [ ] Create `CHECKPOINTS.md`

---

## 18. Open Design Choices

Agent may decide, but **must document in Design Decisions Log**:

- Plant geometry: polyline vs bezier, thickness model
- Hit testing: SVG pointer events vs spatial index
- Semantic zoom: lens vs neighborhood unfold
- Determinism: best-effort seed + action log replay
- Color palette: specific hues TBD

---

## 19. Design Decisions Log

| Date       | Decision                        | Rationale                                                                 |
| ---------- | ------------------------------- | ------------------------------------------------------------------------- |
| (init)     | React + TS + Vite               | Mainstream, fast reload, TS for type safety                               |
| (init)     | SVG + Canvas hybrid             | SVG for crisp paths, Canvas for atmosphere                                |
| (init)     | MVU-ish architecture            | Clean state, enables undo/replay                                          |
| 2026-01-04 | Git for checkpointing           | Commits as checkpoints, describe in docs, branches when exploring         |
| 2026-01-04 | Wiki-style docs folder          | SOURCE.md spawns sub-docs as complexity grows; [[bracket]] links allowed  |
| 2026-01-04 | Bezier splines first            | More organic feel; polylines available as alternative primitive later     |
| 2026-01-04 | Rich theming infrastructure     | CSS variables, color scheme controls; dark mode planned but not default   |
| 2026-01-04 | Sound hooks from start          | Interaction events structured for easy sound layer addition               |
| 2026-01-04 | Tutorial from day one           | "What's New" overlay present even in scaffold                             |

---

## 20. Aesthetic References + Vibe

The agent should internalize these not as constraints but as **taste anchors**—touchstones to return to when making visual, interactive, or structural decisions. The garden should feel like it belongs in the same universe as these things.

### Generative & Computational Art

- **Tyler Hobbs** (Fidenza): Organic flow fields, structured randomness, palette discipline
- **inconvergent** (Anders Hoff): Differential growth, sandspline, emergent complexity from simple rules
- **Nervous System**: Generative jewelry/objects—cellular, reaction-diffusion, voronoi
- **Jared Tarbell** (complexification.net): Substrate, Bubble Chamber—accretive, crystalline growth
- **Casey Reas**: Process-driven, systemic, but still warm

### Architecture & Spatial Design

- **Parametric architecture**: Zaha Hadid, MAD Architects—flowing forms, non-orthogonal structure
- **Theo Jansen's Strandbeests**: Kinetic, wind-powered, skeletal elegance, mechanism-as-organism
- **Hanging Gardens of Babylon** (mythic): Terraced, cascading, gravity-defying greenery
- **Japanese moss gardens**: Dense, quiet, textural, every inch considered
- **Arcosanti** (Paolo Soleri): Organic modernism, structure emerging from landscape

### Natural Forms

- **Air plants (Tillandsia)**: Rootless, floating, clustered in crevices
- **Epiphytes & bromeliads**: Plants on plants, nested ecosystems
- **Lichen & moss**: Micro-scale complexity, colonizing surfaces
- **Mycelium networks**: Hidden infrastructure, distributed intelligence
- **Coral reefs**: Accretive calcium structures, color gradients, niche diversity
- **Seed pods & botanical cross-sections**: Fibonacci spirals, packing problems solved by evolution

### Software & Interaction Feel

- **tldraw**: Immediate, responsive, multiplayer presence without heaviness
- **Figma**: Butter-smooth zoom/pan, precise snapping, contextual UI that appears when needed
- **Electric Zine Maker**: Handmade, textured, deliberately imperfect, maximalist-friendly
- **Observable notebooks**: Live, tinkerable, code-as-interface
- **Pollen (Matthew Butterick)**: Typographic care, every detail intentional

### Games & Toys

- **Noita**: Every pixel simulated, emergent chaos, "what happens if I..."
- **Baba Is You**: Rules are objects, syntax is gameplay
- **Stardew Valley**: Gentle rhythm, tending loop, satisfying feedback
- **The Witness**: Environment as puzzle, density of meaning
- **Townscaper**: Generative architecture, no wrong moves, instant beauty
- **sandspiel / Sandboxels**: Elemental simulation toys, playful physics

### Mood Board (the vibe in words)

- Airy, not heavy. Sunny abyss, not dark void.
- Drifting, not static. Breathing, not frozen.
- Organic precision. Not sloppy, not sterile.
- Handmade-feeling despite being algorithmic.
- Dense but navigable. Rich but not cluttered.
- Quiet complexity. You notice more the longer you look.
- Warm neutrals punctuated by botanical accent colors.
- The feeling of a greenhouse at midday: humid light, green shadows, life happening slowly.

### What to Avoid

- Generic "tech product" aesthetics (flat, blue, soulless)
- Dark mode as default (this is a garden, not a terminal)
- Overly literal plant realism (we want abstraction that _rhymes_ with nature)
- Cluttered UI chrome (the garden is the interface)
- Motion for motion's sake (movement should feel purposeful or ambient, not frenetic)

### Color Palette Direction (2026-01-04)

**Primary vibe**: Temperate rainforest. BC/Vancouver Island in winter. A rocky, somewhat volcanic "new world" — sparse but alive. Not Iceland exactly, but that sparseness. Not a lot of dirt built up yet, but dirt exists.

**Core palette families**:

- **Grays** (rocks, scaffolds): Important role. Dark grays, volcanic grays, ite grays. The bones of the world.
- **Browns** (soil, bark, earth): Rich spectrum from dark loam to sandy tan. The substrate.
- **Greens** (plants, life): *Extremely* rich series. Moss greens, fern greens, lichen yellowy-greens, deep forest greens, new-growth bright greens. This is where the life is.
- **Accents**: Botanical pops — flower colors, berry colors — used sparingly. Warm corals, cool violets, bright yellows. Earned, not scattered.

**Atmosphere**: Humid light filtered through canopy. Not harsh sun, not gloom. The luminous gray-green of an overcast forest morning.

**Theming infrastructure**: CSS custom properties for all colors. Semantic naming (--color-rock-dark, --color-leaf-fresh, etc.). Scheme switching scaffolded from start.

---

## 21. Repo Structure

```
/
├── SOURCE.md          # This file — the DNA
├── docs/              # Wiki-style design docs (spawned from SOURCE as complexity grows)
│   ├── CHECKPOINTS.md # Git checkpoint log with tour paths
│   ├── PALETTE.md     # Color palette details (when needed)
│   └── ...            # Additional docs as needed, [[bracket]] links between them
├── src/
│   ├── model.ts       # Types + World
│   ├── update.ts      # Messages + update function
│   ├── generate.ts    # Procedural garden generation
│   ├── theme/
│   │   ├── colors.ts  # CSS variable definitions, palette
│   │   └── tokens.ts  # Design tokens
│   ├── sim/
│   │   └── tick.ts    # Simulation rules
│   ├── render/
│   │   ├── Canvas.tsx # Background layer (atmosphere)
│   │   ├── Garden.tsx # SVG world layer
│   │   └── paths.ts   # Bezier/polyline path utilities
│   ├── ui/
│   │   ├── Tutorial.tsx
│   │   ├── DebugPanel.tsx
│   │   └── HUD.tsx
│   ├── hooks/
│   │   ├── useCamera.ts
│   │   └── useInteraction.ts
│   ├── audio/         # Sound hooks (scaffolded, not yet implemented)
│   │   └── events.ts  # Interaction events that will trigger sounds
│   └── App.tsx        # Main composition
├── index.html
├── vite.config.ts
└── package.json
```

---

_This document is the shared whiteboard. Agents read it, act on it, update it. Humans steer via feedback. The garden grows._
