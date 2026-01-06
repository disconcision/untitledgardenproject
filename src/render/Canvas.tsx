/**
 * Hanging Garden — Canvas Background Layer
 *
 * Atmospheric effects: gradient sky, subtle grain, drifting particles.
 * The liminal layer — felt more than seen.
 *
 * NOTE: This component manages its own animation loop (not React state)
 * for performance. It only re-renders when camera changes.
 */

import { useRef, useEffect, useCallback, memo } from "react";
import { Camera } from "../model";

type CanvasBackgroundProps = {
  camera: Camera;
  timeOfDay?: number; // For triggering re-renders when time changes
};

// Read CSS custom properties for current color scheme
function getCSSColor(property: string): string {
  const root = document.documentElement;
  const computed = getComputedStyle(root);
  return computed.getPropertyValue(property).trim() || "#e8eff1";
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
};

export const CanvasBackground = memo(function CanvasBackground({
  camera,
  timeOfDay,
}: CanvasBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const cameraRef = useRef(camera);
  const colorsRef = useRef({
    bgWarm: "#f5f2ec",
    bgPale: "#e8eff1",
    bgDeep: "#d0dce0",
    particleColor: "rgba(160, 170, 165, 0.1)",
  });

  // Update camera ref without re-render
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  // Update colors when time of day changes
  useEffect(() => {
    colorsRef.current = {
      bgWarm: getCSSColor("--bg-warm"),
      bgPale: getCSSColor("--bg-pale"),
      bgDeep: getCSSColor("--bg-deep"),
      particleColor: `rgba(160, 170, 165, ${
        timeOfDay !== undefined && timeOfDay < 0.2 ? 0.15 : 0.1
      })`,
    };
  }, [timeOfDay]);

  // Initialize particles once
  useEffect(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.15 - 0.05,
        size: 1 + Math.random() * 1.5,
        alpha: 0.08 + Math.random() * 0.12,
      });
    }
    particlesRef.current = particles;
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const cam = cameraRef.current;

    // === Sky Gradient (uses CSS color scheme) ===
    const colors = colorsRef.current;
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY * 0.7,
      0,
      centerX,
      centerY,
      Math.max(width, height) * 0.8
    );
    gradient.addColorStop(0, colors.bgWarm);
    gradient.addColorStop(0.5, colors.bgPale);
    gradient.addColorStop(1, colors.bgDeep);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // === Drifting Particles (very subtle) ===
    const particles = particlesRef.current;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x > 1500) p.x -= 3000;
      if (p.x < -1500) p.x += 3000;
      if (p.y > 1500) p.y -= 3000;
      if (p.y < -1500) p.y += 3000;

      const screenX = centerX + (p.x + cam.pan.x) * cam.zoom;
      const screenY = centerY + (p.y + cam.pan.y) * cam.zoom;

      if (screenX > -20 && screenX < width + 20 && screenY > -20 && screenY < height + 20) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size * cam.zoom, 0, Math.PI * 2);
        // Particles slightly brighter at night
        const particleAlpha = colorsRef.current.particleColor.includes("0.15")
          ? p.alpha * 1.5
          : p.alpha;
        ctx.fillStyle = `rgba(160, 170, 165, ${particleAlpha})`;
        ctx.fill();
      }
    }
  }, []);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = (): void => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Animation loop - runs independently of React
  useEffect(() => {
    const animate = (): void => {
      render();
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
});
