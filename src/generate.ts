/**
 * Hanging Garden — Procedural Generation
 * 
 * Seeded generation of islands, plants, rocks, vines.
 * Deterministic given seed.
 */

import {
  World,
  Island,
  Rock,
  PlantNode,
  Plant,
  Vec2,
  vec2,
  genId,
  resetIdCounter,
  createInitialWorld,
  addVec2,
  scaleVec2,
} from './model'

// === Seeded Random ===

function createRng(seed: number): () => number {
  // Simple mulberry32 PRNG
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// === Shape Generation ===

function generateBlobShape(
  rng: () => number,
  radius: number,
  irregularity: number = 0.3,
  points: number = 12
): Vec2[] {
  const shape: Vec2[] = []
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2
    const r = radius * (1 + (rng() - 0.5) * irregularity)
    shape.push(vec2(Math.cos(angle) * r, Math.sin(angle) * r))
  }
  return shape
}

// === Island Generation ===

function generateIsland(
  rng: () => number,
  index: number,
  totalIslands: number
): Island {
  // Distribute islands in a loose cluster
  const spreadRadius = 400 + totalIslands * 50
  const angle = (index / totalIslands) * Math.PI * 2 + rng() * 0.5
  const distance = spreadRadius * (0.3 + rng() * 0.7)
  
  const radius = 60 + rng() * 80
  
  return {
    kind: 'island',
    id: genId('island'),
    pos: vec2(
      Math.cos(angle) * distance,
      Math.sin(angle) * distance
    ),
    radius,
    shape: generateBlobShape(rng, radius, 0.25 + rng() * 0.2),
    depth: 0.8 + rng() * 0.4, // pseudo-z for parallax
  }
}

// === Rock Generation ===

function generateRocksForIsland(
  rng: () => number,
  island: Island
): Rock[] {
  const count = Math.floor(1 + rng() * 3)
  const rocks: Rock[] = []
  
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2
    const dist = island.radius * (0.2 + rng() * 0.6)
    
    rocks.push({
      kind: 'rock',
      id: genId('rock'),
      islandId: island.id,
      localPos: vec2(Math.cos(angle) * dist, Math.sin(angle) * dist),
      size: 8 + rng() * 20,
      rotation: rng() * Math.PI * 2,
    })
  }
  
  return rocks
}

// === Plant Generation ===

function generatePlantForIsland(
  rng: () => number,
  island: Island
): { nodes: PlantNode[]; plant: Plant } {
  const plantId = genId('plant')
  const nodes: PlantNode[] = []
  const adjacency = new Map<string, string[]>()
  
  // Root position on island
  const rootAngle = rng() * Math.PI * 2
  const rootDist = island.radius * (0.1 + rng() * 0.3)
  const rootPos = vec2(
    Math.cos(rootAngle) * rootDist,
    Math.sin(rootAngle) * rootDist
  )
  
  // Create root stem
  const rootId = genId('node')
  nodes.push({
    kind: 'plantNode',
    id: rootId,
    plantId,
    nodeKind: 'stem',
    localPos: rootPos,
    angle: -Math.PI / 2 + (rng() - 0.5) * 0.3, // Mostly upward
  })
  adjacency.set(rootId, [])
  
  // Grow a few segments
  let currentId = rootId
  let currentPos = rootPos
  let currentAngle = -Math.PI / 2 + (rng() - 0.5) * 0.3
  
  const segmentCount = 2 + Math.floor(rng() * 3)
  
  for (let i = 0; i < segmentCount; i++) {
    const segmentLength = 15 + rng() * 20
    const angleVariation = (rng() - 0.5) * 0.4
    currentAngle += angleVariation
    
    const newPos = addVec2(
      currentPos,
      scaleVec2(
        vec2(Math.cos(currentAngle), Math.sin(currentAngle)),
        segmentLength
      )
    )
    
    const isLast = i === segmentCount - 1
    const newId = genId('node')
    
    nodes.push({
      kind: 'plantNode',
      id: newId,
      plantId,
      nodeKind: isLast ? 'bud' : 'stem',
      localPos: newPos,
      angle: currentAngle,
      charge: isLast ? 0.5 + rng() * 0.5 : undefined, // Buds start partially charged
    })
    
    // Update adjacency
    adjacency.get(currentId)!.push(newId)
    adjacency.set(newId, [])
    
    // Maybe add a leaf branch
    if (!isLast && rng() > 0.4) {
      const leafId = genId('node')
      const leafAngle = currentAngle + (rng() > 0.5 ? 1 : -1) * (0.4 + rng() * 0.4)
      const leafDist = 10 + rng() * 15
      
      nodes.push({
        kind: 'plantNode',
        id: leafId,
        plantId,
        nodeKind: 'leaf',
        localPos: addVec2(
          newPos,
          scaleVec2(
            vec2(Math.cos(leafAngle), Math.sin(leafAngle)),
            leafDist
          )
        ),
        angle: leafAngle,
      })
      
      adjacency.get(newId)!.push(leafId)
      adjacency.set(leafId, [])
    }
    
    currentId = newId
    currentPos = newPos
  }
  
  return {
    nodes,
    plant: {
      id: plantId,
      islandId: island.id,
      rootId,
      adjacency,
    },
  }
}

// === World Generation ===

export function generateWorld(seed: number): World {
  resetIdCounter()
  const rng = createRng(seed)
  const world = createInitialWorld(seed)
  
  // Generate islands
  const islandCount = 4 + Math.floor(rng() * 4) // 4-7 islands
  const islands: Island[] = []
  
  for (let i = 0; i < islandCount; i++) {
    const island = generateIsland(rng, i, islandCount)
    islands.push(island)
    world.entities.set(island.id, island)
  }
  
  // Generate rocks and plants for each island
  for (const island of islands) {
    // Rocks
    const rocks = generateRocksForIsland(rng, island)
    for (const rock of rocks) {
      world.entities.set(rock.id, rock)
    }
    
    // Plants (1-2 per island)
    const plantCount = 1 + Math.floor(rng() * 2)
    for (let p = 0; p < plantCount; p++) {
      const { nodes, plant } = generatePlantForIsland(rng, island)
      for (const node of nodes) {
        world.entities.set(node.id, node)
      }
      world.plants.set(plant.id, plant)
    }
  }
  
  return world
}

