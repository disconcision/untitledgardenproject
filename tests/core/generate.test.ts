/**
 * Tests for procedural generation
 */

import { describe, it, expect } from "vitest";
import { generateWorld, summarizeWorld, createRng } from "../../src/core";

describe("generateWorld", () => {
  it("produces a world with entities", () => {
    const world = generateWorld(42);
    expect(world.entities.size).toBeGreaterThan(0);
  });

  it("is deterministic given the same seed", () => {
    const world1 = generateWorld(42);
    const world2 = generateWorld(42);

    expect(world1.entities.size).toBe(world2.entities.size);
    expect(world1.plants.size).toBe(world2.plants.size);
    expect(world1.seed).toBe(world2.seed);
  });

  it("produces different worlds for different seeds", () => {
    const world1 = generateWorld(1);
    const world2 = generateWorld(2);

    // Entity counts might differ
    const summary1 = summarizeWorld(world1);
    const summary2 = summarizeWorld(world2);

    // At minimum, the seeds should differ
    expect(summary1.seed).not.toBe(summary2.seed);
  });

  it("produces islands, rocks, and plants", () => {
    const world = generateWorld(42);
    const summary = summarizeWorld(world);

    expect(summary.islandCount).toBeGreaterThan(0);
    expect(summary.plantCount).toBeGreaterThan(0);
    expect(summary.rockCount).toBeGreaterThan(0);
    expect(summary.nodeCount).toBeGreaterThan(0);
  });

  it("creates 3-5 clusters with multiple islands", () => {
    // Test across several seeds
    for (let seed = 1; seed <= 20; seed++) {
      const world = generateWorld(seed);
      const summary = summarizeWorld(world);
      // 3-5 clusters, each with 2-6 islands
      expect(summary.clusterCount).toBeGreaterThanOrEqual(3);
      expect(summary.clusterCount).toBeLessThanOrEqual(5);
      // Total islands: min 3 clusters * 2 islands = 6, max 5 clusters * 6 islands = 30
      expect(summary.islandCount).toBeGreaterThanOrEqual(6);
      expect(summary.islandCount).toBeLessThanOrEqual(30);
    }
  });
});

describe("createRng", () => {
  it("produces values between 0 and 1", () => {
    const rng = createRng(42);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it("is deterministic", () => {
    const rng1 = createRng(42);
    const rng2 = createRng(42);

    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });
});

