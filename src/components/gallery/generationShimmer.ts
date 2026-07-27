import * as THREE from "three";
import { FALLBACK_HUES } from "./shimmerPalette";

/**
 * The wet-paint shimmer shown on a canvas while its image generates.
 *
 * Curl-advected, domain-warped fbm drives a few soft pigment washes over a
 * paper base, so the surface is stirred like paint on a palette rather than
 * sweeping like a loading gradient. Colors are deliberately desaturated to sit
 * inside a white room, and the whole thing stays unlit and un-tone-mapped so it
 * renders at the values authored here — the same reason hung artwork uses a
 * basic material.
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

/* The scene renders unlit and un-tone-mapped, so this shader owns its encoding. */
vec3 linearToSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(12.92 * c, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
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

  // Stir the sampling domain before any colour is read out of it.
  //
  // Translating the noise domains — which is all this used to do — slides the
  // whole field one way and reads as drift. Rotation is what reads as
  // stirring, so the domain is advected along a curl field instead. A curl
  // field alone is not enough though: leave it standing still and it warps the
  // canvas into a fixed set of swirls that the colour merely slides through.
  // Turning the advection direction is what actually stirs.
  //
  // So two counter-rotating advections, coarse and fine. Either one alone
  // would sweep every sample point around a circle and quietly repeat; at
  // different rates and opposite signs they beat against each other, so the
  // field keeps folding and never returns to a state it has held before. The
  // rates are global rather than per-pixel deliberately — uTime accumulates
  // for the life of the page, and a spatially varying rate would wind
  // neighbouring pixels arbitrarily far out of phase and tear the field apart
  // in a long session. The spatial variety comes from twist, an offset, which
  // stays bounded however long it runs.
  // The amplitudes are large because the curl of a smooth fbm is small — of
  // order half a unit — while the colour lobes below are only two or three
  // across the canvas. Displacing by a few hundredths of a UV does nothing
  // visible; it takes something near a fifth of the canvas to actually carry a
  // lobe somewhere, and that is where the folding and marbling come from.
  float twist = (fbm3(uv * 1.15 + vec2(t * 0.05, -t * 0.04)) - 0.5) * 3.0;
  vec2 eddyA = rot(twist + t * 0.60) *
    curl(uv * 1.7 + vec2(t * 0.09, -t * 0.06));
  vec2 eddyB = rot(twist * 0.6 - t * 0.36) *
    curl(uv * 3.2 + vec2(2.6 - t * 0.05, 7.4 + t * 0.04));
  vec2 sp = uv + eddyA * 0.30 + eddyB * 0.15;

  // Two rounds of warping: the first bends the field, the second smears those
  // bends into the soft lobes that read as pigment spreading through water.
  vec2 q = vec2(
    fbm(sp * 2.3 + vec2(0.0, t * 0.11)),
    fbm(sp * 2.3 + vec2(3.7, -t * 0.09))
  );
  vec2 r = vec2(
    fbm(sp * 3.0 + 2.1 * q + vec2(1.7 + t * 0.085, 9.2)),
    fbm(sp * 3.0 + 2.1 * q + vec2(8.3, 2.8 - t * 0.070))
  );
  float f = fbm(sp * 1.9 + 2.6 * r);

  /*
   * Progress is carried by chroma and coverage, never by value. Dropping
   * lightness is what turned the earlier version to olive and taupe: a dark,
   * low-chroma mix is mud by definition. Holding lightness roughly level and
   * driving chroma up instead reads as pigment being loaded onto the canvas,
   * which is the thing being communicated, and it stays vivid throughout.
   *
   * No backticks in this comment: the shader is a JS template literal, and one
   * here ends the string early.
   */
  float p = clamp(uProgress, 0.0, 1.0);
  float chroma = mix(0.055, 0.185, p);
  float lightness = mix(0.90, 0.80, p);
  float coverage = mix(0.42, 1.0, p);

  // Layering happens on the hue angle, so overlaps land on an intermediate hue
  // at full chroma rather than on the average of two RGB triples.
  float h = uHues.x;
  h = mixHue(h, uHues.y, smoothstep(0.32, 0.86, r.x));
  h = mixHue(h, uHues.z, smoothstep(0.36, 0.90, q.y));
  h = mixHue(h, uHues.w, smoothstep(0.42, 0.94, r.y * f * 1.7));

  // Where the field is strong the paint sits thicker: slightly more chroma and
  // slightly less light, which is how real pigment behaves in a loaded passage.
  float body = smoothstep(0.30, 0.78, f);
  float L = lightness - 0.055 * body;
  float C = chroma * (0.72 + 0.46 * body);

  vec3 paper = vec3(0.973, 0.968, 0.957);
  vec3 pigment = linearToSrgb(oklchToLinear(L, C, h));

  // Thin the wash back toward paper where the field is weak, so the canvas
  // still reads as a primed surface with paint on it, not a colored panel. The
  // bare ground is covered progressively, so the surface gains body over time.
  vec3 col = mix(paper, pigment, coverage * smoothstep(0.02, 0.56, f + 0.26));

  float sheen = sin((uv.x + uv.y) * 2.1 - t * 0.5) * 0.5 + 0.5;
  col += 0.030 * (1.0 - 0.5 * p) * smoothstep(0.0, 1.0, sheen);

  // The vignette back to paper relaxes as the canvas fills, so the colour
  // reaches the edges instead of stopping at a pale border.
  vec2 d = abs(uv - 0.5) * 2.0;
  float edge = 1.0 - smoothstep(0.80, 1.0, max(d.x, d.y));
  vec3 ground = mix(paper, col, mix(0.0, 0.82, p));
  col = mix(ground, col, 0.38 + 0.62 * edge);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
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
  return deltaSeconds * (reduceMotion ? 0.12 : 1);
}

/**
 * A measured remix call takes about 17.5s, so the curve is tuned to spend most
 * of its visible change inside that window.
 */
const SHIMMER_PROGRESS_TAU_MS = 11_000;

/**
 * Synthetic progress for a generation that started `elapsedMs` ago.
 *
 * Reve's remix endpoint is one blocking request with no streaming and no
 * progress reporting, so there is nothing real to read. An asymptotic curve is
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
