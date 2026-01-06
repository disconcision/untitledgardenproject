/**
 * Inspector Tree Node Components
 *
 * Reusable tree node rendering components for the World Inspector.
 * Extracted from WorldInspector.tsx for better organization.
 */

import { memo, useCallback } from "react";
import {
  Hexagon,
  Star,
  Triangle,
  Sparkles,
  Mountain,
  Gem,
  Circle,
  Sprout,
  Leaf as LeafIcon,
  Bug,
  Dot,
} from "lucide-react";
import { Id, Plant, PlantNode, Entity } from "../core/model";

// === Constants ===

const GLYPH_SIZE = 11;

// === Icon Helpers ===

// Cluster glyph icons - distinctive symbols for each cluster
const CLUSTER_GLYPHS = [
  { icon: Hexagon, label: "hexagon" },
  { icon: Star, label: "star" },
  { icon: Triangle, label: "triangle" },
  { icon: Sparkles, label: "sparkles" },
  { icon: Mountain, label: "mountain" },
  { icon: Gem, label: "gem" },
];

export function getClusterGlyph(index: number): {
  icon: typeof Hexagon;
  label: string;
} {
  return CLUSTER_GLYPHS[index % CLUSTER_GLYPHS.length];
}

// Node kind icons for plant nodes
export function getNodeKindIcon(kind: string): React.ReactNode {
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

// Particle kind icons
export function getParticleIcon(particleKind: string): React.ReactNode {
  switch (particleKind) {
    case "firefly":
      return <Bug size={GLYPH_SIZE} />;
    case "seed":
      return <Dot size={GLYPH_SIZE} />;
    default:
      return <Circle size={GLYPH_SIZE} />;
  }
}

// === Tree Node Component ===

export type TreeNodeProps = {
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
  onToggle: (id: Id, expanded: boolean) => void;
  isExpanded: boolean;
};

export const TreeNode = memo(function TreeNode({
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
  onToggle,
  isExpanded,
}: TreeNodeProps): JSX.Element {
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

  const handleToggle = useCallback(
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      if (id) {
        onToggle(id, !isExpanded);
      }
    },
    [id, isExpanded, onToggle]
  );

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
        data-node-id={id}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {hasChildren ? (
          <button className="inspector-toggle" onClick={handleToggle}>
            {isExpanded ? "▼" : "▶"}
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
      {isExpanded && hasChildren && <div className="inspector-children">{children}</div>}
    </div>
  );
});

// === Plant Node Tree Component ===

export type PlantNodeTreeProps = {
  nodeId: Id;
  plant: Plant;
  entities: Map<Id, Entity>;
  depth: number;
  selection: Id | null;
  hover: Id | null;
  onSelect: (id: Id | null) => void;
  onHover: (id: Id | null) => void;
  onToggle: (id: Id, expanded: boolean) => void;
  expandedNodes: Set<Id>;
};

export const PlantNodeTree = memo(function PlantNodeTree({
  nodeId,
  plant,
  entities,
  depth,
  selection,
  hover,
  onSelect,
  onHover,
  onToggle,
  expandedNodes,
}: PlantNodeTreeProps): JSX.Element | null {
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
      onToggle={onToggle}
      isExpanded={expandedNodes.has(node.id)}
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
          onToggle={onToggle}
          expandedNodes={expandedNodes}
        />
      ))}
    </TreeNode>
  );
});
