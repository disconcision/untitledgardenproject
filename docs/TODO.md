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
| **Orbital Dynamics** | None | Island movement around glyphs |
| **Glyph Pie Menu** | None | Context menus for cluster glyphs |
| **Multi-Cluster Focus** | None | Ability to select/focus different clusters |
| **Constellations & Pathways** | Multi-Cluster Focus | Inter-cluster connections |
| **Panspermia & Seeds** | Constellations for inter-cluster travel | Seed lifecycle, spreading life |
| ~~Cut/Graft Mechanic~~ | ~~None~~ | ✅ Complete |
| **Unified Force Model** | Orbital Dynamics, Constellations | Physics system for entities |

**Strong dependencies to note:**
- Audio Phase 2/3 → requires Audio MVP complete
- M5 (Baroque Growth) → should wait for M3/M4 patterns to stabilize
- Constellations & Pathways → benefits from Multi-Cluster Focus
- Panspermia → requires Constellations for inter-cluster seed travel
- Unified Force Model → builds on Orbital Dynamics and Constellations

---

## In Progress

_Tasks currently being worked on._

_(none currently)_

---

## Available Tasks

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
- [ ] **Pie menu contract animation fix**: Close animation has flickering/flash instead of smooth inward motion — likely CSS animation conflict or timing issue


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

### 🌀 Orbital Dynamics & Cluster Physics
_Dependency: None | Parallelizable: Yes_

**MVP:**
- [ ] **Island orbital movement**: Islands slowly rotate/orbit around their cluster's central glyph
  - Movement should be slow and subtle, not mechanical
  - Each island maintains its own natural orbital inclination (not all at same radius)
  - Variance in orbital speed per island for organic feel
- [ ] **Basic orbital force model**: Simple gravitational-like attraction toward glyph
  - Not exact physics — prioritize organic appearance over realism
  - Islands drift rather than snap to positions

**Future / Exploratory:**
- [ ] **Orbital radius adjustment**: Glyph pie menu option to push islands closer or farther
  - Islands gradually drift to new orbital radius (not instant teleport)
  - Preserve variance — don't force all to exact same radius
  - Goal: affect binding tightness while maintaining organic feel
- [ ] **3D orbital paths with 2D rendering**: Islands/rocks move in 3D orbital space but render as 2D
  - Incremental approach: start with 2D orbits, add depth later
  - Overlapping islands differentiated by subtle fog/opacity
  - Ones "further back" slightly foggier
  - Not full 3D rendering — just enough depth cue to disambiguate overlaps
- [ ] **Avoid mechanistic feel**: Whatever force setup we use, it shouldn't make islands feel like gears or clockwork
  - Some randomness in movement
  - Natural-feeling acceleration/deceleration
  - Occasional perturbations

### 🎯 Glyph Interaction & Entity Pie Menus
_Dependency: None | Parallelizable: Yes_

**MVP:**
- [ ] **Glyph pie menu**: Glyphs get their own right-click pie menu (like plant stems do)
  - Menu items positioned tightly around glyph center (use available space there)
  - Not on outer circle like plant menus — glyph has space around it
- [ ] **Cluster selection indicator**: When glyph is selected, draw a visual circle around the whole cluster
  - Signifies "this menu affects the whole cluster"
  - Subtle line/glow, not intrusive
- [ ] **Initial glyph menu actions**: At minimum, push islands closer/farther (orbital radius)
  - These affect the whole cluster's island arrangement

**Conceptual Vision:**
- [ ] **Universal entity pie menus**: Eventually every entity type should have a pie menu
  - Rocks, islands, particles (seeds, fireflies), plants already have them
  - Consistent interaction pattern across all entities
- [ ] **Glyph as cluster controller**: Glyph menu options affect cluster-wide properties
  - Binding tightness, orbital behavior, possibly cluster "personality"

### 🔭 Multi-Cluster Focus & Selection
_Dependency: None | Parallelizable: Yes_

**MVP:**
- [ ] **Focal cluster switching**: Ability to change which cluster is the "focal" cluster
  - Currently only main cluster is un-blurred; others are grayed/blurred
  - Clicking a different cluster's glyph should make it focal
- [ ] **Selected cluster clarity**: The currently selected/focal cluster should not be grayed or blurred
  - Full color and detail visibility
  - Other clusters remain foggy/distant
- [ ] **Smooth focus transition**: When switching focal clusters, animate the blur/clarity change

### ✨ Constellations & Inter-Cluster Pathways
_Dependency: Multi-Cluster Focus | Parallelizable: Partially_

**MVP: ✅ COMPLETE (Jan 2026)**
- [x] **Inter-cluster pathway lines**: Faint lines of light connecting cluster glyphs
  - Thin, subtle lines (not heavy connectors)
  - Visible when zoomed out — creates constellation-like appearance
  - Zoomed-out view should vaguely resemble star constellations
- [x] **Pathway rendering**: Lines should feel luminous/ethereal, not mechanical
  - Animated shimmer with staggered delays
  - Time-based color: cool starlight at night, warm gold by day
- [x] **Pathway data model**: Pathways stored in World for future force effects
- [x] **Hover interaction**: Pathways highlight when hovered
- [x] **Zoom-responsive visibility**: More visible when zoomed out

**Phase 2: ✅ COMPLETE (Jan 2026)**
- [x] **Constellation groupings**: Constellations as higher-order construct
  - 3 constellations with 3-4 clusters each (~10-12 total)
  - Inter-constellation distance ~3500-5000 units (order of magnitude larger than inter-cluster)
  - Explicit `Constellation` type in data model
- [x] **Pathway force effects**: Force field system pulling particles along pathways
  - Seeds/fireflies near pathways get pulled along
  - Composable `ForceField` type in `src/core/forces/`
  - Force strength falls off with distance from pathway
- [x] **Pathway directionality**: Pathways have direction property
  - "forward" / "backward" / "bidirectional" options
  - Direction affects force field flow
  - Randomly assigned during generation

**Future / Exploratory:**
- [ ] **Pathway direction visual indicator**: Animated flow, subtle arrow, or gradient
  - Show direction on hover or always faintly visible
- [ ] **Force field debug visualization**: Toggle to show force vectors on grid
  - Debug panel checkbox for `showForceField`
  - Render sample vectors across visible area
- [ ] **Constellation focus/selection**: Switch which constellation is focused
  - Click distant constellation glyph to refocus camera
  - Smooth transition between constellations

### 🌱 Panspermia & Seed Lifecycle
_Dependency: Pathways for inter-cluster travel | Parallelizable: Partially_

**BUGS: ✅ FIXED**
- [x] **BUG: Seeds not taking root**: Fixed landing probability (0.0002 → 0.02) and rooting delay (500 → 50 ticks)

**MVP:**
- [x] **Inter-cluster seed travel**: Seeds can travel between clusters via pathway forces
  - Pathway force field pulls seeds along pathway direction
  - Seeds drift between clusters following pathway "tunnels"
- [ ] **Seed rooting on arrival**: Seeds that travel to a new cluster can take root on islands there
  - Creates new plants in previously empty clusters
  - Life spreads from central cluster outward

**Future / Exploratory:**
- [ ] **Panspermia narrative**: Life begins in central cluster, spreads outward through pathways
  - Initial state: only central cluster has plants
  - Over time, seeds travel and colonize other clusters
  - Creates emergent "spread of life" across the constellation
- [ ] **Overcrowding prevention**: Mechanisms to prevent islands from being completely covered in plants
  - Minimum distance from existing plant roots for new seeds to take hold
  - Some randomness allowed — some areas can be overgrown, that's cool
  - Goal: sparse/volcanic aesthetic, not everything covered
- [ ] **Nutrient/fertility model**: Islands have varying fertility levels
  - Some islands more fertile → denser plant growth
  - Some islands sparse/bare → rocky, less hospitable
  - Fertility could be visualized subtly (soil color, texture)
  - Affects both seed rooting success and plant growth rate
- [ ] **Controlled randomness in growth**: Balance between uniform and chaotic
  - Not all islands same growth density
  - Some heavily planted, some sparse, some bare
  - Variation makes the world feel more natural

### ⚡ Unified Force & Physics Model
_Dependency: Orbital Dynamics, Constellations | Parallelizable: No (integrative work)_

**MVP: ✅ COMPLETE (Jan 2026)**
- [x] **Force model architecture**: Composable `ForceField` type system
  - `ForceField = (pos: Vec2, world: World) => Vec2`
  - `combineForces()` to sum multiple force fields
  - Forces sampled on-demand at particle positions
- [x] **Pathway pulling force**: Particles near pathway lines get pulled along
  - Direction-aware: follows pathway `direction` property
  - Quadratic falloff with distance from line
  - Seeds strongly affected, fireflies weakly affected

**Future / Exploratory:**
- [ ] **Static vs dynamic positioning**: Forces affect entities differently based on type
  - Plants: mostly static, positioned under glyph gravitation
  - Particles (seeds, fireflies): dynamic movement, affected by multiple forces
  - Islands: slow orbital movement around glyphs
- [ ] **Glyph gravitation**: Glyphs exert gravitational pull on nearby entities
  - Islands orbit at their natural inclinations
  - Particles may orbit briefly or get captured
- [ ] **Aesthetic over realism**: Physics should look/feel cool, not be scientifically accurate
  - Tune parameters for visual appeal
  - Rich parameter space to explore
  - Prioritize integrated, consistent feel over strict mechanics
- [ ] **Force visualization (debug)**: Debug toggle to show force field vectors
  - Grid of sample vectors when `debug.showForceField` is true
  - Helps tune parameters and understand dynamics

### ✂️ Cut/Graft Mechanic Redesign
_Dependency: None | Parallelizable: Yes_

**MVP: ✅ COMPLETE (Jan 2026)**
- [x] **Cut attaches to cursor**: Subtree follows cursor, rendered ghostly
- [x] **Release in void**: Clicking empty space releases subtree, pieces drift and fade
- [x] **Graft to existing stem**: Clicking another stem grafts with smart angle selection
- [x] **Bug fix: Graft positioning**: Added offset so grafted subtree doesn't overlap target
- [x] **Bug fix: Graft click detection**: Use `closest()` for `data-entity-id` (SVG child elements)
- [x] **Tutorial steps added**: Cut/graft/release steps with `isNew: true`
- [x] **Regression tests**: Tests for `cutSubtree` and `graftSubtree`

**Future / Exploratory:**
- [ ] **Re-root to rock**: Optionally, clicking on a rock plants the cut subtree there
  - Creates new plant rooted to that rock
  - May or may not make sense with the system — decide based on feel
- [ ] **Graft angle algorithm**: Smarter algorithm for picking graft attachment angle
  - Analyze existing branch angles at target stem
  - Choose angle that minimizes overlap
  - Consider overall plant balance/aesthetics
- [ ] **Graft visual feedback**: Preview where graft will attach before confirming
  - Ghost preview of final position
  - Helps player plan complex grafts

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

### 2026-01-06

- [x] Constellations Phase 2 + Force Field System:
  - Multi-constellation architecture: 3 constellations with 3-4 clusters each
  - Explicit `Constellation` type in data model with proper spacing
  - Inter-constellation distance ~3500-5000 units (order of magnitude > inter-cluster)
  - Pathway directionality: forward/backward/bidirectional property
  - Force field module (`src/core/forces/`) with composable ForceField type
  - Pathway force pulls particles along pathway direction with quadratic falloff
  - Seeds/fireflies affected by force field (seeds stronger, fireflies weaker)
  - Fixed seed landing bug: probability 0.0002 → 0.02, rooting delay 500 → 50 ticks
  - FPS counter in debug panel for performance monitoring
  - Removed freezeTime (consolidated with dayCycle.running)
  - Performance documentation section in SOURCE.md

- [x] Constellation Pathways MVP:
  - Inter-cluster pathway lines connecting cluster glyphs in constellation patterns
  - Pathway type added to data model (future: force effects on seeds)
  - Delaunay-like generation algorithm with random pruning for organic variety
  - Time-based color: cool starlight at night, warm gold by day (OKLCH interpolation)
  - Animated shimmer with staggered delays for ethereal feel
  - Zoom-responsive visibility: more visible when zoomed out
  - Hover detection and highlighting

### 2026-01-05

- [x] Pie menu radial expand animation:
  - Menu items start at center node and animate radially outward with spin
  - 120ms cubic-bezier animation with staggered delays (25ms between items)
  - Creates spatial connection between menu and clicked node
- [x] Pie menu night mode contrast:
  - Icons now use `--color-text` instead of `--color-rock-dark`
  - Automatically adapts to light/dark based on time of day
- [x] Visual polish batch - hover/render consistency:
  - Removed dash stroke from rock highlight edges (now subtle solid)
  - Added all missing CSS variables for entity hover states (rock, leaf, flower, bud, stem)
  - Rock shape algorithm rewritten: mostly-convex base + localized detail (crevices/protuberances)
  - Documented procedural shape generation principles in SOURCE.md (avoid uniform noise)
  - Flowers now orient based on branch angle (point away from stem with fan-spread petals)
  - Systematized hover effects: all entities use `--color-selection` outline ring + brightness(1.1) filter
- [x] Rock shape algorithm rewrite:
  - Replaced uniform spiky polygon with realistic boulder generation
  - Base shape: 5-7 major vertices forming mostly-convex boulder silhouette
  - Localized detail: 1-2 edges subdivided with crevices or protuberances
  - Long smooth edges preserved (like real weathered rock faces)
  - Deterministic via seeded random for consistent regeneration
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

## For Agents

1. Check "In Progress" before starting
2. Mark tasks `[x]` when done
3. Add notes to "Completed" section with date

_Update this file every session._
