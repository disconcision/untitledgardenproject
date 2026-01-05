/**
 * Hanging Garden — SVG World Layer
 *
 * Minimal, subtle rendering. Rocks as primary anchors.
 * CSS animations for ambient motion (not React state).
 */

import { useMemo, memo } from "react";
import { World, Island, Rock, PlantNode, Plant, Vec2, addVec2 } from "../model";
import { Msg } from "../update";
import { blobPath, leafPath } from "./paths";
import "./Garden.css";

type GardenProps = {
  world: World;
  dispatch: (msg: Msg) => void;
};

export const Garden = memo(function Garden({ world, dispatch }: GardenProps) {
  const { camera, entities, plants, hover, selection, debug } = world;

  // Group entities by type
  const { islands, rocks } = useMemo(() => {
    const islands: Island[] = [];
    const rocks: Rock[] = [];

    for (const entity of entities.values()) {
      switch (entity.kind) {
        case "island":
          islands.push(entity);
          break;
        case "rock":
          rocks.push(entity);
          break;
      }
    }

    islands.sort((a: Island, b: Island): number => b.depth - a.depth);
    return { islands, rocks };
  }, [entities]);

  const transform = `translate(${camera.pan.x}, ${camera.pan.y}) scale(${camera.zoom})`;

  return (
    <svg
      className="garden-svg"
      viewBox={`${-window.innerWidth / 2} ${-window.innerHeight / 2} ${
        window.innerWidth
      } ${window.innerHeight}`}
    >
      <defs>
        {/* Subtle blur for soft shadows */}
        <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
          <feOffset in="blur" dx="0" dy="3" result="offsetBlur" />
          <feFlood floodColor="#3a3a3a" floodOpacity="0.15" result="color" />
          <feComposite
            in="color"
            in2="offsetBlur"
            operator="in"
            result="shadow"
          />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Glow for charged buds */}
        <filter id="bud-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform={transform}>
        {/* Islands - subtle, small soil patches */}
        {islands.map((island: Island) => (
          <IslandRenderer
            key={island.id}
            island={island}
            isHovered={hover === island.id}
            isSelected={selection === island.id}
            showId={debug.showIds}
            showHitTarget={debug.showHitTargets}
            dispatch={dispatch}
          />
        ))}

        {/* Rocks - the primary anchors */}
        {rocks.map((rock: Rock) => {
          const island = entities.get(rock.islandId) as Island | undefined;
          if (!island) return null;
          return (
            <RockRenderer
              key={rock.id}
              rock={rock}
              islandPos={island.pos}
              isHovered={hover === rock.id}
              showId={debug.showIds}
              showHitTarget={debug.showHitTargets}
              dispatch={dispatch}
            />
          );
        })}

        {/* Plants */}
        {Array.from(plants.values()).map((plant: Plant) => {
          const island = entities.get(plant.islandId) as Island | undefined;
          if (!island) return null;

          const nodes = Array.from(plant.adjacency.keys())
            .map((id: string) => entities.get(id) as PlantNode | undefined)
            .filter((n): n is PlantNode => n !== undefined);

          return (
            <PlantRenderer
              key={plant.id}
              plant={plant}
              nodes={nodes}
              islandPos={island.pos}
              hover={hover}
              showIds={debug.showIds}
              showHitTargets={debug.showHitTargets}
              dispatch={dispatch}
            />
          );
        })}
      </g>
    </svg>
  );
});

// === Island Renderer ===
// Smaller, more subtle soil patches

type IslandRendererProps = {
  island: Island;
  isHovered: boolean;
  isSelected: boolean;
  showId: boolean;
  showHitTarget: boolean;
  dispatch: (msg: Msg) => void;
};

const IslandRenderer = memo(function IslandRenderer({
  island,
  isHovered,
  isSelected,
  showId,
  showHitTarget,
  dispatch,
}: IslandRendererProps) {
  const pathData = blobPath(island.shape);

  // CSS animation delay based on position for variety
  const animDelay = `${(island.pos.x * 0.001 + island.pos.y * 0.002) % 1}s`;

  return (
    <g
      className="island-group"
      style={{ "--anim-delay": animDelay } as React.CSSProperties}
      transform={`translate(${island.pos.x}, ${island.pos.y})`}
      data-entity-id={island.id}
      onPointerEnter={() => dispatch({ type: "hover", id: island.id })}
      onPointerLeave={() => dispatch({ type: "hover", id: null })}
      onDoubleClick={() =>
        dispatch({ type: "camera/focus", target: island.pos, zoom: 1.5 })
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
        <text
          x={0}
          y={-island.radius - 8}
          textAnchor="middle"
          className="debug-label"
        >
          {island.id}
        </text>
      )}
    </g>
  );
});

// === Rock Renderer ===
// More angular, interesting shapes. Primary visual anchor.

type RockRendererProps = {
  rock: Rock;
  islandPos: Vec2;
  isHovered: boolean;
  showId: boolean;
  showHitTarget: boolean;
  dispatch: (msg: Msg) => void;
};

// Generate boulder polygon points
function boulderPoints(
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

const RockRenderer = memo(function RockRenderer({
  rock,
  islandPos,
  isHovered,
  showId,
  showHitTarget,
  dispatch,
}: RockRendererProps) {
  const worldPos = addVec2(islandPos, rock.localPos);

  // Find the largest boulder for hit target sizing
  const mainBoulder = rock.boulders[0];
  const hitRadius = mainBoulder ? mainBoulder.size * 1.2 : 30;

  return (
    <g
      className="rock-group"
      transform={`translate(${worldPos.x}, ${worldPos.y})`}
      data-entity-id={rock.id}
      onPointerEnter={() => dispatch({ type: "hover", id: rock.id })}
      onPointerLeave={() => dispatch({ type: "hover", id: null })}
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
          <g
            key={idx}
            transform={`translate(${boulder.localPos.x}, ${boulder.localPos.y})`}
          >
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
              fill={
                isHovered
                  ? "var(--color-rock-light)"
                  : idx === 0
                    ? "var(--color-rock-mid)"
                    : "var(--color-rock-dark)"
              }
              stroke="var(--color-rock-darkest)"
              strokeWidth={0.3}
              strokeLinejoin="round"
              className="rock-shape"
            />

            {/* Subtle highlight on top edge */}
            <polygon
              points={points}
              fill="none"
              stroke="var(--color-rock-pale)"
              strokeWidth={0.5}
              strokeDasharray={`${boulder.size * 0.3} ${boulder.size * 1.5}`}
              strokeDashoffset={boulder.rotation * 10}
              opacity={0.3}
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
          strokeDasharray="2 2"
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

// === Plant Renderer ===

type PlantRendererProps = {
  plant: Plant;
  nodes: PlantNode[];
  islandPos: Vec2;
  hover: string | null;
  showIds: boolean;
  showHitTargets: boolean;
  dispatch: (msg: Msg) => void;
};

const PlantRenderer = memo(function PlantRenderer({
  plant,
  nodes,
  islandPos,
  hover,
  showIds,
  showHitTargets,
  dispatch,
}: PlantRendererProps) {
  const nodeMap = new Map(
    nodes.map((n: PlantNode): [string, PlantNode] => [n.id, n])
  );

  return (
    <g className="plant-group">
      {/* Stems with bark-like thickness gradient */}
      {Array.from(plant.adjacency.entries()).map(
        ([parentId, childIds]: [string, string[]]) => {
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
        }
      )}

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
// Larger hit targets, clearer visual feedback

type PlantNodeRendererProps = {
  node: PlantNode;
  islandPos: Vec2;
  isHovered: boolean;
  showId: boolean;
  showHitTarget: boolean;
  dispatch: (msg: Msg) => void;
};

const PlantNodeRenderer = memo(function PlantNodeRenderer({
  node,
  islandPos,
  isHovered,
  showId,
  showHitTarget,
  dispatch,
}: PlantNodeRendererProps) {
  const worldPos = addVec2(islandPos, node.localPos);
  const isCharged = node.nodeKind === "bud" && (node.charge ?? 0) >= 0.8;
  const isInteractive = node.nodeKind === "bud" || node.nodeKind === "leaf";

  const handleClick = () => {
    if (node.nodeKind === "bud") {
      dispatch({ type: "sprout", budId: node.id });
    } else if (node.nodeKind === "leaf") {
      dispatch({ type: "prune", nodeId: node.id });
    }
  };

  // Hit target radius - generous for clickability
  const hitRadius =
    node.nodeKind === "bud" ? 14 : node.nodeKind === "leaf" ? 16 : 8;

  return (
    <g
      className={`plant-node ${isInteractive ? "interactive" : ""}`}
      transform={`translate(${worldPos.x}, ${worldPos.y})`}
      data-entity-id={node.id}
      onPointerEnter={() => dispatch({ type: "hover", id: node.id })}
      onPointerLeave={() => dispatch({ type: "hover", id: null })}
      onClick={isInteractive ? handleClick : undefined}
    >
      {/* Invisible hit target - always present for interactive nodes */}
      {isInteractive && (
        <circle
          cx={0}
          cy={0}
          r={hitRadius}
          fill="transparent"
          className="hit-target"
        />
      )}

      {node.nodeKind === "bud" && (
        <>
          {isCharged && (
            <circle
              cx={0}
              cy={0}
              r={10}
              fill="var(--color-bud-charged)"
              opacity={0.3}
              className="bud-glow"
            />
          )}
          <circle
            cx={0}
            cy={0}
            r={isCharged ? 7 : 5}
            fill={isCharged ? "var(--color-bud-charged)" : "var(--color-bud)"}
            className={`bud ${isHovered ? "hovered" : ""}`}
          />
        </>
      )}

      {node.nodeKind === "leaf" && (
        <path
          d={leafPath({ x: 0, y: 0 }, node.angle, 16, 8)}
          fill={isHovered ? "var(--color-leaf-highlight)" : "var(--color-leaf)"}
          className={`leaf ${isHovered ? "hovered" : ""}`}
        />
      )}

      {node.nodeKind === "stem" && (
        <circle cx={0} cy={0} r={3} fill="var(--color-stem)" />
      )}

      {node.nodeKind === "flower" && (
        <circle
          cx={0}
          cy={0}
          r={8}
          fill="var(--color-flower)"
          className={isHovered ? "hovered" : ""}
        />
      )}

      {showHitTarget && (
        <circle
          cx={0}
          cy={0}
          r={hitRadius}
          fill="none"
          stroke="blue"
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={0.6}
        />
      )}

      {showId && (
        <text
          x={0}
          y={-hitRadius - 4}
          textAnchor="middle"
          className="debug-label"
        >
          {node.id}
        </text>
      )}
    </g>
  );
});
