/**
 * Audio System — Void Drone Layer
 *
 * Continuous ambient pad that creates an airy, ethereal atmosphere.
 * Uses filtered noise and sine waves for texture.
 * Volume modulated by zoom level (louder when zoomed out = more "void").
 */

import * as Tone from "tone";
import { AudioEngine } from "../engine";
import { AudioState } from "../state";

// Drone components
let droneOsc1: Tone.Oscillator | null = null;
let droneOsc2: Tone.Oscillator | null = null;
let droneNoise: Tone.Noise | null = null;
let droneFilter: Tone.Filter | null = null;
let droneGain: Tone.Gain | null = null;
let droneLFO: Tone.LFO | null = null;

// Current target volume for smooth transitions
let targetVolume = 0;

// Track if we've started the oscillators (after audio context starts)
let droneStarted = false;

/**
 * Initialize void drone layer.
 * Returns cleanup function.
 */
export function initVoidDrone(engine: AudioEngine): () => void {
  // Create drone gain (master volume for this layer)
  droneGain = new Tone.Gain(0).connect(engine.output);

  // Low-pass filter for noise
  droneFilter = new Tone.Filter({
    type: "lowpass",
    frequency: 400,
    rolloff: -24,
  }).connect(droneGain);

  // Very quiet filtered noise for texture
  droneNoise = new Tone.Noise("pink");
  droneNoise.volume.value = -30;
  droneNoise.connect(droneFilter);
  // Don't start yet - wait for audio context to be running

  // Two detuned sine oscillators for pad
  droneOsc1 = new Tone.Oscillator({
    type: "sine",
    frequency: 80,
    volume: -20,
  }).connect(droneGain);
  // Don't start yet

  droneOsc2 = new Tone.Oscillator({
    type: "sine",
    frequency: 120.5, // Slightly detuned
    volume: -24,
  }).connect(droneGain);
  // Don't start yet

  // Slow LFO for subtle filter modulation
  droneLFO = new Tone.LFO({
    type: "sine",
    frequency: 0.05, // Very slow
    min: 300,
    max: 500,
  });
  droneLFO.connect(droneFilter.frequency);
  // Don't start yet

  droneStarted = false;

  return (): void => {
    droneNoise?.stop();
    droneOsc1?.stop();
    droneOsc2?.stop();
    droneLFO?.stop();

    droneNoise?.dispose();
    droneOsc1?.dispose();
    droneOsc2?.dispose();
    droneFilter?.dispose();
    droneGain?.dispose();
    droneLFO?.dispose();

    droneNoise = null;
    droneOsc1 = null;
    droneOsc2 = null;
    droneFilter = null;
    droneGain = null;
    droneLFO = null;
    droneStarted = false;
  };
}

/**
 * Start the drone oscillators (called once after audio context starts).
 */
function startDrone(): void {
  if (droneStarted) return;
  if (!droneNoise || !droneOsc1 || !droneOsc2 || !droneLFO) return;

  droneNoise.start();
  droneOsc1.start();
  droneOsc2.start();
  droneLFO.start();
  droneStarted = true;
  console.log("[Audio] Void drone started");
}

/**
 * Update void drone based on current state.
 * Call this each frame or when zoom changes.
 *
 * @param state - Current audio state
 * @param zoomLevel - Camera zoom level (higher = more zoomed in)
 */
export function updateVoidDrone(state: AudioState, zoomLevel: number): void {
  if (!droneGain) return;

  // Start the drone when audio context is running for the first time
  if (state.started && !droneStarted) {
    startDrone();
  }

  // Calculate target volume based on zoom
  // Zoomed out (low zoom) = more void = louder drone
  // Zoomed in (high zoom) = less void = quieter drone
  const baseVolume = 0.15;
  const zoomFactor = Math.max(0, Math.min(1, 1 - (zoomLevel - 0.2) / 1.5));

  // Check if layer should be active
  const shouldPlay = state.enabled && state.started && state.layers.voidDrone;

  targetVolume = shouldPlay ? baseVolume * zoomFactor : 0;

  // Smooth volume transition
  droneGain.gain.rampTo(targetVolume, 0.5);
}

/**
 * Apply zoom-level mixing if enabled.
 * This modifies the drone characteristics based on zoom.
 */
export function applyZoomMixing(state: AudioState, zoomLevel: number): void {
  if (!droneFilter || !state.layers.zoomMixing) return;

  // Adjust filter based on zoom
  // Zoomed out = darker, more filtered
  // Zoomed in = brighter, more open
  const zoomNormalized = Math.max(0, Math.min(1, (zoomLevel - 0.1) / 2));
  // Ensure frequency is at least 20Hz (Tone.js minimum for filter)
  const filterFreq = Math.max(20, 300 + zoomNormalized * 400);

  // Use linearRampTo to avoid exponential ramp issues with low values
  droneFilter.frequency.linearRampTo(filterFreq, 0.3);
}
