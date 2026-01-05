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

_Add new checkpoints above this line._
