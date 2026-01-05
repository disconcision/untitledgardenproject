# Hanging Garden — Design + Agent Workflow

A browser-based software toy: a dense, tactile, explorable _floating garden_ of algorithmic, multi-scale structures. Plants, soil clumps, stones, and attachments drift in airy space. The underlying data stays close to what you see—the garden _is_ the syntax.

---

## ⚠️ Agent Workflow Checklist (MANDATORY)

**Every agent making changes MUST follow this workflow.** This applies to all feature work, bug fixes, and improvements.

### Before Starting Work

1. **Create a feature branch**
   ```bash
   git checkout main && git pull
   git checkout -b feature/<short-descriptive-name>
   ```
   - Use descriptive names: `feature/lucide-icons`, `feature/pie-menu`, `fix/panel-alignment`
   - This creates a record of the work and allows parallel agent work

### During Work

2. **Make focused changes** — 1–3 coherent improvements per session, not scattered edits
3. **Test in browser** — Verify changes work visually; use Cursor's browser tools
4. **Check for lint errors** — Run `read_lints` on modified files

### After Completing Work

5. **Update documentation** (if relevant):

   - **SOURCE.md**: Add to Design Decisions Log if you made architectural/tooling choices
   - **CHECKPOINTS.md**: Add checkpoint entry with description and tour path
   - **Tutorial steps**: Update if user-facing behavior changed

6. **Commit with clear message**

   ```bash
   git add -A
   git commit -m "feat: <what you did>"
   ```

   - Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`

7. **Merge to main**
   ```bash
   git checkout main && git pull
   git merge feature/<branch-name>
   git push
   ```
   - Handle merge conflicts if they arise from parallel agent work
   - Delete the feature branch after merging: `git branch -d feature/<branch-name>`

### What Triggers Documentation Updates

| Change Type            | Update SOURCE.md?  | Update CHECKPOINTS.md? |
| ---------------------- | ------------------ | ---------------------- |
| New dependency/library | ✓ Design Decisions | ✓                      |
| UI/UX pattern change   | ✓ Design Decisions | ✓                      |
| Architectural decision | ✓ Design Decisions | ✓                      |
| Bug fix                | Maybe              | ✓                      |
| Visual polish only     | No                 | Optional               |
| Refactoring            | Maybe              | No                     |

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

1. **View the artifact** — Open the garden in browser (ideally Cursor's built-in browser pane)
2. **Observe and react** — Pan, zoom, interact; notice what feels right or wrong
3. **Speak feedback** — Audio recording while interacting; stream of consciousness is fine
4. **Prompt the agent** — Audio transcription goes to the agent panel
5. **Agent implements** — Changes happen; HMR refreshes the view
6. **Repeat** — Stay in one environment as much as possible

**Goal**: Minimize context-switching. The creator should be able to stay in the garden (or one window) and just _talk_. The agent does the implementation work.

**Roles**:

- **Creator**: Vision, feedback, direction, taste. Speaks more than types.
- **Agent**: Implementation, iteration, documentation, testing. Writes code, updates SOURCE.md, proposes changes.

These roles can flex — the creator might implement, the agent might propose vision — but this is the default posture.

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

- [x] Refined hit testing + hover states (CP-010, CP-014: all entities have hover effects)
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

## 18. Agentic Harness

The agent (Claude, running in Cursor) benefits from tools beyond just the browser. This section describes infrastructure for tighter agent feedback loops.

### Node CLI Tools

The core logic (model, update, generate, simulation) is **pure TypeScript** with no React/DOM dependencies. This enables:

- **Headless generation**: `npx tsx scripts/generate.ts --seed 42` → prints world summary
- **Validation**: `npx tsx scripts/validate.ts` → checks invariants, runs quick tests
- **Inspection**: `npx tsx scripts/inspect.ts --id island-3` → prints entity details

These tools are **primarily for the agent** to use during development:

- Quick hypothesis validation without spinning up the browser
- Test logic changes before visual verification
- Get structured output (JSON, counts, diffs) for comparison

If these tools don't meaningfully help the agent iterate, they can be simplified or removed. The goal is tighter loops, not infrastructure for its own sake.

### Directory Structure

```
scripts/
├── generate.ts   # CLI: generate world, print summary
├── validate.ts   # CLI: run quick invariant checks
└── inspect.ts    # CLI: inspect specific entities
src/
├── core/         # Pure logic (no React)
│   ├── model.ts
│   ├── update.ts
│   ├── generate.ts
│   └── sim/
│       └── tick.ts
├── render/       # React/DOM/SVG (browser only)
├── ui/           # React components
└── ...
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

## 20. Initial TODOs

- [x] Scaffold Vite + React + TS _(CP-001)_
- [x] Reorganize into `core/` (pure logic) and `render/` (React) _(CP-002)_
- [x] Add Vitest + basic unit tests _(CP-002)_
- [x] Add CLI scripts for agent use _(CP-002)_
- [x] Implement camera pan/zoom _(CP-001)_
- [x] Procedural generator (seeded) for islands + plants _(CP-001)_
- [x] SVG render stems/leaves + hover/selection _(CP-001)_
- [x] Click bud → sprout; click leaf → prune _(CP-003)_
- [x] Tutorial overlay v1 _(CP-001)_
- [x] Debug toggles: show IDs, hit targets, freeze time, regenerate _(CP-001)_
- [x] Canvas background gradient + grain _(CP-001)_
- [x] Create `CHECKPOINTS.md` _(CP-001)_
- [x] Compound rock formations (glacial erratic aesthetic) _(CP-005)_
- [x] Bark-like stem thickness (depth gradient) _(CP-005)_
- [x] Autonomous plant growth simulation _(CP-006)_
- [x] Cluster abstraction with central glyph _(CP-007)_
- [ ] Smooth animated camera focus transition
- [ ] Isometric projection + depth-based z-ordering
- [ ] Multiple clusters with fog/distance rendering
- [ ] Background scale layers (mountains, giant trees)
- [x] World Inspector panel (collapsible tree view) _(CP-008)_

### Projective UI (future)

- [ ] Inline rendering of subtrees within inspector
- [ ] Situated inspection (pop open inspector anchored to world position)
- [ ] UI chrome as tree nodes in the projective paradigm
- [ ] Comparison views (side-by-side worlds, branching)

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

| Date       | Decision                    | Rationale                                                                  |
| ---------- | --------------------------- | -------------------------------------------------------------------------- |
| (init)     | React + TS + Vite           | Mainstream, fast reload, TS for type safety                                |
| (init)     | SVG + Canvas hybrid         | SVG for crisp paths, Canvas for atmosphere                                 |
| (init)     | MVU-ish architecture        | Clean state, enables undo/replay                                           |
| 2026-01-04 | Git for checkpointing       | Commits as checkpoints, describe in docs, branches when exploring          |
| 2026-01-04 | Wiki-style docs folder      | SOURCE.md spawns sub-docs as complexity grows; [[bracket]] links allowed   |
| 2026-01-04 | Bezier splines first        | More organic feel; polylines available as alternative primitive later      |
| 2026-01-04 | Rich theming infrastructure | CSS variables, color scheme controls; dark mode planned but not default    |
| 2026-01-04 | Sound hooks from start      | Interaction events structured for easy sound layer addition                |
| 2026-01-04 | Tutorial from day one       | "What's New" overlay present even in scaffold                              |
| 2026-01-04 | Garden as editor            | The visual form IS the syntax; direct manipulation of structure            |
| 2026-01-04 | core/ folder for pure logic | Enables Node CLI tools, testing, agentic harness                           |
| 2026-01-04 | CLI tools for agent         | Agent can validate hypotheses without browser; tighter loops               |
| 2026-01-04 | Vitest for testing          | Fast, Vite-native; unit tests for core, light behavioral tests             |
| 2026-01-04 | Creator process documented  | Human speaks feedback, agent implements; minimize context-switching        |
| 2026-01-04 | Corner dock UI              | Minimal icons at corners expand to panels; cleaner than fixed panels       |
| 2026-01-04 | CSS animations for sway     | Ambient motion via CSS, not React state; better performance                |
| 2026-01-04 | 1s simulation tick          | Slow tick for logic, CSS for visuals; 60fps re-renders eliminated          |
| 2026-01-04 | Plants grow from rocks      | Rocks are anchors; plants reach into sky, not buried in islands            |
| 2026-01-04 | CSS vs SVG transform bug    | CSS animation transform overrides SVG transform attr; removed CSS sway     |
| 2026-01-04 | Recursive branching         | Plants have Y-forks, sub-branches; more buds per plant                     |
| 2026-01-04 | UI panel expand animation   | Icon in corner, panel expands from it; × replaces icon when open           |
| 2026-01-04 | World Inspector panel       | Collapsible tree view of world hierarchy; first step toward projective UI  |
| 2026-01-04 | Projective UI vision        | Same structure viewable as outliner or rendered; per-node lens switching   |
| 2026-01-05 | Lucide React icons          | Consistent icon library for UI; replaces emoji/text icons; clean, modern   |
| 2026-01-05 | Corner-anchored close btns  | Close button (×) appears in same position as panel icon for each corner    |
| 2026-01-05 | Agent workflow checklist    | Mandatory git branching + doc updates for all agent work; enables parallel |
| 2026-01-05 | OKLCH color interpolation   | Perceptual color space for smooth day/night transitions; no muddy midtones |
| 2026-01-05 | Day/night cycle system      | Time-based color scheme cycling; configurable day length, pause/scrub UI   |
| 2026-01-05 | CSS vars for dynamic colors | All colors via custom properties; entire UI adapts to day/night mode       |
| 2026-01-05 | Pie menu for node actions   | Right-click on plant nodes opens radial menu with trim/branch actions      |
| 2026-01-05 | Trim action removes subtree | Pruning from any non-root node removes entire subtree below it             |
| 2026-01-05 | Branch action on stems      | Creates new bud branching from stem; enables player-directed growth        |

---

## 23. Aesthetic References + Vibe

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
- **Greens** (plants, life): _Extremely_ rich series. Moss greens, fern greens, lichen yellowy-greens, deep forest greens, new-growth bright greens. This is where the life is.
- **Accents**: Botanical pops — flower colors, berry colors — used sparingly. Warm corals, cool violets, bright yellows. Earned, not scattered.

**Atmosphere**: Humid light filtered through canopy. Not harsh sun, not gloom. The luminous gray-green of an overcast forest morning.

**Theming infrastructure**: CSS custom properties for all colors. Semantic naming (--color-rock-dark, --color-leaf-fresh, etc.). Scheme switching scaffolded from start.

---

## 24. Repo Structure

```
/
├── SOURCE.md          # This file — the DNA
├── docs/              # Wiki-style design docs
│   ├── CHECKPOINTS.md # Git checkpoint log with tour paths
│   └── ...            # Additional docs as needed, [[bracket]] links
├── scripts/           # CLI tools for agent use (Node, no browser)
│   ├── generate.ts    # Generate world, print summary
│   ├── validate.ts    # Quick invariant checks
│   └── inspect.ts     # Inspect specific entities
├── src/
│   ├── core/          # Pure logic (no React/DOM — runs in Node or browser)
│   │   ├── model.ts   # Types + World
│   │   ├── update.ts  # Messages + update function
│   │   ├── generate.ts# Procedural garden generation
│   │   └── sim/
│   │       └── tick.ts# Simulation rules
│   ├── render/        # React/DOM/SVG (browser only)
│   │   ├── Canvas.tsx # Background layer (atmosphere)
│   │   ├── Garden.tsx # SVG world layer
│   │   └── paths.ts   # Bezier/polyline path utilities (pure, could move to core)
│   ├── theme/
│   │   ├── colors.ts  # Palette constants
│   │   └── global.css # CSS custom properties
│   ├── ui/
│   │   ├── HUD.tsx           # Tutorial + Debug corner docks
│   │   ├── WorldInspector.tsx# Collapsible tree view of world hierarchy
│   │   └── *.css             # Component styles
│   ├── hooks/
│   │   └── useCamera.ts
│   ├── audio/         # Sound hooks (scaffolded)
│   │   └── events.ts
│   └── App.tsx        # Main composition
├── tests/             # Vitest tests
│   ├── core/
│   │   ├── generate.test.ts
│   │   └── update.test.ts
│   └── setup.ts
├── index.html
├── vite.config.ts
├── vitest.config.ts
└── package.json
```

---

_This document is the shared whiteboard. Agents read it, act on it, update it. Humans steer via feedback. The garden grows._
