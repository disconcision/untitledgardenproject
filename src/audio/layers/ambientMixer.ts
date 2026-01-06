/**
 * Audio System — Ambient Mixer Layer
 *
 * Reactive mixing based on world state:
 * - Day/night shift: Harmonic palette changes with timeOfDay
 * - Zoom mixing: Density/character changes with zoom level
 */

import * as Tone from "tone";
import { AudioEngine } from "../engine";
import { AudioState } from "../state";

// Day/night ambient components
let dayPad: Tone.Synth | null = null;
let nightPad: Tone.Synth | null = null;
let ambientGain: Tone.Gain | null = null;
let dayGain: Tone.Gain | null = null;
let nightGain: Tone.Gain | null = null;

// Current time of day for smooth transitions
let currentTimeOfDay = 0.5;

// Track if we've started the pads (after audio context starts)
let ambientStarted = false;

/**
 * Initialize ambient mixer layer.
 * Returns cleanup function.
 */
export function initAmbientMixer(engine: AudioEngine): () => void {
  // Master gain for ambient layer
  ambientGain = new Tone.Gain(0.12).connect(engine.output);

  // Separate gains for day and night crossfade
  dayGain = new Tone.Gain(0.5).connect(ambientGain);
  nightGain = new Tone.Gain(0.5).connect(ambientGain);

  // Day pad: Brighter, major intervals (C major add9)
  dayPad = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: {
      attack: 2,
      decay: 1,
      sustain: 0.8,
      release: 3,
    },
  }).connect(dayGain);

  // Night pad: Darker, minor/suspended intervals
  nightPad = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: {
      attack: 2,
      decay: 1,
      sustain: 0.8,
      release: 3,
    },
  }).connect(nightGain);

  // Don't start notes yet - wait for audio context to be running
  ambientStarted = false;

  return (): void => {
    dayPad?.triggerRelease();
    nightPad?.triggerRelease();

    // Wait for release before disposing
    setTimeout(() => {
      dayPad?.dispose();
      nightPad?.dispose();
      dayGain?.dispose();
      nightGain?.dispose();
      ambientGain?.dispose();

      dayPad = null;
      nightPad = null;
      dayGain = null;
      nightGain = null;
      ambientGain = null;
      ambientStarted = false;
    }, 3000);
  };
}

/**
 * Start the ambient pads (called once after audio context starts).
 */
function startAmbientPads(): void {
  if (ambientStarted) return;
  if (!dayPad || !nightPad) return;

  dayPad.triggerAttack("E3", Tone.now());
  nightPad.triggerAttack("B2", Tone.now());
  ambientStarted = true;
  console.log("[Audio] Ambient mixer started");
}

/**
 * Update ambient mixer based on current state.
 * Call this each frame or when time/zoom changes.
 *
 * @param state - Current audio state
 * @param timeOfDay - 0-1 where 0=midnight, 0.5=noon
 * @param zoomLevel - Camera zoom level
 */
export function updateAmbientMixer(state: AudioState, timeOfDay: number, zoomLevel: number): void {
  if (!ambientGain || !dayGain || !nightGain) return;

  // Start pads when audio context is running for the first time
  if (state.started && !ambientStarted) {
    startAmbientPads();
  }

  currentTimeOfDay = timeOfDay;

  // Check if layer should be active
  const shouldPlay = state.enabled && state.started && state.layers.dayNightShift;

  // Calculate day/night crossfade
  // 0 = midnight (night), 0.25 = sunrise, 0.5 = noon (day), 0.75 = sunset
  // Create smooth transition between day and night
  const dayFactor = calculateDayFactor(timeOfDay);

  if (shouldPlay) {
    // Crossfade between day and night pads
    dayGain.gain.rampTo(dayFactor * 0.7, 1);
    nightGain.gain.rampTo((1 - dayFactor) * 0.7, 1);

    // Adjust overall ambient volume based on zoom (if zoom mixing enabled)
    if (state.layers.zoomMixing) {
      // Zoomed in = slightly richer ambient
      const zoomBoost = Math.min(1, zoomLevel / 1.5);
      ambientGain.gain.rampTo(0.08 + zoomBoost * 0.08, 0.5);
    } else {
      ambientGain.gain.rampTo(0.12, 0.5);
    }
  } else {
    // Fade out
    dayGain.gain.rampTo(0, 1);
    nightGain.gain.rampTo(0, 1);
  }

  // Update pad frequencies based on time of day
  updatePadHarmonics(timeOfDay);
}

/**
 * Calculate how "day-like" the current time is (0-1).
 * Peaks at noon, valleys at midnight.
 */
function calculateDayFactor(timeOfDay: number): number {
  // Use cosine for smooth transition
  // At 0 (midnight): cos(0) = 1, we want 0 (night)
  // At 0.5 (noon): cos(π) = -1, we want 1 (day)
  // So: factor = (1 - cos(2πt)) / 2
  return (1 - Math.cos(timeOfDay * 2 * Math.PI)) / 2;
}

/**
 * Update pad harmonics based on time of day.
 * Day: Brighter, major feel
 * Night: Darker, suspended/minor feel
 */
function updatePadHarmonics(timeOfDay: number): void {
  if (!dayPad || !nightPad) return;

  // Subtle pitch variations throughout the day
  // Day tends toward major third (E), night toward minor/suspended (B, F#)
  const dayFactor = calculateDayFactor(timeOfDay);

  // Day pad shifts between E3 and G3
  const dayFreq = 164.81 + dayFactor * 32; // E3 to ~F#3
  dayPad.frequency.rampTo(dayFreq, 2);

  // Night pad shifts between B2 and D3
  const nightFreq = 123.47 + (1 - dayFactor) * 23; // B2 to ~C#3
  nightPad.frequency.rampTo(nightFreq, 2);
}

/**
 * Get the current day factor for external use.
 */
export function getDayFactor(): number {
  return calculateDayFactor(currentTimeOfDay);
}
