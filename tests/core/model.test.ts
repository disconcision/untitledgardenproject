/**
 * Tests for model types and helpers
 */

import { describe, it, expect } from "vitest";
import {
  vec2,
  addVec2,
  subVec2,
  scaleVec2,
  lenVec2,
  normalizeVec2,
  createInitialWorld,
  genId,
  resetIdCounter,
} from "../../src/core";

describe("vec2 helpers", () => {
  it("creates vectors", () => {
    const v = vec2(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  it("adds vectors", () => {
    const result = addVec2(vec2(1, 2), vec2(3, 4));
    expect(result).toEqual({ x: 4, y: 6 });
  });

  it("subtracts vectors", () => {
    const result = subVec2(vec2(5, 7), vec2(2, 3));
    expect(result).toEqual({ x: 3, y: 4 });
  });

  it("scales vectors", () => {
    const result = scaleVec2(vec2(3, 4), 2);
    expect(result).toEqual({ x: 6, y: 8 });
  });

  it("computes length", () => {
    expect(lenVec2(vec2(3, 4))).toBe(5);
  });

  it("normalizes vectors", () => {
    const result = normalizeVec2(vec2(3, 4));
    expect(result.x).toBeCloseTo(0.6);
    expect(result.y).toBeCloseTo(0.8);
  });

  it("handles zero vector normalization", () => {
    const result = normalizeVec2(vec2(0, 0));
    expect(result).toEqual({ x: 0, y: 0 });
  });
});

describe("createInitialWorld", () => {
  it("creates a world with the given seed", () => {
    const world = createInitialWorld(42);
    expect(world.seed).toBe(42);
  });

  it("starts with empty entities", () => {
    const world = createInitialWorld(42);
    expect(world.entities.size).toBe(0);
  });

  it("starts with default camera", () => {
    const world = createInitialWorld(42);
    expect(world.camera.pan).toEqual({ x: 0, y: 0 });
    expect(world.camera.zoom).toBe(1);
  });

  it("starts with tutorial visible and has sections", () => {
    const world = createInitialWorld(42);
    expect(world.tutorial.visible).toBe(true);
    expect(world.tutorial.sections.length).toBeGreaterThan(0);
    // Each section should have steps
    for (const section of world.tutorial.sections) {
      expect(section.steps.length).toBeGreaterThan(0);
    }
  });
});

describe("genId", () => {
  it("generates unique IDs", () => {
    resetIdCounter();
    const id1 = genId("test");
    const id2 = genId("test");
    expect(id1).not.toBe(id2);
  });

  it("uses the prefix", () => {
    resetIdCounter();
    const id = genId("island");
    expect(id).toMatch(/^island-/);
  });

  it("can be reset", () => {
    resetIdCounter(100);
    const id = genId("x");
    expect(id).toBe("x-101");
  });
});

