/**
 * Audio System — State Types
 *
 * Defines the audio state and layer toggles for the audio system.
 */

// Layer toggle keys for individual audio components
export type AudioLayerKey = "actionSounds" | "voidDrone" | "dayNightShift" | "zoomMixing";

// Audio state stored in World
export type AudioState = {
  // Master audio enabled (requires user gesture to start)
  enabled: boolean;
  // Whether audio context has been started (user gesture received)
  started: boolean;
  // Master volume (0-1)
  masterVolume: number;
  // Per-layer toggles for evaluation
  layers: Record<AudioLayerKey, boolean>;
};

// Default audio state
export function createInitialAudioState(): AudioState {
  return {
    enabled: true,
    started: false,
    masterVolume: 0.7,
    layers: {
      actionSounds: true,
      voidDrone: true,
      dayNightShift: true,
      zoomMixing: true,
    },
  };
}
