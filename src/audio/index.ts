/**
 * Audio System — Main Entry Point
 *
 * Exports all audio system components and provides initialization.
 */

export type { AudioState, AudioLayerKey } from "./state";
export { createInitialAudioState } from "./state";
export { AudioEngine, getAudioEngine, disposeAudioEngine } from "./engine";
export {
  initActionSounds,
  shouldPlayActionSounds,
  setActionSoundsState,
} from "./layers/actionSounds";
export { initVoidDrone, updateVoidDrone, applyZoomMixing } from "./layers/voidDrone";
export { initAmbientMixer, updateAmbientMixer, getDayFactor } from "./layers/ambientMixer";

import { AudioState } from "./state";
import { getAudioEngine } from "./engine";
import { initActionSounds, setActionSoundsState } from "./layers/actionSounds";
import { initVoidDrone, updateVoidDrone, applyZoomMixing } from "./layers/voidDrone";
import { initAmbientMixer, updateAmbientMixer } from "./layers/ambientMixer";

// Cleanup functions for each layer
let cleanupActionSounds: (() => void) | null = null;
let cleanupVoidDrone: (() => void) | null = null;
let cleanupAmbientMixer: (() => void) | null = null;

/**
 * Initialize the entire audio system.
 * Call this once on app mount.
 * Returns a cleanup function.
 */
export function initAudioSystem(): () => void {
  const engine = getAudioEngine();

  // Initialize layers
  cleanupActionSounds = initActionSounds(engine);
  cleanupVoidDrone = initVoidDrone(engine);
  cleanupAmbientMixer = initAmbientMixer(engine);

  console.log("[Audio] System initialized");

  return (): void => {
    cleanupActionSounds?.();
    cleanupVoidDrone?.();
    cleanupAmbientMixer?.();

    cleanupActionSounds = null;
    cleanupVoidDrone = null;
    cleanupAmbientMixer = null;

    console.log("[Audio] System disposed");
  };
}

/**
 * Start the audio system after user gesture.
 * Must be called from a user interaction event handler.
 */
export async function startAudio(): Promise<void> {
  const engine = getAudioEngine();
  await engine.start();
}

/**
 * Update all audio layers based on current world state.
 * Call this each frame or when relevant state changes.
 */
export function updateAudio(state: AudioState, timeOfDay: number, zoomLevel: number): void {
  // Update action sounds state reference
  setActionSoundsState(state);

  // Update drone with zoom level
  updateVoidDrone(state, zoomLevel);

  // Apply zoom mixing effects
  if (state.layers.zoomMixing) {
    applyZoomMixing(state, zoomLevel);
  }

  // Update ambient mixer with time and zoom
  updateAmbientMixer(state, timeOfDay, zoomLevel);
}

/**
 * Set master volume.
 */
export function setMasterVolume(volume: number): void {
  const engine = getAudioEngine();
  engine.setMasterVolume(volume);
}
