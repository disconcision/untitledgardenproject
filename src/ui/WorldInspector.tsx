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
import { TreeDeciduous, X } from "lucide-react";
import {
  World,
  Cluster,
  Plant,
  Id,
  Island,
  Rock,
  PlantNode,
} from "../core/model";
import { Msg } from "../update";
import "./WorldInspector.css";

const ICON_SIZE = 16;

type WorldInspectorProps = {
  world: World;
  dispatch: (msg: Msg) => void;
};

type TreeNodeProps = {
  label: string;
  id?: Id;
  kind?: string;
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
    <div
      className="inspector-node"
      style={{ "--depth": depth } as React.CSSProperties}
    >
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
          {kind && <span className="inspector-kind">{kind}</span>}
          {label}
        </span>
      </div>
      {expanded && hasChildren && (
        <div className="inspector-children">{children}</div>
      )}
    </div>
  );
});

// Build tree structure from world data
function useWorldTree(world: World) {
  // Group entities by type and parent
  const islands: Island[] = [];
  const rocksByIsland = new Map<Id, Rock[]>();
  const plantNodesByPlant = new Map<Id, PlantNode[]>();

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
        if (!plantNodesByPlant.has(entity.plantId)) {
          plantNodesByPlant.set(entity.plantId, []);
        }
        plantNodesByPlant.get(entity.plantId)!.push(entity);
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
    plantNodesByPlant,
  };
}

export const WorldInspector = memo(function WorldInspector({
  world,
  dispatch,
}: WorldInspectorProps) {
  const [open, setOpen] = useState(false);
  const tree = useWorldTree(world);

  const handleSelect = useCallback(
    (id: Id | null): void => {
      dispatch({ type: "select", id });
    },
    [dispatch]
  );

  const handleHover = useCallback(
    (id: Id | null): void => {
      dispatch({ type: "hover", id });
    },
    [dispatch]
  );

  const { selection, hover } = world;

  return (
    <div className="hud-corner hud-bottom-left">
      <div
        className={`hud-panel-wrapper inspector-panel ${open ? "open" : ""}`}
      >
        <button
          className="hud-corner-btn"
          onClick={() => setOpen((prev: boolean): boolean => !prev)}
          title={open ? "Close" : "World Inspector"}
        >
          {open ? <X size={ICON_SIZE} /> : <TreeDeciduous size={ICON_SIZE} />}
        </button>

        <div className="hud-panel-content inspector-content">
          <div className="inspector-header">World</div>
          <div className="inspector-tree">
            {Array.from(tree.clusters.values()).map((cluster: Cluster) => (
              <TreeNode
                key={cluster.id}
                label={cluster.id}
                kind="cluster"
                depth={0}
                isSelected={selection === cluster.id}
                isHovered={hover === cluster.id}
                onSelect={handleSelect}
                onHover={handleHover}
                defaultExpanded={true}
              >
                {(tree.islandsByCluster.get(cluster.id) || []).map(
                  (island: Island) => (
                    <TreeNode
                      key={island.id}
                      id={island.id}
                      label={island.id}
                      kind="island"
                      depth={1}
                      isSelected={selection === island.id}
                      isHovered={hover === island.id}
                      onSelect={handleSelect}
                      onHover={handleHover}
                    >
                      {/* Rocks */}
                      {(tree.rocksByIsland.get(island.id) || []).map(
                        (rock: Rock) => (
                          <TreeNode
                            key={rock.id}
                            id={rock.id}
                            label={rock.id}
                            kind="rock"
                            depth={2}
                            isSelected={selection === rock.id}
                            isHovered={hover === rock.id}
                            onSelect={handleSelect}
                            onHover={handleHover}
                          />
                        )
                      )}
                      {/* Plants */}
                      {(tree.plantsByIsland.get(island.id) || []).map(
                        (plant: Plant) => (
                          <TreeNode
                            key={plant.id}
                            id={plant.id}
                            label={plant.id}
                            kind="plant"
                            depth={2}
                            isSelected={selection === plant.id}
                            isHovered={hover === plant.id}
                            onSelect={handleSelect}
                            onHover={handleHover}
                          >
                            {(tree.plantNodesByPlant.get(plant.id) || []).map(
                              (node: PlantNode) => (
                                <TreeNode
                                  key={node.id}
                                  id={node.id}
                                  label={`${node.nodeKind}${
                                    node.charge
                                      ? ` ⚡${node.charge.toFixed(0)}`
                                      : ""
                                  }`}
                                  kind={node.nodeKind}
                                  depth={3}
                                  isSelected={selection === node.id}
                                  isHovered={hover === node.id}
                                  onSelect={handleSelect}
                                  onHover={handleHover}
                                />
                              )
                            )}
                          </TreeNode>
                        )
                      )}
                    </TreeNode>
                  )
                )}
              </TreeNode>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
