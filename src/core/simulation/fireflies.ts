/**
 * Firefly Particle Simulation
 *
 * Handles firefly movement, glowing, and day/night behavior.
 * Fireflies spawn at dusk, glow at night, and are attracted to lights.
 */

import {
  World,
  Vec2,
  vec2,
  addVec2,
  genId,
  Particle,
  Island,
  Rock,
} from "../model";
import { createPathwayForce } from "../forces";
import { LandingSpot, GlowingEntity } from "./particles";

// === Force Field Configuration ===

// Create the pathway force field (applied to fireflies)
const pathwayForce = createPathwayForce({
  maxDistance: 400, // Range of pathway influence
  baseStrength: 20, // Base force strength
  attractionWeight: 0.2, // Pull toward pathway line
  directionWeight: 0.8, // Push along pathway direction
});

// Force multiplier for fireflies (weakly affected by pathways)
const FIREFLY_FORCE_MULTIPLIER = 0.3;

// === Fast Tick — Smooth Firefly Movement ===

/**
 * Fast tick for firefly particles — smooth flying and glowing.
 */
export function tickFireflyFast(
  particle: Particle,
  dt: number,
  isNight: boolean,
  isDusk: boolean,
  glowingEntities: GlowingEntity[],
  landingSpots: LandingSpot[],
  world: World
): Particle {
  const updated = { ...particle, age: particle.age + 1 };

  // Update glow (pulsing at night)
  const time = particle.age * 0.05;
  let targetGlow = 0;
  if (isNight && particle.state === "floating") {
    targetGlow = 0.7 + Math.sin(time * 2.5) * 0.3;
  } else if (isDusk && particle.state === "floating") {
    targetGlow = 0.3 + Math.sin(time * 2) * 0.2;
  }
  const newGlow = particle.glow + (targetGlow - particle.glow) * 0.1;

  if (particle.state === "landed") {
    // Take off at night/dusk
    if ((isNight || isDusk) && Math.random() < 0.002) {
      return {
        ...updated,
        state: "floating",
        velocity: vec2((Math.random() - 0.5) * 5, -Math.random() * 3),
        glow: 0.3,
        rotation: Math.random() * Math.PI * 2,
        angularVelocity: 0,
      };
    }
    return { ...updated, glow: newGlow };
  }

  if (particle.state === "floating") {
    // During day, try to land
    if (!isNight && !isDusk) {
      for (const spot of landingSpots) {
        const dx = particle.pos.x - spot.pos.x;
        const dy = particle.pos.y - spot.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 80 && Math.random() < 0.02) {
          return {
            ...updated,
            state: "landed",
            pos: spot.pos,
            velocity: vec2(0, 0),
            landedOn: spot.id,
            glow: 0,
            rotation: 0,
            angularVelocity: 0,
          };
        }
      }
    }

    // Movement — attracted to glowing things at night
    let targetX = 0;
    let targetY = 0;

    if (isNight && glowingEntities.length > 0) {
      const nearest = findNearestGlow(particle.pos, glowingEntities, 200);
      if (nearest && nearest.distance > 30) {
        // Orbit around the glow
        const dx = nearest.entity.pos.x - particle.pos.x;
        const dy = nearest.entity.pos.y - particle.pos.y;
        const dist = nearest.distance;
        const orbitSpeed = 20;
        targetX = (dy / dist) * orbitSpeed + (dx / dist) * 3;
        targetY = (-dx / dist) * orbitSpeed + (dy / dist) * 3;
      }
    }

    // Random wandering
    const wanderPhase = particle.pos.x * 0.02 + particle.pos.y * 0.02;
    targetX += Math.sin(time * 3 + wanderPhase) * 8;
    targetY += Math.cos(time * 2.5 + wanderPhase) * 6;

    // Pathway force field contribution (weaker for fireflies)
    const pathwayContribution = pathwayForce(particle.pos, world);
    targetX += pathwayContribution.x * FIREFLY_FORCE_MULTIPLIER;
    targetY += pathwayContribution.y * FIREFLY_FORCE_MULTIPLIER;

    // Smooth velocity update
    const velLerp = 0.05;
    const newVelX = particle.velocity.x + (targetX - particle.velocity.x) * velLerp;
    const newVelY = particle.velocity.y + (targetY - particle.velocity.y) * velLerp;

    const speed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
    const maxSpeed = 25;
    const cappedVelX = speed > maxSpeed ? (newVelX / speed) * maxSpeed : newVelX;
    const cappedVelY = speed > maxSpeed ? (newVelY / speed) * maxSpeed : newVelY;

    const newPos = vec2(particle.pos.x + cappedVelX * dt, particle.pos.y + cappedVelY * dt);

    return {
      ...updated,
      pos: newPos,
      velocity: vec2(cappedVelX, cappedVelY),
      glow: newGlow,
    };
  }

  return { ...updated, glow: newGlow };
}

// === Firefly Spawning ===

/**
 * Spawn fireflies at dusk/night.
 */
export function tickFireflySpawning(world: World): World {
  const timeOfDay = world.dayCycle.timeOfDay;
  const isDuskOrNight = timeOfDay > 0.7 || timeOfDay < 0.1;

  if (!isDuskOrNight) return world;

  let fireflyCount = 0;
  for (const entity of world.entities.values()) {
    if (entity.kind === "particle" && entity.particleKind === "firefly") {
      fireflyCount++;
    }
  }

  if (fireflyCount >= 20) return world;
  if (Math.random() > 0.15) return world;

  const spawnCandidates: Vec2[] = [];

  for (const entity of world.entities.values()) {
    if (entity.kind === "rock") {
      const rockWorldPos = getRockWorldPos(entity as Rock, world);
      if (rockWorldPos) spawnCandidates.push(rockWorldPos);
    }
  }

  if (spawnCandidates.length === 0) return world;

  const spawnPos = spawnCandidates[Math.floor(Math.random() * spawnCandidates.length)];

  const firefly: Particle = {
    kind: "particle",
    id: genId("particle"),
    particleKind: "firefly",
    state: "floating",
    pos: addVec2(spawnPos, vec2((Math.random() - 0.5) * 30, -10 - Math.random() * 20)),
    velocity: vec2((Math.random() - 0.5) * 5, -Math.random() * 3),
    rotation: 0,
    angularVelocity: 0,
    glow: 0.5,
    age: 0,
  };

  const newEntities = new Map(world.entities);
  newEntities.set(firefly.id, firefly);
  return { ...world, entities: newEntities };
}

// === Helper Functions ===

function getRockWorldPos(rock: Rock, world: World): Vec2 | null {
  const island = world.entities.get(rock.islandId) as Island | undefined;
  if (!island) return null;

  const cluster = world.clusters.get(island.clusterId);
  if (!cluster) return null;

  const islandWorldPos = addVec2(cluster.pos, island.localPos);
  return addVec2(islandWorldPos, rock.localPos);
}

function findNearestGlow(
  pos: Vec2,
  glowing: GlowingEntity[],
  maxDistance: number
): { entity: GlowingEntity; distance: number } | null {
  let nearest: { entity: GlowingEntity; distance: number } | null = null;

  for (const entity of glowing) {
    const dx = pos.x - entity.pos.x;
    const dy = pos.y - entity.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < maxDistance && (!nearest || distance < nearest.distance)) {
      nearest = { entity, distance };
    }
  }

  return nearest;
}

