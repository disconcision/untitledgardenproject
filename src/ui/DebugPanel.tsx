/**
 * Hanging Garden — Debug Panel
 *
 * Toggle debug visualizations, regenerate, freeze time.
 */

import { World } from "../model";
import { Msg } from "../update";
import "./DebugPanel.css";

type DebugPanelProps = {
  world: World;
  dispatch: (msg: Msg) => void;
  onRegenerate: (seed: number) => void;
};

export function DebugPanel({ world, dispatch, onRegenerate }: DebugPanelProps) {
  const { debug, seed, camera, time } = world;

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <span>Debug</span>
      </div>

      <div className="debug-section">
        <label className="debug-toggle">
          <input
            type="checkbox"
            checked={debug.showIds}
            onChange={() => dispatch({ type: "debug/toggleIds" })}
          />
          <span>Show IDs</span>
        </label>

        <label className="debug-toggle">
          <input
            type="checkbox"
            checked={debug.showHitTargets}
            onChange={() => dispatch({ type: "debug/toggleHitTargets" })}
          />
          <span>Show Hit Targets</span>
        </label>

        <label className="debug-toggle">
          <input
            type="checkbox"
            checked={debug.freezeTime}
            onChange={() => dispatch({ type: "debug/toggleFreeze" })}
          />
          <span>Freeze Time</span>
        </label>
      </div>

      <div className="debug-section">
        <div className="debug-row">
          <span className="debug-label">Seed:</span>
          <input
            type="number"
            className="debug-input"
            value={seed}
            onChange={(e) => onRegenerate(parseInt(e.target.value) || 0)}
          />
        </div>

        <button
          className="debug-button"
          onClick={() => onRegenerate(Math.floor(Math.random() * 100000))}
        >
          Random Seed
        </button>
      </div>

      <div className="debug-section debug-stats">
        <div className="debug-stat">
          <span>Zoom:</span>
          <span>{camera.zoom.toFixed(2)}x</span>
        </div>
        <div className="debug-stat">
          <span>Pan:</span>
          <span>
            {camera.pan.x.toFixed(0)}, {camera.pan.y.toFixed(0)}
          </span>
        </div>
        <div className="debug-stat">
          <span>Time:</span>
          <span>{(time.t / 1000).toFixed(1)}s</span>
        </div>
        <div className="debug-stat">
          <span>Entities:</span>
          <span>{world.entities.size}</span>
        </div>
      </div>
    </div>
  );
}
