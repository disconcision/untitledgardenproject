/**
 * Hanging Garden — Main App
 *
 * Composition of all layers: Canvas background, SVG world, DOM HUD.
 * Performance: Simulation tick is slow (1s), visual animations use CSS.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { World } from "./model";
import { Msg, update } from "./update";
import { generateWorld } from "./generate";
import { CanvasBackground } from "./render/Canvas";
import { Garden } from "./render/Garden";
import { HUD } from "./ui/HUD";
import { WorldInspector } from "./ui/WorldInspector";
import { PieMenu } from "./ui/PieMenu";
import { TimeConfig } from "./ui/TimeConfig";
import { useCamera } from "./hooks/useCamera";
import { interpolateScheme, applySchemeToDOM } from "./theme/dayNightScheme";

const INITIAL_SEED = 42;
const SIM_TICK_MS = 1000;
const DAY_CYCLE_TICK_MS = 100; // Update colors every 100ms for smooth transitions

export default function App() {
  const [world, setWorld] = useState<World>(() => generateWorld(INITIAL_SEED));
  const containerRef = useRef<HTMLDivElement>(null);

  const dispatch = useCallback((msg: Msg): void => {
    setWorld((w: World): World => update(msg, w));
  }, []);

  const handleRegenerate = useCallback((seed: number): void => {
    setWorld(generateWorld(seed));
  }, []);

  const camera = useCamera({ dispatch, containerRef });

  // Simulation tick - slow rate for game logic
  useEffect(() => {
    if (world.time.paused || world.debug.freezeTime) return;

    const interval = setInterval(() => {
      dispatch({ type: "tick", dt: SIM_TICK_MS });
    }, SIM_TICK_MS);

    return () => clearInterval(interval);
  }, [dispatch, world.time.paused, world.debug.freezeTime]);

  // Day cycle tick - faster for smooth color transitions
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: "dayCycle/tick", dtMs: DAY_CYCLE_TICK_MS });
    }, DAY_CYCLE_TICK_MS);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Apply color scheme based on time of day
  useEffect(() => {
    const scheme = interpolateScheme(world.dayCycle.timeOfDay);
    applySchemeToDOM(scheme);
  }, [world.dayCycle.timeOfDay]);

  return (
    <div
      ref={containerRef}
      className="garden-container"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        touchAction: "none",
        cursor: "grab",
      }}
      onPointerDown={camera.handlePointerDown}
      onPointerMove={camera.handlePointerMove}
      onPointerUp={camera.handlePointerUp}
    >
      <CanvasBackground
        camera={world.camera}
        timeOfDay={world.dayCycle.timeOfDay}
      />
      <Garden world={world} dispatch={dispatch} />
      <HUD world={world} dispatch={dispatch} onRegenerate={handleRegenerate} />
      <WorldInspector world={world} dispatch={dispatch} />
      <PieMenu world={world} dispatch={dispatch} />
      <TimeConfig world={world} dispatch={dispatch} />
    </div>
  );
}
