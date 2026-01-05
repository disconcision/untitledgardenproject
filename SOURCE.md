# Hanging Garden — Design Document

A browser-based software toy: a dense, tactile, explorable _floating garden_ of algorithmic, multi-scale structures. Plants, soil clumps, stones, and attachments drift in airy space. The underlying data stays close to what you see—the garden _is_ the syntax.

> **Agents**: This file is for vision, architecture, and aesthetics. For process/workflow, see `docs/AGENT-WORKFLOW.md`. For tasks, see `docs/TODO.md`.

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

### Process (creator)

The human creator's operating loop:

1. **Start session** — Tell agent: "Read docs/README.md" (ensures it knows the process)
2. **View the artifact** — Open the garden in browser (ideally Cursor's built-in browser pane)
3. **Observe and react** — Pan, zoom, interact; notice what feels right or wrong
4. **Speak feedback** — Audio recording while interacting; stream of consciousness is fine
5. **Prompt the agent** — Audio transcription goes to the agent panel
6. **Agent implements** — Changes happen; HMR refreshes the view
7. **Review completion report** — Agent provides summary at end (see `docs/AGENT-WORKFLOW.md`)
8. **Export transcript** — Save conversation to `docs/transcripts/YYYY-MM-DD-topic.md`

**Goal**: Minimize context-switching. The creator should be able to stay in the garden (or one window) and just _talk_. The agent does the implementation work.

**Roles**:

- **Creator**: Vision, feedback, direction, taste. Speaks more than types. Exports transcripts.
- **Agent**: Implementation, iteration, documentation, testing. Writes code, updates docs, provides completion reports.

These roles can flex — the creator might implement, the agent might propose vision — but this is the default posture.

**After significant sessions**: Export the conversation transcript to `docs/transcripts/` for future context. See `docs/transcripts/README.md` for details.

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
- **Exhaustive switch matching**: The update function uses TypeScript's `never` type trick to ensure all message types are handled at compile time

### Linting & Formatting

- **ESLint**: TypeScript-first rules, explicit return types on exports, `type` over `interface`
- **Prettier**: Consistent formatting (2-space indent, trailing commas)
- **Scripts**:
  - `npm run lint` — check for issues
  - `npm run format` — auto-format code
  - `npm run check` — full check (tsc + lint + format + test)

---

## 4. Core Concept: Garden as Editor

The garden is not just a visualization — it is an **editor** for a domain-specific data structure. The visual representation _is_ the syntax. There is no separate "code view" and "preview" — you edit the structure by directly manipulating its visual form.

This means:

- **Direct manipulation**: Click a bud to sprout, drag to reposition, prune by clicking
- **Immediate feedback**: Changes are visible instantly; the garden _is_ the state
- **Structural editing**: You're not editing pixels or text; you're editing graphs, trees, and relationships
- **Semantic operations**: Actions like "sprout" or "prune" are meaningful in the domain

The garden as editor is distinct from a drawing tool. You don't draw arbitrary shapes — you perform operations on a structured world that has rules.

---

## 5. Garden as Multi-Structure World

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

## 5b. Extensibility: Designing for Additive Depth

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

## 6. Projective UI: Multiple Views of the Same Structure

The garden's hierarchical structure (World → Clusters → Islands → Rocks/Plants → Nodes) can be viewed through different **lenses** or **projections**:

### Current Implementation

**World Inspector** (bottom-left corner dock):

- Collapsible tree view showing the full hierarchy
- Bidirectional sync: hovering/clicking in tree highlights in world, and vice versa
- Shows entity kinds, IDs, and live state (e.g., bud charge)

### Vision: Progressive Projective UI

The idea is that any subtree of the world can be viewed as either:

1. **Outliner/text**: Collapsible tree, shows structure, IDs, properties
2. **Rendered/graphical**: The actual SVG/spatial representation

And these lenses are **switchable per-node**, not just globally:

- Root as outliner, children as rendered
- Or: Root rendered, but one selected subtree "popped open" as outliner
- Or: Arbitrary mix at arbitrary depths

This is related to **projectional editing** (JetBrains MPS, Lamdu) — the same AST projected as text, blocks, or diagrams depending on context.

### Future Directions

| Feature                          | Description                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------- |
| **Inline rendering in outliner** | Subtrees in the tree view render as miniature graphics                        |
| **Situated inspection**          | Pop open an outliner view that's spatially anchored to the thing in the world |
| **UI chrome as tree nodes**      | Menus, config, state all live in the same projective paradigm                 |
| **Comparison views**             | Side-by-side worlds, timeline/scrubber, "what if" branching                   |

### References

- **Orteil's Nested**: Pure outliner exploring infinite nested structure
- **Figma/Unity inspectors**: Panel-based, but the pattern of selecting in one view to inspect in another
- **Observable notebooks**: Live, tinkerable, code-as-interface
- **Marginalia/annotation**: Inspector appears where the thing is, not in a separate panel

---

## 7. MVP (Phase 1): Beautiful Static-ish Garden With Minimal Life

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

## 8. Data Model

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

## 9. Rendering (Hybrid Layers)

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

## 10. Interaction Design

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
| Hover any entity           | Highlight, show tooltip            |
| Drag stem (later)          | Bend path locally                  |
| Drag vine endpoint (later) | Reattach to another node           |

### Context menu (pie menu)

Right-click on plant nodes opens a radial pie menu with context-sensitive actions:

| Node type | Available actions                          |
| --------- | ------------------------------------------ |
| Stem      | **Branch** (add new bud), **Trim** (prune) |
| Bud       | **Trim** (prune subtree)                   |
| Leaf      | **Trim** (prune subtree)                   |
| Root stem | **Branch** only (can't trim roots)         |

The pie menu:

- Appears at click position, offset so node stays visible
- Icons arranged radially (scissors for trim, branch icon for branch)
- Animates in smoothly, closes on action or click-away
- Uses lucide-react icons matching corner panel style

### Reveal strategy

- First interactions: obvious, safe, immediate feedback (click bud to sprout)
- Deeper interactions: contextual pie menu on right-click for branch/trim actions

---

## 11. Simulation

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

## 12. Tutorial / "What's New" System

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

## 13. Instrumentation + Feedback

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

## 14. Milestones

**See `docs/TODO.md` for current milestone status and all task tracking.**

Summary:
- **M1 (MVP Garden)**: ✅ Complete
- **M2 (Polished Tactility)**: 🟡 Mostly complete — animation polish remains
- **M3 (Space Lens)**: ⬜ Not started — exploration mechanic TBD
- **M4 (Ecosystem)**: ⬜ Not started — environmental factors
- **M5 (Baroque Growth)**: ⬜ Not started — plant varieties, deeper structure

---

## 15. Stretch Directions

Pick opportunistically:

- **Growth grammar editor**: Drag rules to change plant generation
- **Alternate skins**: Botanical / coral / circuitry / crystal over same structures
- **Time-lapse replay**: Action log playback as animation
- **Sandbox tools**: Sprinkle seeds, place rocks, carve soil
- **Save/load**: LocalStorage snapshots, JSON export

---

## 16. Acceptance Criteria

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

## 17. Agent Operating Instructions

**See `docs/AGENT-WORKFLOW.md` for the full workflow.**

Key principles:
- Prefer changes that increase visual cohesion, interaction clarity, shallow discoverability
- If experiment looks worse: revert quickly, note what failed
- Keep commits small and atomic for easy bisecting
- Long autonomous runs: 1–3 checkpoints, not 20

---

## 18. Agentic Harness

The agent (Claude, running in Cursor) benefits from tools beyond just the browser. This section describes infrastructure for tighter agent feedback loops.

### Node CLI Tools

The core logic (model, update, generate, simulation) is **pure TypeScript** with no React/DOM dependencies. This enables:

- **Headless generation**: `npm run generate -- --seed 42` → prints world summary
- **Unit tests**: `npm test` → runs Vitest tests on core logic

These tools help the agent validate changes without spinning up the browser.

### Directory Structure

```
scripts/
└── generate.ts   # CLI: generate world, print summary
src/
├── core/         # Pure logic (no React)
│   ├── model.ts
│   ├── generate.ts
│   ├── actions/  # sprout, prune, branch
│   └── simulation/
├── render/       # React/DOM/SVG (browser only)
├── ui/           # React components
└── theme/        # Colors, day/night scheme
```

---

## 19. Testing Strategy

Tests should help the agent iterate robustly without imposing heavy cost on development.

### Unit Tests (core logic)

- **What**: Pure functions in `core/` — generation, update, simulation rules
- **Tool**: Vitest (fast, works with Vite)
- **Style**: Small, focused, fast. Test invariants and edge cases.
- **Run**: `npm test` — should complete in <5 seconds

Example tests:

- `generateWorld(seed)` produces valid world (entities have IDs, plants have roots)
- `update(msg, world)` returns new world without mutating old
- Pruning a leaf removes it from the tree
- Sprouting a bud adds a new node

### Behavioral Tests (light)

- **What**: High-level scenarios that shouldn't regress
- **Tool**: Vitest with JSDOM or Playwright for critical paths
- **Style**: Minimal. Only test things that have broken before or are critical.
- **Run**: `npm run test:e2e` — can be slower, run less frequently

Example:

- Pan/zoom updates camera state correctly
- Clicking a charged bud triggers sprout message

### When to Add Tests

- When implementing core logic (generation, simulation rules)
- When a bug is found — add a test that would have caught it
- When refactoring — tests provide safety net

### When NOT to Add Tests

- Visual styling (test manually)
- One-off experiments (delete the code instead of testing it)
- Things that are obviously correct and unlikely to regress

---

## 20. Task Tracking

**Active tasks are tracked in `docs/TODO.md`.**

See that file for:

- What's currently in progress
- What's up next
- Full backlog organized by milestone

The TODO list in SOURCE.md has been migrated there to avoid duplication.

---

## 21. Open Design Choices

Agent may decide, but **must document in Design Decisions Log**:

- Plant geometry: polyline vs bezier, thickness model
- Hit testing: SVG pointer events vs spatial index
- Semantic zoom: lens vs neighborhood unfold
- Determinism: best-effort seed + action log replay
- Color palette: specific hues TBD

---

## 22. Design Decisions Log

| Date       | Decision                    | Rationale                                                                         |
| ---------- | --------------------------- | --------------------------------------------------------------------------------- |
| (init)     | React + TS + Vite           | Mainstream, fast reload, TS for type safety                                       |
| (init)     | SVG + Canvas hybrid         | SVG for crisp paths, Canvas for atmosphere                                        |
| (init)     | MVU-ish architecture        | Clean state, enables undo/replay                                                  |
| 2026-01-04 | Git for checkpointing       | Commits as checkpoints, describe in docs, branches when exploring                 |
| 2026-01-04 | Wiki-style docs folder      | SOURCE.md spawns sub-docs as complexity grows; [[bracket]] links allowed          |
| 2026-01-04 | Bezier splines first        | More organic feel; polylines available as alternative primitive later             |
| 2026-01-04 | Rich theming infrastructure | CSS variables, color scheme controls; dark mode planned but not default           |
| 2026-01-04 | Sound hooks from start      | Interaction events structured for easy sound layer addition                       |
| 2026-01-04 | Tutorial from day one       | "What's New" overlay present even in scaffold                                     |
| 2026-01-04 | Garden as editor            | The visual form IS the syntax; direct manipulation of structure                   |
| 2026-01-04 | core/ folder for pure logic | Enables Node CLI tools, testing, agentic harness                                  |
| 2026-01-04 | CLI tools for agent         | Agent can validate hypotheses without browser; tighter loops                      |
| 2026-01-04 | Vitest for testing          | Fast, Vite-native; unit tests for core, light behavioral tests                    |
| 2026-01-04 | Creator process documented  | Human speaks feedback, agent implements; minimize context-switching               |
| 2026-01-04 | Corner dock UI              | Minimal icons at corners expand to panels; cleaner than fixed panels              |
| 2026-01-04 | CSS animations for sway     | Ambient motion via CSS, not React state; better performance                       |
| 2026-01-04 | 1s simulation tick          | Slow tick for logic, CSS for visuals; 60fps re-renders eliminated                 |
| 2026-01-04 | Plants grow from rocks      | Rocks are anchors; plants reach into sky, not buried in islands                   |
| 2026-01-04 | CSS vs SVG transform bug    | CSS animation transform overrides SVG transform attr; removed CSS sway            |
| 2026-01-04 | Recursive branching         | Plants have Y-forks, sub-branches; more buds per plant                            |
| 2026-01-04 | UI panel expand animation   | Icon in corner, panel expands from it; × replaces icon when open                  |
| 2026-01-04 | World Inspector panel       | Collapsible tree view of world hierarchy; first step toward projective UI         |
| 2026-01-04 | Projective UI vision        | Same structure viewable as outliner or rendered; per-node lens switching          |
| 2026-01-05 | Lucide React icons          | Consistent icon library for UI; replaces emoji/text icons; clean, modern          |
| 2026-01-05 | Corner-anchored close btns  | Close button (×) appears in same position as panel icon for each corner           |
| 2026-01-05 | Agent workflow checklist    | Mandatory git branching + doc updates for all agent work; enables parallel        |
| 2026-01-05 | OKLCH color interpolation   | Perceptual color space for smooth day/night transitions; no muddy midtones        |
| 2026-01-05 | Day/night cycle system      | Time-based color scheme cycling; configurable day length, pause/scrub UI          |
| 2026-01-05 | CSS vars for dynamic colors | All colors via custom properties; entire UI adapts to day/night mode              |
| 2026-01-05 | Pie menu for node actions   | Right-click on plant nodes opens radial menu with trim/branch actions             |
| 2026-01-05 | Trim action removes subtree | Pruning from any non-root node removes entire subtree below it                    |
| 2026-01-05 | Branch action on stems      | Creates new bud branching from stem; enables player-directed growth               |
| 2026-01-05 | Unified simulation control  | dayCycle.running is master toggle; pausing time pauses plant growth too           |
| 2026-01-05 | Hierarchical tutorial       | Collapsible sections; new features highlighted; serves as both guide + changelog  |
| 2026-01-05 | Consistent corner dock UI   | All four corner panels use same HUD pattern; icon→panel expansion                 |
| 2026-01-04 | Particle entity type        | Free-floating entities: seeds, fireflies; separate from plant/rock hierarchy      |
| 2026-01-04 | Seeds from flowers          | Flowers release seeds that float (brownian + wind), can land and root into plants |
| 2026-01-04 | Firefly day-night behavior  | Fireflies spawn at dusk, glow/fly at night, attracted to lights, land during day  |
| 2026-01-04 | Buds become flowers         | Deep buds have chance to flower instead of continuing growth; terminal nodes      |
| 2026-01-05 | ESLint + Prettier           | Consistent code style; explicit return types on exports; TypeScript-first linting |
| 2026-01-05 | type over interface         | Consistent with discriminated unions; all types use `type` keyword                |
| 2026-01-05 | Exhaustive switch matching  | Uses `never` type in default case to catch unhandled message types at compile time|
| 2026-01-05 | Modular update.ts split     | Actions, simulation, tutorial extracted to `core/` submodules; keeps update.ts thin|
| 2026-01-05 | Audio: Tone.js + Howler.js  | Hybrid approach: Tone.js for generative ambient/drones, Howler.js for discrete samples |
| 2026-01-05 | Proteus-inspired audio      | Entity-driven layered audio; sounds blend based on proximity and camera focus |
| 2026-01-05 | Audio on first interaction  | No modal; starts on first click/pan; speaker toggle in HUD for mute control |
| 2026-01-05 | Organic + synth aesthetic   | Audio mixes breathy/organic textures with crystalline/synthetic tones |
| 2026-01-05 | Sparse void, dense focus    | Audio density increases with zoom level; void is quiet, close-up is richer |
| 2026-01-05 | Localized detail in shapes  | Rocks use mostly-convex base + selective subdivision; avoids spiky uniform noise |

---

## 23. Aesthetic References + Vibe

The agent should internalize these not as constraints but as **taste anchors**—touchstones to return to when making visual, interactive, or structural decisions. The garden should feel like it belongs in the same universe as these things.

### Generative & Computational Art

- **Tyler Hobbs** (Fidenza): Organic flow fields, structured randomness, palette discipline
- **inconvergent** (Anders Hoff): Differential growth, sandspline, emergent complexity from simple rules
- **Nervous System**: Generative jewelry/objects—cellular, reaction-diffusion, voronoi
- **Jared Tarbell** (complexification.net): Substrate, Bubble Chamber—accretive, crystalline growth
- **Casey Reas**: Process-driven, systemic, but still warm

### Procedural Shape Generation Principles

When generating organic shapes procedurally (rocks, islands, terrain, etc.), avoid uniform randomness that creates "AI slop" — spiky, noisy shapes that don't read as natural. Instead:

**Base shape first, detail second**:
1. Start with a simple, mostly-convex silhouette (5-7 major vertices for rocks)
2. Keep most edges long and smooth — these define the recognizable form
3. Select specific areas (1-2 edges, not all) for localized detail
4. Subdivide selected areas with crevices (inward dips) or protuberances (outward bumps)

**Why this works**:
- Real rocks, islands, and organic forms have _dominant structure_ with _localized variation_
- Uniform noise applied everywhere creates spiky stars, not boulders
- The eye reads the long edges as "the shape" and the detailed areas as "texture"
- Variation in _where_ detail appears matters more than how much detail exists

**Implementation pattern (as in Rock.tsx)**:
```typescript
// 1. Build base shape with few major vertices
const baseVertices = generateConvexBase(5 + random() * 2);

// 2. Select 1-2 edges for detail (not all)
const detailEdges = selectRandomEdges(baseVertices, 1 + random());

// 3. Subdivide only selected edges
for (edge of edges) {
  if (detailEdges.has(edge)) {
    addDetailPoints(edge, isCrevice: random() > 0.5);
  } else {
    keepAsLongEdge(edge);  // Preserve smooth silhouette
  }
}
```

**Generalize this pattern to other shapes**: islands, terrain features, clouds, etc. The key insight is _selective complexity_ rather than _uniform noise_.

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
- **Greens** (plants, life): _Extremely_ rich series. Moss greens, fern greens, lichen yellowy-greens, deep forest greens, new-growth bright greens. This is where the life is.
- **Accents**: Botanical pops — flower colors, berry colors — used sparingly. Warm corals, cool violets, bright yellows. Earned, not scattered.

**Atmosphere**: Humid light filtered through canopy. Not harsh sun, not gloom. The luminous gray-green of an overcast forest morning.

**Theming infrastructure**: CSS custom properties for all colors. Semantic naming (--color-rock-dark, --color-leaf-fresh, etc.). Scheme switching scaffolded from start.

---

## 24. Repo Structure

```
/
├── SOURCE.md              # This file — vision, architecture, aesthetic
├── docs/                  # All project documentation
│   ├── README.md          # Entry point for agents — read first!
│   ├── AGENT-WORKFLOW.md  # Mandatory process (git, docs, completion reports)
│   ├── TODO.md            # Active task tracking — claim before working
│   ├── CHECKPOINTS.md     # Tour paths for significant features
│   └── transcripts/       # Conversation transcripts (creator-maintained)
│       └── README.md      # How to save transcripts
├── scripts/               # CLI tools for agent use (Node, no browser)
│   └── generate.ts        # Generate world, print summary
├── src/
│   ├── core/              # Pure logic (no React/DOM — runs in Node or browser)
│   │   ├── index.ts       # Re-exports all core modules
│   │   ├── model.ts       # Types + World + vec2 helpers
│   │   ├── generate.ts    # Procedural garden generation
│   │   ├── tutorial.ts    # Tutorial step completion
│   │   ├── actions/       # Pure action functions
│   │   │   ├── index.ts
│   │   │   └── plant.ts   # sproutBud, pruneNode, branchFromNode
│   │   └── simulation/    # Simulation tick logic
│   │       ├── index.ts
│   │       └── particles.ts # Seeds, fireflies, lifecycle
│   ├── update.ts          # Msg type + update dispatcher (thin, delegates to core/)
│   # NOTE: src/audio/ planned but not yet implemented — see section 25
│   ├── render/            # React/DOM/SVG (browser only)
│   │   ├── Canvas.tsx     # Background layer (atmosphere)
│   │   ├── Garden.tsx     # SVG world layer
│   │   └── paths.ts       # Bezier/polyline path utilities
│   ├── theme/
│   │   ├── colors.ts      # Palette constants
│   │   ├── dayNightScheme.ts # OKLCH interpolation
│   │   ├── oklch.ts       # Color space utilities
│   │   └── global.css     # CSS custom properties
│   ├── ui/
│   │   ├── HUD.tsx        # Tutorial + Debug corner docks
│   │   ├── WorldInspector.tsx
│   │   ├── PieMenu.tsx    # Context menu for plant actions
│   │   ├── TimeConfig.tsx # Day/night cycle controls
│   │   └── *.css          # Component styles
│   ├── hooks/
│   │   └── useCamera.ts
│   └── App.tsx            # Main composition
├── tests/                 # Vitest tests
│   └── core/
│       ├── actions.test.ts    # Plant action tests
│       ├── generate.test.ts   # Generation tests
│       └── model.test.ts      # Model + vec2 tests
├── eslint.config.js       # ESLint flat config (TS, React hooks)
├── .prettierrc            # Prettier config
├── index.html
├── vite.config.ts
├── vitest.config.ts
└── package.json
```

---

## 25. Audio System Architecture

> **Status**: Planned, not yet implemented. The hooks (`onAudioEvent`) exist in `update.ts`. See `docs/TODO.md` for implementation tasks.

The garden will have a Proteus-inspired audio system: sounds and music emerge from what's visible and nearby rather than from composed tracks. The audio should feel as organic as the visuals—a mix of breathy, natural textures and crystalline, synthetic tones.

### Audio References + Vibe

- **Proteus** (Ed Key, David Kanaga): The primary inspiration. Every entity has a musical signature; the "song" emerges from what you're near. Exploration creates composition.
- **Brian Eno's generative work**: Long-form ambient that evolves slowly, never quite repeating.
- **Ólafur Arnalds' Stratus**: Generative piano pieces; simple notes, complex emergence.
- **Wind through trees, distant chimes**: Natural soundscapes with occasional crystalline accents.

### Technical Stack

- **Tone.js**: Generative ambient layers, drones, synthesized sounds. Provides oscillators, filters, effects, transport scheduling.
- **Howler.js**: Discrete sample playback for action sounds (snip, sprout). Lightweight, handles audio sprites.
- **Web Audio API**: Underlying browser audio (both libraries use it). Requires user gesture to start.

### Architecture

```
src/
├── audio/                          # Audio system (browser only)
│   ├── index.ts                    # Re-exports, AudioSystem init
│   ├── engine.ts                   # AudioEngine: context lifecycle, master volume
│   ├── ambient/                    # Continuous layers (always playing, volume-modulated)
│   │   ├── index.ts
│   │   ├── voidDrone.ts            # Base airy ambient (quiet in void)
│   │   ├── dayNightShift.ts        # Shifts harmonic palette based on timeOfDay
│   │   └── clusterVoice.ts         # Per-cluster harmonic voice (seed-deterministic)
│   ├── discrete/                   # One-shot sounds triggered by events
│   │   ├── index.ts
│   │   ├── actionSounds.ts         # Sprout, prune, branch, trim
│   │   ├── uiSounds.ts             # Menu open/close, select (subtle)
│   │   └── particleSounds.ts       # Firefly buzz, seed whisper
│   └── mixer.ts                    # LayerMixer: adjusts volumes based on World state
```

### Existing AudioEvent Hooks

The update system already emits audio events. The audio system just needs to subscribe:

```typescript
// In update.ts (already exists)
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

export function onAudioEvent(listener: (event: AudioEvent) => void): () => void;
```

### Layering Model

Audio layers stack based on what's on screen:

| Layer | Content | Volume Driver |
|-------|---------|---------------|
| **Base drone** | Airy, minimal, always present | Low constant; slightly louder in void |
| **Time-of-day** | Harmonic shift (bright day, dark night) | Follows `dayCycle.timeOfDay` |
| **Cluster voice** | Each cluster has a chord/texture | Proximity to cluster center |
| **Island variation** | Subtle variations within cluster | When single island dominates view |
| **Particle sounds** | Firefly twinkles, seed whispers | When particles are visible |
| **Action sounds** | Sprout blip, snip click, etc. | Triggered by `AudioEvent` |

### Proximity Mixing

The `LayerMixer` continuously reads world state each frame (or on change):

```typescript
type AudioMixState = {
  voidness: number;         // 0-1: how much "empty" void is on screen
  clusterProximities: Map<Id, number>;  // cluster id → 0-1 volume
  islandFocus: Id | null;   // if one island dominates the view
  timeOfDay: number;        // 0-1 from dayCycle
  zoomLevel: number;        // affects detail/density
};
```

### Density Philosophy (Open Question)

How dense should the audio be?

- **Sparse/Zen approach**: Mostly silence. Sounds appear only when things happen. Proteus leans this way outside of dense forests.
- **Continuous bed approach**: Always a gentle hum. Layers add on top. More traditional ambient.
- **Zoom-adaptive**: Sparse when zoomed out (void view), denser when zoomed in (island detail).

Current direction: **zoom-adaptive**. Void is quiet and sparse. Zooming into an island gradually fills in layers. But this is still being explored.

### User Controls

- **Speaker icon in HUD** (corner dock pattern): Toggle audio on/off
- **Volume slider** (future): Master volume control
- **Layer balance** (future): Let users adjust ambient vs discrete sounds

### Sample Assets (Future)

May include recorded samples for:
- Snip/cut sounds (satisfying scissor click)
- Sprout sounds (organic unfurling)
- Wind/breath textures (layered into drones)

For MVP, synthesize all sounds. Samples can be added later for richer texture.

---

_This document is the shared whiteboard. Agents read it, act on it, update it. Humans steer via feedback. The garden grows._
