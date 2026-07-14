"use client";

import { useEffect, useRef } from "react";

const PAINTINGS = [
  "/fading/memento-mori.png",
  "/fading/creme.png",
  "/fading/lolita.png",
  "/fading/janus.png",
  "/fading/severed.png",
  "/fading/in-the-mood-for.png",
  "/fading/desire.png",
  "/fading/have-a-nice-life.png",
  "/fading/waiting.png",
  "/fading/caution.png",
  "/fading/the-setting-sun.png",
  "/fading/named.png",
];

const GROW_MS = 6000;
const SHATTER_MS = 3800;
const PARTICLE_GRID = 60;
const START_SCALE = 0.04;
// Physics constants (units: px and ms).
const GRAVITY = 0.0012; // downward acceleration applied every ms
const AIR_DRAG_X = 0.9986; // horizontal velocity multiplier per ms (gentle)
const FLOOR_BOUNCE = 0.22; // velocity retained on ground impact (and inverted)
const FLOOR_FRICTION = 0.55; // horizontal velocity multiplier on impact
const SETTLE_VY = 0.05; // vy below this on impact = settled (rest on floor)
const FADE_START = 0.78; // fade begins at this fraction of SHATTER_MS
// Dust particles are tiny circles (radius in px), independent of image size.
const DUST_MIN_RADIUS = 1.5;
const DUST_MAX_RADIUS = 3;
const TAU = Math.PI * 2;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ay: number; // per-particle gravity (slight variation for natural feel)
  r: number; // radius in px
  color: string;
  settled: boolean;
};

type Phase = "loading" | "grow" | "shatter";

export default function FadingPage() {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    let particles: Particle[] = [];
    let stopped = false;
    let rafId = 0;

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Preload all paintings to avoid stalls between cycles.
    const preloads: HTMLImageElement[] = PAINTINGS.map((src) => {
      const i = new Image();
      i.src = src;
      return i;
    });

    let idx = 0;
    let phase: Phase = "loading";
    let phaseStart = 0;
    // Maximum scale at which the image touches a viewport edge.
    let maxScale = 1;

    const computeMaxScale = () => {
      // Important: getBoundingClientRect reflects the *post-transform* bounds,
      // so we can't use it directly while the image is at START_SCALE.
      // Instead, derive the natural displayed size (what the browser would show
      // at scale=1 with max-width:100vw / max-height:100vh) from naturalWidth
      // and naturalHeight, then compute the scale that makes either dimension
      // touch the viewport edge.
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (!natW || !natH) return 1;
      let dispW = natW;
      let dispH = natH;
      if (dispW > vw) {
        const f = vw / dispW;
        dispW *= f;
        dispH *= f;
      }
      if (dispH > vh) {
        const f = vh / dispH;
        dispW *= f;
        dispH *= f;
      }
      return Math.min(vw / dispW, vh / dispH);
    };

    const beginGrow = () => {
      img.src = PAINTINGS[idx];
      img.style.opacity = "0";
      img.style.transform = `translate(-50%, -50%) scale(${START_SCALE})`;
      const onReady = () => {
        // Wait one frame so layout settles after src change.
        requestAnimationFrame(() => {
          maxScale = computeMaxScale();
          phase = "grow";
          phaseStart = performance.now();
        });
      };
      if (img.complete && img.naturalWidth) onReady();
      else img.onload = onReady;
    };

    const triggerShatter = () => {
      const rect = img.getBoundingClientRect();
      const grid = PARTICLE_GRID;
      const off = document.createElement("canvas");
      off.width = grid;
      off.height = grid;
      const offCtx = off.getContext("2d", { willReadFrequently: true });
      if (!offCtx) return;
      offCtx.drawImage(img, 0, 0, grid, grid);
      let data: Uint8ClampedArray;
      try {
        data = offCtx.getImageData(0, 0, grid, grid).data;
      } catch {
        return;
      }
      const cellW = rect.width / grid;
      const cellH = rect.height / grid;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const now = performance.now();

      for (let gy = 0; gy < grid; gy++) {
        for (let gx = 0; gx < grid; gx++) {
          const i = (gy * grid + gx) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 24) continue;
          const x = rect.left + (gx + 0.5) * cellW;
          const y = rect.top + (gy + 0.5) * cellH;
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.hypot(dx, dy) || 1;
          const baseAngle = Math.atan2(dy, dx);
          const angle = baseAngle + (Math.random() - 0.5) * 0.7;
          // Gentler radial burst — gravity does most of the spreading work.
          // Far-from-center pixels still fly faster (preserves the explosion shape).
          const burst =
            0.07 + Math.random() * 0.32 + dist * 0.00045;
          let vx = Math.cos(angle) * burst;
          let vy = Math.sin(angle) * burst;
          // Upward kick: every particle arcs up first, so the screen visibly
          // fills with dust before everything falls.
          vy -= 0.22 + Math.random() * 0.55;
          // Slight extra horizontal drift for natural air movement during fall.
          vx += (Math.random() - 0.5) * 0.18;
          particles.push({
            x,
            y,
            vx,
            vy,
            ay: GRAVITY * (0.82 + Math.random() * 0.36),
            r:
              DUST_MIN_RADIUS +
              Math.random() * (DUST_MAX_RADIUS - DUST_MIN_RADIUS),
            color: `rgb(${r}, ${g}, ${b})`,
            settled: false,
          });
        }
      }

      img.style.opacity = "0";
      phase = "shatter";
      phaseStart = now;
    };

    const advance = () => {
      // Clear settled debris so the next painting grows into a clean canvas.
      particles = [];
      idx = (idx + 1) % PAINTINGS.length;
      beginGrow();
    };

    let last = performance.now();

    const loop = (now: number) => {
      // Clamp dt so a paused/backgrounded tab can't fling particles offscreen.
      const dt = Math.min(now - last, 48);
      last = now;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Phase-based opacity: hold all particles fully visible during the fall
      // and pile-up, then fade together near the end of the shatter phase.
      let phaseAlpha = 1;
      if (phase === "shatter") {
        const pT = (now - phaseStart) / SHATTER_MS;
        if (pT > FADE_START) {
          phaseAlpha = Math.max(
            0,
            1 - (pT - FADE_START) / (1 - FADE_START),
          );
        }
      }

      const vh = window.innerHeight;
      const dragX = Math.pow(AIR_DRAG_X, dt);

      // Update + draw particles.
      ctx.globalAlpha = phaseAlpha;
      for (const p of particles) {
        if (!p.settled) {
          // Integrate physics (semi-implicit Euler).
          p.vy += p.ay * dt; // gravity
          p.vx *= dragX; // horizontal air drag (vertical drag would fight gravity)
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          // Floor collision: bounce with damping, then settle when energy is low.
          const floor = vh - p.r;
          if (p.y >= floor && p.vy > 0) {
            p.y = floor;
            p.vy = -p.vy * FLOOR_BOUNCE;
            p.vx *= FLOOR_FRICTION;
            if (Math.abs(p.vy) < SETTLE_VY) {
              p.vy = 0;
              p.settled = true;
            }
          }
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Drive image phase animation.
      if (phase === "grow") {
        const t = Math.min(1, (now - phaseStart) / GROW_MS);
        // Quadratic ease-in: starts gentle, accelerates toward the edges.
        const eased = t * t;
        const scale = START_SCALE + (maxScale - START_SCALE) * eased;
        img.style.transform = `translate(-50%, -50%) scale(${scale})`;
        img.style.opacity = String(Math.min(1, t * 5));
        if (t >= 1) triggerShatter();
      } else if (phase === "shatter") {
        if (now - phaseStart >= SHATTER_MS) advance();
      }

      if (!stopped) rafId = requestAnimationFrame(loop);
    };

    beginGrow();
    rafId = requestAnimationFrame(loop);


    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      // Reference preloads so they aren't garbage-collected mid-cycle.
      preloads.length;
    };
  }, []);

  return (
    <main className="fixed inset-0 overflow-hidden bg-white">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0"
      />
      <img
        ref={imgRef}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-1/2 select-none shadow-elevated"
        style={{
          transform: `translate(-50%, -50%) scale(${START_SCALE})`,
          opacity: 0,
          maxWidth: "100vw",
          maxHeight: "100vh",
          width: "auto",
          height: "auto",
          borderRadius: "12px",
          willChange: "transform, opacity",
          transformOrigin: "center center",
        }}
      />
    </main>
  );
}
