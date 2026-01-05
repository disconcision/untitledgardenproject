/**
 * Rock Renderer — Angular boulder formations
 *
 * Primary visual anchors with glacial feel.
 */

import { memo } from "react";
import { Rock, Vec2, addVec2 } from "../model";
import { Msg } from "../update";

export type RockRendererProps = {
  rock: Rock;
  islandPos: Vec2;
  isHovered: boolean;
  showId: boolean;
  showHitTarget: boolean;
  dispatch?: (msg: Msg) => void;
};

/**
 * Generate boulder polygon points with organic irregularity.
 */
export function boulderPoints(
  size: number,
  rotation: number,
  sides: number,
  irregularity: number
): string {
  return Array.from({ length: sides }, (_: unknown, i: number): string => {
    const angle = rotation + (i / sides) * Math.PI * 2;
    // Smooth but varied edges - glacial erratic feel
    const wave1 = Math.sin(i * 2.3 + rotation * 5) * irregularity;
    const wave2 = Math.cos(i * 3.7 + rotation * 3) * irregularity * 0.5;
    const r = size * (0.85 + wave1 + wave2);
    return `${Math.cos(angle) * r},${Math.sin(angle) * r}`;
  }).join(" ");
}

export const RockRenderer = memo(function RockRenderer({
  rock,
  islandPos,
  isHovered,
  showId,
  showHitTarget,
  dispatch,
}: RockRendererProps): JSX.Element {
  const worldPos = addVec2(islandPos, rock.localPos);

  // Find the largest boulder for hit target sizing
  const mainBoulder = rock.boulders[0];
  const hitRadius = mainBoulder ? mainBoulder.size * 1.2 : 30;

  return (
    <g
      className="rock-group"
      transform={`translate(${worldPos.x}, ${worldPos.y})`}
      data-entity-id={rock.id}
      onPointerEnter={dispatch ? (): void => dispatch({ type: "hover", id: rock.id }) : undefined}
      onPointerLeave={dispatch ? (): void => dispatch({ type: "hover", id: null }) : undefined}
    >
      {/* Render each boulder in the formation */}
      {rock.boulders.map((boulder, idx) => {
        const points = boulderPoints(
          boulder.size,
          boulder.rotation,
          boulder.sides,
          boulder.irregularity
        );

        return (
          <g key={idx} transform={`translate(${boulder.localPos.x}, ${boulder.localPos.y})`}>
            {/* Boulder shadow */}
            <polygon
              points={points}
              fill="rgba(30, 30, 35, 0.12)"
              transform="translate(2, 3)"
              style={{ filter: "blur(3px)" }}
            />

            {/* Boulder body - monolithic, glacial feel */}
            <polygon
              points={points}
              fill={isHovered ? "var(--color-rock-hover)" : "var(--color-rock-mid)"}
              stroke="var(--color-rock-dark)"
              strokeWidth={0.8}
            />

            {/* Subtle highlight edge */}
            <polygon
              points={points}
              fill="none"
              stroke="var(--color-rock-light)"
              strokeWidth={0.5}
              strokeDasharray="3 6"
              opacity={0.4}
            />
          </g>
        );
      })}

      {showHitTarget && (
        <circle
          cx={0}
          cy={0}
          r={hitRadius}
          fill="none"
          stroke="red"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.5}
        />
      )}

      {showId && (
        <text x={0} y={-hitRadius - 4} textAnchor="middle" className="debug-label">
          {rock.id}
        </text>
      )}
    </g>
  );
});
