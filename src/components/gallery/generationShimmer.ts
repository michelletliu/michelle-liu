import * as THREE from "three";
import { FALLBACK_HUES } from "./shimmerPalette";

/**
 * The wet-paint shimmer shown on a canvas while its image generates.
 *
 * Soft colour islands on a high-key white ground with dense additive white
 * film grain — large airy near-white regions, bright translucent dust over
 * pastel lobes. Curl stays gentle so lobes drift and dissolve rather than
 * folding into sharp pigment banks.
 *
 * Fragment output is linear working colour; `linearToOutputTexel` (injected by
 * Three for ShaderMaterial) converts for `renderer.outputColorSpace`.
 */
const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/*
 * NO BACKTICKS AND NO DOLLAR-BRACE ANYWHERE IN THE SHADER SOURCE BELOW — not
 * even inside a GLSL comment.
 *
 * The shader is a JavaScript template literal. A GLSL comment is invisible to
 * the JavaScript parser, which sees only one long string: a backtick ends that
 * string early and a dollar-brace opens an interpolation. Either way the whole
 * module fails to parse, and the error is reported against whatever
 * JavaScript-looking text follows — a line of GLSL, or a comment — so it never
 * points at the character that caused it. This has broken the build twice.
 */
const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec2 vUv;
uniform float uTime;
/** 0 at the start of a generation, asymptotically toward 1. */
uniform float uProgress;
/**
 * Four hue angles in OKLCh degrees, layered in order. Taken from the artwork
 * that inspired the generation when there is one. Hues only: chroma and
 * lightness are set below from progress, so no source palette can make this
 * dull or dark however muted the painting it came from.
 */
uniform vec4 uHues;

/*
 * Everything below mixes in OKLCh, never in RGB.
 *
 * Interpolating two hues in RGB runs the midpoint straight through the grey
 * axis, and layering several such blends averages the whole canvas to olive and
 * taupe — which is exactly what the previous version did. In OKLCh, hue is an
 * angle: crossing from amber to teal travels around the wheel through a vivid
 * green instead of collapsing through mud, and chroma is held explicitly rather
 * than being whatever falls out of the arithmetic.
 */
vec3 oklchToLinear(float L, float C, float hDeg) {
  float h = radians(hDeg);
  float a = C * cos(h);
  float b = C * sin(h);

  float l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  float m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  float s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  float l = l_ * l_ * l_;
  float m = m_ * m_ * m_;
  float s = s_ * s_ * s_;

  return vec3(
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

/** Shortest way round the hue circle, so a blend never detours through grey. */
float mixHue(float a, float b, float t) {
  float d = mod(b - a + 540.0, 360.0) - 180.0;
  return a + d * t;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

/** Three octaves, for the flow field — it is sampled nine times a pixel. */
float fbm3(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * noise(p);
    p *= 2.07;
    amplitude *= 0.5;
  }
  return value;
}

/**
 * Divergence-free flow, read off an fbm potential.
 *
 * The curl of a scalar field has no sources or sinks anywhere in it, so
 * advecting along it can only fold and shear the domain — it cannot push
 * outward from a bright spot or drain into a dark one. That is the difference
 * between pigment being stirred and pigment blooming, and it is why the swirl
 * comes from here rather than from rotating about a point: a fixed centre of
 * rotation reads as a pinwheel, which is the hypnotic look being avoided.
 */
vec2 curl(vec2 p) {
  float e = 0.09;
  float dx = fbm3(p + vec2(e, 0.0)) - fbm3(p - vec2(e, 0.0));
  float dy = fbm3(p + vec2(0.0, e)) - fbm3(p - vec2(0.0, e));
  return vec2(dy, -dx) / (2.0 * e);
}

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 uv = vUv;
  float t = uTime;
  float p = clamp(uProgress, 0.0, 1.0);
  float settle = p * p * (3.0 - 2.0 * p);

  // Soft mesh domain: larger, faster curl so lobes visibly swirl.
  vec2 drift = curl(uv * 1.15 + vec2(t * 0.07, -t * 0.055)) * mix(0.12, 0.045, settle);
  float twist = (fbm3(uv * 0.9 + vec2(t * 0.05, -t * 0.04)) - 0.5) * 1.55;
  vec2 sp = uv + rot(twist * 1.15) * drift;

  vec2 q = vec2(
    fbm(sp * 1.15 + vec2(0.0, t * 0.07)),
    fbm(sp * 1.15 + vec2(4.1, -t * 0.06))
  );
  vec2 r = vec2(
    fbm(sp * 1.4 + 1.15 * q + vec2(1.7 + t * 0.05, 8.4)),
    fbm(sp * 1.4 + 1.15 * q + vec2(7.9, 2.6 - t * 0.04))
  );
  float fieldA = fbm(sp * 1.1 + 1.4 * r + vec2(t * 0.02, -t * 0.015));
  float fieldB = fbm(sp * 1.0 + 1.3 * r.yx + vec2(5.2, -3.1 + t * 0.03));
  float fieldC = fbm(sp * 1.25 + vec2(q.y, r.x) * 1.15 + vec2(-2.4, 6.8 - t * 0.025));
  float fieldD = fbm(sp * 0.95 + vec2(r.y, q.x) * 1.05 + vec2(9.1, 1.3 + t * 0.02));

  /*
   * Adobe mesh: soft colour islands on a mostly high-key field (~30-40 percent
   * near-white), soft bleeds, dense additive white grain. Prior pass stacked
   * fog + paper fades until pigment vanished and the canvas read as blank.
   *
   * No backticks in this comment: the shader is a JS template literal.
   */
  // Readable pastel wash with ~25-35 percent near-white air. Prior Adobe-mesh
  // fog + paper fades left only faint grain on an otherwise blank canvas.
  float chroma = mix(0.10, 0.155, p);
  float lightness = mix(0.90, 0.84, p);
  float coverage = mix(0.72, 0.95, p);

  // Four soft islands — wide enough to read as motion at a glance.
  float m0 = smoothstep(0.22, 0.78, fieldA);
  float m1 = smoothstep(0.24, 0.80, fieldB);
  float m2 = smoothstep(0.26, 0.82, fieldC);
  float m3 = smoothstep(0.23, 0.79, fieldD);
  m0 = pow(m0, 0.95);
  m1 = pow(m1, 0.98) * 0.96;
  m2 = pow(m2, 1.0) * 0.94;
  m3 = pow(m3, 0.98) * 0.92;

  // High-key paper — slightly closer to pure white so wash peaks read lighter.
  vec3 paper = vec3(0.995, 0.993, 0.988);
  vec3 col = paper;

  vec3 p0 = mix(paper, oklchToLinear(lightness, chroma, uHues.x), 0.92);
  vec3 p1 = mix(paper, oklchToLinear(lightness - 0.015, chroma * 0.95, uHues.y), 0.90);
  vec3 p2 = mix(paper, oklchToLinear(lightness + 0.01, chroma * 1.1, uHues.z), 0.94);
  vec3 p3 = mix(paper, oklchToLinear(lightness, chroma * 0.92, uHues.w), 0.88);

  col = mix(col, p0, m0 * coverage);
  col = mix(col, p1, m1 * coverage * 0.95);
  col = mix(col, p2, m2 * coverage * 0.92);
  col = mix(col, p3, m3 * coverage * 0.90);

  // Light edge air only — do not fog the mid-canvas back to paper.
  vec2 fromCenter = uv - 0.5;
  float radial = length(fromCenter) * 1.35;
  float whiteFog = pow(smoothstep(0.42, 0.98, radial), 1.15);
  float fogAmt = whiteFog * mix(0.28, 0.18, settle);
  col = mix(col, paper, fogAmt);

  float cornerAir = smoothstep(0.35, 0.98, uv.x * 0.55 + uv.y * 0.72);
  col = mix(col, paper, cornerAir * mix(0.16, 0.10, settle));

  float bottomAir = smoothstep(0.35, 0.02, uv.y) * smoothstep(0.05, 0.55, uv.x);
  col = mix(col, paper, bottomAir * mix(0.10, 0.06, settle));

  // Frame lip goes to paper — never a dark vignette ring.
  vec2 d = abs(uv - 0.5) * 2.0;
  float rim = smoothstep(0.62, 1.05, max(d.x, d.y));
  col = mix(col, paper, rim * mix(0.40, 0.26, settle));

  // Keep the wash — tiny global lift so paper never wins the midtones.
  col = mix(paper, col, mix(0.94, 0.98, settle));

  // Soft highlight lift — near-white peaks only; pigment lobes stay put.
  float peak = smoothstep(0.90, 0.995, max(col.r, max(col.g, col.b)));
  col = mix(col, vec3(1.0), peak * 0.18);

  /*
   * Additive white film grain — bright translucent dust over colour lobes.
   * Never bipolar dark speckles. Amp stays below the level that lifts the
   * whole field back to blank paper.
   */
  float g1 = noise(uv * 120.0 + vec2(t * 1.4, -t * 1.1));
  float g2 = noise(uv * 240.0 + vec2(-t * 2.2, t * 1.7));
  float g3 = noise(uv * 480.0 + vec2(t * 3.1, t * 2.5));
  float g4 = hash(floor(uv * 720.0 + vec2(t * 18.0, -t * 14.0)));
  float g5 = hash(floor(uv * 1180.0 + vec2(-t * 24.0, t * 19.0)));
  float g6 = hash(floor(uv * 1750.0 + vec2(t * 31.0, -t * 22.0)));
  float g7 = hash(floor(uv * 2400.0 + vec2(-t * 37.0, t * 28.0)));
  float whiteGrain =
      pow(max(g1 - 0.38, 0.0), 1.15) * 0.55
    + pow(max(g2 - 0.40, 0.0), 1.2) * 0.50
    + pow(max(g3 - 0.42, 0.0), 1.25) * 0.42
    + pow(max(g4 - 0.40, 0.0), 1.1) * 0.48
    + pow(max(g5 - 0.42, 0.0), 1.15) * 0.40
    + pow(max(g6 - 0.44, 0.0), 1.2) * 0.34
    + pow(max(g7 - 0.46, 0.0), 1.25) * 0.28;
  float grainAmp = mix(0.18, 0.12, settle);
  col = col + (1.0 - col) * (whiteGrain * grainAmp);

  float dustA = pow(hash(floor(uv * 2100.0 + vec2(t * 28.0, -t * 20.0))), 2.4);
  float dustB = pow(hash(floor(uv * 3200.0 + vec2(-t * 33.0, t * 26.0))), 2.8);
  float dust = dustA * 0.08 + dustB * 0.05;
  col = col + (1.0 - col) * dust;

  // linearToOutputTexel is injected by Three for ShaderMaterial — respects
  // renderer.outputColorSpace. Manual linearToSrgb double-encoded under
  // ColorManagement and crushed pastels toward white.
  gl_FragColor = linearToOutputTexel(vec4(clamp(col, 0.0, 1.0), 1.0));
}
`;

export type ShimmerMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uTime: { value: number };
    uProgress: { value: number };
    uHues: { value: THREE.Vector4 };
  };
};

export function createShimmerMaterial(): ShimmerMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uHues: { value: new THREE.Vector4(...FALLBACK_HUES) },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    toneMapped: false,
    lights: false,
    fog: false,
  }) as ShimmerMaterial;
}

/**
 * Seconds of shimmer time to add for a frame of wall-clock time. Reduced-motion
 * users get a slow bloom instead of drifting paint — still obviously alive, so
 * the canvas never looks stalled, but without the travelling movement. The
 * progress deepening below is unaffected: it is a slow colour change rather
 * than movement, and it is the informative half of the animation.
 */
export function shimmerTimeStep(deltaSeconds: number, reduceMotion: boolean) {
  return deltaSeconds * (reduceMotion ? 0.12 : 1.35);
}

/**
 * A measured remix call takes about 17.5s, so the curve is tuned to spend most
 * of its visible change inside that window.
 */
const SHIMMER_PROGRESS_TAU_MS = 11_000;

/**
 * Synthetic progress for a generation that started `elapsedMs` ago.
 *
 * Generation is one request with no streaming and no progress reporting, so
 * there is nothing real to read. An asymptotic curve is
 * what makes modelling it honest: a linear ramp against a guessed duration
 * either saturates early and then sits frozen — looking stalled, the exact
 * opposite of the intent — or crawls. This always keeps deepening slightly and
 * never claims to be finished, whether the call takes 3 seconds or 40.
 *
 * Nothing in the UI pairs it with a percentage or a bar, because it is a
 * reassurance cue rather than a measurement, and implying precision it does not
 * have would be a lie the image could contradict.
 */
export function shimmerProgress(elapsedMs: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  return 1 - Math.exp(-elapsedMs / SHIMMER_PROGRESS_TAU_MS);
}
