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
const PARTICLE_TICK_MS = 50; // Smooth particle movement at 20fps
const DRIFT_TICK_MS = 50; // Drifting pieces animation at 20fps
const FPS_SAMPLE_SIZE = 60; // Rolling average over 60 frames
const FPS_UPDATE_MS = 500; // Update FPS display every 500ms

export default function App(): JSX.Element {
  const [world, setWorld] = useState<World>(() => generateWorld(INITIAL_SEED));
  const containerRef = useRef<HTMLDivElement>(null);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());

  const dispatch = useCallback((msg: Msg): void => {
    setWorld((w: World): World => update(msg, w));
  }, []);

  const handleRegenerate = useCallback((seed: number): void => {
    setWorld(generateWorld(seed));
  }, []);

  const camera = useCamera({ dispatch, containerRef, carriedSubtree: world.carriedSubtree });

  // Unified simulation control:
  // - dayCycle.running is the master "simulation running" toggle (controlled via TimeConfig)
  const simulationRunning = world.dayCycle.running;

  // Simulation tick - slow rate for game logic (plant growth)
  useEffect(() => {
    if (!simulationRunning) return;

    const interval = setInterval(() => {
      dispatch({ type: "tick", dt: SIM_TICK_MS });
    }, SIM_TICK_MS);

    return () => clearInterval(interval);
  }, [dispatch, simulationRunning]);

  // Day cycle tick - faster for smooth color transitions
  useEffect(() => {
    if (!simulationRunning) return;

    const interval = setInterval(() => {
      dispatch({ type: "dayCycle/tick", dtMs: DAY_CYCLE_TICK_MS });
    }, DAY_CYCLE_TICK_MS);

    return () => clearInterval(interval);
  }, [dispatch, simulationRunning]);

  // Particle tick - smooth movement for seeds and fireflies
  useEffect(() => {
    if (!simulationRunning) return;

    const interval = setInterval(() => {
      dispatch({ type: "particle/tick", dtMs: PARTICLE_TICK_MS });
    }, PARTICLE_TICK_MS);

    return () => clearInterval(interval);
  }, [dispatch, simulationRunning]);

  // Drift tick - animate drifting pieces (released subtrees)
  useEffect(() => {
    if (world.driftingPieces.length === 0) return;

    const interval = setInterval(() => {
      dispatch({ type: "drift/tick", dtMs: DRIFT_TICK_MS });
    }, DRIFT_TICK_MS);

    return () => clearInterval(interval);
  }, [dispatch, world.driftingPieces.length]);

  // FPS measurement using requestAnimationFrame
  useEffect(() => {
    let animationId: number;
    let lastFpsUpdate = performance.now();

    const measureFrame = (): void => {
      const now = performance.now();
      const frameDuration = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      // Add to rolling buffer
      frameTimesRef.current.push(frameDuration);
      if (frameTimesRef.current.length > FPS_SAMPLE_SIZE) {
        frameTimesRef.current.shift();
      }

      // Update FPS display periodically
      if (now - lastFpsUpdate >= FPS_UPDATE_MS) {
        lastFpsUpdate = now;
        const avgFrameTime =
          frameTimesRef.current.reduce((a: number, b: number): number => a + b, 0) /
          frameTimesRef.current.length;
        const fps = avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 60;
        dispatch({ type: "fps/update", fps });
      }

      animationId = requestAnimationFrame(measureFrame);
    };

    animationId = requestAnimationFrame(measureFrame);
    return () => cancelAnimationFrame(animationId);
  }, [dispatch]);

  // Track cursor position in world coordinates
  const handleCursorMove = useCallback(
    (e: React.PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      // Convert screen coordinates to world coordinates
      const screenX = e.clientX - rect.left - rect.width / 2;
      const screenY = e.clientY - rect.top - rect.height / 2;

      // Apply inverse camera transform
      const worldX = (screenX - world.camera.pan.x) / world.camera.zoom;
      const worldY = (screenY - world.camera.pan.y) / world.camera.zoom;

      dispatch({ type: "cursor/move", worldPos: { x: worldX, y: worldY } });
    },
    [dispatch, world.camera.pan.x, world.camera.pan.y, world.camera.zoom]
  );

  // Apply color scheme based on time of day
  useEffect(() => {
    const scheme = interpolateScheme(world.dayCycle.timeOfDay);
    applySchemeToDOM(scheme);
  }, [world.dayCycle.timeOfDay]);

  // Determine cursor style based on carrying state
  const isCarrying = world.carriedSubtree !== null;
  const cursorStyle = isCarrying ? "crosshair" : "grab";

  // Combined pointer move handler
  const handlePointerMove = useCallback(
    (e: React.PointerEvent): void => {
      camera.handlePointerMove(e);
      handleCursorMove(e);
    },
    [camera, handleCursorMove]
  );

  return (
    <div
      ref={containerRef}
      className={`garden-container ${isCarrying ? "is-carrying" : ""}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        touchAction: "none",
        cursor: cursorStyle,
      }}
      onPointerDown={camera.handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={camera.handlePointerUp}
    >
      <CanvasBackground camera={world.camera} timeOfDay={world.dayCycle.timeOfDay} />
      <Garden world={world} dispatch={dispatch} />
      <HUD world={world} dispatch={dispatch} onRegenerate={handleRegenerate} />
      <WorldInspector world={world} dispatch={dispatch} />
      <PieMenu world={world} dispatch={dispatch} />
      <TimeConfig world={world} dispatch={dispatch} />
    </div>
  );
}
