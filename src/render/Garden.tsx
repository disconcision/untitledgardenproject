/**
 * Hanging Garden — SVG World Layer
 *
 * Minimal, subtle rendering. Rocks as primary anchors.
 * CSS animations for ambient motion (not React state).
 */

import { useMemo, memo } from "react";
import {
  World,
  Cluster,
  Island,
  Rock,
  PlantNode,
  Plant,
  Particle,
  Vec2,
  addVec2,
} from "../model";
import { Msg } from "../update";
import { blobPath, leafPath } from "./paths";
import "./Garden.css";

// Helper: compute island world position from cluster
function getIslandWorldPos(
  island: Island,
  clusters: Map<string, Cluster>
): Vec2 {
  const cluster = clusters.get(island.clusterId);
  if (!cluster) return island.localPos;
  return addVec2(cluster.pos, island.localPos);
}

// Helper: compute cluster distance from origin for fog effect
function getClusterDistance(cluster: Cluster): number {
  return Math.sqrt(cluster.pos.x ** 2 + cluster.pos.y ** 2);
}

// Helper: compute fog opacity based on distance (0 = clear, 1 = invisible)
function getFogOpacity(distance: number): number {
  // Main cluster (distance ~0) = fully visible
  // Distant clusters (distance 600+) = progressively faded
  const fogStart = 200; // Start fading at this distance
  const fogEnd = 1200; // Almost invisible at this distance
  if (distance <= fogStart) return 0;
  if (distance >= fogEnd) return 0.85;
  return ((distance - fogStart) / (fogEnd - fogStart)) * 0.85;
}

type GardenProps = {
  world: World;
  dispatch: (msg: Msg) => void;
};

export const Garden = memo(function Garden({ world, dispatch }: GardenProps) {
  const { camera, clusters, entities, plants, hover, selection, debug } = world;

  // Group entities by cluster for fog rendering
  const clusterData = useMemo(() => {
    // Sort clusters by distance (render far ones first, near ones on top)
    const sortedClusters = Array.from(clusters.values()).sort(
      (a: Cluster, b: Cluster) => getClusterDistance(b) - getClusterDistance(a)
    );

    return sortedClusters.map((cluster: Cluster) => {
      const distance = getClusterDistance(cluster);
      const fogOpacity = getFogOpacity(distance);
      const isDistant = distance > 200;

      // Get islands for this cluster
      const clusterIslands: Island[] = [];
      const clusterRocks: Rock[] = [];

      for (const entity of entities.values()) {
        if (entity.kind === "island" && entity.clusterId === cluster.id) {
          clusterIslands.push(entity);
        } else if (entity.kind === "rock") {
          // Check if rock's island belongs to this cluster
          const island = entities.get(entity.islandId) as Island | undefined;
          if (island && island.clusterId === cluster.id) {
            clusterRocks.push(entity);
          }
        }
      }

      // Sort islands by depth
      clusterIslands.sort((a: Island, b: Island): number => b.depth - a.depth);

      // Get plants for this cluster
      const clusterPlants: Plant[] = [];
      for (const plant of plants.values()) {
        const island = entities.get(plant.islandId) as Island | undefined;
        if (island && island.clusterId === cluster.id) {
          clusterPlants.push(plant);
        }
      }

      return {
        cluster,
        distance,
        fogOpacity,
        isDistant,
        islands: clusterIslands,
        rocks: clusterRocks,
        plants: clusterPlants,
      };
    });
  }, [clusters, entities, plants]);

  // Collect all particles (rendered globally, not per-cluster)
  const particles = useMemo(() => {
    const result: Particle[] = [];
    for (const entity of entities.values()) {
      if (entity.kind === "particle") {
        result.push(entity);
      }
    }
    return result;
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

        {/* Glyph glow */}
        <filter id="glyph-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Firefly glow */}
        <filter
          id="firefly-glow"
          x="-200%"
          y="-200%"
          width="500%"
          height="500%"
        >
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0.2
                    0 1 0 0 0.4
                    0 0 0.3 0 0
                    0 0 0 2 0"
            result="coloredBlur"
          />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Seed shimmer */}
        <filter id="seed-shimmer" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform={transform}>
        {/* Render clusters from far to near (painters algorithm) */}
        {clusterData.map(
          ({
            cluster,
            fogOpacity,
            isDistant,
            islands,
            rocks,
            plants: clusterPlants,
          }) => (
            <g
              key={cluster.id}
              className={isDistant ? "distant-cluster" : "main-cluster"}
              style={{
                opacity: 1 - fogOpacity,
                // Distant clusters get slight blur via CSS
                filter: isDistant ? `blur(${fogOpacity * 2}px)` : undefined,
              }}
            >
              {/* Cluster glyph */}
              <ClusterGlyphRenderer
                cluster={cluster}
                showId={debug.showIds}
                isDistant={isDistant}
                isHovered={hover === cluster.id}
                dispatch={isDistant ? undefined : dispatch}
              />

              {/* Islands */}
              {islands.map((island: Island) => {
                const worldPos = getIslandWorldPos(island, clusters);
                return (
                  <IslandRenderer
                    key={island.id}
                    island={island}
                    worldPos={worldPos}
                    isHovered={hover === island.id}
                    isSelected={selection === island.id}
                    showId={debug.showIds}
                    showHitTarget={debug.showHitTargets}
                    dispatch={isDistant ? undefined : dispatch}
                  />
                );
              })}

              {/* Rocks */}
              {rocks.map((rock: Rock) => {
                const island = entities.get(rock.islandId) as
                  | Island
                  | undefined;
                if (!island) return null;
                const islandWorldPos = getIslandWorldPos(island, clusters);
                return (
                  <RockRenderer
                    key={rock.id}
                    rock={rock}
                    islandPos={islandWorldPos}
                    isHovered={hover === rock.id}
                    showId={debug.showIds}
                    showHitTarget={debug.showHitTargets}
                    dispatch={isDistant ? undefined : dispatch}
                  />
                );
              })}

              {/* Plants */}
              {clusterPlants.map((plant: Plant) => {
                const island = entities.get(plant.islandId) as
                  | Island
                  | undefined;
                if (!island) return null;
                const islandWorldPos = getIslandWorldPos(island, clusters);

                const nodes = Array.from(plant.adjacency.keys())
                  .map(
                    (id: string) => entities.get(id) as PlantNode | undefined
                  )
                  .filter((n): n is PlantNode => n !== undefined);

                return (
                  <PlantRenderer
                    key={plant.id}
                    plant={plant}
                    nodes={nodes}
                    islandPos={islandWorldPos}
                    hover={hover}
                    showIds={debug.showIds}
                    showHitTargets={debug.showHitTargets}
                    dispatch={isDistant ? undefined : dispatch}
                  />
                );
              })}
            </g>
          )
        )}

        {/* Particles (rendered globally, not per-cluster) */}
        {particles.map((particle: Particle) => (
          <ParticleRenderer
            key={particle.id}
            particle={particle}
            showId={debug.showIds}
          />
        ))}
      </g>
    </svg>
  );
});

// === Cluster Glyph Renderer ===
// Central visual anchor for each cluster

type ClusterGlyphRendererProps = {
  cluster: Cluster;
  showId: boolean;
  isDistant: boolean;
  isHovered: boolean;
  dispatch?: (msg: Msg) => void;
};

const ClusterGlyphRenderer = memo(function ClusterGlyphRenderer({
  cluster,
  showId,
  isDistant,
  isHovered,
  dispatch,
}: ClusterGlyphRendererProps) {
  const { pos, glyphKind, rotation } = cluster;

  // Distant glyphs are slightly larger to remain visible through fog
  const scale = isDistant ? 1.5 : 1;

  // Different glyph shapes
  const renderGlyph = () => {
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
            <circle
              cx={0}
              cy={0}
              r={2}
              fill="var(--color-rock-dark)"
              opacity={0.5}
            />
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
            <circle
              cx={0}
              cy={0}
              r={3}
              fill="var(--color-green-deepForest)"
              opacity={0.4}
            />
          </g>
        );
    }
  };

  return (
    <g
      transform={`translate(${pos.x}, ${pos.y}) scale(${scale})`}
      className={`cluster-glyph ${isHovered ? "hovered" : ""}`}
      filter="url(#glyph-glow)"
      data-entity-id={cluster.id}
      onPointerEnter={
        dispatch ? () => dispatch({ type: "hover", id: cluster.id }) : undefined
      }
      onPointerLeave={
        dispatch ? () => dispatch({ type: "hover", id: null }) : undefined
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

// === Island Renderer ===
// Smaller, more subtle soil patches

type IslandRendererProps = {
  island: Island;
  worldPos: Vec2; // Computed from cluster.pos + island.localPos
  isHovered: boolean;
  isSelected: boolean;
  showId: boolean;
  showHitTarget: boolean;
  dispatch?: (msg: Msg) => void; // Optional for distant clusters
};

const IslandRenderer = memo(function IslandRenderer({
  island,
  worldPos,
  isHovered,
  isSelected,
  showId,
  showHitTarget,
  dispatch,
}: IslandRendererProps) {
  const pathData = blobPath(island.shape);

  // CSS animation delay based on position for variety
  const animDelay = `${(worldPos.x * 0.001 + worldPos.y * 0.002) % 1}s`;

  return (
    <g
      className="island-group"
      style={{ "--anim-delay": animDelay } as React.CSSProperties}
      transform={`translate(${worldPos.x}, ${worldPos.y})`}
      data-entity-id={island.id}
      onPointerEnter={
        dispatch ? () => dispatch({ type: "hover", id: island.id }) : undefined
      }
      onPointerLeave={
        dispatch ? () => dispatch({ type: "hover", id: null }) : undefined
      }
      onDoubleClick={
        dispatch
          ? () =>
              dispatch({ type: "camera/focus", target: worldPos, zoom: 1.5 })
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
  dispatch?: (msg: Msg) => void; // Optional for distant clusters
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
      onPointerEnter={
        dispatch ? () => dispatch({ type: "hover", id: rock.id }) : undefined
      }
      onPointerLeave={
        dispatch ? () => dispatch({ type: "hover", id: null }) : undefined
      }
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
        <text
          x={0}
          y={-hitRadius - 4}
          textAnchor="middle"
          className="debug-label"
        >
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
  dispatch?: (msg: Msg) => void; // Optional for distant clusters
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
  dispatch?: (msg: Msg) => void; // Optional for distant clusters
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
  // All plant nodes are interactive (for context menu)
  const isInteractive = dispatch !== undefined;
  // Primary click only for buds
  const hasPrimaryAction = dispatch && node.nodeKind === "bud" && isCharged;

  const handleClick = () => {
    if (!dispatch) return;
    // Primary action: only charged buds sprout on left-click
    if (node.nodeKind === "bud" && isCharged) {
      dispatch({ type: "sprout", budId: node.id });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!dispatch) return;
    e.preventDefault();
    e.stopPropagation();

    // Get screen position for the menu
    const screenPos = { x: e.clientX, y: e.clientY };

    dispatch({
      type: "contextMenu/open",
      nodeId: node.id,
      screenPos,
      worldPos,
    });
  };

  // Hit target sizing - buds need larger targets, stems smaller
  // Leaves use their actual shape as the hit target (no invisible overlay)
  const hitRadius = node.nodeKind === "bud" ? 14 : 8;

  return (
    <g
      className={`plant-node ${isInteractive ? "interactive" : ""} ${
        hasPrimaryAction ? "has-action" : ""
      }`}
      transform={`translate(${worldPos.x}, ${worldPos.y})`}
      data-entity-id={node.id}
      onPointerEnter={
        dispatch ? () => dispatch({ type: "hover", id: node.id }) : undefined
      }
      onPointerLeave={
        dispatch ? () => dispatch({ type: "hover", id: null }) : undefined
      }
      onClick={hasPrimaryAction ? handleClick : undefined}
      onContextMenu={isInteractive ? handleContextMenu : undefined}
    >
      {/* Invisible hit target for buds and stems (not leaves - they use their shape) */}
      {isInteractive && node.nodeKind !== "leaf" && (
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
          {(isCharged || isHovered) && (
            <circle
              cx={0}
              cy={0}
              r={isHovered ? 14 : 10}
              fill={
                isHovered
                  ? "var(--color-bud-highlight)"
                  : "var(--color-bud-charged)"
              }
              opacity={isHovered ? 0.4 : 0.3}
              className="bud-glow"
            />
          )}
          <circle
            cx={0}
            cy={0}
            r={isHovered ? 8 : isCharged ? 7 : 5}
            fill={
              isHovered
                ? "var(--color-bud-highlight)"
                : isCharged
                ? "var(--color-bud-charged)"
                : "var(--color-bud)"
            }
            className={`bud ${isHovered ? "hovered" : ""}`}
          />
        </>
      )}

      {node.nodeKind === "leaf" && (
        <path
          d={leafPath(
            { x: 0, y: 0 },
            node.angle,
            isHovered ? 18 : 16,
            isHovered ? 10 : 8
          )}
          fill={isHovered ? "var(--color-leaf-highlight)" : "var(--color-leaf)"}
          stroke={isHovered ? "var(--color-green-moss)" : "none"}
          strokeWidth={isHovered ? 1 : 0}
          className={`leaf ${isHovered ? "hovered" : ""}`}
        />
      )}

      {node.nodeKind === "stem" && (
        <>
          {isHovered && (
            <circle
              cx={0}
              cy={0}
              r={8}
              fill="var(--color-stem)"
              opacity={0.3}
              className="stem-hover-glow"
            />
          )}
          <circle
            cx={0}
            cy={0}
            r={isHovered ? 5 : 3}
            fill={
              isHovered ? "var(--color-stem-highlight)" : "var(--color-stem)"
            }
            className={`stem-node ${isHovered ? "hovered" : ""}`}
          />
        </>
      )}

      {node.nodeKind === "flower" && (
        <>
          {isHovered && (
            <circle
              cx={0}
              cy={0}
              r={14}
              fill="var(--color-flower)"
              opacity={0.3}
              className="flower-hover-glow"
            />
          )}
          <circle
            cx={0}
            cy={0}
            r={isHovered ? 10 : 8}
            fill={
              isHovered
                ? "var(--color-flower-highlight)"
                : "var(--color-flower)"
            }
            className={`flower ${isHovered ? "hovered" : ""}`}
          />
        </>
      )}

      {showHitTarget && node.nodeKind !== "leaf" && (
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

// === Particle Renderer ===
// Seeds, fireflies, and other floating particles

type ParticleRendererProps = {
  particle: Particle;
  showId: boolean;
};

const ParticleRenderer = memo(function ParticleRenderer({
  particle,
  showId,
}: ParticleRendererProps) {
  const { pos, particleKind, state, glow, age, rotation } = particle;

  // Don't render particles that are rooting (becoming plants)
  if (state === "rooting") return null;

  // Landed particles are less visible
  const opacity = state === "landed" ? 0.4 : 1;

  // Age-based fade out for very old particles
  const ageFade = age > 2500 ? 1 - (age - 2500) / 500 : 1;

  if (particleKind === "seed") {
    // Seeds are small, golden/tan colored, with wispy tails
    // Use the rotation property for smooth tail rotation
    const rotationDeg = (rotation * 180) / Math.PI;

    // Dynamic tail length that breathes gently
    const tailLength = state === "floating" ? 12 + Math.sin(age * 0.1) * 4 : 0;

    // Secondary wisp for more organic look
    const secondaryLength = tailLength * 0.6;
    const secondaryAngle = 0.3; // Slight offset from main tail

    return (
      <g
        className="particle seed"
        transform={`translate(${pos.x}, ${pos.y})`}
        style={{ opacity: opacity * ageFade }}
      >
        {/* Main wispy tail (only when floating) */}
        {state === "floating" && tailLength > 0 && (
          <g transform={`rotate(${rotationDeg})`}>
            {/* Primary tail strand */}
            <path
              d={`M 0 0 Q ${-tailLength * 0.4} ${
                -tailLength * 0.2
              } ${0} ${-tailLength}`}
              stroke="var(--color-earth-tan)"
              strokeWidth={0.8}
              strokeLinecap="round"
              fill="none"
              opacity={0.7}
            />
            {/* Secondary tail strand */}
            <path
              d={`M 0 0 Q ${tailLength * 0.3} ${-secondaryLength * 0.3} ${
                Math.sin(secondaryAngle) * 3
              } ${-secondaryLength}`}
              stroke="var(--color-earth-tan)"
              strokeWidth={0.4}
              strokeLinecap="round"
              fill="none"
              opacity={0.4}
            />
          </g>
        )}

        {/* Seed body */}
        <ellipse
          cx={0}
          cy={0}
          rx={3}
          ry={2}
          fill="var(--color-earth-tan)"
          stroke="var(--color-earth-mid)"
          strokeWidth={0.4}
          transform={`rotate(${rotationDeg})`}
          filter="url(#seed-shimmer)"
        />

        {showId && (
          <text x={0} y={-8} textAnchor="middle" className="debug-label">
            {particle.id}
          </text>
        )}
      </g>
    );
  }

  if (particleKind === "firefly") {
    // Fireflies are small points that glow at night
    const glowRadius = 6 + glow * 8; // Moderate glow size
    const bodySize = 2;

    // Pulse animation
    const pulse = 1 + Math.sin(age * 0.12) * 0.15;

    // Almost invisible when landed during day
    const fireflyOpacity =
      state === "landed" && glow < 0.1 ? 0.08 : opacity * ageFade;

    return (
      <g
        className="particle firefly"
        transform={`translate(${pos.x}, ${pos.y})`}
        style={{ opacity: fireflyOpacity }}
      >
        {/* Outer glow (soft ambient) */}
        {glow > 0.1 && (
          <circle
            cx={0}
            cy={0}
            r={glowRadius * pulse * 1.5}
            fill="var(--color-firefly-glow)"
            opacity={glow * 0.3}
            filter="url(#firefly-glow)"
          />
        )}

        {/* Inner glow (brighter core) */}
        {glow > 0.1 && (
          <circle
            cx={0}
            cy={0}
            r={glowRadius * pulse * 0.6}
            fill="#ffffcc"
            opacity={glow * 0.8}
            filter="url(#firefly-glow)"
          />
        )}

        {/* Body */}
        <circle
          cx={0}
          cy={0}
          r={bodySize}
          fill={
            glow > 0.1
              ? "#e8f060" // Brighter lit color
              : "var(--color-firefly-body)"
          }
        />

        {/* Wings (only visible when flying) */}
        {state === "floating" && (
          <>
            <ellipse
              cx={-2.5}
              cy={-1}
              rx={2}
              ry={1}
              fill="var(--color-firefly-wing)"
              opacity={0.5}
              transform={`rotate(${Math.sin(age * 0.4) * 25 - 30})`}
            />
            <ellipse
              cx={2.5}
              cy={-1}
              rx={2}
              ry={1}
              fill="var(--color-firefly-wing)"
              opacity={0.5}
              transform={`rotate(${-Math.sin(age * 0.4) * 25 + 30})`}
            />
          </>
        )}

        {showId && (
          <text x={0} y={-12} textAnchor="middle" className="debug-label">
            {particle.id}
          </text>
        )}
      </g>
    );
  }

  return null;
});
