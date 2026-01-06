/**
 * Island Renderer — Floating soil blobs
 *
 * Soft-edged organic shapes with subtle shadows.
 */

import { memo } from "react";
import { Island, Vec2 } from "../model";
import { Msg } from "../update";
import { blobPath } from "./paths";

export type IslandRendererProps = {
  island: Island;
  worldPos: Vec2;
  isHovered: boolean;
  isSelected: boolean;
  showId: boolean;
  showHitTarget: boolean;
  dispatch?: (msg: Msg) => void;
};

export const IslandRenderer = memo(function IslandRenderer({
  island,
  worldPos,
  isHovered,
  isSelected,
  showId,
  showHitTarget,
  dispatch,
}: IslandRendererProps): JSX.Element {
  const pathData = blobPath(island.shape);

  // CSS animation delay based on position for variety
  const animDelay = `${(worldPos.x * 0.001 + worldPos.y * 0.002) % 1}s`;

  return (
    <g
      className="island-group"
      style={{ "--anim-delay": animDelay } as React.CSSProperties}
      transform={`translate(${worldPos.x}, ${worldPos.y})`}
      data-entity-id={island.id}
      onPointerEnter={dispatch ? (): void => dispatch({ type: "hover", id: island.id }) : undefined}
      onPointerLeave={dispatch ? (): void => dispatch({ type: "hover", id: null }) : undefined}
      onClick={dispatch ? (): void => dispatch({ type: "select", id: island.id }) : undefined}
      onDoubleClick={
        dispatch
          ? (): void => dispatch({ type: "camera/focus", target: worldPos, zoom: 1.5 })
          : undefined
      }
    >
      {/* Soft shadow */}
      <path
        d={pathData}
        fill="rgba(60, 50, 40, 0.2)"
        transform="translate(2, 4)"
        style={{ filter: "blur(3px)" }}
      />

      {/* Main island shape */}
      <path
        d={pathData}
        fill="var(--color-earth-mid)"
        stroke="var(--color-earth-dark)"
        strokeWidth={1}
        className={isHovered || isSelected ? "island-highlighted" : ""}
      />

      {showHitTarget && (
        <circle
          cx={0}
          cy={0}
          r={island.radius}
          fill="none"
          stroke="red"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.5}
        />
      )}

      {showId && (
        <text x={0} y={-island.radius - 8} textAnchor="middle" className="debug-label">
          {island.id}
        </text>
      )}
    </g>
  );
});
