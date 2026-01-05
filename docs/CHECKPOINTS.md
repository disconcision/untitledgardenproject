# Hanging Garden — Checkpoints

This file logs development checkpoints. Each checkpoint includes:

- Identifier: `CP-###`
- Date
- Seed used (for reproducibility)
- Description of changes
- Tour path: 2-5 actions demonstrating new features

---

## CP-001: Initial Scaffold

**Date**: 2026-01-04  
**Seed**: 42  
**Commit**: 83f07e4

### What Changed

- Project scaffolded from scratch: Vite + React + TypeScript
- Git repository initialized
- Core architecture established:
  - `model.ts`: World state, entity types, camera, tutorial state
  - `update.ts`: MVU-style message dispatch with audio event hooks
  - `generate.ts`: Seeded procedural generation of islands, rocks, plants
- Rendering layers:
  - Canvas background with atmospheric gradient, grain, drifting particles
  - SVG world layer with islands, rocks, plant nodes
  - DOM HUD with Tutorial and Debug panels
- Theming infrastructure:
  - CSS custom properties for all colors
  - Temperate rainforest palette (grays, browns, rich greens)
- Camera: Pan (drag) and zoom (scroll wheel) with smooth interaction
- Tutorial: "What's New" overlay with 5 steps, progress tracking, dismissible
- Debug panel: Show IDs, hit targets, freeze time, seed input

### Tour Path

1. **Load the app** — See 4-7 floating islands with plants and rocks
2. **Drag the background** — Pan around the garden (completes tutorial step 1)
3. **Scroll to zoom** — Zoom in/out (completes tutorial step 2)
4. **Hover over an island** — See highlight effect
5. **Double-click an island** — Camera focuses on it (completes tutorial step 5)
6. **Open Debug panel** — Toggle "Show IDs" to see entity labels
7. **Click "Random Seed"** — Regenerate the garden with new layout

### Known Limitations

- Sprout/prune not yet implemented (TODO in update.ts)
- No vine rendering yet
- Bud charging simulation is passive (no visual charge-up animation)
- No ambient sway on plants (only islands have it currently)

---

## CP-004: Positioning Bug Fix + Branching + UI Animation

**Date**: 2026-01-04  
**Seed**: 42  
**Commit**: fed5408

### What Changed

**Critical Bug Fix**:

- CSS animation `transform` property was overriding SVG `transform` attributes
- All islands/rocks were rendering at position (0,0) instead of their correct positions
- Plants appeared to float disconnected from rocks (they were actually at rock positions, but rocks were invisible)
- Fix: Removed CSS transform animations that conflicted with SVG positioning

**Visual Improvements**:

- Islands larger (40-70px radius) and more visible with subtle stroke
- Rocks bigger (25-50px) with visible stroke
- Recursive plant branching: Y-forks, sub-branches, more buds
- Plant roots start at rock edge, growing outward into sky
- Tighter island spread (all 4 visible in initial viewport)

**UI Animation**:

- Panel expand from corner icon
- × button appears in same position as icon when open
- Fixed collapsed state properly hiding content with `display: none`

### Tour Path

1. **Load** — See 4 island+rock clusters spread across viewport
2. **Observe** — Each plant emerges from a rock on its island
3. **Click buds** — Watch Y-branching sprout new stems + leaves
4. **Toggle tutorial** — See panel expand from ? icon
5. **Toggle debug** — See panel expand from ⚙ icon

### Notes

- CSS transforms override SVG transform attributes — be careful!
- For ambient sway, would need nested elements or different approach

---

## CP-003: Performance + Visual Overhaul + Sprout/Prune

**Date**: 2026-01-04  
**Seed**: 42  
**Commit**: 194fc10

### What Changed

**Performance Fixes**:

- Simulation tick now fires every 1s (not 60fps)
- CSS animations for ambient sway (no React re-renders for visual motion)
- Components wrapped in `React.memo`

**Visual Overhaul**:

- Islands smaller (30-60px radius), more subtle soil patches
- Rocks larger and more angular (8-10 sides), as primary visual anchors
- Plants grow from rock edges into open sky (not buried in islands)
- Removed harsh gradients and outlines
- Soft diffuse shadows using blur, not drop-shadow

**Bug Fix — Sprout/Prune**:

- Clicking bud now actually sprouts: converts bud→stem, adds new bud + optional leaf
- Clicking leaf now prunes: removes node and all descendants
- Buds charge over time during simulation tick

**Hit Targets**:

- Invisible expanded hit circles (14-16px radius)
- Much easier to click buds and leaves

**UI — Corner Dock System**:

- New `HUD.tsx` replaces separate Tutorial/DebugPanel
- Icons at corners, expand to minimal panels
- Removed header labels ("What's New", "Debug")
- Cleaner, more minimal aesthetic

### Tour Path

1. **Load** — See rocks with plants growing outward into sky
2. **Click a glowing bud** — Watch it sprout a new branch
3. **Click a leaf** — Watch it get pruned
4. **Open debug panel** (gear icon) → Random seed — Regenerate
5. **Pan/zoom** — Notice smooth performance

### Notes

- Island count reduced to 3-5 (was 4-7)
- Rocks are now 2-4 per island, larger (15-35px)
- Plants grow outward from rocks, reaching toward sky
- Performance should now be smooth even with many entities

---

## CP-002: Core Module + Testing + CLI

**Date**: 2026-01-04  
**Seed**: 42  
**Commit**: cb34531

### What Changed

**SOURCE.md Updates**:

- Added "Garden as Editor" vision (Section 4)
- Added creator operating loop (under Process)
- Added Agentic Harness section (Node CLI tools for agent use)
- Added Testing Strategy section
- Updated Design Decisions Log with new decisions
- Updated repo structure to reflect core/ folder

**Code Reorganization**:

- Created `src/core/` folder for pure logic (no React/DOM)
  - `core/model.ts`: Types, vec2 helpers, world creation
  - `core/generate.ts`: Seeded procedural generation
  - `core/index.ts`: Unified exports
- Old `src/model.ts` and `src/generate.ts` now re-export from core

**Testing Infrastructure**:

- Added Vitest for testing
- `tests/core/model.test.ts`: 14 tests for vec2 helpers, world creation, ID generation
- `tests/core/generate.test.ts`: 7 tests for world generation, determinism
- All 21 tests pass in <200ms

**CLI Tools (for agent)**:

- `scripts/generate.ts`: Generate world, print summary
- Usage: `npm run generate -- --seed 42 [--json]`
- Enables quick hypothesis validation without browser

### Tour Path (Agent)

1. `npm test` — Run all 21 tests, see them pass
2. `npm run generate -- --seed 42` — See world summary (69 entities)
3. `npm run generate -- --seed 12345 --json` — Get JSON output (86 entities)
4. Open browser — Verify visual output matches CLI numbers

### Why This Matters

The agent can now:

- Run tests to validate logic changes
- Use CLI to quickly check generation without spinning up browser
- Have structured output (JSON) for comparison

---

## CP-005: Compound Rock Formations + Bark-like Stems

**Date**: 2026-01-04
**Seed**: 42
**Commit**: 509eb35

### What Changed

**Model**:

- `Rock` now has `boulders` array (compound structure) and `cracks` array
- `PlantNode` has `depth` property for bark-like thickness gradient
- `Boulder` type added with size, rotation, sides, irregularity

**Generation**:

- Rock formations: 2-4 boulders clustered together
- Plants grow from cracks between boulders or edges
- More branching, depth-tracked nodes

**Rendering**:

- Each boulder rendered as smooth-edged polygon (7-12 sides)
- Subtle highlight strokes for 3D glacial feel
- Stem strokeWidth based on depth (thicker=root, thinner=tips)
- Softer dirt color (earth.tan instead of earth.mid)

### Tour Path

1. Observe rock formations — Multiple boulders per rock
2. Observe plant stems — Thicker near roots, thinner at tips
3. Observe plants growing from cracks/edges of rocks

---

## CP-006: Autonomous Plant Growth Simulation

**Date**: 2026-01-04
**Seed**: 42
**Commit**: 8c68745

### What Changed

**Simulation**:

- Buds charge slowly over time (~0.02 per tick)
- Fully charged buds have ~5% chance to auto-sprout per tick
- Sprouting creates new bud + optional leaf + optional branch
- Branch chance decreases with depth (natural tapering)
- Segment length decreases with depth (bark effect)
- Leaves more likely at deeper levels

**Depth Tracking**:

- All new nodes track their depth from root
- Depth affects segment length, branch probability
- Connects to bark-like stem thickness in renderer

### Tour Path

1. Wait 10-20 seconds — Watch plants grow automatically
2. Observe buds charging (turning gold)
3. See new branches/leaves appear
4. Notice thinner stems on newer growth

---

## CP-007: Cluster Abstraction with Central Glyph

**Date**: 2026-01-04
**Seed**: 42
**Commit**: 227ae00

### What Changed

**Model**:

- Added `Cluster` type with pos, glyphKind, rotation
- `Island` now has `clusterId` + `localPos` (relative to cluster)
- `World.clusters` map added

**Generation**:

- `generateCluster` creates clusters (1 main for now)
- Islands positioned relative to cluster center
- Glyph kinds: seed, node, sigil

**Rendering**:

- `ClusterGlyphRenderer` renders central glyph
- Three glyph styles (seed=radiating, node=concentric, sigil=triangle)
- Island worldPos computed from cluster.pos + island.localPos
- All downstream positions updated to use worldPos

### Tour Path

1. Observe central glyph — Subtle concentric circles at center
2. Note islands orbiting around cluster center
3. All entity positioning still works correctly

### Architecture

This sets the foundation for:

- Multi-cluster world (distant clusters in fog)
- Each cluster as an independent grouping
- Cluster-relative positioning for all entities

---

## CP-008: World Inspector Panel

**Date**: 2026-01-04
**Seed**: 42

### What Changed

**New Component**: `WorldInspector.tsx`

- Collapsible tree view of the world hierarchy
- Shows: World → Clusters → Islands → Rocks/Plants → PlantNodes
- Bidirectional selection sync (click/hover in tree ↔ highlight in world)
- Bottom-left corner dock (follows HUD pattern)
- Live state display (e.g., bud charge shown as ⚡)
- **Camera focus on click**: Clicking any entity focuses camera on it
- **Smart zoom**: Different entity types get different zoom levels (rocks 1.3x, plant nodes 1.5x)

**CSS**: `WorldInspector.css`

- Tree indentation via CSS variables
- Hover/selection highlighting with green tints
- Monospace font for IDs
- Scrollable content area

**Garden.tsx changes**:

- Hover highlighting now works for ALL clusters (not just the main one)
- Previously distant clusters had hover disabled; now you can hover from inspector

**Documentation**: Added Section 6 "Projective UI" to SOURCE.md

- Describes the vision: same structure viewable through different lenses
- Future directions: inline rendering, situated inspection, UI-as-tree

### Tour Path

1. Click the 🌳 button in bottom-left corner
2. Expand cluster-1 → island-5 → plant-34
3. See stems, buds (with charge), leaves
4. Hover a node in tree → observe highlight in world
5. Click any entity → camera focuses on it
6. Click island-18 (cluster-2) → camera pans to distant cluster
7. Click rock-25 (cluster-3) → camera zooms in on rock

### Architecture

This is the first step toward **projective UI**:

- The inspector is one "lens" on the world structure
- The rendered garden is another lens
- Future: per-node lens switching, inline rendered subtrees

---

## CP-008: Multiple Clusters with Fog/Distance Rendering

**Date**: 2026-01-04
**Seed**: 42
**Commit**: 3957a29

### What Changed

**Generation**:

- World now generates 3-5 clusters (1 main + 2-4 distant)
- Main cluster: 4-6 islands, 1-2 rocks each, 70% plant chance
- Distant clusters: 2-3 islands, 1 rock each, 50% plant chance
- Clusters positioned at varying distances (600+ units for distant)

**Rendering with Fog**:

- Clusters sorted by distance (painters algorithm: far to near)
- Fog effect based on distance from origin:
  - < 200 units: fully visible
  - 200-1200 units: progressive fade (up to 85% opacity reduction)
  - Plus CSS blur filter proportional to fog
- Distant clusters: larger glyphs to remain visible through fog
- Distant clusters: non-interactive (no hover/click handlers)

**Tests**:

- Updated to expect 3-5 clusters with 6-30 total islands

### Tour Path

1. **Load app** — See main cluster at center with full detail
2. **Zoom out** (scroll) — Observe distant clusters fade into view
3. **Pan around** — Find distant clusters at edges, note fog effect
4. **Try clicking distant cluster** — No interaction (non-interactive)
5. **Interact with main cluster** — Works normally

### Architecture Notes

- `clusterData` computed in Garden: sorts clusters, calculates fog per cluster
- `getFogOpacity(distance)`: linear interpolation between fogStart/fogEnd
- Fog applied via CSS opacity and blur filter on cluster group
- Distant clusters still grow plants (simulation runs), just not interactive

---

## CP-009: Lucide Icons + Corner Panel Alignment + Workflow Docs

**Date**: 2026-01-05
**Seed**: 42

### What Changed

**Icon Library**:

- Added `lucide-react` as dependency for consistent, modern icons
- Replaced text/emoji icons with Lucide icons:
  - Tutorial: `?` → `Compass` icon
  - Debug: `⚙` (emoji) → `Settings` icon
  - World Inspector: `🌳` → `TreeDeciduous` icon
  - Close buttons: `×` → `X` icon
- Icon size standardized at 16px across all panels

**Corner Panel Alignment**:

- Fixed close button (×) positioning to match each corner's icon position
- Top-left: icon/close at top-left (already worked)
- Top-right: icon/close now properly at top-right (was incorrectly on left)
- Bottom-left: icon/close at bottom-left (using `flex-direction: column-reverse`)
- Bottom-right: CSS prepared for future panels

**Documentation**:

- Added **Agent Workflow Checklist** section at top of SOURCE.md
- Mandatory process: git branches for features, doc updates, conventional commits
- Enables parallel agent work with proper merge handling

### Tour Path

1. **Load app** — Observe Compass icon (top-left), Settings icon (top-right), Tree icon (bottom-left)
2. **Click Compass** — Tutorial opens, X appears in same spot
3. **Close tutorial** — Compass returns to exact same position
4. **Click Settings (top-right)** — Panel opens, X is in top-right corner (not left)
5. **Open World Inspector** — X appears at bottom-left, same as tree icon was

### Files Changed

- `src/ui/HUD.tsx`: Added Lucide imports, replaced icons
- `src/ui/HUD.css`: Added align-items rules for corner positioning, bottom-left/right rules
- `src/ui/WorldInspector.tsx`: Added Lucide imports, replaced icons
- `SOURCE.md`: Added workflow checklist, design decisions
- `docs/CHECKPOINTS.md`: This entry

---

## CP-010: Interactive World Inspector + Plant Tree Structure

**Date**: 2026-01-05
**Seed**: 42

### What Changed

**World Inspector Enhancements**:

1. **Cluster click-to-focus**: Clicking any cluster in the inspector now focuses the camera on it (was broken because `id` prop was missing)

2. **Hierarchical plant tree structure**: Plants now render as actual trees using the `adjacency` map:

   - `plant-34 → stem → stem → stem → leaf` instead of flat list
   - Uses recursive `PlantNodeTree` component
   - Shows branching structure where it exists

3. **Entity icons**: All entities now have Lucide icons:

   - Clusters: Hexagon, Star, Triangle, Sparkles, Mountain, Gem (rotating per cluster)
   - Islands: Mountain icon
   - Rocks: Gem icon
   - Plants: TreeDeciduous icon
   - Plant nodes: Circle (bud), Sprout (stem), Leaf, Sparkles (flower)

4. **Hover effects for all entities**:
   - Clusters: Ring pulse animation + scale on hover
   - Islands: Green stroke highlight
   - Rocks: Already had color change (now works for all clusters)
   - All entities now show hover even in distant clusters

**Garden.tsx changes**:

- `ClusterGlyphRenderer` now has `isHovered` and `dispatch` props
- Cluster glyphs show hover ring animation when hovered
- Hover highlighting works for ALL clusters (removed `!isDistant` checks)

### Tour Path

1. **Open World Inspector** (🌳 bottom-left)
2. **Click cluster-3** → Camera pans to that cluster
3. **Expand island-5 → plant-34** → See hierarchical stem structure
4. **Hover a cluster glyph** in inspector → Animated ring appears in world
5. **Click a rock in distant cluster** → Camera zooms to it

### Files Changed

- `src/ui/WorldInspector.tsx`: Added icons, hierarchical plant rendering, fixed cluster id
- `src/ui/WorldInspector.css`: Added icon styling
- `src/render/Garden.tsx`: Added cluster hover props
- `src/render/Garden.css`: Added cluster hover animations

---

## CP-011: Pie Menu for Plant Node Actions

**Date**: 2026-01-05
**Seed**: 42

### What Changed

**Pie Menu Context Interaction System**:

1. **Right-click on plant nodes** opens a radial pie menu with context-sensitive actions:

   - **Branch** (GitBranch icon): Available on stems; creates new bud branching off the stem
   - **Trim** (Scissors icon): Available on non-root nodes; removes node and its entire subtree

2. **Context-aware action availability**:

   - Root stems: Only "Branch" (can't trim the foundation)
   - Non-root stems: Both "Branch" and "Trim"
   - Buds/leaves: Only "Trim"

3. **Visual design**:

   - Radial layout with icons offset from the clicked node
   - Animated appearance (scale + fade in)
   - Hover state: green background + slight scale
   - Matches corner panel icon style (Lucide icons, 14px)

4. **Tutorial updated**: "Right-click a stem to branch or trim" replaces the old "Click leaf to prune" step

**New files**:

- `src/ui/PieMenu.tsx`: Radial context menu component
- `src/ui/PieMenu.css`: Styling and animations

**Architecture**:

- Added `contextMenu` state to World model (`nodeId`, `screenPos`, `worldPos`)
- New message types: `contextMenu/open`, `contextMenu/close`, `trim`, `branch`
- `branchFromNode()` function creates a new bud with randomized angle and position
- Reused existing `pruneNode()` for trim action

### Tour Path

1. **Load the app** — See floating islands with plants
2. **Right-click on a stem** (brown connection line) → Pie menu appears
3. **Click "Branch"** → New bud appears on that stem
4. **Right-click on a non-root stem** → Both Trim and Branch options appear
5. **Click "Trim"** → That part of the plant and everything below it is removed
6. **Open World Inspector** → See the plant structure update in real-time

### Files Changed

- `src/core/model.ts`: Added ContextMenu type and field to World
- `src/update.ts`: Added branch/trim/contextMenu message handlers
- `src/ui/PieMenu.tsx`: New component
- `src/ui/PieMenu.css`: New styles
- `src/render/Garden.tsx`: Added right-click handler to plant nodes
- `src/hooks/useCamera.ts`: Close context menu on background click
- `src/App.tsx`: Added PieMenu to component tree

---

## CP-012: Center View Action in Pie Menu

**Date**: 2026-01-05
**Seed**: 42

### What Changed

**Pie Menu Enhancement**:

1. **New "Center View" action**: Available on stem nodes; centers the camera on the selected node

   - Uses the Crosshair icon from Lucide
   - Positioned at the bottom of the pie menu (angle: π/2)
   - Dispatches `camera/focus` with the node's world position
   - Automatically closes the menu after action

2. **Action layout**:
   - Trim (Scissors): Upper left (-π \* 0.75)
   - Branch (GitBranch): Upper right (-π \* 0.25)
   - Center View (Crosshair): Bottom center (π \* 0.5)

### Tour Path

1. **Right-click on a stem** → See pie menu with up to 3 options
2. **Click the crosshair icon** (bottom) → Camera centers on that node
3. **Right-click a different stem** → Center on it to navigate

### Files Changed

- `src/ui/PieMenu.tsx`: Added Crosshair import and centerView action

---

## CP-013: Day/Night Cycle with Perceptual Color Interpolation

**Date**: 2026-01-05
**Seed**: 42

### What Changed

**Day/Night Cycle System**:

1. **Time of day simulation**: World now tracks `dayCycle` state with:
   - `timeOfDay`: 0-1 value (0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset)
   - `dayLengthMs`: Configurable cycle length (default 3 minutes)
   - `running`: Play/pause toggle for time advancement

2. **OKLCH Color Space**: New `src/theme/oklch.ts` module:
   - RGB ↔ OKLCH conversion functions
   - Perceptual color interpolation (smoother than RGB)
   - Hue interpolation via shortest path around the color wheel
   - Day/night blend calculations with smooth transitions
   - Golden hour factor for sunrise/sunset warmth

3. **Dynamic Color Schemes**: New `src/theme/dayNightScheme.ts`:
   - Full day and night color palettes
   - All colors interpolated in OKLCH space
   - Golden hour warmth applied to sky during sunrise/sunset
   - Colors applied to CSS custom properties for dynamic theming

4. **Canvas Background Updates**:
   - Reads CSS custom properties for sky gradient colors
   - Background transitions smoothly between day (light blue-gray) and night (deep blue-gray)
   - Particles slightly more visible at night

5. **TimeConfig UI Panel** (bottom-right corner):
   - Time display with phase icon (sun/moon/sunrise/sunset)
   - Play/pause button
   - Time scrubber with gradient visualization
   - Day length presets (1, 3, 5, 10 minutes)
   - Quick jump buttons (Midnight, Sunrise, Noon, Sunset)
   - Panel adapts to light/dark mode automatically

**Model Changes**:
- Added `DayCycle` type to core model
- Added `dayCycle/setTime`, `dayCycle/setDayLength`, `dayCycle/toggleRunning`, `dayCycle/tick` messages

### Tour Path

1. **Load the app** — Starts in morning (~8-9 AM), light mode
2. **Open Time Config** (clock icon, bottom-right) → See current time and controls
3. **Click "Midnight"** → Watch world transition to dark mode (night sky, muted colors)
4. **Click "Sunrise"** → See golden hour warmth in sky
5. **Click "Noon"** → Brightest day colors
6. **Drag the time scrubber** → Smoothly preview any time of day
7. **Click "1 min"** → Speed up the cycle, watch colors shift continuously
8. **Click pause** → Freeze time at any point

### Files Changed

- `src/core/model.ts`: Added DayCycle type and dayCycle field to World
- `src/update.ts`: Added dayCycle message handlers
- `src/theme/oklch.ts`: New OKLCH color utilities
- `src/theme/dayNightScheme.ts`: Day/night color schemes and interpolation
- `src/render/Canvas.tsx`: Dynamic sky gradient from CSS variables
- `src/ui/TimeConfig.tsx`: New time control panel
- `src/ui/TimeConfig.css`: Panel styling
- `src/App.tsx`: Integrated TimeConfig and day cycle tick

### Design Decisions

- **OKLCH over RGB**: Perceptual uniformity means color transitions look more natural. A midnight blue transitioning to dawn pink doesn't go through muddy intermediate colors.
- **CSS variables for all colors**: Allows the entire UI (panels, buttons, text) to automatically adapt to day/night mode without per-component logic.
- **Separate tick rate**: Day cycle updates every 100ms for smooth color transitions, independent of the slower 1s simulation tick.
- **Golden hour effect**: Sunrise/sunset aren't just linear blends—they add warm orange/pink tints that peak during transition periods.

---

_Add new checkpoints above this line._
