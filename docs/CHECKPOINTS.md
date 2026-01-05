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

*Add new checkpoints above this line.*

