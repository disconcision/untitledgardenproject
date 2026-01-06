---
name: Constellation Pathways MVP
overview: Add inter-cluster pathways that form constellation patterns between cluster glyphs. Luminous lines with time-based color (cool starlight at night, warm gold by day), always faintly visible but more prominent when zoomed out or hovered.
todos:
  - id: model
    content: Add Pathway type and pathways Map to World in model.ts
    status: completed
  - id: generate
    content: Add generatePathways() with Delaunay-like algorithm + pruning
    status: completed
    dependencies:
      - model
  - id: colors
    content: Add pathway color interpolation to dayNightScheme.ts
    status: completed
  - id: component
    content: Create Pathway.tsx renderer with glow and visibility logic
    status: completed
    dependencies:
      - colors
  - id: integrate
    content: Integrate PathwayLayer into Garden.tsx, add SVG filter
    status: completed
    dependencies:
      - component
      - generate
  - id: animation
    content: Add shimmer CSS animation in Garden.css
    status: completed
    dependencies:
      - integrate
  - id: hover
    content: Add pathway hover detection and highlight
    status: completed
    dependencies:
      - integrate
  - id: tutorial
    content: Update tutorial if needed, update TODO.md
    status: completed
    dependencies:
      - hover
---

# Constellation Pathways MVP

## Overview

Implement ethereal pathway lines connecting cluster glyphs to create constellation-like patterns. Pathways are:

- Generated using a Delaunay-inspired approach with random pruning for organic variety
- Stored in the data model (for future seed force effects)
- Rendered as luminous lines with time-based color (cool at night, warm by day)
- Always faintly visible, brighter when zoomed out or hovered

## Data Model Changes

Add to [`src/core/model.ts`](src/core/model.ts):

```typescript
type Pathway = {
  id: Id;
  fromClusterId: Id;
  toClusterId: Id;
  // Future: strength, directionality, etc.
};

// World gains: pathways: Map<Id, Pathway>
```



## Generation

Add pathway generation to [`src/core/generate.ts`](src/core/generate.ts):**Algorithm**: Delaunay-like connectivity with random pruning

1. For each cluster, find 2-3 nearest neighbors
2. Create potential edges (avoiding duplicates)
3. Randomly prune ~20-40% of edges based on seed
4. Ensure main cluster has at least one connection

This creates varied patterns - some worlds get chain-like constellations, others get denser meshes.

## Rendering

Add new component `src/render/Pathway.tsx`:

- Render SVG `<line>` or `<path>` elements between glyph positions
- Apply glow filter (new `#pathway-glow` in Garden.tsx filters)
- Animated shimmer via CSS (subtle opacity pulse or traveling gradient)

**Visibility logic**:

- Base opacity: ~0.15 (always faintly visible)
- Zoom boost: opacity increases as `camera.zoom` decreases (max ~0.5 at far zoom)
- Hover boost: pathway highlighted when cursor near it

**Color logic** (using `dayCycle.timeOfDay`):

- Night (0.0-0.25, 0.75-1.0): Cool starlight (`#c8e0f0` to `#a0c4e0`)
- Day (0.25-0.75): Warmer gold (`#f0e8d0` to `#e8d4a8`)
- Smooth OKLCH interpolation at transitions (reuse existing color system)

## Integration in Garden.tsx

Render pathways in [`src/render/Garden.tsx`](src/render/Garden.tsx):

- Render before clusters (behind everything)
- Pass hover state and zoom level for visibility calculation
- Add pathway hover detection (optional: simple distance-to-line check)

## Files to Create/Modify

| File | Change |

|------|--------|

| `src/core/model.ts` | Add `Pathway` type, add `pathways` to `World` |

| `src/core/generate.ts` | Add `generatePathways()` function |

| `src/render/Pathway.tsx` | New component for rendering pathways |

| `src/render/Garden.tsx` | Import and render `PathwayLayer` |

| `src/render/Garden.css` | Add shimmer animation keyframes |

| `src/theme/dayNightScheme.ts` | Add pathway color interpolation |

## Visual Target