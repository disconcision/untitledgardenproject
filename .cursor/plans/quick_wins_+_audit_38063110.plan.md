---
name: Quick Wins + Audit
overview: "TODO audit to mark actually-unchecked-but-done items, then three polish fixes: pie menu animation, smooth camera transitions, and pathway direction indicator."
todos:
  - id: todo-audit
    content: Update TODO.md marking force field viz, seed rooting, overcrowding as done
    status: completed
  - id: pie-animation
    content: Fix pie menu contract animation flicker
    status: in_progress
    dependencies:
      - todo-audit
  - id: camera-smooth
    content: Add smooth camera focus transitions with lerping
    status: in_progress
    dependencies:
      - pie-animation
  - id: pathway-direction
    content: Add experimental pathway direction indicator on hover
    status: pending
    dependencies:
      - camera-smooth
---

# Quick Wins + TODO Audit

## 0. TODO Audit - Unchecked Items That ARE Done

These items are marked `[ ]` in TODO.md but **are actually implemented**:

| Line | Item | Evidence |
|------|------|----------|
| 253 | `Force field debug visualization` | `ForceFieldOverlay.tsx` exists, `debug.showForceField` toggle in HUD |
| 270 | `Seed rooting on arrival` | `createPlantFromSeed()` in `particles.ts` works on any island regardless of cluster |
| 279 | `Overcrowding prevention` | `SEED_ROOTING_CONFIG` with `plantProximityRadius`, `maxPlantsPerIsland` in `particles.ts` |
| 318 | `Force visualization (debug)` | Duplicate of line 253 |

**First commit**: Update TODO.md to mark these items `[x]` and consolidate the duplicate force viz entries.

---

## 1. Pie Menu Contract Animation Fix

**Problem**: Close animation flickers instead of smooth inward motion.

**Root cause**: The `:hover` style's `transform: scale(1.1)` overrides the animation keyframe transform.

**Fix** in [`src/ui/PieMenu.css`](src/ui/PieMenu.css):
- Disable hover effects during `.is-closing`
- Add `pointer-events: none` to prevent interaction during close

---

## 2. Smooth Camera Focus Transition

**Problem**: Camera jumps instantly when focusing on entities.

**Approach**: Add animation state and lerp toward target over ~300ms.

Changes:
- [`src/model.ts`](src/model.ts): Add `cameraAnimation` state
- [`src/update.ts`](src/update.ts): `camera/focus` sets animation target; add tick handler for lerping
- [`src/App.tsx`](src/App.tsx): Dispatch animation ticks in existing rAF loop

---

## 3. Pathway Direction Visual Indicator (Experimental)

**Problem**: Pathways have `direction` property but no visual cue.

**Approach**: Animated dash-offset on hover showing flow direction.

Changes in [`src/render/Pathway.tsx`](src/render/Pathway.tsx) and CSS.

---

## Commit Order

1. `docs: mark force field viz, seed rooting, overcrowding as complete`
2. `fix: pie menu contract animation flicker`
3. `feat: smooth camera focus transitions`
4. `feat: pathway direction indicator on hover`