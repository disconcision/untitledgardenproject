# Hanging Garden — Task Tracking

> **Agents: Check this before starting work.** Claim a task, do it, mark it done.

---

## Milestone Status

| Milestone | Status | Notes |
|-----------|--------|-------|
| **M1 — MVP Garden** | ✅ Complete | Core viewport, camera, generation, rendering, basic interactions |
| **M2 — Polished Tactility** | 🟡 Mostly Complete | Hover states done; transitions and timing audit remain |
| **M3 — Space Lens Mechanic** | ⬜ Not Started | Choose and implement exploration mechanic |
| **M4 — Ecosystem Hooks** | ⬜ Not Started | Environmental factors affecting growth |
| **M5 — Baroque Growth** | ⬜ Not Started | Multiple plant varieties, deeper structure |

---

## Parallelization Guide

These workstreams can be worked on independently by different agents:

| Workstream | Dependencies | Notes |
|------------|--------------|-------|
| **Audio System** | None | Completely independent; hooks already exist in `update.ts` |
| **UI/UX Bug Fixes** | None | Isolated fixes to existing panels |
| **Visual Polish (M2)** | None | Animations, transitions, timing |
| **Scene Depth** | None | Fog, layers, atmosphere |
| **Space Lens (M3)** | Benefits from M2 polish | Core exploration feature |
| **Ecosystem (M4)** | None | New simulation mechanics |
| **Entity System** | None | Infrastructure improvement |
| **Projective UI** | Basic UI stability | Builds on WorldInspector |

**Strong dependencies to note:**
- Audio Phase 2/3 → requires Audio MVP complete
- M5 (Baroque Growth) → should wait for M3/M4 patterns to stabilize

---

## In Progress

_Tasks currently being worked on. Include session date or identifier._

_(none currently)_

---

## Up Next (Priority Order)

### 🔊 Audio System MVP
_Workstream: Audio | Dependency: None | Parallelizable: Yes_

- [ ] **Audio engine scaffold**: Create `src/audio/` structure, install Tone.js + Howler.js, AudioEngine class with context lifecycle
- [ ] **User gesture activation**: Start audio on first interaction (click/pan), add speaker toggle icon to HUD
- [ ] **Action sounds (synthesized)**: Discrete sounds for sprout, prune, branch, trim — hook into existing AudioEvent system
- [ ] **Void drone**: Basic airy ambient pad using Tone.js oscillators/filters, always playing at low volume

### ✨ Visual Polish (M2 Completion)
_Workstream: Visual | Dependency: None | Parallelizable: Yes_

- [ ] **Smooth camera focus transition**: Animate pan/zoom when double-clicking to focus (currently instant)
- [ ] **Sprout animation**: Animate new branch appearing (scale up, unfurl)
- [ ] **Prune animation**: Animate subtree removal (fade/collapse before removing)
- [ ] **Animation timing audit**: Standardize durations (150ms hovers, 300ms growth) per SOURCE.md spec


### 🎨 Scene Depth & Atmosphere
_Workstream: Visual | Dependency: None | Parallelizable: Yes_

- [ ] **Isometric projection + depth-based z-ordering**
- [ ] **Multiple clusters with improved fog/distance rendering**
- [ ] **Background scale layers**: Mountains, giant trees in distance for depth cues

---

## Backlog

### M3 — Space Lens Mechanic
_Dependency: Benefits from M2 polish | Parallelizable: Yes_

- [ ] **Choose mechanic**: Focus lens vs neighborhood unfold (design decision)
- [ ] **Implement chosen mechanic**
- [ ] **Update tutorial for new mechanic**

### M4 — Ecosystem Hooks
_Dependency: None | Parallelizable with M3: Yes_

- [ ] **Humidity/crowding fields**: Per-island environmental factors
- [ ] **Growth rate varies by conditions**
- [ ] **Visible field visualization**: Very subtle overlays
- [ ] **Tutorial updated for ecosystem**

### M5 — Baroque Growth
_Dependency: M3 and M4 patterns established_

- [ ] **Multiple plant varieties**: Grammar-based generation
- [ ] **Cross-links/vines forming loops**
- [ ] **Deeper layered rendering**

### 🔊 Audio Phase 2 — Proximity & Layers
_Dependency: Audio MVP complete_

- [ ] **Day/night ambient shift**: Drone harmonic palette changes based on `timeOfDay`
- [ ] **Firefly sounds**: Subtle high-pitched tones when fireflies are visible
- [ ] **Seed whispers**: Very soft "puff" sounds when seeds spawn or land
- [ ] **Cluster voice system**: Each cluster gets deterministic (seed-based) harmonic voice
- [ ] **Proximity mixer**: Fade cluster voices in/out based on camera distance
- [ ] **Zoom-level mixing**: Zoomed out = broader ambient; zoomed in = more detail
- [ ] **Stereo positioning**: Sounds pan left/right based on screen position

### 🔊 Audio Phase 3 — Generative & Polish
_Dependency: Audio Phase 2 complete_

- [ ] **Island variation**: Islands within a cluster have subtle harmonic variations
- [ ] **Procedural melodic fragments**: Occasional simple note sequences from flowers/buds
- [ ] **Temporal layers**: Different music palettes for dawn/noon/dusk/midnight
- [ ] **Sample assets**: Record/source high-quality samples for action sounds
- [ ] **Audio settings panel**: User control for master volume, layer balance
- [ ] **Entity leitmotifs**: Specific large plants or features get unique phrases

### 🧩 Entity System Unification
_Dependency: None | Parallelizable: Yes_

- [ ] **Rocks as node meshes**: Attachment points at corners, edges, interior Voronoi
- [ ] **Particles selectable**: Seeds/fireflies clickable in world view
- [ ] **Particles in hierarchy**: Seeds/fireflies appear in WorldInspector tree
- [ ] **Containment transitions**: Landing = join new parent structure
- [ ] **Selection sync**: WorldInspector ↔ world view (bidirectional)
- [ ] **Entity inspector panel**: Show properties of selected object
- [ ] **Firefly-plant interaction**: Fireflies land on nodes, orbit features

### 📐 Projective UI
_Dependency: Basic UI stability | Parallelizable: Yes_

- [ ] **Inline rendering of subtrees**: Miniature graphics within inspector tree
- [ ] **Situated inspection**: Pop open inspector anchored to world position
- [ ] **UI chrome as tree nodes**: Menus, config in projective paradigm
- [ ] **Comparison views**: Side-by-side worlds, branching

### 🖥️ UI Improvements
_Dependency: None | Parallelizable: Yes_

- [ ] **Smart menu space sharing**: Adjust menu positions to avoid overlap

### 🛠️ Infrastructure & Meta Features
_Various dependencies — see notes_

- [ ] **Undo/redo stack**: Enable reverting actions (requires action log)
- [ ] **Action log/replay**: Record actions for time-lapse and debugging
- [ ] **Save/load (LocalStorage)**: Persist garden state, JSON export
- [ ] **Seed sharing**: Export/import garden seeds for reproducibility

### 🎨 Stretch / Opportunistic
_Low priority, pick when inspired_

- [ ] **Growth grammar editor**: Drag rules to change plant generation
- [ ] **Alternate skins**: Botanical / coral / circuitry / crystal
- [ ] **Time-lapse replay**: Action log playback as animation
- [ ] **Sandbox tools**: Sprinkle seeds, place rocks, carve soil

---

## Completed

### 2026-01-05

- [x] UI Panel Fixes batch:
  - Padding/margin inconsistency on menu boxes (unified to 12px all sides)
  - Two-finger scroll event capture (camera wheel handler skips hud-corner elements)
  - Tutorial menu scrolling (max-height 50vh + overflow)
  - Z-index focus system (CSS class .panel-focused with z-index 150 !important)
  - CSS cleanup (removed duplicate rules in WorldInspector.css)
- [x] Workflow documentation improvements
- [x] Tutorial completion hooks for simulation and panel steps
- [x] Unified simulation model: day cycle pause pauses plant growth
- [x] TimeConfig panel restyled to match HUD corner dock pattern
- [x] All UI panels sync with day/night color scheme
- [x] Hierarchical tutorial with sections
- [x] Pie menu for plant node actions (branch/trim/center)
- [x] Day/night cycle with perceptual color interpolation
- [x] Lucide icons + corner panel alignment
- [x] Enhanced plant node hover effects
- [x] Interactive World Inspector + plant tree structure

### 2026-01-04

- [x] Particle system: seeds/pollen and fireflies
- [x] Particle movement smoothness improvements
- [x] Particle refinements (day length presets, drift, spawn rates)
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

### Picking Work

1. **Check "In Progress"** — don't duplicate someone else's work
2. **Consider parallelization** — workstreams can be worked independently
3. **Respect dependencies** — don't start work that depends on incomplete items

### Claiming a Task

1. Move task from "Up Next" or "Backlog" to "In Progress"
2. Add date: `- [ ] **[2026-01-05]** Task description`
3. Do the work

### Completing a Task

1. Move from "In Progress" to "Completed" under the current date
2. Change `[ ]` to `[x]`
3. Add checkpoint reference if relevant: `(CP-015)`

### Adding New Tasks

- Small fixes/improvements: Add to "Up Next" with workstream tag
- Larger features: Add under appropriate section in "Backlog"
- Urgent bugs: Add to top of "Up Next" with `**URGENT**` prefix

---

_This file is the source of truth for what's being worked on. Update it every session._
