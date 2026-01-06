---
name: Constellations + Forces
overview: Introduce multi-constellation architecture (3 constellations with 3-4 clusters each), add a force field system that pulls particles along pathways, fix the seed rooting bug, clean up the debug panel, and document performance considerations.
todos:
  - id: model-types
    content: Add Constellation type, Pathway.direction, remove debug.freezeTime
    status: completed
  - id: generation
    content: Generate 3 constellations with proper spacing, update pathway gen
    status: completed
    dependencies:
      - model-types
  - id: force-module
    content: Create src/core/forces/ with ForceField type and pathway force
    status: completed
    dependencies:
      - model-types
  - id: particle-forces
    content: Integrate force field into particle simulation
    status: completed
    dependencies:
      - force-module
  - id: seed-bug
    content: Fix seed landing probability (0.0002 -> 0.02)
    status: completed
  - id: debug-cleanup
    content: Remove freeze checkbox, add FPS counter to debug panel
    status: completed
    dependencies:
      - model-types
  - id: perf-docs
    content: Add Performance section to SOURCE.md
    status: completed
  - id: todo-updates
    content: Update TODO.md with completed items and new future tasks
    status: completed
---

# Constellations, Force Fields & Performance

## Summary

This session introduces hierarchical constellation groupings, a composable force field system for particle movement, pathway directionality, and performance monitoring infrastructure.---

## 1. Multi-Constellation Architecture

**Files**: [`src/core/model.ts`](src/core/model.ts), [`src/core/generate.ts`](src/core/generate.ts)Add explicit `Constellation` type to World:

```typescript
type Constellation = {
  id: Id;
  pos: Vec2;  // Center position in world space
  // Future: personality, theme, etc.
};

// Cluster gets constellationId
type Cluster = {
  // ... existing fields
  constellationId: Id;
};

// World gets constellations map
type World = {
  constellations: Map<Id, Constellation>;
  // ... rest
};
```

**Spacing changes**:

- Inter-cluster distance within constellation: ~400-600 units (currently ~600-800, tighten slightly)
- Inter-constellation distance: ~3000-5000 units (order of magnitude larger)
- Generate 3 constellations with 3-4 clusters each (~9-12 clusters total)

**Pathway generation update**:

- Intra-constellation pathways: denser (keep most connections)
- Inter-constellation pathways: sparse (1-2 "bridge" pathways between constellations)

---

## 2. Force Field System

**New module**: `src/core/forces/`

```javascript
src/core/forces/
├── index.ts        # ForceField type, combineForces
├── pathway.ts      # Pathway attraction force
└── debug.ts        # Grid sampling for visualization
```

**Core types**:

```typescript
// A force field is a function from position to force vector
type ForceField = (pos: Vec2, world: World) => Vec2;

// Combine multiple force fields
function combineForces(fields: ForceField[]): ForceField;
```

**Pathway force**: Particles near pathway lines get pulled along the pathway direction.

```typescript
function createPathwayForce(strength: number): ForceField;
// - Find nearest pathway line to position
// - Return vector pointing along pathway (toward toCluster)
// - Strength falls off with distance from line
```

**Integration with particles** ([`src/core/simulation/particles.ts`](src/core/simulation/particles.ts)):

- Sample force field at particle position each tick
- Add force contribution to velocity
- Seeds affected strongly, fireflies affected weakly

---

## 3. Pathway Directionality

**File**: [`src/core/model.ts`](src/core/model.ts)Add direction to Pathway type:

```typescript
type Pathway = {
  id: Id;
  fromClusterId: Id;
  toClusterId: Id;
  direction: "forward" | "backward" | "bidirectional";
  // forward = force flows from → to
  // backward = force flows to → from  
  // bidirectional = force pulls toward line center only
};
```

**Generation**: Random direction assignment (equal probability for now).**Rendering**: Future visual indicator (animated flow, subtle arrow) — not in this session.---

## 4. Seed Rooting Bug Fix

**File**: [`src/core/simulation/particles.ts`](src/core/simulation/particles.ts)Current bug: Landing probability is `0.0002` (1 in 5,000 per tick) — seeds almost never land.Fix:

- Increase landing probability to `0.02` (1 in 50)
- Seeds should land within a few seconds of being near a surface
- Verify rooting logic triggers after landing

---

## 5. Debug Panel Cleanup

**Files**: [`src/core/model.ts`](src/core/model.ts), [`src/ui/HUD.tsx`](src/ui/HUD.tsx), [`src/App.tsx`](src/App.tsx)**Remove `freezeTime`**:

- Delete `debug.freezeTime` from World type and initial state
- Remove checkbox from debug panel
- Simplify App.tsx: `simulationRunning = world.dayCycle.running` (already controlled by TimeConfig)

**Add FPS counter**:

- Track frame times in App.tsx (rolling average of last 60 frames)
- Display in debug panel: `FPS: 60`
- Helps monitor performance as we scale up

**Add force field debug toggle** (optional, if time permits):

- `debug.showForceField: boolean`
- When enabled, render sample vectors on a sparse grid
- Visualize pathway attraction direction/strength

---

## 6. Performance Documentation

**File**: [`SOURCE.md`](SOURCE.md)Add new section **"26. Performance Considerations"**:

- Current entity counts and projections
- What's simulated (all entities, regardless of visibility)
- What's rendered (all entities, with opacity/blur for distant)
- Particle caps (20 seeds, 20 fireflies)
- When to worry (1000+ entities, 5000+ SVG nodes)
- Optimization tiers:
- Tier 1: Frustum culling, LOD for distant clusters
- Tier 2: Spatial partitioning, sleep off-screen simulation
- Tier 3: Canvas/WebGL for particles, Web Workers
- Note that force field is computed on-demand (no grid overhead)

---

## 7. TODO.md Updates

- Mark Constellation MVP tasks complete
- Add new tasks for future constellation work:
- Constellation selection/focus switching
- Inter-constellation camera transitions
- Force field visualization polish
- Update Panspermia section (now unblocked)

---

## Implementation Order

1. **Model changes** — Constellation type, Pathway direction, remove freezeTime
2. **Generation** — 3 constellations, spacing, pathway generation
3. **Force field module** — Core types, pathway force
4. **Particle integration** — Apply forces to seeds/fireflies
5. **Bug fix** — Seed landing probability
6. **Debug panel** — FPS counter, cleanup
7. **Documentation** — SOURCE.md perf section, TODO.md updates
8. **Test in browser** — Verify everything works, check FPS

---

## Out of Scope (Future TODOs)

- Force field grid visualization (debug overlay)
- Pathway direction visual indicator (animated flow)
- Constellation focus/selection switching
- Inter-constellation camera transitions