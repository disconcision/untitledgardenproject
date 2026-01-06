/**
 * Hanging Garden — Camera Hook
 *
 * Pan and zoom handling with smooth interactions.
 */

import { useRef, useCallback, useEffect } from "react";
import { Msg } from "../update";
import { Vec2, vec2, CarriedSubtree } from "../model";

type UseCameraOptions = {
  dispatch: (msg: Msg) => void;
  containerRef: React.RefObject<HTMLElement | null>;
  carriedSubtree: CarriedSubtree | null;
};

export function useCamera({ dispatch, containerRef, carriedSubtree }: UseCameraOptions) {
  const isDragging = useRef(false);
  const lastPos = useRef<Vec2>(vec2(0, 0));

  const handlePointerDown = useCallback(
    (e: React.PointerEvent): void => {
      // Don't close context menu or start panning if clicking inside the pie menu
      const target = e.target as HTMLElement;
      if (target.closest(".pie-menu, .pie-menu-backdrop")) {
        return;
      }

      // If carrying a subtree, handle graft or release
      if (carriedSubtree) {
        // Check if clicking on a plant node (potential graft target)
        // Use closest() because click target may be a child element (circle, path)
        // but the data-entity-id is on the parent <g> group
        const nodeElement = target.closest("[data-entity-id]") as HTMLElement | null;
        const entityId = nodeElement?.dataset?.entityId;
        if (entityId) {
          // Graft to the clicked entity (handler will validate it's a stem)
          dispatch({ type: "graft", targetNodeId: entityId });
        } else {
          // Clicked on void - release the subtree
          dispatch({ type: "release" });
        }
        return;
      }

      // Only pan on background drag (no target entity)
      if ((e.target as HTMLElement).dataset?.entityId) return;

      // Close context menu when clicking on background
      dispatch({ type: "contextMenu/close" });

      isDragging.current = true;
      lastPos.current = vec2(e.clientX, e.clientY);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [dispatch, carriedSubtree]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;

      const current = vec2(e.clientX, e.clientY);
      const delta = vec2(current.x - lastPos.current.x, current.y - lastPos.current.y);

      dispatch({ type: "camera/pan", delta });
      lastPos.current = current;
    },
    [dispatch]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // Don't capture wheel events over UI panels — let them scroll
      const target = e.target as HTMLElement;
      if (target.closest(".hud-corner, .pie-menu")) {
        return;
      }

      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const center = vec2(
        e.clientX - rect.left - rect.width / 2,
        e.clientY - rect.top - rect.height / 2
      );

      // Normalize wheel delta
      const delta = -e.deltaY * 0.001;

      dispatch({ type: "camera/zoom", delta, center });
    },
    [dispatch, containerRef]
  );

  // Attach wheel listener with passive: false
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [containerRef, handleWheel]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isDragging: isDragging.current,
  };
}
