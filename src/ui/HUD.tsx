/**
 * Hanging Garden — HUD
 *
 * Minimal corner-based UI. Icons expand to panels.
 */

import { useState, memo } from "react";
import { World } from "../model";
import { Msg } from "../update";
import "./HUD.css";

type HUDProps = {
  world: World;
  dispatch: (msg: Msg) => void;
  onRegenerate: (seed: number) => void;
};

export const HUD = memo(function HUD({ world, dispatch, onRegenerate }: HUDProps) {
  const [debugOpen, setDebugOpen] = useState(false);
  const { tutorial, debug, seed, camera } = world;

  const completedCount = tutorial.steps.filter((s) => s.completed).length;
  const totalCount = tutorial.steps.length;

  return (
    <>
      {/* Top-left: Tutorial */}
      <div className="hud-corner hud-top-left">
        {tutorial.visible ? (
          <div className="hud-panel">
            <button
              className="hud-close"
              onClick={() => dispatch({ type: "tutorial/dismiss" })}
            >
              ×
            </button>
            <div className="hud-progress">
              <div
                className="hud-progress-bar"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
            <ul className="hud-steps">
              {tutorial.steps.map((step) => (
                <li key={step.id} className={step.completed ? "completed" : ""}>
                  <span className="step-check">{step.completed ? "✓" : "○"}</span>
                  <span className="step-text">{step.instruction}</span>
                </li>
              ))}
            </ul>
            <div className="hud-footer">{completedCount}/{totalCount}</div>
          </div>
        ) : (
          <button
            className="hud-icon"
            onClick={() => dispatch({ type: "tutorial/toggle" })}
            title="Show tutorial"
          >
            ?
          </button>
        )}
      </div>

      {/* Top-right: Debug */}
      <div className="hud-corner hud-top-right">
        {debugOpen ? (
          <div className="hud-panel">
            <button className="hud-close" onClick={() => setDebugOpen(false)}>
              ×
            </button>

            <label className="hud-toggle">
              <input
                type="checkbox"
                checked={debug.showIds}
                onChange={() => dispatch({ type: "debug/toggleIds" })}
              />
              IDs
            </label>

            <label className="hud-toggle">
              <input
                type="checkbox"
                checked={debug.showHitTargets}
                onChange={() => dispatch({ type: "debug/toggleHitTargets" })}
              />
              Hit targets
            </label>

            <label className="hud-toggle">
              <input
                type="checkbox"
                checked={debug.freezeTime}
                onChange={() => dispatch({ type: "debug/toggleFreeze" })}
              />
              Freeze
            </label>

            <div className="hud-row">
              <span>Seed</span>
              <input
                type="number"
                value={seed}
                onChange={(e) => onRegenerate(parseInt(e.target.value, 10))}
                className="hud-input"
              />
            </div>

            <button
              className="hud-button"
              onClick={() => onRegenerate(Math.floor(Math.random() * 100000))}
            >
              Random
            </button>

            <div className="hud-stats">
              <div>{camera.zoom.toFixed(2)}×</div>
              <div>{world.entities.size} entities</div>
            </div>
          </div>
        ) : (
          <button
            className="hud-icon"
            onClick={() => setDebugOpen(true)}
            title="Debug panel"
          >
            ⚙
          </button>
        )}
      </div>
    </>
  );
});

