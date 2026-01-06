/**
 * Tests for force field system
 */

import { describe, it, expect } from "vitest";
import { vec2, World } from "../../src/core";
import {
  createPathwayForce,
  samplePathwayForce,
  PathwayForceConfig,
} from "../../src/core/forces/pathway";

// === Test Fixtures ===

function createMinimalWorld(): World {
  const constellationId = "constellation-1";
  const clusterId1 = "cluster-1";
  const clusterId2 = "cluster-2";

  const world: World = {
    constellations: new Map([[constellationId, { id: constellationId, pos: vec2(0, 0) }]]),
    clusters: new Map([
      [
        clusterId1,
        { id: clusterId1, constellationId, pos: vec2(0, 0), glyphKind: "seed", rotation: 0 },
      ],
      [
        clusterId2,
        { id: clusterId2, constellationId, pos: vec2(1000, 0), glyphKind: "node", rotation: 0 },
      ],
    ]),
    pathways: new Map([
      [
        "pathway-1",
        {
          id: "pathway-1",
          fromClusterId: clusterId1,
          toClusterId: clusterId2,
          direction: "forward",
        },
      ],
    ]),
    entities: new Map(),
    plants: new Map(),
    camera: { pan: vec2(0, 0), zoom: 1 },
    time: { t: 0, dt: 0 },
    dayCycle: { timeOfDay: 0.5, dayLengthMs: 180000, running: true },
    selection: null,
    hover: null,
    hoveredPathway: null,
    contextMenu: null,
    tutorial: { visible: true, sections: [] },
    debug: { showIds: false, showHitTargets: false, showForceField: false },
    focusedPanel: null,
    seed: 42,
    carriedSubtree: null,
    cursorWorldPos: vec2(0, 0),
    driftingPieces: [],
    fps: 60,
    cameraAnimation: null,
  };

  return world;
}

// === Force Field Tests ===

describe("createPathwayForce", () => {
  it("returns a function", () => {
    const forceField = createPathwayForce();
    expect(typeof forceField).toBe("function");
  });

  it("returns zero force far from pathways", () => {
    const world = createMinimalWorld();
    const config: PathwayForceConfig = {
      maxDistance: 100,
      baseStrength: 10,
      attractionWeight: 0.3,
      directionWeight: 0.7,
    };

    // Position very far from the pathway (which goes from 0,0 to 1000,0)
    const farPosition = vec2(0, 500); // 500 units away from the line
    const force = samplePathwayForce(farPosition, world, config);

    expect(force.x).toBe(0);
    expect(force.y).toBe(0);
  });

  it("returns non-zero force near pathways", () => {
    const world = createMinimalWorld();
    const config: PathwayForceConfig = {
      maxDistance: 300,
      baseStrength: 20,
      attractionWeight: 0.3,
      directionWeight: 0.7,
    };

    // Position near the pathway (which goes from 0,0 to 1000,0)
    const nearPosition = vec2(500, 50); // 50 units below the line
    const force = samplePathwayForce(nearPosition, world, config);

    // Should have some force
    const magnitude = Math.sqrt(force.x ** 2 + force.y ** 2);
    expect(magnitude).toBeGreaterThan(0);
  });

  it("force includes attraction toward the line", () => {
    const world = createMinimalWorld();
    const config: PathwayForceConfig = {
      maxDistance: 300,
      baseStrength: 20,
      attractionWeight: 1.0, // All attraction, no direction
      directionWeight: 0.0,
    };

    // Position below the pathway line
    const position = vec2(500, 100);
    const force = samplePathwayForce(position, world, config);

    // Should pull upward (toward y=0)
    expect(force.y).toBeLessThan(0);
  });

  it("forward pathway pushes in positive direction", () => {
    const world = createMinimalWorld();
    // Set the pathway direction to forward (from cluster-1 at 0,0 to cluster-2 at 1000,0)
    world.pathways.set("pathway-1", {
      id: "pathway-1",
      fromClusterId: "cluster-1",
      toClusterId: "cluster-2",
      direction: "forward",
    });

    const config: PathwayForceConfig = {
      maxDistance: 300,
      baseStrength: 20,
      attractionWeight: 0.0, // No attraction
      directionWeight: 1.0, // All direction
    };

    // Position on the pathway line
    const position = vec2(500, 0);
    const force = samplePathwayForce(position, world, config);

    // Should push in positive x direction (toward cluster-2)
    expect(force.x).toBeGreaterThan(0);
  });

  it("backward pathway pushes in negative direction", () => {
    const world = createMinimalWorld();
    // Set the pathway direction to backward
    world.pathways.set("pathway-1", {
      id: "pathway-1",
      fromClusterId: "cluster-1",
      toClusterId: "cluster-2",
      direction: "backward",
    });

    const config: PathwayForceConfig = {
      maxDistance: 300,
      baseStrength: 20,
      attractionWeight: 0.0,
      directionWeight: 1.0,
    };

    const position = vec2(500, 0);
    const force = samplePathwayForce(position, world, config);

    // Should push in negative x direction (toward cluster-1)
    expect(force.x).toBeLessThan(0);
  });
});

describe("force field falloff", () => {
  it("force is stronger closer to the pathway", () => {
    const world = createMinimalWorld();
    const config: PathwayForceConfig = {
      maxDistance: 300,
      baseStrength: 20,
      attractionWeight: 0.5,
      directionWeight: 0.5,
    };

    const closePosition = vec2(500, 10);
    const farPosition = vec2(500, 100);

    const closeForce = samplePathwayForce(closePosition, world, config);
    const farForce = samplePathwayForce(farPosition, world, config);

    const closeMagnitude = Math.sqrt(closeForce.x ** 2 + closeForce.y ** 2);
    const farMagnitude = Math.sqrt(farForce.x ** 2 + farForce.y ** 2);

    expect(closeMagnitude).toBeGreaterThan(farMagnitude);
  });
});
