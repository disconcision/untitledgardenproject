/**
 * Audio System — Engine
 *
 * Manages Web Audio context lifecycle via Tone.js.
 * Handles lazy initialization on user gesture and master volume control.
 */

import * as Tone from "tone";
import { AudioState, AudioLayerKey } from "./state";

// Singleton audio engine instance
let engineInstance: AudioEngine | null = null;

export class AudioEngine {
  private masterGain: Tone.Gain;
  private _isStarted: boolean = false;

  constructor() {
    // Create master gain node connected to destination
    this.masterGain = new Tone.Gain(0.7).toDestination();
  }

  /**
   * Start audio context on user gesture.
   * Must be called from a user interaction event handler.
   */
  async start(): Promise<void> {
    if (this._isStarted) return;

    await Tone.start();
    this._isStarted = true;
    console.log("[Audio] Context started");
  }

  /**
   * Check if audio context has been started.
   */
  get isStarted(): boolean {
    return this._isStarted;
  }

  /**
   * Get the master gain node for connecting audio sources.
   */
  get output(): Tone.Gain {
    return this.masterGain;
  }

  /**
   * Set master volume (0-1).
   */
  setMasterVolume(volume: number): void {
    this.masterGain.gain.rampTo(Math.max(0, Math.min(1, volume)), 0.1);
  }

  /**
   * Check if a layer is enabled based on audio state.
   */
  isLayerEnabled(state: AudioState, layer: AudioLayerKey): boolean {
    return state.enabled && state.started && state.layers[layer];
  }

  /**
   * Dispose of all audio resources.
   */
  dispose(): void {
    this.masterGain.dispose();
    this._isStarted = false;
  }
}

/**
 * Get or create the singleton audio engine instance.
 */
export function getAudioEngine(): AudioEngine {
  if (!engineInstance) {
    engineInstance = new AudioEngine();
  }
  return engineInstance;
}

/**
 * Dispose of the audio engine (for cleanup).
 */
export function disposeAudioEngine(): void {
  if (engineInstance) {
    engineInstance.dispose();
    engineInstance = null;
  }
}
