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

import { useState, useCallback, memo } from "react";
import {
  TreeDeciduous,
  X,
  Hexagon,
  Star,
  Triangle,
  Sparkles,
  Mountain,
  Gem,
  Circle,
  Sprout,
  Leaf as LeafIcon,
} from "lucide-react";
import { World, Cluster, Plant, Id, Island, Rock, PlantNode, Vec2, addVec2 } from "../core/model";
import { Msg } from "../update";
import "./WorldInspector.css";

// Helper: compute entity world position from ID
function getEntityWorldPos(id: Id, world: World): Vec2 | null {
  const entity = world.entities.get(id);
  if (!entity) {
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
    default:
      return null;
  }
}

// Estimate appropriate zoom level based on entity type
function getEntityZoom(id: Id, world: World): number {
  const entity = world.entities.get(id);
  if (!entity) {
    // Clusters should zoom out, plants zoom in a bit
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
    default:
      return 1;
  }
}

const ICON_SIZE = 16;
const GLYPH_SIZE = 11;

// Cluster glyph icons - distinctive symbols for each cluster
const CLUSTER_GLYPHS = [
  { icon: Hexagon, label: "hexagon" },
  { icon: Star, label: "star" },
  { icon: Triangle, label: "triangle" },
  { icon: Sparkles, label: "sparkles" },
  { icon: Mountain, label: "mountain" },
  { icon: Gem, label: "gem" },
];

function getClusterGlyph(index: number): {
  icon: typeof Hexagon;
  label: string;
} {
  return CLUSTER_GLYPHS[index % CLUSTER_GLYPHS.length];
}

// Node kind icons for plant nodes
function getNodeKindIcon(kind: string): React.ReactNode {
  switch (kind) {
    case "bud":
      return <Circle size={GLYPH_SIZE} />;
    case "stem":
      return <Sprout size={GLYPH_SIZE} />;
    case "leaf":
      return <LeafIcon size={GLYPH_SIZE} />;
    case "flower":
      return <Sparkles size={GLYPH_SIZE} />;
    default:
      return null;
  }
}

type WorldInspectorProps = {
  world: World;
  dispatch: (msg: Msg) => void;
};

type TreeNodeProps = {
  label: string;
  id?: Id;
  kind?: string;
  icon?: React.ReactNode;
  depth: number;
  children?: React.ReactNode;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: Id | null) => void;
  onHover: (id: Id | null) => void;
  defaultExpanded?: boolean;
};

const TreeNode = memo(function TreeNode({
  label,
  id,
  kind,
  icon,
  depth,
  children,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  defaultExpanded = false,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = !!children;

  const handleClick = useCallback(
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      if (id) {
        onSelect(id);
      }
    },
    [id, onSelect]
  );

  const handleToggle = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    setExpanded((prev: boolean): boolean => !prev);
  }, []);

  const handleMouseEnter = useCallback((): void => {
    if (id) {
      onHover(id);
    }
  }, [id, onHover]);

  const handleMouseLeave = useCallback((): void => {
    onHover(null);
  }, [onHover]);

  return (
    <div className="inspector-node" style={{ "--depth": depth } as React.CSSProperties}>
      <div
        className={`inspector-node-row ${isSelected ? "selected" : ""} ${
          isHovered ? "hovered" : ""
        }`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {hasChildren ? (
          <button className="inspector-toggle" onClick={handleToggle}>
            {expanded ? "▼" : "▶"}
          </button>
        ) : (
          <span className="inspector-toggle-spacer" />
        )}
        <span className="inspector-label">
          {icon && <span className="inspector-icon">{icon}</span>}
          {kind && !icon && <span className="inspector-kind">{kind}</span>}
          {label}
        </span>
      </div>
      {expanded && hasChildren && <div className="inspector-children">{children}</div>}
    </div>
  );
});

// Build tree structure from world data
function useWorldTree(world: World) {
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

  return {
    clusters: world.clusters,
    islandsByCluster,
    rocksByIsland,
    plantsByIsland,
  };
}

// Recursive component to render plant node tree structure
type PlantNodeTreeProps = {
  nodeId: Id;
  plant: Plant;
  entities: Map<Id, import("../core/model").Entity>;
  depth: number;
  selection: Id | null;
  hover: Id | null;
  onSelect: (id: Id | null) => void;
  onHover: (id: Id | null) => void;
};

const PlantNodeTree = memo(function PlantNodeTree({
  nodeId,
  plant,
  entities,
  depth,
  selection,
  hover,
  onSelect,
  onHover,
}: PlantNodeTreeProps) {
  const node = entities.get(nodeId) as PlantNode | undefined;
  if (!node) return null;

  const children = plant.adjacency.get(nodeId) || [];

  return (
    <TreeNode
      key={node.id}
      id={node.id}
      label={`${node.nodeKind}${node.charge ? ` ⚡${node.charge.toFixed(0)}` : ""}`}
      icon={getNodeKindIcon(node.nodeKind)}
      depth={depth}
      isSelected={selection === node.id}
      isHovered={hover === node.id}
      onSelect={onSelect}
      onHover={onHover}
      defaultExpanded={depth < 4}
    >
      {children.map((childId: Id) => (
        <PlantNodeTree
          key={childId}
          nodeId={childId}
          plant={plant}
          entities={entities}
          depth={depth + 1}
          selection={selection}
          hover={hover}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </TreeNode>
  );
});

export const WorldInspector = memo(function WorldInspector({
  world,
  dispatch,
}: WorldInspectorProps) {
  const [open, setOpen] = useState(false);
  const tree = useWorldTree(world);

  const handleToggle = (): void => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      dispatch({ type: "panel/openInspector" });
    }
  };

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
      className="hud-corner hud-bottom-left"
      style={{ zIndex: world.focusedPanel === "inspector" ? 101 : 100 }}
    >
      <div className={`hud-panel-wrapper inspector-panel ${open ? "open" : ""}`}>
        <button
          className="hud-corner-btn"
          onClick={handleToggle}
          title={open ? "Close" : "World Inspector"}
        >
          {open ? <X size={ICON_SIZE} /> : <TreeDeciduous size={ICON_SIZE} />}
        </button>

        <div
          className="hud-panel-content inspector-content"
          onWheel={(e: React.WheelEvent<HTMLDivElement>): void => e.stopPropagation()}
        >
          <div className="inspector-tree">
            {Array.from(tree.clusters.values()).map((cluster: Cluster, clusterIndex: number) => {
              const glyph = getClusterGlyph(clusterIndex);
              const ClusterIcon = glyph.icon;
              return (
                <TreeNode
                  key={cluster.id}
                  id={cluster.id}
                  label={cluster.id}
                  icon={<ClusterIcon size={GLYPH_SIZE} />}
                  depth={0}
                  isSelected={selection === cluster.id}
                  isHovered={hover === cluster.id}
                  onSelect={handleSelect}
                  onHover={handleHover}
                  defaultExpanded={true}
                >
                  {(tree.islandsByCluster.get(cluster.id) || []).map((island: Island) => (
                    <TreeNode
                      key={island.id}
                      id={island.id}
                      label={island.id}
                      icon={<Mountain size={GLYPH_SIZE} />}
                      depth={1}
                      isSelected={selection === island.id}
                      isHovered={hover === island.id}
                      onSelect={handleSelect}
                      onHover={handleHover}
                    >
                      {/* Rocks */}
                      {(tree.rocksByIsland.get(island.id) || []).map((rock: Rock) => (
                        <TreeNode
                          key={rock.id}
                          id={rock.id}
                          label={rock.id}
                          icon={<Gem size={GLYPH_SIZE} />}
                          depth={2}
                          isSelected={selection === rock.id}
                          isHovered={hover === rock.id}
                          onSelect={handleSelect}
                          onHover={handleHover}
                        />
                      ))}
                      {/* Plants - render as proper tree structure */}
                      {(tree.plantsByIsland.get(island.id) || []).map((plant: Plant) => (
                        <TreeNode
                          key={plant.id}
                          id={plant.id}
                          label={plant.id}
                          icon={<TreeDeciduous size={GLYPH_SIZE} />}
                          depth={2}
                          isSelected={selection === plant.id}
                          isHovered={hover === plant.id}
                          onSelect={handleSelect}
                          onHover={handleHover}
                          defaultExpanded={true}
                        >
                          {/* Render plant nodes as a tree from root */}
                          <PlantNodeTree
                            nodeId={plant.rootId}
                            plant={plant}
                            entities={world.entities}
                            depth={3}
                            selection={selection}
                            hover={hover}
                            onSelect={handleSelect}
                            onHover={handleHover}
                          />
                        </TreeNode>
                      ))}
                    </TreeNode>
                  ))}
                </TreeNode>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
