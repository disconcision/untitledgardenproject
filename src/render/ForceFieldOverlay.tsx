/**
 * Force Field Debug Overlay
 *
 * Renders sample vectors showing force field direction and strength.
 * Only visible when debug.showForceField is enabled.
 */

import { memo, useMemo } from "react";
import { World, Vec2, vec2, lenVec2 } from "../model";
import { createPathwayForce } from "../core/forces";

type ForceFieldOverlayProps = {
  world: World;
  camera: { pan: Vec2; zoom: number };
};

// Grid spacing in world units (smaller = denser sample points)
const GRID_SPACING = 80;
// Maximum arrow length in pixels
const MAX_ARROW_LENGTH = 25;
// Minimum force magnitude to draw
const MIN_FORCE_THRESHOLD = 0.3;

// Create the pathway force field for sampling
const pathwayForce = createPathwayForce({
  maxDistance: 400,
  baseStrength: 20,
  attractionWeight: 0.2,
  directionWeight: 0.8,
});

export const ForceFieldOverlay = memo(function ForceFieldOverlay({
  world,
  camera,
}: ForceFieldOverlayProps): JSX.Element {
  // Calculate visible area in world coordinates
  const samples = useMemo(() => {
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;

    // Calculate world bounds based on camera
    const worldLeft = (-viewWidth / 2 - camera.pan.x) / camera.zoom;
    const worldRight = (viewWidth / 2 - camera.pan.x) / camera.zoom;
    const worldTop = (-viewHeight / 2 - camera.pan.y) / camera.zoom;
    const worldBottom = (viewHeight / 2 - camera.pan.y) / camera.zoom;

    // Add padding
    const padding = GRID_SPACING;
    const minX = Math.floor((worldLeft - padding) / GRID_SPACING) * GRID_SPACING;
    const maxX = Math.ceil((worldRight + padding) / GRID_SPACING) * GRID_SPACING;
    const minY = Math.floor((worldTop - padding) / GRID_SPACING) * GRID_SPACING;
    const maxY = Math.ceil((worldBottom + padding) / GRID_SPACING) * GRID_SPACING;

    // Sample the force field on a grid
    const result: Array<{ pos: Vec2; force: Vec2; magnitude: number }> = [];

    for (let x = minX; x <= maxX; x += GRID_SPACING) {
      for (let y = minY; y <= maxY; y += GRID_SPACING) {
        const pos = vec2(x, y);
        const force = pathwayForce(pos, world);
        const magnitude = lenVec2(force);

        if (magnitude > MIN_FORCE_THRESHOLD) {
          result.push({ pos, force, magnitude });
        }
      }
    }

    return result;
  }, [world.pathways, world.clusters, camera.pan.x, camera.pan.y, camera.zoom]);

  return (
    <g className="force-field-overlay" opacity={0.6}>
      {samples.map(({ pos, force, magnitude }, idx) => {
        // Normalize and scale the arrow
        const scale = Math.min(MAX_ARROW_LENGTH, magnitude * 2);
        const nx = force.x / magnitude;
        const ny = force.y / magnitude;

        const endX = pos.x + nx * scale;
        const endY = pos.y + ny * scale;

        // Arrowhead
        const arrowSize = Math.min(6, scale * 0.3);
        const arrowAngle = Math.atan2(ny, nx);
        const arrowAngle1 = arrowAngle + Math.PI * 0.8;
        const arrowAngle2 = arrowAngle - Math.PI * 0.8;
        const arrow1X = endX + Math.cos(arrowAngle1) * arrowSize;
        const arrow1Y = endY + Math.sin(arrowAngle1) * arrowSize;
        const arrow2X = endX + Math.cos(arrowAngle2) * arrowSize;
        const arrow2Y = endY + Math.sin(arrowAngle2) * arrowSize;

        // Color based on magnitude (blue = weak, red = strong)
        const intensity = Math.min(1, magnitude / 30);
        const hue = 200 - intensity * 150; // 200 (blue) to 50 (orange)

        return (
          <g key={idx}>
            <line
              x1={pos.x}
              y1={pos.y}
              x2={endX}
              y2={endY}
              stroke={`hsl(${hue}, 80%, 50%)`}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <path
              d={`M ${endX} ${endY} L ${arrow1X} ${arrow1Y} M ${endX} ${endY} L ${arrow2X} ${arrow2Y}`}
              stroke={`hsl(${hue}, 80%, 50%)`}
              strokeWidth={1.5}
              strokeLinecap="round"
              fill="none"
            />
            {/* Dot at sample point */}
            <circle cx={pos.x} cy={pos.y} r={2} fill={`hsl(${hue}, 80%, 50%)`} />
          </g>
        );
      })}
    </g>
  );
});
