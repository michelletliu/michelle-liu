export type CanvasDustParticle = {
  top: string;
  left: string;
  size: number;
  opacity: number;
  color: string;
  durationMs: number;
  delayMs: number;
  driftX: number;
  driftY: number;
};

/** Pale dust dots for the Materials "Canvas particles" specimen. */
export const CANVAS_DUST_PARTICLES: CanvasDustParticle[] = [
  { top: "18%", left: "22%", size: 3, opacity: 0.9, color: "#fbcfe8", durationMs: 5200, delayMs: 0, driftX: 6, driftY: -10 },
  { top: "32%", left: "58%", size: 2, opacity: 0.7, color: "#bfdbfe", durationMs: 6100, delayMs: 400, driftX: -5, driftY: -8 },
  { top: "48%", left: "38%", size: 4, opacity: 0.85, color: "#a1a1aa", durationMs: 4800, delayMs: 900, driftX: 4, driftY: -12 },
  { top: "62%", left: "72%", size: 2, opacity: 0.6, color: "#fbcfe8", durationMs: 6700, delayMs: 200, driftX: -7, driftY: -6 },
  { top: "28%", left: "78%", size: 3, opacity: 0.75, color: "#bfdbfe", durationMs: 5500, delayMs: 1100, driftX: 5, driftY: -9 },
  { top: "70%", left: "28%", size: 2, opacity: 0.55, color: "#a1a1aa", durationMs: 7000, delayMs: 600, driftX: -4, driftY: -7 },
  { top: "55%", left: "52%", size: 3, opacity: 0.8, color: "#fbcfe8", durationMs: 4600, delayMs: 300, driftX: 7, driftY: -11 },
  { top: "40%", left: "18%", size: 2, opacity: 0.65, color: "#bfdbfe", durationMs: 5800, delayMs: 800, driftX: -6, driftY: -8 },
];

export function canvasDustAnimationName(index: number): string {
  return `dust-drift-${index}`;
}

/** Keyframes + reduced-motion kill switch for the materials dust specimen. */
export function canvasDustKeyframesCss(
  particles: CanvasDustParticle[] = CANVAS_DUST_PARTICLES,
): string {
  const frames = particles
    .map((p, i) => {
      const name = canvasDustAnimationName(i);
      const midOpacity = Math.max(0.2, p.opacity * 0.45);
      return `
@keyframes ${name} {
  0%, 100% { transform: translate(0, 0); opacity: ${p.opacity}; }
  40% { transform: translate(${p.driftX}px, ${p.driftY}px); opacity: ${midOpacity}; }
  70% { transform: translate(${p.driftX * -0.4}px, ${p.driftY * 0.55}px); opacity: ${p.opacity * 0.85}; }
}`;
    })
    .join("\n");

  return `${frames}

@media (prefers-reduced-motion: reduce) {
  .canvas-dust-particle {
    animation: none !important;
  }
}`;
}
