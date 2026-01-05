# Hanging Garden — Task Tracking

> **Agents: Check this before starting work.** Claim a task, do it, mark it done.

## In Progress

_Tasks currently being worked on. Include session date or identifier._

_(none currently)_

## Up Next

High-priority tasks ready to be claimed:

- [ ] Smooth animated camera focus transition
- [ ] Isometric projection + depth-based z-ordering
- [ ] Multiple clusters with improved fog/distance rendering refinements
- [ ] Background scale layers (mountains, giant trees in distance)

## Backlog

### M3 — Space Lens Mechanic

- [ ] Choose mechanic: focus lens vs neighborhood unfold
- [ ] Implement chosen mechanic
- [ ] Update tutorial for new mechanic

### M4 — Ecosystem Hooks

- [ ] Humidity/crowding fields
- [ ] Growth rate varies by conditions
- [ ] Visible field visualization (very subtle)
- [ ] Tutorial updated for ecosystem

### M5 — Baroque Growth

- [ ] Multiple plant varieties (grammar-based generation)
- [ ] Cross-links/vines forming loops
- [ ] Deeper layered rendering
- [ ] Sound (optional)

### Projective UI

- [ ] Inline rendering of subtrees within inspector
- [ ] Situated inspection (pop open inspector anchored to world position)
- [ ] UI chrome as tree nodes in the projective paradigm
- [ ] Comparison views (side-by-side worlds, branching)

### Entity System Unification

- [ ] Rocks as node meshes with attachment points (corners, edges, interior Voronoi)
- [ ] Seeds/fireflies clickable and selectable in world view
- [ ] Seeds/fireflies appear in world tree hierarchy
- [ ] Particle containment transitions (landing = join new parent structure)
- [ ] Selection sync between world view and tree menu (click in one = select in other)
- [ ] Entity inspector panel showing properties of selected object
- [ ] Fireflies interact more with plants (land on nodes, orbit specific features)

### Stretch / Opportunistic

- [ ] Growth grammar editor
- [ ] Alternate skins (botanical / coral / circuitry / crystal)
- [ ] Time-lapse replay (action log playback)
- [ ] Sandbox tools (sprinkle seeds, place rocks, carve soil)
- [ ] Save/load (LocalStorage snapshots, JSON export)

---

## Completed

_Move completed items here with date._

### 2026-01-04

- [x] Particle system: seeds/pollen and fireflies
  - Particle entity type with floating/landed/rooting states
  - Seeds spawn from flowers, float with brownian motion + wind, can land and take root
  - Fireflies spawn at dusk, glow at night, attracted to flowers and buds
  - Plants can now flower (buds turn into flowers at deeper depths)
- [x] Particle movement smoothness improvements
  - Fast particle tick (50ms) for continuous smooth movement
  - Seeds use sinusoidal wind patterns with rotation tracking
  - Curved seed tails with secondary wisps
  - Brighter firefly glow with layered effects
- [x] Particle refinements
  - Day length presets now logarithmic: 5s, 15s, 1 min, 5 min
  - Seeds drift much farther between islands with stronger wind
  - Fireflies spawn more frequently and land during day
  - Slightly smaller firefly glow for subtlety

### 2026-01-05

- [x] Workflow documentation improvements (Phase 0, validation checklist, git strategy guidance)
- [x] Tutorial completion hooks for simulation and panel steps (time-pause, time-scrub, watch-grow, inspector, debug)
- [x] Tutorial maintenance documentation in AGENT-WORKFLOW.md
- [x] Unified simulation model: day cycle pause also pauses plant growth
- [x] TimeConfig panel restyled to match HUD corner dock pattern
- [x] All UI panels sync with day/night color scheme
- [x] Removed "World" header from WorldInspector
- [x] Hierarchical tutorial with sections (Navigation, Plants, Simulation, Panels)
- [x] New features highlighted with "NEW" badge in tutorial
- [x] Pie menu for plant node actions (branch/trim/center)
- [x] Day/night cycle with perceptual color interpolation
- [x] Lucide icons + corner panel alignment
- [x] Enhanced plant node hover effects
- [x] Interactive World Inspector + plant tree structure

### 2026-01-04

- [x] Scaffold Vite + React + TS (CP-001)
- [x] Reorganize into core/ and render/ (CP-002)
- [x] Add Vitest + unit tests (CP-002)
- [x] CLI scripts for agent use (CP-002)
- [x] Camera pan/zoom (CP-001)
- [x] Procedural generator for islands + plants (CP-001)
- [x] SVG render stems/leaves + hover/selection (CP-001)
- [x] Click bud → sprout; click leaf → prune (CP-003)
- [x] Tutorial overlay v1 (CP-001)
- [x] Debug toggles (CP-001)
- [x] Canvas background gradient + grain (CP-001)
- [x] Compound rock formations (CP-005)
- [x] Bark-like stem thickness (CP-005)
- [x] Autonomous plant growth simulation (CP-006)
- [x] Cluster abstraction with central glyph (CP-007)
- [x] Multiple clusters with fog/distance rendering (CP-008)
- [x] World Inspector panel (CP-008)

---

## How to Use This File

### Claiming a Task

1. Move task from "Up Next" or "Backlog" to "In Progress"
2. Add date: `- [ ] **[2026-01-05]** Task description`
3. Do the work

### Completing a Task

1. Move from "In Progress" to "Completed" under the current date
2. Change `[ ]` to `[x]`
3. Add checkpoint reference if relevant: `(CP-015)`

### Adding New Tasks

- Small fixes/improvements: Add to "Up Next"
- Larger features: Add under appropriate milestone in "Backlog"
- Urgent bugs: Add to top of "Up Next" with `**URGENT**` prefix

---

_This file is the source of truth for what's being worked on. Update it every session._
