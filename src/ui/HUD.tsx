/**
 * Hanging Garden — HUD
 *
 * Corner-based UI. Icons expand to panels with animation.
 * Close button appears in same position as the icon.
 */

import { useState, memo } from "react";
import { Compass, Settings, X } from "lucide-react";
import { World } from "../model";
import { Msg } from "../update";
import "./HUD.css";

const ICON_SIZE = 16;

type HUDProps = {
  world: World;
  dispatch: (msg: Msg) => void;
  onRegenerate: (seed: number) => void;
};

export const HUD = memo(function HUD({
  world,
  dispatch,
  onRegenerate,
}: HUDProps) {
  const [debugOpen, setDebugOpen] = useState(false);
  const { tutorial, debug, seed, camera } = world;

  const completedCount = tutorial.steps.filter((s) => s.completed).length;
  const totalCount = tutorial.steps.length;

  return (
    <>
      {/* Top-left: Tutorial */}
      <div className="hud-corner hud-top-left">
        <div className={`hud-panel-wrapper ${tutorial.visible ? "open" : ""}`}>
          {/* Icon/Close button - always in corner position */}
          <button
            className="hud-corner-btn"
            onClick={() => dispatch({ type: "tutorial/toggle" })}
            title={tutorial.visible ? "Close" : "Show tutorial"}
          >
            {tutorial.visible ? (
              <X size={ICON_SIZE} />
            ) : (
              <Compass size={ICON_SIZE} />
            )}
          </button>

          {/* Panel content */}
          <div className="hud-panel-content">
            <div className="hud-progress">
              <div
                className="hud-progress-bar"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
            <ul className="hud-steps">
              {tutorial.steps.map((step) => (
                <li key={step.id} className={step.completed ? "completed" : ""}>
                  <span className="step-check">
                    {step.completed ? "✓" : "○"}
                  </span>
                  <span className="step-text">{step.instruction}</span>
                </li>
              ))}
            </ul>
            <div className="hud-footer">
              {completedCount}/{totalCount}
            </div>
          </div>
        </div>
      </div>

      {/* Top-right: Debug */}
      <div className="hud-corner hud-top-right">
        <div className={`hud-panel-wrapper ${debugOpen ? "open" : ""}`}>
          {/* Icon/Close button - always in corner position */}
          <button
            className="hud-corner-btn"
            onClick={() => setDebugOpen(!debugOpen)}
            title={debugOpen ? "Close" : "Debug panel"}
          >
            {debugOpen ? <X size={ICON_SIZE} /> : <Settings size={ICON_SIZE} />}
          </button>

          {/* Panel content */}
          <div className="hud-panel-content">
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
        </div>
      </div>
    </>
  );
});
