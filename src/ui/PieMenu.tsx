/**
 * Hanging Garden — Pie Menu
 *
 * Radial context menu for plant node actions.
 * Icons appear in a circle, offset from the node to avoid covering it.
 * Minimal, tasteful, icon-focused design.
 */

import { memo, useEffect, useCallback } from "react";
import { Scissors, GitBranch, Crosshair } from "lucide-react";
import { World } from "../model";
import { Msg } from "../update";
import "./PieMenu.css";

const ICON_SIZE = 14;
const MENU_RADIUS = 36; // Distance from center to icons
const ITEM_SIZE = 28; // Size of each menu item button

type PieMenuAction = {
  id: string;
  icon: React.ReactNode;
  label: string;
  // Angle in radians (0 = right, PI/2 = down, PI = left, -PI/2 = up)
  angle: number;
  enabled: boolean;
  onAction: () => void;
};

type PieMenuProps = {
  world: World;
  dispatch: (msg: Msg) => void;
};

export const PieMenu = memo(function PieMenu({ world, dispatch }: PieMenuProps) {
  const { contextMenu, entities, plants } = world;

  // Close on escape or click outside
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && contextMenu) {
        dispatch({ type: "contextMenu/close" });
      }
    },
    [contextMenu, dispatch]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!contextMenu) return null;

  const node = entities.get(contextMenu.nodeId);
  if (!node || node.kind !== "plantNode") {
    return null;
  }

  // Find the plant for this node and check if it's the root
  let isRoot = false;
  let foundInPlant = false;
  for (const plant of plants.values()) {
    if (plant.rootId === contextMenu.nodeId) {
      isRoot = true;
      foundInPlant = true;
      break;
    }
    if (plant.adjacency.has(contextMenu.nodeId)) {
      foundInPlant = true;
      break;
    }
  }

  // If node not found in any plant, don't show menu
  if (!foundInPlant) {
    return null;
  }

  // Determine available actions based on node type
  const canTrim = !isRoot; // Can't trim the root
  const canBranch = node.nodeKind === "stem"; // Only stems can branch
  const canCenterView = node.nodeKind === "stem"; // Center view on stems

  const actions: PieMenuAction[] = [
    {
      id: "trim",
      icon: <Scissors size={ICON_SIZE} />,
      label: "Trim",
      angle: -Math.PI * 0.75, // Upper left
      enabled: canTrim,
      onAction: () => dispatch({ type: "trim", nodeId: contextMenu.nodeId }),
    },
    {
      id: "branch",
      icon: <GitBranch size={ICON_SIZE} />,
      label: "Branch",
      angle: -Math.PI * 0.25, // Upper right
      enabled: canBranch,
      onAction: () => dispatch({ type: "branch", nodeId: contextMenu.nodeId }),
    },
    {
      id: "centerView",
      icon: <Crosshair size={ICON_SIZE} />,
      label: "Center View",
      angle: Math.PI * 0.5, // Bottom center
      enabled: canCenterView,
      onAction: () => {
        dispatch({ type: "camera/focus", target: contextMenu.worldPos });
        dispatch({ type: "contextMenu/close" });
      },
    },
  ];

  // Filter to only enabled actions
  const enabledActions = actions.filter((a: PieMenuAction): boolean => a.enabled);

  // If no actions available, don't show menu
  if (enabledActions.length === 0) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent): void => {
    // Only close if clicking directly on the backdrop, not on a menu item
    // This prevents accidentally closing when clicks bubble up
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      dispatch({ type: "contextMenu/close" });
    }
  };

  return (
    <>
      {/* Backdrop for catching clicks outside */}
      <div
        className="pie-menu-backdrop"
        onClick={handleBackdropClick}
        onContextMenu={handleBackdropClick}
      />

      {/* Menu container with buttons - separate from backdrop to avoid event issues */}
      <div
        className="pie-menu"
        style={{
          left: contextMenu.screenPos.x,
          top: contextMenu.screenPos.y,
        }}
      >
        {/* Central indicator dot */}
        <div className="pie-menu-center" />

        {/* Action items arranged in circle - animate radially from center */}
        {enabledActions.map((action: PieMenuAction) => {
          const x = Math.cos(action.angle) * MENU_RADIUS;
          const y = Math.sin(action.angle) * MENU_RADIUS;

          return (
            <button
              key={action.id}
              className="pie-menu-item"
              style={
                {
                  // CSS custom properties for radial expand animation
                  "--final-x": `${x}px`,
                  "--final-y": `${y}px`,
                  width: ITEM_SIZE,
                  height: ITEM_SIZE,
                } as React.CSSProperties
              }
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                action.onAction();
              }}
              title={action.label}
            >
              {action.icon}
            </button>
          );
        })}
      </div>
    </>
  );
});
