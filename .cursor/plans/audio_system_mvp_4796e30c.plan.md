---
name: Audio System MVP
overview: Implement the audio system with action sounds (cut/graft/branch/sprout), ambient void drone, day/night harmonic shift, and zoom-level mixing. Include an audio debug panel with toggles to enable/disable each layer independently for evaluation.
todos:
  - id: install-tone
    content: Install Tone.js dependency
    status: completed
  - id: audio-scaffold
    content: Create src/audio/ structure with engine, state, and layer files
    status: completed
  - id: action-sounds
    content: Implement synthesized action sounds (cut/graft/branch/sprout/release)
    status: completed
  - id: void-drone
    content: Implement continuous void drone ambient layer
    status: completed
  - id: ambient-mixer
    content: Implement day/night shift and zoom-level reactive mixing
    status: completed
  - id: audio-state
    content: Add audio state and layer toggles to World model + update.ts
    status: completed
  - id: audio-debug-panel
    content: Add audio debug section to HUD with per-layer toggles
    status: completed
  - id: app-integration
    content: Wire audio system into App.tsx with gesture activation
    status: completed
  - id: browser-test
    content: Test all audio layers in browser, verify toggles work
    status: completed
---

# Audio System MVP + Reactive Mixing

Build a layered audio system with individual toggles for evaluating each component independently.

## Architecture

```javascript
src/audio/
├── index.ts              # Re-exports, init function
├── engine.ts             # AudioEngine: Web Audio context lifecycle, master volume
├── layers/
│   ├── actionSounds.ts   # Discrete synth sounds for cut/graft/branch/sprout
│   ├── voidDrone.ts      # Continuous ambient pad (Tone.js oscillators + filter)
│   └── ambientMixer.ts   # Reactive mixing: day/night shift + zoom density
└── state.ts              # AudioState type + layer toggles
```



## Key Implementation Details

### 1. Audio Engine (`engine.ts`)

- Wraps Tone.js context with lazy initialization on first user gesture
- Master gain node for global volume
- `AudioState` tracks: `enabled`, `layerToggles`, `timeOfDay`, `zoomLevel`

### 2. Action Sounds (`layers/actionSounds.ts`)

- Subscribe to `onAudioEvent` from [`update.ts`](src/update.ts) (lines 113-119)
- Synthesize sounds using Tone.js:
- **Cut**: Sharp descending tone (scissor snip feel)
- **Graft**: Rising connective tone (joining feel)
- **Branch**: Soft pop/unfurl
- **Sprout**: Gentle ascending chime
- **Release**: Scatter/disperse sound

### 3. Void Drone (`layers/voidDrone.ts`)

- Continuous low ambient pad using Tone.js oscillators
- Filtered noise + sine waves for airy texture
- Volume modulated by zoom level (louder when zoomed out = more "void")

### 4. Ambient Mixer (`layers/ambientMixer.ts`)

- **Day/night shift**: Harmonic palette changes with `timeOfDay`
- Day: Brighter, more major intervals
- Night: Darker, more minor/suspended intervals
- **Zoom mixing**: Density increases when zoomed in
- Zoomed out: Sparse, void-like
- Zoomed in: Richer, more detail

### 5. Audio Debug Panel (in [`HUD.tsx`](src/ui/HUD.tsx))

- New section in debug panel with checkboxes:
- Master audio on/off
- Action sounds (cut/graft/branch)
- Void drone
- Day/night shift
- Zoom-level mixing
- Also add a speaker icon toggle to corner HUD for quick mute

### 6. Integration in [`App.tsx`](src/App.tsx)

- Initialize audio engine on mount
- Pass `world.dayCycle.timeOfDay` and `world.camera.zoom` to mixer each frame
- Audio starts on first user interaction (click/pan)

## Dependencies

- **Tone.js**: `npm install tone` — synthesis, oscillators, filters, scheduling
- (Howler.js deferred to later for sample playback)

## Files to Create/Modify

| File | Action ||------|--------|| `src/audio/index.ts` | Create — exports + init || `src/audio/engine.ts` | Create — AudioEngine class || `src/audio/state.ts` | Create — AudioState type || `src/audio/layers/actionSounds.ts` | Create — discrete synth sounds || `src/audio/layers/voidDrone.ts` | Create — ambient pad || `src/audio/layers/ambientMixer.ts` | Create — reactive mixing || `src/ui/HUD.tsx` | Modify — add audio toggles to debug panel || `src/ui/HUD.css` | Modify — styles for audio section || `src/App.tsx` | Modify — init audio, pass state || `src/model.ts` | Modify — add `audioEnabled` + layer toggles to World |