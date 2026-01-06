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
  Pathway,
  Vec2,
  addVec2,
  DriftingPiece,
  CarriedSubtree,
} from "../model";
import { Msg } from "../update";
import { ClusterGlyphRenderer } from "./ClusterGlyph";
import { IslandRenderer } from "./Island";
import { RockRenderer } from "./Rock";
import { PlantRenderer } from "./Plant";
import { ParticleRenderer } from "./Particle";
import { PathwayLayer } from "./Pathway";
import "./Garden.css";

// === Helpers ===

/** Compute island world position from cluster */
function getIslandWorldPos(island: Island, clusters: Map<string, Cluster>): Vec2 {
  const cluster = clusters.get(island.clusterId);
  if (!cluster) return island.localPos;
  return addVec2(cluster.pos, island.localPos);
}

/** Compute cluster distance from origin for fog effect */
function getClusterDistance(cluster: Cluster): number {
  return Math.sqrt(cluster.pos.x ** 2 + cluster.pos.y ** 2);
}

/** Compute fog opacity based on distance (0 = clear, 1 = invisible) */
function getFogOpacity(distance: number): number {
  const fogStart = 200;
  const fogEnd = 1200;
  if (distance <= fogStart) return 0;
  if (distance >= fogEnd) return 0.85;
  return ((distance - fogStart) / (fogEnd - fogStart)) * 0.85;
}

// === Types ===

type GardenProps = {
  world: World;
  dispatch: (msg: Msg) => void;
};

type ClusterRenderData = {
  cluster: Cluster;
  distance: number;
  fogOpacity: number;
  isDistant: boolean;
  islands: Island[];
  rocks: Rock[];
  plants: Plant[];
};

// === Main Component ===

export const Garden = memo(function Garden({ world, dispatch }: GardenProps): JSX.Element {
  const {
    camera,
    clusters,
    pathways,
    entities,
    plants,
    hover,
    selection,
    debug,
    carriedSubtree,
    cursorWorldPos,
    driftingPieces,
  } = world;

  // Group entities by cluster for fog rendering
  const clusterData = useMemo((): ClusterRenderData[] => {
    // Sort clusters by distance (render far ones first, near ones on top)
    const sortedClusters = Array.from(clusters.values()).sort(
      (a: Cluster, b: Cluster) => getClusterDistance(b) - getClusterDistance(a)
    );

    return sortedClusters.map((cluster: Cluster): ClusterRenderData => {
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
          const island = entities.get(entity.islandId) as Island | undefined;
          if (island && island.clusterId === cluster.id) {
            clusterRocks.push(entity);
          }
        }
      }

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
  const particles = useMemo((): Particle[] => {
    const result: Particle[] = [];
    for (const entity of entities.values()) {
      if (entity.kind === "particle") {
        result.push(entity);
      }
    }
    return result;
  }, [entities]);

  // Collect all pathways for constellation rendering
  const pathwayList = useMemo((): Pathway[] => Array.from(pathways.values()), [pathways]);

  const transform = `translate(${camera.pan.x}, ${camera.pan.y}) scale(${camera.zoom})`;

  return (
    <svg
      className="garden-svg"
      viewBox={`${-window.innerWidth / 2} ${-window.innerHeight / 2} ${window.innerWidth} ${window.innerHeight}`}
    >
      <defs>
        <SvgFilters />
      </defs>

      <g transform={transform}>
        {/* Render pathways first (behind everything) */}
        <PathwayLayer
          pathways={pathwayList}
          clusters={clusters}
          zoom={camera.zoom}
          hoveredPathwayId={world.hoveredPathway}
          dispatch={dispatch}
        />

        {/* Render clusters from far to near (painters algorithm) */}
        {clusterData.map(
          ({
            cluster,
            fogOpacity,
            isDistant,
            islands,
            rocks,
            plants: clusterPlants,
          }: ClusterRenderData) => (
            <g
              key={cluster.id}
              className={isDistant ? "distant-cluster" : "main-cluster"}
              style={{
                opacity: 1 - fogOpacity,
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
                const island = entities.get(rock.islandId) as Island | undefined;
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
                const island = entities.get(plant.islandId) as Island | undefined;
                if (!island) return null;
                const islandWorldPos = getIslandWorldPos(island, clusters);

                const nodes = Array.from(plant.adjacency.keys())
                  .map((id: string) => entities.get(id) as PlantNode | undefined)
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
          <ParticleRenderer key={particle.id} particle={particle} showId={debug.showIds} />
        ))}

        {/* Drifting pieces (released subtrees fading out) */}
        {driftingPieces.map((piece: DriftingPiece) => (
          <DriftingPieceRenderer key={piece.id} piece={piece} />
        ))}

        {/* Carried subtree (following cursor) */}
        {carriedSubtree && (
          <CarriedSubtreeRenderer subtree={carriedSubtree} cursorPos={cursorWorldPos} />
        )}
      </g>
    </svg>
  );
});

// === Carried Subtree Renderer ===

type CarriedSubtreeRendererProps = {
  subtree: CarriedSubtree;
  cursorPos: Vec2;
};

function CarriedSubtreeRenderer({ subtree, cursorPos }: CarriedSubtreeRendererProps): JSX.Element {
  // Find the root node to calculate offset
  const rootNode = subtree.nodes.find((n: PlantNode): boolean => n.id === subtree.rootId);
  if (!rootNode) return <g />;

  // Render subtree at cursor position, offset so root is at cursor
  const nodeMap = new Map(subtree.nodes.map((n: PlantNode): [string, PlantNode] => [n.id, n]));

  return (
    <g
      className="carried-subtree"
      style={{
        opacity: 0.7,
        filter: "saturate(0.5)",
        pointerEvents: "none",
      }}
    >
      {/* Stems */}
      {Array.from(subtree.adjacency.entries()).map(([parentId, childIds]: [string, string[]]) => {
        const parent = nodeMap.get(parentId);
        if (!parent) return null;

        return childIds.map((childId: string) => {
          const child = nodeMap.get(childId);
          if (!child) return null;

          // Position relative to cursor (root at cursor)
          const p1 = addVec2(cursorPos, {
            x: parent.localPos.x - rootNode.localPos.x,
            y: parent.localPos.y - rootNode.localPos.y,
          });
          const p2 = addVec2(cursorPos, {
            x: child.localPos.x - rootNode.localPos.x,
            y: child.localPos.y - rootNode.localPos.y,
          });

          const midX = (p1.x + p2.x) / 2 + (p2.y - p1.y) * 0.12;
          const midY = (p1.y + p2.y) / 2 - (p2.x - p1.x) * 0.12;

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
            />
          );
        });
      })}

      {/* Nodes */}
      {subtree.nodes.map((node: PlantNode) => {
        const pos = addVec2(cursorPos, {
          x: node.localPos.x - rootNode.localPos.x,
          y: node.localPos.y - rootNode.localPos.y,
        });

        return (
          <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
            {node.nodeKind === "bud" && (
              <circle
                r={6}
                fill="var(--color-bud)"
                stroke="var(--color-bud-dark)"
                strokeWidth={0.5}
              />
            )}
            {node.nodeKind === "stem" && (
              <circle
                r={3}
                fill="var(--color-stem)"
                stroke="var(--color-stem-dark)"
                strokeWidth={0.5}
              />
            )}
            {node.nodeKind === "leaf" && (
              <ellipse
                rx={4}
                ry={8}
                fill="var(--color-leaf)"
                stroke="var(--color-leaf-dark)"
                strokeWidth={0.3}
                transform={`rotate(${(node.angle * 180) / Math.PI + 90})`}
              />
            )}
            {node.nodeKind === "flower" && (
              <circle
                r={5}
                fill="var(--color-flower-petal)"
                stroke="var(--color-flower-petal-dark)"
                strokeWidth={0.3}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

// === Drifting Piece Renderer ===

type DriftingPieceRendererProps = {
  piece: DriftingPiece;
};

function DriftingPieceRenderer({ piece }: DriftingPieceRendererProps): JSX.Element {
  const { node, pos, opacity } = piece;

  return (
    <g
      transform={`translate(${pos.x}, ${pos.y})`}
      style={{
        opacity,
        filter: "saturate(0.3)",
        pointerEvents: "none",
      }}
    >
      {node.nodeKind === "bud" && (
        <circle r={6} fill="var(--color-bud)" stroke="var(--color-bud-dark)" strokeWidth={0.5} />
      )}
      {node.nodeKind === "stem" && (
        <circle r={3} fill="var(--color-stem)" stroke="var(--color-stem-dark)" strokeWidth={0.5} />
      )}
      {node.nodeKind === "leaf" && (
        <ellipse
          rx={4}
          ry={8}
          fill="var(--color-leaf)"
          stroke="var(--color-leaf-dark)"
          strokeWidth={0.3}
          transform={`rotate(${(node.angle * 180) / Math.PI + 90})`}
        />
      )}
      {node.nodeKind === "flower" && (
        <circle
          r={5}
          fill="var(--color-flower-petal)"
          stroke="var(--color-flower-petal-dark)"
          strokeWidth={0.3}
        />
      )}
    </g>
  );
}

// === SVG Filter Definitions ===

function SvgFilters(): JSX.Element {
  return (
    <>
      {/* Subtle blur for soft shadows */}
      <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
        <feOffset in="blur" dx="0" dy="3" result="offsetBlur" />
        <feFlood floodColor="#3a3a3a" floodOpacity="0.15" result="color" />
        <feComposite in="color" in2="offsetBlur" operator="in" result="shadow" />
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

      {/* Flower glow */}
      <filter id="flower-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Firefly glow */}
      <filter id="firefly-glow" x="-200%" y="-200%" width="500%" height="500%">
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

      {/* Pathway glow — ethereal constellation lines */}
      <filter id="pathway-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </>
  );
}
