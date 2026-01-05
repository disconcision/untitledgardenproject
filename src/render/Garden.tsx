/**
 * Hanging Garden — SVG World Layer
 * 
 * The main garden visualization: islands, rocks, plants, vines.
 * Crisp, zoomable, interactive.
 */

import { useMemo } from 'react'
import { World, Island, Rock, PlantNode, Plant, Vec2, addVec2 } from '../model'
import { Msg } from '../update'
import { blobPath, leafPath } from './paths'

type GardenProps = {
  world: World
  dispatch: (msg: Msg) => void
}

export function Garden({ world, dispatch }: GardenProps) {
  const { camera, entities, plants, hover, selection, debug, time } = world
  
  // Group entities by type
  const { islands, rocks } = useMemo(() => {
    const islands: Island[] = []
    const rocks: Rock[] = []
    
    for (const entity of entities.values()) {
      switch (entity.kind) {
        case 'island':
          islands.push(entity)
          break
        case 'rock':
          rocks.push(entity)
          break
      }
    }
    
    // Sort islands by depth for proper layering
    islands.sort((a: Island, b: Island): number => b.depth - a.depth)
    
    return { islands, rocks }
  }, [entities])
  
  // Compute transform
  const transform = `translate(${camera.pan.x}, ${camera.pan.y}) scale(${camera.zoom})`
  
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
      }}
      viewBox={`${-window.innerWidth / 2} ${-window.innerHeight / 2} ${window.innerWidth} ${window.innerHeight}`}
    >
      <defs>
        {/* Gradients and filters */}
        <filter id="island-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="var(--color-earth-loam)" floodOpacity="0.3" />
        </filter>
        
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <radialGradient id="island-fill" cx="30%" cy="30%">
          <stop offset="0%" stopColor="var(--color-earth-tan)" />
          <stop offset="60%" stopColor="var(--color-earth-mid)" />
          <stop offset="100%" stopColor="var(--color-earth-dark)" />
        </radialGradient>
        
        <radialGradient id="rock-fill" cx="30%" cy="30%">
          <stop offset="0%" stopColor="var(--color-rock-light)" />
          <stop offset="70%" stopColor="var(--color-rock-mid)" />
          <stop offset="100%" stopColor="var(--color-rock-dark)" />
        </radialGradient>
      </defs>
      
      <g transform={transform}>
        {/* Islands */}
        {islands.map((island: Island) => (
          <IslandRenderer
            key={island.id}
            island={island}
            isHovered={hover === island.id}
            isSelected={selection === island.id}
            showId={debug.showIds}
            showHitTarget={debug.showHitTargets}
            time={time.t}
            dispatch={dispatch}
          />
        ))}
        
        {/* Rocks (rendered on their islands) */}
        {rocks.map((rock: Rock) => {
          const island = entities.get(rock.islandId) as Island | undefined
          if (!island) return null
          return (
            <RockRenderer
              key={rock.id}
              rock={rock}
              islandPos={island.pos}
              isHovered={hover === rock.id}
              showId={debug.showIds}
              dispatch={dispatch}
            />
          )
        })}
        
        {/* Plants */}
        {Array.from(plants.values()).map((plant: Plant) => {
          const island = entities.get(plant.islandId) as Island | undefined
          if (!island) return null
          
          const nodes = Array.from(plant.adjacency.keys())
            .map((id: string) => entities.get(id) as PlantNode | undefined)
            .filter((n): n is PlantNode => n !== undefined)
          
          return (
            <PlantRenderer
              key={plant.id}
              plant={plant}
              nodes={nodes}
              islandPos={island.pos}
              hover={hover}
              showIds={debug.showIds}
              showHitTargets={debug.showHitTargets}
              dispatch={dispatch}
            />
          )
        })}
      </g>
    </svg>
  )
}

// === Island Renderer ===

type IslandRendererProps = {
  island: Island
  isHovered: boolean
  isSelected: boolean
  showId: boolean
  showHitTarget: boolean
  time: number
  dispatch: (msg: Msg) => void
}

function IslandRenderer({
  island,
  isHovered,
  isSelected,
  showId,
  showHitTarget,
  time,
  dispatch,
}: IslandRendererProps) {
  // Subtle ambient sway
  const swayX = Math.sin(time * 0.0003 + island.pos.x * 0.01) * 2
  const swayY = Math.cos(time * 0.0004 + island.pos.y * 0.01) * 1.5
  
  const pathData = blobPath(island.shape)
  
  return (
    <g
      transform={`translate(${island.pos.x + swayX}, ${island.pos.y + swayY})`}
      data-entity-id={island.id}
      onPointerEnter={() => dispatch({ type: 'hover', id: island.id })}
      onPointerLeave={() => dispatch({ type: 'hover', id: null })}
      onDoubleClick={() => dispatch({ type: 'camera/focus', target: island.pos, zoom: 1.5 })}
      style={{ cursor: 'pointer' }}
    >
      {/* Shadow */}
      <path
        d={pathData}
        fill="var(--color-earth-loam)"
        opacity={0.3}
        transform="translate(4, 6)"
      />
      
      {/* Main island shape */}
      <path
        d={pathData}
        fill="url(#island-fill)"
        stroke={isHovered || isSelected ? 'var(--color-hover)' : 'var(--color-earth-dark)'}
        strokeWidth={isHovered || isSelected ? 3 : 1.5}
        style={{
          transition: 'stroke-width 150ms ease-out',
        }}
      />
      
      {/* Hit target outline */}
      {showHitTarget && (
        <circle
          cx={0}
          cy={0}
          r={island.radius}
          fill="none"
          stroke="red"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.5}
        />
      )}
      
      {/* ID label */}
      {showId && (
        <text
          x={0}
          y={-island.radius - 10}
          textAnchor="middle"
          fontSize={10}
          fill="var(--color-text-muted)"
        >
          {island.id}
        </text>
      )}
    </g>
  )
}

// === Rock Renderer ===

type RockRendererProps = {
  rock: Rock
  islandPos: Vec2
  isHovered: boolean
  showId: boolean
  dispatch: (msg: Msg) => void
}

function RockRenderer({
  rock,
  islandPos,
  isHovered,
  showId,
  dispatch,
}: RockRendererProps) {
  const worldPos = addVec2(islandPos, rock.localPos)
  
  // Simple rock shape - irregular polygon
  const points: string = Array.from({ length: 6 }, (_: unknown, i: number): string => {
    const angle = rock.rotation + (i / 6) * Math.PI * 2
    const r = rock.size * (0.7 + Math.sin(i * 2.3) * 0.3)
    return `${Math.cos(angle) * r},${Math.sin(angle) * r}`
  }).join(' ')
  
  return (
    <g
      transform={`translate(${worldPos.x}, ${worldPos.y})`}
      data-entity-id={rock.id}
      onPointerEnter={() => dispatch({ type: 'hover', id: rock.id })}
      onPointerLeave={() => dispatch({ type: 'hover', id: null })}
    >
      <polygon
        points={points}
        fill="url(#rock-fill)"
        stroke={isHovered ? 'var(--color-hover)' : 'var(--color-rock-dark)'}
        strokeWidth={isHovered ? 2 : 1}
      />
      
      {showId && (
        <text
          x={0}
          y={-rock.size - 5}
          textAnchor="middle"
          fontSize={8}
          fill="var(--color-text-muted)"
        >
          {rock.id}
        </text>
      )}
    </g>
  )
}

// === Plant Renderer ===

type PlantRendererProps = {
  plant: Plant
  nodes: PlantNode[]
  islandPos: Vec2
  hover: string | null
  showIds: boolean
  showHitTargets: boolean
  dispatch: (msg: Msg) => void
}

function PlantRenderer({
  plant,
  nodes,
  islandPos,
  hover,
  showIds,
  showHitTargets,
  dispatch,
}: PlantRendererProps) {
  // Build a map for quick lookup
  const nodeMap = new Map(nodes.map((n: PlantNode): [string, PlantNode] => [n.id, n]))
  
  return (
    <g>
      {/* Stems first (behind nodes) */}
      {Array.from(plant.adjacency.entries()).map(([parentId, childIds]: [string, string[]]) => {
        const parent = nodeMap.get(parentId)
        if (!parent) return null
        
        return childIds.map((childId: string) => {
          const child = nodeMap.get(childId)
          if (!child) return null
          
          const p1 = addVec2(islandPos, parent.localPos)
          const p2 = addVec2(islandPos, child.localPos)
          
          // Quadratic bezier with slight curve
          const midX = (p1.x + p2.x) / 2 + (p2.y - p1.y) * 0.1
          const midY = (p1.y + p2.y) / 2 - (p2.x - p1.x) * 0.1
          
          return (
            <path
              key={`stem-${parentId}-${childId}`}
              d={`M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`}
              fill="none"
              stroke="var(--color-stem)"
              strokeWidth={3}
              strokeLinecap="round"
            />
          )
        })
      })}
      
      {/* Nodes */}
      {nodes.map((node: PlantNode) => (
        <PlantNodeRenderer
          key={node.id}
          node={node}
          islandPos={islandPos}
          isHovered={hover === node.id}
          showId={showIds}
          showHitTarget={showHitTargets}
          dispatch={dispatch}
        />
      ))}
    </g>
  )
}

// === Plant Node Renderer ===

type PlantNodeRendererProps = {
  node: PlantNode
  islandPos: Vec2
  isHovered: boolean
  showId: boolean
  showHitTarget: boolean
  dispatch: (msg: Msg) => void
}

function PlantNodeRenderer({
  node,
  islandPos,
  isHovered,
  showId,
  showHitTarget,
  dispatch,
}: PlantNodeRendererProps) {
  const worldPos = addVec2(islandPos, node.localPos)
  
  const handleClick = () => {
    if (node.nodeKind === 'bud' && (node.charge ?? 0) >= 0.8) {
      dispatch({ type: 'sprout', budId: node.id })
    } else if (node.nodeKind === 'leaf') {
      dispatch({ type: 'prune', nodeId: node.id })
    }
  }
  
  const isCharged = node.nodeKind === 'bud' && (node.charge ?? 0) >= 0.8
  
  return (
    <g
      transform={`translate(${worldPos.x}, ${worldPos.y})`}
      data-entity-id={node.id}
      onPointerEnter={() => dispatch({ type: 'hover', id: node.id })}
      onPointerLeave={() => dispatch({ type: 'hover', id: null })}
      onClick={handleClick}
      style={{ cursor: node.nodeKind === 'bud' || node.nodeKind === 'leaf' ? 'pointer' : 'default' }}
    >
      {node.nodeKind === 'bud' && (
        <>
          {/* Glow for charged buds */}
          {isCharged && (
            <circle
              cx={0}
              cy={0}
              r={8}
              fill="var(--color-bud-charged)"
              opacity={0.4}
              filter="url(#glow)"
            />
          )}
          <circle
            cx={0}
            cy={0}
            r={5}
            fill={isCharged ? 'var(--color-bud-charged)' : 'var(--color-bud)'}
            stroke={isHovered ? 'var(--color-hover)' : 'var(--color-green-moss)'}
            strokeWidth={isHovered ? 2 : 1}
          />
        </>
      )}
      
      {node.nodeKind === 'leaf' && (
        <path
          d={leafPath({ x: 0, y: 0 }, node.angle, 12, 6)}
          fill={isHovered ? 'var(--color-leaf-highlight)' : 'var(--color-leaf)'}
          stroke="var(--color-green-moss)"
          strokeWidth={1}
        />
      )}
      
      {node.nodeKind === 'stem' && (
        <circle
          cx={0}
          cy={0}
          r={3}
          fill="var(--color-stem)"
        />
      )}
      
      {node.nodeKind === 'flower' && (
        <circle
          cx={0}
          cy={0}
          r={6}
          fill="var(--color-flower)"
          stroke="var(--color-accent-coral)"
          strokeWidth={1}
        />
      )}
      
      {/* Hit target */}
      {showHitTarget && (
        <circle
          cx={0}
          cy={0}
          r={10}
          fill="none"
          stroke="blue"
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={0.5}
        />
      )}
      
      {/* ID label */}
      {showId && (
        <text
          x={0}
          y={-12}
          textAnchor="middle"
          fontSize={7}
          fill="var(--color-text-muted)"
        >
          {node.id}
        </text>
      )}
    </g>
  )
}

