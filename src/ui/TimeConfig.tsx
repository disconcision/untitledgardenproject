/**
 * Hanging Garden — Time Configuration Panel
 *
 * Controls for day/night cycle: time scrubber, day length, play/pause.
 * Located in the bottom-right corner.
 */

import { memo, useState } from "react";
import {
  Clock,
  Play,
  Pause,
  X,
  Sun,
  Moon,
  Sunrise,
  Sunset,
} from "lucide-react";
import { World } from "../model";
import { Msg } from "../update";
import { formatTimeOfDay, getDayPhase } from "../theme/oklch";
import "./TimeConfig.css";

const ICON_SIZE = 16;

type TimeConfigProps = {
  world: World;
  dispatch: (msg: Msg) => void;
};

// Day length presets in milliseconds
const DAY_LENGTH_PRESETS = [
  { label: "1 min", value: 60000 },
  { label: "3 min", value: 180000 },
  { label: "5 min", value: 300000 },
  { label: "10 min", value: 600000 },
];

function PhaseIcon({
  phase,
}: {
  phase: "night" | "dawn" | "day" | "dusk";
}): JSX.Element {
  switch (phase) {
    case "night":
      return <Moon size={14} />;
    case "dawn":
      return <Sunrise size={14} />;
    case "day":
      return <Sun size={14} />;
    case "dusk":
      return <Sunset size={14} />;
  }
}

export const TimeConfig = memo(function TimeConfig({
  world,
  dispatch,
}: TimeConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { dayCycle } = world;
  const phase = getDayPhase(dayCycle.timeOfDay);
  const timeStr = formatTimeOfDay(dayCycle.timeOfDay);

  const handleToggle = (): void => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen) {
      dispatch({ type: "panel/openTime" });
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.target.value);
    dispatch({ type: "dayCycle/setTime", timeOfDay: value });
  };

  const handleDayLengthChange = (value: number): void => {
    dispatch({ type: "dayCycle/setDayLength", dayLengthMs: value });
  };

  const toggleRunning = (): void => {
    dispatch({ type: "dayCycle/toggleRunning" });
  };

  // Format day length for display
  const formatDayLength = (ms: number): string => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="hud-corner hud-bottom-right">
      <div className={`hud-panel-wrapper time-panel ${isOpen ? "open" : ""}`}>
        {/* Icon/Close button - always in corner position */}
        <button
          className="hud-corner-btn"
          onClick={handleToggle}
          title={isOpen ? "Close" : "Time settings"}
        >
          {isOpen ? <X size={ICON_SIZE} /> : <Clock size={ICON_SIZE} />}
        </button>

        {/* Panel content */}
        <div className="hud-panel-content time-content">
          {/* Current time display */}
          <div className="time-display">
            <span className="time-phase">
              <PhaseIcon phase={phase} />
            </span>
            <span className="time-clock">{timeStr}</span>
            <button
              className="time-play-pause"
              onClick={toggleRunning}
              title={
                dayCycle.running ? "Pause simulation" : "Resume simulation"
              }
            >
              {dayCycle.running ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>

          {/* Time of day scrubber */}
          <div className="time-scrubber">
            <label>Time of Day</label>
            <div className="scrubber-track">
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={dayCycle.timeOfDay}
                onChange={handleTimeChange}
                className="time-slider"
              />
              <div className="scrubber-gradient" />
            </div>
            <div className="scrubber-labels">
              <span>🌙</span>
              <span>🌅</span>
              <span>☀️</span>
              <span>🌇</span>
              <span>🌙</span>
            </div>
          </div>

          {/* Day length */}
          <div className="day-length">
            <label>Day Length: {formatDayLength(dayCycle.dayLengthMs)}</label>
            <div className="day-length-presets">
              {DAY_LENGTH_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  className={`preset-btn ${
                    dayCycle.dayLengthMs === preset.value ? "active" : ""
                  }`}
                  onClick={() => handleDayLengthChange(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick jump buttons */}
          <div className="time-jumps">
            <button
              onClick={() =>
                dispatch({ type: "dayCycle/setTime", timeOfDay: 0 })
              }
            >
              <Moon size={12} /> Midnight
            </button>
            <button
              onClick={() =>
                dispatch({ type: "dayCycle/setTime", timeOfDay: 0.25 })
              }
            >
              <Sunrise size={12} /> Sunrise
            </button>
            <button
              onClick={() =>
                dispatch({ type: "dayCycle/setTime", timeOfDay: 0.5 })
              }
            >
              <Sun size={12} /> Noon
            </button>
            <button
              onClick={() =>
                dispatch({ type: "dayCycle/setTime", timeOfDay: 0.75 })
              }
            >
              <Sunset size={12} /> Sunset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
