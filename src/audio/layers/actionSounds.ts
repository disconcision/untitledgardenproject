/**
 * Audio System — Action Sounds Layer
 *
 * Synthesizes discrete sounds for user actions:
 * - Cut: Sharp descending tone (scissor snip)
 * - Graft: Rising connective tone (joining)
 * - Branch: Soft pop/unfurl
 * - Sprout: Gentle ascending chime
 * - Release: Scatter/disperse sound
 */

import * as Tone from "tone";
import { AudioEngine } from "../engine";
import { AudioState } from "../state";
import { AudioEvent, onAudioEvent } from "../../update";

// Synth pool for action sounds (reused to avoid allocation)
let actionSynth: Tone.Synth | null = null;
let noiseSynth: Tone.NoiseSynth | null = null;

// Current audio state reference (updated via setActionSoundsState)
let currentAudioState: AudioState | null = null;

// Debounce to avoid triggering same sound type too rapidly
let lastTriggerByType: Map<string, number> = new Map();
const MIN_TIME_BETWEEN_SAME_SOUND = 50; // 50ms minimum between same sound type (in ms)

// Track last synth trigger time to ensure monotonically increasing times
let lastSynthTime = 0;
const MIN_TIME_OFFSET = 0.02; // 20ms minimum between synth triggers

/**
 * Update the audio state reference for action sounds.
 * Call this whenever audio state changes.
 */
export function setActionSoundsState(state: AudioState): void {
  currentAudioState = state;
}

/**
 * Initialize action sounds layer.
 * Returns cleanup function.
 */
export function initActionSounds(engine: AudioEngine): () => void {
  // Create synths connected to master output
  actionSynth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: {
      attack: 0.01,
      decay: 0.15,
      sustain: 0.1,
      release: 0.3,
    },
  }).connect(engine.output);

  noiseSynth = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: {
      attack: 0.005,
      decay: 0.1,
      sustain: 0,
      release: 0.1,
    },
  }).connect(engine.output);

  // Subscribe to audio events
  const unsubscribe = onAudioEvent((event: AudioEvent): void => {
    // Wrap in try-catch at the top level to prevent any audio errors from crashing React
    try {
      // Check if action sounds should play
      if (currentAudioState && shouldPlayActionSounds(currentAudioState)) {
        playActionSound(event);
      }
    } catch (e) {
      // Silently ignore audio errors - they shouldn't crash the app
      console.debug("[Audio] Event handler error:", (e as Error).message);
    }
  });

  return (): void => {
    unsubscribe();
    actionSynth?.dispose();
    noiseSynth?.dispose();
    actionSynth = null;
    noiseSynth = null;
    currentAudioState = null;
    lastSynthTime = 0;
    lastTriggerByType.clear();
  };
}

/**
 * Play a sound for the given action event.
 */
function playActionSound(event: AudioEvent): void {
  if (!actionSynth || !noiseSynth) return;

  // Don't try to play if the audio context isn't running
  if (Tone.context.state !== "running") {
    return;
  }

  // Debounce: don't play same sound type too rapidly
  const nowMs = performance.now();
  const lastTrigger = lastTriggerByType.get(event.type) ?? 0;
  if (nowMs - lastTrigger < MIN_TIME_BETWEEN_SAME_SOUND) {
    return; // Skip this sound, too soon after the same type
  }
  lastTriggerByType.set(event.type, nowMs);

  // Use monotonically increasing time for scheduling to avoid Tone.js timing errors
  const currentTime = Tone.now();
  const now = Math.max(currentTime + 0.05, lastSynthTime + MIN_TIME_OFFSET);
  lastSynthTime = now;

  try {
    switch (event.type) {
      case "cut":
        // Sharp descending tone — scissor snip
        actionSynth.triggerAttackRelease("C5", "16n", now);
        actionSynth.frequency.rampTo("G3", 0.08, now);
        break;

      case "graft":
        // Rising connective tone — joining feel
        actionSynth.triggerAttackRelease("E4", "8n", now);
        actionSynth.frequency.rampTo("A4", 0.12, now);
        break;

      case "branch":
        // Soft pop/unfurl
        actionSynth.triggerAttackRelease("G4", "16n", now);
        break;

      case "sprout":
        // Gentle ascending chime
        actionSynth.triggerAttackRelease("C5", "8n", now);
        actionSynth.frequency.rampTo("E5", 0.1, now);
        break;

      case "release":
        // Scatter/disperse — noise burst
        noiseSynth.triggerAttackRelease("16n", now);
        break;

      case "select":
        // Subtle click
        actionSynth.triggerAttackRelease("A4", "32n", now);
        break;

      case "menuOpen":
        // Soft rising tone
        actionSynth.triggerAttackRelease("D4", "32n", now);
        actionSynth.frequency.rampTo("F4", 0.05, now);
        break;

      case "menuClose":
        // Soft falling tone
        actionSynth.triggerAttackRelease("F4", "32n", now);
        actionSynth.frequency.rampTo("D4", 0.05, now);
        break;

      // These events don't need sounds (too frequent)
      case "hover":
      case "pan":
      case "zoom":
        break;
    }
  } catch (e) {
    // Ignore Tone.js timing errors (usually "Start time must be strictly greater than previous start time")
    // This happens during rapid triggers or when the audio context is in a weird state
    console.debug("[Audio] Sound trigger skipped:", (e as Error).message);
  }
}

/**
 * Check if action sounds should play based on state.
 */
export function shouldPlayActionSounds(state: AudioState): boolean {
  return state.enabled && state.started && state.layers.actionSounds;
}
