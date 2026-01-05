/**
 * Hanging Garden — Main App
 * 
 * Composition of all layers: Canvas background, SVG world, DOM HUD.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { World } from './model'
import { Msg, update } from './update'
import { generateWorld } from './generate'
import { CanvasBackground } from './render/Canvas'
import { Garden } from './render/Garden'
import { Tutorial } from './ui/Tutorial'
import { DebugPanel } from './ui/DebugPanel'
import { useCamera } from './hooks/useCamera'

const INITIAL_SEED = 42

export default function App() {
  const [world, setWorld] = useState<World>(() => generateWorld(INITIAL_SEED))
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Dispatch function for messages
  const dispatch = useCallback((msg: Msg): void => {
    setWorld((w: World): World => update(msg, w))
  }, [])
  
  // Regenerate world with new seed
  const handleRegenerate = useCallback((seed: number): void => {
    setWorld(generateWorld(seed))
  }, [])
  
  // Camera controls
  const camera = useCamera({ dispatch, containerRef })
  
  // Animation loop for simulation tick
  useEffect(() => {
    let lastTime = performance.now()
    let animationId: number
    
    const tick = (currentTime: number): void => {
      const dt = currentTime - lastTime
      lastTime = currentTime
      
      dispatch({ type: 'tick', dt })
      animationId = requestAnimationFrame(tick)
    }
    
    animationId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationId)
  }, [dispatch])
  
  return (
    <div
      ref={containerRef}
      className="garden-container cursor-grab"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        touchAction: 'none',
      }}
      onPointerDown={camera.handlePointerDown}
      onPointerMove={camera.handlePointerMove}
      onPointerUp={camera.handlePointerUp}
    >
      {/* Layer 1: Canvas atmosphere */}
      <CanvasBackground camera={world.camera} time={world.time.t} />
      
      {/* Layer 2: SVG world */}
      <Garden world={world} dispatch={dispatch} />
      
      {/* Layer 3: DOM HUD */}
      <Tutorial world={world} dispatch={dispatch} />
      <DebugPanel world={world} dispatch={dispatch} onRegenerate={handleRegenerate} />
    </div>
  )
}

