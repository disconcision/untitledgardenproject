/**
 * Cluster Glyph Renderer — Central visual anchor
 *
 * Abstract symbols marking cluster centers.
 */

import { memo } from "react";
import { Cluster } from "../model";
import { Msg } from "../update";

export type ClusterGlyphRendererProps = {
  cluster: Cluster;
  showId: boolean;
  isDistant: boolean;
  isHovered: boolean;
  dispatch?: (msg: Msg) => void;
};

export const ClusterGlyphRenderer = memo(function ClusterGlyphRenderer({
  cluster,
  showId,
  isDistant,
  isHovered,
  dispatch,
}: ClusterGlyphRendererProps): JSX.Element {
  const { pos, glyphKind, rotation } = cluster;

  // Distant glyphs are slightly larger to remain visible through fog
  const scale = isDistant ? 1.5 : 1;

  const renderGlyph = (): JSX.Element => {
    switch (glyphKind) {
      case "seed":
        // Seed: small filled circle with radiating lines
        return (
          <>
            <circle cx={0} cy={0} r={4} fill="var(--color-earth-mid)" />
            {[0, 1, 2, 3, 4, 5].map((i: number) => {
              const angle = rotation + (i / 6) * Math.PI * 2;
              const x1 = Math.cos(angle) * 6;
              const y1 = Math.sin(angle) * 6;
              const x2 = Math.cos(angle) * 12;
              const y2 = Math.sin(angle) * 12;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--color-earth-tan)"
                  strokeWidth={1}
                  strokeLinecap="round"
                  opacity={0.5}
                />
              );
            })}
          </>
        );

      case "node":
        // Node: concentric circles
        return (
          <>
            <circle
              cx={0}
              cy={0}
              r={10}
              fill="none"
              stroke="var(--color-rock-pale)"
              strokeWidth={0.5}
              opacity={0.3}
            />
            <circle
              cx={0}
              cy={0}
              r={6}
              fill="none"
              stroke="var(--color-rock-mid)"
              strokeWidth={0.5}
              opacity={0.4}
            />
            <circle cx={0} cy={0} r={2} fill="var(--color-rock-dark)" opacity={0.5} />
          </>
        );

      case "sigil":
        // Sigil: abstract symbol
        return (
          <g transform={`rotate(${(rotation * 180) / Math.PI})`}>
            <path
              d="M0,-8 L4,4 L-4,4 Z"
              fill="none"
              stroke="var(--color-green-moss)"
              strokeWidth={0.5}
              opacity={0.4}
            />
            <circle cx={0} cy={0} r={3} fill="var(--color-green-deepForest)" opacity={0.4} />
          </g>
        );
    }
  };

  return (
    <g
      transform={`translate(${pos.x}, ${pos.y}) scale(${scale})`}
      className={`cluster-glyph ${isHovered ? "hovered" : ""}`}
      filter="url(#glyph-glow)"
      style={{ cursor: dispatch ? "pointer" : undefined }}
      data-entity-id={cluster.id}
      onPointerEnter={
        dispatch ? (): void => dispatch({ type: "hover", id: cluster.id }) : undefined
      }
      onPointerLeave={dispatch ? (): void => dispatch({ type: "hover", id: null }) : undefined}
      onClick={
        dispatch
          ? (): void => dispatch({ type: "camera/focus", target: pos, zoom: 1.0 })
          : undefined
      }
    >
      {/* Hover indicator ring */}
      {isHovered && (
        <circle
          cx={0}
          cy={0}
          r={16}
          fill="none"
          stroke="var(--color-green-moss)"
          strokeWidth={1.5}
          opacity={0.6}
          className="cluster-hover-ring"
        />
      )}
      {renderGlyph()}

      {showId && (
        <text x={0} y={-20} textAnchor="middle" className="debug-label">
          {cluster.id}
        </text>
      )}
    </g>
  );
});
