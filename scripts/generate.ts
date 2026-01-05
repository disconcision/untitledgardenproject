#!/usr/bin/env npx tsx
/**
 * CLI: Generate a world and print summary
 *
 * Usage: npx tsx scripts/generate.ts [--seed N] [--json]
 *
 * For agent use: quick hypothesis validation without browser.
 */

import { generateWorld, summarizeWorld } from "../src/core";

function parseArgs(): { seed: number; json: boolean } {
  const args = process.argv.slice(2);
  let seed = 42;
  let json = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--seed" && args[i + 1]) {
      seed = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === "--json") {
      json = true;
    }
  }

  return { seed, json };
}

function main(): void {
  const { seed, json } = parseArgs();
  const world = generateWorld(seed);
  const summary = summarizeWorld(world);

  if (json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`Hanging Garden — World Summary`);
    console.log(`==============================`);
    console.log(`Seed: ${summary.seed}`);
    console.log(`Total entities: ${summary.entityCount}`);
    console.log(`  Islands: ${summary.islandCount}`);
    console.log(`  Plants: ${summary.plantCount}`);
    console.log(`  Rocks: ${summary.rockCount}`);
    console.log(`  Plant nodes: ${summary.nodeCount}`);
  }
}

main();
