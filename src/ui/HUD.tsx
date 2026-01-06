/**
 * Hanging Garden — HUD
 *
 * Corner-based UI. Icons expand to panels with animation.
 * Close button appears in same position as the icon.
 */

import { useState, memo, useCallback } from "react";
import { Compass, Settings, X, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { World, TutorialSection } from "../model";
import { Msg } from "../update";
import "./HUD.css";

const ICON_SIZE = 16;

type HUDProps = {
  world: World;
  dispatch: (msg: Msg) => void;
  onRegenerate: (seed: number) => void;
};

// Helper to count all steps across sections
function countSteps(sections: TutorialSection[]): {
  completed: number;
  total: number;
} {
  let completed = 0;
  let total = 0;
  for (const section of sections) {
    for (const step of section.steps) {
      total++;
      if (step.completed) completed++;
    }
  }
  return { completed, total };
}

// Collapsible section component
type TutorialSectionViewProps = {
  section: TutorialSection;
  expandedSections: Set<string>;
  toggleSection: (id: string) => void;
};

const TutorialSectionView = memo(function TutorialSectionView({
  section,
  expandedSections,
  toggleSection,
}: TutorialSectionViewProps) {
  const isExpanded = expandedSections.has(section.id);
  const sectionCompleted = section.steps.every((s) => s.completed);
  const sectionProgress = section.steps.filter((s) => s.completed).length;

  return (
    <div className={`tutorial-section ${section.isNew ? "is-new" : ""}`}>
      <button
        className={`tutorial-section-header ${sectionCompleted ? "completed" : ""}`}
        onClick={() => toggleSection(section.id)}
      >
        <span className="section-toggle">
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        <span className="section-title">{section.title}</span>
        {section.isNew && (
          <span className="section-new-badge">
            <Sparkles size={10} /> New
          </span>
        )}
        <span className="section-progress">
          {sectionProgress}/{section.steps.length}
        </span>
      </button>
      {isExpanded && (
        <ul className="hud-steps">
          {section.steps.map((step) => (
            <li
              key={step.id}
              className={`${step.completed ? "completed" : ""} ${step.isNew ? "is-new" : ""}`}
            >
              <span className="step-check">{step.completed ? "✓" : "○"}</span>
              <span className="step-text">{step.instruction}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export const HUD = memo(function HUD({ world, dispatch, onRegenerate }: HUDProps) {
  const [debugOpen, setDebugOpen] = useState(false);
  const { tutorial, debug, seed, camera, focusedPanel } = world;

  const handleTutorialToggle = useCallback((): void => {
    const willOpen = !tutorial.visible;
    dispatch({ type: "tutorial/toggle" });
    if (willOpen) {
      dispatch({ type: "panel/openTutorial" });
    }
  }, [tutorial.visible, dispatch]);

  const handleDebugToggle = useCallback((): void => {
    const willOpen = !debugOpen;
    setDebugOpen(willOpen);
    if (willOpen) {
      dispatch({ type: "panel/openDebug" });
    }
  }, [debugOpen, dispatch]);

  // Initialize expanded sections based on defaultExpanded and isNew
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const section of tutorial.sections) {
      if (section.defaultExpanded || section.isNew) {
        initial.add(section.id);
      }
    }
    return initial;
  });

  const toggleSection = useCallback((id: string) => {
    setExpandedSections((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const { completed: completedCount, total: totalCount } = countSteps(tutorial.sections);

  return (
    <>
      {/* Top-left: Tutorial */}
      <div
        className={`hud-corner hud-top-left ${focusedPanel === "tutorial" ? "panel-focused" : ""}`}
        onClick={(): void => dispatch({ type: "panel/openTutorial" })}
      >
        <div className={`hud-panel-wrapper tutorial-panel ${tutorial.visible ? "open" : ""}`}>
          {/* Icon/Close button - always in corner position */}
          <button
            className="hud-corner-btn"
            onClick={handleTutorialToggle}
            title={tutorial.visible ? "Close" : "Show tutorial"}
          >
            {tutorial.visible ? <X size={ICON_SIZE} /> : <Compass size={ICON_SIZE} />}
          </button>

          {/* Panel content */}
          <div className="hud-panel-content">
            <div className="hud-progress">
              <div
                className="hud-progress-bar"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
            <div
              className="tutorial-sections"
              onWheel={(e: React.WheelEvent<HTMLDivElement>): void => e.stopPropagation()}
            >
              {tutorial.sections.map((section) => (
                <TutorialSectionView
                  key={section.id}
                  section={section}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                />
              ))}
            </div>
            <div className="hud-footer">
              {completedCount}/{totalCount} completed
            </div>
          </div>
        </div>
      </div>

      {/* Top-right: Debug */}
      <div
        className={`hud-corner hud-top-right ${focusedPanel === "debug" ? "panel-focused" : ""}`}
        onClick={(): void => dispatch({ type: "panel/openDebug" })}
      >
        <div className={`hud-panel-wrapper ${debugOpen ? "open" : ""}`}>
          {/* Icon/Close button - always in corner position */}
          <button
            className="hud-corner-btn"
            onClick={handleDebugToggle}
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
                checked={debug.showForceField}
                onChange={() => dispatch({ type: "debug/toggleForceField" })}
              />
              Force field
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
              <div>{world.fps} FPS</div>
              <div>{camera.zoom.toFixed(2)}×</div>
              <div>{world.entities.size} entities</div>
              <div>
                {world.constellations.size} const / {world.clusters.size} clust
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
