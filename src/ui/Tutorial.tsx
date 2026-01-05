/**
 * Hanging Garden — Tutorial / What's New Overlay
 *
 * Actionable steps, checkmarks, dismissible.
 */

import { World } from "../model";
import { Msg } from "../update";
import "./Tutorial.css";

type TutorialProps = {
  world: World;
  dispatch: (msg: Msg) => void;
};

export function Tutorial({ world, dispatch }: TutorialProps) {
  const { tutorial } = world;

  if (!tutorial.visible) {
    return (
      <button
        className="tutorial-reopen"
        onClick={() => dispatch({ type: "tutorial/toggle" })}
        title="Show tutorial"
      >
        ?
      </button>
    );
  }

  const completedCount = tutorial.steps.filter((s) => s.completed).length;
  const totalCount = tutorial.steps.length;

  return (
    <div className="tutorial-panel">
      <div className="tutorial-header">
        <h2>What's New</h2>
        <button
          className="tutorial-close"
          onClick={() => dispatch({ type: "tutorial/dismiss" })}
          title="Dismiss"
        >
          ×
        </button>
      </div>

      <div className="tutorial-progress">
        <div
          className="tutorial-progress-bar"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      <ul className="tutorial-steps">
        {tutorial.steps.map((step, index) => (
          <li
            key={step.id}
            className={`tutorial-step ${step.completed ? "completed" : ""}`}
          >
            <span className="tutorial-step-number">{index + 1}</span>
            <span className="tutorial-step-text">{step.instruction}</span>
            {step.completed && <span className="tutorial-step-check">✓</span>}
          </li>
        ))}
      </ul>

      <div className="tutorial-footer">
        <span className="tutorial-count">
          {completedCount}/{totalCount} completed
        </span>
      </div>
    </div>
  );
}
