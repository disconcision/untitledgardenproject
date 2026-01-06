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
 * Seeded random number generator for deterministic results.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Generate boulder polygon points with realistic rock-like shapes.
 *
 * Approach:
 * 1. Create a base convex shape with 5-7 major vertices (long edges)
 * 2. Select 1-2 edges to subdivide with localized detail (crevices/protuberances)
 * 3. Most edges remain smooth and long, giving a boulder-like appearance
 */
export function boulderPoints(
  size: number,
  rotation: number,
  _sides: number, // Kept for API compatibility but we compute sides ourselves
  irregularity: number
): string {
  // Use rotation as a seed for deterministic randomness
  const seed = rotation * 1000;

  // Base shape: 5-7 major vertices (fewer = longer, smoother edges)
  const majorVertexCount = 5 + Math.floor(seededRandom(seed) * 3);

  // Build array of points with {angle, radius}
  type Vertex = { angle: number; radius: number };
  const baseVertices: Vertex[] = [];

  for (let i = 0; i < majorVertexCount; i++) {
    const baseAngle = rotation + (i / majorVertexCount) * Math.PI * 2;
    // Gentle variation in radius (0.88-1.0) - keeps shape mostly convex
    const radiusVar = 0.88 + seededRandom(seed + i * 7.3) * 0.12;
    baseVertices.push({ angle: baseAngle, radius: size * radiusVar });
  }

  // Decide which edges get detail (1-2 edges based on irregularity)
  const detailEdgeCount = Math.max(1, Math.floor(irregularity * 4));
  const detailEdges = new Set<number>();

  for (let d = 0; d < detailEdgeCount; d++) {
    const edgeIndex = Math.floor(seededRandom(seed + d * 23.7) * majorVertexCount);
    detailEdges.add(edgeIndex);
  }

  // Build final vertex list, adding detail to selected edges
  const finalVertices: Vertex[] = [];

  for (let i = 0; i < majorVertexCount; i++) {
    const current = baseVertices[i];
    const next = baseVertices[(i + 1) % majorVertexCount];

    // Always add the main vertex
    finalVertices.push(current);

    // If this edge has detail, subdivide it
    if (detailEdges.has(i)) {
      // Determine detail type: crevice (inward) or protuberance (outward)
      const isCrevice = seededRandom(seed + i * 17.1) > 0.5;

      // Add 2-4 intermediate points along this edge
      const detailPointCount = 2 + Math.floor(seededRandom(seed + i * 11.3) * 3);

      for (let j = 1; j <= detailPointCount; j++) {
        const t = j / (detailPointCount + 1); // Interpolation factor

        // Interpolate angle and base radius
        let interpAngle =
          current.angle + ((next.angle - current.angle + Math.PI * 2) % (Math.PI * 2));
        if (interpAngle - current.angle > Math.PI) interpAngle -= Math.PI * 2;
        const detailAngle = current.angle + t * (interpAngle - current.angle);

        const baseRadius = current.radius + t * (next.radius - current.radius);

        // Apply detail variation - strongest in middle of the edge
        const edgeFactor = Math.sin(t * Math.PI); // Peaks at t=0.5
        const variationStrength = irregularity * 0.35 * edgeFactor;

        let radiusOffset: number;
        if (isCrevice) {
          // Crevice: radius decreases (inward)
          radiusOffset = -variationStrength * (0.5 + seededRandom(seed + i * 100 + j * 13) * 0.5);
        } else {
          // Protuberance: radius increases (outward)
          radiusOffset = variationStrength * (0.5 + seededRandom(seed + i * 100 + j * 13) * 0.5);
        }

        // Add some noise to make it less uniform
        const noise = (seededRandom(seed + i * 200 + j * 31) - 0.5) * irregularity * 0.1;

        finalVertices.push({
          angle: detailAngle,
          radius: baseRadius * (1 + radiusOffset + noise),
        });
      }
    }
  }

  // Convert to SVG points string
  return finalVertices
    .map((v: Vertex): string => {
      const x = Math.cos(v.angle) * v.radius;
      const y = Math.sin(v.angle) * v.radius;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
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
      onClick={dispatch ? (): void => dispatch({ type: "select", id: rock.id }) : undefined}
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
              fill="var(--color-rock-mid)"
              stroke={isHovered ? "var(--color-selection)" : "var(--color-rock-dark)"}
              strokeWidth={isHovered ? 1.5 : 0.8}
              className="rock-body"
              style={isHovered ? { filter: "brightness(1.1)" } : undefined}
            />

            {/* Subtle highlight edge - solid for cleaner look */}
            <polygon
              points={points}
              fill="none"
              stroke="var(--color-rock-light)"
              strokeWidth={0.3}
              opacity={0.25}
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
