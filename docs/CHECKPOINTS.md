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
