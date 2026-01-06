/**
 * World Inspector — Collapsible tree view of the world structure
 *
 * Shows the hierarchical structure:
 *   World → Clusters → Islands → Rocks/Plants → PlantNodes
 *
 * Features:
 * - Collapsible tree nodes
 * - Bidirectional selection sync (click tree node → selects in world)
 * - Hover highlighting synced with world
 *
 * This is the first step toward a "projective UI" where any subtree
 * can be viewed as either outliner or rendered representation.
 */

import { useState, useCallback, memo, useEffect, useMemo, useRef } from "react";
import { TreeDeciduous, X, Mountain, Gem, Stars } from "lucide-react";
import {
  World,
  Cluster,
  Plant,
  Id,
  Island,
  Rock,
  PlantNode,
  Vec2,
  addVec2,
  subVec2,
  lenVec2,
  Particle,
  Constellation,
  assertNever,
} from "../core/model";
import { Msg } from "../update";
import {
  TreeNode,
  PlantNodeTree,
  getClusterGlyph,
  getParticleIcon,
} from "./InspectorTreeNodes";
import "./WorldInspector.css";

// Helper: compute entity world position from ID
function getEntityWorldPos(id: Id, world: World): Vec2 | null {
  const entity = world.entities.get(id);
  if (!entity) {
    // Check if it's a constellation
    const constellation = world.constellations.get(id);
    if (constellation) return constellation.pos;
    // Check if it's a cluster
    const cluster = world.clusters.get(id);
    if (cluster) return cluster.pos;
    // Check if it's a plant (use root node position)
    const plant = world.plants.get(id);
    if (plant) {
      const rootNode = world.entities.get(plant.rootId) as PlantNode | undefined;
      if (rootNode) {
        const island = world.entities.get(plant.islandId) as Island | undefined;
        if (island) {
          const cluster = world.clusters.get(island.clusterId);
          if (cluster) {
            const islandWorldPos = addVec2(cluster.pos, island.localPos);
            return addVec2(islandWorldPos, rootNode.localPos);
          }
        }
      }
    }
    return null;
  }

  switch (entity.kind) {
    case "island": {
      const cluster = world.clusters.get(entity.clusterId);
      if (!cluster) return entity.localPos;
      return addVec2(cluster.pos, entity.localPos);
    }
    case "rock": {
      const island = world.entities.get(entity.islandId) as Island | undefined;
      if (!island) return entity.localPos;
      const cluster = world.clusters.get(island.clusterId);
      if (!cluster) return addVec2(island.localPos, entity.localPos);
      const islandWorldPos = addVec2(cluster.pos, island.localPos);
      return addVec2(islandWorldPos, entity.localPos);
    }
    case "plantNode": {
      const plant = world.plants.get(entity.plantId);
      if (!plant) return entity.localPos;
      const island = world.entities.get(plant.islandId) as Island | undefined;
      if (!island) return entity.localPos;
      const cluster = world.clusters.get(island.clusterId);
      if (!cluster) return addVec2(island.localPos, entity.localPos);
      const islandWorldPos = addVec2(cluster.pos, island.localPos);
      return addVec2(islandWorldPos, entity.localPos);
    }
    case "vine":
      // For vines, use the from node position
      return getEntityWorldPos(entity.fromId, world);
    case "particle":
      // Particles have world position directly
      return entity.pos;
    default:
      assertNever(entity, `Unknown entity kind in getEntityWorldPos`);
  }
}

// Estimate appropriate zoom level based on entity type
function getEntityZoom(id: Id, world: World): number {
  const entity = world.entities.get(id);
  if (!entity) {
    // Constellations should zoom way out, clusters zoom out, plants zoom in a bit
    if (world.constellations.has(id)) return 0.4;
    if (world.clusters.has(id)) return 0.8;
    if (world.plants.has(id)) return 1.2;
    return 1;
  }

  switch (entity.kind) {
    case "island":
      return 1.0;
    case "rock":
      return 1.3;
    case "plantNode":
      return 1.5;
    case "vine":
      return 1.4;
    case "particle":
      return 1.5;
    default:
      assertNever(entity, `Unknown entity kind in getEntityZoom`);
  }
}

const ICON_SIZE = 16;
const GLYPH_SIZE = 11; // Keep for Stars icon in constellation rendering

/**
 * Get the ancestor path (IDs) for an entity, from root to parent.
 * Used to auto-expand tree nodes when selecting in the world view.
 * Returns: [constellationId, clusterId, islandId?, plantId?, ...parentNodeIds]
 */
function getEntityAncestorPath(id: Id, world: World): Id[] {
  const path: Id[] = [];

  // Check if it's a constellation (root level, no ancestors)
  if (world.constellations.has(id)) {
    return [];
  }

  // Check if it's a cluster
  const cluster = world.clusters.get(id);
  if (cluster) {
    path.push(cluster.constellationId);
    return path;
  }

  // Check if it's a plant
  const plant = world.plants.get(id);
  if (plant) {
    const island = world.entities.get(plant.islandId) as Island | undefined;
    if (island) {
      const clstr = world.clusters.get(island.clusterId);
      if (clstr) {
        path.push(clstr.constellationId, clstr.id, island.id);
        return path;
      }
    }
    return path;
  }

  // Check entity types
  const entity = world.entities.get(id);
  if (!entity) return path;

  switch (entity.kind) {
    case "island": {
      const clstr = world.clusters.get(entity.clusterId);
      if (clstr) {
        path.push(clstr.constellationId, clstr.id);
      }
      break;
    }
    case "rock": {
      const island = world.entities.get(entity.islandId) as Island | undefined;
      if (island) {
        const clstr = world.clusters.get(island.clusterId);
        if (clstr) {
          path.push(clstr.constellationId, clstr.id, island.id);
        }
      }
      break;
    }
    case "plantNode": {
      const plt = world.plants.get(entity.plantId);
      if (plt) {
        const island = world.entities.get(plt.islandId) as Island | undefined;
        if (island) {
          const clstr = world.clusters.get(island.clusterId);
          if (clstr) {
            path.push(clstr.constellationId, clstr.id, island.id, plt.id);
            // Walk up the plant adjacency to find parent nodes
            const parentPath = getPlantNodeParentPath(entity.id, plt);
            path.push(...parentPath);
          }
        }
      }
      break;
    }
    case "particle": {
      // For particles, find nearest cluster
      let nearestCluster: Cluster | undefined;
      let nearestDist = Infinity;
      for (const clstr of world.clusters.values()) {
        const dist = lenVec2(subVec2(entity.pos, clstr.pos));
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestCluster = clstr;
        }
      }
      if (nearestCluster) {
        path.push(nearestCluster.constellationId, nearestCluster.id);
        // If landed, add the entity it's on
        if (entity.landedOn) {
          const landedEntity = world.entities.get(entity.landedOn);
          if (landedEntity?.kind === "island") {
            path.push(entity.landedOn);
          } else if (landedEntity?.kind === "rock") {
            const rockIsland = world.entities.get(landedEntity.islandId) as Island | undefined;
            if (rockIsland) {
              path.push(rockIsland.id, entity.landedOn);
            }
          }
        }
      }
      break;
    }
    case "vine":
      // Vines aren't in tree, but get path from fromId
      return getEntityAncestorPath(entity.fromId, world);
    default:
      assertNever(entity, `Unknown entity kind in getEntityAncestorPath`);
  }

  return path;
}

/**
 * Walk up plant adjacency to get parent node IDs (excluding the node itself)
 */
function getPlantNodeParentPath(nodeId: Id, plant: Plant): Id[] {
  const parentPath: Id[] = [];

  // Build reverse adjacency (child -> parent)
  const parentOf = new Map<Id, Id>();
  for (const [parentId, children] of plant.adjacency.entries()) {
    for (const childId of children) {
      parentOf.set(childId, parentId);
    }
  }

  // Walk up to root
  let current = parentOf.get(nodeId);
  while (current) {
    parentPath.unshift(current); // prepend (we want root first)
    current = parentOf.get(current);
  }

  return parentPath;
}

type WorldInspectorProps = {
  world: World;
  dispatch: (msg: Msg) => void;
};

// Tree structure for rendering
type WorldTree = {
  constellations: Map<Id, Constellation>;
  clustersByConstellation: Map<Id, Cluster[]>;
  clusters: Map<Id, Cluster>;
  islandsByCluster: Map<Id, Island[]>;
  rocksByIsland: Map<Id, Rock[]>;
  plantsByIsland: Map<Id, Plant[]>;
  floatingParticlesByCluster: Map<Id, Particle[]>;
  landedParticlesByEntity: Map<Id, Particle[]>;
};

// Build tree structure from world data
function useWorldTree(world: World): WorldTree {
  // Group entities by type and parent
  const islands: Island[] = [];
  const rocksByIsland = new Map<Id, Rock[]>();

  for (const entity of world.entities.values()) {
    switch (entity.kind) {
      case "island":
        islands.push(entity);
        break;
      case "rock":
        if (!rocksByIsland.has(entity.islandId)) {
          rocksByIsland.set(entity.islandId, []);
        }
        rocksByIsland.get(entity.islandId)!.push(entity);
        break;
      case "plantNode":
        // Plant nodes are accessed through Plant.adjacency, not directly here
        break;
      case "vine":
        // Vines are edge-like, not shown in tree for now
        break;
      case "particle":
        // Particles will be grouped separately (handled below)
        break;
      default:
        assertNever(entity, `Unknown entity kind in useWorldTree`);
    }
  }

  // Group islands by cluster
  const islandsByCluster = new Map<Id, Island[]>();
  for (const island of islands) {
    if (!islandsByCluster.has(island.clusterId)) {
      islandsByCluster.set(island.clusterId, []);
    }
    islandsByCluster.get(island.clusterId)!.push(island);
  }

  // Group plants by island
  const plantsByIsland = new Map<Id, Plant[]>();
  for (const plant of world.plants.values()) {
    if (!plantsByIsland.has(plant.islandId)) {
      plantsByIsland.set(plant.islandId, []);
    }
    plantsByIsland.get(plant.islandId)!.push(plant);
  }

  // Group clusters by constellation
  const clustersByConstellation = new Map<Id, Cluster[]>();
  for (const cluster of world.clusters.values()) {
    if (!clustersByConstellation.has(cluster.constellationId)) {
      clustersByConstellation.set(cluster.constellationId, []);
    }
    clustersByConstellation.get(cluster.constellationId)!.push(cluster);
  }

  // Helper: find nearest cluster to a position
  const findNearestCluster = (pos: Vec2): Id | null => {
    let nearestId: Id | null = null;
    let nearestDist = Infinity;
    for (const cluster of world.clusters.values()) {
      const dist = lenVec2(subVec2(pos, cluster.pos));
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestId = cluster.id;
      }
    }
    return nearestId;
  };

  // Group particles by their location context
  // - Floating particles: group by nearest cluster
  // - Landed particles: group by the entity they landed on
  const floatingParticlesByCluster = new Map<Id, Particle[]>();
  const landedParticlesByEntity = new Map<Id, Particle[]>();

  for (const entity of world.entities.values()) {
    if (entity.kind === "particle") {
      if (entity.state === "floating") {
        const clusterId = findNearestCluster(entity.pos);
        if (clusterId) {
          if (!floatingParticlesByCluster.has(clusterId)) {
            floatingParticlesByCluster.set(clusterId, []);
          }
          floatingParticlesByCluster.get(clusterId)!.push(entity);
        }
      } else if (entity.landedOn) {
        // Landed or rooting - group by the entity they're on
        if (!landedParticlesByEntity.has(entity.landedOn)) {
          landedParticlesByEntity.set(entity.landedOn, []);
        }
        landedParticlesByEntity.get(entity.landedOn)!.push(entity);
      }
    }
  }

  return {
    constellations: world.constellations,
    clustersByConstellation,
    clusters: world.clusters,
    islandsByCluster,
    rocksByIsland,
    plantsByIsland,
    floatingParticlesByCluster,
    landedParticlesByEntity,
  };
}

export const WorldInspector = memo(function WorldInspector({
  world,
  dispatch,
}: WorldInspectorProps) {
  const [open, setOpen] = useState(false);
  const tree = useWorldTree(world);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  // Centralized expanded state for all tree nodes
  // Initialize with all constellations and clusters expanded (computed once on mount)
  const defaultExpanded = useMemo(
    (): Set<Id> => {
      const set = new Set<Id>();
      for (const constellation of world.constellations.values()) {
        set.add(constellation.id);
      }
      for (const cluster of world.clusters.values()) {
        set.add(cluster.id);
      }
      return set;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Intentionally empty deps - only compute on mount
  );

  const [expandedNodes, setExpandedNodes] = useState<Set<Id>>(defaultExpanded);

  // Track previous selection to only auto-expand/scroll on actual changes
  const prevSelectionRef = useRef<Id | null>(null);

  // Auto-expand ancestors and scroll to selection when it changes (from world view)
  useEffect(() => {
    // Only act if selection actually changed
    if (world.selection !== prevSelectionRef.current) {
      prevSelectionRef.current = world.selection;

      if (world.selection) {
        const ancestors = getEntityAncestorPath(world.selection, world);
        if (ancestors.length > 0) {
          setExpandedNodes((prev: Set<Id>): Set<Id> => {
            const next = new Set(prev);
            for (const ancestorId of ancestors) {
              next.add(ancestorId);
            }
            return next;
          });
        }

        // Scroll to the selected element after DOM updates
        requestAnimationFrame(() => {
          const container = treeContainerRef.current;
          if (container) {
            const selectedEl = container.querySelector(`[data-node-id="${world.selection}"]`);
            if (selectedEl) {
              selectedEl.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
              });
            }
          }
        });
      }
    }
  }, [world.selection, world]);

  const handlePanelToggle = (): void => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      dispatch({ type: "panel/openInspector" });
    }
  };

  const handleNodeToggle = useCallback((id: Id, expanded: boolean): void => {
    setExpandedNodes((prev: Set<Id>): Set<Id> => {
      const next = new Set(prev);
      if (expanded) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (id: Id | null): void => {
      dispatch({ type: "select", id });
      // Also focus camera on the entity
      if (id) {
        const pos = getEntityWorldPos(id, world);
        if (pos) {
          const zoom = getEntityZoom(id, world);
          dispatch({ type: "camera/focus", target: pos, zoom });
        }
      }
    },
    [dispatch, world]
  );

  const handleHover = useCallback(
    (id: Id | null): void => {
      dispatch({ type: "hover", id });
    },
    [dispatch]
  );

  const { selection, hover } = world;

  return (
    <div
      className={`hud-corner hud-bottom-left ${world.focusedPanel === "inspector" ? "panel-focused" : ""}`}
      onClick={(): void => dispatch({ type: "panel/openInspector" })}
    >
      <div className={`hud-panel-wrapper inspector-panel ${open ? "open" : ""}`}>
        <button
          className="hud-corner-btn"
          onClick={handlePanelToggle}
          title={open ? "Close" : "World Inspector"}
        >
          {open ? <X size={ICON_SIZE} /> : <TreeDeciduous size={ICON_SIZE} />}
        </button>

        <div
          className="hud-panel-content inspector-content"
          onWheel={(e: React.WheelEvent<HTMLDivElement>): void => e.stopPropagation()}
        >
          <div className="inspector-tree" ref={treeContainerRef}>
            {Array.from(tree.constellations.values()).map((constellation: Constellation) => (
              <TreeNode
                key={constellation.id}
                id={constellation.id}
                label={constellation.id}
                icon={<Stars size={GLYPH_SIZE} />}
                depth={0}
                isSelected={selection === constellation.id}
                isHovered={hover === constellation.id}
                onSelect={handleSelect}
                onHover={handleHover}
                onToggle={handleNodeToggle}
                isExpanded={expandedNodes.has(constellation.id)}
              >
                {(tree.clustersByConstellation.get(constellation.id) || []).map(
                  (cluster: Cluster, clusterIndex: number) => {
                    const glyph = getClusterGlyph(clusterIndex);
                    const ClusterIcon = glyph.icon;
                    return (
                      <TreeNode
                        key={cluster.id}
                        id={cluster.id}
                        label={cluster.id}
                        icon={<ClusterIcon size={GLYPH_SIZE} />}
                        depth={1}
                        isSelected={selection === cluster.id}
                        isHovered={hover === cluster.id}
                        onSelect={handleSelect}
                        onHover={handleHover}
                        onToggle={handleNodeToggle}
                        isExpanded={expandedNodes.has(cluster.id)}
                      >
                        {(tree.islandsByCluster.get(cluster.id) || []).map((island: Island) => (
                          <TreeNode
                            key={island.id}
                            id={island.id}
                            label={island.id}
                            icon={<Mountain size={GLYPH_SIZE} />}
                            depth={2}
                            isSelected={selection === island.id}
                            isHovered={hover === island.id}
                            onSelect={handleSelect}
                            onHover={handleHover}
                            onToggle={handleNodeToggle}
                            isExpanded={expandedNodes.has(island.id)}
                          >
                            {/* Rocks */}
                            {(tree.rocksByIsland.get(island.id) || []).map((rock: Rock) => (
                              <TreeNode
                                key={rock.id}
                                id={rock.id}
                                label={rock.id}
                                icon={<Gem size={GLYPH_SIZE} />}
                                depth={3}
                                isSelected={selection === rock.id}
                                isHovered={hover === rock.id}
                                onSelect={handleSelect}
                                onHover={handleHover}
                                onToggle={handleNodeToggle}
                                isExpanded={expandedNodes.has(rock.id)}
                              >
                                {/* Particles landed on this rock */}
                                {(tree.landedParticlesByEntity.get(rock.id) || []).map(
                                  (particle: Particle) => (
                                    <TreeNode
                                      key={particle.id}
                                      id={particle.id}
                                      label={`${particle.particleKind} (${particle.state})`}
                                      icon={getParticleIcon(particle.particleKind)}
                                      depth={4}
                                      isSelected={selection === particle.id}
                                      isHovered={hover === particle.id}
                                      onSelect={handleSelect}
                                      onHover={handleHover}
                                      onToggle={handleNodeToggle}
                                      isExpanded={false}
                                    />
                                  )
                                )}
                              </TreeNode>
                            ))}
                            {/* Plants - render as proper tree structure */}
                            {(tree.plantsByIsland.get(island.id) || []).map((plant: Plant) => (
                              <TreeNode
                                key={plant.id}
                                id={plant.id}
                                label={plant.id}
                                icon={<TreeDeciduous size={GLYPH_SIZE} />}
                                depth={3}
                                isSelected={selection === plant.id}
                                isHovered={hover === plant.id}
                                onSelect={handleSelect}
                                onHover={handleHover}
                                onToggle={handleNodeToggle}
                                isExpanded={expandedNodes.has(plant.id)}
                              >
                                {/* Render plant nodes as a tree from root */}
                                <PlantNodeTree
                                  nodeId={plant.rootId}
                                  plant={plant}
                                  entities={world.entities}
                                  depth={4}
                                  selection={selection}
                                  hover={hover}
                                  onSelect={handleSelect}
                                  onHover={handleHover}
                                  onToggle={handleNodeToggle}
                                  expandedNodes={expandedNodes}
                                />
                              </TreeNode>
                            ))}
                            {/* Particles landed on this island (not on rocks) */}
                            {(tree.landedParticlesByEntity.get(island.id) || []).map(
                              (particle: Particle) => (
                                <TreeNode
                                  key={particle.id}
                                  id={particle.id}
                                  label={`${particle.particleKind} (${particle.state})`}
                                  icon={getParticleIcon(particle.particleKind)}
                                  depth={3}
                                  isSelected={selection === particle.id}
                                  isHovered={hover === particle.id}
                                  onSelect={handleSelect}
                                  onHover={handleHover}
                                  onToggle={handleNodeToggle}
                                  isExpanded={false}
                                />
                              )
                            )}
                          </TreeNode>
                        ))}
                        {/* Floating particles near this cluster */}
                        {(tree.floatingParticlesByCluster.get(cluster.id) || []).map(
                          (particle: Particle) => (
                            <TreeNode
                              key={particle.id}
                              id={particle.id}
                              label={`${particle.particleKind} (floating)`}
                              icon={getParticleIcon(particle.particleKind)}
                              depth={2}
                              isSelected={selection === particle.id}
                              isHovered={hover === particle.id}
                              onSelect={handleSelect}
                              onHover={handleHover}
                              onToggle={handleNodeToggle}
                              isExpanded={false}
                            />
                          )
                        )}
                      </TreeNode>
                    );
                  }
                )}
              </TreeNode>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
