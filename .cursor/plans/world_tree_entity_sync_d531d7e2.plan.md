---
name: World Tree Entity Sync
overview: Add type exhaustivity checks to keep WorldInspector in sync with Entity types, add missing entities (Constellations, Particles) to the tree, and update TODOs for smooth camera transitions.
todos:
  - id: exhaustivity
    content: Add assertNever helper and apply to all entity switch statements
    status: completed
  - id: constellations-tree
    content: Add Constellations as top-level in WorldInspector tree
    status: completed
  - id: particles-tree
    content: "Add Particles to tree (context-dependent: cluster vs landed)"
    status: completed
  - id: reveal-in-tree
    content: Auto-expand tree nodes to reveal selected entity when selecting in world
    status: completed
  - id: update-todos
    content: Verify/update TODO.md with smooth camera toggle and bidirectional selection
    status: completed
---

# World Tree Entity Sync & Type Safety

## Current State

**WorldInspector tree shows:** Clusters → Islands → (Rocks | Plants → PlantNodes)**Missing from tree:**

- Constellations (should be parent of Clusters)
- Particles (seeds/fireflies) - context-dependent: cluster-level when floating, rock/island-level when landed
- Vines (defer for now - edge-like, not node-like)

**Selection sync already works** - clicking tree items dispatches `camera/focus` (see [WorldInspector.tsx:363](src/ui/WorldInspector.tsx))**Camera movement is instant** - TODO already exists for smooth transitions---

## Implementation

### 1. Add Type Exhaustivity Checks

Create an `assertNever` helper and apply to all entity switch statements:

```typescript
// src/core/model.ts
export function assertNever(x: never, msg?: string): never {
  throw new Error(msg ?? `Unexpected value: ${x}`);
}
```

Apply to:

- [WorldInspector.tsx:244](src/ui/WorldInspector.tsx) - `useWorldTree` switch (missing: plantNode, vine, particle)
- [WorldInspector.tsx:59](src/ui/WorldInspector.tsx) - `getEntityWorldPos` switch
- [WorldInspector.tsx:101](src/ui/WorldInspector.tsx) - `getEntityZoom` switch
- [model.ts:463](src/core/model.ts) - `summarizeWorld` switch (missing: vine)

### 2. Add Constellations to Tree

Update `useWorldTree` to group clusters by constellation:

- Top level: Constellation nodes
- Each constellation contains its clusters
- Use a distinct icon (e.g., `Stars` from Lucide)

### 3. Add Particles to Tree (Context-Dependent)

Particles appear based on their state:

- **Floating**: Under cluster (need to determine which cluster based on position)
- **Landed/Rooting**: Under the rock or island they're on (`particle.landedOn`)

Add to `useWorldTree`:

- `particlesByCluster: Map<Id, Particle[]>` for floating particles
- `particlesByLandedEntity: Map<Id, Particle[]>` for landed particles

### 4. Auto-Reveal Selected Entity in Tree

When selecting an entity in the world view (canvas), the tree should auto-expand ancestor nodes to reveal it:

- Track `expandedNodes: Set<Id>` state in WorldInspector
- When `world.selection` changes, compute ancestor path for selected entity
- Auto-expand all ancestors (constellation → cluster → island → plant → node)
- Requires helper: `getEntityAncestorPath(id: Id, world: World): Id[]`

This gives full bidirectional sync:

- **Tree → World**: Click tree item → camera focuses (already works)
- **World → Tree**: Click entity in world → tree expands to reveal + highlights

### 5. Update TODOs

- Verify "Particles in hierarchy" TODO exists (it does)
- Ensure "Smooth camera focus transition" TODO includes mention of settings toggle
- Add note about "reveal in tree" behavior to selection sync TODO

---

## Files to Modify

- [src/core/model.ts](src/core/model.ts) - Add `assertNever` helper
- [src/ui/WorldInspector.tsx](src/ui/WorldInspector.tsx) - Add exhaustivity, constellations, particles
- [docs/TODO.md](docs/TODO.md) - Verify/update related TODOs

---

## Design Decisions

- **Particles switch clusters** when pulled by pathway forces - determine cluster by proximity to cluster center