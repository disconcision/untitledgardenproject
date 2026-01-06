/**
 * Plant Renderer — Branching plant structures
 *
 * Organic bezier stems with various node types.
 */

import { memo } from "react";
import { Plant, PlantNode, Vec2, addVec2 } from "../model";
import { Msg } from "../update";

export type PlantRendererProps = {
  plant: Plant;
  nodes: PlantNode[];
  islandPos: Vec2;
  hover: string | null;
  showIds: boolean;
  showHitTargets: boolean;
  dispatch?: (msg: Msg) => void;
};

export const PlantRenderer = memo(function PlantRenderer({
  plant,
  nodes,
  islandPos,
  hover,
  showIds,
  showHitTargets,
  dispatch,
}: PlantRendererProps): JSX.Element {
  const nodeMap = new Map(nodes.map((n: PlantNode): [string, PlantNode] => [n.id, n]));

  return (
    <g className="plant-group">
      {/* Stems with bark-like thickness gradient */}
      {Array.from(plant.adjacency.entries()).map(([parentId, childIds]: [string, string[]]) => {
        const parent = nodeMap.get(parentId);
        if (!parent) return null;

        return childIds.map((childId: string) => {
          const child = nodeMap.get(childId);
          if (!child) return null;

          const p1 = addVec2(islandPos, parent.localPos);
          const p2 = addVec2(islandPos, child.localPos);

          // Bezier curve for organic feel
          const midX = (p1.x + p2.x) / 2 + (p2.y - p1.y) * 0.12;
          const midY = (p1.y + p2.y) / 2 - (p2.x - p1.x) * 0.12;

          // Bark-like thickness: thicker near root (low depth), thinner outward
          const parentDepth = parent.depth ?? 0;
          const childDepth = child.depth ?? parentDepth + 1;
          const avgDepth = (parentDepth + childDepth) / 2;
          const strokeWidth = Math.max(1, 4 - avgDepth * 0.6);

          return (
            <path
              key={`stem-${parentId}-${childId}`}
              d={`M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`}
              fill="none"
              stroke="var(--color-stem)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="stem-path"
            />
          );
        });
      })}

      {/* Nodes */}
      {nodes.map((node: PlantNode) => (
        <PlantNodeRenderer
          key={node.id}
          node={node}
          islandPos={islandPos}
          isHovered={hover === node.id}
          showId={showIds}
          showHitTarget={showHitTargets}
          dispatch={dispatch}
        />
      ))}
    </g>
  );
});

// === Plant Node Renderer ===

type PlantNodeRendererProps = {
  node: PlantNode;
  islandPos: Vec2;
  isHovered: boolean;
  showId: boolean;
  showHitTarget: boolean;
  dispatch?: (msg: Msg) => void;
};

const PlantNodeRenderer = memo(function PlantNodeRenderer({
  node,
  islandPos,
  isHovered,
  showId,
  showHitTarget,
  dispatch,
}: PlantNodeRendererProps): JSX.Element {
  const worldPos = addVec2(islandPos, node.localPos);
  const isCharged = node.nodeKind === "bud" && (node.charge ?? 0) >= 0.8;
  const isInteractive = dispatch !== undefined;
  const hasPrimaryAction = dispatch && node.nodeKind === "bud" && isCharged;

  const handleClick = (): void => {
    if (!dispatch) return;
    // Always select on click
    dispatch({ type: "select", id: node.id });
    // Additionally, sprout if it's a charged bud
    if (node.nodeKind === "bud" && isCharged) {
      dispatch({ type: "sprout", budId: node.id });
    }
  };

  const handleContextMenu = (e: React.MouseEvent): void => {
    if (!dispatch) return;
    e.preventDefault();
    e.stopPropagation();

    const screenPos = { x: e.clientX, y: e.clientY };
    dispatch({
      type: "contextMenu/open",
      nodeId: node.id,
      screenPos,
      worldPos,
    });
  };

  const hitRadius = node.nodeKind === "bud" ? 14 : 8;

  return (
    <g
      className={`plant-node ${isInteractive ? "interactive" : ""} ${
        hasPrimaryAction ? "has-action" : ""
      }`}
      transform={`translate(${worldPos.x}, ${worldPos.y})`}
      data-entity-id={node.id}
      onPointerEnter={dispatch ? (): void => dispatch({ type: "hover", id: node.id }) : undefined}
      onPointerLeave={dispatch ? (): void => dispatch({ type: "hover", id: null }) : undefined}
      onClick={isInteractive ? handleClick : undefined}
      onContextMenu={isInteractive ? handleContextMenu : undefined}
    >
      {/* Invisible hit target for buds and stems */}
      {isInteractive && node.nodeKind !== "leaf" && (
        <circle cx={0} cy={0} r={hitRadius} fill="transparent" className="hit-target" />
      )}

      {node.nodeKind === "bud" && (
        <BudGlyph node={node} isHovered={isHovered} isCharged={isCharged} />
      )}

      {node.nodeKind === "stem" && <StemGlyph isHovered={isHovered} />}

      {node.nodeKind === "leaf" && <LeafGlyph node={node} isHovered={isHovered} />}

      {node.nodeKind === "flower" && <FlowerGlyph node={node} isHovered={isHovered} />}

      {showHitTarget && (
        <circle cx={0} cy={0} r={hitRadius} fill="none" stroke="orange" strokeDasharray="2 2" />
      )}

      {showId && (
        <text x={0} y={-hitRadius - 4} textAnchor="middle" className="debug-label">
          {node.id}
        </text>
      )}
    </g>
  );
});

// === Node Glyphs ===

type BudGlyphProps = {
  node: PlantNode;
  isHovered: boolean;
  isCharged: boolean;
};

function BudGlyph({ node, isHovered, isCharged }: BudGlyphProps): JSX.Element {
  const charge = node.charge ?? 0;
  const chargeScale = 0.8 + charge * 0.4;
  const baseRadius = 6;
  const glowRadius = baseRadius * chargeScale;

  return (
    <>
      {/* Hover ring - consistent with other entities */}
      {isHovered && !isCharged && (
        <circle
          cx={0}
          cy={0}
          r={glowRadius + 5}
          fill="none"
          stroke="var(--color-selection)"
          strokeWidth={1.5}
          opacity={0.6}
          className="bud-hover-ring"
        />
      )}
      {/* Charged glow - pulsing animation */}
      {isCharged && (
        <circle
          cx={0}
          cy={0}
          r={glowRadius + 4}
          fill="none"
          stroke={isHovered ? "var(--color-selection)" : "var(--color-bud-glow)"}
          strokeWidth={2}
          opacity={isHovered ? 0.8 : 0.6}
          className="bud-glow"
        />
      )}
      <circle
        cx={0}
        cy={0}
        r={glowRadius}
        fill={isCharged ? "var(--color-bud-charged)" : "var(--color-bud)"}
        stroke={isHovered ? "var(--color-selection)" : "var(--color-bud-dark)"}
        strokeWidth={isHovered ? 1 : 0.5}
        className={isHovered ? "bud-hovered" : ""}
        style={isHovered ? { filter: "brightness(1.1)" } : undefined}
      />
      {isCharged && (
        <circle cx={-1.5} cy={-1.5} r={2} fill="var(--color-bud-highlight)" opacity={0.6} />
      )}
    </>
  );
}

type StemGlyphProps = {
  isHovered: boolean;
};

function StemGlyph({ isHovered }: StemGlyphProps): JSX.Element {
  return (
    <>
      {isHovered && (
        <circle
          cx={0}
          cy={0}
          r={7}
          fill="none"
          stroke="var(--color-selection)"
          strokeWidth={1.5}
          opacity={0.6}
          className="stem-hover-glow"
        />
      )}
      <circle
        cx={0}
        cy={0}
        r={3}
        fill="var(--color-stem)"
        stroke={isHovered ? "var(--color-selection)" : "var(--color-stem-dark)"}
        strokeWidth={isHovered ? 1 : 0.5}
        style={isHovered ? { filter: "brightness(1.15)" } : undefined}
      />
    </>
  );
}

type LeafGlyphProps = {
  node: PlantNode;
  isHovered: boolean;
};

function LeafGlyph({ node, isHovered }: LeafGlyphProps): JSX.Element {
  const rotationDeg = ((node.angle + Math.PI / 2) * 180) / Math.PI;

  // Simple leaf shape path (tip up, base at origin)
  const leafSize = 12;
  const leafWidth = 6;
  const leafPathData = `
    M 0 0 
    Q ${-leafWidth * 0.4} ${-leafSize * 0.3} ${-leafWidth * 0.3} ${-leafSize * 0.6}
    Q ${-leafWidth * 0.1} ${-leafSize * 0.9} 0 ${-leafSize}
    Q ${leafWidth * 0.1} ${-leafSize * 0.9} ${leafWidth * 0.3} ${-leafSize * 0.6}
    Q ${leafWidth * 0.4} ${-leafSize * 0.3} 0 0
    Z
  `;

  return (
    <g transform={`rotate(${rotationDeg})`}>
      {/* Hover ring - consistent with other entities */}
      {isHovered && (
        <circle
          cx={0}
          cy={-leafSize * 0.5}
          r={leafSize * 0.7}
          fill="none"
          stroke="var(--color-selection)"
          strokeWidth={1.5}
          opacity={0.5}
          className="leaf-hover-glow"
        />
      )}
      <path
        d={leafPathData}
        fill={isHovered ? "var(--color-leaf-hover)" : "var(--color-leaf)"}
        stroke={isHovered ? "var(--color-selection)" : "var(--color-leaf-dark)"}
        strokeWidth={isHovered ? 0.8 : 0.4}
        className="leaf-shape"
        style={isHovered ? { filter: "brightness(1.1)" } : undefined}
      />
    </g>
  );
}

type FlowerGlyphProps = {
  node: PlantNode;
  isHovered: boolean;
};

function FlowerGlyph({ node, isHovered }: FlowerGlyphProps): JSX.Element {
  const flowerSize = 8;
  const petalCount = 5;

  // Orient flower to face outward from the branch (in direction of node.angle)
  // The node.angle is the growth direction, so flower "faces" that way
  const baseAngle = node.angle ?? 0;
  const rotationDeg = (baseAngle * 180) / Math.PI + 90; // +90 to face outward

  return (
    <g transform={`rotate(${rotationDeg})`}>
      {/* Hover ring - consistent with other entities */}
      {isHovered && (
        <circle
          cx={0}
          cy={0}
          r={flowerSize + 6}
          fill="none"
          stroke="var(--color-selection)"
          strokeWidth={1.5}
          opacity={0.6}
          className="flower-hover-glow"
        />
      )}

      {/* Soft ambient glow */}
      <circle
        cx={0}
        cy={0}
        r={flowerSize + 4}
        fill="var(--color-flower-glow)"
        opacity={isHovered ? 0.5 : 0.3}
        filter="url(#flower-glow)"
      />

      {/* Petals arranged radially but with asymmetry toward the facing direction */}
      {Array.from({ length: petalCount }).map((_, i: number) => {
        // Spread petals in a fan facing outward, biased toward the growth direction
        const spreadAngle = Math.PI * 0.8; // ~145 degree spread
        const startAngle = -spreadAngle / 2 - Math.PI / 2;
        const angle = startAngle + (i / (petalCount - 1)) * spreadAngle;
        const petalDist = flowerSize * 0.5;
        const petalX = Math.cos(angle) * petalDist;
        const petalY = Math.sin(angle) * petalDist;

        return (
          <ellipse
            key={i}
            cx={petalX}
            cy={petalY}
            rx={flowerSize * 0.45}
            ry={flowerSize * 0.25}
            fill={isHovered ? "var(--color-flower-petal-hover)" : "var(--color-flower-petal)"}
            stroke={isHovered ? "var(--color-selection)" : "var(--color-flower-petal-dark)"}
            strokeWidth={isHovered ? 0.5 : 0.3}
            transform={`rotate(${(angle * 180) / Math.PI}, ${petalX}, ${petalY})`}
            style={isHovered ? { filter: "brightness(1.1)" } : undefined}
          />
        );
      })}

      {/* Center - slightly offset toward stem */}
      <circle
        cx={0}
        cy={flowerSize * 0.15}
        r={flowerSize * 0.3}
        fill="var(--color-flower-center)"
        stroke={isHovered ? "var(--color-selection)" : "var(--color-flower-center-dark)"}
        strokeWidth={isHovered ? 0.8 : 0.5}
      />
    </g>
  );
}
