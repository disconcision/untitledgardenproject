/**
 * Hanging Garden — Canvas Background Layer
 * 
 * Atmospheric effects: gradient sky, subtle grain, drifting particles.
 * The liminal layer — felt more than seen.
 */

import { useRef, useEffect, useCallback } from 'react'
import { Camera } from '../model'

type CanvasBackgroundProps = {
  camera: Camera
  time: number  // Available for future time-based effects
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars

// Particle for ambient drift
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
}

export function CanvasBackground({ camera, time: _time }: CanvasBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const frameRef = useRef<number>(0)
  
  // Initialize particles once
  useEffect(() => {
    const particles: Particle[] = []
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2 - 0.1, // slight upward drift
        size: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.2,
      })
    }
    particlesRef.current = particles
  }, [])
  
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    
    // === Sky Gradient ===
    // Humid light, overcast forest morning
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY * 0.7,
      0,
      centerX,
      centerY,
      Math.max(width, height) * 0.8
    )
    gradient.addColorStop(0, '#f0ebe3')   // warm center (filtered sun)
    gradient.addColorStop(0.4, '#e8eff1') // pale
    gradient.addColorStop(0.7, '#d8e2e5') // mid
    gradient.addColorStop(1, '#c8d4d8')   // deep edges
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    
    // === Subtle Grain ===
    // Very light noise texture
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const grainAmount = 4
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * grainAmount
      data[i] = Math.max(0, Math.min(255, data[i] + noise))
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise))
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise))
    }
    ctx.putImageData(imageData, 0, 0)
    
    // === Drifting Particles ===
    const particles = particlesRef.current
    
    for (const p of particles) {
      // Update position
      p.x += p.vx
      p.y += p.vy
      
      // Wrap around (in world space)
      if (p.x > 1500) p.x -= 3000
      if (p.x < -1500) p.x += 3000
      if (p.y > 1500) p.y -= 3000
      if (p.y < -1500) p.y += 3000
      
      // Screen position
      const screenX = centerX + (p.x + camera.pan.x) * camera.zoom
      const screenY = centerY + (p.y + camera.pan.y) * camera.zoom
      
      // Only draw if on screen
      if (screenX > -20 && screenX < width + 20 && screenY > -20 && screenY < height + 20) {
        ctx.beginPath()
        ctx.arc(screenX, screenY, p.size * camera.zoom, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180, 190, 185, ${p.alpha})`
        ctx.fill()
      }
    }
  }, [camera])
  
  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      render()
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [render])
  
  // Animation loop
  useEffect(() => {
    const animate = () => {
      render()
      frameRef.current = requestAnimationFrame(animate)
    }
    
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [render])
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}

