/**
 * Hanging Garden — SVG World Layer
 *
 * Minimal, subtle rendering. Rocks as primary anchors.
 * CSS animations for ambient motion (not React state).
 */

import { useMemo, memo } from "react";
import { World, Cluster, Island, Rock, PlantNode, Plant, Particle, Vec2, addVec2 } from "../model";
import { Msg } from "../update";
import { ClusterGlyphRenderer } from "./ClusterGlyph";
import { IslandRenderer } from "./Island";
import { RockRenderer } from "./Rock";
import { PlantRenderer } from "./Plant";
import { ParticleRenderer } from "./Particle";
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
  const { camera, clusters, entities, plants, hover, selection, debug } = world;

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
      </g>
    </svg>
  );
});

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
    </>
  );
}
