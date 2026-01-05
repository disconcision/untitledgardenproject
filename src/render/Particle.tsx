/**
 * Particle Renderer — Seeds and Fireflies
 *
 * Free-floating entities with dynamic visual effects.
 */

import { memo } from "react";
import { Particle } from "../model";

export type ParticleRendererProps = {
  particle: Particle;
  showId: boolean;
};

export const ParticleRenderer = memo(function ParticleRenderer({
  particle,
  showId,
}: ParticleRendererProps): JSX.Element | null {
  const { particleKind, state, age } = particle;

  // Don't render particles that are rooting (becoming plants)
  if (state === "rooting") return null;

  // Landed particles are less visible
  const opacity = state === "landed" ? 0.4 : 1;

  // Age-based fade out for very old particles
  const ageFade = age > 2500 ? 1 - (age - 2500) / 500 : 1;

  if (particleKind === "seed") {
    return <SeedRenderer particle={particle} opacity={opacity * ageFade} showId={showId} />;
  }

  if (particleKind === "firefly") {
    return <FireflyRenderer particle={particle} opacity={opacity * ageFade} showId={showId} />;
  }

  return null;
});

// === Seed Renderer ===

type SeedRendererProps = {
  particle: Particle;
  opacity: number;
  showId: boolean;
};

function SeedRenderer({ particle, opacity, showId }: SeedRendererProps): JSX.Element {
  const { pos, state, age, rotation } = particle;

  const rotationDeg = (rotation * 180) / Math.PI;

  // Dynamic tail length that breathes gently
  const tailLength = state === "floating" ? 12 + Math.sin(age * 0.1) * 4 : 0;

  // Secondary wisp for more organic look
  const secondaryLength = tailLength * 0.6;
  const secondaryAngle = 0.3;

  return (
    <g className="particle seed" transform={`translate(${pos.x}, ${pos.y})`} style={{ opacity }}>
      {/* Main wispy tail (only when floating) */}
      {state === "floating" && tailLength > 0 && (
        <g transform={`rotate(${rotationDeg})`}>
          {/* Primary tail strand */}
          <path
            d={`M 0 0 Q ${-tailLength * 0.4} ${-tailLength * 0.2} ${0} ${-tailLength}`}
            stroke="var(--color-earth-tan)"
            strokeWidth={0.8}
            strokeLinecap="round"
            fill="none"
            opacity={0.7}
          />
          {/* Secondary tail strand */}
          <path
            d={`M 0 0 Q ${tailLength * 0.3} ${-secondaryLength * 0.3} ${
              Math.sin(secondaryAngle) * 3
            } ${-secondaryLength}`}
            stroke="var(--color-earth-tan)"
            strokeWidth={0.4}
            strokeLinecap="round"
            fill="none"
            opacity={0.4}
          />
        </g>
      )}

      {/* Seed body */}
      <ellipse
        cx={0}
        cy={0}
        rx={3}
        ry={2}
        fill="var(--color-earth-tan)"
        stroke="var(--color-earth-mid)"
        strokeWidth={0.4}
        transform={`rotate(${rotationDeg})`}
        filter="url(#seed-shimmer)"
      />

      {showId && (
        <text x={0} y={-8} textAnchor="middle" className="debug-label">
          {particle.id}
        </text>
      )}
    </g>
  );
}

// === Firefly Renderer ===

type FireflyRendererProps = {
  particle: Particle;
  opacity: number;
  showId: boolean;
};

function FireflyRenderer({ particle, opacity, showId }: FireflyRendererProps): JSX.Element {
  const { pos, state, glow, age } = particle;

  const glowRadius = 6 + glow * 8;
  const bodySize = 2;

  // Pulse animation
  const pulse = 1 + Math.sin(age * 0.12) * 0.15;

  // Almost invisible when landed during day
  const fireflyOpacity = state === "landed" && glow < 0.1 ? 0.08 : opacity;

  return (
    <g
      className="particle firefly"
      transform={`translate(${pos.x}, ${pos.y})`}
      style={{ opacity: fireflyOpacity }}
    >
      {/* Outer glow (soft ambient) */}
      {glow > 0.1 && (
        <circle
          cx={0}
          cy={0}
          r={glowRadius * pulse * 1.5}
          fill="var(--color-firefly-glow)"
          opacity={glow * 0.3}
          filter="url(#firefly-glow)"
        />
      )}

      {/* Inner glow (brighter core) */}
      {glow > 0.1 && (
        <circle
          cx={0}
          cy={0}
          r={glowRadius * pulse * 0.6}
          fill="#ffffcc"
          opacity={glow * 0.8}
          filter="url(#firefly-glow)"
        />
      )}

      {/* Body */}
      <circle
        cx={0}
        cy={0}
        r={bodySize}
        fill={glow > 0.1 ? "#e8f060" : "var(--color-firefly-body)"}
      />

      {/* Wings (only visible when flying) */}
      {state === "floating" && (
        <>
          <ellipse
            cx={-2.5}
            cy={-1}
            rx={2}
            ry={1}
            fill="var(--color-firefly-wing)"
            opacity={0.5}
            transform={`rotate(${Math.sin(age * 0.4) * 25 - 30})`}
          />
          <ellipse
            cx={2.5}
            cy={-1}
            rx={2}
            ry={1}
            fill="var(--color-firefly-wing)"
            opacity={0.5}
            transform={`rotate(${-Math.sin(age * 0.4) * 25 + 30})`}
          />
        </>
      )}

      {showId && (
        <text x={0} y={-12} textAnchor="middle" className="debug-label">
          {particle.id}
        </text>
      )}
    </g>
  );
}
