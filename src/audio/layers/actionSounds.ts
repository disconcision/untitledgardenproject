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

// Track last trigger time to avoid Tone.js timing errors
let lastTriggerTime = 0;
const MIN_TIME_BETWEEN_SOUNDS = 0.05; // 50ms minimum between sounds

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
    // Check if action sounds should play
    if (currentAudioState && shouldPlayActionSounds(currentAudioState)) {
      playActionSound(event);
    }
  });

  return (): void => {
    unsubscribe();
    actionSynth?.dispose();
    noiseSynth?.dispose();
    actionSynth = null;
    noiseSynth = null;
    currentAudioState = null;
  };
}

/**
 * Play a sound for the given action event.
 */
function playActionSound(event: AudioEvent): void {
  if (!actionSynth || !noiseSynth) return;

  // Ensure we don't trigger sounds too rapidly (prevents Tone.js timing errors)
  const currentTime = Tone.now();
  const now = Math.max(currentTime, lastTriggerTime + MIN_TIME_BETWEEN_SOUNDS);
  lastTriggerTime = now;

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
}

/**
 * Check if action sounds should play based on state.
 */
export function shouldPlayActionSounds(state: AudioState): boolean {
  return state.enabled && state.started && state.layers.actionSounds;
}
