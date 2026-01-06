/**
 * Pathway Renderer — Inter-cluster constellation lines
 *
 * Ethereal luminous lines connecting cluster glyphs.
 * Time-based color: cool starlight at night, warm gold by day.
 * Visibility: always faintly visible, brighter when zoomed out or hovered.
 */

import { memo, useMemo } from "react";
import { Pathway, Cluster, Vec2, Id } from "../model";
import { Msg } from "../update";

export type PathwayLayerProps = {
  pathways: Pathway[];
  clusters: Map<Id, Cluster>;
  zoom: number;
  hoveredPathwayId: Id | null;
  dispatch: (msg: Msg) => void;
};

/**
 * Compute pathway opacity based on zoom level and hover state.
 * - Subtle during day, more visible at night (handled by color scheme)
 * - More visible when zoomed out (emphasizes constellation structure)
 * - Highlighted when hovered
 */
function computePathwayOpacity(zoom: number, isHovered: boolean): number {
  // Base opacity - pathways are subtle at normal zoom
  const baseOpacity = 0.12;

  // Zoom boost: more visible when zoomed out (zoom < 0.8)
  // At zoom 1.0: no boost. At zoom 0.3: significant boost (~0.5)
  // At zoom 0.1: strong boost (~0.7)
  const zoomBoost = Math.max(0, (0.8 - zoom) * 0.8);

  // Hover boost
  const hoverBoost = isHovered ? 0.4 : 0;

  return Math.min(1, baseOpacity + zoomBoost + hoverBoost);
}

/**
 * Compute stroke width based on zoom and hover.
 * Always thin (~1px on screen) - pathways are conceptual, not physical.
 */
function computeStrokeWidth(zoom: number, isHovered: boolean): number {
  // Always thin, scale by 1/zoom to maintain consistent screen appearance
  const targetScreenWidth = isHovered ? 1.5 : 1;
  const invZoom = 1 / zoom;
  return targetScreenWidth * invZoom;
}

export type PathwayRendererProps = {
  pathway: Pathway;
  fromPos: Vec2;
  toPos: Vec2;
  zoom: number;
  isHovered: boolean;
  dispatch: (msg: Msg) => void;
};

/**
 * Compute the dash pattern for direction indicator.
 * Returns [dashLength, gapLength] in world units.
 */
function computeDirectionDash(zoom: number): [number, number] {
  // Scale dash to maintain consistent screen appearance
  const invZoom = 1 / zoom;
  return [8 * invZoom, 12 * invZoom];
}

/**
 * Compute the animation duration based on pathway length.
 * Longer pathways animate slower to maintain consistent perceived speed.
 */
function computeAnimationDuration(fromPos: Vec2, toPos: Vec2): number {
  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  // Base speed: ~100 world units per second
  return Math.max(1, length / 100);
}

export const PathwayRenderer = memo(function PathwayRenderer({
  pathway,
  fromPos,
  toPos,
  zoom,
  isHovered,
  dispatch,
}: PathwayRendererProps): JSX.Element {
  const opacity = computePathwayOpacity(zoom, isHovered);
  const strokeWidth = computeStrokeWidth(zoom, isHovered);

  // Use a slightly thicker invisible stroke for easier hover detection
  const hitAreaWidth = Math.max(strokeWidth * 3, 8);

  // Direction indicator settings
  const [dashLength, gapLength] = computeDirectionDash(zoom);
  const dashArray = `${dashLength} ${gapLength}`;
  const animDuration = computeAnimationDuration(fromPos, toPos);

  // Determine animation direction based on pathway direction
  // "forward" = from → to, "backward" = to → from, "bidirectional" = pulse
  const direction = pathway.direction;

  // CSS animation for flowing dashes
  const flowStyle: React.CSSProperties = {
    pointerEvents: "none",
    // Animation: offset decreases for forward flow, increases for backward
    animation:
      direction === "bidirectional"
        ? `pathway-pulse ${animDuration * 2}s ease-in-out infinite`
        : `pathway-flow ${animDuration}s linear infinite`,
    // Reverse animation direction for backward flow
    animationDirection: direction === "backward" ? "reverse" : "normal",
  };

  return (
    <g className="pathway-group">
      {/* Invisible wider hit area for easier hovering */}
      <line
        x1={fromPos.x}
        y1={fromPos.y}
        x2={toPos.x}
        y2={toPos.y}
        stroke="transparent"
        strokeWidth={hitAreaWidth}
        strokeLinecap="round"
        style={{ cursor: "pointer" }}
        onPointerEnter={(): void => dispatch({ type: "pathway/hover", id: pathway.id })}
        onPointerLeave={(): void => dispatch({ type: "pathway/hover", id: null })}
      />
      {/* Base pathway line */}
      <line
        data-pathway-id={pathway.id}
        x1={fromPos.x}
        y1={fromPos.y}
        x2={toPos.x}
        y2={toPos.y}
        className={`pathway-line ${isHovered ? "pathway-hovered" : ""}`}
        stroke="var(--color-pathway-stroke)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={opacity}
        style={{ pointerEvents: "none" }}
      />
      {/* Direction indicator overlay (visible on hover) */}
      {isHovered && (
        <line
          x1={fromPos.x}
          y1={fromPos.y}
          x2={toPos.x}
          y2={toPos.y}
          className="pathway-direction"
          stroke="var(--color-pathway-stroke)"
          strokeWidth={strokeWidth * 1.5}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          opacity={0.8}
          style={flowStyle}
        />
      )}
    </g>
  );
});

export const PathwayLayer = memo(function PathwayLayer({
  pathways,
  clusters,
  zoom,
  hoveredPathwayId,
  dispatch,
}: PathwayLayerProps): JSX.Element {
  // Pre-compute pathway rendering data
  const pathwayData = useMemo(() => {
    return pathways
      .map((pathway: Pathway) => {
        const fromCluster = clusters.get(pathway.fromClusterId);
        const toCluster = clusters.get(pathway.toClusterId);
        if (!fromCluster || !toCluster) return null;
        return {
          pathway,
          fromPos: fromCluster.pos,
          toPos: toCluster.pos,
        };
      })
      .filter((data): data is { pathway: Pathway; fromPos: Vec2; toPos: Vec2 } => data !== null);
  }, [pathways, clusters]);

  return (
    <g className="pathway-layer">
      {pathwayData.map(({ pathway, fromPos, toPos }) => (
        <PathwayRenderer
          key={pathway.id}
          pathway={pathway}
          fromPos={fromPos}
          toPos={toPos}
          zoom={zoom}
          isHovered={pathway.id === hoveredPathwayId}
          dispatch={dispatch}
        />
      ))}
    </g>
  );
});
